---
title: 'Keyboard: overlay keys, F39 and stale tile selection'
type: 'feature'
ticket: '10'
created: '2026-10-15'
status: 'built'
route: 'full'
route_source: 'auto'
review: 'thorough'
review_source: 'auto'
lenses_ran: [blind-hunter, edge-case-hunter, verification-gap, intent-alignment]
review_loop_iteration: 0
followup_review_recommended: false
context: []
warnings: []
deferred: []
baseline_revision: '50b9d38b83fda66862680d7a84f78a347ecc9d56'
---

<intent-contract>

## Intent

**Problem:** Desktop players have no keys for the menu, New game, How to play, Esc, Undo or Redo; Undo and Redo with a sticky WordCell view open or a peek open can reach `overlays.deselect()` in a state it throws on (F39); the interim per-component Esc handlers give Esc several paths.

**Approach:** One key handler in `src/ui/` mounted from `src/main.ts` implements the overlay and undo keys (`M`, `N`, `?`, `Esc`, `Z`, `Y` and the Ctrl/Cmd aliases) behind the enablement gate, replaces the interim Esc handlers, and shares the dispatching commands with the buttons. The board keys, focus order and tooltips stay with ticket 6.11 and plug into the same rows.

## Boundaries & Constraints

**Always:** Ticket 6.10's Description and Acceptance Criteria (`story-keyboard-overlay-keys-f39-and-stale-tile-selection.md`) and SPEC CAP-10 are the contract. A key that does not act does nothing at all (no act(), no view or peek close, no selection change, no preventDefault). Acting keys (Undo, Redo, M, N, ?) wait for a pending pop and are evaluated after it completes on the then-current GameView and overlay state; every other key, Esc included, is dropped while a pop is pending. Only the Z/Y aliases take Ctrl/Cmd; other Ctrl/Cmd/Alt chords are ignored, not default-prevented. Single-shot keys (M, N, ?, Esc, Validate, Confirm, Flip) ignore repeats; held Z/Y repeat and act. The interim `main` tabindex stays until 6.11.

**Never:** Board keys (1-8, arrows, 3-9/0, +/-, F, Space/Enter tile activation), focus order, focus-follows-phase, tooltips (6.11). No new screens specs. No changes to the engine or the Session schema.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Open surface | M, N (game in progress), ? on the Board, end sheet or sticky view | Menu, New game confirm, How to play open through `openSurface`; view and peeks close first | No error |
| Suspended | any menu, panel, confirm or History notice open; M, N, ?, Z, Y | Nothing happens; Esc closes the topmost entry | No error |
| Gate | Undo/Redo control disabled (incl. Y in Game over) | Nothing happens, view and selection untouched | No error |
| F39 | Z, Y or M with a sticky view, peek or tail selection | View/peek closed, tail entry popped, then the command; no throw | No error |
| Two-press Esc | second Esc while the first pop is pending | Second Esc dropped; an Esc after the pop completes acts on the next topmost entry | No error |
| Rejected / Halted | no active Session | Only N (at once) and Esc live; in Halted no key acts | No error |

</intent-contract>

## Code Map

- `src/ui/keys.ts` -- NEW: `onKeyDown`, `installKeys(target)`, `ROWS` (gate/single/run per command: undo, redo, validate, confirm, flip, menu, newGame, howToPlay), Esc order.
- `src/ui/commands.ts` -- NEW: `undo`, `redo`, `validate`, `confirm`, `flip` (capture, dispatch, play), each closing a sticky view and peeks and popping a tail selection first; shared by buttons and keys.
- `src/shell/nav.ts` -- `settled()` / `whenSettled(fn)` expose the pending-pop state for the handler.
- `src/ui/overlays.svelte.ts` -- exports `SUSPENDING` (the modal entries; App's `INERT_UNDER` moved here).
- `src/main.ts` -- `installKeys(window)` after the mount.
- `src/ui/{Menu,ConfirmDialogs,ResetConfirm,EndSheet,PreferencesPanel,HowToPlayPanel,StatisticsPanel,HistoryNotice}.svelte` -- interim Esc handlers and `escKeeps` removed.
- `src/ui/{TopBar,ActionBar}.svelte`, `src/ui/tray/ControlRow.svelte` -- call `commands.ts`.
- Reuse: `act()` (cancel + clearTile), `openSurface`, `requestNewGame`, `newGame`. Do not change: engine, `tileTap` (its stale-selection throw stays, tested in `src/ui/gestures/tile.test.ts`).

## Tasks & Acceptance

**Execution:**
- [x] `src/shell/nav.ts`, `src/shell/nav.test.ts` -- `settled`/`whenSettled` + test -- pending-pop wait
- [x] `src/ui/commands.ts`, `src/ui/commands.test.ts` -- shared commands, F39 close-first -- one path for button and key
- [x] `src/ui/keys.ts`, `src/ui/keys.test.ts` -- handler, rows, Esc order; tests: key filtering, gate, per-surface table, rejected/Halted, Esc order, two-press Esc, pending pop, clearTile
- [x] Interim Esc handlers removed from the eight surface components; `src/main.ts` mounts the handler
- [x] `e2e/keys.spec.ts` -- desktop Playwright: surfaces open/close, F39, Redo with/without tail, panel suspension with Tab, Esc fallbacks

**Acceptance Criteria:**
- Given a menu, panel or dialog is open, when M, N, ? or Z is pressed, then nothing happens and Esc closes the topmost entry; M, N, ? open and Esc closes their surface otherwise.
- Given two stacked entries, when Esc is pressed twice with the first pop pending, then the second Esc is dropped and an Esc after the pop completes closes the next topmost entry.
- Given a sticky view or peek is open, when Z, Y or M acts, then the view/peek close first and no page error occurs.

## Implementation Notes

- Route full by size; implemented in the main session (the plan was written after the build, baseline = HEAD at start).
- Review-log items: (1) two-press Esc outcome is in the AC above and in `keys.test.ts`; (2) "each key opening or closing its surface" = M, N, ? open, Esc closes, and M, N, ?, Z do nothing under an open menu, panel or dialog; (3) the Validate/Confirm/Flip rows (`ROWS`) and their commands are built here, the Enter/F bindings arrive with 6.11; (4) acting keys are evaluated inside `nav.whenSettled`, on the then-current GameView and overlays; (5) the gate bullet's "or input" is dropped: no input exists in the surfaces.
- clearTile call site: every acting key runs inside `act()`, which clears the tile selection before the row (epic 5 CAP-4); the handler adds no second call. `openSurface` also clears a tile selection (6.1), so M, ? and a confirm-opening N clear it too, not only the tail selection as the ticket text says.
- Pre-existing flake: `e2e/menu.spec.ts:39` fails intermittently on the android project (row height 51.99997 vs 52), also on the unmodified tree.

## Plan Change Log

## Review Triage Log

### 2026-10-15 — Review pass
- verdicts: 27 findings — high 0, medium 4, low 6, false 12, maybe-false 0, descriptive 5 (intent-alignment)
- findings:
  - `[medium]` `[patch]` queued acting key was default-prevented before its gate was known (blind, edge x2, verification) — preventDefault removed from the pending path; test added.
  - `[medium]` `[patch]` a held Z/Y queued one waiter per repeat, so a burst of undos at settle (blind, edge) — repeats are dropped while a pop is pending; test added.
  - `[medium]` `[patch]` waiters flushed in one batch, so a waiter that queued a pop did not hold back the next (edge) — nav flushes one at a time while settled; nav test added.
  - `[medium]` `[patch]` Validate/Confirm/Flip closeTransient unpinned by tests (verification-gap) — commands.test.ts loops all five commands; nav test also covers a push queued behind the pop.
  - `[low]` `[patch]` test title claimed single-shot repeats while pending — retitled, tests split.
  - `[low]` `[patch]` Playwright scenarios missing from the AC (hover peek + M, tile selection survive/clear, Esc collapse of the expanded sheet, Esc on a menu-opened confirm) — added to e2e/keys.spec.ts.
  - `[low]` `[defer]` M with a long-press peek (touch) and a disabled Undo with a sticky view open have no Playwright case (no fixture with a sticky view and Undo disabled); unit-covered in keys.test.ts/commands.test.ts.
  - `[low]` `[reject]` Esc with only a peek open does nothing — a peek is not an overlay entry; the ticket's Esc order is overlay, selection, nothing.
  - `[low]` `[reject]` IME composition, text-input targets, non-US layouts — no input exists in the surfaces; chords follow the ticket (other Ctrl/Cmd/Alt chords ignored).
  - `[false]` `[reject]` Esc on the History notice is wrong — the ticket's I-68 case requires Esc to close it and leave the expanded sheet; Shift+Z is Undo (letters case-insensitive, Shift allowed); Esc "lost" while a pop is pending is the specified drop; test-name prefix AD-12 follows the convention for UI Vitest; plan state stale (updated at finalize); ROWS/WAITS duplication is one classification each (gate/single vs waits-for-pop).
  - `[descriptive]` intent-alignment: reads A (handler plus real surfaces) and C (board keys with 6.11) implemented; divergences recorded above (F39 fix lives in the shared commands, so the buttons close a view/peek too; tile selection also clears for M, ? and a confirm-opening N via act()/openSurface).

## Auto Run Result

**Summary:** One key handler (`src/ui/keys.ts`) mounted from `main.ts` for M, N, ?, Esc, Z, Y and the Ctrl/Cmd aliases, with the enablement gate, suspension under menus/panels/dialogs, pending-pop waiting (`nav.settled`/`whenSettled`), Esc order from the overlay stack, and the rejected/Halted rules. The five-plus interim Esc handlers are gone. Buttons and keys share `src/ui/commands.ts`, which closes a sticky view and peeks and pops a tail selection first (F39).

**Files changed:** `src/ui/keys.ts` (+test), `src/ui/commands.ts` (+test), `src/shell/nav.ts` (+test), `src/ui/overlays.svelte.ts` (`SUSPENDING`), `src/main.ts`, `src/ui/App.svelte`, `TopBar`, `ActionBar`, `tray/ControlRow`, `Menu`, `ConfirmDialogs`, `ResetConfirm`, `EndSheet`, `HistoryNotice`, `PreferencesPanel`, `HowToPlayPanel`, `StatisticsPanel` (interim Esc removed), `e2e/keys.spec.ts`.

**Review breakdown:** 4 patches applied (medium) plus 2 low patches; 1 low deferred (no fixture); rejected findings with reasons in the triage log.

**Follow-up review recommended:** false (no high patched; four medium patched, but all in the pending-pop path and covered by new tests — the one named risk was the pending-pop ordering, now unit-tested).

**Verification:** `npm run test:all` green (lint, check, 2.5k unit tests, build, e2e dist/dev/pwa; 717 passed). `e2e/menu.spec.ts:39` (android) is a known sub-pixel flake (51.99997 vs 52) that also fails on the unmodified tree; it passed in the final run. `npm run test:screens` (Docker) was not run: no markup or style changed.

**Residual risks:** the work is uncommitted, as the invocation said not to commit; the plan, ticket log and code changes sit in the working tree. Board keys, Enter/F bindings for the Validate/Confirm/Flip rows, focus order and tooltips are ticket 6.11. Spine AD-13 text does not yet mention `nav.settled`/`whenSettled`.

## Verification

**Commands:**
- `npm run test:all` -- expected: all green (the menu.spec.ts:39 sub-pixel flake aside)
