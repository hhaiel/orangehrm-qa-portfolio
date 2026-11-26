import { expect, type Locator, type Page } from '@playwright/test';
import { Form, toast } from '../components/Form';

/** Admin › User Management › Users (list and filters). */
export class SystemUsersPage {
  readonly filters: Form;
  readonly results: Locator;
  readonly recordCount: Locator;

  constructor(private readonly page: Page) {
    this.filters = new Form(page, page.locator('.oxd-table-filter'));
    this.results = page.locator('.oxd-table-card');
    this.recordCount = page.getByText(/\(\d+\) Records? Found|No Records Found/).first();
  }

  async goto() {
    await this.page.goto('/web/index.php/admin/viewSystemUsers');
    await expect(this.recordCount).toBeVisible();
  }

  async showFilters() {
    const field = this.filters.field('Username');
    if (!(await field.isVisible())) await this.page.locator('.oxd-table-filter-header-options button').click();
    await expect(field).toBeVisible();
  }

  async search() {
    await this.page.getByRole('button', { name: 'Search' }).click();
  }

  async reset() {
    await this.page.getByRole('button', { name: 'Reset' }).click();
  }

  row(username: string): Locator {
    return this.results.filter({ hasText: username });
  }

  /** Usernames shown in the result cards. */
  async usernames(): Promise<string[]> {
    const texts = await this.results.allInnerTexts();
    return texts.map((t) => {
      const lines = t.split('\n').map((l) => l.trim()).filter(Boolean);
      return lines[lines.indexOf('Username') + 1];
    });
  }
}

/** Admin › Users › Add User / Edit User. */
export class SaveUserPage {
  readonly form: Form;
  readonly saveButton: Locator;

  constructor(private readonly page: Page) {
    this.form = new Form(page, page.locator('form'));
    this.saveButton = page.getByRole('button', { name: 'Save' });
  }

  async gotoAdd() {
    await this.page.goto('/web/index.php/admin/saveSystemUser');
    await expect(this.page.getByText('Add User', { exact: true })).toBeVisible();
  }

  async gotoEdit(userId: number) {
    await this.page.goto(`/web/index.php/admin/saveSystemUser/${userId}`);
    await expect(this.page.getByText('Edit User', { exact: true })).toBeVisible();
    await expect(this.form.input('Username')).not.toHaveValue(''); // data has loaded
  }

  fieldLabels(): Promise<string[]> {
    return this.page.locator('form label').allInnerTexts();
  }

  async save() {
    await this.saveButton.click();
  }

  toast(): Locator {
    return toast(this.page);
  }
}
