# Test data

## Why this matters
The public demo is **shared by everyone** and **resets periodically**. Other testers can edit or delete your records. So:
1. **Prefix everything you create with `QA_`** plus your initials, e.g. `QA_AV_`, so your records are easy to find and unlikely to clash.
2. **Recreate your data at the start of each session** (it takes about 10 min with the checklist below).
3. Never write test cases that depend on records you didn't create.

> Using local Docker? Data persists, and you can skip the reset worries. Keep the prefix anyway so screenshots look clean.

## Accounts

| Role | Username | Employee name | Notes |
|---|---|---|---|
| Admin (local) | `qa_admin` | QA Admin | Created in the install wizard. Password in `docker/.env` (`ADMIN_PASSWORD`) |
| Admin (demo) | (shown on the demo login page) | (existing) | Built-in demo admin |
| Supervisor (ESS) | `qa_av_super` | QA_AV Sam Supervisor | Set as Report-to for the employee below |
| Employee (ESS) | `qa_av_emp` | QA_AV Ellie Employee | Main ESS test user |
| Disabled user | `qa_av_disabled` | QA_AV Dan Disabled (#0007) | Status = Disabled, for login tests (created 2026-11-25) |
| Non-subordinate | `qa_av_other` | QA_AV Olivia Other (#0005) | Doesn't report to Sam; 5 days QA_AV Vacation |
| No login | – | QA_AV Nina New (#0004) | Used for entitlement and Add User tests |

**Passwords:** use one test password for all QA users and keep it **only in `docker/.env`** (`TEST_USER_PASSWORD`, git-ignored), never in a committed file. A public repo with passwords looks bad even when they're test-only.

## Session setup checklist (as Admin)
- [ ] **PIM › Add Employee**: QA_AV Sam Supervisor (with login `qa_av_super`, ESS, Enabled)
- [ ] **PIM › Add Employee**: QA_AV Ellie Employee (with login `qa_av_emp`, ESS, Enabled)
- [ ] **PIM › Add Employee**: QA_AV Dan Disabled (with login `qa_av_disabled`, **Disabled**)
- [ ] **PIM › Add Employee**: QA_AV Nina New (no login, **no entitlement**). Used by US-LV-0001 entitlement tests
- [ ] **PIM › Add Employee**: QA_AV Olivia Other (with login `qa_av_other`, ESS, Enabled, **does not report to Sam**). Used by US-LV-0003 tests. Give her a QA_AV Vacation entitlement too
- [ ] Ellie › **Report-to** tab: add Sam as Supervisor
- [ ] **Leave › Configure › Leave Types**: check that a type exists (e.g. "CAN - Vacation") or add `QA_AV Vacation`
- [ ] **Leave › Entitlements › Add Entitlements**: Ellie, QA_AV Vacation, current period, **5 days**
- [ ] **Leave › Configure › Holidays**: add `QA_AV Holiday` on a weekday in the next 2 weeks
- [ ] Note today's Work Week setting (Sat/Sun non-working by default (verify))

## Reusable input values

| Purpose | Value |
|---|---|
| Valid first/last name | `QA_AV Test` / `Person` |
| Max-length check | 30+ char string: `QA_AVabcdefghijklmnopqrstuvwxyz0123456789` |
| Special chars | `O'Brien-Smith` (valid), `<script>alert(1)</script>` (should be stored as text) |
| Leading/trailing spaces | `  QA_AV Spaces  ` |
| Unicode | `José Ñúñez`, `李明` |
| Duplicate Employee Id | reuse Ellie's Employee Id |
| Valid photo | `test-files/photo-200x200.jpg` (< 1 MB) |
| Oversized photo | `test-files/photo-2mb.jpg` (> 1 MB) |
| Wrong file type | `test-files/not-an-image.pdf` |

> Make a local `test-files/` folder with these files. Keep it out of git if the files are large.

## Leave dates cheat sheet
Fill in real dates at the start of each execution day:

| Label | Date | Why |
|---|---|---|
| Next working Monday | [ ] | Normal 1-day leave |
| Fri → following Mon | [ ] → [ ] | Weekend should not count |
| QA_AV Holiday | [ ] | Should count as 0 days |
| 6 working days span | [ ] → [ ] | Exceeds the 5-day entitlement |
| Yesterday | [ ] | Past-date behavior |
