import { expect, type Locator, type Page } from '@playwright/test';
import { Form, toast } from '../components/Form';

/** One leave request card in "My Leave" or "Leave List", found by its date text (and employee). */
function requestCard(page: Page, dateText: string, employeeName?: string): Locator {
  let card = page.locator('.oxd-table-card').filter({ hasText: dateText });
  if (employeeName) card = card.filter({ hasText: employeeName });
  return card;
}

/** Leave › My Leave (an employee's own requests). */
export class MyLeavePage {
  constructor(private readonly page: Page) {}

  async goto() {
    await this.page.goto('/web/index.php/leave/viewMyLeaveList');
    await expect(this.page.getByRole('heading', { name: 'My Leave List' })).toBeVisible();
  }

  request(dateText: string): Locator {
    return requestCard(this.page, dateText);
  }

  /** Cancels the request whose card contains `dateText` (and `statusText`, if given). */
  async cancel(dateText: string, statusText?: string) {
    let card = this.request(dateText);
    if (statusText) card = card.filter({ hasText: statusText });
    await card.getByRole('button', { name: 'Cancel' }).click();
  }

  toast(): Locator {
    return toast(this.page);
  }
}

/** Leave › Leave List (supervisor / Admin view of other employees' requests). */
export class LeaveListPage {
  readonly filters: Form;

  constructor(private readonly page: Page) {
    this.filters = new Form(page, page.locator('.oxd-table-filter'));
  }

  async goto() {
    await this.page.goto('/web/index.php/leave/viewLeaveList');
    await expect(this.page.getByRole('heading', { name: 'Leave List' })).toBeVisible();
  }

  request(dateText: string, employeeName: string): Locator {
    return requestCard(this.page, dateText, employeeName);
  }

  async approve(dateText: string, employeeName: string) {
    await this.request(dateText, employeeName).getByRole('button', { name: 'Approve' }).click();
  }

  async reject(dateText: string, employeeName: string) {
    await this.request(dateText, employeeName).getByRole('button', { name: 'Reject' }).click();
  }

  /** On narrow windows the filter panel starts collapsed. */
  async showFilters() {
    const status = this.filters.field('Show Leave with Status');
    if (!(await status.isVisible())) {
      await this.page.locator('.oxd-table-filter-header-options button').click();
    }
    await expect(status).toBeVisible();
  }

  async filterByStatus(statuses: string[]) {
    await this.showFilters();
    await this.filters.multiSelect('Show Leave with Status', statuses);
    await this.page.getByRole('button', { name: 'Search' }).click();
  }

  async resetFilters() {
    await this.page.getByRole('button', { name: 'Reset' }).click();
  }

  statusChips(): Locator {
    return this.filters.field('Show Leave with Status').locator('.oxd-chip');
  }

  toast(): Locator {
    return toast(this.page);
  }
}
