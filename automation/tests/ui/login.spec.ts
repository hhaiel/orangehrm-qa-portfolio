import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pages/LoginPage';
import { env, STORAGE_STATE } from '../../utils/env';

/**
 * Login tests. These start logged out, so they don't use a saved session.
 * Tests named with a manual TC ID automate that case (see test-cases/*.md).
 * LOGIN-xxx tests are supporting checks with no manual case.
 */
test.describe('Login', () => {
  let login: LoginPage;

  test.beforeEach(async ({ page }) => {
    login = new LoginPage(page);
    await login.goto();
  });

  test('LOGIN-001 Admin with valid credentials reaches the Dashboard @smoke', async () => {
    await login.login(env('ADMIN_USERNAME'), env('ADMIN_PASSWORD'));
    await login.expectLoggedIn();
  });

  test('LOGIN-002 wrong password shows "Invalid credentials" @smoke', async () => {
    await login.login(env('ADMIN_USERNAME'), 'WrongPass1!');
    await login.expectStillOnLogin();
    await expect(login.alert).toHaveText('Invalid credentials');
  });

  test('LOGIN-003 empty username and password show "Required"', async () => {
    await login.loginButton.click();
    await expect(login.requiredMessageFor(login.usernameInput)).toBeVisible();
    await expect(login.requiredMessageFor(login.passwordInput)).toBeVisible();
    await login.expectStillOnLogin();
  });

  test('US-AD-0001-TC-004 disabled user cannot log in, and a wrong password stays generic @smoke', async () => {
    // Correct password for a disabled account
    await login.login(env('DISABLED_USERNAME'), env('TEST_USER_PASSWORD'));
    await login.expectStillOnLogin();
    await expect(login.alert).toHaveText('Account disabled');

    // Wrong password for the same account must not reveal that it exists
    await login.login(env('DISABLED_USERNAME'), 'WrongPass1!');
    await login.expectStillOnLogin();
    await expect(login.alert).toHaveText('Invalid credentials');
  });
});

test.describe('Saved sessions', () => {
  test.use({ storageState: STORAGE_STATE.admin });

  test('LOGIN-004 saved Admin session opens the Dashboard without logging in', async ({ page }) => {
    await page.goto('/web/index.php/dashboard/index');
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Admin' })).toBeVisible();
  });
});
