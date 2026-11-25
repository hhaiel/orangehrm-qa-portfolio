# Test Cases: [Module name] ([MOD])

> Copy to `test-cases/TC-<MOD>.md`. Generate rows with the **test-case-writer** skill, then paste here **and** into the Google Sheet (Test Cases tab).
> Columns match the sheet exactly. Don't reorder.

**Source stories:** `user-stories/US-[MOD].md`
**Browser:** [e.g. Chrome 1xx]
**Version:** [OrangeHRM 5.x]

## AC gaps found
- [US-XX-0001 AC2: unclear what happens when … → tagged Needs confirmation]

## Test cases

| Test Case ID | Feature Name | Test Case/Scenario | Pre-requisite | Test Steps | Test Data | Expected Results | Browsers | Status | Actual Results |
|---|---|---|---|---|---|---|---|---|---|
| US-LV-0002-TC-001 | Leave – Apply | Verify employee can submit a valid full-day leave request (AC1, AC3) | ESS user `qa_av_emp` is logged in; has 5-day QA_AV Vacation entitlement | 1. Go to Leave › Apply<br>2. Select Leave Type "QA_AV Vacation"<br>3. Set From Date and To Date to next working Monday<br>4. Click Apply | Leave Type: QA_AV Vacation; Date: [next Mon] | 1. Apply Leave page opens<br>2. Balance shows 5.00 Day(s)<br>4. "Successfully Saved" appears; request listed in My Leave as Pending Approval, 1.00 day | Chrome | | |
| | | | | | | | | | |

## Coverage
- [n] test cases. US-LV-0002: AC1 → TC-001, AC3 → TC-001 …
- Not covered: [AC + reason]

## Automation candidates
| Test Case ID | Auto / Manual-only | Reason | Automated in (spec file) |
|---|---|---|---|
| US-LV-0002-TC-001 | Auto | Core regression flow | `tests/ui/leave.spec.ts` |

## Execution log
| Date | Environment / version | Executed | Pass | Fail | Blocked | Notes |
|---|---|---|---|---|---|---|
| | | | | | | e.g. demo reset at 14:00, re-ran TC-003 |

---
**Status values:** Pass · Fail · Blocked · Not Run
**Writing reminders:** start each scenario with "Verify" · no login step (it goes in Pre-requisite) · one action per step · expected results must be observable · on Fail, write the exact actual message/value and link the DEF ID in Actual Results.
