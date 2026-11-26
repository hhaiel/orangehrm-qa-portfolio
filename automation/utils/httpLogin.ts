import { expect, request, type APIRequestContext } from '@playwright/test';

/**
 * Logs in over HTTP only (no browser) and returns a request context holding the session cookie.
 * The login form carries a CSRF token in the page HTML; it is posted back with the credentials.
 * Starts from an empty session on purpose: otherwise a test's storageState could be reused and
 * the login page would redirect to the Dashboard without a token.
 */
export async function httpLogin(baseURL: string | undefined, username: string, password: string): Promise<APIRequestContext> {
  const context = await request.newContext({ baseURL, storageState: { cookies: [], origins: [] } });
  const html = await (await context.get('/web/index.php/auth/login')).text();
  const token = html.match(/:token="&quot;([^&]+)&quot;"/)?.[1];
  expect(token, 'CSRF token on the login page').toBeTruthy();
  const response = await context.post('/web/index.php/auth/validate', {
    form: { _token: token!, username, password },
    maxRedirects: 0,
  });
  expect(response.headers()['location'] ?? '', `login as ${username} should redirect to the dashboard`).toContain('dashboard');
  return context;
}
