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

  /** The value currently shown in a dropdown field. */
  selected(label: string): Locator {
    return this.field(label).locator('.oxd-select-text-input');
  }

  /** Opens a custom dropdown and picks an option by its exact text. */
  async select(label: string, option: string) {
    const optionLocator = this.page.getByRole('option', { name: option, exact: true });
    // Only open the list if it isn't open already (clicking an open list closes it).
    if (!(await optionLocator.isVisible())) await this.field(label).locator('.oxd-select-text').click();
    await optionLocator.click();
    await expect(this.field(label).locator('.oxd-select-text-input')).toHaveText(option);
  }

  /** Opens a dropdown and returns the option texts (without the "-- Select --" placeholder). */
  async options(label: string): Promise<string[]> {
    await this.field(label).locator('.oxd-select-text').click();
    const options = this.page.getByRole('option');
    await expect(options.first()).toBeVisible();
    const texts = (await options.allInnerTexts()).map((t) => t.trim()).filter((t) => t !== '-- Select --');
    // Escape doesn't close OrangeHRM dropdowns; clicking the field again does.
    await this.field(label).locator('.oxd-select-text').click();
    await expect(options).toHaveCount(0);
    return texts;
  }

  /** For multi-select fields shown as chips: remove all chips, then pick the given options. */
  async multiSelect(label: string, options: string[]) {
    const chips = this.field(label).locator('.oxd-chip');
    while ((await chips.count()) > 0) {
      await chips.first().locator('i').click();
    }
    for (const option of options) {
      await this.field(label).locator('.oxd-select-text').click();
      await this.page.getByRole('option', { name: option, exact: true }).click();
    }
    await expect(chips).toHaveText(options);
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

/**
 * The pop-up notifications in the bottom-left corner ("Successfully Saved", errors, warnings).
 * Returns the container holding ALL toasts: OrangeHRM can show two at once (e.g. "Successfully
 * Updated" plus "No Records Found" when a list becomes empty), and toContainText still works.
 */
export function toast(page: Page): Locator {
  return page.locator('.oxd-toast-container');
}

/** The confirmation dialog (e.g. "Updating Entitlement", "Are you Sure?"). */
export function dialog(page: Page): Locator {
  return page.locator('.oxd-dialog-sheet');
}
