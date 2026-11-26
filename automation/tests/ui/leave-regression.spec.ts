import { test, expect, LEAVE_TYPE } from '../../fixtures';
import type { OrangeHrmApi } from '../../api/OrangeHrmApi';
import { AddEntitlementPage } from '../../pages/leave/EntitlementPages';
import { ApplyLeavePage } from '../../pages/leave/ApplyLeavePage';
import { LeaveListPage, MyLeavePage } from '../../pages/leave/LeaveRequestsPages';
import {
  addDays,
  countWorkingDays,
  previousWorkingDay,
  twoConsecutiveWorkingDays,
  upcomingWeekday,
  upcomingWorkingDay,
} from '../../utils/dates';
import { STORAGE_STATE } from '../../utils/env';

/**
 * Leave regression tests (the non-smoke cases in test-cases/TC-LV.md).
 * Same approach as leave.spec.ts: every test creates its own people (and holidays) via the API
 * and the fixtures delete them afterwards. Known product defects are marked with test.fail().
 */

// Multi-user flows with slow saves (4–6 s each on the local server); see leave.spec.ts.
test.describe.configure({ timeout: 120_000 });

const SICK = 'QA_AV Sick';

async function leaveCalendar(api: OrangeHrmApi) {
  const period = await api.currentLeavePeriod();
  const holidays = await api.holidays(period.startDate, period.endDate);
  return { period, holidays };
}

// ---------------------------------------------------------------- US-LV-0001 Entitlements (Admin)

test.describe('Leave › Entitlements (Admin)', () => {
  test.use({ storageState: STORAGE_STATE.admin });

  test('US-LV-0001-TC-001 Add Entitlement form shows all fields and enforces required fields @regression', async ({
    page,
  }) => {
    const addPage = new AddEntitlementPage(page);
    await addPage.goto();

    expect(await addPage.fieldLabels()).toEqual(
      // The required "*" is drawn separately, so it isn't part of the label text.
      ['Add to', 'Individual Employee', 'Multiple Employees', 'Employee Name', 'Leave Type', 'Leave Period', 'Entitlement'],
    );
    await expect(addPage.form.selected('Leave Period')).toHaveText(/\d{4}-01-01 - \d{4}-12-31/);

    await addPage.save();
    for (const field of ['Employee Name', 'Leave Type', 'Entitlement']) {
      await expect(addPage.form.errorFor(field)).toHaveText('Required');
    }
    await expect(page).toHaveURL(/addLeaveEntitlement/);
  });

  const invalidValues = [
    { value: 'abc', message: 'Should be a number with upto 2 decimal places' },
    { value: '2.555', message: 'Should be a number with upto 2 decimal places' },
    { value: ' 5 ', message: 'Should be a number with upto 2 decimal places' },
    { value: '10000', message: 'Should be less than 10000' },
  ];

  test('US-LV-0001-TC-002 Entitlement accepts only positive numbers below 10000 with up to 2 decimals @regression', async ({
    page,
  }) => {
    const addPage = new AddEntitlementPage(page);
    await addPage.goto();

    for (const { value, message } of invalidValues) {
      await addPage.typeEntitlement(value);
      await expect(addPage.form.errorFor('Entitlement'), `value "${value}"`).toHaveText(message);
    }
    for (const value of ['2.5', '9999.99']) {
      await addPage.typeEntitlement(value);
      await expect(addPage.form.errorFor('Entitlement'), `value "${value}"`).toHaveCount(0);
    }
  });

  test('US-LV-0001-TC-002 negative Entitlement says the value must be positive @regression', async ({ page }) => {
    test.info().annotations.push({ type: 'issue', description: 'DEF-001: -1 shows "Should be a number with upto 2 decimal places"' });
    test.fail(true, 'Known defect DEF-001. When this starts passing, the defect is fixed: remove test.fail().');

    const addPage = new AddEntitlementPage(page);
    await addPage.goto();
    await addPage.typeEntitlement('-1');
    await expect(addPage.form.errorFor('Entitlement')).toHaveText(/positive/i, { timeout: 5_000 });
  });
});

// ---------------------------------------------------------------- US-LV-0002 Apply

test.describe('Leave › Apply', () => {
  test('US-LV-0002-TC-002 half-day options, and a half day counts as 0.50 @regression', async ({
    adminApi,
    createPerson,
    loginAs,
  }) => {
    const employee = await createPerson('Employee', { withLogin: true, entitlementDays: 5 });
    const { period, holidays } = await leaveCalendar(adminApi);
    const day = upcomingWorkingDay(7, holidays, period.endDate);
    const { page } = await loginAs(employee);
    const applyPage = new ApplyLeavePage(page);

    await applyPage.goto();
    await applyPage.selectLeaveType(LEAVE_TYPE);
    await applyPage.setDates(day);
    expect(await applyPage.durationOptions()).toEqual(['Full Day', 'Half Day - Morning', 'Half Day - Afternoon', 'Specify Time']);
    await applyPage.setDuration('Half Day - Morning');
    await applyPage.apply();
    await expect(applyPage.toast()).toContainText('Successfully Saved');

    const myLeave = new MyLeavePage(page);
    await myLeave.goto();
    const card = myLeave.request(`${day} (09:00 - 13:00) Half Day`);
    await expect(card).toContainText('Pending Approval (0.50)');
  });

  test('US-LV-0002-TC-003 weekends and holidays are not counted, and partial days change the total @regression', async ({
    adminApi,
    createPerson,
    createHoliday,
    loginAs,
  }) => {
    const { period } = await leaveCalendar(adminApi);
    // Range 1: Friday → Tuesday, with a holiday created on the Monday in between
    const friday = upcomingWeekday(5, 7, period.endDate);
    const tuesday = addDays(friday, 4);
    await createHoliday(addDays(friday, 3));
    const { holidays } = await leaveCalendar(adminApi);
    const expectedRange1 = countWorkingDays(friday, tuesday, holidays); // weekend + holiday excluded

    // Range 2: two consecutive working days later on, half day on the start day → 1.50
    const [start2, end2] = twoConsecutiveWorkingDays(addDays(tuesday, 1), holidays, period.endDate);

    const employee = await createPerson('Employee', { withLogin: true, entitlementDays: 5 });
    const { page } = await loginAs(employee);
    const applyPage = new ApplyLeavePage(page);

    await applyPage.applyFor(LEAVE_TYPE, friday, tuesday);
    await expect(applyPage.toast()).toContainText('Successfully Saved');

    await applyPage.goto();
    await applyPage.selectLeaveType(LEAVE_TYPE);
    await applyPage.setDates(start2, end2);
    expect(await applyPage.partialDaysOptions()).toEqual(['All Days', 'Start Day Only', 'End Day Only', 'Start and End Day']);
    await applyPage.setPartialDays('Start Day Only', 'Half Day - Morning');
    await applyPage.apply();
    await expect(applyPage.toast()).toContainText('Successfully Saved');

    const myLeave = new MyLeavePage(page);
    await myLeave.goto();
    await expect(myLeave.request(`${friday} to ${tuesday}`)).toContainText(`Pending Approval (${expectedRange1.toFixed(2)})`);
    await expect(myLeave.request(`${start2} to ${end2}`)).toContainText('Pending Approval (1.50)');
  });

  test('US-LV-0002-TC-004 To Date cannot be before From Date, and past dates are allowed @regression', async ({
    adminApi,
    createPerson,
    loginAs,
  }) => {
    const { period, holidays } = await leaveCalendar(adminApi);
    const future = upcomingWorkingDay(7, holidays, period.endDate);
    const past = previousWorkingDay(holidays, period.startDate);
    const employee = await createPerson('Employee', { withLogin: true, entitlementDays: 5 });
    const { page } = await loginAs(employee);
    const applyPage = new ApplyLeavePage(page);

    await applyPage.goto();
    await applyPage.selectLeaveType(LEAVE_TYPE);
    await applyPage.setDates(future, addDays(future, -2));
    await expect(applyPage.form.errorFor('To Date')).toHaveText('To date should be after from date');

    await applyPage.applyFor(LEAVE_TYPE, past);
    await expect(applyPage.toast()).toContainText('Successfully Saved');
    const myLeave = new MyLeavePage(page);
    await myLeave.goto();
    await expect(myLeave.request(past)).toContainText('Pending Approval (1.00)');
  });
});

// ---------------------------------------------------------------- US-LV-0003 Approve / reject / cancel

test.describe('Leave › Leave List and actions', () => {
  test('US-LV-0003-TC-001 supervisor sees only subordinates\' requests, and the status filter works @regression', async ({
    adminApi,
    createPerson,
    loginAs,
  }) => {
    const { period, holidays } = await leaveCalendar(adminApi);
    const day = upcomingWorkingDay(7, holidays, period.endDate);
    const typeId = await adminApi.leaveTypeId(LEAVE_TYPE);

    const supervisor = await createPerson('Supervisor', { withLogin: true });
    const subordinate = await createPerson('Employee', { withLogin: true, entitlementDays: 5, supervisor });
    const other = await createPerson('Other', { withLogin: true, entitlementDays: 5 });
    await (await loginAs(subordinate)).api.applyLeave(typeId, day);
    await (await loginAs(other)).api.applyLeave(typeId, day);

    const { page } = await loginAs(supervisor);
    const leaveList = new LeaveListPage(page);
    await leaveList.goto();
    await expect(leaveList.request(day, subordinate.fullName)).toBeVisible();
    await expect(leaveList.request(day, other.fullName)).toBeHidden();

    await leaveList.filterByStatus(['Rejected']);
    await expect(leaveList.request(day, subordinate.fullName)).toBeHidden();

    await leaveList.resetFilters();
    await expect(leaveList.statusChips()).toHaveText(['Pending Approval']);
    await expect(leaveList.request(day, subordinate.fullName)).toBeVisible();
  });

  test('US-LV-0003-TC-003 supervisor rejects a request and the days return to the balance @regression', async ({
    adminApi,
    createPerson,
    loginAs,
  }) => {
    const { period, holidays } = await leaveCalendar(adminApi);
    const day = upcomingWorkingDay(7, holidays, period.endDate);
    const typeId = await adminApi.leaveTypeId(LEAVE_TYPE);

    const supervisor = await createPerson('Supervisor', { withLogin: true });
    const employee = await createPerson('Employee', { withLogin: true, entitlementDays: 5, supervisor });
    const employeeSession = await loginAs(employee);
    await employeeSession.api.applyLeave(typeId, day);
    expect(await employeeSession.api.myBalance(typeId)).toBe(4);

    const { page } = await loginAs(supervisor);
    const leaveList = new LeaveListPage(page);
    await leaveList.goto();
    await leaveList.reject(day, employee.fullName);
    await expect(leaveList.toast()).toContainText('Successfully Updated');

    const myLeave = new MyLeavePage(employeeSession.page);
    await myLeave.goto();
    await expect(myLeave.request(day)).toContainText('Rejected (1.00)');
    expect(await employeeSession.api.myBalance(typeId)).toBe(5);
  });

  test('US-LV-0003-TC-004 employee cancels own Pending and Scheduled requests and gets the days back @regression', async ({
    adminApi,
    createPerson,
    loginAs,
  }) => {
    const { period, holidays } = await leaveCalendar(adminApi);
    const [pendingDay, scheduledDay] = twoConsecutiveWorkingDays(
      upcomingWorkingDay(7, holidays, period.endDate), holidays, period.endDate,
    );
    const typeId = await adminApi.leaveTypeId(LEAVE_TYPE);

    const employee = await createPerson('Employee', { withLogin: true, entitlementDays: 5 });
    const { page, api } = await loginAs(employee);
    await api.applyLeave(typeId, pendingDay);
    const scheduled = await api.applyLeave(typeId, scheduledDay);
    await adminApi.actOnRequest(scheduled.id, 'APPROVE');
    expect(await api.myBalance(typeId)).toBe(3);

    const myLeave = new MyLeavePage(page);
    await myLeave.goto();
    await expect(myLeave.request(scheduledDay)).toContainText('Scheduled (1.00)');

    await myLeave.cancel(pendingDay, 'Pending Approval');
    await expect(myLeave.toast()).toContainText('Successfully Updated');
    await expect(myLeave.request(pendingDay)).toContainText('Cancelled (1.00)');

    await myLeave.cancel(scheduledDay, 'Scheduled');
    await expect(myLeave.toast()).toContainText('Successfully Updated');
    await expect(myLeave.request(scheduledDay)).toContainText('Cancelled (1.00)');

    expect(await api.myBalance(typeId)).toBe(5);
  });

  test.describe('as Admin', () => {
    test.use({ storageState: STORAGE_STATE.admin });

    test('US-LV-0003-TC-005 Admin approves a request from an employee who isn\'t their subordinate @regression', async ({
      page,
      adminApi,
      createPerson,
      loginAs,
    }) => {
      const { period, holidays } = await leaveCalendar(adminApi);
      const day = upcomingWorkingDay(7, holidays, period.endDate);
      const typeId = await adminApi.leaveTypeId(LEAVE_TYPE);
      const employee = await createPerson('NoSupervisor', { withLogin: true, entitlementDays: 5 });
      const employeeSession = await loginAs(employee);
      await employeeSession.api.applyLeave(typeId, day);

      const leaveList = new LeaveListPage(page);
      await leaveList.goto();
      await expect(leaveList.request(day, employee.fullName)).toBeVisible();
      await leaveList.approve(day, employee.fullName);
      await expect(leaveList.toast()).toContainText('Successfully Updated');

      const myLeave = new MyLeavePage(employeeSession.page);
      await myLeave.goto();
      await expect(myLeave.request(day)).toContainText('Scheduled (1.00)');
    });
  });
});

// ---------------------------------------------------------------- US-LV-0004 Validation

test.describe('Leave › Validation', () => {
  test('US-LV-0004-TC-002 overlapping requests are blocked, but Cancelled and Rejected ones don\'t count @regression', async ({
    adminApi,
    createPerson,
    loginAs,
  }) => {
    const { period, holidays } = await leaveCalendar(adminApi);
    const [overlapDay, rejectedDay] = twoConsecutiveWorkingDays(
      upcomingWorkingDay(7, holidays, period.endDate), holidays, period.endDate,
    );
    const typeId = await adminApi.leaveTypeId(LEAVE_TYPE);

    const employee = await createPerson('Employee', { withLogin: true, entitlementDays: 5 });
    const { page, api } = await loginAs(employee);
    await api.applyLeave(typeId, overlapDay);
    const rejected = await api.applyLeave(typeId, rejectedDay);
    await adminApi.actOnRequest(rejected.id, 'REJECT');

    const applyPage = new ApplyLeavePage(page);
    await applyPage.applyFor(LEAVE_TYPE, overlapDay);
    await expect(applyPage.toast()).toContainText('Failed to Submit');
    await expect(applyPage.overlapNotice).toBeVisible();
    await expect(page.getByRole('row').filter({ hasText: overlapDay })).toContainText('Pending Approval');

    const myLeave = new MyLeavePage(page);
    await myLeave.goto();
    await myLeave.cancel(overlapDay, 'Pending Approval');
    await expect(myLeave.toast()).toContainText('Successfully Updated');

    await applyPage.applyFor(LEAVE_TYPE, overlapDay);
    await expect(applyPage.toast()).toContainText('Successfully Saved');
    await applyPage.applyFor(LEAVE_TYPE, rejectedDay);
    await expect(applyPage.toast()).toContainText('Successfully Saved');
  });

  test('US-LV-0004-TC-003 types without entitlement aren\'t offered, and ranges with no working days are blocked @regression', async ({
    adminApi,
    createPerson,
    createHoliday,
    loginAs,
  }) => {
    const { period, holidays } = await leaveCalendar(adminApi);
    const saturday = upcomingWeekday(6, 7, period.endDate);
    const holiday = upcomingWorkingDay(10, holidays, period.endDate);
    await createHoliday(holiday);

    const employee = await createPerson('Employee', { withLogin: true, entitlementDays: 5 }); // Vacation only
    const { page, api } = await loginAs(employee);
    const applyPage = new ApplyLeavePage(page);

    await applyPage.goto();
    const types = await applyPage.leaveTypeOptions();
    expect(types).toContain(LEAVE_TYPE);
    expect(types).not.toContain(SICK);

    await applyPage.applyFor(LEAVE_TYPE, saturday, addDays(saturday, 1));
    await expect(applyPage.toast()).toContainText('Failed to Submit: No Working Days Selected');

    await applyPage.applyFor(LEAVE_TYPE, holiday);
    await expect(applyPage.toast()).toContainText('Failed to Submit: No Working Days Selected');
    expect(await api.myLeaveRequests()).toHaveLength(0);
  });

  test('US-LV-0004-TC-004 a morning and an afternoon half day on the same date are both allowed @regression', async ({
    adminApi,
    createPerson,
    loginAs,
  }) => {
    const { period, holidays } = await leaveCalendar(adminApi);
    const day = upcomingWorkingDay(7, holidays, period.endDate);
    const employee = await createPerson('Employee', { withLogin: true, entitlementDays: 5 });
    const { page } = await loginAs(employee);
    const applyPage = new ApplyLeavePage(page);

    await applyPage.applyFor(LEAVE_TYPE, day, undefined, 'Half Day - Morning');
    await expect(applyPage.toast()).toContainText('Successfully Saved');
    await applyPage.applyFor(LEAVE_TYPE, day, undefined, 'Half Day - Afternoon');
    await expect(applyPage.toast()).toContainText('Successfully Saved');
    await expect(applyPage.overlapNotice).toBeHidden();

    const myLeave = new MyLeavePage(page);
    await myLeave.goto();
    await expect(myLeave.request(`${day} (09:00 - 13:00) Half Day`)).toContainText('Pending Approval (0.50)');
    await expect(myLeave.request(`${day} (13:00 - 17:00) Half Day`)).toContainText('Pending Approval (0.50)');
  });
});
