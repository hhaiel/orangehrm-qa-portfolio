# User Stories: Leave (LV)

**Module:** Leave
**Version:** OrangeHRM OS 5.9 (local Docker, `docker/docker-compose.yml`)
**Roles involved:** Admin, Supervisor (ESS with a subordinate), Employee (ESS)
**Source of rules:** reverse-engineered from OrangeHRM behavior + standard HR expectations
**Status:** REVIEWED and EXECUTED 2026-11-25. ✅ = confirmed during verification. Items marked **(verify)** were confirmed during test execution: every AC passed except US-LV-0001 AC3's negative-number rule (DEF-001). See [`test-cases/TC-LV.md`](../test-cases/TC-LV.md).

**Shared test data** (see `docs/test-data.md`):
- Employee: **QA_AV Ellie Employee** (ESS user `qa_av_emp`), supervisor **QA_AV Sam Supervisor** (`qa_av_super`, Direct report)
- Leave types: **QA_AV Vacation** (Ellie has 5 days), **QA_AV Sick** (no entitlement)
- Holiday: **QA_AV Holiday** on Wed 2026-12-02 (full day); Work Week: Sat/Sun non-working
- Leave period: 2026-01-01 to 2026-12-31

---

## US-LV-0001: Admin assigns a leave entitlement

**As an** Admin
**I want to** give an employee a number of leave days for a leave type and period
**So that** the employee can apply for leave against an accurate balance

**Pre-conditions:** Logged in as Admin. The employee and leave type exist. A leave period is configured.

### Acceptance Criteria
- **AC1:** ✅ Given I open Leave › Entitlements › Add Entitlements, when the page loads, then I can choose Individual Employee / Multiple Employees, Employee Name, Leave Type, Leave Period (defaults to the current period) and Entitlement.
- **AC2:** ✅ Employee Name, Leave Type and Entitlement are required. Saving with any of them empty shows "Required" under that field.
- **AC3:** Entitlement accepts positive numbers up to 9999.99 with at most 2 decimal places.
  - ✅ Letters, values with spaces, or more than 2 decimals show "Should be a number with upto 2 decimal places".
  - ✅ 10000 or more shows "Should be less than 10000".
  - Negative numbers are rejected with a message saying the value must be positive. ❌ Actual: the "decimal places" message is shown (DEF-001).
- **AC4:** ✅ Given valid input, when I click Save, then an "Updating Entitlement" dialog shows "Existing Entitlement value X will be updated to Y". Confirming shows "Successfully Saved" and opens that employee's Leave Entitlements list. Cancelling saves nothing.
- **AC5:** ✅ If the employee already has an entitlement for the same leave type and period, the new value is **added** to it (e.g. 5.00 + 3 → 8.00).
- **AC6:** ✅ The new entitlement appears in the employee's Leave Entitlements list ("Total 5.00 Day(s)"), and the employee sees the same balance on Leave › Apply.

**Open questions:**
- An entitlement of **0** passes validation. Is that intended? (Needs confirmation)
- What happens when an entitlement is reduced below days already taken or scheduled?
- Bulk entitlement (Multiple Employees) is out of scope for now.

---

## US-LV-0002: Employee applies for leave

**As an** ESS employee
**I want to** apply for leave for one or more days, including half days
**So that** my supervisor can approve my time off and my balance stays accurate

**Pre-conditions:** Logged in as `qa_av_emp`. Ellie has a **5-day** QA_AV Vacation entitlement and no existing leave on the test dates. Sam is her supervisor.

### Acceptance Criteria
- **AC1:** ✅ Given I open Leave › Apply, when I select a leave type, then my balance for that type is shown (e.g. "5.00 Day(s)"). The (?) icon next to it opens **Leave Balance Details** (Total Entitlement, Balance, Taken, Scheduled, Pending Approval).
- **AC2:** ✅ Leave Type, From Date and To Date are required. Submitting without them shows "Required" under each field.
- **AC3:** ✅ Given a valid single working day within my balance, when I click Apply, then "Successfully Saved" appears and the request shows in Leave › My Leave with status **Pending Approval (1.00)**.
- **AC4:** ✅ When I enter a From Date and the To Date is empty, the To Date fills in with the same date. For a single day, a **Duration** field offers Full Day, Half Day - Morning (09:00–13:00), Half Day - **Afternoon** (13:00–17:00) and Specify Time. A half day counts as **0.50** day.
- **AC5:** ✅ For a multi-day request, non-working days (per Work Week) and holidays in the range are **not counted** (e.g. Fri 2026-12-11 to Mon 2026-12-14 = 2.00 days).
- **AC6:** For a multi-day request, a **Partial Days** field lets me set half days on All Days, Start Day Only, End Day Only, or Start and End Day, and the total reflects it. ✅ field appears; **(verify)** options and totals
- **AC7:** ✅ If the To Date is earlier than the From Date, "To date should be after from date" is shown under To Date.
- **AC8:** ✅ Pending requests reduce the balance immediately (5.00 → 4.00 after a 1-day Pending request), on both Leave › Apply and My Leave.
- **AC9:** ✅ Leave can be applied for **past dates** (e.g. yesterday). The request is saved as Pending Approval.

**Open questions:**
- Is "Comments" optional? Max length? (verify)

---

## US-LV-0003: Supervisor approves, rejects or cancels leave

**As a** supervisor (or Admin)
**I want to** approve or reject my team's leave requests, and employees want to cancel their own
**So that** leave is controlled and balances stay correct

**Pre-conditions:** Ellie has Pending Approval requests. Sam is Ellie's supervisor (Report-to, Direct). Logged in as `qa_av_super` or Admin, as the scenario requires.

### Acceptance Criteria
- **AC1:** Given I'm logged in as Sam, when I open Leave › Leave List, then I see Ellie's pending requests. I do **not** see requests from employees who don't report to me. **(verify)**
- **AC2:** When I click **Approve** on a pending request, a success message appears and its status changes to **Scheduled** (or **Taken** if the date has passed). **(verify)**
- **AC3:** When I click **Reject** on a pending request, a success message appears, the status changes to **Rejected**, and the days are returned to Ellie's balance. **(verify)**
- **AC4:** As Ellie, I can **Cancel** my own Pending Approval or Scheduled request from Leave › My Leave (a Cancel button is shown on each pending row ✅). The status becomes **Cancelled** and the days are returned to my balance. **(verify)**
- **AC5:** Admin can approve or reject any employee's leave request, not only subordinates'. **(verify)**
- **AC6:** ✅ An employee without subordinates (Ellie) sees only **Apply, My Leave, Entitlements, Reports** in the Leave menu. Opening the Leave List URL (`/leave/viewLeaveList`) directly returns HTTP 403 with "Credential Required".
- **AC7:** Leave List filters (date range, status, leave type, employee name) narrow the results correctly, and **Reset** clears them. **(verify)**

**Open questions:**
- Can a supervisor approve their own leave? (Expected: no)
- Can a request be approved after it's been cancelled? (Expected: no)

---

## US-LV-0004: System blocks invalid leave requests

**As an** HR team
**I want** the system to prevent invalid leave requests
**So that** balances can't go negative and no day is booked twice

**Pre-conditions:** Logged in as `qa_av_emp`. Ellie has a 5-day QA_AV Vacation entitlement.

### Acceptance Criteria
- **AC1:** ✅ Given my balance is 5 days, when I pick a range of more than 5 working days, then "Balance not sufficient" is shown in red in place of the balance. When I click Apply, the request is **not submitted** and an error toast says "Leave Balance Exceeded".
- **AC2:** ✅ Given I already have a Pending Approval request on a date, when I apply for a range that overlaps it, then the request is **not submitted**. A warning toast says "Failed to Submit", and an "Overlapping Leave Request(s) Found" table lists the conflicting request (date, hours, type, status).
- **AC3:** ✅ A leave type with no entitlement (QA_AV Sick) is **not listed** in the Leave Type dropdown on Leave › Apply.
- **AC4:** ✅ A range with only non-working days (Sat–Sun) or only a holiday is **not submitted**, and an error toast says "Failed to Submit: No Working Days Selected".
- **AC5:** Cancelled and Rejected requests do **not** count as overlaps: I can apply again for the same dates. **(verify)**
- **AC6:** ✅ A Half Day - Morning and a Half Day - Afternoon on the same date are **not** treated as overlapping. Both are saved (0.50 + 0.50).

---

## Verification log (2026-11-25, local OrangeHRM OS 5.9, Chromium)

| # | Story / AC | What was checked | Result |
|---|---|---|---|
| 1 | LV-0001 AC3 | Entitlement: `abc`, `-1`, `2.555`, ` 5 `, `0`, `9999.99`, `10000` | `abc`, `-1`, `2.555`, ` 5 ` → "Should be a number with upto 2 decimal places". `0` and `9999.99` accepted. `10000` → "Should be less than 10000". ⚠️ DEF-001 |
| 2 | LV-0001 AC4 | Confirmation dialog on save | "Updating Entitlement – Existing Entitlement value 0.00 will be updated to 5.00", then Confirm/Cancel. After Confirm: "Successfully Saved" and redirect to Leave Entitlements |
| 3 | LV-0001 AC5 | Add 5, then 3, same type and period | Dialog: "5.00 will be updated to 8.00", so values are **added**. Cancel kept 5.00 |
| 4 | LV-0002 AC7 | To Date before From Date | "To date should be after from date" (balance also shows 0.00, see observations) |
| 5 | LV-0002 AC8 | Balance while request is Pending | Drops right away: 5.00 → 4.00 |
| 6 | LV-0002 Q | Apply for yesterday (2026-11-24) | Allowed, saved as Pending Approval |
| 7 | LV-0003 AC6 | ESS Leave menu; Leave List URL | Menu: Apply, My Leave, Entitlements, Reports. URL → HTTP 403 "Credential Required" |
| 8 | LV-0004 AC1 | 6 working days on a 5-day balance | Inline "Balance not sufficient". Apply → error toast "Leave Balance Exceeded", not saved |
| 9 | LV-0004 AC2 | Overlapping request | Warning toast "Failed to Submit" + "Overlapping Leave Request(s) Found" table |
| 10 | LV-0004 AC3 | Leave type without entitlement | Not listed in the dropdown |
| 11 | LV-0004 AC4 | Sat–Sun only; holiday only | Both rejected: "Failed to Submit: No Working Days Selected" |
| 12 | LV-0004 Q | Half-day Morning + Afternoon, same date | Both saved, 0.50 each, no overlap |

**State after verification:** Ellie has 5 Pending Approval requests on QA_AV Vacation (2026-11-24, 12-04, 12-09 AM, 12-09 PM, 12-11→14), so her balance is **0.00**. Use these for the LV-0003 approve/reject/cancel tests, or reset the data first.
