# Review log — story-validate-and-place-commands-with-the-8-worked-example.md (ticket 2.5)
State: pass 4: done (converged)

Mode: docs, thorough, max 7, budget 1500 words. Pass 0: HEAD 38243a1, copy `story-validate-and-place-commands-with-the-8-worked-example.review-log.passes/pass0.md`, 151 words.
Refs: SPEC.md, build-notes.md, rule-coverage.md (spec-epic-2-rules-engine), epic-rules-engine.md, ARCHITECTURE-SPINE.md, AGENTS.md; done-ticket plans: story-golden-deal-test-and-r-id-test-names-plan.md, story-langdata-en-and-lettercount-plan.md, story-session-createsession-replay-and-checksession-plan.md, story-composing-commands-and-the-command-table-plan.md.

## Pass 1 — 2026-09-29
Reviewers: builder's reading, edge-case hunter, adversarial, ref alignment  |  Findings: major 10, minor 3, decision-needed 0  |  Dropped in triage: 1 (plus duplicates merged across the four lenses)
Words (docs): 922 (6.1 x pass 0)  |  Snapshot: story-validate-and-place-commands-with-the-8-worked-example.review-log.passes/pass1.md
Fixer: all 13 items applied; no commands touched.
### Applied
- [major] Description, validate — check order contradicts build-notes CAP-4 (dictionary presence before R-36); check codes unnamed (new dictionary code) → fixer item 1
- [major] AC "the new table rows" — rows not enumerated (wrong phase, gaveUp status, dictionary, domain, equal no-op, non-permutation) → fixer item 2
- [major] validate outcomes — R-38 failed Validate (same reference, redo kept, `rejectedWord`, QU "qu") and R-71 successful-Validate advance unspecified → fixer item 3
- [major] setTarget/setPlacementOrder — R-71 Place-edit lowering, tail drop, R-51 target change keeps order, AD-2 no-op/throw unspecified; R-71 scope vs entry 6 unclear → fixer item 4
- [major] confirm — no R-60 test (discard redo, reached committed, cursor, commit position) → fixer item 5
- [major] "legal targets" not observable without `view` (entry 8) → fixer item 6
- [major] R-40/R-42 boundaries (10+ letters clamp to 10, L = 3) and R-36 QU boundary untested → fixer item 7
- [major] R-51 default order on a right-side draft with k ≥ 2 untested → fixer item 8
- [major] §8 test assertions and "DEKA… impossible" mechanism unspecified → fixer item 9
- [major] References omit SPEC CAP-4/D2, build-notes CAP-4, rule-coverage, AD-2, ticket 2.4 plan → fixer item 10
- [minor] Notes — stale open question → fixer item 11
- [minor] no-op comparison — sameDraftData omits cursor/gaveUp (entry 4 hand-off) → fixer item 12
- [minor] out-of-scope/exempt sentences not named → fixer item 13
### Default applied (technical)
- dictionary-missing check code → new `command-dictionary`, listed in errors.ts
- legal-target observation → validate's default `targetCell` = min(L, 10), `setTarget` accepted up to it, next cell throws `r40-target-cell`
- R-71 split → this ticket implements and tests its commands' advance/edit semantics; enablement, undo, redo stay entry 6
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- growth-budget caution (adversarial) — guidance, not a defect; passed to the fixer as a constraint

## Pass 2 — 2026-09-29
Reviewers: fix diff, edge-case hunter, adversarial, ref alignment  |  Findings: major 5, minor 11, decision-needed 0  |  Dropped in triage: 0 (duplicates merged)
Words (docs): 1220 (8.1 x pass 0; budget 1500)  |  Snapshot: story-validate-and-place-commands-with-the-8-worked-example.review-log.passes/pass2.md
Fixer: all 13 items applied; no commands touched.
### Applied
- [major] AC — no R-52 test (new top card is the next free letter after a commit) → fixer item 1
- [major] AC R-71 bullets — API not stated; SPEC D2 puts no-op/redo semantics on public `apply` → fixer item 2
- [major] AC — R-50 accepting sentence ("any order") has no R-50-named test; confirm never shown pushing a non-default order → fixer item 3
- [major] AC §8 — R-41 sentences covered only inside the §8 group, no R-41-named test; §8 test name id unstated → fixer item 4
- [major] AC §8 — bullets read as one flow that cannot run (Place → addFreeLetter needs undo; BALKED confirm consumes the start) → fixer item 5
- [minor] Description — "validate … advances (discard redo data first)" contradicts R-38 failed Validate → fixer item 6
- [minor] Check codes — r36/r40/r50 guards are private in rules.ts; errors.ts reused list → fixer item 7
- [minor] missing dictionary — `dictionary: undefined` counts as missing → fixer item 8
- [minor] "accepted" ambiguous at the default target (no-op) → fixer item 9
- [minor] §8 FAKED/FLAKED assertions unstated; BAKED/BALKED full target range → fixer item 10
- [minor] R-40 boundary — use letter count exactly 10 → fixer item 11
- [minor] Idle wrong-phase rows over a pending committed draft → fixer item 12
- [minor] Description sentence omits R-36–R-38 → fixer item 13
### Default applied (technical)
- R-71/R-38/no-op semantics tests → public `apply` on a real-seed Session (D2); edge cases stay on the seam
- guards → export `checkLetterCount`/`checkTargetCell`/`checkPlacementOrder` from rules.ts, one guard per code
- `ctx.dictionary === undefined` → `command-dictionary`
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- none

## Pass 3 — 2026-09-29
Reviewers: fix diff, edge-case hunter, adversarial, ref alignment  |  Findings: major 3, minor 9, decision-needed 0  |  Dropped in triage: 2 (duplicates merged)
Words (docs): 1333 (8.8 x pass 0; budget 1500)  |  Snapshot: story-validate-and-place-commands-with-the-8-worked-example.review-log.passes/pass3.md
Fixer: all 12 items applied; no commands touched.
### Applied
- [major] AC Legal targets — pass-2 fix made the 11+ case optional, so the min(L, 10) clamp is untested (regression of pass-1 item 7) → fixer item 1
- [major] AC Legal targets lead-in — "next cell throws `r40-target-cell`" is untestable at L = 10 (cell 11 fails the domain check first) → fixer item 2
- [major] AC — R-38 "validation only when the player taps Validate" and "no auto-confirm" neither tested nor exempt → fixer item 3
- [minor] Description R-71 split — "once the membership check passes" wrongly applied to confirm → fixer item 4
- [minor] §8 lead-in — tap/throw variants stop after the col3 drop; tap follows the col3 drop, not the self-drop → fixer item 5
- [minor] R-41 bullet duplicates §8 BALKED bullet → merge → fixer item 6
- [minor] table rows — check order status/phase before dictionary not pinned → fixer item 7
- [minor] QU failed-Validate case → D2 seam; plain case public apply → fixer item 8
- [minor] R-71 edit test also asserts the commanded targetCell/placementOrder → fixer item 9
- [minor] errors.ts — `command-dictionary` between `command-phase` and `command-domain` → fixer item 10
- [minor] setPlacementOrder non-integer element (1.5) row → fixer item 11
- [minor] §8 / D2 cases use the existing `seam` helper in commands.test.ts → fixer item 12
### Default applied (technical)
- R-38 "only on Validate" → an R-38 test that drop, arrange and setTarget with no `ctx.dictionary` and an out-of-set word never throw or return `rejectedWord`; "no auto-confirm" → R-38 test that a successful validate leaves the cursor at place
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- successful-Validate fixture recipe and R-52 drop recipe (adversarial) — build-plan procedure detail, not ticket contract; the ticket is near budget

## Pass 4 — 2026-09-29
Reviewers: fix diff, edge-case hunter, adversarial, ref alignment  |  Findings: major 0, minor 11, decision-needed 0  |  Dropped in triage: 3 (one major reclassed minor; duplicates merged)
Words (docs): 1333 (8.8 x pass 0; budget 1500)  |  Snapshot: unchanged since pass 3 (no fix pass)
### Applied
- none (converged; minors listed under Result)
### Default applied (technical)
- none
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- adversarial "existing `seam` helper cannot run these tests" as major → reclassed minor (late-pass bar: test-procedure precision; the obvious widening is the default, listed below)
- adversarial "R-30–R-35 skipped in validate's order" — behaviour unambiguous (replay enforces them at Composing); no change
- adversarial "guards need L and word cards" — reviewer itself proposes no ticket change (build-plan detail)

## Result — converged after 4 passes
Majors per pass: 10, 5, 3, 0. Words 151 → 1333 (budget 1500). No decision-needed items.

Unapplied minors (for the build plan or a later loop):
- Description R-71 split — `seam` in commands.test.ts is scoped inside `describe('R-30 word helper')`, passes a dictionary-less ctx and returns only `word(...)`: hoist it to file scope, take a ctx, return the last `ApplyResult` (plus the prior Session for same-reference checks); R-30 tests keep calling `word(...)` on it.
- AC table rows — "every validate row except the missing-dictionary one is built with a dictionary" conflicts with the added gaveUp/Idle dictionary-less check-order rows; say "except the check-order rows", and validate's generic gaveUp row keeps a dictionary (the dictionary-less gaveUp row is separate).
- AC Wrong phase — `PENDING_TAIL` applies to the new Idle rows only (validate, setTarget, setPlacementOrder, confirm), not ticket 2.4's existing rows.
- AC R-38 bullet — setTarget cannot run on a draft "whose word is in no set" (Place needs a successful validate); run setTarget without ctx.dictionary on a Place draft reached by validate with a set holding the word (or a built Session); "in no set" applies to drop and arrange.
- AC successful-Validate bullet — name that test with R-38 too (`R-38 R-71 …`) so "no auto-confirm" has an R-38-named test.
- AC §8 naming — lead-in says `§8 worked example …` but BALKED is `R-41 §8 BALKED …`; use `R-41 §8 worked example BALKED …`.
- AC R-41/BALKED — "leaves the L once" is ambiguous (col3 also holds an L); assert by CardId: cell 6's L CardId appears once, inside cell 6's pushed placementOrder.
- AC R-52 — state which order the BALKED confirm uses (default: new top is the D card) and assert the new top by CardId.
- Out of scope — add R-60 "The commit … never touches later moves" (entry 6) beside "Redo commits without discarding".
- R-41 "travels" — optionally confirm BALKED onto cell 5 and assert cell 6 loses the L (build plan).
- setPlacementOrder / setTarget guards — derive word cards and L as `checkMove` does (`[...source, ...free, ...destination]` then `checkLetterCount`) (build plan).
