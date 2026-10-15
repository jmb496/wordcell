---
id: SPEC-epic-6-surfaces
companions:
  - rule-coverage.md
  - build-notes.md
  - ../spec-epic-5-tray/SPEC.md
  - ../../../docs/game-flow-spec.md
  - ../../planning-artifacts/architecture/architecture-wordcell-2026-09-27/ARCHITECTURE-SPINE.md
  - ../../planning-artifacts/ux-designs/ux-wordcell-2026-09-27/EXPERIENCE.md
  - ../../planning-artifacts/ux-designs/ux-wordcell-2026-09-27/DESIGN.md
  - ../../../AGENTS.md
  - ../../../docs/development-methodology.md
sources:
  - ../../initiative-wordcell-v1/epic-tray-and-place/epic-tray-and-place-retrospective.md
  - ../../initiative-wordcell-v1/epic-app-shell/epic-app-shell-retrospective.md
  - ../../initiative-wordcell-v1/epic-board-and-gestures/epic-board-and-gestures-retrospective.md
---

> **Canonical contract.** This SPEC and the files in `companions:` are the complete, preservation-validated contract for what to build, test, and validate. Source documents listed in frontmatter are for traceability — consult them only if you need narrative rationale or prose color this contract intentionally omits.

# Epic 6 — Game surfaces and keyboard

## Why

Vision, a game that can be finished, restarted and read. After epic 5 a whole move plays, but the
live site has no menu, no Give up, no mid-game New game or Replay, no end sheet, no statistics, no
preferences, no rules page, no keyboard play and no screen-reader labels (epic 5 SPEC F20). This
epic builds spine Proposed epics row 6 (= epic 5 SPEC Non-goals, first bullet) and closes the carry-ins: F39,
R4 (landed: `newGame()` in `src/ui/new-game.ts`; only callers are added), I-68, the epic 4 retrospective's A8 items, the stale tile selection after a key-changed phase
(epic 5 ticket 5.5 note), the end-sheet half of the AD-14 winning guard and the Undo key aliases in the winning guard. `docs/game-flow-spec.md` is the rule text, the spine the shape, DESIGN.md and
EXPERIENCE.md the look and behaviour (Component Patterns, Keyboard, Accessibility Floor, How to
play, Key Flows 4–7); none is reopened and this spec adds no UX of its own.

## Capabilities

In build order; each depends on those above it unless noted. `rule-coverage.md` maps every (UI)
sentence and spine behaviour this epic proves to its capability and test kind; `build-notes.md`
holds the how, the as-built facts and the close-out edits.

- **CAP-1** Surface foundation (AD-13, AD-14; R4; EXPERIENCE.md Information Architecture, Confirm dialog; DESIGN.md Elevation)
  - **intent:** One place opens, stacks and closes every new surface, so the later capabilities
    only add content.
  - **success:** `overlays.svelte.ts` gains `menu`, `statistics`, `preferences`, `howToPlay`,
    `newGameConfirm` and `replayConfirm` entries (each one history entry, closed top-down, back and
    `Esc` close the topmost; a menu item closes the sheet before acting and the pop completes
    before any push); dismissing a confirm opened from the menu closes only the confirm (the menu is not
    reopened; the ☰ focus is CAP-3's); shared sheet, full-screen panel and confirm-dialog
    components give focus start (dismissive button for a dialog), scrim rules, the safe-area
    padding and the 1 × base open/close transition (reduced motion: the 120 ms fade), the
    WordCell view sheet and peek included; R4 already landed (`newGame()` in `src/ui/new-game.ts`):
    new entry points only add callers of that one function, and a UI Vitest/scan test proves no
    other site repeats the sequence; UI Vitest `AD-13` for each new entry (the two-overlay reload
    case is CAP-6's P6).

- **CAP-2** Menu sheet and menu button (R-74, R-75; DESIGN.md Menu sheet, Top bar)
  - **intent:** A player can reach every game action and page from the top bar.
  - **success:** the top bar's menu slot becomes a 44 × 44 ☰ button (`M` opens it); the sheet ships
    with only the rows whose targets already exist (New game and Replay this deal acting at once, Give up), one 52 px row each
    with its leading glyph, and the footer line `__APP_VERSION__` (`<package.json version>
    (<7-char git SHA>)` from a Vite `define`, spine Consistency Conventions; the build fails if
    git is unavailable (rule 6); declared in `src/app-version.d.ts`; env override
    `WORDCELL_APP_VERSION` applying to every build and set in the screenshot container run so
    baselines stay fixed; all to verify in the ticket against Scaffold deltas);
    opening it clears any tap or tile selection; Give up is enabled only in Idle while playing
    (R-75) and acts at once with no confirmation (A-E10); New game and Replay this deal enabled
    whenever a Session is active; no placeholder surfaces: CAP-3 puts the confirms on the New game and Replay rows, and CAP-6, CAP-7 and CAP-8 each add their row (Statistics, Preferences, How to play) opening its real surface, so the final sheet lists all six rows (asserted in CAP-8's ticket).

- **CAP-3** Confirm dialogs, New game and Replay (R-74, Q-29; EXPERIENCE.md message catalogue)
  - **intent:** A player never loses a game that counts without being asked, and can restart a deal.
  - **success:** New game and Replay this deal open their confirm dialogs (`Start a new game?`,
    `Replay this deal?`, texts from `text.ts`) only while a game is in progress (status = playing
    and `moves.length > 0`, §2, R-74, read from `GameView.inProgress`, never re-derived in the UI); a fresh deal or a
    finished game acts at once; from the rejected root New game acts at once (no menu there, so
    Replay is not offered); `Keep playing` is focused first, `Esc`, back and a scrim tap dismiss; dismissing a confirm opened from the menu rows returns to the Board with focus on the ☰ button;
    New game calls CAP-1's `newGame()`; Replay calls `game.replay()` then
    `overlays.resetForNewSession()` (same seed, Q-29); boundary tests: fresh deal (no dialog), one move (dialog), relaunch into Idle with only a redo
    tail (`inProgress` is `playing && moves.length > 0` and `moves` holds the redo tail, so the
    dialog shows; the test follows whatever `inProgress` yields); I-68: P6 Playwright proof of
    Q-29 Replay (same deal, empty moves, history unchanged) and a win → New game → back case (seeded
    won-state fixture, no end-sheet assertion: the sheet is CAP-4's; after New game from a won
    game back leaves the app, or follows the bare-Board rule, and never returns to the finished
    game). The discriminating win smoke test is CAP-4's and the two-overlay reload CAP-6's.

- **CAP-4** End sheet (R-62, R-75, R-81, R-83, R-84, Q-33, Q-35; EXPERIENCE.md End sheet, Rating bands; DESIGN.md End sheet)
  - **intent:** A finished game shows its result and what to do next.
  - **success:** `DispatchResult` `finished`/`unfinished` is wired to `overlays`: a win by Confirm
    or Redo opens the sheet after the commit animation settles (deferred open, one cancelable
    token), Give up opens it at once, a relaunch with status won or gaveUp opens the Board in
    Game over with the sheet expanded and no animation (nav push at boot for its one entry, AD-13);
    the sheet shows title (`Every column cleared.` or `Game given up.` with `n letters left: −p`,
    `1 letter left: −10`; n and p come only from the view's `lettersLeft` and `penalty`, QU already
    counts 2), the final score after R-81, band name and message, longest word (`—` with none) and
    words placed; Replay this deal and Statistics buttons (New game stays the action bar primary;
    Replay from the sheet acts at once in a finished game); the grab handle, `Esc`, back and a
    scrim tap (the scrim covers the board between the bars) collapse it to its bar (the scrim tap
    is consumed), the bar expands it, expanding pushes and collapsing pops one history entry; the
    top bar and action bar stay above the scrim; a transition into Game over closes any open
    WordCell view first; Undo closes the sheet and resumes play (R-70, R-75), and Undo from Game
    over with the sheet collapsed sets it hidden with no history pop; focus moves to its first
    action on open and to the board (CAP-10) on collapse; history unreadable: the block (`Your
    score history can't be read.` + version sentence + `This game wasn't added to your
    statistics.` + Reset history) sits under the stat lines, and after Reset history it becomes the
    single `This game wasn't added to your statistics.` line, a later Undo removing nothing (§2);
    on a relaunch into Game over with an unreadable history the History notice shows on top of the
    pushed sheet entry (the Game-over reload case below);
    tests include a give-up with a QU left, a discriminating win smoke test (after a win by
    Confirm the end sheet shows the win title and the final score equals the pre-win score plus
    the committed delta; a give-up would show the penalty line) and the Game-over reload P6 case:
    relaunch into Game over with an unreadable history (`history-invalid-*` fixture); boot
    replaces the base entry with `{ wc: 0, launch: new }`, pushes the sheet entry (`wc: 1`) then
    the History notice (`wc: 2`, AD-16 boot order), so `history.state` is `{ wc: 2, launch: new }`
    with the notice on top of the expanded sheet; Reset history pushes the confirm (`wc: 3`); back
    closes the confirm (the notice stays), back again acts as `Not now` and closes the notice, back
    again collapses the sheet (`closedByBack` sets `collapsed`, never `hidden`; `wc: 0`), back
    from the bare Board leaves the app.

- **CAP-5** Winning guard, end-sheet half (AD-14, epic 5 SPEC F8, F23; EXPERIENCE.md Motion)
  - **intent:** A quick second tap after a win never skips the sheet or starts a new game.
  - **success:** the guard's pending end-sheet open is cancelled by Undo (`Z`, `Ctrl/Cmd+Z`, the
    button): the animation completes, then it undoes, and the sheet does not open; the guard
    recognises the Undo key aliases (`Z` and `Ctrl/Cmd+Z`, keydown/keyup and their repeats, only
    while Undo is enabled); the deferred open fires at max(animation settled, 300 ms after the guard is installed), so Undo-cancels-open and consumption hold for the whole guard window at every speed (EXPERIENCE.md Motion, epic 5 F8, F23); `Ctrl/Cmd+Shift+Z` (Redo) is consumed like any other input; every other
    input in the window completes the animation and is consumed, then the sheet opens (outcome
    table in `build-notes.md`); hiding the page does not kill the token (it completes at once and
    the sheet opens expanded on return, R-73); only boot or reload (boot opens the sheet, R-73) and
    `resetForNewSession` kill it; browser back cannot be consumed: it completes the animation,
    follows the normal back rule, and the sheet then opens; the deferred open waits for whatever animations are in flight
    (none: opens at once); a Redo win behaves like a Confirm win; the menu button case is proved;
    P6 Playwright for each case at Normal, Fast, Slow and under reduced motion, plus a Redo win
    followed at once by Undo, Undo between settle and 300 ms (no sheet), and the Fast and reduced-motion cases where the animation settles before 300 ms.

- **CAP-6** Statistics panel and history message (R-84, Q-33, Q-44, A-E3; AD-13; DESIGN.md Panels)
  - **intent:** A player can see how they have done, or why they cannot.
  - **success:** a full-screen panel (menu, end sheet) shows the 2 × 3 tiles games played, won,
    given up, best score and average score (both leave out given-up games with a negative score,
    R-84, Q-44; the engine's `statistics` output unchanged, the panel only formats; whole number;
    `—` when none qualify), longest word ever with its letter count (ties to the earliest), `—`
    where no value exists, and `Finish or give up a game to see statistics here.` under the tiles
    with no finished games; with the history unreadable it shows the History-unreadable message
    (version-sentence variants) and Reset history instead; one UI-layer derived getter over
    `scoreHistory` state feeds the menu dot (a small error-coloured dot on the ☰ button, `TopBar.svelte`,
    DESIGN.md Top bar, shown while the history is unreadable), this message and CAP-4's block; negative numbers use
    U+2212; Reset history opens the existing confirm: Delete history closes only the dialog and
    the surface stays open showing the clean state, Keep it closes only the dialog; the "statistics
    notice" rows are folded into the CAP-4/CAP-6 history tests; P6 includes a history with only
    negative given-up games; P6 two-overlay reload (AD-13): the Statistics panel open with
    Reset history's confirm on top, seeded from a `history-invalid-*` fixture (a menu item closes
    the menu first, so menu plus confirm never coexist); after reload the Board stays with its
    history, `history.state` is `{ wc: 0, launch: new }` once the History notice is answered (it is
    re-pushed at boot, AD-13), and back leaves the app.

- **CAP-7** Preferences panel and timer (R-76, spec §7.10, Q-36; DESIGN.md Panels, Top bar)
  - **intent:** A player can set animation speed and show the timer.
  - **success:** a panel with a three-way segmented Animation speed (Fast / Normal / Slow) and a
    Show timer switch (default off) writes through `prefs.svelte.ts`, applies at once, survives
    New game and Replay and is not undoable; the top bar shows the timer between score and Undo
    when on: `m:ss`, `h:mm:ss` from one hour (hours unpadded, no cap: 12:03:04), showing `activeMs + peek(now)` while playing and
    `activeMs` otherwise (AD-9); a UI interval runs only while Show timer is on and status is
    playing, and the display re-derives each second from AD-9; ticks never dispatch or write; the Game over freeze and relaunch tests use seeded won/gaveUp fixtures and do not depend on the end sheet; the top bar fits at 360 px with the timer shown, the R-82 score beside the timer and Undo/Redo with a negative score using U+2212;
    tests: formatter unit test at 0, 59 999 ms, 3 599 000 ms (59:59), 3 600 000 ms (1:00:00) and above 10 h, and a P6 with
    `page.clock` showing the stored `activeMs` after a relaunch into Game over and a tick writing
    nothing.

- **CAP-8** How to play panel (EXPERIENCE.md How to play panel)
  - **intent:** A new player can learn the game in the app.
  - **success:** the panel (menu, `?`) holds the eight sections in order, text rewritten from spec
    §3–§6 and §9 (no Cancel, no hints, Q-12 empty-column rule), rating-band names from
    `text.ts`, the §8 worked example (BAKED, BALKED, FAKED, FLAKED) drawn with the real card
    component as static non-interactive images (`aria-hidden`, no `data-card-id` or `data-testid`,
    not live elements, AD-14 mirror-style), and the controls section with the touch, mouse
    and keyboard tables; every string in `text.ts`; the owner reads the text at ticket review.

- **CAP-9** Pending-draft line (R-72, A-E13; EXPERIENCE.md State Patterns)
  - **intent:** After Undo to Idle the player knows Redo brings the word back.
  - **success:** in Idle with a pending draft the tray band shows `Undone: BAKED · Redo brings it
    back` in ink-secondary (word uppercase, `QU` as `QU`), from `GameView` `pendingDraftWord` only;
    absent with no draft, in other phases and after a new edit discards the redo tail; P6
    Playwright on Flow 3 steps 3–5.

- **CAP-10** Keyboard map and focus (Q-24, A-E7, F39; EXPERIENCE.md Keyboard)
  - **intent:** The whole game plays from the keyboard on desktop.
  - **success:** one key handler in `src/ui/` (mounted from `main.ts`; the shell never imports ui)
    implements the EXPERIENCE.md key table exactly (`1`–`8`, `↑`/`↓`, `3`–`9`/`0`, `←`/`→`,
    `Shift`+arrows, `Space`, `Enter`, `+`/`=`/`-`, `F`, `Z`/`Y`/`Ctrl`/`Cmd` aliases with
    `Ctrl/Cmd+Shift+Z` first, `Esc`, `M`, `N`, `?`), matching `event.key`; the enablement gate
    applies to keys that mirror a button (Undo, Redo, Validate, Confirm, `+`, `-`, Flip, `M`),
    other keys gate by the table's phase column from `GameView`, and precondition steps run only
    when the shortcut acts; every key command cancels a drag (`act()`) and closes a sticky view
    first; overlay-opening keys, Undo and Redo clear a tail selection and pop its entry (board keys
    follow the table: `1`–`8` and `↑`/`↓` keep the selection per the table), any pop completing
    before a following push; long-press and hover peeks close only for keys that change phase or
    word data (F39: Undo, Redo, menu and keys no longer make `overlays.deselect()` throw); every
    key command that changes the phase clears the tile selection at the source
    (`overlays.clearTile`), `tileTap`'s stale-selection throw stays, and both are tested
    separately; with no active Session (the rejected root) only `N` (acts at once) and `Esc` are live and `M`, `?`, `Z`, `Y` do nothing, and in Halted no key acts; with any menu, panel or dialog open only Tab, Enter, Space (native) and `Esc` act
    (`M`, `N`, `?`, `Z` are no-ops there); with the end sheet or a WordCell view open they stay
    active (`M`, `N`, `?`, `Z`, `Y` act; board keys no-op because the controls are disabled in Game
    over; `Esc` collapses the sheet); `Esc` closes the topmost overlay, else clears the selection,
    in Game over collapses the sheet; focus order top bar → columns → tray → WordCells → action
    bar; `Space`/`Enter` activate a focused tile (select, swap, return; epic 5 plan deferral);
    focus follows the phase (first movable tile, first strip card, the board (EXPERIENCE.md Focus),
    the end sheet's first action, the moved tile after `Shift`+arrow, the new tile after a key add,
    the next tile after a key removal, the tail's top card after a key selection); desktop buttons
    carry the key in their tooltip; visible focus ring `{colors.accent-teal}`; I-68's Escape case:
    `Esc` closes the topmost surface, never reopens or inverts; P6 Flow 6 on `desktop`; per-key
    detail in `build-notes.md`.

- **CAP-11** Screen-reader labels and live region (A-E9; EXPERIENCE.md Accessibility Floor)
  - **intent:** A screen-reader user can tell what each control and card is and what just happened.
  - **success:** every card button is named by letter, place and state (`E, column 1, card 2 of
    5, selected`), WordCells by number, top card, count and state (`WordCell 6, top L, 4 cards,
    used`), `QU` read `Q U, counts as two letters`, the `WordCellRow` aria-label moves into
    `text.ts`, the `−`, `+` and `Flip` names follow epic 5 F9; one polite live region in the UI
    announces phase changes (`Composing. BAKED, 5 letters.`), the invalid-word message, commits
    (`BALKED placed on cell 6, plus 30`; spoken `plus`, `minus`, `no change`) and the end outcome
    (the just-committed signal comes from the dispatch call site: the UI announces after the
    dispatch of Confirm, or of a Redo that commits, returns; the word, cell and delta come from
    the committed move's view, `cells` and `scoreDelta`, not a `GameView` field; a winning Confirm announces the commit at commit time and the outcome when the sheet opens,
    replacing the commit text); announcements replace, never queue; the full string and trigger list is in `build-notes.md`;
    UI Vitest `AD-3` on the strings, P6 Playwright on the accessible names and live-region text;
    full screen-reader play is not a test target.

- **CAP-12** Carry-ins and close-out (epic 4 retrospective A8; AD-13)
  - **intent:** The deferred gesture and navigation gaps close and the epic leaves a clean base.
  - **success:** after a wheel scroll during a mouse drag the faces, highlight and drop target
    follow the pointer (controller test and desktop P6); a hover-peek re-anchor test asserts the
    peek stays anchored above the hovered cell after layout shifts; the hide-flush
    `controller.cancel()` after a bfcache restore is reproduced first, then fixed only if it
    swallows a real back (done: a reproducing test whose failure is then fixed, or a recorded
    non-reproduction attempt in `build-notes.md`); the refactor sweep and paperwork ticket (as
    epic 5's CAP-11, CAP-12) lists the close-out edits; every `rule-coverage.md` P6 row maps to a
    passing test.

## Constraints

- Thin renderer (AD-3): panels, the end sheet, the menu dot, the pending-draft line and the live
  region read `GameView`, `scoreHistory`, `prefs` and overlay state; no component derives score,
  band, statistics, enablement or the draft word.
- One writer (AD-4): every game action reaches the engine through `game.dispatch`, `newGame` or
  `replay`; Give up is a `dispatch`; UI no-ops are the UI not dispatching, gated by a `GameView`
  flag; an engine throw is a bug.
- Overlay state only in `overlays.svelte.ts`; History API only in `nav.ts`; `wordcell:prefs` only
  through `prefs.svelte.ts`; `wordcell:history` only through `reconcile`/`reset`; every
  EXPERIENCE.md catalogue string only in `text.ts`; WAAPI durations only from `motion.ts`, CSS
  transitions on `--wc-base-ms`; every App button through `act()` except Halted's Reload.
- Hand-rolled gestures (rule 4, AD-12) and AD-14 (one live element per card, mirrors, the winning
  guard) hold; sheets and panels never move a hit rect under a finger (AD-11).
- Fail fast (rule 6): no try/catch in the UI; stored-data fallbacks only as specified (Q-36).
- Every target ≥ 44 × 44 px; panels, sheets and dialogs scale with the browser font size, board
  text stays fixed px (A-D9).
- No engine change; shell additions limited to what AD-9/AD-13 already provide; the unreadable-history
  flag is a UI-layer derived getter over `scoreHistory` state (and `scoreHistory.statistics`), the
  key handler is UI; the only other non-UI source additions are the `__APP_VERSION__` Vite `define`
  and `src/app-version.d.ts` (vite.config.ts checked against Scaffold deltas); R-02 golden deal
  literals stay byte-identical; no new runtime dependency; the size budget (AD-18, 600,000 bytes)
  holds.
- Test split (AD-17): every `rule-coverage.md` P6 row has a passing `android` Playwright test named
  with its id (`desktop` for keyboard and hover rows); UI Vitest tests are `AD-n` and never R-id
  coverage; the unit suite stays under budget on the Linux filesystem.
- Every ticket's checks include `npm run test:screens` in the container; baselines are regenerated
  inside the container as part of the ticket and a ticket stops if the container cannot run; each
  CAP's ticket lists the screens specs it adds (default list in `build-notes.md`); a ticket that changes
  an input to a shared rule lists that rule's other consumers in its ticket review (epic 5
  retrospective L1, L3).

## Non-goals

- Epic 7: service worker, update policy, `swState()`, `precacheComplete()`, `requestPersistence()`,
  device checks (including CAP-9 anchor `scrollTop` during an Android fling), Q-42's proof, B9
  dispatch replay cost, and the A9 rows routed there.
- Cloud sync, accounts, sharing, sound (Q-20), hints (Q-19), Cancel (Q-01), tutorials or onboarding.
- Reopening any AD, rule, R-02 literal or DESIGN.md/EXPERIENCE.md decision; any engine change.

## Success signal

On `android`, from a fresh launch: play a word, win or Give up from the menu, see the end sheet
with the right score, band and statistics, open Statistics, collapse and expand the sheet, tap
New game and see Statistics games played one higher and the new deal's Board; set Show timer in Preferences and see it run; open How to
play; reload with the sheet expanded and land on the Board in Game over with the sheet expanded and no animation. On `desktop`, EXPERIENCE.md Flow 6 plays a
full move by keyboard alone. `npm run test:all` and `npm run test:screens` are green with every
P6 row of `rule-coverage.md` covered.

## Assumptions

- `GameView` already has `band`, `finalScore`, `penalty`, `lettersLeft`, `longestWord`,
  `pendingDraftWord` and `inProgress`; CAP-11's just-committed signal comes from the dispatch call site, with word, cell and delta read from the committed move's view (a ticket stops and reports if a needed field is missing); statistics comes from `scoreHistory.statistics` (a getter, `Statistics |
  undefined`); if a field is missing a ticket stops and reports it rather than re-deriving it in
  the UI.
- Epic 5's overlays, nav, history-notice and winning-guard code are the base; this epic wires them,
  not rebuilds them.
- The hide-flush bfcache back (A8) may not reproduce; then CAP-12 records it as not a bug.

## Open Questions

None. EXPERIENCE.md and DESIGN.md already decide every visible behaviour of this epic.

## Decisions

Technical defaults under the owner's standing rule; none changes functionality, UX or gameplay.
Next owner answer takes F6.

| # | Question | Decision |
| --- | --- | --- |
| F1 | R4 sequencing. | R4 landed (`newGame()` in `src/ui/new-game.ts`); new entry points only add callers, with a test that no other site repeats the sequence. |
| F2 | Merge and deploy. | Like epics 1–5: merge and deploy when the owner gives the go-ahead; the agent never pushes. |
| F3 | How to play text. | The CAP-8 ticket drafts it from the spec; the owner reads it at ticket review (EXPERIENCE.md: text is a build deliverable). |
| F4 | Unreadable-history indicator. | One UI-layer derived getter over `scoreHistory` feeds the menu dot, the Statistics message and the end-sheet block (CAP-6). |
| F5 | Sheets and `inert`. | The Board is `inert` under a modal surface as the History notice already does (AD-13); the end sheet leaves the top and action bars live (EXPERIENCE.md End sheet); the per-surface table is in `build-notes.md`. |
