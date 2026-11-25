# User Stories: [Module name] ([MOD])

> Copy to `user-stories/US-<MOD>.md`. One file per module, several stories per file.
> Each story → paste into the **test-case-writer** skill to generate test cases.

**Module:** [e.g. Leave]
**Roles involved:** [Admin, ESS Employee, Supervisor]
**Source of rules:** reverse-engineered from OrangeHRM [version] behavior + standard HR expectations

---

## US-[MOD]-0001: [Short title]

**As a** [role]
**I want to** [action]
**So that** [business value]

**Pre-conditions:** [what must exist first, e.g. employee has a leave entitlement]

### Acceptance Criteria
- **AC1:** Given [context], when [action], then [observable result].
- **AC2:** ...
- **AC3:** ...

**Assumptions / open questions:** [anything you're unsure of; these become "Needs confirmation"]

---

## Worked example (delete this before submitting)

## US-LV-0002: Employee applies for leave

**As an** ESS employee
**I want to** apply for leave for one or more days
**So that** my supervisor can approve my time off and my balance stays accurate

**Pre-conditions:** Employee has a 5-day entitlement for "QA_AV Vacation" in the current leave period and has a supervisor assigned.

### Acceptance Criteria
- **AC1:** Given I open Leave › Apply, when I select a leave type, then my available balance for that type is shown.
- **AC2:** Leave Type, From Date and To Date are required. Submitting without them shows "Required" under each empty field.
- **AC3:** Given valid dates within my balance, when I click Apply, then a success message appears and the request shows in My Leave with status "Pending Approval".
- **AC4:** Non-working days (per Work Week) and holidays within the date range are not counted toward the number of days.
- **AC5:** To Date cannot be earlier than From Date.
- **AC6:** If I apply for dates that overlap an existing request, the request is not submitted and an overlap message is shown.
- **AC7:** I can apply for a half day (Morning or Evening), and it counts as 0.5 days.

**Assumptions / open questions:** Does a pending request reduce the shown balance immediately? (verify)

---

## Tips for good ACs
- **Testable:** a tester can say pass/fail without guessing. Avoid "properly", "fast", "user-friendly".
- **Observable:** describe what appears on screen or what changes in data.
- **Include the unhappy paths:** required fields, invalid input, duplicates, permissions.
- **One rule per AC.** Split "and" when the two halves could fail separately.
- **Don't over-specify UI:** "an error is shown" is fine if you're not sure of the exact text. Record the exact text in Actual Results.
