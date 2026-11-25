import { test, expect, LEAVE_TYPE } from '../../fixtures';
import { Navigation } from '../../pages/components/Navigation';
import { AddEntitlementPage, EntitlementsListPage } from '../../pages/leave/EntitlementPages';
import { ApplyLeavePage } from '../../pages/leave/ApplyLeavePage';
import { LeaveListPage, MyLeavePage } from '../../pages/leave/LeaveRequestsPages';
import { endOfWorkingDays, upcomingWorkingDay } from '../../utils/dates';
import { STORAGE_STATE } from '../../utils/env';

/**
 * Leave smoke tests. Each test creates its own employees through the API
 * (fixtures/index.ts) and deletes them afterwards, so tests are independent and repeatable.
 * Titles start with the manual test case ID from test-cases/TC-LV.md.
 */

// These flows create data, log in one or two users and do several slow saves (4–6 s each
// on the local server). They take ~25 s normally but exceeded 45 s when the machine was busy.
test.describe.configure({ timeout: 90_000 });

/** A working day ~1 week ahead, inside the current leave period and not a holiday. */
async function nextLeaveDay(adminApi: import('../../api/OrangeHrmApi').OrangeHrmApi) {
  const period = await adminApi.currentLeavePeriod();
  const holidays = await adminApi.holidays(period.startDate, period.endDate);
  return { day: upcomingWorkingDay(7, holidays, period.endDate), holidays };
}

test.describe('Leave › Entitlements (Admin)', () => {
  test.use({ storageState: STORAGE_STATE.admin });

  test('US-LV-0001-TC-003 saving an entitlement asks for confirmation, adds up, and Cancel discards @smoke', async ({
    page,
    adminApi,
    createPerson,
  }) => {
    const employee = await createPerson('NoEntitlement');
    const addPage = new AddEntitlementPage(page);
    const list = new EntitlementsListPage(page);

    // First entitlement: 0.00 → 5.00
    await addPage.goto();
    await addPage.fill(employee.fullName, LEAVE_TYPE, 5);
    await addPage.save();
    await expect(addPage.confirmDialog()).toContainText('Existing Entitlement value 0.00 will be updated to 5.00');
    await addPage.confirm();
    await expect(addPage.toast()).toContainText('Successfully Saved');
    await list.expectOpen();
    await expect(list.total()).toHaveText('Total 5.00 Day(s)');

    // Second entitlement: dialog shows the sum; Cancel saves nothing
    await addPage.goto();
    await addPage.fill(employee.fullName, LEAVE_TYPE, 3);
    await addPage.save();
    await expect(addPage.confirmDialog()).toContainText('Existing Entitlement value 5.00 will be updated to 8.00');
    await addPage.cancelDialog();
    const typeId = await adminApi.leaveTypeId(LEAVE_TYPE);
    expect(await adminApi.entitlementTotal(employee.empNumber, typeId)).toBe(5);

    // Save again and confirm: 8.00
    await addPage.save();
    await addPage.confirm();
    await expect(addPage.toast()).toContainText('Successfully Saved');
    await list.expectOpen();
    await expect(list.total()).toHaveText('Total 8.00 Day(s)');
  });
});

test.describe('Leave › Apply and approve', () => {
  test('US-LV-0002-TC-001 employee submits a full-day request and the balance updates @smoke', async ({
    adminApi,
    createPerson,
    loginAs,
  }) => {
    const employee = await createPerson('Employee', { withLogin: true, entitlementDays: 5 });
    const { day } = await nextLeaveDay(adminApi);
    const { page, api } = await loginAs(employee);
    const applyPage = new ApplyLeavePage(page);

    await applyPage.goto();
    await applyPage.apply();
    for (const field of ['Leave Type', 'From Date', 'To Date']) {
      await expect(applyPage.form.errorFor(field)).toHaveText('Required');
    }

    await applyPage.selectLeaveType(LEAVE_TYPE);
    await expect(applyPage.balance).toHaveText('5.00 Day(s)');

    await applyPage.setDates(day);
    await expect(applyPage.form.input('To Date')).toHaveValue(day); // To Date auto-fills for a single day
    await applyPage.apply();
    await expect(applyPage.toast()).toContainText('Successfully Saved');

    const myLeave = new MyLeavePage(page);
    await myLeave.goto();
    await expect(myLeave.request(day)).toContainText('Pending Approval (1.00)');

    const typeId = await adminApi.leaveTypeId(LEAVE_TYPE);
    expect(await api.myBalance(typeId)).toBe(4);
    await applyPage.goto();
    await applyPage.selectLeaveType(LEAVE_TYPE);
    await expect(applyPage.balance).toHaveText('4.00 Day(s)');
  });

  test('US-LV-0003-TC-002 supervisor approves a subordinate\'s pending request @smoke', async ({
    adminApi,
    createPerson,
    loginAs,
  }) => {
    const supervisor = await createPerson('Supervisor', { withLogin: true });
    const employee = await createPerson('Employee', { withLogin: true, entitlementDays: 5, supervisor });
    const { day } = await nextLeaveDay(adminApi);
    const typeId = await adminApi.leaveTypeId(LEAVE_TYPE);

    // Precondition via API: the employee has a pending request
    const employeeSession = await loginAs(employee);
    await employeeSession.api.applyLeave(typeId, day);

    // Supervisor approves it in the UI
    const supervisorSession = await loginAs(supervisor);
    const leaveList = new LeaveListPage(supervisorSession.page);
    await leaveList.goto();
    await expect(leaveList.request(day, employee.fullName)).toContainText('Pending Approval (1.00)');
    await leaveList.approve(day, employee.fullName);
    await expect(leaveList.toast()).toContainText('Successfully Updated');
    await expect(leaveList.request(day, employee.fullName)).toBeHidden();

    // Employee sees it as Scheduled
    const myLeave = new MyLeavePage(employeeSession.page);
    await myLeave.goto();
    await expect(myLeave.request(day)).toContainText('Scheduled (1.00)');
  });
});

test.describe('Leave › Access (employee without subordinates)', () => {
  test.use({ storageState: STORAGE_STATE.employee });

  test('US-LV-0003-TC-006 employee without subordinates cannot reach the Leave List @smoke', async ({ page }) => {
    const nav = new Navigation(page);

    await page.goto('/web/index.php/leave/viewLeaveModule');
    await expect(nav.topMenuItems()).toHaveText(['Apply', 'My Leave', 'Entitlements', 'Reports']);

    const response = await page.goto('/web/index.php/leave/viewLeaveList');
    expect(response?.status()).toBe(403);
    await expect(nav.accessDenied()).toBeVisible();
  });
});

test.describe('Leave › Validation', () => {
  test('US-LV-0004-TC-001 a request larger than the balance is blocked @smoke', async ({
    adminApi,
    createPerson,
    loginAs,
  }) => {
    const employee = await createPerson('Employee', { withLogin: true, entitlementDays: 5 });
    const { day, holidays } = await nextLeaveDay(adminApi);
    const lastDay = endOfWorkingDays(day, 6, holidays); // 6 working days on a 5-day balance
    const { page, api } = await loginAs(employee);
    const applyPage = new ApplyLeavePage(page);

    await applyPage.goto();
    await applyPage.selectLeaveType(LEAVE_TYPE);
    await applyPage.setDates(day, lastDay);
    await expect(applyPage.balance).toHaveText('Balance not sufficient');

    await applyPage.apply();
    await expect(applyPage.toast()).toContainText('Leave Balance Exceeded');
    expect(await api.myLeaveRequests()).toHaveLength(0);
  });
});
