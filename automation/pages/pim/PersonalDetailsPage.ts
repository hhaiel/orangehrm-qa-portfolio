import { expect, type Locator, type Page } from '@playwright/test';
import { Form, toast } from '../components/Form';

/** PIM › employee › Personal Details */
export class PersonalDetailsPage {
  readonly form: Form;
  readonly firstName: Locator;
  readonly lastName: Locator;
  readonly saveButton: Locator;

  constructor(private readonly page: Page) {
    // The first form on the page is Personal Details (custom fields and attachments follow).
    const detailsForm = page.locator('form').first();
    this.form = new Form(page, detailsForm);
    this.firstName = page.getByPlaceholder('First Name');
    this.lastName = page.getByPlaceholder('Last Name');
    this.saveButton = detailsForm.getByRole('button', { name: 'Save' });
  }

  async goto(empNumber: number) {
    await this.page.goto(`/web/index.php/pim/viewPersonalDetails/empNumber/${empNumber}`);
    await expect(this.firstName).not.toHaveValue('', { timeout: 15_000 }); // data has loaded
  }

  tabs(): Promise<string[]> {
    return this.page.locator('.orangehrm-tabs-item').allInnerTexts();
  }

  /** The profile picture at the top of the employee's record. */
  profileImage(): Locator {
    return this.page.locator('.orangehrm-edit-employee-image img');
  }

  /** Opens the "Change Profile Picture" page for this employee, uploads a file and saves. */
  async changePhoto(empNumber: number, file: { name: string; mimeType: string; buffer: Buffer }) {
    await this.page.goto(`/web/index.php/pim/viewPhotograph/empNumber/${empNumber}`);
    await this.page.locator('form input[type="file"]').setInputFiles(file);
    await this.page.getByRole('button', { name: 'Save' }).click();
  }

  async setGender(gender: 'Male' | 'Female') {
    await this.form.field('Gender').getByText(gender, { exact: true }).click();
  }

  async save() {
    await this.saveButton.click();
  }

  toast(): Locator {
    return toast(this.page);
  }
}
