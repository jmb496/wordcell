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

**Guards (AD-13).** All six new ids join `MODAL_TOP` and none joins `OWN_OPERATION` (check against SPEC and the store; stop on a mismatch). `open(id)` gets a table-driven pair guard: it throws `AD-13 open(<id>) while <top> is the top entry` (or `… on an empty stack`) for any top outside the legal list, besides the existing own-operation and already-open throws. Legal tops per id (SPEC CAP-1/CAP-4/CAP-6, EXPERIENCE): menu, statistics, preferences, howToPlay: empty or endSheet; newGameConfirm, replayConfirm: empty, endSheet or a panel (statistics, preferences, howToPlay); resetConfirm: historyNotice, statistics or endSheet; historyNotice keeps today's rule (boot, over endSheet). tailSelection and wordcellView are illegal tops for every new id. Max depth is the longest legal chain, 3 (endSheet, statistics, a confirm; or endSheet, historyNotice, resetConfirm). `select`, `expandEndSheet` and `openView` throw with a new id on top (the last through `MODAL_TOP`). The ids are never persisted or restored on reload (boot pushes only historyNotice and endSheet).

**Undo over a surface.** F5 keeps the Undo/Redo bars live, so Undo can reach `onUnfinished` with a new surface over the expanded endSheet ("Undo closes the sheet and resumes play", SPEC CAP-4). `onUnfinished` closes the entries above endSheet top-down, then endSheet (one nav pop each); no throw.

**Deferred open.** build-notes § Winning-guard input outcomes (SPEC CAP-5) consumes the menu button and every other input in the guard window, so no new surface is on top when the deferred open fires; `openDeferred` is unchanged.

**Menu item order (CAP-1).** A menu item closes the menu (not the end sheet) before acting: [endSheet, menu] -> close(menu) -> [endSheet] -> open(X) -> [endSheet, X], and from [menu] -> [] -> [X]; nav sees pop then push, menu not reopened. The ☰ focus return after a confirm dismissal and its P6 are CAP-3's (entry 3).

**Shared components.** Sheet and Panel (new) and Dialog (extended) apply build-notes § Per-surface behaviour (SPEC F5): Board inert, bars live, focus start and return per row. Their own close/dismiss buttons call `act()` internally (act.ts says Dialog passes handlers through unwrapped; AGENTS.md wraps every App-owned button); callers pass plain handlers. Dialog changes: dismissive-button initial focus kept; Dialog callers pass `onscrim` only for confirms (EXPERIENCE Confirm dialog); the History notice's scrim does nothing; the end sheet's collapse belongs to Sheet and its own entry, not Dialog; the action button gets a style prop, the `danger` style not necessarily suiting the New game and Replay confirms (follow EXPERIENCE/DESIGN). Content scrolls inside the sheet's max height (DESIGN.md, 80 % of viewport) with the close/dismissive control always visible.

**Motion.** CSS transition on `--wc-base-ms` (AGENTS.md); under reduced motion the 120 ms opacity fade already in `motion.ts` (`duration('overlay')`), no new constant. WordCellView.svelte currently states "No transition" (epic 4 non-goal); this ticket changes that per CAP-1, updating that comment and any WordCellView/peek test (hover-peek.test.ts, e2e/wordcell-view.spec.ts) that assumes a settled sheet at once. The entry-less long-press and hover peek are not overlay entries and need no nav change; peek-to-sticky does not replay the transition; an interrupted open or close ends in the state of the latest stack; the exit is non-interactive. Focus returns at close (stack removal), not at exit-transition end; the Board's inert follows the stack, not the exit.

**newGame single site.** This ticket creates the scan test (src/architecture-new-game.test.ts, new; written via architecture-scan.ts). It fails if any file in `src/` outside new-game.ts, `*.test.ts` and `src/architecture-*` calls `game.newGame(`; Replay's `game.replay()` plus `resetForNewSession()` is pre-declared for the Replay entry (entry 3; no caller exists yet); a positive control plants a second call site and must fail. ActionBar and App still call `newGame()` (unit-level check).

**resetForNewSession.** From any stack of the new ids up to max depth it leaves depth 0 and nav receives exactly one pop per entry (the existing top-down `close` loop).

**Interface.** overlays.svelte.ts gains the six OverlayId values; new src/ui/Sheet.svelte, Panel.svelte; Dialog.svelte extended; new-game.ts unchanged (exports `newGame`).

**Owns.** The primitives, the overlay ids, the transition, the New game function (R4).

**Consumers.** overlays.svelte.ts is shared by HistoryNotice and its Reset confirm (resetConfirm), WordCellView, the tail selection, the hover peek and App; these stay green: overlays.svelte.test.ts, history-notice.svelte.test.ts, hover-peek.test.ts, act.test.ts, e2e/history-notice.spec.ts, e2e/history.spec.ts, e2e/wordcell-view.spec.ts.

**Tests.** AD-13 U cases for each new id at depth 0, 1 and max (3) (open, stack, close, back, resetForNewSession, one illegal pair per new id, both menu-item sequences, Undo with the menu over endSheet); AD-12 U per component showing `controller.cancel()` runs before the handler; one component test at 360 px wide and about 320 px tall; newGame single-site scan; shared components proved by UI Vitest mounts (focus start, scrim, `act()`, safe-area, transition class) until entries with real openers exist, with no screenshot baselines for unmounted primitives.

## Acceptance Criteria

Verify: npm run test:all and npm run test:screens are green with UI Vitest AD-13 cases for every new entry (open, stack, close, back, resetForNewSession), confirm dismissal closing the confirm without reopening the menu, AD-12 act() on the shared close buttons, and a UI Vitest/scan test that no site other than new-game.ts repeats the New game sequence; P6 opening a WordCell view in Idle that animates and ends in the shown state, and under reduced motion fades.

- Existing baselines are unchanged and test:screens is green.
- This ticket adds no screenshot baseline; its only new P6 spec (dev-server suite, no `toHaveScreenshot`) is `AD-14 WordCell view open/close transition` in e2e/wordcell-view.spec.ts: an animation of `--wc-base-ms` length runs on open (getAnimations or computed style), the shown state is the end state, and under reduced motion a 120 ms opacity fade runs.

## References

- parent — _bmad-output/initiative-wordcell-v1/epic-game-surfaces-and-keyboard/epic-game-surfaces-and-keyboard.md
- spec — _bmad-output/specs/spec-epic-6-surfaces/SPEC.md, Capabilities (CAP-1), Decisions
- design — _bmad-output/planning-artifacts/ux-designs/ux-wordcell-2026-09-27/EXPERIENCE.md, Component Patterns, Keyboard, State Patterns
- design — _bmad-output/planning-artifacts/ux-designs/ux-wordcell-2026-09-27/DESIGN.md, Components
- spec — _bmad-output/specs/spec-epic-6-surfaces/build-notes.md, Per-surface behaviour (SPEC F5); SPEC.md F5, CAP-10

## Notes

- R-74 P6 supplement: tickets.toml entry 1's `tests` row 'R-74 (UI) New game sequence unchanged ... (P6 supp.)' moves to entry 3 (owner of R-74 UI); tickets.toml is not edited here.
- Resolved: the shared components are proved by UI Vitest mounts alone until entry 2 and later entries give them a real opener (see Tests). The AD-13 two-overlay reload case is entry 5's P6 (SPEC CAP-6); the ☰ focus return after a confirm dismissal is entry 3's P6 (SPEC CAP-3).
