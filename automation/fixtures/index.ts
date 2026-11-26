import { expect, test as base, request, type APIRequestContext, type Browser, type BrowserContext, type Page } from '@playwright/test';
import { OrangeHrmApi } from '../api/OrangeHrmApi';
import { LoginPage } from '../pages/LoginPage';
import { env, STORAGE_STATE } from '../utils/env';

export type TestPerson = {
  empNumber: number;
  employeeId?: string;
  firstName: string;
  lastName: string;
  fullName: string;
  username?: string;
  password?: string;
};

export type LoggedInUser = { context: BrowserContext; page: Page; api: OrangeHrmApi };

type PersonOptions = { withLogin?: boolean; entitlementDays?: number; supervisor?: TestPerson; employeeId?: boolean };

type Fixtures = {
  /** API client logged in as Admin (for setup, checks and cleanup). */
  adminApi: OrangeHrmApi;
  /** Creates uniquely named employees for this test and deletes them afterwards. */
  createPerson: (role: string, options?: PersonOptions) => Promise<TestPerson>;
  /** Registers an employee created through the UI, so it is deleted after the test. */
  trackEmployee: (empNumber: number) => void;
  /** Opens a separate browser session logged in as the given person (UI login). */
  loginAs: (person: TestPerson) => Promise<LoggedInUser>;
  /** Creates a full-day holiday for this test and deletes it afterwards. */
  createHoliday: (date: string) => Promise<void>;
  /** Logs a person in over HTTP only (no browser) and returns an API client with their session. */
  apiLoginAs: (person: TestPerson) => Promise<OrangeHrmApi & { raw: APIRequestContext }>;
};

const LEAVE_TYPE = 'QA_AV Vacation';

export function uniqueSuffix(): string {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

export const test = base.extend<Fixtures>({
  adminApi: async ({ baseURL }, use) => {
    const context = await request.newContext({ baseURL, storageState: STORAGE_STATE.admin });
    await use(new OrangeHrmApi(context));
    await context.dispose();
  },

  trackEmployee: async ({ adminApi }, use) => {
    const tracked: number[] = [];
    await use((empNumber) => {
      tracked.push(empNumber);
    });
    // Cleanup runs even if the test failed. Deleting employees also removes their users and leave.
    // Employees a test already deleted itself are skipped.
    await adminApi.deleteEmployees(tracked);
  },

  createPerson: async ({ adminApi, trackEmployee }, use) => {

    await use(async (role, options = {}) => {
      const suffix = uniqueSuffix();
      const firstName = `QA_PW ${role}`;
      const lastName = suffix;
      const employeeId = options.employeeId ? `PW${suffix.slice(-8)}` : undefined;
      const empNumber = await adminApi.createEmployee(firstName, lastName, employeeId);
      trackEmployee(empNumber);

      const person: TestPerson = { empNumber, firstName, lastName, fullName: `${firstName} ${lastName}`, employeeId };

      if (options.withLogin) {
        person.username = `qa_pw_${suffix}`;
        person.password = env('TEST_USER_PASSWORD');
        await adminApi.createEssUser(empNumber, person.username, person.password);
      }
      if (options.entitlementDays) {
        await adminApi.addEntitlement(empNumber, await adminApi.leaveTypeId(LEAVE_TYPE), options.entitlementDays);
      }
      if (options.supervisor) {
        await adminApi.assignSupervisor(empNumber, options.supervisor.empNumber);
      }
      return person;
    });
    // No cleanup here: every person is registered with trackEmployee, which deletes them.
  },

  createHoliday: async ({ adminApi }, use) => {
    const created: number[] = [];
    await use(async (date) => {
      created.push(await adminApi.createHoliday(`QA_PW Holiday ${uniqueSuffix()}`, date));
    });
    // Holidays are global, so always remove them, even if the test failed.
    await adminApi.deleteHolidays(created);
  },

  apiLoginAs: async ({ baseURL }, use) => {
    const contexts: APIRequestContext[] = [];
    await use(async (person) => {
      if (!person.username || !person.password) throw new Error(`${person.fullName} has no login (use withLogin: true).`);
      // Empty session on purpose: otherwise the test's storageState (e.g. Admin) may be reused,
      // and the login page would redirect to the Dashboard without a token.
      const context = await request.newContext({ baseURL, storageState: { cookies: [], origins: [] } });
      contexts.push(context);
      // The login form carries a CSRF token in the page HTML; post it back with the credentials.
      const html = await (await context.get('/web/index.php/auth/login')).text();
      const token = html.match(/:token="&quot;([^&]+)&quot;"/)?.[1];
      expect(token, 'CSRF token on the login page').toBeTruthy();
      const response = await context.post('/web/index.php/auth/validate', {
        form: { _token: token!, username: person.username, password: person.password },
        maxRedirects: 0,
      });
      expect(response.headers()['location'] ?? '', 'login should redirect to the dashboard').toContain('dashboard');
      return Object.assign(new OrangeHrmApi(context), { raw: context });
    });
    for (const context of contexts) await context.dispose();
  },

  loginAs: async ({ browser, baseURL }, use) => {
    const contexts: BrowserContext[] = [];

    await use(async (person) => {
      if (!person.username || !person.password) throw new Error(`${person.fullName} has no login (use withLogin: true).`);
      // Start logged out: Playwright otherwise copies the test's storageState (e.g. Admin)
      // into new contexts, and the login page would redirect straight to the Dashboard.
      const context = await (browser as Browser).newContext({ baseURL, storageState: { cookies: [], origins: [] } });
      contexts.push(context);
      const page = await context.newPage();
      const login = new LoginPage(page);
      await login.goto();
      await login.login(person.username, person.password);
      await login.expectLoggedIn();
      return { context, page, api: new OrangeHrmApi(context.request) };
    });

    for (const context of contexts) await context.close();
  },
});

export { expect } from '@playwright/test';
export { LEAVE_TYPE };
