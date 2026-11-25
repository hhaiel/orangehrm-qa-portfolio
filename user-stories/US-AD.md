# User Stories: Admin › User Management (AD)

**Module:** Admin › User Management
**Version:** OrangeHRM OS 5.9 (local Docker)
**Roles involved:** Admin, Employee (ESS), Supervisor
**Source of rules:** reverse-engineered from OrangeHRM behavior + standard HR expectations
**Status:** REVIEWED 2026-11-25. ✅ = confirmed in the app. ❌ = the app doesn't meet the AC (defect logged). **(verify)** = still open.

**Shared test data:** Admin `qa_admin`; ESS users `qa_av_emp` (Ellie), `qa_av_super` (Sam, has a subordinate), `qa_av_other` (Olivia), `qa_av_disabled` (Dan, Disabled); employee QA_AV Nina New (no login).

---

## US-AD-0001: Admin manages system users

**As an** Admin
**I want to** create, edit and disable system users for existing employees
**So that** the right people can sign in with the right permissions

**Pre-conditions:** Logged in as Admin. The employee exists (e.g. QA_AV Nina New, who has no login yet).

### Acceptance Criteria
- **AC1:** ✅ Admin › User Management › Users › Add shows User Role (Admin / ESS), Employee Name (autocomplete), Status (Enabled / Disabled), Username, Password and Confirm Password. Saving empty shows "Required" under User Role, Employee Name, Status, Username and Password. ❌ Confirm Password shows "Passwords do not match" (DEF-005, same as PIM).
- **AC2:** ✅ Employee Name must be picked from the suggestions. A name with no match shows "No Records Found" in the suggestions and "Invalid" on save.
- **AC3:** Username and password follow the same rules as PIM login details (US-PIM-0001 AC6): username 5+ characters and unique; password 8+ characters with lower, upper, number and special characters; matching confirm.
- **AC4:** Given valid input, when I click Save, then "Successfully Saved" appears and the new user is listed with the chosen role, employee name and status.
- **AC5:** ✅ The Users list can be filtered by Username, User Role, Employee Name and Status. Reset clears the filters.
- **AC6:** ✅ Edit User shows User Role, Employee Name, Status, Username and an optional **Change Password?** checkbox. The new values show in the list after saving.
- **AC7:** ✅ A **Disabled** user who enters the correct password stays on the login page with "Account disabled". With a wrong password the message is the generic "Invalid credentials", so it doesn't reveal that the account exists.
- **AC8:** An ESS user changed to **Admin** sees the Admin and PIM menus after logging in again.

**Open questions:**
- The Users list shows an **enabled trash icon on the logged-in Admin's own account**, while PIM hides the delete icon on the Admin's own employee record. What happens on delete? **(Needs confirmation.** To test safely, create a second Admin first so access isn't lost.)

---

## US-AD-0002: Employees can't reach admin functions

**As an** HR team
**I want** regular employees to be blocked from Admin and PIM
**So that** personal data and system settings are protected

**Pre-conditions:** ESS users exist (Ellie, no subordinates; Sam, has a subordinate).

### Acceptance Criteria
- **AC1:** ✅ An ESS user without subordinates (Ellie) sees only Leave, Time, My Info, Performance, Dashboard, Directory, Claim and Buzz in the main menu: no Admin, PIM, Recruitment or Maintenance.
- **AC2:** ✅ Opening `/web/index.php/admin/viewSystemUsers` directly as Ellie shows "Credential Required" (HTTP 403) and no user data.
- **AC3:** ✅ Opening `/web/index.php/pim/viewEmployeeList` directly as Ellie shows "Credential Required" (HTTP 403).
- **AC4:** ✅ A supervisor (Sam) sees **PIM** in the menu. His Employee List shows only his subordinate (Ellie, 1 record), with no Add button and no delete icons. His API request for a non-subordinate's record (Olivia) is refused (HTTP 422).
- **AC5:** ✅ An employee can't see another employee's record by URL. As Ellie, `/pim/viewPersonalDetails/empNumber/2` (Sam) shows "No Records Found" and no data, and the API refuses it (HTTP 422). Unlike the Admin/PIM list pages, it doesn't show the 403 "Credential Required" page (observation).

---

## Verification log (2026-11-25, local OrangeHRM OS 5.9)

| # | Check | Result |
|---|---|---|
| 1 | Add User empty; non-existent employee | "Required" ×5 + Confirm "Passwords do not match" ⚠️ DEF-005. Unknown name → "No Records Found" suggestion, "Invalid" on save |
| 2 | Edit User fields | Role, Employee Name, Status, Username, "Change Password?" checkbox |
| 3 | Disabled user login | Correct password → "Account disabled"; wrong password → "Invalid credentials" |
| 4 | Admin deleting own user | Trash icon enabled on `qa_admin`. Not clicked (would risk locking out the only Admin). Needs confirmation |
| 5 | Ellie opens Admin / PIM URLs | Both 403 "Credential Required" |
| 6 | Sam's PIM list | 1 record (Ellie), no Add, no delete; API for Olivia → 422 |
| 7 | Ellie opens Sam's record URL | "No Records Found", no data; API 422 |
