# User Stories: Leave (LV)

**Module:** Leave
**Version:** OrangeHRM OS 5.9
**Roles involved:** Admin, Supervisor (ESS with a subordinate), Employee (ESS)
**Source of rules:** reverse-engineered from OrangeHRM behavior + standard HR expectations
**Status:** DRAFT. ACs marked **(verify)** must be checked in the app before writing test cases (see the checklist at the bottom).

**Shared test data** (see `docs/test-data.md`):
- Employee: **QA_AV Ellie Employee** (ESS user `qa_av_emp`), supervisor **QA_AV Sam Supervisor** (`qa_av_super`)
- Leave type: **QA_AV Vacation** (or an existing type such as "CAN - Vacation")
- Holiday: **QA_AV Holiday** on a weekday; Work Week: Sat/Sun non-working

---

## US-LV-0001: Admin assigns a leave entitlement

**As an** Admin
**I want to** give an employee a number of leave days for a leave type and period
**So that** the employee can apply for leave against an accurate balance

**Pre-conditions:** Logged in as Admin. The employee and leave type exist. A leave period is configured.

### Acceptance Criteria
- **AC1:** Given I open Leave › Entitlements › Add Entitlements, when the page loads, then I can choose Individual Employee, Employee Name, Leave Type, Leave Period and Entitlement.
- **AC2:** Employee Name, Leave Type, Leave Period and Entitlement are required. Saving with any of them empty shows "Required" under that field.
- **AC3:** Entitlement accepts positive numbers with up to 2 decimal places (e.g. 5, 2.5). Letters, negative numbers or more than 2 decimals show a validation message and are not saved. **(verify exact message and limits)**
- **AC4:** Given valid input, when I click Save, then a confirmation shows the existing and new entitlement values **(verify)**. When I confirm, a success message appears and I'm taken to that employee's Entitlements list.
- **AC5:** If the employee already has an entitlement for the same leave type and period, the new value is **added** to the existing one (e.g. 5 + 3 = 8 days). **(verify: added or replaced?)**
- **AC6:** The new entitlement appears in Leave › Entitlements › Employee Entitlements, and the employee sees the matching balance on Leave › Apply when they select that leave type.

**Assumptions / open questions:**
- What happens when an entitlement is reduced below days already taken or scheduled?
- Bulk entitlement (Multiple Employees by Location / Sub Unit) is out of scope for now.

---

## US-LV-0002: Employee applies for leave

**As an** ESS employee
**I want to** apply for leave for one or more days, including half days
**So that** my supervisor can approve my time off and my balance stays accurate

**Pre-conditions:** Logged in as `qa_av_emp`. Ellie has a **5-day** QA_AV Vacation entitlement in the current period and no existing leave on the test dates. Sam is her supervisor.

### Acceptance Criteria
- **AC1:** Given I open Leave › Apply, when I select a leave type, then my current balance for that type is shown (e.g. "5.00 Day(s)").
- **AC2:** Leave Type, From Date and To Date are required. Submitting without them shows "Required" under each empty field.
- **AC3:** Given a valid single working day within my balance, when I click Apply, then a success message appears and the request shows in Leave › My Leave with status **Pending Approval** and **1.00** day.
- **AC4:** For a single day, I can choose a Duration of Full Day, Half Day – Morning, Half Day – Evening, or Specify Time. A half day counts as **0.50** day.
- **AC5:** For a multi-day request, non-working days (per Work Week) and holidays in the range are **not counted** (e.g. Friday to Monday = 2.00 days).
- **AC6:** For a multi-day request, a Partial Days option lets me set half days on All Days, Start Day Only, End Day Only, or Start and End Day, and the total reflects it.
- **AC7:** To Date cannot be earlier than From Date. A validation message is shown and the request can't be submitted. **(verify message)**
- **AC8:** After applying, my balance on Leave › Apply is reduced by the requested days. **(verify: do pending requests reduce the shown balance?)**

**Assumptions / open questions:**
- Can an employee apply for a date in the past? (verify)
- Is "Comments" optional? Max length?

---

## US-LV-0003: Supervisor approves, rejects or cancels leave

**As a** supervisor (or Admin)
**I want to** approve or reject my team's leave requests, and employees want to cancel their own
**So that** leave is controlled and balances stay correct

**Pre-conditions:** Ellie has a Pending Approval request. Sam is Ellie's supervisor (Report-to). Logged in as `qa_av_super` or Admin, as the scenario requires.

### Acceptance Criteria
- **AC1:** Given I'm logged in as Sam, when I open Leave › Leave List, then I see Ellie's pending request. I do **not** see requests from employees who don't report to me.
- **AC2:** When I click **Approve** on a pending request, a success message appears and its status changes to **Scheduled** (or **Taken** if the date has passed).
- **AC3:** When I click **Reject** on a pending request, a success message appears, the status changes to **Rejected**, and the days are returned to Ellie's balance.
- **AC4:** As Ellie, I can **Cancel** my own Pending Approval or Scheduled request from Leave › My Leave. The status becomes **Cancelled** and the days are returned to my balance.
- **AC5:** Admin can approve or reject any employee's leave request, not only subordinates'.
- **AC6:** An employee without subordinates (e.g. Ellie) doesn't see Leave List or Assign Leave in the Leave menu, and opening the Leave List URL directly doesn't show other employees' requests. **(verify behavior)**
- **AC7:** Leave List filters (date range, status, leave type, employee name) narrow the results correctly, and **Reset** clears them.

**Assumptions / open questions:**
- Can a supervisor approve their own leave? (Expected: no)
- Can a request be approved after it's been cancelled? (Expected: no)

---

## US-LV-0004: System blocks invalid leave requests

**As an** HR team
**I want** the system to prevent invalid leave requests
**So that** balances can't go negative and no day is booked twice

**Pre-conditions:** Logged in as `qa_av_emp`. Ellie has a 5-day QA_AV Vacation entitlement.

### Acceptance Criteria
- **AC1:** Given my balance is 5 days, when I apply for more than 5 working days, then the request is **not submitted** and a message tells me the balance is insufficient. **(verify: blocked, or warned with an option to continue?)**
- **AC2:** Given I already have a Pending Approval or Scheduled request on a date, when I apply for a range that overlaps it, then the request is **not submitted** and an overlap message is shown. **(verify message)**
- **AC3:** Given I have no entitlement for a leave type, when I open Leave › Apply, then that leave type is either not listed or shows 0.00 balance and can't be submitted. **(verify)**
- **AC4:** Given a range that contains only non-working days or holidays (e.g. Saturday to Sunday), when I apply, then the request is not submitted, or is recorded as 0.00 days. **(verify which)**
- **AC5:** Cancelled and Rejected requests do **not** count as overlaps: I can apply again for the same dates.

**Assumptions / open questions:**
- Do a half-day Morning and a half-day Evening on the same date overlap? (verify)

---

## Verification checklist (do this in the demo before writing test cases)

Log in as Admin, set up the data from `docs/test-data.md`, then check each item. Write down **exactly** what you see, including the message text. Either the AC gets updated, or you've found a defect.

| # | Story / AC | What to check | What you saw |
|---|---|---|---|
| 1 | LV-0001 AC3 | Entitlement: try `abc`, `-1`, `2.555`, `0`, a huge number. Messages? | |
| 2 | LV-0001 AC4 | Is there a confirmation dialog on save? Its text? | |
| 3 | LV-0001 AC5 | Add 5, then 3 for the same type and period: total 8 or 3? | |
| 4 | LV-0002 AC7 | To Date before From Date: message text? | |
| 5 | LV-0002 AC8 | After applying, does the balance drop while the request is still Pending? | |
| 6 | LV-0002 Q | Can you apply for yesterday? | |
| 7 | LV-0003 AC6 | As Ellie (no subordinates), what's in the Leave menu? Try the Leave List URL directly. | |
| 8 | LV-0004 AC1 | Apply for 6 days with a 5-day balance: blocked or warning? Text? | |
| 9 | LV-0004 AC2 | Overlapping request: message text? | |
| 10 | LV-0004 AC3 | Leave type with no entitlement: listed? | |
| 11 | LV-0004 AC4 | Apply Sat to Sun only: what happens? | |
| 12 | LV-0004 Q | Half-day Morning + half-day Evening on the same date? | |

> Tip: take a screenshot of every message as you go (`evidence/verify-LV-<#>.png`). It speeds up writing expected results and bug reports later.
