# Module reference: OrangeHRM 5.x

A map of what each module does, the business rules worth testing, and ready-made test ideas. Use it to write user stories and ACs quickly.

> **(verify)** = typical/observed behavior that hasn't been confirmed on your version yet. Check it in the app before putting it in an AC. If it behaves differently, write down what you see. That's either your AC or a bug.

Navigation paths use `›`, e.g. **Leave › Apply**.

---

## Login and common UI

**Where:** login page, top-right user menu (About, Support, Change Password, Logout)

**Rules to test**
- Username and password are both required; empty fields show **"Required"** (verify)
- Wrong credentials show **"Invalid credentials"** (verify)
- Disabled users can't log in
- Logout ends the session; the browser Back button shouldn't show protected pages
- **Forgot your password?** asks for a username and shows a confirmation (no email on the demo)

**Test ideas:** case sensitivity of username/password · leading/trailing spaces · session timeout · direct URL access when logged out (e.g. `/web/index.php/pim/viewEmployeeList`) redirects to login

---

## Admin › User Management (scope: yes)

**Where:** Admin › User Management › Users

**Fields (Add User):** User Role (Admin / ESS) · Employee Name (autocomplete, must be an *existing* employee) · Status (Enabled / Disabled) · Username · Password · Confirm Password

**Rules to test**
- All fields required
- Employee Name must be chosen from the autocomplete; typed text that doesn't match shows **"Invalid"** (verify)
- Username must be unique (**"Already exists"**) and has a minimum length (verify: 5 chars)
- Password has a minimum length (verify: 7 chars), a strength meter, and must include a number (verify)
- Confirm Password must match (**"Passwords do not match"**) (verify)
- You can't delete the user you're logged in as (verify)
- Search filters: Username, User Role, Employee Name, Status, plus Reset

**Test ideas:** create an ESS user, then log in as them · disable a user, then try to log in · edit role ESS → Admin and check the menus change · bulk delete with checkboxes · search with partial username · sort columns · special characters / very long username

**Also under Admin (lower priority):** Job (Job Titles, Pay Grades, Employment Status, Job Categories, Work Shifts) · Organization (General Info, Locations, Structure) · Qualifications · Nationalities · Corporate Branding · Configuration

---

## PIM: Personnel Information Management (scope: yes)

**Where:** PIM › Employee List · Add Employee · Reports · Configuration

**Add Employee fields:** First Name* · Middle Name · Last Name* · Employee Id (auto-generated, editable) · profile photo · **Create Login Details** toggle (Username, Status, Password, Confirm)

**Rules to test**
- First and Last name required
- Employee Id must be unique (verify message: "Employee Id already exists")
- Photo: accepted types jpg/png/gif, max size **1 MB** (verify); an invalid file shows an error
- With Create Login Details on, the same username/password rules as Admin › Users apply
- After saving, you land on the employee's **Personal Details** page

**Employee detail tabs:** Personal Details · Contact Details · Emergency Contacts · Dependents · Immigration · Job · Salary · Report-to · Qualifications · Memberships

**Employee List search:** Employee Name · Employee Id · Employment Status · Include (Current / Current and Past) · Supervisor Name · Job Title · Sub Unit

**Test ideas:** add an employee without login → no user exists in Admin › Users · add with login → the user appears in Admin › Users as ESS · duplicate Employee Id · max-length names · date fields (DOB in the future?) · search by partial name · "Current and Past" after terminating someone (Job tab › Terminate) · delete multiple employees · edit, save, refresh → data persists · set Report-to (needed for leave approval tests)

---

## Leave (scope: yes, the richest module)

**Where:** Leave › Apply · My Leave · Entitlements · Reports · Configure · Leave List · Assign Leave

**Configure:** Leave Period (start month/date) · Leave Types · Work Week (full/half/non-working days) · Holidays (full/half, repeats annually)

**Leave request statuses:** Pending Approval → Scheduled (approved) → Taken (date passed) · Rejected · Cancelled

**Rules to test**
- You can't apply without an entitlement / enough balance (verify: "Balance not sufficient" warning or a confirm dialog)
- Overlapping requests are blocked (verify message: "Failed to Submit" / overlapping leave)
- Weekends (per Work Week) and Holidays are **not** counted as leave days
- Partial days: **Half Day – Morning / Evening** and **Specify Time** (duration in hours)
- Multi-day requests: partial-day options for All Days / Start Day Only / End Day Only / Start and End Day
- To Date can't be before From Date
- Balance = Entitlement − (Taken + Scheduled + Pending) (verify how Pending counts)
- ESS sees only their own leave; supervisors approve their subordinates' requests; Admin approves anyone's
- Cancelling an approved request returns the days to the balance

**Test ideas (decision table / state transition)**
| Scenario | Expected |
|---|---|
| Entitlement 5 days, apply 3 days | Pending Approval, balance shows 2 available |
| Entitlement 5, apply 6 | Blocked or warned |
| Apply Fri–Mon (weekend in between) | Counts 2 days, not 4 |
| Apply on a configured holiday | 0 days / not allowed |
| Apply again over existing dates | Overlap error |
| Half day morning + half day evening, same date | Allowed? Verify |
| Approve, then cancel | Days returned to balance |
| Supervisor approves a non-subordinate | Not possible |
| ESS opens Leave › Leave List | Not allowed / own only |

---

## Out of scope (for future phases or extra credit)

| Module | Where | Key rules / statuses |
|---|---|---|
| **Time** | Timesheets, Attendance (Punch In/Out), Project Info, Reports | Timesheet: Not Submitted → Submitted → Approved / Rejected; Punch Out must be after Punch In |
| **Recruitment** | Vacancies, Candidates | Candidate: Application Initiated → Shortlisted → Interview Scheduled → Interview Passed/Failed → Job Offered → Hired / Offer Declined / Rejected. Resume types doc/docx/odt/pdf/rtf/txt, max 1 MB (verify) |
| **Claim** | Submit Claim, My Claims, Employee Claims, Assign Claim, Configuration (Events, Expense Types) | Initiated → Submitted → Approved / Rejected → Paid; Cancelled |
| **Performance** | KPIs, Trackers, Manage Reviews, My Reviews | Review: Inactive → Activated → In Progress → Completed |
| **My Info** | Employee self-service version of the PIM tabs | ESS can edit only some fields |
| **Dashboard** | Widgets: Time at Work, My Actions, Quick Launch, Buzz, Employees on Leave Today, Distribution charts | Numbers should match the source modules |
| **Directory** | Employee search by name/job/location | Only current employees? (verify) |
| **Buzz** | Posts, photos, likes, comments, shares | Edit/delete own posts only |
| **Maintenance** | Purge records, Access records | Requires re-entering the password |

---

## General checklist for any screen
- Required fields marked and enforced · error messages clear and next to the field
- Max length / special characters / leading spaces / emoji
- Save → refresh → data persists · Cancel discards changes
- Success toast appears (**"Successfully Saved"** etc.)
- Delete asks for confirmation · bulk actions work
- Search: exact, partial, no results ("No Records Found"), Reset clears filters
- Pagination and sorting · record count matches the list
- Role check: does an ESS user see it? Try the direct URL.
