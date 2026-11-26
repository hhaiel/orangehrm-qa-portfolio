# Test Cases

One file per module, created from `templates/test-case-template.md`. These files are the record. If you use a spreadsheet as scratch space during execution, copy the results back here when a module is done.

| File | Module | # Cases | Executed | Pass | Fail | Blocked |
|---|---|---|---|---|---|---|
| `TC-AD.md` | Admin › User Management | 6 | 6 | 5 | 1 | 0 |
| `TC-PIM.md` | PIM | 9 | 9 | 6 | 3 | 0 |
| `TC-LV.md` | Leave | 17 | 17 | 16 | 1 | 0 |
| **Total** | | 32 | 32 | 27 | 5 | 0 |

All cases executed. US-PIM-0001-TC-005 (photo upload) was run manually.

Exploratory session notes: `EXP-<MOD>-<n>.md` (from `templates/exploratory-session-template.md`).

**Workflow:** user story file → test-case-writer skill → paste table here → execute → on Fail, bug-hunter skill → `defects/defect-log.md` → Jira bug.
