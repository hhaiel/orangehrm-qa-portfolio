import { test, expect, uniqueSuffix } from '../../fixtures';
import { AddEmployeePage, type UploadFile } from '../../pages/pim/AddEmployeePage';
import { EmployeeListPage } from '../../pages/pim/EmployeeListPage';
import { PersonalDetailsPage } from '../../pages/pim/PersonalDetailsPage';
import { SystemUsersPage } from '../../pages/admin/UserPages';
import { env, STORAGE_STATE } from '../../utils/env';

/**
 * PIM tests (test-cases/TC-PIM.md). All run as Admin.
 * Employees created by a test (via the API or the UI) are deleted afterwards.
 * Known product defects are separate tests marked test.fail().
 */
test.use({ storageState: STORAGE_STATE.admin });
test.describe.configure({ timeout: 90_000 });

// A valid 1×1 PNG, a too-large image and a non-image, generated in memory (no files to keep in git).
const PNG_1PX = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64',
);
const validPhoto: UploadFile = { name: 'photo.png', mimeType: 'image/png', buffer: PNG_1PX };
const largeImage: UploadFile = { name: 'large.png', mimeType: 'image/png', buffer: Buffer.concat([PNG_1PX, Buffer.alloc(1_200_000)]) };
const smallPdf: UploadFile = { name: 'small.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF-1.4\n% test file\n') };
const largePdf: UploadFile = { name: 'large.pdf', mimeType: 'application/pdf', buffer: Buffer.concat([Buffer.from('%PDF-1.4\n'), Buffer.alloc(1_500_000, 32)]) };

const WEAK_PASSWORDS = [
  { password: 'Abc1!', message: 'Should have at least 8 characters' },
  { password: 'abcdef1!', message: 'Your password must contain minimum 1 upper-case letter' },
  { password: 'ABCDEF1!', message: 'Your password must contain minimum 1 lower-case letter' },
  { password: 'Abcdefg!', message: 'Your password must contain minimum 1 number' },
  { password: 'Abcdefg1', message: 'Your password must contain minimum 1 special character' },
];

// ---------------------------------------------------------------- US-PIM-0001 Add employee

test.describe('PIM › Add Employee', () => {
  test('US-PIM-0001-TC-001 Add Employee validates names and Employee Id, and saves without a login @smoke', async ({
    page,
    adminApi,
    trackEmployee,
  }) => {
    const addPage = new AddEmployeePage(page);
    await addPage.goto();
    await expect(page.getByText('Accepts jpg, .png, .gif up to 1MB')).toBeVisible();
    const suggestedId = await addPage.employeeId.inputValue();

    await addPage.save();
    await expect(addPage.nameMessages()).toHaveText(['Required', 'Required']);

    await addPage.fillName('QA_PW_abcdefghijklmnopqrstuvwxy', 'Plain'); // 31 characters
    await expect(addPage.nameMessages()).toHaveText(['Should not exceed 30 characters']);

    const lastName = uniqueSuffix();
    await addPage.fillName('QA_PW Paul', lastName);
    await addPage.employeeId.fill('0001'); // the Admin's Employee Id
    await addPage.employeeId.blur();
    await expect(addPage.form.errorFor('Employee Id')).toHaveText('Employee Id already exists');
    await addPage.save();
    await expect(page).toHaveURL(/\/pim\/addEmployee/);

    await addPage.employeeId.fill(suggestedId);
    await addPage.save();
    const empNumber = await addPage.expectSavedAndGetEmpNumber();
    trackEmployee(empNumber);
    expect(await adminApi.usersForEmployee(empNumber)).toBe(0);
  });

  test('US-PIM-0001-TC-002 leading and trailing spaces are removed from names @regression', async ({
    page,
    adminApi,
    trackEmployee,
  }) => {
    test.info().annotations.push({ type: 'issue', description: 'DEF-003: names are stored with the spaces' });
    test.fail(true, 'Known defect DEF-003. When this starts passing, the defect is fixed: remove test.fail().');

    const addPage = new AddEmployeePage(page);
    await addPage.goto();
    await addPage.fillName('  QA_PW Trim  ', uniqueSuffix());
    await addPage.save();
    const empNumber = await addPage.expectSavedAndGetEmpNumber();
    trackEmployee(empNumber);
    expect((await adminApi.personalDetails(empNumber)).firstName).toBe('QA_PW Trim');
  });

  test('US-PIM-0001-TC-003 login details enforce the username and password rules @regression', async ({
    page,
    createPerson,
  }) => {
    const existing = await createPerson('Existing', { withLogin: true });
    const addPage = new AddEmployeePage(page);
    await addPage.goto();
    await addPage.fillName('QA_PW Rule', uniqueSuffix());
    await addPage.enableLogin();
    await expect(addPage.form.field('Status').getByRole('radio', { name: 'Enabled' })).toBeChecked();

    const username = addPage.form.input('Username');
    await username.fill('abcd');
    await username.blur();
    await expect(addPage.form.errorFor('Username')).toHaveText('Should be at least 5 characters');

    await username.fill(existing.username!.toUpperCase()); // uniqueness ignores case
    await username.blur();
    await expect(addPage.form.errorFor('Username')).toHaveText('Username already exists');

    await username.fill(`qa_pw_${uniqueSuffix()}`);
    await username.blur();
    await expect(addPage.form.errorFor('Username')).toHaveCount(0);

    for (const { password, message } of WEAK_PASSWORDS) {
      await addPage.form.input('Password').fill(password);
      await addPage.form.input('Confirm Password').fill(password);
      await addPage.save();
      await expect(addPage.form.errorFor('Password'), `password "${password}"`).toHaveText(message);
    }

    await addPage.form.input('Password').fill(env('TEST_USER_PASSWORD'));
    await addPage.form.input('Confirm Password').fill(`${env('TEST_USER_PASSWORD')}x`);
    await addPage.save();
    await expect(addPage.form.errorFor('Confirm Password')).toHaveText('Passwords do not match');
    await expect(page).toHaveURL(/\/pim\/addEmployee/);
  });

  test('US-PIM-0001-TC-003 an empty Confirm Password says "Required" @regression', async ({ page }) => {
    test.info().annotations.push({ type: 'issue', description: 'DEF-005: shows "Passwords do not match"' });
    test.fail(true, 'Known defect DEF-005. When this starts passing, the defect is fixed: remove test.fail().');

    const addPage = new AddEmployeePage(page);
    await addPage.goto();
    await addPage.enableLogin();
    await addPage.save();
    await expect(addPage.form.errorFor('Confirm Password')).toHaveText('Required', { timeout: 5_000 });
  });

  // Was logged as DEF-006 from a manual check that read the message too early: the message updates
  // about 1 s after leaving the field (async strength check). Kept as a regression test.
  test('US-PIM-0001-TC-003 the Password message updates after leaving the field @regression', async ({ page }) => {
    const addPage = new AddEmployeePage(page);
    await addPage.goto();
    await addPage.enableLogin();
    await addPage.save();
    await expect(addPage.form.errorFor('Password')).toHaveText('Required');

    const password = addPage.form.input('Password');
    await password.fill('abcdef12');
    await password.blur();
    await expect(addPage.form.errorFor('Password')).toHaveText('Your password must contain minimum 1 upper-case letter');

    await password.fill(env('TEST_USER_PASSWORD'));
    await password.blur();
    await expect(addPage.form.errorFor('Password')).toHaveCount(0);
  });

  test('US-PIM-0001-TC-004 an employee created with login details gets an ESS user @regression', async ({
    page,
    adminApi,
    trackEmployee,
  }) => {
    const suffix = uniqueSuffix();
    const usernameValue = `qa_pw_${suffix}`;
    const addPage = new AddEmployeePage(page);
    await addPage.goto();
    await addPage.fillName('QA_PW Lisa', suffix);
    await addPage.enableLogin();
    await addPage.fillLogin(usernameValue, env('TEST_USER_PASSWORD'));
    await addPage.save();
    const empNumber = await addPage.expectSavedAndGetEmpNumber();
    trackEmployee(empNumber);

    const user = await adminApi.findUser(usernameValue);
    expect(user?.userRole.name).toBe('ESS');
    expect(user?.status).toBe(true);
    expect(user?.employee.empNumber).toBe(empNumber);

    const users = new SystemUsersPage(page);
    await users.goto();
    await expect(users.row(usernameValue)).toContainText('ESS');
    await expect(users.row(usernameValue)).toContainText('Enabled');
  });

  test('US-PIM-0001-TC-005 a valid photo is accepted, saved and can be changed @regression', async ({
    page,
    trackEmployee,
  }) => {
    const addPage = new AddEmployeePage(page);
    await addPage.goto();
    await addPage.uploadPhoto(validPhoto);
    await expect(addPage.photoPreview).toHaveAttribute('src', /^data:image/);
    await expect(addPage.photoMessage()).toHaveCount(0);

    await addPage.fillName('QA_PW Pic', uniqueSuffix());
    await addPage.save();
    const empNumber = await addPage.expectSavedAndGetEmpNumber();
    trackEmployee(empNumber);
    const details = new PersonalDetailsPage(page);
    await expect(details.profileImage()).toHaveAttribute('src', /viewPhoto\/empNumber\/\d+/);

    // Change the picture
    await details.changePhoto(empNumber, { ...validPhoto, name: 'new-photo.png' });
    await expect(details.toast()).toContainText('Successfully Updated');
  });

  test('US-PIM-0001-TC-005 wrong file types and files over 1 MB are rejected with a message @regression', async ({ page }) => {
    const addPage = new AddEmployeePage(page);
    await addPage.goto();

    await addPage.uploadPhoto(smallPdf);
    await expect(addPage.photoMessage()).toHaveText('File type not allowed');

    await addPage.uploadPhoto(largeImage);
    await expect(addPage.photoMessage()).toHaveText('Attachment Size Exceeded');

    // A file that is both the wrong type AND too large: only the size message is shown
    // (the size check runs first). Works as designed (DEF-007 was rejected); noted as a UX observation.
    await addPage.uploadPhoto(largePdf);
    await expect(addPage.photoMessage()).toHaveText('Attachment Size Exceeded');
  });
});

// ---------------------------------------------------------------- US-PIM-0002 Employee List

test.describe('PIM › Employee List', () => {
  test('US-PIM-0002-TC-001 search by partial name, Employee Id and supervisor, no match, and Reset @smoke', async ({
    page,
    createPerson,
  }) => {
    const supervisor = await createPerson('Supervisor');
    const employee = await createPerson('Employee', { supervisor, employeeId: true });
    await createPerson('Other');

    const list = new EmployeeListPage(page);
    await list.goto();
    await list.showFilters();
    expect(await list.filterLabels()).toEqual([
      'Employee Name', 'Employee Id', 'Employment Status', 'Include', 'Supervisor Name', 'Job Title', 'Sub Unit',
    ]);
    await expect(list.filters.selected('Include')).toHaveText('Current Employees Only');

    await list.searchByTypedName(employee.lastName); // typed, no suggestion picked
    await expect(list.results).toHaveCount(1);
    await expect(list.row(employee.lastName)).toBeVisible();

    await list.reset();
    await list.searchById(employee.employeeId!);
    await expect(list.results).toHaveCount(1);
    await expect(list.row(employee.employeeId!)).toBeVisible();

    await list.reset();
    await list.searchBySupervisor(supervisor.fullName);
    await expect(list.results).toHaveCount(1);
    await expect(list.row(employee.lastName)).toBeVisible();

    await list.reset();
    await list.searchByTypedName(`Zzzz${uniqueSuffix()}`);
    await expect(list.recordCount).toHaveText('No Records Found');
    await expect(list.toast()).toContainText('No Records Found');

    await list.reset();
    await expect(list.filters.input('Employee Name')).toHaveValue('');
    await expect(list.filters.input('Employee Id')).toHaveValue('');
    await expect(list.results.first()).toBeVisible();
  });

  test('US-PIM-0002-TC-002 delete asks for confirmation, Cancel keeps the record, and Admin can\'t delete themselves @regression', async ({
    page,
    adminApi,
    createPerson,
  }) => {
    const person = await createPerson('TempDelete');
    const list = new EmployeeListPage(page);
    await list.goto();
    await list.showFilters();

    await list.searchById('0001'); // the logged-in Admin's own record
    await expect(list.results).toHaveCount(1);
    await expect(list.deleteIcon(list.results.first())).toHaveCount(0);

    await list.reset();
    await list.searchByTypedName(person.lastName);
    await list.deleteIcon(list.row(person.lastName)).click();
    await expect(list.confirmDialog()).toContainText(
      'The selected record will be permanently deleted. Are you sure you want to continue?',
    );
    await list.confirmDialog().getByRole('button', { name: 'No, Cancel' }).click();
    await expect(list.confirmDialog()).toBeHidden();
    await expect(list.row(person.lastName)).toBeVisible();

    await list.deleteIcon(list.row(person.lastName)).click();
    await list.confirmDialog().getByRole('button', { name: 'Yes, Delete' }).click();
    await expect(list.toast()).toContainText('Successfully Deleted');
    await expect(list.row(person.lastName)).toBeHidden();
    expect(await adminApi.usersForEmployee(person.empNumber)).toBe(0);
  });
});

// ---------------------------------------------------------------- US-PIM-0003 Personal Details

test.describe('PIM › Personal Details', () => {
  test('US-PIM-0003-TC-001 personal details can be edited and persist, and names stay required @regression', async ({
    page,
    adminApi,
    createPerson,
  }) => {
    const person = await createPerson('Edit');
    const details = new PersonalDetailsPage(page);
    await details.goto(person.empNumber);
    expect(await details.tabs()).toEqual([
      'Personal Details', 'Contact Details', 'Emergency Contacts', 'Dependents', 'Immigration',
      'Job', 'Salary', 'Report-to', 'Qualifications', 'Memberships',
    ]);

    await details.lastName.fill('');
    await details.save();
    await expect(details.form.field('Employee Full Name')).toContainText('Required');
    expect((await adminApi.personalDetails(person.empNumber)).lastName).toBe(person.lastName);

    const newLastName = `Upd${uniqueSuffix()}`;
    await details.lastName.fill(newLastName);
    await details.form.input('Other Id').fill('OT-123');
    await details.form.select('Marital Status', 'Single');
    await details.setGender('Female');
    await details.form.date('Date of Birth', '1990-05-15');
    await details.save();
    await expect(details.toast()).toContainText('Successfully Updated');

    await details.goto(person.empNumber);
    await expect(details.lastName).toHaveValue(newLastName);
    await expect(details.form.input('Other Id')).toHaveValue('OT-123');
    await expect(details.form.selected('Marital Status')).toHaveText('Single');
    await expect(details.form.field('Gender').getByRole('radio', { name: 'Female' })).toBeChecked();
    await expect(details.form.input('Date of Birth')).toHaveValue('1990-05-15');

    const list = new EmployeeListPage(page);
    await list.goto();
    await list.showFilters();
    await list.searchByTypedName(newLastName);
    await expect(list.row(newLastName)).toBeVisible();
  });

  test('US-PIM-0003-TC-002 Date of Birth can\'t be in the future @regression', async ({ page, adminApi, createPerson }) => {
    test.info().annotations.push({ type: 'issue', description: 'DEF-004: a future Date of Birth is saved' });
    test.fail(true, 'Known defect DEF-004. When this starts passing, the defect is fixed: remove test.fail().');

    const person = await createPerson('FutureDob');
    const details = new PersonalDetailsPage(page);
    await details.goto(person.empNumber);
    await details.form.date('Date of Birth', '2030-01-01');
    await details.save();
    await expect(details.form.errorFor('Date of Birth')).toBeVisible({ timeout: 5_000 });
    expect((await adminApi.personalDetails(person.empNumber)).birthday).not.toBe('2030-01-01');
  });
});
