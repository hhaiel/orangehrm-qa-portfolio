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
| `npm run test:api` | Only the REST API tests (no browser, < 1 min) |
| `npm run test:headed` | Watch the browser |
| `npm run test:ui` | Playwright UI mode (step through, time-travel) |
| `npm run report` | Open the last HTML report |
| `npm run typecheck` | TypeScript check, no tests |

## Structure
```
automation/
├── playwright.config.ts     ← baseURL from .env, 1 worker, trace/screenshot/video on failure
├── api/OrangeHrmApi.ts      ← REST API v2 client: create employees/users/entitlements, apply leave, cleanup
├── fixtures/index.ts        ← custom fixtures: adminApi, createPerson/trackEmployee/createHoliday (auto-cleanup), loginAs (browser), apiLoginAs (HTTP only)
├── pages/
│   ├── LoginPage.ts
│   ├── components/          ← Form (label-based fields, dropdowns, autocomplete, dates, toast), Navigation
│   ├── leave/               ← ApplyLeavePage, MyLeavePage, LeaveListPage, AddEntitlementPage
│   ├── pim/                 ← AddEmployeePage, EmployeeListPage, PersonalDetailsPage
│   └── admin/               ← SystemUsersPage, SaveUserPage
├── tests/
│   ├── auth.setup.ts        ← logs in once per role, saves sessions to playwright/.auth/
│   ├── api/                 ← REST API tests (separate `api` project, no browser)
│   └── ui/                  ← login, leave (@smoke), leave-regression, pim, admin specs
├── utils/                   ← env.ts (settings, session paths), dates.ts (working days in the leave period)
└── .env.example             ← copy to .env (git-ignored)
```

## How test data works
Leave tests don't rely on shared records. Each test creates **its own employees** (`createPerson`) and, where needed, **its own holidays** (`createHoliday`) through the API, with a login, an entitlement or a supervisor as needed, named `QA_PW <role> <unique suffix>`. When the test ends, even if it failed, the fixture deletes them. Deleting an employee also removes their user and leave. Dates are calculated (`utils/dates.ts`): a working day about a week ahead, inside the current leave period and not a holiday, so tests stay valid whatever day they run.

Verified: after repeated runs, 0 `QA_PW` employees, 0 `qa_pw_` users and 0 `QA_PW` holidays are left.

**Known defects in tests:** a check that fails because of a logged product bug is marked `test.fail()` with the DEF ID (e.g. DEF-001). The suite stays green, and Playwright flags the test as soon as the bug is fixed.

## Continuous integration
GitHub Actions runs everything on every push (see `../.github/workflows/playwright.yml` and the main README). A fresh OrangeHRM is installed with `../docker/ci-install.sh`, then the projects run in order: **seed** (creates shared data, idempotent), **setup** (saves Admin/ESS sessions), then **chromium** (UI) and **api**. In CI, `retries` is 1 and the `github` reporter adds failure annotations.

Run the same flow locally on a throwaway copy (port 8081, your normal install untouched):
```bash
sed 's/^APP_PORT=.*/APP_PORT=8081/' docker/.env > /tmp/ci.env
ENV_FILE=/tmp/ci.env COMPOSE_PROJECT=orangehrm-ci bash docker/ci-install.sh
cd automation && BASE_URL=http://localhost:8081 npx playwright test
docker compose -p orangehrm-ci down -v   # remove it afterwards
```

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

With these settings the full suite (52 tests: 41 UI + 9 API + 2 setup) passed **3 consecutive runs** (~4 min each), and the API project passed 5× in a row. A flaky toast check found earlier was fixed (see below).

| Gotcha found while building | Fix |
|---|---|
| `browser.newContext()` inside a test inherits the test's `storageState`, so a "fresh" login started as Admin | `loginAs` passes an empty `storageState` |
| Escape doesn't close OrangeHRM dropdowns; the next click closed it instead of opening it | Close by clicking the field again; `select()` only opens a closed list |
| The required `*` isn't part of label text | Compare labels without `*` |
| Two toasts can show at once ("Successfully Updated" + "No Records Found" when a list empties): strict-mode failure | `toast()` returns the toast container, which holds all toasts |
| `getByText(/^…$/)` didn't match "(9) Records Found" (surrounding whitespace) | Unanchored regex |
| Reading results right after Search returned an empty list | Wait for an expected row before reading |
| CI only: the unfiltered list was still shown after Search, so "row visible" passed against stale results | Poll until the *filtered* result is shown (US-AD-0001-TC-002) |

## Status
| Spec | Tests | Automates |
|---|---|---|
| `tests/auth.setup.ts` | 2 | Session setup (Admin, ESS) |
| `tests/ui/login.spec.ts` | 5 | US-AD-0001-TC-004 + LOGIN-001…004 |
| `tests/ui/leave.spec.ts` | 5 | US-LV-0001-TC-003, US-LV-0002-TC-001, US-LV-0003-TC-002, US-LV-0003-TC-006, US-LV-0004-TC-001 (all `@smoke`) |
| `tests/ui/leave-regression.spec.ts` | 13 | The other 12 Leave cases (`@regression`); US-LV-0001-TC-002 split in two, the `-1` part is `test.fail` (DEF-001) |
| `tests/ui/pim.spec.ts` | 11 | All 9 PIM cases; TC-003 and TC-005 split into several tests; `test.fail`: DEF-003, DEF-004, DEF-005 |
| `tests/ui/admin.spec.ts` | 7 | US-AD-0001-TC-001…003, US-AD-0002-TC-001/002; `test.fail`: DEF-005 (Add User form) |
| `tests/api/pim-admin.api.spec.ts` | 5 | API-001…005: list/pagination, validation (422 + field names), employee lifecycle, password policy, 401/403 access |
| `tests/api/leave.api.spec.ts` | 4 | API-006/006b/007/008: entitlement validation (`test.fail`: DEF-008), leave rules (400 messages), approve/reject/cancel |
| **Total** | **41 UI + 9 API + 2 setup** | **All 32 manual test cases automated**; 6 known-defect checks marked `test.fail` |

### API tests
The API project runs without a browser: Admin and Ellie use the saved sessions; other employees log in over HTTP (`apiLoginAs` reads the CSRF token from the login page and posts the form). Writing them found **DEF-008**: the server returns 500 for an entitlement of 10000 or more, which the UI hides with browser-side validation.

### What automation changed in the manual results
- **DEF-006 rejected:** the Password message *does* update after leaving the field, about 1 s later (async check). The manual check read it too early. Now a passing regression test.
- **DEF-007 rejected:** a small pdf correctly shows "File type not allowed"; the tester's pdf was over 1 MB, so "Attachment Size Exceeded" was accurate (size is checked first). Kept as a UX observation.
- **Answered:** deleting an employee also deletes their user account.
