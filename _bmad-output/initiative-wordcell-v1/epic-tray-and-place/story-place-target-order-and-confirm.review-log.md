# Review log — story-place-target-order-and-confirm.md (ticket 5.9)

State: pass 1: done

Mode: docs, thorough, max 7. Pass 0: HEAD 77336d8, .passes/pass0.md, 366 words (budget 2.5x ≈ 915).
Intent extras (tickets.toml entry 9, not copied into the ticket; fixer adds them to Description in pass 1): interface, tests, owns, consumers.

## Pass 1 — 2026-10-09
Reviewers: builder's reading, edge-case hunter, adversarial, ref alignment  |  Findings: major 11, minor 7, decision-needed 0  |  Dropped in triage: 1 (+ ~30 duplicates merged)
Words (docs): 1222 (3.34 x pass 0; over the 2.5x budget, mostly entry 9 intent lines and fixture mapping)  |  Snapshot: .passes/pass1.md, fix diff .passes/pass1.fix.diff
Fixer: all 18 applied; no runnable commands added; "twelve" → "thirteen" in serialize.test.ts:292 and the AD-17 test; no existing e2e for the Composing empty-cell long-press with a tile selected (P5 added).
### Applied
- [instr+major] Description — add tickets.toml entry 9 interface, tests, owns, consumers; interface corrected: ring/fade/target stay on `isLegalTarget` + `place.target` (WordCellRow.svelte:35,47), `canSetTarget` gates only the dispatch (view.ts:205); consumers: long-press-as-tap already exists (classify.ts:48) → fixer item 1
- [major] Description — fixture unnamed; wiring (ValidName/PROPERTIES/VALID/REBUILDS/FIXTURE_WORDS, AD-17 list and its "twelve" count) → 2
- [major] Notes — open question in an unattended build; replace with a construction default and a rule-7 stop (SPEC requires one shared fixture) → 3
- [major] AC — retargets/long-press/current-target tap assigned to fixtures where L = 3 (only cell 3 legal); map assertions to fixtures → 4
- [major] AC — every fixture's order is the default, so R-51 / R-60 bottom → top cannot tell order kept from reset; reorder first → 5
- [major] AC — missing R-80, R-60 (storage, cursor, redo tail dropped), R-73 per command, R-42 after Validate, R-52 tap-add next move → 6
- [major] Description/AC — not-legal tap keeps a tile selection, legal tap clears (F1), current-target clears (F13); WordCell drag from a legal non-current cell dispatches nothing; tests with a tile selected → 7
- [major] Description — existing tests flip (intent.test.ts:93 Place inert, controller.test.ts:3469 legal non-current no dispatch); controller.test.ts:3481 drag stays; tile.ts:11-12 "until ticket 9" note → 8
- [major] Description/AC — "badge 2 → 1" reads as a badge 1; no badge at 1 card (S15, WordCellRow count at ≥ 2) → 9
- [major] AC — reload "nothing selected" passes trivially; select a tile before reload (SPEC CAP-7); name the retarget cell → 10
- [major] Description/AC — "wherever released" dropped; moved long-press must release over another cell; peek on a non-empty legal non-current cell with a tile selected (no dispatch, tile kept) → 11
- [minor] AC — R-62 Game over observables → 12
- [minor] References — SPEC.md CAP-7, rule-coverage rows, epic 3 fixture regeneration → 13
- [minor] Description — scope: UI/fixture/test only (SPEC Constraints); Confirm wiring exists (ActionBar.svelte:32); keyboard target keys epic 6 → 14
- [minor] AC — Composing empty-cell long-press (no dispatch, tile kept): cite existing coverage or add P5 → 15
- [minor] Description — first-sentence punctuation → 16
- [minor] AC — retarget is a Place edit: Redo disabled, `reached` place (R-71) → 17
- [minor] Description — a cancelled long-press (pointercancel/lostpointercapture) dispatches nothing → 18
### Default applied (technical)
- Description — fixture name → `session-place-free-letter-two-cards.json`
- Notes — no single fixture reachable → stop and report under rule 7 (no split into two fixtures)
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- QU boundary of L on session-place-compact (stretch; engine-tested R-40, not in the ticket's tests field)
