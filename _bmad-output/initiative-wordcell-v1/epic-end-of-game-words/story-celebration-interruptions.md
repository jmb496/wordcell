---
id: 7
type: story
title: "Celebration interruptions"
parent: epic-end-of-game-words
covers: [CAP-3]
after: [6]
risk: high
---

# Celebration interruptions

## Description

Adds the new end paths on top of entries 5 and 6: the ☰ button and `M` (sheet expanded, then the menu after the push settles), the before-hide callback (sheet open queued for the next visible, idempotent) and `resize`/`orientationchange`; and proves with Playwright the behaviours entries 4 and 5 already provide: Undo, New game and the `N` key cancel without a sheet, a Redo that restores the win starts it again, and `?` and WordCell keys do nothing while it runs.

- Interface: `celebration.end()` as it is (no mode or parameter), the ☰/`M` handlers through one shared menu helper, `main.ts`'s before-hide and `resize`/`orientationchange` registrations. Tests: R-87 interruption rows (P6, `desktop` for keys); UI Vitest `AD-19` hide, resize and menu wiring tests (AC). Owns: the menu, hide and resize ends of the run. Consumers: none. Plan checkpoint: the build stops at its plan for the owner; the plan carries the Hide default below for the owner's nod (story-celebration-overlay-entry-plan.md residual risks).
- Hide: `main.ts` registers one more `game.registerBeforeHide(() => celebration.end())`, after the existing registrations: the ordinary `end()` (close → queued `nav.pop`), no mode flag or parameter. Idempotent: the second flush on `pagehide`, or no live run, is a no-op (`clear()` returns null). Entry 5's `done` closure already defers `openDeferred` to `game.whenVisible()` on a hidden page with no `announceOutcome()` (story-celebration-overlay-entry-plan.md owner item 1: no second `done` path). AD-19's "hide mode" wording goes to entry 9's doc sync. A `pagehide` on a reload while visible now also runs the hide end (`done`'s visible branch); "R-87 a reload mid-run is a relaunch: the sheet opens expanded at boot and no copy is drawn" must stay green (R-73).
- Resize: `main.ts` adds permanent `window` `resize` and `orientationchange` listeners at boot that call `celebration.end()` (a no-op with no run; any such event during a run ends it, no size compare).
- Halted: the hide and resize ends do nothing while the app is halted (AD-15), as `skip.ts` passes everything through while halted.
- Menu (SPEC F13, A-E16): the ☰ button is `src/ui/TopBar.svelte` (`act(openMenu)`); `M` is the keys.ts `menu` row, and `menu` joins `CELEBRATION_KEYS` (the interim-gap comment goes). Both use one helper: with `celebration` open, `celebration.end()`, then `nav.whenSettled(…)` opens the menu only if the top entry is `endSheet` and the menu is not open, else nothing (a specified outcome, rule 6); otherwise today's `openSurface('menu')` unchanged. `act()` is unchanged (AD-19). This removes the interim gap entries 4–6 left (☰ throws the `open(menu)` guard to AD-15; `M` is ignored).
- Keys (SPEC F15): `?` and WordCell `Enter` already do nothing (entry 4, `SUSPENDING`). For a WordCell tap, "does nothing" means no WordCell action: the tap is entry 6's consumed press skip, covered by "R-87 a touch press on a non-empty WordCell skips the run, consumed: …" (the `${name}` case of the press-skip test); entry 9 rewords the rule-coverage row.
- Cancel: Undo (button, `android`; `Z`/Ctrl+Z, `desktop`), New game and `N` cancel (entries 4 and 5): `running()` false, no copies, no end sheet, no overlay history entry, and still no sheet after advancing the hook clock past the cap; New game then back leaves the app (AD-13).
- Redo: the boundary case: Undo mid-run (no sheet), Redo → a new run, finish → exactly one expanded sheet.

## Acceptance Criteria

Verify: `npm run test:all` and `npm run test:screens` are green, no screenshot baseline is added or changed (no `*-snapshots` path in the diff), and these R-87 rows of rule-coverage.md pass with the seam enabled:

- New, "hide the app mid-run, show: sheet expanded, back and menu still work (`hidePage`/`showPage`); resize ends it" (`android`). Hide: seam on, win into the run, `hidePage` → `running()` false, no celebration copies, end sheet not open, history back at the base entry (no overlay entry); `pageHide` (second flush, no throw); `showPage` → sheet expanded with one overlay history entry, Replay this deal focused, no outcome announced (a return from hidden is silent, EXPERIENCE.md); back collapses the sheet, the app still open; ☰ opens the menu over the sheet and back closes only the menu. Resize: `page.setViewportSize` mid-run → sheet expanded, Replay this deal focused; `orientationchange` by a dispatched `Event` (P6) or the AD-19 U test.
- New, "`?`, WordCell `Enter` and a WordCell tap do nothing while it runs; `N` and Undo keys act" (`desktop`): `?` (no How to play) and `Enter` on a focused WordCell (no view), `running()` still true afterwards; `N` and `Z`/Ctrl+Z as Cancel. The WordCell tap is entry 6's test (Keys).
- New, "☰ ends it, sheet expanded behind the menu; back closes the menu only" (`android`; `M` `desktop`): ☰ mid-run → sheet expanded behind the menu, back closes only the menu; a double ☰ tap (`android`) and `M` twice (`desktop`) give one menu and no Halted surface.
- New, "Undo stops it, no end sheet; New game stops it" (`android`): the Cancel outcome for the Undo button and New game.
- Passing from entry 5, "a Redo that restores the win plays it again": "R-87 a Redo that restores the win plays it again: the first run is gone and a new group is shown"; new beside it, the Redo boundary case.
- UI Vitest `AD-19` (AD-19 Tests): the hide callback twice gives one pop and one `done`; with no run it is a no-op; `resize` and `orientationchange` each end a live run once; the menu helper calls `end()` before the deferred open and drops the open when the top is not `endSheet`.

## References

- parent — _bmad-output/initiative-wordcell-v1/epic-end-of-game-words/epic-end-of-game-words.md
- architecture — ARCHITECTURE-SPINE.md AD-9, AD-13, AD-19 (Hide)
- spec — SPEC.md CAP-3, F13, F15, F16; rule-coverage.md (R-87 interruption rows)
- design — EXPERIENCE.md Win celebration (Skip, Never plays, Keys while it runs), A-E16
- code — src/ui/keys.ts, src/ui/act.ts, src/ui/TopBar.svelte, src/ui/celebration/celebration.svelte.ts, src/main.ts, src/ui/end-sheet.ts, src/ui/overlays.svelte.ts, src/ui/open-surface.ts, src/shell/nav.ts (whenSettled), src/shell/game.svelte.ts (registerBeforeHide), e2e/celebration.spec.ts, e2e/helpers/celebration.ts, e2e/helpers/lifecycle.ts

## Notes

- Open question: How Android treats the sheet's history push after the hide callback; the lifecycle test proves the app-level behaviour, entry 9's final Android read (tickets.toml entry 9, the hide path) the platform; the epic 7 device check is later and platform-wide.
- This ticket closes the ☰/`M` merge blocker (story-celebration-overlay-entry-plan.md owner item 3): the epic branch may merge after it.
- Accepted residual, for the device read: a back gesture landing between ☰'s queued pop and the sheet push is absorbed by nav as its own pending pop (AD-13).
