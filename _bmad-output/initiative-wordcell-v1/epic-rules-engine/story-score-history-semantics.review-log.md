# Review log — story-score-history-semantics.md (ticket 2.9)
State: pass 2: done

Mode: docs, thorough, max 7, budget 1500 words. Pass 0: HEAD 9edbe7f, copy `story-score-history-semantics.review-log.passes/pass0.md`, 110 words.
Refs: SPEC.md, build-notes.md, rule-coverage.md (spec-epic-2-rules-engine), epic-rules-engine.md, ARCHITECTURE-SPINE.md, AGENTS.md; done-ticket plans: story-golden-deal-test-and-r-id-test-names-plan.md, story-langdata-en-and-lettercount-plan.md, story-session-createsession-replay-and-checksession-plan.md, story-composing-commands-and-the-command-table-plan.md, story-validate-and-place-commands-with-the-8-worked-example-plan.md, story-undo-redo-give-up-and-accrue-plan.md, story-scoring-penalty-and-bands-plan.md, story-gameview-plan.md.

## Pass 1 — 2026-09-29
Reviewers: builder's reading, edge-case hunter, adversarial, ref alignment  |  Findings: major 10, minor 6, decision-needed 0  |  Dropped in triage: 0 (duplicates merged across lenses)
Words (docs): 716 (6.5x pass 0; stated budget 1500)  |  Snapshot: story-score-history-semantics.review-log.passes/pass1.md
Fixer: all 16 items applied; no commands touched.
### Applied
- [major] AC — Verify line drops most of SPEC CAP-8 success (gameRecord null while playing, fields in AD-6 order, finalScore after R-81, longestWord omitted, spelling lowercase "qu", R-76 activeMs won + gaveUp, 0 included) → fixer item 1
- [major] Description — HISTORY_VERSION owner unstated while AD-6 needs it for `version`; tickets.toml entry 11 claims it → fixer item 2 (entry 11 note left for its own review; tickets.toml outside this loop's commit)
- [major] Description — index.ts exports and the exact AD-2 list in index.test.ts unstated; files touched → fixer item 3
- [major] Description / References — signatures, statistics field names and contract refs missing → fixer item 4
- [major] AC — R-74 record test undefined (same seed appends twice, un-finish removes only the last) → fixer item 5
- [major] AC — remove/isRecorded compare only the last record against gameRecord(before); same-reference cases; one test per single-field mismatch; earlier match not removed → fixer item 6
- [major] AC — Q-43: finalScore/longestWord never compared; test with differing values still matches → fixer item 7
- [major] AC — R-84 "at most once", "never replayed", "ties" have no defined test → fixer item 8
- [major] Description / AC — statistics scope (D4 all records, gaveUp negatives), absent keys on empty, rounding cases that rule out trunc/ceil (x.5, −x.5, non-half negative) → fixer item 9
- [major] Description — gameRecord source unpinned; must agree with view (committed prefix only, pending draft/redo tail excluded) → fixer item 10
- [minor] items 11–16 (deep-frozen inputs, no mutation; test naming ids; gaveUp/activeMs construction via apply/accrue; "earliest" = lowest index; AD-6 key order and omitted keys; helper symbols longestWord/winSeed)
### Default applied (technical)
- HISTORY_VERSION = 1 defined in history.ts by this ticket
- index.ts exports gameRecord, reconcileHistory, isRecorded, statistics, HISTORY_VERSION + GameRecord/Statistics types; index.test.ts list updated
- gameRecord built from the same replayWords/scoring.finalScore/longestWord as view
- test names: R-84 (A-E3 / Q-43 in the text), R-74, R-76
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- none

## Pass 2 — 2026-09-29
Reviewers: fix diff, edge-case hunter, adversarial, ref alignment  |  Findings: major 4, minor 13, decision-needed 0  |  Dropped in triage: 0 (duplicates merged: key order ×3, won activeMs ×4, names ×3, R-74 ×2)
Words (docs): 1009 (9.2x pass 0; stated budget 1500)  |  Snapshot: story-score-history-semantics.review-log.passes/pass2.md
Fixer: all 15 items applied; undo/accrue/redo won path checked against commands.ts; no commands touched.
### Applied
- [major] AC gameRecord — "keys in AD-6 order, checked with toStrictEqual": toStrictEqual ignores key order → assert Object.keys(record) → fixer item 1
- [major] AC reconcileHistory — no removal test for an undone give-up (R-75 un-finish shape differs from undoing a win) → fixer item 2
- [major] AC statistics — counts only checked on empty; no strictly-longer later word; no all-six assertion on a mixed history; negative best → fixer item 3
- [major] AC Construction / R-76 — won Session with non-zero activeMs not constructible as stated (winSeed finishes internally, accrue no-op after) → fixer item 4
- [minor] items 5–17 (R-74 records distinguishable; all other tests named R-84; Notes hand-off for entry 11 HISTORY_VERSION; Statistics types and count definitions; Touches reuse list; local deepFreeze copy; never-replayed uses toEqual; discriminating redo-tail test; seed choice for qu/tie tests; −0 average normalised; reconcile assumes after derives from before (AD-4))
### Default applied (technical)
- key order → `expect(Object.keys(record)).toEqual([...])`
- won non-zero activeMs → winSeed → undo → accrue → redo
- averageScore −0 → normalised to 0, case 1 and −2 → 0
- deepFreeze → local copy in history.test.ts
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- none
