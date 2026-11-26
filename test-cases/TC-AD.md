# Test Cases: Admin › User Management (AD)

**Source stories:** [`user-stories/US-AD.md`](../user-stories/US-AD.md) (US-AD-0001 to 0002, reviewed 2026-11-25)
**Browser:** Chromium
**Version:** OrangeHRM OS 5.9 (local Docker, http://localhost:8080)

**Test data** (see [`docs/test-data.md`](../docs/test-data.md)):
- Admin `qa_admin`. ESS users: `qa_av_emp` (Ellie, no subordinates), `qa_av_super` (Sam, supervises Ellie), `qa_av_other` (Olivia), `qa_av_disabled` (Dan, Disabled).
- QA_AV Nina New (0004) has **no** user before TC-002.
- **Valid test password:** `TEST_USER_PASSWORD` from `docker/.env` (never write it here).

## AC gaps found
- **US-AD-0001 AC3:** username and password rules are only referenced ("same as PIM"). They're fully tested in US-PIM-0001-TC-003 and not repeated here.
- **US-AD-0001 AC6:** what happens when "Change Password?" is ticked isn't described (fields? rules?). Not covered.
- **US-AD-0001 open question:** deleting the logged-in Admin's own account has no expected behavior yet. Not covered (needs a decision and a backup Admin).
- **US-AD-0001 AC8:** doesn't say whether the role change takes effect immediately or only after the next login. TC-003 checks after a fresh login.

## Test cases

| Test Case ID | Feature Name | Test Case/Scenario | Pre-requisite | Test Steps | Test Data | Expected Results | Browsers | Status | Actual Results |
|---|---|---|---|---|---|---|---|---|---|
| US-AD-0001-TC-001 | Admin – Add User | Verify the Add User form requires all fields and only accepts an existing employee (AC1, AC2) | Admin `qa_admin` is logged in | 1. Go to Admin › User Management › Users<br>2. Click Add<br>3. Click Save without entering anything<br>4. Type `Nobody Here` in Employee Name<br>5. Click Save | Employee Name: Nobody Here | 2. Add User form: User Role, Employee Name, Status, Username, Password, Confirm Password<br>3. "Required" under User Role, Employee Name, Status, Username, Password **and Confirm Password**; nothing saved<br>4. Suggestions show "No Records Found"<br>5. "Invalid" under Employee Name; nothing saved | Chromium | **Fail** | Form fields as expected. Step 3: "Required" under User Role, Employee Name, Status, Username, Password, but Confirm Password shows **"Passwords do not match"** (**DEF-005**, evidence `evidence/DEF-005.jpg`). Step 4: "No Records Found" suggestion. Step 5: "Invalid", not saved. |
| US-AD-0001-TC-002 | Admin – Add User | Verify Admin can create an ESS user for an existing employee and find it with the list filters (AC4, AC5) | Admin is logged in. QA_AV Nina New has no user. Username `qa_av_nina` isn't used | 1. Go to Admin › User Management › Users › Add<br>2. Select User Role ESS, Employee Name "QA_AV Nina New" (pick the suggestion), Status Enabled<br>3. Enter Username `qa_av_nina` and the valid password in Password and Confirm Password<br>4. Click Save<br>5. In the filters, enter Username `qa_av_nina`, click Search<br>6. Click Reset<br>7. Select User Role ESS and Status Enabled, click Search | User: qa_av_nina / ESS / Enabled / QA_AV Nina New | 4. "Successfully Saved"; back on the Users list<br>5. 1 record: qa_av_nina, ESS, QA_AV Nina New, Enabled<br>6. Filters cleared; all users listed<br>7. Only ESS + Enabled users listed (qa_av_emp, qa_av_super, qa_av_other, qa_av_nina); qa_admin and qa_av_disabled not listed | Chromium | Pass | User saved; redirect to Users list took ~6 s so the success toast wasn't captured (user confirmed via list and API). Username filter → 1 record. Reset → 7 users. ESS + Enabled → 5: qa_av_emp, qa_av_lisa (created in US-PIM-0001-TC-004), qa_av_nina, qa_av_other, qa_av_super. |
| US-AD-0001-TC-003 | Admin – Edit User | Verify Admin can change a user's role and the user then gets Admin menus (AC6, AC8) | Admin is logged in. Continued from TC-002 (`qa_av_nina` exists as ESS) | 1. On the Users list, click the edit icon for qa_av_nina<br>2. Look at the Edit User form<br>3. Change User Role to Admin and click Save<br>4. Log out and log in as `qa_av_nina`<br>5. Look at the main menu<br>6. Log out, log in as Admin, edit qa_av_nina back to ESS, and Save | User: qa_av_nina | 2. User Role (ESS), Employee Name, Status, Username, and a "Change Password?" checkbox<br>3. Success message; list shows qa_av_nina as Admin<br>5. Main menu includes Admin and PIM<br>6. List shows qa_av_nina as ESS again | Chromium | Pass | Edit form: User Role, Employee Name, Status, Username, "Change Password?" checkbox. Role → Admin: "Successfully Updated". As qa_av_nina: menu includes Admin, PIM, Recruitment, Maintenance. Reverted to ESS (confirmed). |
| US-AD-0001-TC-004 | Admin – Login | Verify a disabled user can't log in and the message doesn't reveal accounts to someone guessing (AC7) | Logged out. `qa_av_disabled` exists with Status Disabled | 1. Go to the login page<br>2. Enter Username `qa_av_disabled` and the correct password, click Login<br>3. Enter Username `qa_av_disabled` and a wrong password, click Login | Correct: `TEST_USER_PASSWORD`<br>Wrong: `WrongPass1!` | 2. Stays on the login page; message "Account disabled"<br>3. Stays on the login page; message "Invalid credentials" (same as for any wrong login) | Chromium | Pass | Correct password → stays on login, "Account disabled". Wrong password → "Invalid credentials". |
| US-AD-0002-TC-001 | Access control | Verify an employee without subordinates can't reach Admin, PIM or other employees' records (AC1, AC2, AC3, AC5) | `qa_av_emp` (Ellie) is logged in | 1. Look at the main menu<br>2. Open `/web/index.php/admin/viewSystemUsers` in the address bar<br>3. Open `/web/index.php/pim/viewEmployeeList`<br>4. Open `/web/index.php/pim/viewPersonalDetails/empNumber/2` (Sam's record) | URLs as listed; base http://localhost:8080 | 1. Leave, Time, My Info, Performance, Dashboard, Directory, Claim, Buzz; no Admin, PIM, Recruitment or Maintenance<br>2. "Credential Required" (HTTP 403); no users shown<br>3. "Credential Required" (HTTP 403); no employees shown<br>4. No data from Sam's record is shown | Chromium | Pass | Menu: Leave, Time, My Info, Performance, Dashboard, Directory, Claim, Buzz. Admin URL and PIM URL → "Credential Required" (HTTP 403), 0 rows. Sam's record URL → "No Records Found", no data. |
| US-AD-0002-TC-002 | Access control | Verify a supervisor sees PIM but only for their own subordinates (AC4) | `qa_av_super` (Sam) is logged in. Ellie reports to Sam; Olivia doesn't | 1. Look at the main menu<br>2. Go to PIM › Employee List<br>3. Look at the available actions<br>4. Open `/web/index.php/pim/viewPersonalDetails/empNumber/5` (Olivia's record) | – | 1. Menu includes PIM; no Admin<br>2. Only 1 record: 0003 QA_AV Ellie Employee<br>3. No Add button and no delete icons<br>4. No data from Olivia's record is shown | Chromium | Pass | Menu includes PIM, no Admin. Employee List: 1 record (0003 QA_AV Ellie Employee); no Add button, 0 trash icons. Olivia's record URL → "No Records Found", no data. Evidence `evidence/US-AD-0002-TC-002.jpg` |

## Coverage
**6 test cases.** All Admin ACs are covered except AC3, which is covered by US-PIM-0001-TC-003:

| Story | AC → Test case |
|---|---|
| US-AD-0001 | AC1, AC2 → TC-001 · AC3 → US-PIM-0001-TC-003 · AC4, AC5 → TC-002 · AC6, AC8 → TC-003 · AC7 → TC-004 |
| US-AD-0002 | AC1, AC2, AC3, AC5 → TC-001 · AC4 → TC-002 |

**Expected failure (from verification):** US-AD-0001-TC-001 step 3, where Confirm Password shows "Passwords do not match" (DEF-005).

## Automation candidates
| Test Case ID | Auto / Manual-only | Reason | Tag | Automated in (spec file) |
|---|---|---|---|---|
| US-AD-0001-TC-001 | Auto | Form validation | @regression | `automation/tests/ui/admin.spec.ts` ✅ (2 tests; Confirm Password part `test.fail`: DEF-005) |
| US-AD-0001-TC-002 | Auto | Create user + filters (clean up via API) | @smoke | `automation/tests/ui/admin.spec.ts` ✅ |
| US-AD-0001-TC-003 | Auto | Role change across two logins | @regression | `automation/tests/ui/admin.spec.ts` ✅ |
| US-AD-0001-TC-004 | Auto | Login security messages | @smoke | `automation/tests/ui/login.spec.ts` ✅ |
| US-AD-0002-TC-001 | Auto | Access control (UI + API 403 checks) | @smoke | `automation/tests/ui/admin.spec.ts` ✅ |
| US-AD-0002-TC-002 | Auto | Supervisor data scope | @regression | `automation/tests/ui/admin.spec.ts` ✅ |

## Execution log
| Date | Environment / version | Executed | Pass | Fail | Blocked | Notes |
|---|---|---|---|---|---|---|
| 2026-11-25 | Local Docker, OrangeHRM OS 5.9, Chromium | 6 | 5 | 1 | 0 | Fail = DEF-005 (Confirm Password message). Data created: user qa_av_nina (ESS, Enabled). Run after TC-PIM, so qa_av_lisa also appears in user lists. |

---
**Status values:** Pass · Fail · Blocked · Not Run
