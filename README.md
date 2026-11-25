# OrangeHRM QA Automation Project (Playwright + TypeScript)

<!-- CI badge goes here in Phase 5 -->

> End-to-end QA of **OrangeHRM Open Source 5.x**, an open-source HR management system: manual test design plus a **Playwright** UI and API automation suite running in **GitHub Actions**.
> The full QA lifecycle: test plan → user stories and acceptance criteria → manual test cases → defects → automated regression → CI → test summary.

<!-- Replace the placeholders in [brackets] as you go. Delete this comment when done. -->

## At a glance

| | |
|---|---|
| **Application under test** | OrangeHRM Open Source 5.x ([public demo](https://opensource-demo.orangehrmlive.com)) |
| **Version tested** | OrangeHRM OS 5.9 (public demo, checked 2026-11-25) |
| **Modules in scope** | Leave, PIM, Admin (User Management) |
| **Testing type** | Functional, role-based access, negative/boundary, UI automation, API testing |
| **Automation stack** | Playwright, TypeScript, Page Object Model, GitHub Actions |
| **Browsers** | [e.g. Chromium, Firefox (automated); Chrome (manual)] |
| **Test period** | [start date] – [end date] |
| **Tools** | Playwright, VS Code, Docker, GitHub Actions, Jira (defect tracking), Markdown (test documentation) |

## Results summary

<!-- Fill this in from docs/test-summary-report.md when execution is done. -->

| Metric | Value |
|---|---|
| User stories | 9 (Leave 4, PIM 3, Admin 2) |
| Manual test cases written | 32 (Leave 17, PIM 9, Admin 6) |
| Executed / Passed / Failed / Blocked | 32 / 26 / 6 / 0 (81% pass) |
| Defects logged | 7 (0 High, 2 Medium, 5 Low; 1 needs confirmation) + 8 observations |
| Automated tests (UI / API) | 5 / 0 (+2 auth setup), all passing. Phase 3 in progress |
| Manual cases automated | [n] of [n] ([%]) |

**Top findings:**
1. DEF-004 (Medium): Date of Birth accepts a future date
2. DEF-003 (Medium): untrimmed spaces in employee names are saved and break list sorting
3. DEF-001 (Low): negative leave entitlement shows a misleading "decimal places" error
<!-- Update as PIM/Admin testing adds findings. -->

## Repo structure

```
orangehrm-qa-portfolio/
├── README.md                     ← you are here (portfolio landing page)
├── ROADMAP.md                    ← step-by-step checklist for building this project
├── CLAUDE.md                     ← conventions, so AI help stays consistent
├── docs/
│   ├── test-plan.md              ← scope, approach, entry/exit criteria, risks
│   ├── module-reference.md       ← what each module does, its rules, test ideas
│   ├── test-data.md              ← test accounts and records, naming rules
│   ├── environment-setup.md      ← demo site vs. local Docker install
│   ├── jira-setup.md             ← how defects are tracked in Jira
│   └── test-summary-report.md    ← final results (fill in at the end)
├── templates/                    ← copy these to start new work
├── user-stories/                 ← US + AC per module
├── test-cases/                   ← test case tables per module
├── defects/                      ← defect log + detailed bug reports
├── evidence/                     ← screenshots / recordings, named by TC or DEF ID
├── automation/                   ← Playwright suite (pages/, fixtures/, api/, tests/)
└── .github/workflows/            ← CI pipeline
```

## Running the automated tests

Requires the local OrangeHRM from `docker/` to be running (see [docs/environment-setup.md](docs/environment-setup.md)).

```powershell
cd automation
npm ci
npx playwright install chromium
copy .env.example .env   # then fill in the same test values as docker/.env
npm test                 # all tests
npm run test:smoke       # @smoke subset
npm run report           # open the HTML report
```

Details, conventions and the current suite status are in [automation/README.md](automation/README.md).

## How to read this project

1. Start with the **[Test Plan](docs/test-plan.md)** for the what and why.
2. Open the **[User Stories](user-stories/)** to see the reverse-engineered requirements.
3. Review the **[Test Cases](test-cases/)**. Each one traces back to its acceptance criteria.
4. See the **[Defects](defects/)** for what I found, with steps to reproduce and evidence.
5. Finish with the **[Test Summary Report](docs/test-summary-report.md)**.

## What this project demonstrates

- Turning an app with **no written requirements** into testable user stories and acceptance criteria
- Risk-based test design: happy paths, validations, boundaries, negative and role-based cases
- Clear, reproducible **defect reporting** with severity and evidence
- **Traceability** from user story → AC → test case → defect → automated test
- Maintainable **Playwright** automation: Page Object Model, fixtures, role-based auth, API-driven test data
- **API testing** of OrangeHRM's REST endpoints
- **CI/CD**: the regression suite runs on every push in GitHub Actions

## About me

[Your name], QA Tester. [LinkedIn] · [Email]
