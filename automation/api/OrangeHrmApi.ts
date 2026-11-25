import { expect, type APIRequestContext, type APIResponse } from '@playwright/test';

const API = '/web/index.php/api/v2';

export type LeaveDuration = 'full_day' | 'half_day_morning' | 'half_day_afternoon';

/**
 * Thin wrapper around OrangeHRM's REST API (v2).
 * Uses the cookies of whoever owns the request context (Admin, or a logged-in employee),
 * so it can set up and check data much faster than clicking through the UI.
 */
export class OrangeHrmApi {
  constructor(private readonly request: APIRequestContext) {}

  private async ok(response: APIResponse, action: string) {
    expect(response.status(), `${action} failed: ${await response.text()}`).toBe(200);
    return (await response.json()).data;
  }

  // ---------- PIM / Admin ----------

  async createEmployee(firstName: string, lastName: string): Promise<number> {
    const data = await this.ok(
      await this.request.post(`${API}/pim/employees`, { data: { firstName, lastName } }),
      'Create employee',
    );
    return data.empNumber;
  }

  async createEssUser(empNumber: number, username: string, password: string, enabled = true) {
    await this.ok(
      await this.request.post(`${API}/admin/users`, {
        data: { username, password, status: enabled, userRoleId: 2, empNumber },
      }),
      'Create user',
    );
  }

  async assignSupervisor(empNumber: number, supervisorEmpNumber: number) {
    await this.ok(
      await this.request.post(`${API}/pim/employees/${empNumber}/supervisors`, {
        data: { empNumber: supervisorEmpNumber, reportingMethodId: 1 },
      }),
      'Assign supervisor',
    );
  }

  /** Deleting an employee also deletes their user account and leave records. */
  async deleteEmployees(empNumbers: number[]) {
    if (empNumbers.length === 0) return;
    await this.ok(
      await this.request.delete(`${API}/pim/employees`, { data: { ids: empNumbers } }),
      'Delete employees',
    );
  }

  // ---------- Leave ----------

  async leaveTypeId(name: string): Promise<number> {
    const types = await this.ok(await this.request.get(`${API}/leave/leave-types?limit=100`), 'List leave types');
    const type = types.find((t: { name: string }) => t.name === name);
    expect(type, `Leave type "${name}" not found. Create it first (see docs/test-data.md).`).toBeTruthy();
    return type.id;
  }

  async currentLeavePeriod(): Promise<{ startDate: string; endDate: string }> {
    const response = await this.request.get(`${API}/leave/leave-periods`);
    expect(response.status()).toBe(200);
    return (await response.json()).meta.currentLeavePeriod;
  }

  async holidays(fromDate: string, toDate: string): Promise<string[]> {
    const data = await this.ok(
      await this.request.get(`${API}/leave/holidays?fromDate=${fromDate}&toDate=${toDate}&limit=200`),
      'List holidays',
    );
    return data.map((h: { date: string }) => h.date);
  }

  async addEntitlement(empNumber: number, leaveTypeId: number, days: number) {
    const period = await this.currentLeavePeriod();
    await this.ok(
      await this.request.post(`${API}/leave/leave-entitlements`, {
        data: { empNumber, leaveTypeId, fromDate: period.startDate, toDate: period.endDate, entitlement: String(days) },
      }),
      'Add entitlement',
    );
  }

  /** Total entitlement for an employee and leave type in the current period. */
  async entitlementTotal(empNumber: number, leaveTypeId: number): Promise<number> {
    const period = await this.currentLeavePeriod();
    const response = await this.request.get(
      `${API}/leave/leave-entitlements?empNumber=${empNumber}&leaveTypeId=${leaveTypeId}&fromDate=${period.startDate}&toDate=${period.endDate}`,
    );
    expect(response.status()).toBe(200);
    return Number((await response.json()).meta?.sum ?? 0);
  }

  /** Must be called with the EMPLOYEE's request context (their own balance and requests). */
  async myBalance(leaveTypeId: number): Promise<number> {
    const data = await this.ok(
      await this.request.get(`${API}/leave/leave-balance/leave-type/${leaveTypeId}`),
      'Get my balance',
    );
    return data.balance.balance;
  }

  /** Must be called with the EMPLOYEE's request context. */
  async applyLeave(leaveTypeId: number, fromDate: string, toDate = fromDate, duration: LeaveDuration = 'full_day') {
    const body: Record<string, unknown> = { leaveTypeId, fromDate, toDate, comment: null };
    if (fromDate === toDate) body.duration = { type: duration };
    return this.ok(await this.request.post(`${API}/leave/leave-requests`, { data: body }), 'Apply leave');
  }

  /** Must be called with the EMPLOYEE's request context. */
  async myLeaveRequests(): Promise<Array<{ id: number; dates: { fromDate: string; toDate: string } }>> {
    const period = await this.currentLeavePeriod();
    return this.ok(
      await this.request.get(
        `${API}/leave/leave-requests?fromDate=${period.startDate}&toDate=${period.endDate}&limit=100`,
      ),
      'List my leave requests',
    );
  }
}
