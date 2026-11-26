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
  // The local Docker OrangeHRM stops answering some requests under concurrent load:
  // 4 workers broke the login tests, and 2 workers made the multi-user Leave flows flaky
  // (pages stalled with images/fonts never returned). 1 worker is reliable.
  // Raise with WORKERS=n on a faster server (e.g. CI).
  workers: Number(process.env.WORKERS ?? 1),
  // In GitHub Actions the 'github' reporter adds failure annotations to the run summary.
  reporter: process.env.CI
    ? [['github'], ['html', { open: 'never' }], ['list']]
    : [['html', { open: 'never' }], ['list']],

  use: {
    baseURL: process.env.BASE_URL ?? 'http://localhost:8080',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    // 0. Creates the shared data a fresh install lacks (leave period/types, Ellie, disabled user).
    //    Idempotent: does nothing on an install that already has it.
    { name: 'seed', testMatch: /seed\.setup\.ts/ },

    // 1. Logs in once per role and saves the session, so tests don't repeat the login.
    { name: 'setup', testMatch: /auth\.setup\.ts/, dependencies: ['seed'] },

    // 2. UI tests in Chromium (pick the role per spec with test.use).
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      dependencies: ['setup'],
      testIgnore: [/.*\.setup\.ts/, /tests[\\/]api[\\/]/],
    },

    // 3. REST API tests: no browser, they reuse the saved sessions via the `request` fixture.
    {
      name: 'api',
      testMatch: /tests[\\/]api[\\/].*\.spec\.ts/,
      dependencies: ['setup'],
    },
  ],
});
