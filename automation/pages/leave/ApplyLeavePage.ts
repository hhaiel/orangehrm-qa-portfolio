import { expect, type Locator, type Page } from '@playwright/test';
import { Form, toast } from '../components/Form';

export type DurationOption = 'Full Day' | 'Half Day - Morning' | 'Half Day - Afternoon' | 'Specify Time';
export type PartialDaysOption = 'All Days' | 'Start Day Only' | 'End Day Only' | 'Start and End Day';

export class ApplyLeavePage {
  readonly form: Form;
  readonly applyButton: Locator;
  readonly balance: Locator;
  readonly overlapNotice: Locator;

  constructor(private readonly page: Page) {
    this.form = new Form(page, page.locator('form'));
    this.applyButton = page.getByRole('button', { name: 'Apply' });
    this.balance = this.form.field('Leave Balance').locator('p');
    this.overlapNotice = page.getByText('Overlapping Leave Request(s) Found');
  }

  async goto() {
    await this.page.goto('/web/index.php/leave/applyLeave');
    await expect(this.page.getByRole('heading', { name: 'Apply Leave' })).toBeVisible();
  }

  async selectLeaveType(name: string) {
    await this.form.select('Leave Type', name);
  }

  async leaveTypeOptions(): Promise<string[]> {
    return this.form.options('Leave Type');
  }

  async setDates(from: string, to?: string) {
    await this.form.date('From Date', from);
    if (to && to !== from) await this.form.date('To Date', to);
  }

  async durationOptions(): Promise<string[]> {
    return this.form.options('Duration');
  }

  /** Single-day request: Full Day, Half Day - Morning/Afternoon, Specify Time. */
  async setDuration(option: DurationOption) {
    await this.form.select('Duration', option);
  }

  async partialDaysOptions(): Promise<string[]> {
    return this.form.options('Partial Days');
  }

  /** Multi-day request, e.g. Start Day Only + Half Day - Morning. */
  async setPartialDays(option: PartialDaysOption, startDayDuration?: DurationOption) {
    await this.form.select('Partial Days', option);
    if (startDayDuration) await this.form.select('Start Day', startDayDuration);
  }

  async apply() {
    await this.applyButton.click();
  }

  /** Select type, dates and submit in one go (used as a precondition step). */
  async applyFor(leaveType: string, from: string, to?: string, duration?: DurationOption) {
    await this.goto();
    await this.selectLeaveType(leaveType);
    await this.setDates(from, to);
    if (duration) await this.setDuration(duration);
    await this.apply();
  }

  toast(): Locator {
    return toast(this.page);
  }
}
