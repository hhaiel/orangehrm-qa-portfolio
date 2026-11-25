# Automation: Playwright + TypeScript

UI (and later API) tests for OrangeHRM OS 5.9, running against the local Docker install (`../docker`).

## Setup (once)
```powershell
cd automation
npm ci
npx playwright install chromium
copy .env.example .env   # fill in the same test values as docker/.env
```
OrangeHRM must be running at `BASE_URL` (default http://localhost:8080), with the leave type **QA_AV Vacation** and a leave period configured (see `../docs/test-data.md`). See `../docs/environment-setup.md`.

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
├── playwright.config.ts     ← baseURL from .env, 1 worker, trace/screenshot/video on failure
├── api/OrangeHrmApi.ts      ← REST API v2 client: create employees/users/entitlements, apply leave, cleanup
├── fixtures/index.ts        ← custom fixtures: adminApi, createPerson (auto-cleanup), loginAs
├── pages/
│   ├── LoginPage.ts
│   ├── components/          ← Form (label-based fields, dropdowns, autocomplete, dates, toast), Navigation
│   └── leave/               ← ApplyLeavePage, MyLeavePage, LeaveListPage, AddEntitlementPage
├── tests/
│   ├── auth.setup.ts        ← logs in once per role, saves sessions to playwright/.auth/
│   └── ui/                  ← login.spec.ts, leave.spec.ts
├── utils/                   ← env.ts (settings, session paths), dates.ts (working days in the leave period)
└── .env.example             ← copy to .env (git-ignored)
```

## How test data works
Leave tests don't rely on shared records. Each test creates **its own employees** through the API (`createPerson`), with a login, an entitlement or a supervisor as needed, named `QA_PW <role> <unique suffix>`. When the test ends, even if it failed, the fixture deletes them. Deleting an employee also removes their user and leave. Dates are calculated (`utils/dates.ts`): a working day about a week ahead, inside the current leave period and not a holiday, so tests stay valid whatever day they run.

Verified: after repeated runs, 0 `QA_PW` employees and 0 `qa_pw_` users are left.

## Conventions
- **Test titles start with the manual test case ID** (e.g. `US-LV-0002-TC-001 …`) so results trace back to `../test-cases/`. Supporting checks with no manual case use `LOGIN-001` style IDs.
- **Tags:** `@smoke` for the critical subset. Everything else is regression.
- **Locators:** role, label and placeholder first. The few OrangeHRM CSS classes needed for custom controls live only in `pages/components/`. Spec files contain no selectors.
- **No fixed waits** (`waitForTimeout`). Rely on auto-waiting and web-first assertions.
- **Sessions:** tests needing the shared Admin/ESS user call `test.use({ storageState: STORAGE_STATE.admin })`. Tests needing a fresh user call `loginAs(person)`.

## Known limitations (local Docker server)
| What happened | Fix |
|---|---|
| 4 workers: login pages timed out (45 s) | Fewer workers |
| 2 workers + Leave flows: random failures, pages stalled with images/fonts never returned by the server | **1 worker by default** (`WORKERS=n` to change on a faster server) |
| First login after the server is idle takes 10+ s (cold caches) | Setup timeout 90 s; login redirect wait 20 s |
| Multi-user Leave flows take 15–40 s (saves take 4–6 s) | Leave spec timeout 90 s |

With these settings the full suite passed **12/12 in two consecutive runs** (~3.8 min), and the Leave smoke tests passed 3× in a row.

## Status
| Spec | Tests | Automates |
|---|---|---|
| `tests/auth.setup.ts` | 2 | Session setup (Admin, ESS) |
| `tests/ui/login.spec.ts` | 5 | US-AD-0001-TC-004 + LOGIN-001…004 |
| `tests/ui/leave.spec.ts` | 5 | US-LV-0001-TC-003, US-LV-0002-TC-001, US-LV-0003-TC-002, US-LV-0003-TC-006, US-LV-0004-TC-001 (all `@smoke`) |
