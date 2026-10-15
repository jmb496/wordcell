---
title: 'Keyboard: board keys, focus moves and tooltips'
type: 'feature'
ticket: '11'
created: '2026-10-15'
status: 'built'
route: 'full'
route_source: 'auto'
review: 'thorough'
review_source: 'auto'
lenses_ran: [blind-hunter, edge-case-hunter, verification-gap, intent-alignment]
review_loop_iteration: 0
followup_review_recommended: false
context:
  - '/mnt/d/CodeProjects/wordcell/_bmad-output/planning-artifacts/ux-designs/ux-wordcell-2026-09-27/EXPERIENCE.md'
  - '/mnt/d/CodeProjects/wordcell/_bmad-output/planning-artifacts/ux-designs/ux-wordcell-2026-09-27/DESIGN.md'
  - '/mnt/d/CodeProjects/wordcell/_bmad-output/specs/spec-epic-6-surfaces/SPEC.md'
  - '/mnt/d/CodeProjects/wordcell/_bmad-output/initiative-wordcell-v1/epic-game-surfaces-and-keyboard/story-keyboard-overlay-keys-f39-and-stale-tile-selection-plan.md'
warnings: ['oversized']
deferred:
  - summary: >-
      A mouse or touch press on a card natively focuses it and moves its column's roving Tab stop.
    evidence: |-
      The ticket says a drag start steals no focus; the build reads that as no programmatic focus. Settle with an owner read of the intended behaviour.
    location: >-
      src/ui/Card.svelte
    severity: medium (unverified)
baseline_revision: 'dd013d3aceeb01831978678a49513582dc0ad070'
---

<intent-contract>

## Intent

**Problem:** Desktop players cannot play by keyboard: no board keys (`1`–`8`, `↑`/`↓`, `3`–`9`/`0`, arrows, `Space`, `Enter`, `+`/`-`, `F`), no roving focus order, no focus-follows-phase, and no key in the desktop tooltips.

**Approach:** The ticket file (`story-keyboard-board-keys-focus-moves-and-tooltips.md`: Description, Acceptance Criteria, Notes) is the contract; EXPERIENCE.md Keyboard is the per-phase authority. Extend `keys.ts` (6.10) with board rows and a key context, add a controller key-activation entry, roving tabindex in Board/Column/Tray/WordCellRow/Card, one phase-focus effect, and `text.ts` tooltip builders.

## Boundaries & Constraints

**Always:** Owner decision (Notes, 2026-10-15): one Tab stop per non-empty column (last-focused card, else bottom; the tail's top card after a key selection), never every card of a fanned column. Board container is `main`. Rules 1–7 of AGENTS.md; AD-3 (flags from `GameView`), AD-12 (`act()` / controller), AD-14 (live element only focusable, mirrors never). A key that does not act dispatches nothing, no `preventDefault`, no `act()`. Every board row is `single`.

**Never:** Engine or Session changes; renaming 6.10 commands; new `data-testid`; changing existing screenshot baselines; focus stolen on drag start; `clearTile()` on tile/strip/column-card activation, `1`–`8`, `↑`/`↓`.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Flow 6 | seeded Flow 1 position, desktop | `1`,`↑`×3,`3`,`6`,Shift+`←`/`→`,`Enter`,`6`,`Enter` plays a full move by keys only | No error |
| No-op keys | any ticket-listed no-op | nothing dispatched, no `preventDefault` | No error |
| All columns empty | `session-won`, sheet collapsed with `Esc` | focus lands on `main` | No error |
| Pending pop | `1`–`8`, `↑`/`↓`, Idle `Space`/`Enter`, WordCell view-opening keys | wait via `WAITS`; other board keys dropped | No error |
| Focus loss | Undo/Redo, `+`/`-`, Flip, pointer edit removes focused element | next sibling, else region first, else board | No error |

</intent-contract>

## Code Map

- `src/ui/keys.ts` (+`keys.test.ts`) -- `ROWS`, `WAITS`, `match`, `attempt`, `onKeyDown`; add board rows, `Row.label`, `Row.changesPhase`, key context, `CommandId` k+/k-.
- `src/ui/commands.ts` -- `closeTransient`, dispatching commands; reuse; add k+/k- (`incK`/`decK`) via same capture/play pattern.
- `src/ui/act.ts` -- `act()` clears the tile selection; do not change.
- `src/ui/gestures/controller.ts` (+`controller.test.ts`, one file) -- add key-activation entry on `Controller`: `cancel()`, never `clearTile()`, then `tileTap`/`tapAction` as a released tap; closes the sticky view first; peeks only on phase/word-data change. Reuse `tile.ts` `tileTap`, `intent.ts` `tapAction`, `lookup.ts`.
- `src/ui/focus-board.ts` (+test) -- `focusBoard` single resolver; update to roving model and `main` fallback.
- `src/ui/{Board,Column,Card,Tray,WordCellRow,App}.svelte`, `src/ui/tray/*` -- roving `tabindex`, `:focus-visible` ring (DESIGN.md Focus ring), phase-focus effect on `GameView.phase`; `App.svelte` `main` `tabindex=-1`.
- `src/ui/{TopBar,ActionBar,Menu}.svelte`, `src/ui/tray/ControlRow.svelte`, `src/ui/text.ts` (+`text.test.ts`) -- tooltip builder reading key labels from `keys.ts`; `title` from `layout.hoverFine`.
- `src/ui/overlays.svelte.ts` -- selection/tileSelection/deselect/`SUSPENDING`; `focusBoard` yields to the 6.10 overlay focus return.
- `e2e/` -- new desktop spec(s) (names start with ids); update `e2e/helpers/{board,gestures,restore}.ts` and any spec using `card-`/`data-card-id` if roving `tabindex` breaks locators; screens: focused, focused + selected (Docker, `npm run test:screens`).
- Do not change: `src/engine/**`, `src/shell/**` (except none), existing screenshot baselines.

## Tasks & Acceptance

**Execution:**
- [ ] `src/ui/text.ts`, `src/ui/text.test.ts` -- tooltip builder `Label (Key)` per command; Give up none -- unit per command
- [ ] `src/ui/gestures/controller.ts`, `controller.test.ts` -- key-activation entry -- tap path without `clearTile`
- [ ] `src/ui/commands.ts`, `src/ui/keys.ts`, `src/ui/keys.test.ts` -- board rows, key context, `WAITS`, `changesPhase`, no-ops -- one test per row per phase, both keys
- [ ] `src/ui/{Board,Column,Card,Tray,WordCellRow}.svelte`, `src/ui/tray/*`, `src/ui/focus-board.ts`(+test) -- roving tabindex, ring, phase/key-edit/focus-loss focus -- ticket Focus section
- [ ] `src/ui/{TopBar,ActionBar,Menu}.svelte`, `src/ui/tray/ControlRow.svelte` -- tooltips via `hoverFine`
- [ ] `e2e/*.spec.ts` (desktop) -- Flow 6 keyboard-only, per-row per-phase, Tab-order, focus after phase change/key edit, all-empty `main`, tooltips (`android` absent / `desktop` present); `e2e/*.screens.spec.ts` focused states
- [ ] Update affected helpers/locators from roving tabindex

**Acceptance Criteria:**
- Given desktop at the Flow 1 position, when only `keyboard.press` is used (Flow 6), then the move is placed and confirmed.
- Given any table row in any phase, when its key is pressed, then it acts per EXPERIENCE.md or, for listed no-ops, dispatches nothing.
- Given a phase change or key edit, when it completes, then focus is on the ticket-specified target; Tab visits one stop per non-empty column, tray, strip, WordCells 3–10 and reaches cell 10.
- Given desktop, when a button renders, then `title` is `Label (Key)`; on `android` `title` is absent.
- Given `npm run test:all`, then green; `npm run test:screens` green with only new baselines.

## Implementation Notes

- Keys: `src/ui/keys.ts` gains a `KeyContext` (digit, direction, `readFocus()` from the new `src/ui/focus-target.ts`) and the rows `column` (`1`-`8`, Idle), `tailUp`/`tailDown`, `cell` (`3`-`9`/`0`, Composing and Place), `focusMove`, `tileMove`, `tap` (Space/Enter on a column card, Space on a tile or strip card, Enter on a WordCell), `view` (Space on a WordCell), `k+`/`k-`; `Enter` elsewhere resolves to the 6.10 `validate`/`confirm` rows and `F` to `flip`. Digits resolve by phase (Idle: column, Composing/Place: cell). `Row.changesPhase` false rows (`column`, `tailUp`, `tailDown`, `tap`, `focusMove`) run without `act()`; `WAITS` holds the history-touching ids and `Row.touchesHistory` narrows `tap` (Idle/Game over column card and WordCell only). `Enter`/`Space` with a native control focused is left to it. A waiting key is re-resolved at settle.
- Controller: `Controller.activate(hit)` (cancel, close the sticky view, `tileTap`, `tapAction`, peeks closed only for swap/remove/drop/k/free letter/target/view); reached from keys through `act.ts` `activateHit`, with `cancelGesture` for the focus moves (act.ts's `act()` is unchanged).
- `commands.ts`: `edit(command)` (closeTransient, capture, dispatch, play) and `setK`; `ControlRow` uses `setK`.
- Focus: roving `tabindex` in `Card` (`stop`/`onfocus` props from `Column` and `TileRows`, `roving.svelte.ts`), `WordCellRow` cells `tabindex` 0, `focus-board.ts` resolver helpers, `focus-follow.ts` (phase effect plus focus-loss recovery) mounted from `Board.svelte`. Programmatic focus uses `preventScroll`. The Menu/Confirm returns to `main` stay (the 6.10 overlay return); the phase effect yields while a surface owns focus.
- Tooltips: `src/ui/key-labels.ts` holds the key labels (pure, so `text.ts`, which e2e imports, can read them; `Row.label` reads the same literals); `text.tooltip(command)`; `title` from `layout.hoverFine` passed as a `hoverFine` prop to TopBar, ActionBar, Tray/ControlRow and Menu. `−` and `+` use their glyph as the label (`− (-)`, `+ (+)`); the owner reads this text.
- Sessions: `SESSIONS.flow6` (a Flow 1 stand-in; the rulebook position is not a dealable one) and `SESSIONS.cell10` (a 10-letter word on cell 10, for the Tab-order test) in `e2e/helpers/sessions.ts`, seeded with `openFixture(page, { literal })`, not as `fixtures/` files (AD-17 pins the valid fixture set to the engine rebuilds).
- Specs: `e2e/board-keys.spec.ts`, `e2e/tooltips.spec.ts`, `e2e/keyboard.screens.spec.ts`; `e2e/board.spec.ts` asserts the new Undo/Redo titles.

## Plan Change Log

## Review Triage Log

### 2026-10-15 — Review pass
- verdicts: 22 findings (blind 11, edge 7, gap 4; intent-alignment descriptive, none) — high 0, medium 4, low 7, false 5, maybe-false 1 plus duplicates grouped by root cause
- findings:
  - `[medium]` `patch` roving.reset() never called (blind, edge, gap) — called from newGame/replayDeal in new-game.ts, test added
  - `[low]` `patch` afterRemoval Math.max hides a missing card (blind) — now throws; keys.test onTile seeds the tile list
  - `[medium]` `patch` focus-loss next-sibling branch untested (gap) — e2e added for a non-last free letter
  - `[medium]` `patch` edit/setK closeTransient + capture/play unpinned (gap, blind) — commands.test added
  - `[low]` `patch` Tab-order test title overclaims (blind) — title narrowed
  - `[false]` `reject` activate() clears tile selection on column-card tap (edge) — the tap path (tileTap CLEAR) clears exactly as a pointer tap does; ticket forbids act()'s clearTile only
  - `[false]` `reject` Enter on non-destination column card in Composing does not validate (blind) — ticket: Enter on a column card is the tap in every phase
  - `[false]` `reject` ghost card focusable (edge) — ghosts have mirror='ghost', not focusable
  - `[false]` `reject` empty WordCells are Tab stops (blind) — ticket: each WordCell 3-10 is a Tab stop
  - `[false]` `reject` new setK closes view/peeks for buttons (blind, edge) — word-data change closes peeks per ticket; consistent
  - `[maybe-false]` `defer` pointer press natively focuses a card (blind) — "drag start steals no focus" read as no programmatic focus; ring is :focus-visible only
  - `[low]` `reject` focusCard false leaves focus on body, stale tracked element, a11y roles, Row.label unused, giveUp text test trivial, flow6 literal unverified, focus-follow new-deal focus, plan-file inconsistencies, intent-audit notes — unlikely in use or fix adds complexity / edits the plan; no end-user harm shown

## Design Notes

The ticket text is long and precise; the implementer reads it in full and treats it as authoritative where this plan is terse. Split work in order: text/tooltips → controller entry → keys → focus → e2e/screens.

## Verification

**Commands:**
- `npm run lint && npm run check && npm test` -- expected: green, unit suite under budget
- `npm run test:all` -- expected: green
- `npm run test:screens` -- expected: green (Docker; new baselines only)

## Auto Run Result

- Summary: board keys, key context and activation entry, roving focus, focus-follows-phase, focus-loss recovery, desktop tooltips with keys.
- Files: see Implementation Notes (keys.ts, controller.ts, commands.ts, focus-*.ts, roving.svelte.ts, key-labels.ts, components, e2e specs and 5 new screen baselines).
- Review: 5 patches applied, 1 deferred, rest rejected with reasons in the Review Triage Log.
- Follow-up review recommended: false (no high patched; 3 mediums patched, all test/cleanup).
- Verification: lint, check, unit (2642) green; test:all green (exit 0, only the known menu.spec flake risk); screens green in Docker with only new baselines.
- Residual risks / owner review: tooltip wording for the − and + buttons (`− (-)`, `+ (+)`); focus ring look vs DESIGN.md in new baselines; `flow6` stand-in session for the Flow 1 position.
