# Automation: Playwright + TypeScript

UI (and later API) tests for OrangeHRM OS 5.9, running against the local Docker install (`../docker`).

## Setup (once)
```powershell
cd automation
npm ci
npx playwright install chromium
copy .env.example .env   # fill in the same test values as docker/.env
```
OrangeHRM must be running at `BASE_URL` (default http://localhost:8080). See `../docs/environment-setup.md`.

## Run
| Command | What it does |
|---|---|
| `npm test` | All tests (headless) |
| `npm run test:smoke` | Only tests tagged `@smoke` |
| `npm run test:headed` | Watch the browser |
| `npm run test:ui` | Playwright UI mode (step through, time-travel) |
| `npm run report` | Open the last HTML report |
| `npm run typecheck` | TypeScript check, no tests |

## Structure
```
automation/
├── playwright.config.ts   ← baseURL from .env, 2 workers, trace/screenshot/video on failure
├── pages/                 ← Page Objects (LoginPage, …). Specs never use raw selectors
├── tests/
│   ├── auth.setup.ts      ← logs in once per role, saves sessions to playwright/.auth/
│   └── ui/                ← UI specs (login.spec.ts, …)
├── utils/env.ts           ← required settings + saved-session paths
└── .env.example           ← copy to .env (git-ignored)
```

## Conventions
- **Test titles start with the manual test case ID** (e.g. `US-AD-0001-TC-004 …`) so results trace back to `../test-cases/`. Supporting checks with no manual case use `LOGIN-001` style IDs.
- **Tags:** `@smoke` for the critical subset. Everything else is regression.
- **Locators:** role, label and placeholder first (`getByRole`, `getByPlaceholder`). No CSS/XPath in spec files.
- **No fixed waits** (`waitForTimeout`). Rely on auto-waiting and web-first assertions.
- **Sessions:** tests needing a logged-in user call `test.use({ storageState: STORAGE_STATE.admin })` instead of logging in each time.

## Known limitation: parallel workers
With 4 workers, page loads on the local Docker server timed out (45 s), while the same tests pass in ~2 s each with 1–2 workers. The default is therefore **2 workers** (`WORKERS=n` to change). Checked with `--repeat-each=2`: 12/12 passed.

## Status (Phase 3)
| Spec | Tests | Automates |
|---|---|---|
| `tests/auth.setup.ts` | 2 | Session setup (Admin, ESS) |
| `tests/ui/login.spec.ts` | 5 | US-AD-0001-TC-004 + LOGIN-001…004 |
