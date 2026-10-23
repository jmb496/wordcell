---
id: 4
type: story
title: "Celebration overlay entry"
parent: epic-end-of-game-words
covers: [CAP-3]
after: [3]
risk: high
plan_checkpoint: true
---

# Celebration overlay entry

## Description

Adds the `celebration` entry to `overlays.svelte.ts` and its sequencing (AD-13 celebration bullet, AD-19); `overlays` never imports `celebration`.

- **Entry.** `celebration` joins `SUSPENDING` (focus-follow's suspension keeps it; the run moves no focus), `MODAL_TOP` and `OWN_OPERATION` (`open('celebration')` throws), and no `LEGAL_TOPS` list. App.svelte's `mainInert` filters `celebration` out, so `main` (board, top bar, action bar) is not inert (AD-13; EXPERIENCE.md Win celebration).
- **Start.** `startCelebration()` mirrors `openDeferred`: closes a sticky `wordcellView` on top, clears `hoverPeek`, then pushes one entry (one `nav.push`); it throws `AD-13 startCelebration …` on a peek, any other entry (including `celebration` itself) or a non-`hidden` end sheet. The caller (entry 5) calls `overlays.startCelebration()`, then `celebration.start(view, done)`; `start()` never pushes.
- **Removal callback.** `overlays.onCelebrationRemoved(fn: (reason: 'ended' | 'cancelled') => void)`; a later registration replaces the earlier; removing the entry with nothing registered throws `AD-13 …` (rule 6). `closedByBack` and `close('celebration')` → `ended`: the callback runs after `closedByBack`'s removal loop has finished (or queues `done`), so a following push cannot be swept; `closedByBack` never calls nav (unchanged). `pressEscape` closing `celebration` is an end (`ended`, `done` deferred; EXPERIENCE.md's Esc skip); entry 6's capture listener later handles Esc first (and the focus exception). `resetForNewSession()` and `onUnfinished()` → `cancelled`: both cancel the deferred-sheet token first, and `onUnfinished()` closes an open `celebration` top-down with one `nav.pop`.
- **`done` ownership.** `attachOverlays()` in `celebration.svelte.ts` (added here; called from `main.ts` at boot by entry 5, directly by the tests here) wires the singleton `celebration`; from then on the removal callback is the only caller of `done`, once, via `queueMicrotask`. `end()` (finish, cap, empty-list start, later skips) hands `done` over and calls `overlays.close('celebration')` only while the entry is open. The callback stops the run without calling `onEnd` (cancel semantics) and queues the run's `done` for `ended` only. Unattached `createCelebration()` instances keep entry 3's synchronous `done`, so entry 3's tests stay unchanged. The handover mechanics (e.g. `onEnd(fn: (done) => void)`, or the callback reading the active run's `done`) are the plan's choice.
- **Keys.** While `celebration` is open, `attempt()` still runs the `undo` and `newGame` rows (SPEC CAP-3 and AD-13 confirm EXPERIENCE.md "Keys while it runs"); `menu` (`M`) stays ignored until entry 7 adds `end()` first; `?`, WordCell `Enter`/`Space`, digits and every other row do nothing.
- **Gestures.** While `celebration` is open the gesture path (intent `tapAction`, controller tap and long-press) resolves to no action (UI no-op, no throw); via `MODAL_TOP`, `openHoverPeek` is a no-op and a call that slips through to `openView`/`openPeek`/`peekToSticky` throws (fail fast).

Contract:

- Interface: `overlays.startCelebration()`, the registered removal callback (`overlays.onCelebrationRemoved`), `overlays.close('celebration')`, `attachOverlays()`.
- Tests: AD-13 tests for the entry (U), plus the AD-19 wiring tests (U).
- Owns: the `celebration` overlay entry and its sequencing.
- Consumers: entries 5–7.
- `plan_checkpoint: true` (the plan stops for owner approval).

## Acceptance Criteria

Verify: UI Vitest tests pass, store, key and gesture tests named `AD-13 …` and `attachOverlays`/controller wiring tests named `AD-19 …` (AD-19 Tests), with nav stubbed, a stubbed `done` standing in for entry 5's sheet open, and `onUnfinished()`/`resetForNewSession()` called directly:

- Legal start: one push, a sticky view closed, the hover peek cleared; each illegal start throws with no state or nav change; `open('celebration')` throws.
- `end()`: one `nav.pop`; `done` not called synchronously, called exactly once after a microtask, the stub `done`'s push recorded after the pop in the stubbed nav's call order.
- Back (`closedByBack`): no `nav.pop`, `running()` false, `done` once after the removal loop, a following push not swept.
- `end()` then a back, or a repeated `end()`: no second `done`.
- `onUnfinished()` and `resetForNewSession()` with the entry open: entry removed with one pop, run stopped, token dead (`openDeferred(token)` false), no `done` even after a flushed microtask.
- `pressEscape` with the entry on top: treated as `ended`.
- Keys (keys.test.ts): `Z`/Ctrl+Z and `N` act; `M`, `?`, WordCell `Enter`/`Space` and digits do nothing.
- Gestures (controller.test.ts): a tap and a long-press on a WordCell with the entry open call no overlays method and do not throw; `openHoverPeek` is a no-op.
- `main` is not inert while only `celebration` is open.
- A source assertion in the overlays test: `overlays.svelte.ts` imports nothing from `./celebration/`.

## References

- parent — _bmad-output/initiative-wordcell-v1/epic-end-of-game-words/epic-end-of-game-words.md
- architecture — ARCHITECTURE-SPINE.md AD-13 (the celebration bullet), AD-19
- spec — SPEC.md CAP-3, rule-coverage.md (R-87 keys row)
- design — EXPERIENCE.md Win celebration ("Keys while it runs")
- entry 3 — story-celebration-step-renderer-and-run-controller.md and its -plan.md
- code — src/ui/overlays.svelte.ts (+ .test.ts), src/ui/celebration/celebration.svelte.ts (+ .test.ts), src/ui/App.svelte (`mainInert`), src/ui/keys.ts (`attempt`, `pressEscape`), src/ui/gestures/intent.ts, src/ui/gestures/controller.ts, src/ui/focus-follow.ts, src/shell/nav.ts

## Notes

- Open question: whether the microtask ordering and nav's pop-before-push queue behave as AD-13 states; this entry proves the call order with nav stubbed (removal loop finished before `done`; on `end()` the pop is called before `done`'s push), nav's own tests cover its queue, and entry 6's back test proves it against the real history and sheet.
- Until entry 7, the ☰ button over a running celebration hits the `open(menu)` pair guard (throws); entry 7 adds `end()` before `openSurface('menu')`.
