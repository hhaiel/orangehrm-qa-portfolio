import { test as setup } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { env, STORAGE_STATE } from '../utils/env';

/**
 * Runs before the other tests (see the "setup" project in playwright.config.ts).
 * Logs in once per role and saves the browser session to a file.
 * Tests then reuse it with: test.use({ storageState: STORAGE_STATE.admin })
 */

setup('authenticate as Admin', async ({ page }) => {
  const login = new LoginPage(page);
  await login.goto();
  await login.login(env('ADMIN_USERNAME'), env('ADMIN_PASSWORD'));
  await login.expectLoggedIn();
  await page.context().storageState({ path: STORAGE_STATE.admin });
});

setup('authenticate as Employee (ESS)', async ({ page }) => {
  const login = new LoginPage(page);
  await login.goto();
  await login.login(env('EMP_USERNAME'), env('TEST_USER_PASSWORD'));
  await login.expectLoggedIn();
  await page.context().storageState({ path: STORAGE_STATE.employee });
});
