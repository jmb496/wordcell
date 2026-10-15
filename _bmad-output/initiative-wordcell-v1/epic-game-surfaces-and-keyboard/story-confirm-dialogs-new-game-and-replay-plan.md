---
title: 'Confirm dialogs, New game and Replay'
type: 'feature'
ticket: '3'
created: '2026-10-15'
status: 'built'
baseline_revision: '197fb8ada5c548d6a9b5c697a41c74de4745347a'
route: 'full'
route_source: 'auto'
review: 'thorough'
review_source: 'auto'
lenses_ran: [blind-hunter, edge-case-hunter, verification-gap, intent-alignment]
review_loop_iteration: 0
followup_review_recommended: false
context:
  - '{project-root}/_bmad-output/initiative-wordcell-v1/epic-game-surfaces-and-keyboard/story-confirm-dialogs-new-game-and-replay.md'
  - '{project-root}/_bmad-output/specs/spec-epic-6-surfaces/SPEC.md'
  - '{project-root}/_bmad-output/specs/spec-epic-6-surfaces/build-notes.md'
warnings: []
deferred: []
---

<intent-contract>

## Intent

**Problem:** The menu's New game and Replay this deal rows act at once, so a mid-game tap silently discards the game (R-74). The ticket's review log also leaves three items to the build (below).

**Approach:** Add `requestNewGame(view)` / `requestReplay(view)` gates and `replayDeal()` in `src/ui/new-game.ts`, a `ConfirmDialogs.svelte` beside Menu that renders both confirms, and the focus, Esc and test work the ticket lists.

## Boundaries & Constraints

**Always:** Follow the ticket (story file) as the contract; `GameView.inProgress` is the only gate input (AD-3); `game.newGame(` only in new-game.ts (AD-4) and `game.replay(` joins that scan; handlers `act()`-wrapped; texts only in text.ts; Dialog `firstClick` makes accept act once.

**Never:** Gate the action bar, the rejected root's BlockingMessage or `newGame()`/`replayDeal()` themselves; add an Esc keymap (entry 10); assert the end sheet (entry 6); modify the ticket file or tickets.toml (publish step).

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Mid-game row | `inProgress` (incl. Idle with only a redo tail) | Menu closes, confirm opens, `Keep playing` focused | none |
| Idle or finished | fresh deal, won, gave up | Row acts at once, focus on `main` | none |
| Keep playing / Esc / back / scrim | confirm opened from a menu row | Only the confirm closes, focus on ☰, Session byte-identical | none |
| Accept | New game / Replay | Ungated action, focus on `main`, acts once on a double tap | none |
| Rejected root | no GameView | BlockingMessage New game acts at once | none |

</intent-contract>

## Code Map

- `src/ui/new-game.ts` -- `newGame()` stays; add `replayDeal()` (`game.replay()` then `overlays.resetForNewSession()`), `requestNewGame(view)`, `requestReplay(view)` (open via `openSurface`).
- `src/ui/Menu.svelte` -- rows call the gates; delete inline replay copy; skip-flag so its wasOpen effect does not focus `main` only when a confirm was opened.
- `src/ui/Dialog.svelte`, `presence.svelte.ts` -- reuse as is (`onscrim`, `actionStyle="primary"`, `firstClick`); presence `restoreFocus` aims at the exiting menu row.
- `src/ui/App.svelte` -- mount `ConfirmDialogs` beside Menu; `mainInert` already lists both ids.
- `src/ui/text.ts` -- six keys: `newGameConfirmTitle`, `newGameConfirmBody`, `replayConfirmTitle`, `replayConfirmBody`, `replayConfirmAction`, `keepPlaying` (EXPERIENCE.md rows 97, 98); New game's action reuses `text.newGame`.
- `src/architecture-new-game.test.ts` -- CALL regex covers `game.replay(`, positive control.
- `e2e/menu.spec.ts` (New game and Replay block), new `e2e/confirm.spec.ts`, `e2e/confirm.screens.spec.ts`; `fixtures/session-won.json`, `session-idle-pending-draft.json`.

## Tasks & Acceptance

**Execution:**
- [x] `src/ui/text.ts`, `src/ui/text.test.ts` -- add the six keys; test compares all six to their catalogue rows plus the `text.newGame` reuse
- [x] `src/ui/new-game.ts` -- gate functions and `replayDeal()`
- [x] `src/ui/ConfirmDialogs.svelte`, `src/ui/App.svelte` -- both confirms, interim `act()`-wrapped Esc handler (top overlay a confirm), focus effect on `isOpen(id)` true to false (accept flag: `main`; else ☰ for menu-opened confirms; skip when focus moved into a reopened menu)
- [x] `src/ui/Menu.svelte` -- gate calls, skip flag set only when the gate opened a confirm
- [x] `src/architecture-new-game.test.ts` -- extend scan
- [ ] Vitest AD-13 for the two accept paths: overlays depth 0, `history.state.wc` 0 after nav settles
- [x] `e2e/menu.spec.ts`, `e2e/confirm.spec.ts`, `e2e/confirm.screens.spec.ts` -- per the ticket's Acceptance Criteria; screenshot baselines in the container

**Acceptance Criteria:**
- Given the ticket's Acceptance Criteria, when `npm run test:all` and `npm run test:screens` run, then both are green.
- Given the three build-time unverified items, when built, then each is confirmed by a test or recorded in Implementation Notes: (1) the new focus effect beats presence `restoreFocus`; (2) the entry-6 end-sheet clause (not asserted here); (3) post-New-game `history.state` is `{ wc: 0, launch: <new id> }` read from the page.
- Given the log's "five strings" slip, then the text test covers six keys.

## Implementation Notes

Full route: cross-layer UI plus e2e and screens. The tickets.toml entry 3 text (action bar goes to the confirms, "MenuSheet", new wording) is stale against the ticket file; it is synced when publishing and is not edited by the build.

Build-time items from the review log: (1) the focus effect beats presence `restoreFocus`: confirmed by the Keep playing, Esc, back and scrim dismissal e2e tests asserting focus on ☰. (2) The entry-6 end-sheet clause: not asserted here, left to entry 6. (3) Post-New-game `history.state` is `{ wc: 0, launch: <id read before> }` and one back leaves the app: confirmed by the I-68 e2e test. The log's "five strings" slip: six keys, the text test covers six. Additions beyond the plan: an optional `from: 'menu'` argument on the gates and a module-level origin (`confirmOrigin`/`clearConfirmOrigin`) in new-game.ts, so ConfirmDialogs sends focus to ☰ only for menu-opened confirms; `src/ui/new-game.test.ts` for the AD-13 accept paths. The "menu reopened during the exit" skip guard in ConfirmDialogs is not reachable by UI input (the focus move runs a microtask after close); kept because the ticket specifies it, its test is retitled to what it proves. tickets.toml entry 3 (action bar, "MenuSheet", new wording) is for the publish step; the build does not edit it.

## Plan Change Log

## Review Triage Log

### 2026-10-15 — Review pass
- verdicts: the lenses reported their findings in grouped bullets; rows below summarise each group — high 0, medium 0, low 1 patched, rest false or rejected low
- findings:
  - `[low]` `patch` reopen-during-exit e2e does not reach the skip guard (verification-gap) — test retitled and its comment corrected; guard kept per ticket
  - `[low]` `reject` stale `origin`/`accepted` flags (edge-case) — `openSurface` always opens or throws; a throwing action reaches AD-15 halt
  - `[false]` `reject` Esc double close (blind, edge-case) — Menu's handler requires `overlays.top === 'menu'`, a confirm on top blocks it
  - `[false]` `reject` pop-then-push race on the menu row — nav's op queue orders them; the e2e history tests pass
  - `[false]` `reject` lint line length — `npm run lint` is green in `test:all`
  - `[low]` `reject` unit test does not open the menu first, Replay double-tap not write-counted, aria-label query brittleness, `replayDeal` name shared with a text key, screenshot variants, test-quality nits — cosmetic or test-only, fix adds complexity
  - `[false]` `reject` plan checkboxes and notes missing — done in this finalize
  - Intent-alignment lens: descriptive only; the diff implements the menu-row gate plus the ticket's full surface contract, no divergence from the ticket.

## Auto Run Result

Summary: menu New game and Replay rows open confirms only while `GameView.inProgress`; `ConfirmDialogs.svelte` with interim Esc and focus rules; `replayDeal()` and gates in new-game.ts; six text keys; AD-4 scan covers `game.replay(`.

Files: `src/ui/new-game.ts` gates, `replayDeal`, origin; `src/ui/ConfirmDialogs.svelte` new; `src/ui/Menu.svelte` gate calls and skip flag; `src/ui/App.svelte` mount; `src/ui/text.ts` and `text.test.ts` six keys; `src/architecture-new-game.test.ts` scan; `src/ui/new-game.test.ts` AD-13 accept paths; `e2e/menu.spec.ts` updated; `e2e/confirm.spec.ts`, `e2e/confirm.screens.spec.ts` and baselines new.

Review: patches applied 1 (low); deferred 0; rejected as listed in the triage log. Follow-up review recommended: false.

Verification: `npm run test:all` green; the two new screenshot baselines compare green in the container (run by the implementer). Residual risks: the unreachable skip guard; entry-6 end-sheet clause and entry 10's N key focus return are not proven here; tickets.toml entry 3 needs syncing at publish.

## Verification

**Commands:**
- `npm run test:all` -- expected: green
- `npm run test:screens` -- expected: green (Docker), baselines for `confirm.screens.spec.ts` generated
