# Review log — story-place-target-order-and-confirm.md (ticket 5.9)

State: pass 2: done

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

## Pass 2 — 2026-10-09
Reviewers: fix diff, edge-case hunter, adversarial, ref alignment  |  Findings: major 4, minor 9, decision-needed 0  |  Dropped in triage: 0 (+ ~10 duplicates merged)
Words (docs): 1300 (3.55 x pass 0)  |  Snapshot: .passes/pass2.md, fix diff .passes/pass2.fix.diff
Fixer: all 13 applied; R-60/R-52 literals verified by a temporary engine run (cell 3 → [42, 0, 9, 32, 28], cursor {2, idle}, 2 moves), file deleted; storage spy exports `armStorageSpy`/`storageWrites`; no commands added.
### Applied
- [major] AC bullet 2 — session-won + one Undo steps chained: target state before each case unknown, "drag from cell 4" follows the tap that makes 4 the target, in-place long-press names no cell/result → fixer item 1
- [major] AC bullet 2 — "Redo disabled after the first retarget" cannot fail (the preceding tap-swap is already a Place edit, R-71) → 2
- [major] AC bullet 4 — columns and cells are not in a Session (rule 2; current() exposes no view); "one confirm dispatch" has no observable → 3
- [major] AC bullet 4 — R-52 on the redo-tail fixture: the strip's last card 28 is already cell 3's top (the free letter), so the top check cannot fail → 4
- [minor] Description — `FIXTURE_WORDS` is seed-1 only (serialize.test.ts:1632); place-compact route passes an inline list; JSON import missing → 5
- [minor] Description — CAP-4 drag clears only when ending in pointerup → 6
- [minor] AC bullet 1 — session-composing Validate has L = 3, "highest legal … others ringed" not testable there → 7
- [minor] Description/AC — PROPERTIES "≥ 2 legal cells" redundant; R-80 retarget case unnamed → 8
- [minor] AC — `displayScore` not exposed by the AD-17 hook; read the DOM (no shell change) → 9
- [minor] Description — Consumers line garbled → 10
- [minor] Description/AC — badge "after the free letter is added" reads as a test action → 11
- [minor] Description — cancelled long-press keeps a tile selection (F1) → 12
- [minor] AC bullet 4 — name the drop reaching the next Composing (FIXTURE_MAN `drop(2, 1, 6)`) → 13
### Default applied (technical)
- AC — dispatch proxy → one `wordcell:session` write (storage spy) and `cursor.index` + 1
- AC — R-80 cases → R-61 test Confirms into the stored target; R-41 test retargets to c then Confirms into c
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- none
