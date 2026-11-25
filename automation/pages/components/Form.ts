import { expect, type Locator, type Page } from '@playwright/test';

/**
 * Helpers for OrangeHRM's custom form controls ("oxd" components).
 * Fields are found by their visible label, so page objects stay readable
 * and the few CSS class names live in this one file.
 */
export class Form {
  constructor(private readonly page: Page, private readonly scope: Locator = page.locator('body')) {}

  /** The wrapper of a form field, found by its label text (e.g. "Leave Type"). */
  field(label: string): Locator {
    return this.scope
      .locator('.oxd-input-group')
      .filter({ has: this.page.locator('label').getByText(label, { exact: true }) });
  }

  input(label: string): Locator {
    return this.field(label).locator('input');
  }

  errorFor(label: string): Locator {
    return this.field(label).locator('.oxd-input-field-error-message');
  }

  /** Opens a custom dropdown and picks an option by its exact text. */
  async select(label: string, option: string) {
    await this.field(label).locator('.oxd-select-text').click();
    await this.page.getByRole('option', { name: option, exact: true }).click();
    await expect(this.field(label).locator('.oxd-select-text-input')).toHaveText(option);
  }

  /** Types into an autocomplete and picks the matching suggestion (not just the typed text). */
  async autocomplete(label: string, typed: string, option: string) {
    await this.input(label).fill(typed);
    await this.page.getByRole('option', { name: option }).click();
  }

  /** Fills a yyyy-mm-dd date field and closes the calendar. */
  async date(label: string, value: string) {
    const input = this.input(label);
    await input.fill(value);
    await input.press('Tab');
    await expect(input).toHaveValue(value);
  }
}

/** The pop-up notification in the bottom-left corner ("Successfully Saved", errors, warnings). */
export function toast(page: Page): Locator {
  return page.locator('.oxd-toast');
}

/** The confirmation dialog (e.g. "Updating Entitlement", "Are you Sure?"). */
export function dialog(page: Page): Locator {
  return page.locator('.oxd-dialog-sheet');
}
