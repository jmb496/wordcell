# Review loop — ticket 2.11 build (code mode)
State: pass 2: done

Target: `23f2111..HEAD` (commit 9ce1533), diff at `2-11-build.passes/pass0.diff` (git-ignored)
Intent: `_bmad-output/initiative-wordcell-v1/epic-rules-engine/story-history-serialise-and-parse-and-the-epic-s-scripted-game-plan.md`
Depth: thorough (correctness, edge cases, verification gap, intent alignment), max 7
Pre-loop: HEAD 9ce1533, tree snapshot 0 93a773e10e606041857a842ee6a4ca866728d2fd

## Pass 1 — 2026-09-29
Reviewers: correctness, edge cases, verification gap, intent alignment  |  Findings: major 1, minor 5 (4 applied), decision-needed 0  |  Dropped in triage: 0
Snapshot: tree f6daf32632b9f1a68abc6d02d9a71919d5d12978 (fix diff `2-11-build.passes/pass1.fix.diff`). Fixer and orchestrator: `npm test` 1285 passed, lint pass, check 0 errors.
### Applied
- [major] `serialize.ts` checkRecord spelling guard / `serialize.test.ts` checkRecord table — the anchored `^[a-z]+$` is not pinned (a `/[a-z]/` mutant stays green); add mixed-case (`lqueJata`) and non-letter (`tan1`) rows → fixer item 1
- [minor] `serialize.test.ts` inline boundaries — record-not-object only tested with null; add an array record `[]` row → fixer item 2
- [minor] `serialize.propagation.test.ts` — the plan's "only a SyntaxError from JSON.parse is version-unreadable" is untested; add a JSON.parse-throws-TypeError rethrow case → fixer item 3
- [minor] `serialize.ts` parseHistory JSDoc — returned records keep the stored key order; only serializeHistory guarantees AD-6 order → fixer item 4
### Default applied (technical)
- `serialize.propagation.test.ts` — rethrow branch of the JSON.parse catch → pinned with a `mockImplementationOnce` TypeError case
- `serialize.ts` parseHistory — raw parsed records returned in stored key order → keep behaviour, document it
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- none (the `-0` version minor is kept unapplied, not dropped: same as the 2.10 loop's unapplied parseSession minor)

## Pass 2 — 2026-09-29
Reviewers: fix diff, edge cases, verification gap, intent alignment  |  Findings: major 1, minor 1, decision-needed 0  |  Dropped in triage: 0
Snapshot: tree f6daf32632b9f1a68abc6d02d9a71919d5d12978 (no fix pass; HEAD ba24baa). `npm test` 1285 passed, lint pass, check 0 errors.
### Applied
- none (stopping rule: passes 1 and 2 each yielded at most one major; the pass-2 major is recorded as open, not fixed)
### Open (not fixed)
- [major] `src/engine/serialize.test.ts` history fixture/inline blocks — the checkRecord order ("checks run in exactly the ticket's order, first violation wins", plan Always) is pinned only for record-not-object → record-field-set; mutants swapping seed-uint32/outcome, moving record-version, or swapping the two longest-word checks stay green (184/184). Fix: a checkRecord it.each with one row per adjacent check pair, each breaking checks n and n+1 and asserting check n's code.
### Default applied (technical)
- none
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- none

## Result — converged after 2 passes
open major: checkRecord check order untested beyond the first pair (see Pass 2 Open).

Unapplied minors:
- `serialize.ts` parseHistory version stage — a container version `-0` gives `version-unknown` with `version: -0` (same as parseSession, 2.10 loop minor); pin with one inline case or normalise.
- `serialize.test.ts` — nothing proves serializeHistory copies the container and record `version` rather than writing `HISTORY_VERSION` (mutants stay green); add a version-2 frozen history case asserting both versions in the text are 2.
