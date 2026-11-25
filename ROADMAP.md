# Roadmap: building this project step by step

**Strategy:** about 65% Playwright automation, 35% manual. The manual work (stories, test cases, defects) shows you think like a tester and becomes the list of what to automate. The Playwright suite and CI pipeline are the showcase.

**Total:** about 3–4 weeks part-time. Tick items off as you go. Each phase lists what "done" looks like.

```
Phase 0  Setup                       ½–1 day
Phase 1  User stories + ACs          1–2 days     ┐ manual (~1 week)
Phase 2  Manual test cases + bugs    3–4 days     ┘
Phase 3  Playwright foundations      2–3 days     ┐
Phase 4  Build the automation suite  5–7 days     │ automation (~2–3 weeks)
Phase 5  CI pipeline                 1–2 days     ┘
Phase 6  Report + polish             1 day
```

---

## Phase 0: Setup (½–1 day)
**Tools**
- [ ] Git (`git --version`)
- [ ] Node.js LTS, version 20 or newer (`node -v`)
- [ ] VS Code + the **Playwright Test for VS Code** extension
- [ ] Docker Desktop (needed in Phase 3 for a stable local OrangeHRM)
- [ ] GitHub account

**Project**
- [ ] `git init`, first commit, create a **public** GitHub repo, push
- [ ] Log in to the demo, open the user menu › **About**, and record the version in `README.md` + `docs/test-plan.md`
- [ ] Explore Admin, PIM and Leave for 30 min using [docs/module-reference.md](docs/module-reference.md) as a map
- [ ] Create a Google Sheet with two tabs, **Test Cases** and **Defect Log** (columns in `templates/`)

**Done when:** repo is on GitHub, version recorded, tools installed.

## Phase 1: User stories + ACs (1–2 days)
Scope is **Leave + PIM** in depth, plus **Admin › Users** lightly. OrangeHRM has no public requirements, so you reverse-engineer them.
- [ ] Copy `templates/user-story-template.md` → `user-stories/US-LV.md`, `US-PIM.md`, `US-AD.md`
- [ ] Write 3–6 testable ACs per story

| ID | Story | Automate later? |
|---|---|---|
| US-AD-0001 | Admin creates a system user for an existing employee | ✅ |
| US-AD-0002 | ESS user cannot access Admin functions | ✅ (role test) |
| US-PIM-0001 | HR adds a new employee (with and without login details) | ✅ |
| US-PIM-0002 | HR searches the employee list with filters | ✅ |
| US-PIM-0003 | HR edits personal details and uploads a profile photo | ✅ (file upload) |
| US-LV-0001 | Admin assigns a leave entitlement | ✅ (also API setup) |
| US-LV-0002 | Employee applies for leave (full and partial days) | ✅ |
| US-LV-0003 | Supervisor approves, rejects or cancels leave | ✅ (multi-role) |
| US-LV-0004 | System blocks invalid requests (no balance, overlap) | ✅ |

**Done when:** 3 story files, no `[placeholders]`.

## Phase 2: Manual test cases + defects (3–4 days)
- [ ] Run each story file through the **test-case-writer** skill → `test-cases/TC-<MOD>.md` + Sheet
- [ ] Target **25–30 test cases total**
- [ ] Mark each case **Auto** / **Manual-only** in the "Automation candidates" table of each `TC-<MOD>.md` (and as an extra last column in the Sheet). Manual-only examples: visual checks, one-off exploratory cases
- [ ] Execute all cases, fill in Status + Actual Results, save evidence to `evidence/`
- [ ] Failures → **bug-hunter** skill → `defects/defect-log.md`. Full reports for your **3 best bugs**
- [ ] Optional: one 60-min exploratory session (`templates/exploratory-session-template.md`)

**Done when:** all cases executed, defects logged, 15–20 cases marked "Auto".

## Phase 3: Playwright foundations (2–3 days)
- [ ] Run OrangeHRM locally with Docker ([docs/environment-setup.md](docs/environment-setup.md), Option B) and seed test data
- [ ] Scaffold `automation/`: `npm init playwright@latest` (TypeScript, Chromium first)
- [ ] `playwright.config.ts`: `baseURL` from `.env`, trace/screenshot/video on failure, HTML report
- [ ] `.env.example` committed, `.env` git-ignored (holds URL + test credentials)
- [ ] **Auth setup project:** log in once as Admin and once as ESS, save `storageState`, so tests don't log in every time
- [ ] First real test: login happy path + invalid credentials
- [ ] Use `npx playwright codegen <url>` to explore locators, then clean them up into role/label-based locators

**Done when:** `npx playwright test` passes locally with login tests and a report opens.

## Phase 4: Build the automation suite (5–7 days)
**Structure**
```
automation/
├── pages/          ← Page Object Model (LoginPage, EmployeeListPage, AddEmployeePage, ApplyLeavePage …)
├── fixtures/       ← custom fixtures (pages, logged-in roles, test data factory)
├── api/            ← API helpers (create employee, add entitlement, cleanup)
├── test-data/      ← JSON/TS data + upload files
├── tests/
│   ├── ui/         ← admin.spec.ts, pim.spec.ts, leave.spec.ts, access.spec.ts
│   └── api/        ← employees.api.spec.ts, leave.api.spec.ts
└── playwright.config.ts
```

**Checklist**
- [ ] Page objects for every screen under test, with no raw selectors inside spec files
- [ ] ~20 UI tests from your "Auto" cases. **Test titles start with the manual TC ID** for traceability, e.g. `test('US-LV-0002-TC-001 apply full-day leave', …)`
- [ ] Tags: `@smoke` (5–6 critical tests) and `@regression` (all)
- [ ] Role-based tests: the same page as Admin vs. ESS; ESS hitting Admin URLs is blocked
- [ ] **API-driven setup:** create the employee + entitlement via `request` before leave tests, and clean up after
- [ ] 5–8 API tests on `/web/index.php/api/v2/...` (status codes, response fields, validation errors)
- [ ] Unique test data per run (e.g. `QA_${Date.now()}`) so tests can run in parallel and re-run
- [ ] No `waitForTimeout`. Rely on auto-waiting and web-first assertions (`expect(locator).toBeVisible()`)
- [ ] Run 3× in a row with no flaky failures (`npx playwright test --repeat-each=3`)

**Done when:** ~25 tests (UI + API) green locally, stable on repeat runs.

## Phase 5: CI pipeline (1–2 days)
- [ ] `.github/workflows/playwright.yml`: on push/PR → start OrangeHRM in Docker → install → run tests → upload HTML report as an artifact
- [ ] Publish the report to GitHub Pages (optional, impressive)
- [ ] Add the CI status badge to `README.md`
- [ ] Store credentials as GitHub **Secrets**, never in the workflow file

> Known challenge: a fresh OrangeHRM container shows its install wizard. We'll solve it in this phase, e.g. a pre-seeded database dump plus config, or running `@smoke` against the public demo. We'll pick the option when we get here.

**Done when:** green badge on the README, report downloadable from Actions.

## Phase 6: Report + polish (1 day)
- [ ] Fill in [docs/test-summary-report.md](docs/test-summary-report.md) (manual + automation results)
- [ ] README: results table, top findings, CI badge, "how to run the tests", **test design decisions** section
- [ ] Short demo GIF of a test run in headed/UI mode (`npx playwright test --ui`)
- [ ] Remove all `[placeholders]`, re-read everything once
- [ ] Pin the repo on GitHub; add it to CV/LinkedIn as "OrangeHRM QA Automation (Playwright + TypeScript)"

---

## Interview talking points this project gives you
- How you derived requirements from an app with no docs
- Why you automated some cases and kept others manual
- Page Object Model + fixtures: why, and how they reduce maintenance
- API setup vs. UI setup: faster, more stable tests
- How you handled flaky tests and shared test data
- How CI runs your suite and what happens on failure
