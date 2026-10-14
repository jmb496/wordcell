---
id: 12
type: story
title: "Tray growth wiring"
parent: epic-tray-and-place
covers: [CAP-9]
after: [11]
risk: high
---

# Tray growth wiring

## Description

Feeds `trayLayout(tileCount, w, innerWidth).rows` into layout.svelte.ts in place of `TRAY_ROWS = 1` (F10), so `bands(..., trayRows, ...)` takes it, after every completed edit, never during a drag (SPEC CAP-9). The tile count is S + F + D-block mirrors in Composing and the strip tiles in Place (SPEC Capabilities); a completed edit is any state change after a dispatch returns (drop, free-letter add, removal, k change, Undo, Redo, a commit) or a restore, New game or Replay (rows set in the state swap's update). `rows` is 0 for no tiles and 1 in card mode, and the band height uses `max(H, 92)` (`area`), so a 0-row Tray keeps its band. The Tray's tile mode and row count read the same value. A drop runs release → `gate.leave()` → dispatch, rows in the move's update; no interim render.

Per AD-11 (amended, F24) a move is every dispatch, no-ops and failed Validates included: `flip.capture()` first calls `gate.scrollReset()`, the band re-layout (w fixed) and its anchor `scrollTop` delta apply in the same update as the move, and `flip.play` measures after it. The gesture-ending paths guarantee no move with a gesture active (SPEC CAP-9); a move's re-layout that finds the gate busy throws (rule 6, AD-15). Restore and New game/Replay set rows from the tile count with no capture, FLIP or anchor scroll (build-notes CAP-8).

Growth to three compact rows is +48 px (A-D4). At 412 × 839 the leftover absorbs it and `scrollTop` is unchanged; at 412 × 780 the leftover is 42 px, so the document scrolls 6 px (`geometry.test.ts`). Shrink is the symmetric `anchorScroll` (`scrollTop` returns by the same delta, clamped at 0, WordCell row box unchanged). At 412 (`perRow` 7) 14 tiles are two compact rows and 15 are three. The band shift is no FLIP displacement because same-band cards invert from band-relative rects (SPEC CAP-8 coordinate frame).

Fixtures (none yet in fixtures/): `session-composing-long.json` (14 tray tiles with `canIncK`, one `+` gives 15) reused if entry 8 scripted it, else scripted under the epic 3 regeneration rule (SPEC Assumptions); and a Place Session whose strip spans three compact rows, `session-place-long.json` [ASSUMPTION name]. If `session-won`'s moves cannot yield a valid Session, hand-build it, validated by `parseSession` and replay. Both go in serialize.test.ts and the AD-17 valid-fixture list, asserting the properties above. Place fixture rows: Place = strip tiles (3), Confirm 3 → 0 (Idle, no tiles), Undo 0 → 3, Redo 3 → 0.

Interface: layout.svelte.ts takes `trayRows` from `trayLayout` (`TRAY_ROWS` removed); `flip.capture()` calls `gate.scrollReset()`; Tray.svelte reads the band's row count. Owns: the tray-row wiring, the F24 scroll-busy clear on every move and the two long-word fixtures. Consumers (plan's consumers section): the column and WordCell hit rects, the banner latch, the w-recompute predicate, pickTarget/insertionIndex rects, and the before-hide hook in main.ts calling `gate.scrollReset()`.

## Acceptance Criteria

Verify: npm run test:all and npm run test:screens are green (no new baselines expected, the existing ones stay green; no three-row baseline is added) with UI Vitest AD-11 cases:

- `trayLayout` returns rows 0, 1, 1, 2, 2 and 3 for tile counts 0, 1, `perRow`, `perRow` + 1, 14 and 15; bands() adds height only from three rows (+48 px; `trayGrowth` 0 for 0–2, `geometry.test.ts`); Tray tile mode and band rows share one value;
- rows do not change mid-drag; a call-order spy sees release → `gate.leave()` → dispatch, and no frame pairs the new tile count with old rows;
- each edit kind (drop, free-letter add, removal, k change, Undo, Redo, commit, restore) updates the rows, and restore and New game/Replay set them with no capture, FLIP or anchor scroll;
- a 14 → 15 `+` dispatched within 150 ms of a synthetic `scroll` event, with fake timers and rAF, is busy before `capture` and idle after, the 15th tile, band height and hit rects change in the move's update (w-recompute not firing) and the glide starts at once; the test fails without `scrollReset`;
- a no-op or failed-Validate dispatch within 150 ms of a scroll leaves the gate idle and the rows unchanged;
- a move's re-layout finding the gate busy (a forced gesture-busy gate; `scrollReset` clears only scroll-busy) throws to the AD-15 handler, with no catch in the code under test;
- after + 14 → 15 with the block on the left, no face gets an animation (pure band shift, SPEC CAP-8 frame).

Playwright on android at 412 × 839 and 412 × 780 shows the WordCell row's bounding box (viewport coordinates, `getBoundingClientRect`) unchanged after growth to three compact rows by + on the long Composing fixture and back by − (`scrollTop` unchanged at 839; 6 at 780, 0 after −), and on the three-row Place fixture Confirm, Undo and Redo each changing the rows with the move, the WordCell row unchanged and the flying cards visible, and after + 14 → 15 no column face animating.

## References

- parent — _bmad-output/initiative-wordcell-v1/epic-tray-and-place/epic-tray-and-place.md
- spec — _bmad-output/specs/spec-epic-5-tray/build-notes.md, CAP-9
- architecture — _bmad-output/planning-artifacts/architecture/architecture-wordcell-2026-09-27/ARCHITECTURE-SPINE.md, AD-11
- design — _bmad-output/planning-artifacts/ux-designs/ux-wordcell-2026-09-27/DESIGN.md, Layout & Spacing (Tray band, A-D4)

## Notes

- Open question: The anchor scrollTop write's effect on a running fling on Android is unverified and goes to the epic 7 device checks (recorded in SPEC CAP-9; the plan hands the item over); whether both long-word Sessions are scriptable from session-won's moves (SPEC Assumptions).
