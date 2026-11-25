# OrangeHRM QA Automation Project (Playwright + TypeScript)

<!-- CI badge goes here in Phase 5 -->

> End-to-end QA of **OrangeHRM Open Source 5.x**, an open-source HR management system: manual test design plus a **Playwright** UI and API automation suite running in **GitHub Actions**.
> The full QA lifecycle: test plan → user stories and acceptance criteria → manual test cases → defects → automated regression → CI → test summary.

<!-- Replace the placeholders in [brackets] as you go. Delete this comment when done. -->

## At a glance

| | |
|---|---|
| **Application under test** | OrangeHRM Open Source 5.x ([public demo](https://opensource-demo.orangehrmlive.com)) |
| **Version tested** | [e.g. OrangeHRM OS 5.7, shown under the user menu → About] |
| **Modules in scope** | Leave, PIM, Admin (User Management) |
| **Testing type** | Functional, role-based access, negative/boundary, UI automation, API testing |
| **Automation stack** | Playwright, TypeScript, Page Object Model, GitHub Actions |
| **Browsers** | [e.g. Chromium, Firefox (automated); Chrome (manual)] |
| **Test period** | [start date] – [end date] |
| **Tools** | Playwright, VS Code, Docker, GitHub Actions, Google Sheets (test cases and defect log) |

## Results summary

<!-- Fill this in from docs/test-summary-report.md when execution is done. -->

| Metric | Value |
|---|---|
| User stories | [n] |
| Manual test cases written | [n] |
| Executed / Passed / Failed / Blocked | [n] / [n] / [n] / [n] |
| Defects logged | [n] ([x] High, [y] Medium, [z] Low) |
| Automated tests (UI / API) | [n] / [n] |
| Manual cases automated | [n] of [n] ([%]) |

**Top findings:**
1. [DEF-00X: one-line title]
2. [DEF-00X: one-line title]
3. [DEF-00X: one-line title]

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

<!-- Finish this in Phase 3. -->

```powershell
cd automation
npm ci
npx playwright install --with-deps
copy .env.example .env   # then fill in the URL and credentials
npx playwright test               # all tests
npx playwright test --grep @smoke # smoke subset
npx playwright show-report        # open the HTML report
```

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
