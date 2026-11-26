import { test as setup, expect, type APIResponse } from '@playwright/test';
import { env } from '../utils/env';
import { httpLogin } from '../utils/httpLogin';

/**
 * Makes sure the shared data the suite relies on exists. Runs first (the "seed" project).
 * Idempotent: on an already-prepared install (like the local one) it changes nothing.
 * On a fresh install (CI) it creates: the leave period, two leave types, Ellie (ESS, no
 * subordinates) and a disabled user. Everything else each test creates for itself.
 */
const API = '/web/index.php/api/v2';
const LEAVE_TYPES = ['QA_AV Vacation', 'QA_AV Sick'];

setup('seed shared test data', async ({ baseURL }) => {
  setup.setTimeout(120_000);
  const admin = await httpLogin(baseURL, env('ADMIN_USERNAME'), env('ADMIN_PASSWORD'));
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ok = async (response: APIResponse, what: string): Promise<any> => {
    expect(response.status(), `${what}: ${await response.text()}`).toBe(200);
    return (await response.json()).data;
  };

  // Leave period: 1 January – 31 December
  const period = await (await admin.get(`${API}/leave/leave-period`)).json();
  if (!period.meta?.leavePeriodDefined) {
    await ok(await admin.put(`${API}/leave/leave-period`, { data: { startMonth: 1, startDay: 1 } }), 'Define leave period');
    console.log('seed: leave period defined');
  }

  // Leave types
  const types: { name: string }[] = await ok(await admin.get(`${API}/leave/leave-types?limit=100`), 'List leave types');
  for (const name of LEAVE_TYPES) {
    if (!types.some((t) => t.name === name)) {
      await ok(await admin.post(`${API}/leave/leave-types`, { data: { name, situational: false } }), `Create ${name}`);
      console.log(`seed: leave type "${name}" created`);
    }
  }

  // Users: Ellie (ESS) and a disabled user
  const users: { userName: string }[] = await ok(await admin.get(`${API}/admin/users?limit=200`), 'List users');
  const ensureUser = async (username: string, firstName: string, lastName: string, enabled: boolean) => {
    if (users.some((u) => u.userName === username)) return;
    const employee = await ok(await admin.post(`${API}/pim/employees`, { data: { firstName, lastName } }), `Create ${firstName}`);
    await ok(
      await admin.post(`${API}/admin/users`, {
        data: { username, password: env('TEST_USER_PASSWORD'), status: enabled, userRoleId: 2, empNumber: employee.empNumber },
      }),
      `Create user ${username}`,
    );
    console.log(`seed: user "${username}" created (${enabled ? 'enabled' : 'disabled'})`);
  };
  await ensureUser(env('EMP_USERNAME'), 'QA_AV Ellie', 'Employee', true);
  await ensureUser(env('DISABLED_USERNAME'), 'QA_AV Dan', 'Disabled', false);

  await admin.dispose();
});
