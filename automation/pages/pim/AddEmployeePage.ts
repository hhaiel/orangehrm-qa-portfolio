import { expect, type Locator, type Page } from '@playwright/test';
import { Form } from '../components/Form';

export type UploadFile = { name: string; mimeType: string; buffer: Buffer };

/** PIM › Add Employee (optionally with login details and a profile photo). */
export class AddEmployeePage {
  readonly form: Form;
  readonly firstName: Locator;
  readonly middleName: Locator;
  readonly lastName: Locator;
  readonly employeeId: Locator;
  readonly loginToggle: Locator;
  readonly photoInput: Locator;
  readonly photoPreview: Locator;
  readonly saveButton: Locator;

  constructor(private readonly page: Page) {
    this.form = new Form(page, page.locator('form'));
    this.firstName = page.getByPlaceholder('First Name');
    this.middleName = page.getByPlaceholder('Middle Name');
    this.lastName = page.getByPlaceholder('Last Name');
    this.employeeId = this.form.input('Employee Id');
    this.loginToggle = page.locator('form .oxd-switch-input');
    this.photoInput = page.locator('form input[type="file"]');
    this.photoPreview = page.locator('form img.employee-image');
    this.saveButton = page.getByRole('button', { name: 'Save' });
  }

  async goto() {
    await this.page.goto('/web/index.php/pim/addEmployee');
    await expect(this.firstName).toBeVisible();
    await expect(this.employeeId).not.toHaveValue(''); // auto-generated Id has loaded
  }

  /** Messages under the name fields (both names share one field group). */
  nameMessages(): Locator {
    return this.form.field('Employee Full Name').locator('.oxd-input-field-error-message');
  }

  async fillName(first: string, last: string) {
    await this.firstName.fill(first);
    await this.lastName.fill(last);
  }

  async enableLogin() {
    await this.loginToggle.click();
    await expect(this.form.input('Username')).toBeVisible();
  }

  async fillLogin(username: string, password: string, confirm = password, status: 'Enabled' | 'Disabled' = 'Enabled') {
    await this.form.input('Username').fill(username);
    await this.form.field('Status').getByText(status, { exact: true }).click();
    await this.form.input('Password').fill(password);
    await this.form.input('Confirm Password').fill(confirm);
  }

  async uploadPhoto(file: UploadFile) {
    await this.photoInput.setInputFiles(file);
  }

  /** The validation message shown under the photo after a rejected upload. */
  photoMessage(): Locator {
    // Only the photo has a message at this point (names untouched), so the form's first message is it.
    return this.page.locator('form .oxd-input-field-error-message').first();
  }

  async save() {
    await this.saveButton.click();
  }

  /** After a successful save OrangeHRM opens Personal Details; returns the new empNumber. */
  async expectSavedAndGetEmpNumber(): Promise<number> {
    await expect(this.page).toHaveURL(/\/pim\/viewPersonalDetails\/empNumber\/\d+/, { timeout: 20_000 });
    return Number(this.page.url().match(/empNumber\/(\d+)/)![1]);
  }
}
