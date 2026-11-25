import { test as base, request, type Browser, type BrowserContext, type Page } from '@playwright/test';
import { OrangeHrmApi } from '../api/OrangeHrmApi';
import { LoginPage } from '../pages/LoginPage';
import { env, STORAGE_STATE } from '../utils/env';

export type TestPerson = {
  empNumber: number;
  firstName: string;
  lastName: string;
  fullName: string;
  username?: string;
  password?: string;
};

export type LoggedInUser = { context: BrowserContext; page: Page; api: OrangeHrmApi };

type PersonOptions = { withLogin?: boolean; entitlementDays?: number; supervisor?: TestPerson };

type Fixtures = {
  /** API client logged in as Admin (for setup, checks and cleanup). */
  adminApi: OrangeHrmApi;
  /** Creates uniquely named employees for this test and deletes them afterwards. */
  createPerson: (role: string, options?: PersonOptions) => Promise<TestPerson>;
  /** Opens a separate browser session logged in as the given person (UI login). */
  loginAs: (person: TestPerson) => Promise<LoggedInUser>;
};

const LEAVE_TYPE = 'QA_AV Vacation';

function uniqueSuffix(): string {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

export const test = base.extend<Fixtures>({
  adminApi: async ({ baseURL }, use) => {
    const context = await request.newContext({ baseURL, storageState: STORAGE_STATE.admin });
    await use(new OrangeHrmApi(context));
    await context.dispose();
  },

  createPerson: async ({ adminApi }, use) => {
    const created: number[] = [];

    await use(async (role, options = {}) => {
      const suffix = uniqueSuffix();
      const firstName = `QA_PW ${role}`;
      const lastName = suffix;
      const empNumber = await adminApi.createEmployee(firstName, lastName);
      created.push(empNumber);

      const person: TestPerson = { empNumber, firstName, lastName, fullName: `${firstName} ${lastName}` };

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

    // Cleanup runs even if the test failed. Deleting employees also removes their users and leave.
    await adminApi.deleteEmployees(created);
  },

  loginAs: async ({ browser, baseURL }, use) => {
    const contexts: BrowserContext[] = [];

    await use(async (person) => {
      if (!person.username || !person.password) throw new Error(`${person.fullName} has no login (use withLogin: true).`);
      const context = await (browser as Browser).newContext({ baseURL });
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
