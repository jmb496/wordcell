# Review log — story-tile-tap-selection-swap-and-removal.md (ticket 5.5)

State: done (converged)

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

## Pass 2 — 2026-10-09
Reviewers: fix diff, edge-case hunter, adversarial, ref alignment  |  Findings: major 9, minor 10, decision-needed 0  |  Dropped in triage: 0 (duplicates merged)
Words (docs): 1165 (2.50 x pass 0, at budget)  |  Snapshot: .passes/pass2.md, fix diff .passes/pass2.fix.diff
Fixer: all 16 applied; no commands; trimmed DESIGN.md Tile parenthetical (cites doc + `selected` class), "(keep or clear)" and "tile hits route to tileTap" to stay in budget.
### Applied
- [major] Press resolution/Drag — mirrors carry no `data-place` (Card.svelte:114), they resolve by `data-mirror-of` in the tray band (controller.ts:266-268); "a D-block mirror drag keeps" vs "a tray/strip tile press crossing 8 px clears" contradict → 1
- [major] AC — the F18 tile-threshold clear (pass 1 item 3) has no test → 2
- [major] Clear — `addFreeLetter`/`setTarget` have no UI dispatch yet (tickets 8, 9) → wire only swap, removeFreeLetter, tapDestinationCard; others clear via tileTap → 3
- [major] AC — "opening the menu" untestable: no menu until epic 6 (TopBar.svelte:27) → 4
- [major] Clear — a column-card tap clears whatever the dispatch result (EXPERIENCE.md Movable tile), not only when `changed` → 5
- [major] F2 carve-out — click() sends a tile hit to perform → tapAction, contradicting "tapAction never receives a tile hit" → default: click() maps a tile hit to outside before perform → 6
- [major] AC full pitch — gap ownership undefined (row gap has no element today); split gaps at the midline, 1 px tap points → 7
- [major] AC R-33/Q-31 — "the old one minus 35" ambiguous → literals → 8
- [major] AC R-71 — stored `reached` (composing at Composing, place at Place) and the cleared invalid line dropped (rule-coverage.md:64, SPEC CAP-4) → 9
- [minor] ticket ref CAP-5 is ticket 7 not 6 → 10
- [minor] fixtures for the strip free-letter no-↩ case, R-73, not-legal Place cell → 11
- [minor] R-73 lead-in: each edit's stored Session equals current().session before the next action → 12
- [minor] `selected` drives Card's existing `↩` returnSlot (Composing free letters) → 13
- [minor] back closing a sticky view keeps the selection → 14
- [minor] the six-way tileTap result replaces build-notes' `none` (close-out edit) → 15
- [minor] tileTap cases include scrim/sheet hits (keep); the inert-target drag case is a D-block mirror (R-32) → 16
### Default applied (technical)
- F2 carve-out → click() maps tile hits to outside before perform
- gap ownership → midline split (2 px each side, matching the face margin)
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- none

## Pass 3 — 2026-10-09
Reviewers: fix diff, edge-case hunter, adversarial, ref alignment  |  Findings: major 6, minor 12, decision-needed 0  |  Dropped in triage: 0 (duplicates merged)
Words (docs): 1194 (2.56 x pass 0, 29 over budget)  |  Snapshot: .passes/pass3.md, fix diff .passes/pass3.fix.diff
Fixer: all 12 applied; no commands; offsets: Interface/Owns shortened ("all of the above, incl. the clear rules"), R-39 drag-as-tap folded into Clear, Notes lines merged; item 11 not word-neutral.
### Applied
- [major] AC R-33/Q-31 — `↩` shown on the selected compact QU free letter is never asserted (SPEC CAP-4 P5 moved from CAP-1; ticket 2 deferred it here); the swap ends the selection, so select 35 again → 1
- [major] AC — no inert-target drag that clears: tray-background ≥ 8 px ended by pointerup clears, by pointercancel keeps → 2
- [major] Press resolution — a press on the selected tile's lifted face where it covers the row gap / a neighbour's half-gap is unspecified → default: any visible part of the selected face resolves to it → 3
- [major] AC — Look (lifted face and outline fully visible under `overflow: hidden`) untested → bounding-box check → 4
- [major] AC R-71 — invalid-line clear belongs to the identical-letter swap (SPEC CAP-4), pass 2 item 9 attached it to a generic swap → move it → 5
- [major] Keep vs Drag — "a press ended by pointercancel keeps" contradicts the F18 tile clear → "a non-tile press" → 6
- [minor] Clear — restore the changed-clear mechanism word-neutrally (controller clears after a changed swap/removeFreeLetter/tapDestinationCard) → 7
- [minor] F2 carve-out — tapAction's Hit has neither `tile` nor `block`; pointerup sends them to tileTap only → 8
- [minor] full pitch covers block-mirror slots and row-end half-gaps → 9
- [minor] Drag — "non-tile controller target" (an enabled button dragged off fires no click: kept, as epic 4) → 10
- [minor] AC — interim available-Composing-cell / legal non-current Place cell `clear` among the tileTap intent cases → 11
- [minor] Notes — close-out note also replaces build-notes' "one clear-rules function" line → 12
### Default applied (technical)
- lifted-face press → resolves to the selected tile
- stale tileSelection in tileTap → throws (rule 6), plan-level, no ticket words
- phase-change clear → no watcher; act() and changed-result clears cover it, plan-level
### Decision needed (functionality / UX / gameplay)
- none
### Dropped / left to the plan (over budget, fix would add words)
- F2 carve-out note on keyboard/AT tile activation (key-command epic's)
- the row-2 lifted strip vs the row-1 half-gap note (covered by item 3)

## Pass 4 — 2026-10-09
Reviewers: fix diff, edge-case hunter, adversarial, ref alignment (late-pass bar)  |  Findings: major 5, minor 13, decision-needed 0  |  Dropped in triage: 0 (duplicates merged)
Words (docs): 1193 (2.56 x pass 0)  |  Snapshot: .passes/pass4.md, fix diff .passes/pass4.fix.diff
Fixer: all applied, net −1 word; Owns shortened to "all of the above (F1, F13 clear rules)".
### Applied
- [major] Drag — pass 3 cut "Epic 4's destination-column drag-as-tap is unchanged", so "dispatching nothing" now reverses R-39 (controller.ts:679-683) → 1
- [major] AC R-71 Composing — the non-word swap before the 38/37 swap already drops the redo tail, so the Redo/no-tail checks prove nothing → 38/37 swap first on a fresh load (Redo enabled before, disabled after) → 2
- [major] AC — "Validate: … selection cleared" has no selection (the swap ended it): select a tile before the failed Validate → 3
- [major] Press resolution — pass 3's "any visible part of the selected face hits its tile" violates AD-12 / DESIGN.md Hit rects (slot pitch, `pointer-events: none` face) → delete; AC presses in the selected tile's own half-gap → 4
- [major] Look — "note regenerated screenshot baselines" lets an unattended build re-baseline a regression → existing baselines unchanged → 5
- [minor] Drag — "non-tile controller target" → "non-tile, non-button target" (word-neutral) → 1
- [minor] AC Full pitch — a CSS outline is outside boundingBox: "face box expanded by the 2 px outline" → 6
- [minor] AC Keep — "a used or empty" → "a used and an empty" WordCell → 7
### Default applied (technical)
- baselines → existing ones stay unchanged (none has a selected tile)
### Decision needed (functionality / UX / gameplay)
- none
### Left to the plan (over budget, fix would add words)
- epic 6 key commands (cancel(), not act()) must also clear the tile selection on a phase change
- a non-pointer click (detail 0) on an outside region leaves the tile selection alone (F2 path)
- tile lift uses the DESIGN.md Tile look only (outline + 4 px), no lifted-card shadow
- a long-press peek then ≥ 8 px move is a peek (keeps), not a drag-as-tap
- a tile press under 8 px ended by pointercancel keeps (F1)
- the build-notes CAP-4 close-out edit is part of this ticket's plan
- "the gap above the action bar" is EXPERIENCE.md Phase matrix's region; the plan names its element

## Pass 5 — 2026-10-09
Reviewers: fix diff, edge-case hunter, adversarial, ref alignment (late-pass bar)  |  Findings: major 1, minor 13, decision-needed 0  |  Dropped in triage: 0
Words (docs): 1191 (2.56 x pass 0)  |  Snapshot: .passes/pass5.md, fix diff .passes/pass5.fix.diff
Fixer: all 7 applied, net −2 words; cuts: "(rule 2)", ", ending the selection" (Clear covers it).
### Applied
- [major] Look vs AC Full pitch — a row-1 face rests flush with the top of `.tiles` (top-aligned, compact area exactly H+4+H), so "face box inside the tile area's rect" needs rows moved, which breaks "existing baselines unchanged" → AC: not clipped, inside the tray band's rect; Look: resting tile positions unchanged → 1
- [minor] Drag — "non-tile, non-button" leaves a disabled-control drag undefined → "non-tile, non-enabled-button" → 2
- [minor] UI Vitest "(R-32)" tag breaks the AD-n naming rule for UI Vitest (AGENTS.md) → cut → 3
- [minor] R-71 "Then at Composing" → reorder after the Composing case → 4
- [minor] "(remove only there)" vs the R-33/Q-31 removal on session-place-compact → word-neutral reword → 5
- [minor] F18 Vitest "on another tile" → "on any tile" → 6
- [minor] Drag "only R-39's … dispatches" → "R-39's … also dispatches" → 7
### Decision needed (functionality / UX / gameplay)
- none
### Left to the plan (over budget, fix would add words)
- R-35 second tap: stored Session byte-identical
- R-33/Q-31: wordcell-4 shows card 35 live again (no used mirror); the tray leaves compact mode at 7 tiles
- disabled − press by coordinate tap or click({ force: true }) (SPEC CAP-4, CAP-2 helper)
- Interface omits Card.svelte (`selected`) and TileRows.svelte (clip mechanism): plan file list
- Consumers list lives in the plan's impact section

## Pass 6 — 2026-10-09
Reviewers: fix diff, edge-case hunter, adversarial, ref alignment (late-pass bar)  |  Findings: major 1, minor 15, decision-needed 0  |  Dropped in triage: 0 (1 major reclassed minor)
Words (docs): 1191 (2.56 x pass 0)  |  Snapshot: .passes/pass5.md (no fix pass)
### Open (not fixed: stopping rule, second consecutive pass with at most one major)
- [major] Look — "lift the clip, not the rows" reads as removing `.tiles { overflow: hidden }` (TileRows.svelte:74), but that clip also hides compact rows past the second until CAP-9 grows the tray (their wrappers would catch −/+/Validate presses), and the gating e2e/board-phases.spec.ts:464-476 `AD-11 (F2) … clipped tile area` asserts `overflow: hidden` → proposed fix: "raise only the clip's top edge by the lift + outline (e.g. a clip-path/inset or padding-compensated clip); overflow rows stay clipped, rows unmoved; the AD-11 (F2) clip assertion stays green or is updated in step"
### Reclassed
- edge-case: long-press peek keep has no P5 → minor: SPEC/rule-coverage R-65 (UI) assign "a long-press peek with a tile selected" to CAP-6 P5 (ticket 8); a UI Vitest case is the plan's option
### Decision needed (functionality / UX / gameplay)
- none

## Result — converged after 6 passes
open major: Look — "lift the clip, not the rows" is ambiguous; removing `.tiles` overflow: hidden would unclip compact overflow rows (pre-CAP-9) and break the AD-11 (F2) clip assertion in e2e/board-phases.spec.ts:464-476; the plan must raise only the clip's top edge, keep overflow rows clipped and rows unmoved.
Majors per pass: 13, 9, 6, 5, 1, 1. Words 466 → 1191 (budget ~1165). Technical defaults applied: about 15 (see each pass). Decision-needed: none.

### Unapplied minors (for the build plan)
- pass 6: "(remove there too)" → "(and remove)"; F18 Vitest "any tile" → "any live tile"; drop "or `tapDestinationCard`" from the changed-clear clause (column taps clear whatever the result); Press resolution: horizontal half-gaps are already inside each slot wrapper, only the compact row gap needs an owner; pitch/half-gap hits are geometry — UI Vitest stubs elementFromPoint, so P5 Full pitch is the evidence; Undo-with-selection case needs a fixture where tiles survive (e.g. session-place-free-letter-redo-tail at load, Place → Composing) or rely on the Vitest act() case; lostpointercapture keep case beside pointercancel; every non-pointerup end of a non-tile press (sameId, back cancel) keeps; hover over tile/block hits stays null (hoverAction); hide/show P5 keep step optional (hidePage helper); R-71 non-word swap uses cards other than 38/37 (e.g. 41 and 46); empty-cell long-press is a tap for tileTap (classify.ts); a check that the selected face is 4 px up with a 2 px teal outline; `↩` placement on a card-mode free letter (card 28, bottom band right); long-press peek keep (CAP-6 P5, optional UI Vitest)
- pass 5: R-35 second tap leaves the stored Session byte-identical; after the R-33/Q-31 removal wordcell-4 shows card 35 live again and the tray leaves compact mode; disabled − pressed by coordinate tap or click({ force: true }); Interface omits Card.svelte and TileRows.svelte (plan file list); Consumers list in the plan's impact section
- pass 4: epic 6 key commands must also clear on a phase change; non-pointer click on outside leaves the tile selection alone; no lifted-card shadow on tiles; a long-press peek then ≥ 8 px move stays a peek; a tile press under 8 px ended by pointercancel keeps; build-notes CAP-4 close-out edit in this ticket's plan; name the "gap above the action bar" element
- pass 3: stale tileSelection → tileTap throws (rule 6); no phase-change watcher; keyboard/AT tile activation is the key-command epic's
