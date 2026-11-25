# Defect Log

> One row per defect. Generate rows with the **bug-hunter** skill, then paste here and create the matching Bug in Jira ([docs/jira-setup.md](../docs/jira-setup.md)). Put the Jira key in Notes as `Jira: OHRM-n`.
> Continue numbering from the last row. Full write-ups for key bugs go in `DEF-<nnn>.md` (see `templates/bug-report-template.md`).

**Summary:** 1 defect (0 Critical, 0 High, 0 Medium, 1 Low) · 1 needs confirmation

| Defect ID | Defect Title | Defect Description | Date Reported | Feature | Severity | Status | Category | Notes |
|---|---|---|---|---|---|---|---|---|
| DEF-001 | Negative entitlement shows misleading "decimal places" error | **Steps:** 1. Go to Leave › Entitlements › Add Entitlements. 2. Select an employee and leave type. 3. Enter `-1` in Entitlement and leave the field. **Expected:** A message that says what's wrong, e.g. "Should be a positive number" (US-LV-0001 AC3). **Actual:** "Should be a number with upto 2 decimal places". -1 is a number with no decimals, so the message doesn't explain the problem. The same message also appears for ` 5 ` (leading/trailing spaces). | 2026-11-25 | Leave › Add Entitlement | Low | New | Content | Found during AC verification; reproduced in US-LV-0001-TC-002 (2026-11-25), local OrangeHRM OS 5.9. Evidence: `evidence/DEF-001.jpg`. Also "upto" should be "up to". |
| DEF-002 | Entitlement of 0 days passes validation | **Steps:** 1. Go to Leave › Entitlements › Add Entitlements. 2. Select an employee and leave type. 3. Enter `0` in Entitlement and leave the field. **Expected:** 0 is rejected, since adding 0 days has no effect (assumption). **Actual:** No validation error; Save is allowed. | 2026-11-25 | Leave › Add Entitlement | Low | New | Functional | **Needs confirmation:** expected behavior isn't documented. Saving 0 wasn't tried yet. Re-test by saving and checking the entitlement list. |

## Observations (not defects)
- **Leave balance shows 0.00 for an invalid date range:** on Leave › Apply, entering a To Date earlier than the From Date changes Leave Balance from 5.00 to 0.00. That could confuse users. Showing the balance unchanged or blank would be clearer.
- **"To date should be after from date":** the same day is also valid, so "on or after" would be more accurate.
- **Supervisor name wraps badly in narrow windows:** on PIM › Report-to, the assigned supervisor card wrapped "QA_AV Sam Supervisor" mid-word at a ~900px-wide window. Re-check at normal desktop width before logging.
- **Cancelling leave has no confirmation:** on Leave › My Leave, one click on Cancel immediately cancels the request ("Successfully Updated") and it can't be undone. A confirmation dialog would prevent accidental cancellations. (US-LV-0003-TC-004)
- **Overlap details can be off-screen:** after an overlapping Apply, the page stays scrolled down, so only the vague "Failed to Submit" toast is visible. The "Overlapping Leave Request(s) Found" table is at the top of the page. (US-LV-0004-TC-002)
- **"Add" from the entitlement list isn't pre-filled:** clicking Add on an employee's Leave Entitlements list opens an empty Add form, so the employee and leave type have to be re-entered. (US-LV-0001-TC-003)
- **No "Evening" option:** half-day options are Morning (09:00–13:00) and Afternoon (13:00–17:00). Not a bug; the draft AC was corrected.
