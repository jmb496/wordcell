---
title: 'Refactor sweep: code'
type: 'refactor'
ticket: '16'
created: '2026-10-16'
status: 'built'
baseline_revision: '1e2ad495d2ad7bfc0c7b089fcb87e1ca72d05cef'
route: 'oneshot'
route_source: 'auto'
review: 'quick'
review_source: 'auto'
lenses_ran: [quick]
review_loop_iteration: 0
followup_review_recommended: false
context: []
warnings: []
deferred: []
---

<intent-contract>

## Intent

**Problem:** Epic 6 left deferred minors; only comment-history rows name code in the five sweep categories.

**Approach:** Apply the three comment-only rows (no code, no behaviour, no baseline change); every other deferred item is handed to 6.17 or recorded for the owner.

</intent-contract>

## Tasks & Acceptance

(Oneshot.) Acceptance is the ticket's checkable form: `npm run test:all` and `npm run test:screens` green, no baseline, message-string, engine-export or fixture change, no test title changed.

## Implementation Notes

Oneshot: about 15 changed comment lines in three files, no logic. The inventory was compiled from the epic review logs, build review-loop Results, done-plan `deferred:` fields, autopilot handoff/log and build-notes Carry-ins. Tickets 6.1-6.15 are all done, so every `deferred:` list counted.

### Sweep inventory

| id | source | file | category | action | outcome |
|---|---|---|---|---|---|
| D1 | review-loop 6-3 Result (Menu header comment overlong) | `src/ui/Menu.svelte` | comment history paragraphs | Re-wrap to 100 columns; drop ticket narration (6.2, 6.10, 6.11); keep CAP-2/3/10, F5/F6/F8, AD-3, R-75 | applied |
| D2 | review-loop 6-3 Result (same minor) | `src/architecture-new-game.test.ts` | comment history paragraphs | Re-wrap header; drop `ticket 6.3:`/`6.1` narration; keep CAP-1, R4, F1, AD-1 | applied |
| D3 | review-loop 6-14 pass-1 minor (overlong comment) | `src/ui/gestures/tile-drag.ts` | comment history paragraphs | Re-wrap only; CAP-5, F3 kept | applied |
| D4 | review-loop 6-11 Result (keys.ts view row vs `Controller.activate`) | `src/ui/keys.ts`, `src/ui/gestures/controller.ts` | controller or overlays simplification | Sequences differ in behaviour (Composing/Place, Space reopen); merge would change behaviour | recorded for owner |
| D5-D6, D8-D9 | review-loop 6-1, 6-3, 6-5 (presence/exit rendering, `data-presence-target` check, silent focus guards, jsdom) | `presence.svelte.ts`, `Panel/Dialog/Sheet/WordCellView.svelte`, panels | duplicated surface code | Bug fix, new assertion or behaviour change (rule-6 silent skip) | recorded for owner |
| D7 | handoff "Worth knowing" (latent AD-13 throw from `openSurface('resetConfirm')` over History notice) | `src/ui/open-surface.ts` | controller or overlays simplification | Bug fix, not cleanup | recorded for owner |
| D10 | review-loop 6-5/6-7 (`?? 0`, inner status guards) | `StatisticsPanel.svelte`, `EndSheet.svelte` | duplicated surface code | Fixed in those builds | already satisfied |
| D11 | 6.15 review log (export shared locators) | `e2e/helpers/keys.ts`, `e2e/helpers.spec.ts` | shared e2e helpers | Already exported and asserted | already satisfied |
| D12-D13 | review-loop 6-15 (comment on `synced`; `waitForDictionary` in step 4) | `e2e/surfaces-success.spec.ts` | shared e2e helpers | Spec edit/new wait, outside the categories | recorded for owner |
| D14-D15 | 6.13 `deferred:` (tree scan if new dispatching module); review-loop 6-2 (scan accepts define) | `src/ui/labels.test.ts`, `src/architecture-ad1.test.ts` | AD-1 and AD-2 scans | Condition not met / case exists; no scan edit | already satisfied |
| D16 | review-loop 6-1 (opacity/ownership) | `presence.svelte.ts` | controller or overlays simplification | Behaviour | recorded for owner |
| D17, D19-D22, D24, D26-D32, D36-D42, D44-D45 | review logs, plan `deferred:`, handoff: scrim over top bar/menu (owner option A), pointer-press focus, focus ring offset, test strength/renames/new assertions, `releaseHold` rename (outside Owns), copy wording, baselines, flaky drag tests, roving model | various | outside categories | Owner decision, behaviour/UX, bug fix, test rename or new assertion, baseline change, or outside Owns | recorded for owner |
| D18, D23, D25, D33, D34, D43 | plan `deferred:`/carry-ins (Esc handler, menu row height, lint warning, scroll comment, F3/F6/F7 carry-ins, key-label module) | various | various | Checked against code | already satisfied |
| D35, D38 (wording), D40, D45, D46-D48 | handoff, logs: CAP-12 rule-coverage gap, build-notes/SPEC/EXPERIENCE/spine edits, ticket and plan text | docs | n/a | Paperwork | handed to 6.17 |
| D49 | plans with `deferred: []` | n/a | n/a | none | none |

Category rows: duplicated surface code D5-D6, D8-D10 (no code merge applied); controller or overlays simplification D4, D7, D16; comment history D1-D3; shared e2e helpers D11-D13 (no helper moved, no helper -> spec map); scans D14-D15 (no scan edited, so no planted violation or scan rerun needed).

### Checks

- Non-comment token diff: empty (every changed line is a `//` comment line).
- Id citations: only ticket numbers removed (6.1, 6.2, 6.3, 6.10, 6.11); every R-/Q-/§/AD-/F-/CAP- citation preserved.
- No probe: comment-only rows, no rendered output touched.
- No test title, baseline, message string, engine export or fixture changed.

## Plan Change Log

## Review Triage Log

### 2026-10-16 — Review pass
- verdicts: 5 findings — high 0, medium 0, low 1, false 4, maybe-false 0
- findings:
  - `[low]` `[patch]` Plan records no gate results — patched: results recorded under Auto Run Result.
  - `[low]` `[reject]` Frontmatter `deferred:` empty while owner items sit in the inventory — the ticket defines the inventory table as the record the retrospective reads; `deferred:` is for review findings, and the reviewer raised none to defer.
  - `[false]` `[reject]` Menu.svelte re-wrap claim unmet — the reviewer's own check found every comment line within 100 columns.
  - `[false]` `[reject]` Token diff not empty — reviewer confirmed it holds.
  - `[false]` `[reject]` Ticket numbers or ids lost — reviewer confirmed all ids kept and no ticket narration left.

## Verification

**Commands:**
- `npm run lint && npm run check && npm test` -- expected: green
- `npm run test:all` -- expected: green
- `npm run test:screens` -- expected: green, no baseline change

## Auto Run Result

- Summary: comment-history trim on three files (inventory rows D1-D3); every other deferred item is `recorded for owner` (bug fixes, owner decisions, test renames/new assertions, baselines, items outside Owns), `already satisfied`, or `handed to 6.17` (paperwork).
- Files changed: `src/ui/Menu.svelte` (header comment trimmed, ids kept), `src/architecture-new-game.test.ts` (header comment trimmed), `src/ui/gestures/tile-drag.ts` (comment re-wrapped).
- Review: 0 patches to code, 1 plan patch (this section), 0 deferred, 4 rejected with reasons in the triage log. Follow-up review recommended: false.
- Verification: `npm run lint`, `npm run check`, `npm test` (72 files, 2755 tests) passed; `npm run test:all` exit 0; `npm run test:screens` exit 0 (37 passed, 13 skipped, no baseline change; `git status` shows no baseline files). Non-comment token diff empty.
- Residual risks: the unit-median and build-size before/after numbers were not re-measured on a Linux-filesystem checkout; the change is comments only, so neither can move (the unit run took 15 s cold on `/mnt/d`, not the budgeted measure). 6.17 owns the budget measurement.
