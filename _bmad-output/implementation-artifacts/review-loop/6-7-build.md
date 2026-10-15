# Review loop log: ticket 6.7 build (code mode)

State: pass 1: done
Range: 405936e..HEAD (single build commit 48c74ab). Pre-loop HEAD 48c74abea97e34fbdf9d91f7d1d2ac823bd70871, tree snapshot 0: 8965422ecf0cb6f686dcb98f774be80184c1cabc
Target diff: .passes/pass0.diff. Intent: story-end-sheet-history-unreadable-block-and-reset-history-plan.md

## Pass 1
Reviewers: correctness, edge cases, verification gap, intent alignment  |  Findings: major 1, minor 8 (after merge), decision-needed 0  |  Dropped in triage: 2
Snapshot: tree dba94705e8f79b748efc4f37c0a88931ac35a005
### Applied (sent to fixer)
- [major] ResetConfirm.svelte:25-29 / overlays.svelte.test.ts — plan's unit task "not set with Statistics open" has no unit test; only e2e covers the `fromSheet` guard → fixer item 1 (default applied: add a unit test if a component-test pattern exists in the repo, else amend the plan's task to cite the e2e tests)
- [minor] EndSheet.svelte:531-534 — inner `status === 'unreadable'` silently drops the sentence (rule 6) → item 2
- [minor] e2e/end-sheet.spec.ts:213-222 — win test only for variant 0 → item 3
- [minor] e2e/end-sheet.spec.ts:240-272 — Undo step does not assert play resumed; relaunch notice test does not re-read stored history after Keep it/Esc/scrim/back → item 4
- [minor] plan file — task checkboxes unticked despite status built → item 5
- [minor] ResetConfirm.svelte:25 — comment that notice-over-expanded-sheet is an intended flag case → item 6
### Default applied (technical)
- guard test placement; sentence-source (throw as HistoryNotice does)
### Decision needed
- none
### Dropped
- text.ts "catalogue row 103" unverifiable — EXPERIENCE.md line 103 is that row; citation correct
- AD-13 test names — matches existing names in the same file (lines 316, 419), AD-13 is a bound id; style only

## Pass 2
Reviewers: fix diff, edge cases, verification gap, intent alignment  |  Findings: major 0, minor 2, decision-needed 0  |  Dropped in triage: 0
### Applied
- none (no major)
### Unapplied minors
- e2e/end-sheet.spec.ts:214,222 — block tests named R-84; the unreadable-history rule is §2/Q-33 (rename for id tracing)
- e2e/end-sheet.spec.ts:203-211 expectBlock — no assertion of DOM order (block under stat lines, above Replay/Statistics) or the danger styling; only the screenshot baseline covers them
- Pass 1 carried: AD-13 test names; guard covered by e2e not unit test (plan amended)

State: pass 2: done

## Result — converged after 2 passes
Final state: npm test 2520 passed, lint clean, check 0 errors (run after pass 1 fixes, no later changes).
