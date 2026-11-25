import { expect, type Locator, type Page } from '@playwright/test';
import { dialog, Form, toast } from '../components/Form';

/** Leave › Entitlements › Add Entitlements */
export class AddEntitlementPage {
  readonly form: Form;
  readonly saveButton: Locator;

  constructor(private readonly page: Page) {
    this.form = new Form(page, page.locator('form'));
    this.saveButton = page.getByRole('button', { name: 'Save' });
  }

  async goto() {
    await this.page.goto('/web/index.php/leave/addLeaveEntitlement');
    // The title is styled like a heading but isn't a heading element, so match its text.
    await expect(this.page.getByText('Add Leave Entitlement', { exact: true })).toBeVisible();
  }

  async fill(employeeFullName: string, leaveType: string, days: number) {
    await this.form.autocomplete('Employee Name', employeeFullName, employeeFullName);
    await this.form.select('Leave Type', leaveType);
    await this.form.input('Entitlement').fill(String(days));
  }

  async save() {
    await this.saveButton.click();
  }

  confirmDialog(): Locator {
    return dialog(this.page);
  }

  async confirm() {
    await this.confirmDialog().getByRole('button', { name: 'Confirm' }).click();
  }

  async cancelDialog() {
    await this.confirmDialog().getByRole('button', { name: 'Cancel' }).click();
    await expect(this.confirmDialog()).toBeHidden();
  }

  toast(): Locator {
    return toast(this.page);
  }
}

/** The employee's Leave Entitlements list, where Add Entitlement lands after saving. */
export class EntitlementsListPage {
  constructor(private readonly page: Page) {}

  async expectOpen() {
    await expect(this.page).toHaveURL(/\/leave\/viewLeaveEntitlements/);
  }

  total(): Locator {
    return this.page.getByText(/Total \d+(\.\d+)? Day\(s\)/);
  }
}
