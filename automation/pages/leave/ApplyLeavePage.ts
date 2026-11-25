import { expect, type Locator, type Page } from '@playwright/test';
import { Form, toast } from '../components/Form';

export class ApplyLeavePage {
  readonly form: Form;
  readonly applyButton: Locator;
  readonly balance: Locator;

  constructor(private readonly page: Page) {
    this.form = new Form(page, page.locator('form'));
    this.applyButton = page.getByRole('button', { name: 'Apply' });
    this.balance = this.form.field('Leave Balance').locator('p');
  }

  async goto() {
    await this.page.goto('/web/index.php/leave/applyLeave');
    await expect(this.page.getByRole('heading', { name: 'Apply Leave' })).toBeVisible();
  }

  async selectLeaveType(name: string) {
    await this.form.select('Leave Type', name);
  }

  async setDates(from: string, to?: string) {
    await this.form.date('From Date', from);
    if (to && to !== from) await this.form.date('To Date', to);
  }

  async apply() {
    await this.applyButton.click();
  }

  toast(): Locator {
    return toast(this.page);
  }
}
