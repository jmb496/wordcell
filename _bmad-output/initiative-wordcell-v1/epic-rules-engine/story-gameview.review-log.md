# Review log — story-gameview.md (ticket 2.8)
State: pass 1: done

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
