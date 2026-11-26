import { expect, type Locator, type Page } from '@playwright/test';
import { dialog, Form, toast } from '../components/Form';

/** PIM › Employee List: search filters, results and delete. */
export class EmployeeListPage {
  readonly filters: Form;
  readonly results: Locator;
  readonly recordCount: Locator;
  readonly addButton: Locator;

  constructor(private readonly page: Page) {
    this.filters = new Form(page, page.locator('.oxd-table-filter'));
    this.results = page.locator('.oxd-table-card');
    this.recordCount = page.getByText(/\(\d+\) Records? Found|No Records Found/).first();
    this.addButton = page.getByRole('button', { name: 'Add' });
  }

  async goto() {
    await this.page.goto('/web/index.php/pim/viewEmployeeList');
    await expect(this.recordCount).toBeVisible();
  }

  /** On narrow windows the filter panel starts collapsed. */
  async showFilters() {
    const name = this.filters.field('Employee Name');
    if (!(await name.isVisible())) await this.page.locator('.oxd-table-filter-header-options button').click();
    await expect(name).toBeVisible();
  }

  filterLabels(): Promise<string[]> {
    return this.page.locator('.oxd-table-filter label').allInnerTexts();
  }

  async search() {
    await this.page.getByRole('button', { name: 'Search' }).click();
  }

  async reset() {
    await this.page.getByRole('button', { name: 'Reset' }).click();
  }

  /** Types a name and searches WITHOUT picking a suggestion. */
  async searchByTypedName(text: string) {
    await this.filters.input('Employee Name').fill(text);
    await this.search();
  }

  async searchById(employeeId: string) {
    await this.filters.input('Employee Id').fill(employeeId);
    await this.search();
  }

  async searchBySupervisor(fullName: string) {
    await this.filters.autocomplete('Supervisor Name', fullName, fullName);
    await this.search();
  }

  /** Result cards containing the text (e.g. a unique last name). */
  row(text: string): Locator {
    return this.results.filter({ hasText: text });
  }

  deleteIcon(row: Locator): Locator {
    return row.locator('button:has(i.bi-trash)');
  }

  confirmDialog(): Locator {
    return dialog(this.page);
  }

  toast(): Locator {
    return toast(this.page);
  }
}
