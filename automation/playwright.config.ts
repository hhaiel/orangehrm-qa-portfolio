import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'path';

// Local settings and test credentials live in automation/.env (git-ignored).
dotenv.config({ path: path.resolve(__dirname, '.env'), quiet: true });

export default defineConfig({
  testDir: './tests',
  // OrangeHRM saves can take 4–6 s locally, so allow a little more than the 30 s default.
  timeout: 45_000,
  expect: { timeout: 10_000 },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  // The local Docker OrangeHRM can't serve 4+ browsers at once: page loads time out.
  // 2 workers ran 12/12 green; raise with WORKERS=n on a faster server.
  workers: Number(process.env.WORKERS ?? 2),
  reporter: [['html', { open: 'never' }], ['list']],

  use: {
    baseURL: process.env.BASE_URL ?? 'http://localhost:8080',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    // 1. Logs in once per role and saves the session, so tests don't repeat the login.
    { name: 'setup', testMatch: /.*\.setup\.ts/ },

    // 2. Tests that start already logged in (pick the role per spec with test.use).
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      dependencies: ['setup'],
      testIgnore: /.*\.setup\.ts/,
    },
  ],
});
