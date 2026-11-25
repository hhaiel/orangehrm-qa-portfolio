# DEF-[nnn]: [Short, specific title: what is wrong + where]

> Copy to `defects/DEF-<nnn>.md`. Write full reports for your **3–5 strongest bugs**. Everything else only needs a row in `defects/defect-log.md`.
> Good title: "Leave balance not restored after cancelling an approved request". Bad title: "Leave bug".

| Field | Value |
|---|---|
| **Defect ID** | DEF-[nnn] |
| **Date reported** | [YYYY-MM-DD] |
| **Reported by** | [Your name] |
| **Feature / module** | [e.g. Leave › My Leave] |
| **Severity** | Critical / High / Medium / Low |
| **Priority** | High / Medium / Low |
| **Category** | Functional / UI/Display / Content / Data Discrepancy / Performance / Error |
| **Status** | New |
| **Environment** | [Public demo / Local Docker], OrangeHRM [version] |
| **Browser / OS** | [Chrome 1xx / Windows 11] |
| **Related test case** | [US-LV-0003-TC-004] |
| **Reproducibility** | Always / Intermittent ([x] of [y] tries) |

## Summary
[One or two sentences: what happens and why it matters to the user/business.]

## Pre-conditions
- Logged in as [role/user]
- [Required data, e.g. Employee QA_AV Ellie has 5 days of QA_AV Vacation]

## Steps to reproduce
1. Go to [Module › Page]
2. [Action]
3. [Action]
4. Observe [what]

## Expected result
[What should happen, citing the AC: "Per US-LV-0003 AC4, the 2 days are returned; balance shows 5.00."]

## Actual result
[What actually happens, with the exact text/values: "Balance still shows 3.00 after cancellation."]

## Evidence
- `evidence/DEF-[nnn]-1.png`: [what it shows]
- `evidence/DEF-[nnn]-2.png`: [what it shows]
- Console/Network errors (if any): [e.g. `PUT /api/v2/leave/...` returned 500]

## Notes
- [Workaround, if any]
- [Related defects]
- [Needs confirmation: why expected behavior is uncertain]

---
### Severity guide
| Severity | Meaning | OrangeHRM example |
|---|---|---|
| Critical | Data loss, security hole, core feature unusable | ESS user can open and edit other employees' records |
| High | Main feature broken, no workaround | Leave balance calculated wrongly |
| Medium | Partly broken or a workaround exists | Search filter ignores Sub Unit |
| Low | Cosmetic, typo, alignment | Label misspelled, misaligned button |

**Priority** = how soon it should be fixed (business urgency). **Severity** = how bad the impact is. A typo on the login page can be Low severity but High priority.
