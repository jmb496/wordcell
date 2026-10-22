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
| Undo button by touch or pen (as built, Opus review (epic 6 part C) default) | its pointerup holds the open for its later click up to `CLICK_GRACE_MS` (300 ms); with no click the sheet opens at the grace's end (mouse, pointercancel, a pointerup off Undo: one tick) |
| Non-primary button (`button` ≠ 0) on Undo (as built, Opus review (epic 6 part C) default) | an ordinary consumed input: completes, no hold, sheet opens |
| Bare Ctrl, Cmd or Shift keydown, Undo enabled (as built, Opus review (epic 6 part C) default; supersedes ticket 6.12's "ordinary consumed input" for the chord modifier) | completes and is consumed; holds the open so the chord's Z still undoes with no sheet, up to `CLICK_GRACE_MS` (300 ms) from the latest bare modifier keydown, capped at 300 ms after guard install while that has not passed (so the row below still holds); the hold ends early one tick after every held modifier is up or at the next start that is not an Undo alias, then the sheet opens |
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

As built (Opus review (epic 6 part C) default): a pointerdown with the `pointerId` of an open pointer gesture means its end was lost, like a fresh keydown of an open key: the stale entry ends (releasing an Undo hold it carried) and the down starts a new gesture.

## Key handler details (CAP-10)

Repeats ignored for toggles; Space/Enter on a focused button stays native; `?` matched by `event.key` (shifted, non-US layouts); tests use `keyboard.press`; letter keys case-insensitive.

## Live region strings (CAP-11)

Ticket 6.13 built this; `src/ui/text.ts` holds every string, `src/ui/announce.ts` the one setter. One polite region (`role="status"`, clipped) mounted once at the App root; announcements replace (clear, then set in the next rAF; latest wins; the outcome queues behind a pending commit set; nothing is scheduled while `document.hidden`, and the AD-9 hide flush drops a pending set and a queued outcome through `cancelAnnounce`, registered in `main.ts` (as built, Opus review (epic 6 part C) default: rAF does not run while hidden, so the set would otherwise be spoken on return)).

Names: column card `{L}, column {c}, card {i} of {n}{, selected}{, destination}`; tray tile `{L}, tray, tile {i} of {n}{, selected}` (live tiles only); WordCell top card `{L}, WordCell {c}, top`; WordCell `WordCell {c}, top {L}, {n card(s)}{, used}`; empty `WordCell {c}, empty`; foot `Column {c} foot` (`role="group"`), source foot `Column {c}, here`. QU reads `Q U, counts as two letters`. Buried WordCell cards are `aria-hidden` (owner decision 2026-10-15).

Announcements: phase change `Composing. {WORD}, {N letters}.` / `Place. ...`; invalid word `{WORD} isn't in the word list.`; commit `{WORD} placed on cell {c}, plus N|minus N|no change` (from the pre-dispatch view); Undo `Undo. {phase}`; Redo `Redo. {phase}` (idle phase `Idle.`); New game `New game. Idle.`; Replay `Replay. Idle.`; outcome `{title} Score {N|minus N}, {band}.` (title is the end sheet's: `Every column cleared.` or `Game given up.`), set only when `openDeferred` returns true. Give up sets no other string. Silent: relaunch, sheet re-expand, hidden return, word edits inside Composing, no-op dispatches (`changed` false).

## Close-out edits (owner-visible docs; the spec wins)

Close-out edits applied 2026-10-16 (owner-authorised): every entry below, plus the four additions at the end of this list, is applied to its target file. Where the old text was not verbatim the nearest equivalent was edited (line breaks, and the EXPERIENCE.md catalogue, which gained three rows). The `nav.settled`/`whenSettled` sentence was checked against `src/shell/nav.ts` before applying. Entries are marked "applied".

- (applied) Spine AD-13 (line "menu plus confirm, epic 4 SPEC F16") and EXPERIENCE.md/epic 4 F16 references: change "menu plus confirm" to "a panel plus a confirm" (the Statistics panel with Reset history's confirm; a menu item closes the menu before a confirm opens, CAP-1).

Listed by ticket 6.17 and applied by no ticket; applying the list is the owner's call (SPEC CAP-12; AGENTS.md rule 7 and Policy: no AD is reopened). Each entry is file, old text (verbatim; a `\` marks a source line break), new text, reason.

- (applied) **EXPERIENCE.md Accessibility Floor, Screen readers bullet** (owner, 2026-10-15; the SPEC CAP-11 entry below is the same exception).
  - Old: "every card is a button named by letter, place and state (`E, column 1, \ card 2 of 5, selected`)"
  - New: "every card in a column or the tray is a button named by letter, place and state (`E, column 1, card 2 of 5, selected`); a card buried under a WordCell's top card is `aria-hidden`, and the WordCell's name gives its top card and count"
  - Reason: 6.13 hides buried WordCell cards from screen readers (owner decision 2026-10-15); a screen-reader user cannot step through the cards beneath.
- (applied) **SPEC.md CAP-11, success line** (owner, 2026-10-15).
  - Old: "every card button is named by letter, place and state (`E, column 1, card 2 of \ 5, selected`)"
  - New: "every card button in a column or the tray is named by letter, place and state (`E, column 1, card 2 of 5, selected`); buried WordCell cards are `aria-hidden` and the WordCell's name gives its top card and count"
  - Reason: same decision as the entry above.
- (applied) **SPEC.md CAP-5** (technical; from 6.12 and its ticket review).
  - Old: "the deferred open waits for whatever animations are in flight \ (none: opens at once)"
  - New: "the deferred open waits for whatever animations are in flight and fires at max(animation settled, 300 ms after guard install) at every speed (epic 5 F8, F23)"
  - Reason: "(none: opens at once)" contradicts the built behaviour: with Fast speed or reduced motion the sheet still opens 300 ms after the guard installs (build-notes, Winning-guard input outcomes; `win-guard.spec.ts` fake-clock cases).
- (applied) **Spine AD-13, the push-depth bullet ("Push depth and stale-launch edges")** (technical, 6.10).
  - Old: no mention of `nav.settled` or `nav.whenSettled`; the bullet ends at "Known edges, accepted as residuals:" and its list.
  - New: add a sentence after "...sends `depth + 1`.": "`nav.settled()` is true when no history operation is pending or queued; `nav.whenSettled(fn)` runs `fn` at once when settled, otherwise when the queue next settles (epic 6 CAP-10)."
  - Reason: `src/shell/nav.ts` exports both and 6.10 relies on them; the spine does not name them. Check the sentence against `nav.ts` before applying; no AD is reopened.
- (applied) **EXPERIENCE.md Message catalogue** (owner, 2026-10-15: new strings are listed, not asked about).
  - Old: no rows for the How to play close control, the screen-reader names or the live-region announcements; the rows `Menu and panel names (epic 6)`, `Statistics tiles` and `End sheet labels` already exist.
  - New: add rows `Close how to play`; screen-reader names (`{L}, column {c}, card {i} of {n}{, selected}{, destination}`, `{L}, tray, tile {i} of {n}{, selected}`, `{L}, WordCell {c}, top`, `WordCell {c}, top {L}, {n card(s)}{, used}`, `WordCell {c}, empty`, `Column {c} foot`, `Column {c}, here`, `Q U, counts as two letters`); announcements (`Composing. {WORD}, {N letters}.`, `Place. ...`, `Idle.`, `{WORD} placed on cell {c}, plus N|minus N|no change`, `Undo. {phase}`, `Redo. {phase}`, `New game`, `Replay`, `{title} Score {N|minus N}, {band}.`) as in "Live region strings (CAP-11)" above and `src/ui/text.ts`.
  - Reason: `text.ts` holds them; the catalogue is the single list the rule "every catalogue string only in text.ts" points at.
- (applied) **EXPERIENCE.md State Patterns, row "Idle, pending draft" and DESIGN.md Tray band** (owner, 2026-10-15).
  - Old: "| Idle, pending draft | Board | Redo enabled; tray line `Undone: … · Redo brings it back`. [ASSUMPTION A-E13] |"
  - New: the same row plus "At 360 px the line never wraps or overflows: the suffix always shows in full and only the word ellipsizes, and only when it cannot fit"; add the same sentence to DESIGN.md Tray band.
  - Reason: 6.8 and its code review fixed this behaviour (`pending-draft.spec.ts` R-72 10-letter case).
- (applied) **DESIGN.md Components, Focus ring bullet** (owner, 2026-10-15, 6.11).
  - Old: "A 2 px `{colors.accent-teal}` ring at 2 px offset, with a `{colors.table}` gap between the ring and the element."
  - New: "A 2 px `{colors.accent-teal}` ring. On a card it is drawn inside the card edge (2 px in), with no offset or gap; on other controls it keeps the 2 px offset and the `{colors.table}` gap."
  - Reason: owner kept the inside ring for cards; the doc's offset wording no longer matches (`keyboard.screens.spec.ts` baselines).
- **Additions (owner, applied 2026-10-16).**
  - EXPERIENCE.md Keyboard: Validate, Confirm and Flip close an open sticky word view or peek (and clear a tail selection) before acting, like Undo, Redo and the menu (owner 2026-10-15, ticket 6.10 Notes). Applied.
  - EXPERIENCE.md Keyboard and Accessibility Floor: one Tab stop per non-empty column (owner 2026-10-15, ticket 6.11 Notes; plan item D45), consistent with the 6.11 ticket's roving model. Applied.
  - Spine AD-9: the shell's read-only `elapsedMs(now)` accessor for the top-bar timer (checked against `src/shell/game.svelte.ts`). Applied.
  - EXPERIENCE.md Keyboard: `Space` on a WordCell with an open view now only closes the view; it no longer closes and reopens (owner 2026-10-16). Docs only; code is separate. Applied.
- Already satisfied, no edit: SPEC F6 and DESIGN.md Elevation & Depth carry the 2026-10-15 owner answer (☰ covered by a sticky WordCell view); EXPERIENCE.md Rating bands carries the English score column How to play lists; the Statistics and end-sheet strings are catalogue rows.

## Carry-ins (ticket 6.14, epic 4 retro A8)

- Wheel during a mouse drag (F3): the Vitest and Playwright cases failed first (faces stayed at the pointer delta, highlight and drop target stale), so the fix landed: a passive `window` `scroll` listener in `controller.ts`, added at a mouse press and removed in `end()`; `drag.scroll` holds `scrollY` at the drag start and the applied delta; `dragMove` adds the delta to `dy`, the release re-reads the live offset first, and the tile and free-letter gap pick measures the dragged rect in the drag-start frame (`inStartFrame`). Touch and pen presses add no listener; `gate.ts` is untouched. The `[data-view-scroll]` sheet and the tray rows are not drag-scroll cases.
- Hover-peek re-anchor (F6): passes without a fix (`e2e/hover-peek-reanchor.spec.ts`, desktop). A width change shifts the column; the banner scrolls the page by its height (layout's anchor write) so the cell holds its viewport place and the peek moves in the document. Non-vacuity asserts the peek's x (width change) and document top (banner) changed; no `HoverPeek.svelte` change. As built (Opus review (epic 6 part C)): the width case resizes 700×1000 to 600×1000 so `layout.w` changes (75 to 67), uses cell 7 (its clamped x depends on the slot), and checks the peek's left against the cell's grid unit plus `placeHoverPeek`'s x.
- Bfcache hide flush (F7): not reproduced, no test committed. Attempt 1 (`pageHide` / `pageShow({ persisted: true })` helpers, android) passed for all three variants (menu open, mouse drag live, stale-owner halt). Attempt 2 (a real bfcache navigation: `channel: 'chromium'` with `ignoreDefaultArgs: ['--disable-back-forward-cache']` against `dist-test`, `page.goto('about:blank')` then `page.goBack({ waitUntil: 'commit' })`, `pageshow.persisted` asserted true; the stale variant wrote `wordcell:session` from a second page while the first sat in the cache) also passed: the next Back popped the menu (depth 1 to 0), the drag was cancelled with nothing swallowed, and the halted page's Back raised no pending-back fault. CAP-12 "not a bug" (SPEC Assumptions). Playwright's default Chromium cannot run bfcache (`BackForwardCacheDisabledForDelegate`, headless shell), which is why attempt 2 needs the full `chromium` channel.
