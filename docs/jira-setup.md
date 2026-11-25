# Jira setup guide (defect tracking)

**Why Jira:** it shows up in most QA job posts. Logging this project's bugs there gives you real, honest Jira experience to talk about in interviews.

**How it fits the project:**
- `defects/defect-log.md` in the repo stays the **source of truth**, the part reviewers can see.
- Jira is where you **manage** the bugs (board, statuses, priority), the way a real team does.
- The Jira key (e.g. `OHRM-7`) goes in the **Notes** column of the defect log, so both stay linked.
- Free Jira projects **can't be made public**, so you'll show Jira through screenshots in the README (step 8).

Time needed: about 30–45 min.

> Jira's menus change often. If a button below has moved, look for the same words nearby or search Jira's help for the step name.

---

## 1. Create a free Jira site
1. Go to **atlassian.com/software/jira/free** and sign up (the Free plan allows up to 10 users).
2. Choose a site name, e.g. `ariane-qa.atlassian.net`. Keep it professional, since it may show in screenshots.
3. Skip inviting teammates.

## 2. Create the project
1. **Projects › Create project**
2. Template: **Kanban** (Software development), or **Bug tracking** if it's offered
3. Type: **Team-managed**, which is simpler and lets you edit fields and statuses yourself
4. Name: `OrangeHRM QA`, Key: `OHRM`

## 3. Set up the workflow (statuses)
**Project settings › Board › Columns** (or **Workflow**). Rename or add columns so they read:

| Column | Meaning in this project |
|---|---|
| **New** | Just logged |
| **Confirmed** | Re-tested, it reproduces |
| **Needs confirmation** | Expected behavior unclear (matches the bug-hunter tag) |
| **Closed** | Verified, or accepted as known behavior |
| **Won't Fix** | Intended behavior / not a bug after all |

There's no dev team here, so you don't need In Progress / In Review columns.

## 4. Add custom fields to the Bug work type
**Project settings › Work types (Issue types) › Bug**, then drag in fields:

| Field | Type | Values |
|---|---|---|
| **Severity** | Dropdown | Critical, High, Medium, Low |
| **Category** | Dropdown | Functional, UI/Display, Content, Data Discrepancy, Performance, Error |
| **Module** | Dropdown | Admin, PIM, Leave, Login, Other |
| **Environment** | Short text | e.g. `Demo, OrangeHRM OS 5.9, Chrome 1xx, Win 11` |
| **Related test case** | Short text | e.g. `US-LV-0003-TC-004` |
| **Repo defect ID** | Short text | e.g. `DEF-007` |

Keep the built-in fields **Priority**, **Labels** and **Attachments**.

**Severity vs. Priority:** Severity = how bad the impact is (from your defect log). Priority = how urgently it should be fixed. You set both, which is a good interview point.

## 5. Bug description template
Paste this into each bug's **Description** (it matches `templates/bug-report-template.md`):

```
*Summary*
<one sentence: what happens and why it matters>

*Pre-conditions*
- Logged in as <role/user>
- <required data>

*Steps to reproduce*
# Go to <Module › Page>
# <action>
# <action>

*Expected result*
<what should happen, citing the AC, e.g. US-LV-0003 AC4>

*Actual result*
<what happens, with exact text/values>

*Evidence*
See attachments: DEF-<nnn>-1.png
```

**Summary (title) format:** `[Module] What is wrong + where`, e.g. `[Leave] Balance not restored after cancelling an approved request`

**Labels:** `manual`, `automation-found` (for bugs your Playwright tests catch), `regression`

## 6. Logging workflow
For each failed test case:
1. Run the **bug-hunter** skill → add the row to `defects/defect-log.md`
2. Create the Bug in Jira using the template above, and attach the screenshots from `evidence/`
3. Copy the Jira key into the defect log's **Notes** column: `Jira: OHRM-7`
4. Move the card as you re-test: New → Confirmed / Needs confirmation → Closed / Won't Fix

**Bulk option:** if you already have many rows, Jira can import a CSV (**Settings › System › External system import › CSV**, if your plan shows it). Ask Claude to turn `defect-log.md` into a CSV with matching columns.

## 7. Optional: connect Jira to GitHub
Install the **GitHub for Jira** app (Apps › Explore more apps) and connect it to `hhaiel/orangehrm-qa-portfolio`. Then a commit message like:

```
OHRM-7 Add regression test for leave balance after cancellation
```

shows up on the Jira ticket. This proves the bug → automated test link, which makes a strong portfolio story.

## 8. Screenshots for the README (do this in Phase 6)
Save to `evidence/jira/`:
- [ ] `board.png`: the Kanban board with bugs across columns
- [ ] `bug-detail.png`: your best-written bug ticket (full view)
- [ ] `filter.png`: optional, a filter or list view grouped by Severity

**Before saving, crop or blur:** your email, your profile picture (if you prefer), and any other Atlassian account details.

Then add a **"Defect tracking in Jira"** section to the README with the screenshots and one line explaining the setup.
