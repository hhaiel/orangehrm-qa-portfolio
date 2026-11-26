# User Stories: PIM (Personnel Information Management)

**Module:** PIM
**Version:** OrangeHRM OS 5.9 (local Docker)
**Roles involved:** Admin (HR), Supervisor, Employee (ESS)
**Source of rules:** reverse-engineered from OrangeHRM behavior + standard HR expectations
**Status:** REVIEWED 2026-11-25. ✅ = confirmed in the app. ❌ = the app doesn't meet the AC (defect logged). **(verify)** = still open (see notes).

**Shared test data** (see `docs/test-data.md`): Admin `qa_admin`; employees QA_AV Sam Supervisor (#0002), QA_AV Ellie Employee (#0003, reports to Sam), QA_AV Nina New (#0004, no login), QA_AV Olivia Other (#0005), QA_AV Dan Disabled (#0007, login `qa_av_disabled`, Disabled).

---

## US-PIM-0001: HR adds a new employee

**As an** HR admin
**I want to** add a new employee, optionally with login details
**So that** the employee exists in the system and, if needed, can sign in

**Pre-conditions:** Logged in as Admin.

### Acceptance Criteria
- **AC1:** ✅ PIM › Add Employee shows First Name, Middle Name, Last Name, Employee Id (pre-filled with the next number, e.g. 0008), a profile photo upload ("Accepts jpg, .png, .gif up to 1MB. Recommended dimensions: 200px X 200px"), and a **Create Login Details** toggle (off by default).
- **AC2:** ✅ First Name and Last Name are required ("Required"); Middle Name is optional. Names longer than 30 characters show "Should not exceed 30 characters".
- **AC3:** ❌ Leading and trailing spaces in names are removed before saving. Actual: they're stored as typed, e.g. `"  QA_AV Spaces  "`, and the record sorts to the top of the Employee List (DEF-003).
- **AC4:** ✅ Employee Id can be edited. An Id that already exists shows "Employee Id already exists" as soon as the field loses focus, and Save is blocked.
- **AC5:** A jpg, png or gif photo up to 1 MB is accepted and previewed (✅ 200×200 jpg). Other file types are rejected with a message about the file type: ❌ a pdf is rejected, but the message says "Attachment Size Exceeded" (DEF-007). Files over 1 MB are rejected with a size message **(verify: not recorded in the manual run)**.
- **AC6:** Turning on Create Login Details shows Username, Status (Enabled / Disabled, ✅ default Enabled), Password and Confirm Password.
  - ✅ Username, Password and Confirm Password are required. ❌ An empty Confirm Password shows "Passwords do not match" instead of "Required" (DEF-005).
  - ✅ Username needs at least 5 characters ("Should be at least 5 characters") and must be unique, case-insensitively ("Username already exists" for `qa_av_emp` and `QA_AV_EMP`).
  - ✅ On Save, Password must have at least 8 characters ("Should have at least 8 characters") and at least 1 lower-case letter, 1 upper-case letter, 1 number and 1 special character (e.g. "Your password must contain minimum 1 upper-case letter"). One rule message shows at a time. A strength meter shows Very Weak / Weak / … while typing.
  - ✅ After a failed save, the Password message updates about 1 s after leaving the field (asynchronous check). Earlier logged as DEF-006, now rejected as not reproducible (2026-11-26).
  - ✅ Confirm Password must match ("Passwords do not match").
- **AC7:** ✅ Given valid input, when I click Save, then the employee's **Personal Details** page opens.
- **AC8:** ✅ If login details were created, the user appears in Admin › User Management › Users with role **ESS** and the chosen status (e.g. `qa_av_disabled` / ESS / Disabled). If not, no user exists for that employee (e.g. Nina).

---

## US-PIM-0002: HR finds and manages employees in the Employee List

**As an** HR admin
**I want to** search the employee list and remove employees who shouldn't be in it
**So that** I can quickly find the right record and keep the list clean

**Pre-conditions:** Logged in as Admin. The shared test employees exist.

### Acceptance Criteria
- **AC1:** ✅ PIM › Employee List has filters for Employee Name, Employee Id, Employment Status, Include (default "Current Employees Only"), Supervisor Name, Job Title and Sub Unit, plus Search and Reset. On narrow windows the filter panel starts collapsed.
- **AC2:** ✅ Searching by part of a name works with or without picking a suggestion (typing "Ellie" and clicking Search → 1 record, 0003).
- **AC3:** Searching by an exact Employee Id (e.g. 0003) lists only that employee.
- **AC4:** Searching by Supervisor Name "QA_AV Sam Supervisor" lists only Sam's subordinates (Ellie).
- **AC5:** ✅ A search with no matches shows "No Records Found" in the list and an Info toast "No Records Found".
- **AC6:** Reset clears all filters and shows the full list again.
- **AC7:** ✅ The trash icon (or checkboxes + Delete Selected) opens a dialog: "Are you Sure? The selected record will be permanently deleted. Are you sure you want to continue?" with **No, Cancel** / **Yes, Delete**. Cancel keeps the record; Yes, Delete shows "Successfully Deleted" and removes it.
- **AC8:** ✅ The logged-in Admin's own employee record has no delete icon.

**Open questions:**
- ✅ What happens to a deleted employee's login? Answered while building the automation: deleting an employee (UI or API) **also deletes their user account** (confirmed via the Users API, 2026-11-25).
- Past (terminated) employees aren't in the test data, so "Current and Past Employees" is out of scope.

---

## US-PIM-0003: HR edits an employee's personal details

**As an** HR admin
**I want to** update an employee's personal details and photo
**So that** their record stays accurate

**Pre-conditions:** Logged in as Admin. A test employee exists (e.g. QA_AV Nina New).

### Acceptance Criteria
- **AC1:** ✅ An employee's record has tabs: Personal Details, Contact Details, Emergency Contacts, Dependents, Immigration, Job, Salary, Report-to, Qualifications, Memberships.
- **AC2:** ✅ Personal Details has Employee Full Name, Employee Id, Other Id, Driver's License Number, License Expiry Date, Nationality, Marital Status, Date of Birth and Gender (Male / Female). Save shows "Successfully Updated".
- **AC3:** Saved changes are still there after reloading the page, and the new name shows in the Employee List.
- **AC4:** ✅ First Name and Last Name stay required. Clearing Last Name and saving shows "Required", and nothing is saved.
- **AC5:** ❌ Date of Birth can't be in the future. Actual: 2030-01-01 is accepted with no message and saved (DEF-004).
- **AC6:** ✅ Clicking the profile picture lets me upload a new photo with the same rules as US-PIM-0001 AC5. Changing it to a new 200×200 jpg worked (manual run, 2026-11-25).

---

## Verification log (2026-11-25, local OrangeHRM OS 5.9)

| # | Check | Result |
|---|---|---|
| 1 | Save Add Employee empty | "Required" under First and Last Name; Employee Id pre-filled (0006) |
| 2 | Duplicate Employee Id 0003 | "Employee Id already exists" on blur; Save blocked |
| 3 | Photo upload rules | **Not checked**: the test browser can't upload local files |
| 4 | Login details rules | Username: min 5, unique (case-insensitive). Password: 8+ chars, lower, upper, number, special (checked on Save). Empty Confirm → "Passwords do not match" ⚠️ DEF-005. Stale Password message ⚠️ DEF-006 |
| 5 | Login appears in Admin › Users | `qa_av_disabled` listed as ESS / Disabled; Nina (no login) not listed |
| 6 | Name max length; trimming | > 30 chars → "Should not exceed 30 characters". Spaces **not** trimmed ⚠️ DEF-003 |
| 7 | List filters; partial name; no match | All filters present. Typed "Ellie" without selecting → 1 record. No match → "No Records Found" + Info toast |
| 8 | Delete dialog | "Are you Sure? … permanently deleted …" No, Cancel / Yes, Delete → "Successfully Deleted" |
| 9 | Personal Details save; clear Last Name | "Successfully Updated"; empty Last Name → "Required", not saved |
| 10 | Future Date of Birth | 2030-01-01 accepted and saved ⚠️ DEF-004 |

Side effect: employee 0006 ("QA_AV Spaces Dup") was created by an accidental Save during check 6, used for checks 9–10, then deleted in check 8.
