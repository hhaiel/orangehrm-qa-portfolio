import { test, expect, uniqueSuffix } from '../../fixtures';
import { env, STORAGE_STATE } from '../../utils/env';

/**
 * REST API tests for PIM and Admin (OrangeHRM API v2), run without a browser.
 * `request` uses the saved Admin session (test.use below) unless a test creates its own context.
 * Validation errors come back as 422 "Invalid Parameter" with the offending field names.
 */
const API = '/web/index.php/api/v2';

type ApiError = { error: { status: string | number; message: string; data?: { invalidParamKeys: string[] } } };

test.describe('API › PIM and Admin', () => {
  test.use({ storageState: STORAGE_STATE.admin });

  test('API-001 GET /pim/employees returns a paginated list with a total @api @smoke', async ({ request }) => {
    const response = await request.get(`${API}/pim/employees?limit=2&offset=0`);
    expect(response.status()).toBe(200);
    const body = await response.json();

    expect(body.data.length).toBeLessThanOrEqual(2);
    expect(body.meta.total).toBeGreaterThanOrEqual(body.data.length);
    for (const employee of body.data) {
      expect(employee).toEqual(
        expect.objectContaining({ empNumber: expect.any(Number), firstName: expect.any(String), lastName: expect.any(String) }),
      );
    }
  });

  test('API-002 POST /pim/employees rejects invalid input with 422 and names the field @api', async ({ request }) => {
    const cases = [
      { label: 'missing last name', data: { firstName: 'QA_PW NoLast' }, field: 'lastName' },
      { label: 'first name over 30 characters', data: { firstName: 'A'.repeat(31), lastName: 'X' }, field: 'firstName' },
      { label: 'duplicate Employee Id', data: { firstName: 'QA_PW Dup', lastName: 'X', employeeId: '0001' }, field: 'employeeId' },
    ];
    for (const { label, data, field } of cases) {
      const response = await request.post(`${API}/pim/employees`, { data });
      expect(response.status(), label).toBe(422);
      const body: ApiError = await response.json();
      expect(body.error.message, label).toBe('Invalid Parameter');
      expect(body.error.data?.invalidParamKeys, label).toContain(field);
    }
  });

  test('API-003 employee lifecycle: create, read, delete; deleting also removes the user @api', async ({
    request,
    adminApi,
    trackEmployee,
  }) => {
    const lastName = uniqueSuffix();
    const created = await request.post(`${API}/pim/employees`, { data: { firstName: 'QA_PW Api', lastName } });
    expect(created.status()).toBe(200);
    const empNumber: number = (await created.json()).data.empNumber;
    trackEmployee(empNumber); // safety net if an assertion below fails

    const read = await request.get(`${API}/pim/employees/${empNumber}/personal-details`);
    expect(read.status()).toBe(200);
    expect((await read.json()).data).toEqual(expect.objectContaining({ empNumber, firstName: 'QA_PW Api', lastName }));

    const username = `qa_pw_${uniqueSuffix()}`;
    await adminApi.createEssUser(empNumber, username, env('TEST_USER_PASSWORD'));
    expect(await adminApi.findUser(username)).toBeTruthy();

    const deleted = await request.delete(`${API}/pim/employees`, { data: { ids: [empNumber] } });
    expect(deleted.status()).toBe(200);
    expect((await deleted.json()).data).toEqual([empNumber]);

    // A deleted (or unknown) employee returns 422, not the more usual 404 (observation, not a defect).
    expect((await request.get(`${API}/pim/employees/${empNumber}/personal-details`)).status()).toBe(422);
    expect(await adminApi.findUser(username)).toBeUndefined();
  });

  test('API-004 POST /admin/users enforces the password policy and creates ESS users @api', async ({
    request,
    createPerson,
  }) => {
    const person = await createPerson('ApiUser');
    const base = { status: true, userRoleId: 2, empNumber: person.empNumber };

    const weak = await request.post(`${API}/admin/users`, { data: { ...base, username: `qa_pw_${uniqueSuffix()}`, password: 'abc' } });
    expect(weak.status()).toBe(422);
    expect(((await weak.json()) as ApiError).error.data?.invalidParamKeys).toContain('password');

    const duplicate = await request.post(`${API}/admin/users`, {
      data: { ...base, username: env('EMP_USERNAME'), password: env('TEST_USER_PASSWORD') },
    });
    expect(duplicate.status()).toBe(422);
    expect(((await duplicate.json()) as ApiError).error.data?.invalidParamKeys).toContain('username');

    const username = `qa_pw_${uniqueSuffix()}`;
    const ok = await request.post(`${API}/admin/users`, { data: { ...base, username, password: env('TEST_USER_PASSWORD') } });
    expect(ok.status()).toBe(200);
    expect((await ok.json()).data).toEqual(
      expect.objectContaining({ userName: username, status: true, userRole: expect.objectContaining({ name: 'ESS' }) }),
    );
  });
});

test.describe('API › Access control', () => {
  test('API-005 no session gets 401; an ESS session gets 403 on Admin endpoints and no other employee data @api @smoke', async ({
    playwright,
    baseURL,
    createPerson,
  }) => {
    const other = await createPerson('ApiOther');

    const anonymous = await playwright.request.newContext({ baseURL });
    const noSession = await anonymous.get(`${API}/pim/employees`);
    expect(noSession.status()).toBe(401);
    await anonymous.dispose();

    const ess = await playwright.request.newContext({ baseURL, storageState: STORAGE_STATE.employee });
    expect((await ess.get(`${API}/admin/users`)).status()).toBe(403);
    expect((await ess.delete(`${API}/pim/employees`, { data: { ids: [other.empNumber] } })).status()).toBe(403);

    const otherDetails = await ess.get(`${API}/pim/employees/${other.empNumber}/personal-details`);
    expect(otherDetails.status()).toBe(422);
    expect(await otherDetails.text()).not.toContain(other.lastName);
    await ess.dispose();
  });
});
