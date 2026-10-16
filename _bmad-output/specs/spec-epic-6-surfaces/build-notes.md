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

Ticket 6.13 built this; `src/ui/text.ts` holds every string, `src/ui/announce.ts` the one setter. One polite region (`role="status"`, clipped) mounted once at the App root; announcements replace (clear, then set in the next rAF; latest wins; the outcome queues behind a pending commit set; a set falling due while `document.hidden` is skipped).

Names: column card `{L}, column {c}, card {i} of {n}{, selected}{, destination}`; tray tile `{L}, tray, tile {i} of {n}{, selected}` (live tiles only); WordCell top card `{L}, WordCell {c}, top`; WordCell `WordCell {c}, top {L}, {n card(s)}{, used}`; empty `WordCell {c}, empty`; foot `Column {c} foot` (`role="group"`), source foot `Column {c}, here`. QU reads `Q U, counts as two letters`. Buried WordCell cards are `aria-hidden` (owner decision 2026-10-15).

Announcements: phase change `Composing. {WORD}, {N letters}.` / `Place. ...`; invalid word `{WORD} isn't in the word list.`; commit `{WORD} placed on cell {c}, plus N|minus N|no change` (from the pre-dispatch view); Undo `Undo. {phase}`; Redo `Redo. {phase}` (idle phase `Idle.`); New game `New game. Idle.`; Replay `Replay. Idle.`; outcome `{title} Score {N|minus N}, {band}.` (title is the end sheet's: `Every column cleared.` or `Game given up.`), set only when `openDeferred` returns true. Give up sets no other string. Silent: relaunch, sheet re-expand, hidden return, word edits inside Composing, no-op dispatches (`changed` false).

Close-out note for the docs (not edited here): EXPERIENCE.md Accessibility Floor and SPEC CAP-11 ("every card is a button") need an exception for buried WordCell cards.

## Close-out edits (owner-visible docs; the spec wins)

- Spine AD-13 (line "menu plus confirm, epic 4 SPEC F16") and EXPERIENCE.md/epic 4 F16 references: change "menu plus confirm" to "a panel plus a confirm" (the Statistics panel with Reset history's confirm; a menu item closes the menu before a confirm opens, CAP-1).

## Carry-ins (ticket 6.14, epic 4 retro A8)

- Wheel during a mouse drag (F3): the Vitest and Playwright cases failed first (faces stayed at the pointer delta, highlight and drop target stale), so the fix landed: a passive `window` `scroll` listener in `controller.ts`, added at a mouse press and removed in `end()`; `drag.scroll` holds `scrollY` at the drag start and the applied delta; `dragMove` adds the delta to `dy`, the release re-reads the live offset first, and the tile and free-letter gap pick measures the dragged rect in the drag-start frame (`inStartFrame`). Touch and pen presses add no listener; `gate.ts` is untouched. The `[data-view-scroll]` sheet and the tray rows are not drag-scroll cases.
- Hover-peek re-anchor (F6): passes without a fix (`e2e/hover-peek-reanchor.spec.ts`, desktop). A width change shifts the column; the banner scrolls the page by its height (layout's anchor write) so the cell holds its viewport place and the peek moves in the document. Non-vacuity asserts the peek's x (width change) and document top (banner) changed; no `HoverPeek.svelte` change.
- Bfcache hide flush (F7): not reproduced, no test committed. Attempt 1 (`pageHide` / `pageShow({ persisted: true })` helpers, android) passed for all three variants (menu open, mouse drag live, stale-owner halt). Attempt 2 (a real bfcache navigation: `channel: 'chromium'` with `ignoreDefaultArgs: ['--disable-back-forward-cache']` against `dist-test`, `page.goto('about:blank')` then `page.goBack({ waitUntil: 'commit' })`, `pageshow.persisted` asserted true; the stale variant wrote `wordcell:session` from a second page while the first sat in the cache) also passed: the next Back popped the menu (depth 1 to 0), the drag was cancelled with nothing swallowed, and the halted page's Back raised no pending-back fault. CAP-12 "not a bug" (SPEC Assumptions). Playwright's default Chromium cannot run bfcache (`BackForwardCacheDisabledForDelegate`, headless shell), which is why attempt 2 needs the full `chromium` channel.
