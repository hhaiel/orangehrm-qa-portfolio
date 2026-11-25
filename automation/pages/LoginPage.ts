import { expect, type Locator, type Page } from '@playwright/test';

/**
 * Page Object for the OrangeHRM login page.
 * Spec files call these methods instead of using selectors directly,
 * so a UI change only needs fixing here.
 */
export class LoginPage {
  readonly page: Page;
  readonly usernameInput: Locator;
  readonly passwordInput: Locator;
  readonly loginButton: Locator;
  readonly alert: Locator;

  constructor(page: Page) {
    this.page = page;
    this.usernameInput = page.getByPlaceholder('Username');
    this.passwordInput = page.getByPlaceholder('Password');
    this.loginButton = page.getByRole('button', { name: 'Login' });
    this.alert = page.getByRole('alert');
  }

  async goto() {
    await this.page.goto('/web/index.php/auth/login');
    await expect(this.loginButton).toBeVisible();
  }

  async login(username: string, password: string) {
    await this.usernameInput.fill(username);
    await this.passwordInput.fill(password);
    await this.loginButton.click();
  }

  /** The "Required" message shown under an empty field. */
  requiredMessageFor(field: Locator): Locator {
    return field.locator('xpath=ancestor::div[contains(@class,"oxd-input-group")]').getByText('Required');
  }

  async expectLoggedIn() {
    // The first login after the server has been idle can take 10+ s (cold PHP caches).
    await expect(this.page).toHaveURL(/\/dashboard\/index/, { timeout: 20_000 });
    await expect(this.page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
  }

  async expectStillOnLogin() {
    await expect(this.page).toHaveURL(/\/auth\/login/);
    await expect(this.loginButton).toBeVisible();
  }
}
