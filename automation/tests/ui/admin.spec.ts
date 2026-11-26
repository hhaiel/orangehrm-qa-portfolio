import { test, expect, uniqueSuffix } from '../../fixtures';
import { Navigation } from '../../pages/components/Navigation';
import { SaveUserPage, SystemUsersPage } from '../../pages/admin/UserPages';
import { EmployeeListPage } from '../../pages/pim/EmployeeListPage';
import { env, STORAGE_STATE } from '../../utils/env';

/**
 * Admin › User Management and access-control tests (test-cases/TC-AD.md).
 * US-AD-0001-TC-004 (disabled user login) lives in login.spec.ts.
 */
test.describe.configure({ timeout: 90_000 });

// ---------------------------------------------------------------- US-AD-0001 Manage system users

test.describe('Admin › Users', () => {
  test.use({ storageState: STORAGE_STATE.admin });

  test('US-AD-0001-TC-001 Add User requires all fields and only accepts an existing employee @regression', async ({ page }) => {
    const addUser = new SaveUserPage(page);
    await addUser.gotoAdd();
    expect(await addUser.fieldLabels()).toEqual(
      expect.arrayContaining(['User Role', 'Employee Name', 'Status', 'Username', 'Password', 'Confirm Password']),
    );

    await addUser.save();
    for (const field of ['User Role', 'Employee Name', 'Status', 'Username', 'Password']) {
      await expect(addUser.form.errorFor(field), field).toHaveText('Required');
    }

    await addUser.form.input('Employee Name').fill(`Nobody ${uniqueSuffix()}`);
    await expect(page.getByRole('option', { name: 'No Records Found' })).toBeVisible();
    await addUser.save();
    await expect(addUser.form.errorFor('Employee Name')).toHaveText('Invalid');
    await expect(page).toHaveURL(/\/admin\/saveSystemUser$/);
  });

  test('US-AD-0001-TC-001 an empty Confirm Password says "Required" (Add User) @regression', async ({ page }) => {
    test.info().annotations.push({ type: 'issue', description: 'DEF-005: shows "Passwords do not match"' });
    test.fail(true, 'Known defect DEF-005. When this starts passing, the defect is fixed: remove test.fail().');

    const addUser = new SaveUserPage(page);
    await addUser.gotoAdd();
    await addUser.save();
    await expect(addUser.form.errorFor('Confirm Password')).toHaveText('Required', { timeout: 5_000 });
  });

  test('US-AD-0001-TC-002 Admin creates an ESS user and finds it with the filters @smoke', async ({
    page,
    adminApi,
    createPerson,
  }) => {
    const person = await createPerson('NewUser'); // no login yet
    const username = `qa_pw_${uniqueSuffix()}`;

    const addUser = new SaveUserPage(page);
    await addUser.gotoAdd();
    await addUser.form.select('User Role', 'ESS');
    await addUser.form.autocomplete('Employee Name', person.fullName, person.fullName);
    await addUser.form.select('Status', 'Enabled');
    await addUser.form.input('Username').fill(username);
    await addUser.form.input('Password').fill(env('TEST_USER_PASSWORD'));
    await addUser.form.input('Confirm Password').fill(env('TEST_USER_PASSWORD'));
    await addUser.save();
    await expect(page).toHaveURL(/\/admin\/viewSystemUsers/, { timeout: 20_000 });
    expect((await adminApi.findUser(username))?.employee.empNumber).toBe(person.empNumber);

    const users = new SystemUsersPage(page);
    await users.showFilters();
    await users.filters.input('Username').fill(username);
    await users.search();
    await expect(users.results).toHaveCount(1);
    await expect(users.row(username)).toContainText('ESS');
    await expect(users.row(username)).toContainText('Enabled');

    await users.reset();
    await expect(users.filters.input('Username')).toHaveValue('');
    await expect.poll(() => users.results.count()).toBeGreaterThan(1);

    await users.filters.select('User Role', 'ESS');
    await users.filters.select('Status', 'Enabled');
    await users.search();
    // The unfiltered list (which already contains the new user) is still shown for a moment after
    // Search, and the list is empty while it reloads. So wait until the FILTERED result is shown.
    // (Found in CI: checking only "new user's row is visible" passed against the old list.)
    await expect
      .poll(async () => {
        const listed = await users.usernames();
        return listed.includes(username) && !listed.includes(env('ADMIN_USERNAME')) && !listed.includes(env('DISABLED_USERNAME'));
      }, { message: 'filtered list: new user shown, Admin and disabled user hidden' })
      .toBe(true);
    for (const row of await users.results.all()) {
      await expect(row).toContainText('ESS');
      await expect(row).toContainText('Enabled');
    }
  });

  test('US-AD-0001-TC-003 Admin changes a user\'s role and the user then gets Admin menus @regression', async ({
    page,
    adminApi,
    createPerson,
    loginAs,
  }) => {
    const person = await createPerson('RoleChange', { withLogin: true });
    const user = await adminApi.findUser(person.username!);

    const editUser = new SaveUserPage(page);
    await editUser.gotoEdit(user!.id);
    expect(await editUser.fieldLabels()).toEqual(expect.arrayContaining(['User Role', 'Employee Name', 'Status', 'Username', 'Change Password ?']));
    await expect(editUser.form.selected('User Role')).toHaveText('ESS');

    await editUser.form.select('User Role', 'Admin');
    await editUser.save();
    await expect(editUser.toast()).toContainText('Successfully Updated');
    await expect.poll(async () => (await adminApi.findUser(person.username!))?.userRole.name).toBe('Admin');

    const { page: userPage } = await loginAs(person);
    const menu = await new Navigation(userPage).mainMenuItems().allInnerTexts();
    expect(menu).toEqual(expect.arrayContaining(['Admin', 'PIM']));
  });
});

// ---------------------------------------------------------------- US-AD-0002 Access control

test.describe('Access control', () => {
  test.describe('employee without subordinates', () => {
    test.use({ storageState: STORAGE_STATE.employee });

    test('US-AD-0002-TC-001 employee can\'t reach Admin, PIM or other employees\' records @smoke', async ({
      page,
      createPerson,
    }) => {
      const other = await createPerson('Other');
      const nav = new Navigation(page);

      await page.goto('/web/index.php/dashboard/index');
      await expect(nav.mainMenuItems()).toHaveText([
        'Leave', 'Time', 'My Info', 'Performance', 'Dashboard', 'Directory', 'Claim', 'Buzz',
      ]);

      for (const url of ['/web/index.php/admin/viewSystemUsers', '/web/index.php/pim/viewEmployeeList']) {
        const response = await page.goto(url);
        expect(response?.status(), url).toBe(403);
        await expect(nav.accessDenied()).toBeVisible();
      }

      await page.goto(`/web/index.php/pim/viewPersonalDetails/empNumber/${other.empNumber}`);
      await expect(page.getByText('No Records Found').first()).toBeVisible();
      await expect(page.getByText(other.lastName)).toHaveCount(0);
    });
  });

  test('US-AD-0002-TC-002 a supervisor sees PIM, but only for their own subordinates @regression', async ({
    createPerson,
    loginAs,
  }) => {
    const supervisor = await createPerson('Supervisor', { withLogin: true });
    const subordinate = await createPerson('Employee', { supervisor });
    const other = await createPerson('Other');

    const { page } = await loginAs(supervisor);
    const menu = await new Navigation(page).mainMenuItems().allInnerTexts();
    expect(menu).toContain('PIM');
    expect(menu).not.toContain('Admin');

    const list = new EmployeeListPage(page);
    await list.goto();
    await expect(list.results).toHaveCount(1);
    await expect(list.row(subordinate.lastName)).toBeVisible();
    await expect(list.addButton).toBeHidden();
    await expect(list.deleteIcon(list.results.first())).toHaveCount(0);

    await page.goto(`/web/index.php/pim/viewPersonalDetails/empNumber/${other.empNumber}`);
    await expect(page.getByText('No Records Found').first()).toBeVisible();
    await expect(page.getByText(other.lastName)).toHaveCount(0);
  });
});
