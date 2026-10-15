---
title: 'End sheet: result, collapse, Give up and relaunch'
type: 'feature'
ticket: '6'
created: '2026-10-15'
status: done
baseline_revision: '889ca3679ae481c001112fa52596496c26c9e8d3'
route: 'full'
route_source: 'auto'
review: 'thorough'
review_source: 'auto'
lenses_ran: [blind-hunter, edge-case-hunter, verification-gap, intent-alignment]
review_loop_iteration: 0
followup_review_recommended: false
context:
  - '{project-root}/_bmad-output/specs/spec-epic-6-surfaces/SPEC.md'
  - '{project-root}/_bmad-output/specs/spec-epic-6-surfaces/build-notes.md'
  - '{project-root}/_bmad-output/specs/spec-epic-6-surfaces/rule-coverage.md'
  - '{project-root}/_bmad-output/initiative-wordcell-v1/epic-game-surfaces-and-keyboard/story-end-sheet-result-collapse-give-up-and-relaunch.md'
  - '{project-root}/_bmad-output/initiative-wordcell-v1/epic-game-surfaces-and-keyboard/story-end-sheet-result-collapse-give-up-and-relaunch.review-log.md'
warnings: ['oversized']
deferred: []
---

<intent-contract>

## Intent

**Problem:** A finished game shows no result: `DispatchResult` `finished`/`unfinished` reaches no overlay, there is no end sheet, a Give up from the menu leaves the Board unchanged, and a relaunch into won or gaveUp opens a bare Game over.

**Approach:** Implement the ticket file as written (`story-end-sheet-result-collapse-give-up-and-relaunch.md`; its Description and Acceptance Criteria are the contract). Also resolve the review-log § Pass 4 items. (1) `history.state` notation: `launch: new` stands for the launch id nav stamps (a number, `NavState.launch`); write the three values consistently as `{ wc: 1, launch: new }` after boot, `{ wc: 0, launch: new }` after collapse and `{ wc: 1, launch: new }` after re-expand in every comment, test name and note, and assert `launch` equal to the base entry's own. (2) The five plan-level stretch items are decided in the I/O matrix and the Execution list below (getAnimations timing and first paint; Give up with a sticky view open; Statistics over the sheet; longest-word tie; focus after Undo of a Give up).

## Boundaries & Constraints

**Always:** Rules 1–7 of AGENTS.md; the spec wins over the spine. Every EXPERIENCE.md string only in `src/ui/text.ts`. n, p, score, band, longest word, words placed only from `GameView` (AD-3: `lettersLeft`, `penalty`, `finalScore`, `band`, `longestWord`, `wordCount`); no threshold logic in the UI. Every App-owned button wrapped in `act()`. The sheet's entry goes through `overlays` only (AD-13); New game, Replay and Statistics from a shown sheet follow AD-13 (`resetForNewSession()`, `openSurface('statistics')`). Duration only from `motion.ts`, CSS transitions on `--wc-base-ms`. No new `data-testid`; locate by role and name. Test names start with the id.

**Never:** The history-unreadable block, Reset history and the Game-over reload with `history-invalid-*` (entry 7); Undo-cancel, the 300 ms floor and consumed guard-window inputs (entry 12; the deferred open here fires at animation settle); the keymap (entry 10); engine changes (the band function and its boundary tests already exist, add only a missing one); `SESSION_VERSION`, deal or store-API changes; a second store.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Win by Confirm | one-move-from-won fixture (scripted), Confirm | token deferred; sheet expanded after the fly-to-cell settles; win title, final score = pre-win score + committed delta, no penalty line | token callback re-checks `game.view.status === 'won'`, else pushes nothing |
| Win by Redo | undone winning Confirm, Redo | same as Confirm | same |
| Give up | menu Give up (Idle, playing) | sheet expanded at once; `Game given up.`, `n letters left: −p`, `1 letter left: −10` for one, a lone QU counts 2 (plural) | none |
| Give up with a sticky view open | unreachable from the menu: `openSurface('menu')` closes the sticky view first; Redo to a win with a view open: `openDeferred` pops the view, then pushes | the view is closed before the sheet opens; one push | unit test of the wiring, no new Playwright route |
| Relaunch won / gaveUp | `session-won`, `session-gave-up` | boot replaces the base with `{ wc: 0, launch: new }`, pushes the entry: `{ wc: 1, launch: new }`; sheet expanded, opacity 1 at its first painted frame, `document.getAnimations()` empty once visible (an init-script rAF probe records the first frame the sheet element exists and reads its computed opacity and transform) | none |
| Collapse | grab handle, Esc, scrim tap (consumed: nothing beneath acts), back | `closedByBack` or `close` → collapsed, one pop, `{ wc: 0, launch: new }`; focus on the board (bottom card of the lowest-numbered non-empty column, else the focusable board container) | none |
| Expand | tap the 56 px bar | one push, `{ wc: 1, launch: new }`; focus on Replay this deal | none |
| New game / Replay | from expanded or collapsed sheet | store call then `resetForNewSession()`; sheet hidden, no entry left, collapsed pops nothing | none |
| Statistics over the sheet | Statistics button | `openSurface('statistics')`, wc 2; Esc and back close only the panel, back to the expanded sheet; top bar inert under the panel (F6) so no Undo there | none |
| Undo | expanded: pops its entry, popstate completes, then hidden; collapsed: hidden, no pop; a give-up at index 0 included | play resumes; focus on the board; Redo after an undone Give up does not reopen; Redo to a win reopens | none |
| Longest word | two words of equal length / none committed | the earliest committed word / `—`; QU as `QU`, uppercase | none |

</intent-contract>

## Code Map

- `src/ui/overlays.svelte.ts` -- already has `endSheet` state, `expandEndSheet`, `collapseEndSheet`, `onUnfinished`, `deferEndSheetOpen`, `openDeferred`, `cancelEndSheetOpen`; `openDeferred` pops a sticky view before pushing. Reuse, extend only if a gap shows; `resetForNewSession` kills the token.
- `src/ui/flip.ts` -- instance `play(command, result)` runs after every `game.dispatch` call site except the menu's; installs the guard and calls `notifySettled` (also from `settle`). The place to hand `result` to the end-sheet wiring and to run settle callbacks.
- `src/ui/motion.ts` -- winning guard (entry 12 owns Undo-cancel and the 300 ms floor): do not change.
- `src/ui/Menu.svelte:53` -- `giveUp()` dispatches without `play`; hand its result to the same wiring.
- `src/ui/Sheet.svelte`, `presence.svelte.ts`, `Dialog.svelte` -- the pattern for transitions on `--wc-base-ms`, reduced-motion fade, focus; the end sheet has no close button and no full-viewport layer (scrim only between the bars, bars at 44 px + inset top, 60 px + inset bottom, z-index 2).
- `src/ui/Tray.svelte` -- Game over tray band is empty at its reserved height: host of the collapsed 56 px bar at the band's bottom edge (directly above the WordCell labels), no scrim.
- `src/ui/App.svelte`, `src/main.ts` -- mount beside `<Menu>`; boot opens the sheet after `nav.register` and before `openHistoryNotice()` (sheet entry first, AD-16).
- `src/ui/new-game.ts`, `open-surface.ts`, `act.ts`, `text.ts` -- `newGame()`, `replayDeal()`, `openSurface('statistics')`, `act()`, and the home for the outcome, penalty, band and label strings.
- `src/engine/view.ts`, `scoring.ts` -- `GameView` fields; `band` 0–5 and its tests (`src/engine/scoring.test.ts`) exist.
- `e2e/helpers/dialogs.ts` (`wc`), `e2e/helpers/seed.ts`, `fixtures/session-won.json`, `session-gave-up.json`, `history-tie-longest-word.json`; `e2e/menu.spec.ts` and `e2e/win-guard.spec.ts` for conventions.

## Tasks & Acceptance

**Execution:**
- [ ] `src/ui/end-sheet.ts` (new) -- `onDispatched(result, whenSettled)`: `finished: 'won'` → `deferEndSheetOpen()` and, when the animation settles, a callback that opens only if `game.view?.status === 'won'` (`openDeferred(token)`); `finished: 'gaveUp'` → defer and open at once; `unfinished` → `overlays.onUnfinished()`. `openAtBoot()`: status won/gaveUp → defer and open with the boot-instant flag. Pure functions over `overlays` and `game`, each with a unit test (token callback with the store non-won pushes nothing).
- [ ] `src/ui/flip.ts`, `src/ui/Menu.svelte`, `src/main.ts` -- call it: flip `play` after `install` with a settle-callback list drained beside every `notifySettled`; Menu `giveUp` with its result; `main.ts` `openAtBoot()` before `openHistoryNotice()`.
- [ ] `src/ui/EndSheet.svelte` (new), `src/ui/Tray.svelte`, `src/ui/App.svelte` -- expanded sheet: grab handle (button, collapses), title, penalty line after the stat lines for Give up only, score (end-score), band name and message, longest word and words placed, Replay this deal (focused on open, relaunch included) and Statistics; scrim between the bars consumes its tap and collapses; Esc collapses (only when the sheet is the top entry); collapsed bar (score and band) in the Tray's Game over band expands on tap. Focus to the board on collapse and after Undo. 1 × base transition, reduced-motion fade, none on the boot open. The top bar and action bar stay live (`main` is not inert).
- [ ] `src/ui/text.ts` -- outcome titles, `n letters left: −p` with the singular, six band names and messages (EXPERIENCE.md Rating bands), labels, handle and bar names; `text.test.ts` cases (QU, U+2212, plural/singular).
- [ ] Fixtures and Playwright (`e2e/end-sheet.spec.ts`, `e2e/end-sheet.screens.spec.ts`, helpers) -- script the one-move-from-won fixture (regeneration rule) and any missing band or QU-left fixture; cover every case of the ticket's Verify plus the matrix rows above; screenshots for the expanded and collapsed sheet at 360 px.
- [ ] Unit tests: AD-13 end-sheet entry cases for the wiring, the band → text mapping per band (a view-level test for Perfect Deck 530 if no replay-valid fixture reaches it), the longest-word tie (earliest) and `—`.

**Acceptance Criteria:**
- Given a one-move-from-won game, when Confirm lands, then the sheet shows the win title after the glide and the final score equals the pre-win score plus the committed delta.
- Given Give up from the menu, then the sheet is expanded at once with the penalty line; with a QU left n counts it twice.
- Given a relaunch into won or gaveUp, then the sheet is expanded with no animation, `{ wc: 1, launch: new }`, focus on Replay this deal.
- Given an expanded sheet, when the handle, Esc, a scrim tap or back collapses it, then `{ wc: 0, launch: new }`, the board is live, WordCells open their view; the bar re-expands to `{ wc: 1, launch: new }`.
- Given Undo from the expanded or collapsed sheet, then play resumes with the sheet hidden and the history entry count right; Redo after an undone Give up leaves it hidden.
- Given New game or Replay from either state, then the sheet is hidden and `history.state` is the base entry's.

## Implementation Notes

## Plan Change Log

## Review Triage Log

### 2026-10-15 — Review pass
- verdicts: 15 findings — high 0, medium 3, low 4, false 3, maybe-false 0 (5 further blind-hunter items folded into the rows below)
- findings:
  - `[false]` `[reject]` Redo of an undone Give up reopens the sheet (edge-case) — a give-up is flag-only (`giveUp` sets the flag, `redoAvailable` needs redo data), so Redo never yields `gaveUp`; the e2e test's conditional click was the real weakness.
  - `[medium]` `[patch]` Redo test guarded by `if (redo.isEnabled())` passes vacuously (blind, edge, gap) — now asserts Redo disabled.
  - `[medium]` `[patch]` `?? 0` defaults for finalScore, band, lettersLeft, penalty hide missing view fields (rule 6) — `field()` throws `AD-3 …`.
  - `[medium]` `[patch]` no test of flip's settle-callback drain (verification-gap) — two flip.test.ts cases added.
  - `[low]` `[patch]` misplaced 6.6 comment and stale "sixteen" in serialize.test.ts; text.test.ts title claims a QU case it lacks (renamed; QU covered in Playwright).
  - `[low]` `[defer]` boot order sheet-then-notice has no visibility assertion (gap) — wc assertions cover the entries; one assertion can be added later.
  - `[false]` `[reject]` Menu `skipFocus` set unconditionally — Give up is disabled unless `canGiveUp`, so the dispatch always finishes.
  - `[low]` `[reject]` settleCallbacks leak on cancel — `finishAll()` settles every animation and drains; Undo-cancel is entry 12's.
  - `[low]` `[reject]` bar `touch-action: none`, hard-coded 44/60 px bar insets, stale `shown` snapshot, `instant` flag, duplicated minus logic, openFixture race, fixture trailing newline — cosmetic or not reachable, fix costs more than the harm.
  - `[low]` `[reject]` labels "Collapse result", "Show result: …", "Longest word", "Words placed" not in the catalogue (blind, intent) — recorded for the owner in the result, not changed.
  - `[false]` `[reject]` intent-alignment divergences (bar in the Tray band, Replay via the store gate) — EXPERIENCE.md End sheet row states the bar's place; Replay acts at once in a finished game via `requestReplay`.

## Design Notes

The settle callback is ticket 6.6's interim: it fires when the winning animation settles; entry 12 moves the fire time to max(settled, 300 ms after install) and adds Undo-cancel through `cancelEndSheetOpen`. Do not wait on `motion.ts`'s guard state here. `launch: new` is notation only: `history.state.launch` is nav's number.

## Verification

**Commands:**
- `npm run test:all` -- expected: green
- `npm run test:screens` -- expected: green (Docker, baselines for the new screens specs generated inside the container)

**Manual checks (if no CLI):**
- The 56 px collapsed bar sits directly above the WordCell labels and leaves every WordCell tappable.

## Auto Run Result

**Summary:** The end sheet is wired and built: `src/ui/end-sheet.ts` turns `finished`/`unfinished` into overlay state (win opens at animation settle after a store re-check, Give up at once, Undo hides, boot opens before the History notice); `EndSheet.svelte` and the collapsed bar in `Tray.svelte` show the result and collapse and expand with one history entry.

**Ticket review-log items:** (1) `launch: new` written consistently; tests compare `launch` with the base entry's value. (2) getAnimations and first paint: init-script probe in the relaunch spec; Give up with a sticky view: unreachable from the menu, `openDeferred` pops the view (unit test); Statistics over the sheet: e2e; tie: engine R-84 test covers it, no new session fixture; focus after Undo: `focusBoard`, tested.

**Files changed:** `src/ui/end-sheet.ts`, `EndSheet.svelte`, `focus-board.ts` (new); `flip.ts`, `Menu.svelte`, `Tray.svelte`, `App.svelte`, `main.ts`, `text.ts` (wiring and strings); `fixtures/session-one-letter-left.json`; unit tests (`end-sheet.test.ts`, `flip.test.ts`, `text.test.ts`, serialize and architecture lists); e2e `end-sheet.spec.ts`, `end-sheet.screens.spec.ts` with baselines; existing specs adjusted for the sheet now opening on relaunch.

**Review:** patches applied 5 (3 medium, 2 low); deferred 1; rejected the rest as logged. Follow-up review: not recommended.

**Verification:** `npm run test:all` green (rerun after patches); `npm run test:screens` green (first run, baselines generated in the container).

**Residual risks / owner:** strings not in the EXPERIENCE.md catalogue need the owner's wording ("Collapse result", "Show result: score, band", "Longest word", "Words placed"); the Confirm-win test uses `session-won` plus one Undo rather than a new one-move-from-won fixture; Perfect Deck 530 and the longest-word tie rest on existing engine tests; entry 12 owns Undo-cancel.
