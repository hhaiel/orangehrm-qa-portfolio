# Test Plan: OrangeHRM Open Source 5.x

| | |
|---|---|
| **Document version** | 1.0 |
| **Author** | [Your name] |
| **Date** | [YYYY-MM-DD] |
| **Status** | Draft / Final |

## 1. Purpose
Verify that the core HR workflows of OrangeHRM Open Source work correctly for Admin and Employee (ESS) users: managing system users, maintaining employee records, and the full leave lifecycle. Find and report defects that would affect a real HR team.

## 2. Application under test
| | |
|---|---|
| Product | OrangeHRM Open Source |
| Version | OrangeHRM OS 5.9 (user menu → About, checked 2026-11-25; demo had 166 active / 1 terminated employees) |
| Environment | [Public demo: https://opensource-demo.orangehrmlive.com] / [Local Docker: http://localhost:8080] |
| Type | Web application (PHP/Vue, REST API at `/web/index.php/api/v2`) |

## 3. Scope

### In scope
| Module | Features |
|---|---|
| **Admin › User Management** | Add / search / edit / delete system users; user roles (Admin, ESS); enable/disable status |
| **PIM** | Add employee (with/without login), employee list search and filters, edit Personal Details, profile photo upload, delete employee |
| **Leave** | Leave types, entitlements, apply leave, assign leave, approve/reject/cancel, leave list, balance calculation, validations (overlap, insufficient balance, weekends/holidays) |
| **Cross-cutting** | Login/logout, role-based access (ESS cannot reach Admin pages), required-field and format validation |

### Out of scope
- Time, Recruitment, Performance, Claim, Buzz, Directory, Maintenance modules (possible future phase)
- Email notifications (the demo has no mail server)
- Performance/load and security penetration testing
- Mobile app, LDAP/OAuth configuration
- Localization other than English

## 4. Test approach
| Type | How |
|---|---|
| **Functional / UAT** | Scripted test cases derived from reverse-engineered user stories and ACs |
| **Negative and boundary** | Empty required fields, max lengths, invalid formats, duplicate values, date edges |
| **Role-based access** | Repeat key actions as an ESS user; try direct URLs to Admin pages |
| **Exploratory** | Short, time-boxed sessions per module to find issues scripts miss |
| **UI automation** | Playwright + TypeScript, Page Object Model; ~20 tests automated from manual cases marked "Auto" |
| **API testing** | Playwright `request` against `/web/index.php/api/v2`, used for test data setup and 5–8 API tests |
| **Regression** | Automated `@regression` suite runs in GitHub Actions on every push; `@smoke` subset for quick checks |

### Manual vs. automated
| Automate | Keep manual |
|---|---|
| Repeatable flows (add employee, apply/approve leave) | Visual/layout checks, look and feel |
| Role/permission checks | One-off exploratory sessions |
| Validation rules with many data variations | Features with unstable UI or that need human judgment |
| Anything needed as regression | File-type edge cases that are slow to set up |

**Automation environment:** local OrangeHRM in Docker (stable, isolated data), not the shared public demo.

**Test design techniques:** equivalence partitioning, boundary value analysis, state transition (leave statuses), decision tables (leave balance rules).

## 5. Roles and test accounts
See [test-data.md](test-data.md). Minimum: 1 Admin, 1 ESS employee with a supervisor, 1 supervisor (ESS who is someone's "Report-to").

## 6. Entry criteria
- Environment reachable and Admin login works
- Version recorded
- User stories and ACs written for all in-scope modules
- Test data created

## 7. Exit criteria
- 100% of planned test cases executed (or marked Blocked with a reason)
- All failures have a logged defect
- No open Critical defects without a note
- Test summary report completed

## 8. Deliverables
| Deliverable | Location |
|---|---|
| Test plan | `docs/test-plan.md` |
| User stories + ACs | `user-stories/` |
| Test cases | `test-cases/` |
| Defect log + reports | `defects/` + Jira project `OHRM` (screenshots in `evidence/jira/`) |
| Evidence | `evidence/` |
| Automation suite (UI + API) | `automation/` |
| CI pipeline + HTML report | `.github/workflows/`, GitHub Actions artifacts |
| Test summary report | `docs/test-summary-report.md` |

## 9. Defect management
- Severity: **Critical** (data loss, feature unusable), **High** (main feature broken, no workaround), **Medium** (partly broken / workaround exists), **Low** (cosmetic, typo)
- Status flow: New → (Confirmed) → Closed / Won't Fix. There is no dev team here, so "Closed" means re-verified or accepted as known behavior.
- Each defect has steps, expected, actual, and evidence.

## 10. Risks and mitigations
| Risk | Impact | Mitigation |
|---|---|---|
| Public demo is shared and resets periodically | Test data disappears or is changed by others | Prefix all data with `QA_`; recreate data per session; or use local Docker |
| No official requirements | Disagreement on "expected" behavior | Document assumptions in ACs; tag uncertain findings "Needs confirmation" |
| Demo may be slow or down | Execution delays | Fall back to local Docker install |
| Flaky automated tests | False failures, lost trust in the suite | Web-first assertions, no fixed waits, unique data per run, API setup, `--repeat-each` checks |
| Version on demo may change mid-project | Results not reproducible | Record version at start and on each execution day |

## 11. Schedule
| Phase | Planned dates |
|---|---|
| Setup | [ ] |
| User stories + ACs | [ ] |
| Manual test cases, execution, defects | [ ] |
| Playwright foundations | [ ] |
| Automation suite (UI + API) | [ ] |
| CI pipeline | [ ] |
| Reporting | [ ] |

## 12. Assumptions
- Admin can do everything; ESS users only see their own data and My Info / Leave / Time.
- Leave rules follow the configured leave period, work week and holidays.
- [Add more as you discover them]
