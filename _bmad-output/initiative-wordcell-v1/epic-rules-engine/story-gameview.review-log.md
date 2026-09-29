# Review log — story-gameview.md (ticket 2.8)
State: pass 3: done

Mode: docs, thorough, max 7, budget 1500 words. Pass 0: HEAD 56a870c, copy `story-gameview.review-log.passes/pass0.md`, 194 words.
Refs: SPEC.md, build-notes.md, rule-coverage.md (spec-epic-2-rules-engine), epic-rules-engine.md, ARCHITECTURE-SPINE.md, AGENTS.md; done-ticket plans: story-golden-deal-test-and-r-id-test-names-plan.md, story-langdata-en-and-lettercount-plan.md, story-session-createsession-replay-and-checksession-plan.md, story-composing-commands-and-the-command-table-plan.md, story-validate-and-place-commands-with-the-8-worked-example-plan.md, story-undo-redo-give-up-and-accrue-plan.md, story-scoring-penalty-and-bands-plan.md.

## Pass 1 — 2026-09-29
Reviewers: builder's reading, edge-case hunter, adversarial, ref alignment  |  Findings: major 9, minor 9, decision-needed 0  |  Dropped in triage: 0 (duplicates merged across lenses)
Words (docs): 956 (4.9x pass 0; stated budget 1500)  |  Snapshot: story-gameview.review-log.passes/pass1.md
Fixer: all 18 items applied; example check code r31-destination-count checked in rules.ts.
### Applied
- [major] Notes open question / Description — how view reuses throwing guards → view replays once, flags from boolean predicates extracted into rules.ts, check*/reducers throw on false, view never calls apply or catches EngineError; open question closed → fixer item 1
- [major] Description — GameView shape unpinned (names, indexing, plain data) → fixer item 2
- [major] Description — index.ts export of view / GameView and index.test.ts list → fixer item 3
- [major] AC / References — CAP-7 rows of rule-coverage missing (R-30, R-36 too-short D7, R-83 longest absent, §2 inProgress/status); naming R → §/Q → AD-3, never R-39/R-82 → fixer item 4
- [major] AC — flag agreement state set and parameter sweep unnamed → fixer item 5
- [major] AC — kIfTapped values not checked against apply → fixer item 6
- [major] AC — no test that view rejects the Sessions replay rejects (SPEC CAP-3) → fixer item 7
- [major] AC — won states via winSeed; end values present for won/gaveUp, absent while playing; finalScore hand-off from 2.7 → fixer item 8
- [major] AC — build-notes CAP-7 boundary cases not named (redo tail, ties, all-phase used/isLegalTarget, absence, lowercase qu, canValidate false codes, pending draft absent after give up) → fixer item 9
- [minor] items 10–18 (k = 0 empty destination; D6 R-41 and ≤ 0 delta; inProgress boundaries; longestWord signature; legal targets ascending; kIfTapped placement/empty map; columns are committed-prefix; "build-notes table" wording; structural result shape)
### Default applied (technical)
- guard reuse → boolean predicates in rules.ts, no try/catch in view
- GameView shape → AD-3 names verbatim, columns/cells arrays of entries carrying their 1–8 / 3–10 number, plain data
- longest word → internal `longestWord(session, lang)`
- legal targets → ascending cell number
- kIfTapped → on the destination column's entry only, empty map when the remainder is empty
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- none

## Pass 2 — 2026-09-29
Reviewers: fix diff, edge-case hunter, adversarial, ref alignment  |  Findings: major 4, minor 13, decision-needed 0  |  Dropped in triage: 0 (duplicates merged across lenses)
Words (docs): 1282 (6.6x pass 0; stated budget 1500)  |  Snapshot: story-gameview.review-log.passes/pass2.md
Fixer: all 17 items applied, no conflicts.
### Applied
- [major] Description, Longest word — `longestWord(session, lang)` cannot spell committed words without the pre-move positions, contradicts "view replays once" and ignores the D2 start → take a start position, collect committed words in the one replay pass; D2-seam test → fixer item 1
- [major] Description, Shape `draft?` — source/destination/freeLetters untyped (column numbers vs S/D card lists) → pin types → fixer item 2
- [major] AC, Flag agreement states — missing states leave predicate branches untested in one direction: canRedo true in Composing (reached ≥ place) and Place (reached = committed), n = 1 destination, Idle with an empty column (canPickUp false), canAddFreeLetter true on a non-empty unused cell, partial self-drop → fixer item 3
- [major] AC, Rule coverage R-12 — what the R-12 view test asserts is unstated → fixer item 4
- [minor] items 5–17 (every can* flag + applyFrom for seam states; k = 0 both cases; score tests named R-80/R-81; faces shape and card order; deep-freeze inputs; gaveUp at index 0 and > 0; Place with used free letter; both kinds of pending draft; spelling = R-37 word not placementOrder; R-30 right side with QU; tests per flag looping states; finalScore observable outcome; index test name; "AD-3 names" wording)
### Default applied (technical)
- longestWord → `longestWord(start, session, lang)`, committed words collected during the single replay
- draft fields → `sourceColumn`/`destinationColumn` 1–8 plus `source`/`destination` CardId lists top→bottom, `freeLetters` WordCellNumber[] in Move order
- test organisation → one test per flag, looping the listed states
- score test names → R-80 liveScore, R-81 displayScore/end values
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- none

## Pass 3 — 2026-09-29
Reviewers: fix diff, edge-case hunter, adversarial, ref alignment  |  Findings: major 4, minor 8, decision-needed 0  |  Dropped in triage: 0 (duplicates merged; faces-glyph finding downgraded to minor, build-notes CAP-2 already binds it)
Words (docs): 1424 (7.3x pass 0; stated budget 1500)  |  Snapshot: story-gameview.review-log.passes/pass3.md
Fixer: all 12 items applied, no conflicts; `dealtStart(seed)` confirmed in src/engine/replay.ts:164.
### Applied
- [major] Description, Longest word — pass 2 fix still contradicts itself: `longestWord(start, session, lang)` replays, yet view "uses it, no second replay" → one internal replay-with-words function view calls once, pure `longestWord(words)` reused by CAP-8 → fixer item 1
- [major] AC, End values — penalty, lettersLeft and band values unpinned; band's input (final vs live score) untested → fixer item 2
- [major] AC, Verify naming — which id each can* agreement test carries is unstated; risk of false R-id coverage → agreement tests named AD-3, rule-coverage R-12/R-31/R-33 assertions separate tests with those ids → fixer item 3
- [major] AC, AD-3 — "plain data" in Shape has no test → structuredClone(view(s)) toStrictEqual view(s) → fixer item 4
- [minor] items 5–12 (faces letter uppercase glyph + QU entry test; pendingDraftWord absent in Idle with no pending draft; Q-41 uncommitted redo-tail move; n = 1 via self-drop, not seam; place field types; pendingDraftWord wording; undo/redo/give-up predicates in commands.ts; check order unchanged)
### Default applied (technical)
- replay structure → internal `replayWords(start, session, lang)` → `{ position, words }`, pure `longestWord(words)`
- flag agreement test names → AD-3
- predicates → move-rule predicates in rules.ts, availability predicates in commands.ts
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- none
