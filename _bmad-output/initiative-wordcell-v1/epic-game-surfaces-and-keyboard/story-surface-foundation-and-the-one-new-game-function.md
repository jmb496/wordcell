---
id: 1
type: story
title: "Surface foundation and the one New game function"
parent: epic-game-surfaces-and-keyboard
covers: [CAP-1]
risk: high
---

# Surface foundation and the one New game function

## Description

Tracer bullet through the overlays store, nav and the UI: adds the menu, statistics, preferences, howToPlay, newGameConfirm and replayConfirm entries to src/ui/overlays.svelte.ts (one history entry each, closed top-down, back closes the topmost; dismissing a confirm opened from the menu closes only the confirm and does not reopen the menu), the shared sheet, full-screen panel and confirm-dialog components (dialog focus on the dismissive button, scrim rules, safe-area padding, 1 × base open/close transition and the 120 ms reduced-motion fade, the WordCell view sheet and peek transition included); R4 already landed, so `newGame()` in src/ui/new-game.ts stays the one New game function and new entry points only add callers.

Build order: ids and AD-13 tests first, components second.

**Esc.** This ticket delivers only the close-topmost path (`overlays.close`, back) and the shared components' dismiss path. The Esc keydown wiring, its test and Esc with an empty stack are CAP-10's (entry 10); Dialog.svelte's "Esc arrives with epic 6's keyboard map" stays true.

**Guards (AD-13).** All six new ids join `MODAL_TOP` and none joins `OWN_OPERATION` (check against SPEC and the store; stop on a mismatch). Legal pairs per SPEC/EXPERIENCE: menu over endSheet; statistics, preferences, howToPlay, newGameConfirm and replayConfirm over an empty stack or endSheet (a menu item closes the sheet first); resetConfirm over statistics or endSheet; a confirm over a panel. Opening an id already open throws; `select`, `expandEndSheet` and `openView` throw with a new id on top (the last through `MODAL_TOP`). The ids are never persisted or restored on reload (boot pushes only historyNotice and endSheet). `onUnfinished`'s `close('endSheet')` stays valid because a new surface over the end sheet puts the Undo/Redo bars behind its scrim (DESIGN.md layer order), so no unfinished result arrives with it on top.

**Menu item order (CAP-1).** A menu item closes the sheet before acting: nav sees pop then push, final depth correct, menu not reopened. The ☰ focus return after a confirm dismissal and its P6 are CAP-3's (entry 3).

**Shared components.** Sheet and Panel (new) and Dialog (extended) apply build-notes § Per-surface behaviour (SPEC F5): Board inert, bars live, focus start and return per row. Their own close/dismiss buttons call `act()` internally (act.ts says Dialog passes handlers through unwrapped; AGENTS.md wraps every App-owned button); callers pass plain handlers. Dialog changes: dismissive-button initial focus kept; scrim tap dismisses a confirm (EXPERIENCE Confirm dialog) while the History notice's scrim does nothing and the end sheet's collapses (EXPERIENCE History notice, End sheet); the action button gets a style prop, the `danger` style not necessarily suiting the New game and Replay confirms (follow EXPERIENCE/DESIGN). Content scrolls inside the sheet's max height (DESIGN.md, 80 % of viewport) with the close/dismissive control always visible.

**Motion.** CSS transition on `--wc-base-ms` (AGENTS.md); under reduced motion the 120 ms opacity fade already in `motion.ts` (`duration('overlay')`), no new constant. WordCellView.svelte currently states "No transition" (epic 4 non-goal); this ticket changes that per CAP-1, updating that comment and any WordCellView/peek test (hover-peek.test.ts, e2e/wordcell-view.spec.ts) that assumes a settled sheet at once. The entry-less long-press and hover peek are not overlay entries and need no nav change; peek-to-sticky does not replay the transition; an interrupted open or close ends in the state of the latest stack; the exit is non-interactive.

**newGame single site.** The scan test (src/architecture-new-game.test.ts) fails if any file in `src/` outside new-game.ts, `*.test.ts` and `src/architecture-*` calls `game.newGame(`; Replay's `game.replay()` plus `resetForNewSession()` is the explicit allowance; a positive control plants a second call site and must fail. ActionBar and App still call `newGame()` (unit-level check).

**resetForNewSession.** From any stack of the new ids up to max depth it leaves depth 0 and nav receives exactly one pop per entry (the existing top-down `close` loop).

**Interface.** overlays.svelte.ts gains the six OverlayId values; new src/ui/Sheet.svelte, Panel.svelte; Dialog.svelte extended; new-game.ts unchanged (exports `newGame`).

**Owns.** The primitives, the overlay ids, the transition, the New game function (R4).

**Consumers.** overlays.svelte.ts is shared by HistoryNotice and its Reset confirm (resetConfirm), WordCellView, the tail selection, the hover peek and App; these stay green: overlays.svelte.test.ts, history-notice.svelte.test.ts, hover-peek.test.ts, act.test.ts, e2e/history-notice.spec.ts, e2e/history.spec.ts, e2e/wordcell-view.spec.ts.

**Tests.** AD-13 U cases for each new id at depth 0, 1 and max (open, stack, close, back, resetForNewSession, the throws and menu-item pop-then-push order); AD-12 U per component showing `controller.cancel()` runs before the handler; one component test at 360 px wide and about 320 px tall; newGame single-site scan; shared components proved by UI Vitest mounts (focus start, scrim, `act()`, safe-area, transition class) until entries with real openers exist, with no screenshot baselines for unmounted primitives.

## Acceptance Criteria

Verify: npm run test:all and npm run test:screens are green (screens specs the ticket adds listed per build-notes) with UI Vitest AD-13 cases for every new entry (open, stack, close, back, resetForNewSession), confirm dismissal closing the confirm without reopening the menu, AD-12 act() on the shared close buttons, and a UI Vitest/scan test that no site other than new-game.ts repeats the New game sequence; P6 opening a WordCell view in Idle that animates and ends in the shown state, and under reduced motion fades.

- Existing baselines are unchanged and test:screens is green.
- The only screens/P6 spec this ticket adds is `AD-14 WordCell view open/close transition` in e2e/wordcell-view.screens.spec.ts: an animation of `--wc-base-ms` length runs on open (getAnimations or computed style), the shown state is the end state, and under reduced motion a 120 ms opacity fade runs.

## References

- parent — _bmad-output/initiative-wordcell-v1/epic-game-surfaces-and-keyboard/epic-game-surfaces-and-keyboard.md
- spec — _bmad-output/specs/spec-epic-6-surfaces/SPEC.md, Capabilities (CAP-1), Decisions
- design — _bmad-output/planning-artifacts/ux-designs/ux-wordcell-2026-09-27/EXPERIENCE.md, Component Patterns, Keyboard, State Patterns
- design — _bmad-output/planning-artifacts/ux-designs/ux-wordcell-2026-09-27/DESIGN.md, Components
- spec — _bmad-output/specs/spec-epic-6-surfaces/build-notes.md, Per-surface behaviour (SPEC F5); SPEC.md F5, CAP-10

## Notes

- Resolved: the shared components are proved by UI Vitest mounts alone until entry 2 and later entries give them a real opener (see Tests). The AD-13 two-overlay reload case is entry 5's P6 (SPEC CAP-6); the ☰ focus return after a confirm dismissal is entry 3's P6 (SPEC CAP-3).
