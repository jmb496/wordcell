# Epic 6 build notes

Filled in by tickets: the how, as-built facts and close-out edits. The tables below are the spec-time defaults.

## Screens specs per ticket (default list)

Menu, end sheet, panels, dialogs, timer bar at 360 px. The version footer is fixed by `WORDCELL_APP_VERSION` in the test and screenshot builds.

## Per-surface behaviour (SPEC F5)

| Surface | Board inert | Bars live | Shortcuts active | Focus start | Focus return |
| --- | --- | --- | --- | --- | --- |
| Menu | yes | no (top bar `inert`, SPEC F6) | Tab, Enter, Space, Esc only | first row | the board; confirm dismissal returns to the ☰ button |
| Panel | yes | no (top bar `inert`, SPEC F6) | Tab, Enter, Space, Esc only | panel heading or close | opener |
| Confirm dialog | yes | no (top bar `inert`, SPEC F6) | Tab, Enter, Space, Esc only | Keep playing / Keep it | the board (from the menu: ☰) |
| History notice | yes | no (top bar `inert`, SPEC F6) | Tab, Enter, Space, Esc only | its action | the board |
| End sheet expanded | yes | yes | M, N, ?, Z, Y, Esc | first action | the board on collapse |
| End sheet collapsed | no | yes | M, N, ?, Z, Y, Esc | the bar | n/a |
| WordCell view | no | no (scrim covers them; owner 2026-10-15) | M, N, ?, Z, Y, Esc | the view | the cell |

Check each cell against EXPERIENCE.md when building; a mismatch stops the ticket.

## Winning-guard input outcomes (CAP-5)

Window = from the win's guard install until the end sheet opens, which fires at max(animation settled, 300 ms after guard install) at every speed (EXPERIENCE.md Motion, epic 5 F8, F23). The token is killed only by boot/reload and `resetForNewSession`. Default: every input other than Undo completes the animation and is consumed, then the sheet opens.

| Input | End state |
| --- | --- |
| Undo button or key (Z, Ctrl/Cmd+Z), Undo enabled | animation completes, undo applies, no sheet; before the sheet opens it cancels the pending open |
| Undo between animation settled and 300 ms (Fast, reduced motion) | cancels the pending open, undoes, no sheet |
| Any other input between settled and 300 ms | consumed, the open still fires at 300 ms |
| Fast speed or reduced motion, no input | sheet opens at 300 ms after guard install, not at settle |
| Undo after the sheet opened | sheet closes, play resumes |
| Redo (button or Ctrl/Cmd+Shift+Z) | completes and is consumed, sheet opens |
| Menu button, board tap, other key, Tab | completes and is consumed, sheet opens |
| Esc | consumed like other inputs, completes, sheet opens |
| Browser back (cannot be consumed) | completes, then follows the normal back rule; the sheet then opens |
| M, N keys, New game, Replay | completes and is consumed, sheet opens |
| Hide | token not killed: completes at once, sheet opens expanded on return (R-73) |
| Reload, boot | token killed; boot opens the sheet per R-73 |

Mechanism: an `event.key` match in the guard beside the existing target match in `motion.ts` (`inUndo` is already `typeof`-free and matches by target only). A Redo win follows the Confirm path.

## Key handler details (CAP-10)

Repeats ignored for toggles; Space/Enter on a focused button stays native; `?` matched by `event.key` (shifted, non-US layouts); tests use `keyboard.press`; letter keys case-insensitive.

## Live region strings (CAP-11)

One polite region in the UI, announcements replace. Triggers: phase change (`Composing. BAKED, 5 letters.`), invalid word, commit (just-committed signal from the dispatch call site; word, cell and delta from the committed move's view), Undo, Redo, New game (default: announce the resulting phase), outcome. A winning Confirm announces the commit at commit time and the outcome when the sheet opens, replacing the commit text (test). The ticket lists every string here.

## Close-out edits (owner-visible docs; the spec wins)

- Spine AD-13 (line "menu plus confirm, epic 4 SPEC F16") and EXPERIENCE.md/epic 4 F16 references: change "menu plus confirm" to "a panel plus a confirm" (the Statistics panel with Reset history's confirm; a menu item closes the menu before a confirm opens, CAP-1).
