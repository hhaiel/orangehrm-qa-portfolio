import { expect, type Locator, type Page } from '@playwright/test';
import { toast } from '../components/Form';

/** One leave request card in "My Leave" or "Leave List", found by its date text. */
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
}

/** Leave › Leave List (supervisor / Admin view of other employees' requests). */
export class LeaveListPage {
  constructor(private readonly page: Page) {}

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

  toast(): Locator {
    return toast(this.page);
  }
}
