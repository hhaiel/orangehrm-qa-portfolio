# CLAUDE.md: project conventions

Manual QA portfolio project testing **OrangeHRM Open Source 5.x**. Read this before helping in this repo.

## Context
- The app has **no official requirements**. User stories and ACs in `user-stories/` are the source of truth for expected behavior.
- When behavior isn't covered by an AC, flag it as **"Needs confirmation"**. Don't invent rules.
- `docs/module-reference.md` lists *observed/typical* behavior to explore. Items marked **(verify)** are not confirmed.
- Scope: see `docs/test-plan.md` (default: Admin › User Management, PIM, Leave).

## IDs
| Artifact | Format | Example |
|---|---|---|
| Module codes | AD, PIM, LV, TM, RC, CL, PF, MI | `LV` = Leave |
| User story | `US-<MOD>-<4 digits>` | `US-LV-0002` |
| Acceptance criterion | `AC<n>` within a story | `AC3` |
| Test case | `<US ID>-TC-<3 digits>` | `US-LV-0002-TC-004` |
| Defect | `DEF-<3 digits>`, global sequence | `DEF-012` |
| Evidence file | `<TC or DEF ID>[-n].png` | `DEF-012-2.png` |

## Where things live
- Markdown in this repo is the **source of truth** for stories, test cases and the defect log.
- Defects are also tracked in **Jira** (project key `OHRM`, see `docs/jira-setup.md`). The Jira key goes in the defect log's Notes column as `Jira: OHRM-n`.
- Google Sheets is optional scratch space only. Never treat it as the record.

## Formats (must match the skills)
- **Test cases** (use the `test-case-writer` skill), columns in order:
  `Test Case ID | Feature Name | Test Case/Scenario | Pre-requisite | Test Steps | Test Data | Expected Results | Browsers | Status | Actual Results`
- **Defects** (use the `bug-hunter` skill), columns in order:
  `Defect ID | Defect Title | Defect Description | Date Reported | Feature | Severity | Status | Category | Notes`
- Severity: Critical / High / Medium / Low. Category: Functional, UI/Display, Content, Data Discrepancy, Performance, Error.
- Test status values: Pass, Fail, Blocked, Not Run.

## Files
- One story file per module: `user-stories/US-<MOD>.md`
- One test case file per module: `test-cases/TC-<MOD>.md`
- Defect log: `defects/defect-log.md` (one table). Detailed write-ups: `defects/DEF-<nnn>.md`
- Before adding IDs, read the existing file so numbering continues and nothing is duplicated.

## Automation (`automation/`)
- Playwright + TypeScript. Page Object Model in `pages/`, custom fixtures in `fixtures/`, API helpers in `api/`, specs in `tests/ui` and `tests/api`.
- Test titles start with the manual TC ID: `test('US-LV-0002-TC-001 apply full-day leave', …)`. Tag with `@smoke` / `@regression`.
- Locators: prefer `getByRole`, `getByLabel`, `getByText`. Avoid CSS/XPath unless there's no accessible option, and never put raw selectors in spec files.
- No `waitForTimeout`. Use web-first assertions. Unique data per run (`QA_${Date.now()}`). Set up data through the API where possible and clean up after.
- Config and secrets come from `.env` (git-ignored). Keep `.env.example` up to date. Never commit credentials.
- Target environment for automation is local Docker OrangeHRM, not the public demo.
- The learner is new to coding: explain new patterns briefly when introducing them.

## Style
- Business-friendly language, short sentences, one action per test step.
- No login step in test steps (login goes in Pre-requisite).
- Test data names use the `QA_` prefix (see `docs/test-data.md`) because the public demo is shared.
