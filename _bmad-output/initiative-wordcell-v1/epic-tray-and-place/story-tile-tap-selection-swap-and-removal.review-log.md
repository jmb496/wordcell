# Review log — story-tile-tap-selection-swap-and-removal.md (ticket 5.5)

State: pass 1: done

Mode: docs, thorough, max 7. Pass 0: HEAD 2778b08, .passes/pass0.md, 466 words (budget 2.5x ≈ 1165).
Intent extras (tickets.toml entry 5, not copied into the ticket; fixer adds them to Description in pass 1): interface, tests, owns, consumers, unknown, risk.

## Pass 1 — 2026-10-09
Reviewers: builder's reading, edge-case hunter, adversarial, ref alignment  |  Findings: major 13, minor 9, decision-needed 0  |  Dropped in triage: 1 (+ ~20 duplicates merged)
### Applied
- [instr] Description — add tickets.toml entry 5 interface, tests, owns, consumers, unknown, risk → fixer item 1
- [major] Description inert-target drag — "acts as that target's tap" read two ways; never dispatches (only applies the tap's keep/clear to the selection; the existing epic 4 destination-card drag-as-tap stays) → 2
- [major] Description — a tile press crossing 8 px before CAP-5 is itself a "target with no drag behaviour" → could select/swap/remove; state F18 (clear at threshold, no dispatch) → 3
- [major] Description — F1/AD-4 "ends on a changed DispatchResult and a phase change" missing, no mechanism → 4
- [major] Description — keep rules missing: long-press peek (F13) and its sticky continuation and consumed closing tap, hide/show and pointercancel press (F1); clearTile never in cancel() → 5
- [major] Notes — open question left for an unattended build → settle with build-notes default → 6
- [major] AC — keep/clear tap paths untested (R-32 (UI) block tap, used/empty cell, not-legal Place cell, current target, background/label/top bar/column card) → 7
- [major] AC — +, Validate, Undo cannot prove act()'s own clear; add failed Validate and menu open → 8
- [major] AC — R-33/Q-31 middle removal impossible on named fixture → session-place-compact + one Undo → 9
- [major] AC — R-73 reload passes trivially (swap already ended selection) → select before reload → 10
- [major] AC — S-column Vitest for AD-4/AD-12/AD-13 rows missing → 11
- [major] AC — R-35 "no ↩ on source/strip tile" unasserted → 12
- [major] AC — full-pitch hit rect (AD-12 S + P5) untested → 13
- [major] Description — `.tiles { overflow: hidden }` (TileRows.svelte:74) clips a first-row lifted face/outline → 14 (default applied)
- [minor] F2 carve-out for the non-pointer click path / tapAction never gets a tile hit → 15
- [minor] R-71 Composing assertion → 16
- [minor] no long-press on tiles → 17
- [minor] root tap list as examples, add gap above action bar → 18
- [minor] tileSelection type, hit payload, removeFreeLetter cell lookup → 19
- [minor] selected-tile visual distinct from column `lifted`; DOM signal for P5 → 20
- [minor] fixture-to-path mapping in AC → 21
- [minor] split the one-sentence Description → 22
- [minor] References: DESIGN.md Tile; consumers ref controller.ts:719-723 → 23
### Default applied (technical)
- open question → act() calls clearTile() unconditionally after cancel(); target-dependent keep/clear only in tileTap (total over Hit)
- lift clipping → lifted face and outline fully visible in every row; mechanism the plan's
- selection type → CardId | null; DOM class on the live tile asserted in P5
### Decision needed (functionality / UX / gameplay)
- none
Words (docs): 1058 (2.27 x pass 0)  |  Snapshot: .passes/pass1.md, fix diff .passes/pass1.fix.diff
Fixer: all 23 applied; no commands added; F25 click path cited as controller.ts:719-727; middle-removal uses card 35 (cell 4 free letter, first slot) tap-swapped into the middle.
### Dropped
- builder: "scrim/sheet tap closing a view clears the selection" — EXPERIENCE.md WordCell view says the closing tap "is consumed and does nothing else", so it keeps (folded into item 5 the other way)
