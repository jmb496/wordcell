---
id: 12
type: story
title: "Winning guard: the end-sheet half"
parent: epic-game-surfaces-and-keyboard
covers: [CAP-5]
after: [6, 10]
risk: high
---

# Winning guard: the end-sheet half

## Description

Finishes the AD-14 guard (epic 5 F8, F23; EXPERIENCE.md Motion). The authority for every input outcome is the table "Winning-guard input outcomes (CAP-5)" in build-notes.md; this ticket does not restate it. "Guard window" means, as there, from the win's guard install until the end sheet opens. Undo after the sheet opened is the normal path (the sheet closes, play resumes) and the guard is a no-op there.

**Open timing (new).** The deferred open fires at max(animation settled, 300 ms after guard install) at every speed, including with no animation in flight (settle = install time, so the 300 ms floor still applies; this resolves SPEC's "none: opens at once" per build-notes and F23). It is independent of the guard's backstop and uninstall, and uses the injected `now` and timers so fake clocks test it. Today `flip.ts` opens at settle only (`settleCallbacks`, `drainSettled`); the floor is added there or in `end-sheet.ts`. Any other input only completes the animation and is consumed; it never opens the sheet before the floor. Hide completes at once and the sheet opens expanded on return (R-73); the token is killed only by boot/reload and `resetForNewSession`, not by hide; browser back cannot be consumed (completes, normal back rule, then the sheet opens); Esc, Tab, M, N, New game and Replay are consumed and the sheet then opens (build-notes rows).

**Undo aliases (new, `motion.ts`).** Beside the existing target match (`inUndo`, `[data-testid="undo"]`), the guard matches a keydown/keyup with `event.key.toLowerCase() === 'z'`, no Shift, no Alt, bare or with Ctrl/Meta. Ctrl/Cmd+Shift+Z is Redo: checked first and consumed like any other input. Extend `inUndo` (or add the key match beside it) keeping it free of `typeof` checks. Tracking stays keyed by `code` (`gestureId`). `motion.ts` has no `GameView` access (AD-3), so "Undo enabled" is an injected predicate `canUndo: () => boolean` passed to `startTracker` from `main.ts`, reading the `GameView` `canUndo` flag (the flag `TopBar.svelte` disables the button with). With it false, neither the target nor the key match applies: the input is an ordinary consumed input and the guard does not uninstall early. Unit cases: Z, Ctrl+Z, Meta+Z, Shift+Z, Ctrl+Shift+Z, Alt+Z, upper and lower case, Undo disabled. Held Z: an alias keydown undoes once (its repeats and keyup are not acted on, CAP-10: repeats ignored by toggles); a Z held across the install is tracked as consumed and does not undo (test).

**Who cancels the open.** Verified, not added: `cancelEndSheetOpen` and `onUnfinished` exist (`overlays.svelte.ts`, `end-sheet.ts` `onDispatched`); the Undo dispatch's `unfinished` result calls `onUnfinished`, which cancels the pending open. The guard only completes the animation, uninstalls and lets the Undo through (F8 pass-through); a no-op or disabled Undo never cancels. Test added: a deferred timer firing between the guard's Undo finish and the dispatch still does not open the sheet (the Undo arrives before the open, which waits on the floor and the same task).

**Redo win and menu.** `flip.ts` `play` calls `install(result.finished === 'won', ...)` and `onDispatched` handles `won` for any command, so a Redo win already takes the Confirm path: the Redo-win test is regression-only (unverified by run). Menu button: the press is consumed, the menu does not open, then the sheet opens, with no AD-13 `openDeferred while menu is open` throw (test).

interface = "motion.ts guard gains the event.key Undo-alias match beside the target match; overlays.svelte.ts cancel of the deferred open." New: the key match and `canUndo` predicate, the 300 ms floor on the open. Verified: the existing cancel path.

tests = "AD-14 winning guard end-sheet half, Undo aliases, Redo win, menu case (P6); R-70 Undo during the window (P6); R-62 sheet opens after the animation settles (P6 part)."

owns = "The guard's end-sheet half."

consumers = "The guard is read by every dispatching caller and the epic 5 winning-guard tests."

## Acceptance Criteria

Verify: `npm run test:all` is green and `npm run test:screens` stays a regression run (build-notes lists no screens spec for this ticket, so none is added). Playwright cases from the build-notes rows, each at Normal, Fast, Slow and reduced motion unless noted, android and desktop unless noted:

- Undo button during the window: animation completes, undoes, play resumed, no sheet.
- Undo key Z and Ctrl+Z (desktop only, rule-coverage): same; Ctrl/Cmd+Shift+Z (desktop) is consumed as Redo and the sheet opens.
- WordCell tap, primary action, menu press (menu stays closed), Esc/Tab/M/N, New game/Replay: each only completes the animation and is consumed, then the sheet opens.
- Browser back: completes, normal back rule, then the sheet opens. Hide: completes at once, sheet opens expanded on return (R-73).
- Redo win by button followed at once by Undo: no sheet.
- Undo between settle and 300 ms (reachable only at Fast and reduced motion): cancels the open, undoes, no sheet.
- No input at Fast and reduced motion: the sheet opens at 300 ms after install, not at settle.

UI Vitest (fake clocks) covers the alias cases, held Z, the Undo-finish-then-timer race and the no-animation floor above.

## References

- parent — _bmad-output/initiative-wordcell-v1/epic-game-surfaces-and-keyboard/epic-game-surfaces-and-keyboard.md
- spec — _bmad-output/specs/spec-epic-6-surfaces/SPEC.md, Capabilities (CAP-5), Decisions
- design — _bmad-output/planning-artifacts/ux-designs/ux-wordcell-2026-09-27/EXPERIENCE.md, Component Patterns, Keyboard, State Patterns
- design — _bmad-output/planning-artifacts/ux-designs/ux-wordcell-2026-09-27/DESIGN.md, Components
