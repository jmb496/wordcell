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

**Esc.** This ticket delivers only the close-topmost path (`overlays.close`, back) and the shared components' dismiss path. CAP-1's Esc clause is delivered by entry 10 (rule-coverage). The Esc keydown wiring and its tests are CAP-10's (entry 10); no entry before it proves Esc.

**Guards (AD-13).** All six new ids join `MODAL_TOP` and none joins `OWN_OPERATION`. New rules apply to the six new ids and resetConfirm's tops only; historyNotice keeps today's rules (no pair guard, opens over a peek or sticky view at boot, hoverPeek kept) so overlays.svelte.test.ts stays green unedited. `open(id)` for a new id gets a table-driven pair guard: it throws `AD-13 open(<id>) while <top> is the top entry` (or `… on an empty stack`) for any top outside the legal list, besides the existing own-operation and already-open throws; it also throws on a peek and clears hoverPeek. Legal tops: menu, statistics, preferences, howToPlay: empty or endSheet; newGameConfirm, replayConfirm: empty, endSheet or a panel (statistics, preferences, howToPlay), reached only after the menu closed, never over it; resetConfirm (existing id): historyNotice, statistics or endSheet. Per SPEC F8 only resetConfirm stacks on historyNotice; any other open while a modal notice is the top entry throws `AD-13 open(...)`. tailSelection, wordcellView and a peek are illegal tops for every new id. Stack length after open, per id (the U depth matrix): menu, statistics, preferences, howToPlay 1 or 2; newGameConfirm, replayConfirm 1, 2 or 3 (endSheet, panel, confirm); resetConfirm 2 or 3 (endSheet, statistics, resetConfirm and endSheet, historyNotice, resetConfirm are the max-3 chains with it). `select`, `expandEndSheet` and `openView` throw with a new id on top (the last through `MODAL_TOP`).

**Undo.** Only the expanded end sheet and the WordCell view leave the top bar live (SPEC F6); under the menu, a panel, a dialog or the History notice the top bar is `inert` (no scrim-only cover: Tab and Enter must not reach Undo), so no Undo/Redo path reaches `onUnfinished` under them by construction and it is unchanged (U pins it); build-notes.md's per-surface table says so.

**openSurface(id) (SPEC F8).** This ticket owns the UI helper `openSurface(id)` in src/ui/: it clears a tail or tile selection and pops its entry, closes a sticky view and any peek or hover peek, waits for the pop to complete, then pushes. Every opener (menu item, button, key, entry 10 included) goes through it; it opens nothing over a modal notice except resetConfirm (the store throws). U per case: tail selection -> nav pop then push, selection null; tile selection cleared; sticky view -> closed then push; peek and hover peek cleared, no throw; modal notice on top -> throws `AD-13 open(...)`, nothing cleared.

**Menu item order (CAP-1).** A menu item closes the menu (not the end sheet) before acting through `openSurface`: [endSheet, menu] -> close(menu) -> [endSheet] -> open(X) -> [endSheet, X], and from [menu] -> [] -> [X]; nav sees pop then push, menu not reopened. The ☰ focus return after a confirm dismissal and its P6 are CAP-3's (entry 3).

**Shared components.** Sheet and Panel (new) and Dialog (extended) apply build-notes § Per-surface behaviour (SPEC F5, F6): Board inert, focus start and return per row. Sheet and Panel wrap their own close buttons and `onscrim` in `act()` (AD-12); Dialog stays pass-through (act.ts, ACT_EXEMPT_FILES) and its callers wrap `ondismiss`, `onaction` and `onscrim` as HistoryNotice does. The AD-12 act scan's HANDLER_ATTRIBUTE gains `close` for Sheet and Panel's `onclose`. Dialog changes: dismissive-button initial focus kept; Dialog callers pass `onscrim` only for confirms (EXPERIENCE Confirm dialog); the History notice's scrim does nothing; the end sheet's collapse belongs to Sheet and its own entry, not Dialog; the action button gets a style prop, `primary` for the New game and Replay confirms (DESIGN Buttons), `danger` where a caller asks. Content scrolls inside the sheet's max height (DESIGN.md, 80 % of viewport) with the close/dismissive control always visible.

**Motion.** CSS transition on `--wc-base-ms` (AGENTS.md); under reduced motion (`--wc-reduced` is a 0/1 flag written by shell prefs) an opacity-only transition of 120 ms (SPEC F7): `motion.ts` exports its 120 ms constant (today the unexported `REDUCED_FADE_MS`) and sets `--wc-fade-ms` from it, surface CSS uses it when `--wc-reduced` is on; a U test pins the CSS value to the constant. No WAAPI, no `duration('overlay')`. WordCellView.svelte currently states "No transition" (epic 4 non-goal); this ticket changes that per CAP-1, updating that comment and any WordCellView/peek test (hover-peek.test.ts, e2e/wordcell-view.spec.ts) that assumes a settled sheet at once. The entry-less long-press and hover peek are not overlay entries and need no nav change; peek-to-sticky does not replay the transition; an interrupted open or close ends in the state of the latest stack, including close then reopen of the same id during the exit; the exit is a class plus `transitionend` (jsdom fires none, so tests dispatch it explicitly) and is non-interactive; U covers each of these. Focus returns at close (stack removal), not at exit-transition end.

**newGame single site.** This ticket creates the scan test (src/architecture-new-game.test.ts, new; written via architecture-scan.ts). It fails if any file in `src/` outside new-game.ts, `*.test.ts` and `src/architecture-*` contains the text `game.newGame(` (aliasing is not detected); Replay's `game.replay()` plus `resetForNewSession()` is pre-declared for the Replay entry (entry 3; no caller exists yet); a positive control plants a second call site and must fail. ActionBar and App still import `./new-game` (a source scan).

**resetForNewSession.** From any stack of the new ids up to max depth it leaves depth 0 and nav receives exactly one pop per entry (the existing top-down `close` loop).

**Interface.** overlays.svelte.ts gains the six OverlayId values; new src/ui/Sheet.svelte, Panel.svelte; Dialog.svelte extended; `openSurface(id)` (above); motion.ts exports the 120 ms constant; new-game.ts unchanged (exports `newGame`).

**Owns.** The primitives, the overlay ids, `openSurface`, the transition, the New game function (R4).

**Consumers.** overlays.svelte.ts is shared by HistoryNotice and its Reset confirm (resetConfirm), WordCellView, the tail selection, the hover peek and App; these stay green: overlays.svelte.test.ts, history-notice.svelte.test.ts, hover-peek.test.ts, act.test.ts, e2e/history-notice.spec.ts, e2e/history.spec.ts, e2e/wordcell-view.spec.ts.

**Tests.** AD-13 U cases: the per-id depth matrix above (open, stack, close, back, resetForNewSession, one illegal pair per new id, a confirm dismissal closing only the confirm, both menu-item sequences, a new-id open over a peek (throws), over hoverPeek (cleared), over tile selection, tailSelection and wordcellView (illegal)); resetConfirm's new tops and its refusal elsewhere; historyNotice's unchanged rules and the chain endSheet, historyNotice, resetConfirm; the F8 modal-notice throw; the chain endSheet, statistics, resetConfirm; the transition rules listed under Motion; AD-12 U per component showing `controller.cancel()` runs before the handler; newGame single-site scan; shared components proved by UI Vitest mounts (focus start, scrim, `act()`, safe-area, transition class) until entries with real openers exist. The one Playwright check at a fixed 360 x 320 viewport (scroll and visible-close rule; jsdom cannot measure layout) moves to entry 2, the first entry with a real opener.

## Acceptance Criteria

Verify: npm run test:all and npm run test:screens are green with UI Vitest AD-13 cases for every new entry (open, stack, close, back, resetForNewSession), confirm dismissal closing the confirm without reopening the menu, AD-12 act() on the shared close buttons, and a UI Vitest/scan test that no site other than new-game.ts repeats the New game sequence; P6 opening a WordCell view in Idle that animates and ends in the shown state, and under reduced motion fades.

- Existing baselines are unchanged and test:screens is green.
- This ticket adds no screenshot baseline; its only new P6 spec (dev-server suite, no `toHaveScreenshot`) is `AD-14 WordCell view open/close transition` in e2e/wordcell-view.spec.ts: for the sheet's open and close and a peek, a transition of `--wc-base-ms` length runs (computed style), the shown state is the end state, and under Playwright `reducedMotion: 'reduce'` emulation a 120 ms opacity-only transition runs.

## References

- parent — _bmad-output/initiative-wordcell-v1/epic-game-surfaces-and-keyboard/epic-game-surfaces-and-keyboard.md
- spec — _bmad-output/specs/spec-epic-6-surfaces/SPEC.md, Capabilities (CAP-1), Decisions
- design — _bmad-output/planning-artifacts/ux-designs/ux-wordcell-2026-09-27/EXPERIENCE.md, Component Patterns, Keyboard, State Patterns
- design — _bmad-output/planning-artifacts/ux-designs/ux-wordcell-2026-09-27/DESIGN.md, Components
- spec — _bmad-output/specs/spec-epic-6-surfaces/build-notes.md, Per-surface behaviour (SPEC F5); SPEC.md F5, CAP-10

## Notes

- R-74 P6 supplement: tickets.toml entry 1's `tests` row 'R-74 (UI) New game sequence unchanged ... (P6 supp.)' moves to entry 3 (owner of R-74 UI); tickets.toml is not edited here.
- Resolved: the shared components are proved by UI Vitest mounts alone until entry 2 and later entries give them a real opener (see Tests). The AD-13 two-overlay reload case is entry 5's P6 (SPEC CAP-6); the ☰ focus return after a confirm dismissal is entry 3's P6 (SPEC CAP-3).
