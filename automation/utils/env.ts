import path from 'path';

/**
 * Reads a required setting from automation/.env (loaded in playwright.config.ts).
 * Fails fast with a clear message instead of typing "undefined" into a form.
 */
export function env(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing ${name}. Copy automation/.env.example to automation/.env and fill it in.`);
  }
  return value;
}

/** Saved login sessions (git-ignored), created by tests/auth.setup.ts. */
export const STORAGE_STATE = {
  admin: path.join(__dirname, '..', 'playwright', '.auth', 'admin.json'),
  employee: path.join(__dirname, '..', 'playwright', '.auth', 'employee.json'),
};
