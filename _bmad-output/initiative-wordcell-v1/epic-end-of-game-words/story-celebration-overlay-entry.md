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

- **Entry.** `celebration` joins `SUSPENDING` (focus-follow's suspension keeps it; the run moves no focus; the `SUSPENDING` comment names the `celebration` exceptions), `MODAL_TOP` and `OWN_OPERATION` (`open('celebration')` throws), and no `LEGAL_TOPS` list. App.svelte's `mainInert` filters `celebration` out, so `main` (board, top bar, action bar) is not inert (AD-13; the bars stay usable per EXPERIENCE.md Win celebration).
- **Start.** `startCelebration()` mirrors `openDeferred`: closes a sticky `wordcellView` on top, clears `hoverPeek`, then pushes one entry (one `nav.push`); it throws `AD-13 startCelebration …` on a peek, any other entry (including `celebration` itself), a non-`hidden` end sheet or no registered removal callback (no push). The caller (entry 5), already holding a live `deferEndSheetOpen()` token as `onDispatched` does today (no new store precondition), calls `overlays.startCelebration()`, then `celebration.start(view, done)`; `start()` never pushes.
- **Removal callback.** `overlays.onCelebrationRemoved(fn: (reason: 'ended' | 'cancelled') => void)`; a later registration replaces the earlier. The calling path sets the reason (an internal remove with a reason): `closedByBack` and an external `close('celebration')` → `ended`: the callback queues `done` in a microtask, so `done` runs after the removal loop has finished and a following push cannot be swept; `closedByBack` never calls nav (unchanged). `pressEscape` closing `celebration` is an end (`ended`, `done` deferred; EXPERIENCE.md's Esc skip); entry 6's capture listener later handles Esc first (and the focus exception). The removals inside `resetForNewSession()` and `onUnfinished()` → `cancelled`: both cancel the deferred-sheet token first, and `onUnfinished()` closes `celebration` with one `nav.pop` only when it is the top entry; otherwise `close()`'s `AD-13` throw applies (no new handling).
- **`done` ownership.** `attachOverlays()` in `celebration.svelte.ts` (added here; called from `main.ts` at boot by entry 5, directly by the tests here) registers the removal callback through `overlays.onCelebrationRemoved`, deliberately not `onEnd` (tickets.toml said `onEnd`), and sets a private attached flag on the singleton `celebration`; the public `onEnd` stays as entry 3 built it, replaceable, and does not by itself change `done`. While attached, the removal callback is the only caller of `done`, once, via `queueMicrotask`: `finish` (used by `end()` (finish, cap, later skips) and the empty-list `start()`) parks `done` as the pending `done`, runs `onEnd`, then calls `overlays.close('celebration')`; the callback takes the pending `done`, or the live run's `done` when the removal came from back or Esc, stops the run internally (no `onEnd`), and queues that `done` for `ended`, dropping it for `cancelled`. Fail fast while attached (rule 6): `start()` throws `AD-19 …` unless `celebration` is the top entry; `end()` with a live run always closes the entry; a removal with reason `ended` and no pending or live `done` throws `AD-19 …`; a public `cancel()` with the entry open throws `AD-19 …` (cancellation goes only through `onUnfinished()`/`resetForNewSession()`, whose removal callback stops the run internally). Unattached `createCelebration()` instances keep entry 3's synchronous `done`, so entry 3's tests stay unchanged.
- **Keys.** While `celebration` is open, `attempt()` still runs the `undo` and `newGame` rows (EXPERIENCE.md "Keys while it runs"); `?`, WordCell `Enter`/`Space`, digits and every other row do nothing (the SPEC Open Questions default, which the owner confirms at this ticket's plan checkpoint); `menu` (`M`) stays ignored, an interim gap until entry 7 adds `end()` first.
- **Gestures.** While `celebration` is open the gesture path (intent `tapAction`, controller tap and long-press) resolves to no action (UI no-op, no throw); the controller marks a press begun while `celebration` is open, and that press performs no action at all (no tap, timer, peek or view) whatever the top is at its timer or release, so no throw; via `MODAL_TOP`, `openHoverPeek` is a no-op and a call that slips through to `openView`/`openPeek`/`peekToSticky` throws (fail fast).

Contract:

- Interface: `overlays.startCelebration()`, the registered removal callback (`overlays.onCelebrationRemoved`), `overlays.close('celebration')`, `attachOverlays()`.
- Tests: AD-13 tests for the entry (U), plus the AD-19 wiring tests (U).
- Owns: the `celebration` overlay entry and its sequencing.
- Consumers: entries 5–7.
- `plan_checkpoint: true` (the plan stops for owner approval).

## Acceptance Criteria

Verify: UI Vitest tests pass, store, key and gesture tests named `AD-13 …` and run-controller (`celebration.svelte.ts`) wiring tests named `AD-19 …` (AD-19 Tests), with nav stubbed, a stubbed `done` standing in for entry 5's sheet open, and `onUnfinished()`/`resetForNewSession()` called directly, standing in for Undo and New game (`end-sheet.ts` `onDispatched`'s unfinished → `overlays.onUnfinished()` and New game's `resetForNewSession()` are unchanged and already tested):

- Legal start: one push, a sticky view closed, the hover peek cleared; each illegal start throws with no state or nav change; `open('celebration')` throws. While attached, `start()` without `celebration` on top and a removal with reason `ended` and no pending or live `done` throw.
- Registration: on a fresh module (`vi.resetModules()`), `startCelebration()` with nothing registered throws with no push; after two registrations only the second callback runs.
- Attached `celebration.cancel()` with the entry open throws `AD-19 …`.
- `end()`: one `nav.pop`; `done` not called synchronously, called exactly once after a microtask, the stub `done`'s push recorded after the pop in the stubbed nav's call order.
- Attached empty-list `start()` after `startCelebration()`: one pop, `done` once after a microtask.
- Back (`closedByBack`): no `nav.pop`, `running()` false, `done` once after the removal loop; the stub `done` calls `overlays.openDeferred(token)` (token from `deferEndSheetOpen()` before the start) and `overlays.top === 'endSheet'` after the microtask.
- `end()` then a back, or a repeated `end()`: no second `done`.
- `onUnfinished()` and `resetForNewSession()` with the entry open: entry removed with one pop, run stopped, token dead (`openDeferred(token)` false), no `done` even after a flushed microtask.
- `pressEscape` with the entry on top: one `nav.pop`, the callback gets `ended`, `done` once after a microtask.
- Keys (keys.test.ts): `Z`/Ctrl+Z and `N` act; `M`, `?` and WordCell `Enter`/`Space` do nothing.
- Gestures (controller.test.ts): a tap and a long-press (including its release) on a WordCell with the entry open leave the stack, `peek`, `viewCell`, `selection` and `hoverPeek` unchanged, make no nav call and do not throw; a press on a non-empty WordCell with the entry open, then `end()` and a flushed microtask (the stub `done` opens the sheet), then the release, and separately the long-press timer plus release: no throw, no overlay or nav change beyond the sheet's open and push; with the entry open `openView`, `openPeek` and `peekToSticky` throw `AD-13 …` and `openHoverPeek` is a no-op.
- `main` is not inert, and focus-follow moves no focus (focus-follow.test.ts), while only `celebration` is open.
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
- Entry 6 owns `pressEscape`'s `celebration` branch (changing it or suppressing the event) so a bar-focused Esc does not end the run.
- `historyNotice` has no `LEGAL_TOPS` row, so `open('historyNotice')` is not blocked over `celebration`; safe only because it opens at boot and after a rejected-root New game.
- Spine refinements (rule 7; flag at the plan checkpoint, amend at entry 9's close-out): (a) `startCelebration` closes a sticky `wordcellView` on top first, as `openDeferred` (AD-13 "legal only with no other entry"; backed by "a transition into Game over closes any sticky view"); (b) `attempt()` still runs `undo` and `newGame` (AD-13 "`attempt()` ignores game keys"; backed by "the ☰ button, `M`, `N` and Undo take their own paths"); (c) `mainInert` excludes `celebration` though it is in `SUSPENDING`; (d) AD-19 "`cancel()` pops the entry" and back reaching `end()` become "the removal pops the entry, then the callback stops the run"; `onEnd` fires only for run-driven ends (finish, cap, `end()`, empty-list start), never for back, Esc or a cancel, so entries 6–7 hang per-run teardown on the internal stop every removal reaches, not on `onEnd`; (e) EXPERIENCE.md's "inert" board means it takes no input (the Keys and Gestures no-ops), not HTML `inert`.
