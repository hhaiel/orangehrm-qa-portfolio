import { test, expect, LEAVE_TYPE } from '../../fixtures';
import { addDays, twoConsecutiveWorkingDays, upcomingWeekday, upcomingWorkingDay } from '../../utils/dates';
import { STORAGE_STATE } from '../../utils/env';

/**
 * REST API tests for Leave. The employee logs in over HTTP (apiLoginAs), so no browser is used.
 * Business-rule errors come back as 400 with the same message the UI shows.
 */
const API = '/web/index.php/api/v2';

test.describe('API › Leave', () => {
  test.use({ storageState: STORAGE_STATE.admin });

  test('API-006 POST /leave/leave-entitlements validates the value @api', async ({ request, adminApi, createPerson }) => {
    const person = await createPerson('ApiEntitlement');
    const typeId = await adminApi.leaveTypeId(LEAVE_TYPE);
    const period = await adminApi.currentLeavePeriod();
    const post = (entitlement: string) =>
      request.post(`${API}/leave/leave-entitlements`, {
        data: { empNumber: person.empNumber, leaveTypeId: typeId, fromDate: period.startDate, toDate: period.endDate, entitlement },
      });

    const negative = await post('-1');
    expect(negative.status()).toBe(422);
    expect((await negative.json()).error.data.invalidParamKeys).toContain('entitlement');

    const max = await post('9999.99');
    expect(max.status()).toBe(200);
    expect((await max.json()).data.entitlement).toBe(9999.99);
  });

  test('API-006b an entitlement of 10000 or more is rejected with 422, not a server error @api', async ({
    request,
    adminApi,
    createPerson,
  }) => {
    test.info().annotations.push({ type: 'issue', description: 'DEF-008: returns 500 "Unexpected Error Occurred"' });
    test.fail(true, 'Known defect DEF-008. When this starts passing, the defect is fixed: remove test.fail().');

    const person = await createPerson('ApiEntitlementMax');
    const typeId = await adminApi.leaveTypeId(LEAVE_TYPE);
    const period = await adminApi.currentLeavePeriod();
    const response = await request.post(`${API}/leave/leave-entitlements`, {
      data: { empNumber: person.empNumber, leaveTypeId: typeId, fromDate: period.startDate, toDate: period.endDate, entitlement: '10000' },
    });
    expect(response.status()).toBe(422);
  });

  test('API-007 leave request rules: balance, overlap, no working days, date order, and balance update @api @smoke', async ({
    adminApi,
    createPerson,
    apiLoginAs,
  }) => {
    const typeId = await adminApi.leaveTypeId(LEAVE_TYPE);
    const period = await adminApi.currentLeavePeriod();
    const holidays = await adminApi.holidays(period.startDate, period.endDate);
    const [day, nextDay] = twoConsecutiveWorkingDays(upcomingWorkingDay(7, holidays, period.endDate), holidays, period.endDate);
    const saturday = upcomingWeekday(6, 7, period.endDate);

    const person = await createPerson('ApiLeave', { withLogin: true, entitlementDays: 1 });
    const employee = await apiLoginAs(person);
    const apply = (fromDate: string, toDate: string) =>
      employee.raw.post(`${API}/leave/leave-requests`, {
        data: { leaveTypeId: typeId, fromDate, toDate, comment: null, ...(fromDate === toDate ? { duration: { type: 'full_day' } } : {}) },
      });

    const overBalance = await apply(day, nextDay); // 2 days on a 1-day balance
    expect(overBalance.status()).toBe(400);
    expect((await overBalance.json()).error.message).toBe('Leave Balance Exceeded');

    const ok = await apply(day, day);
    expect(ok.status()).toBe(200);
    expect((await ok.json()).data.id).toEqual(expect.any(Number));
    expect(await employee.myBalance(typeId)).toBe(0);

    const overlap = await apply(day, day);
    expect(overlap.status()).toBe(400);
    expect((await overlap.json()).error.message).toBe('Overlapping Leave Request Found');

    const weekend = await apply(saturday, addDays(saturday, 1));
    expect(weekend.status()).toBe(400);
    expect((await weekend.json()).error.message).toBe('Failed to Submit: No Working Days Selected');

    const backwards = await apply(nextDay, day);
    expect(backwards.status()).toBe(422);
    expect((await backwards.json()).error.data.invalidParamKeys).toContain('fromDate');
  });

  test('API-008 approve, reject and cancel move requests to the right status and restore the balance @api', async ({
    adminApi,
    createPerson,
    apiLoginAs,
  }) => {
    const typeId = await adminApi.leaveTypeId(LEAVE_TYPE);
    const period = await adminApi.currentLeavePeriod();
    const holidays = await adminApi.holidays(period.startDate, period.endDate);
    const first = upcomingWorkingDay(7, holidays, period.endDate);
    const [second, third] = twoConsecutiveWorkingDays(addDays(first, 1), holidays, period.endDate);

    const person = await createPerson('ApiActions', { withLogin: true, entitlementDays: 5 });
    const employee = await apiLoginAs(person);
    const toApprove = await employee.applyLeave(typeId, first);
    const toReject = await employee.applyLeave(typeId, second);
    const toCancel = await employee.applyLeave(typeId, third);
    expect(await employee.myBalance(typeId)).toBe(2);

    await adminApi.actOnRequest(toApprove.id, 'APPROVE');
    await adminApi.actOnRequest(toReject.id, 'REJECT');
    await employee.cancelMyRequest(toCancel.id);

    const response = await employee.raw.get(
      `${API}/leave/leave-requests?fromDate=${period.startDate}&toDate=${period.endDate}&limit=50`,
    );
    const statusByDate = Object.fromEntries(
      (await response.json()).data.map((r: { dates: { fromDate: string }; leaveBreakdown: { name: string }[] }) => [
        r.dates.fromDate,
        r.leaveBreakdown.map((b) => b.name).join('/'),
      ]),
    );
    expect(statusByDate).toEqual({ [first]: 'Scheduled', [second]: 'Rejected', [third]: 'Cancelled' });
    expect(await employee.myBalance(typeId)).toBe(4); // only the approved day is still used
  });
});
