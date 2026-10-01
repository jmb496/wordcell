---
id: 6
type: story
title: "Lifecycle and visible-time clock"
parent: epic-app-shell
covers: [CAP-5]
after: [5]
risk: medium
---

# Lifecycle and visible-time clock

## Description

- Interface: game.svelte.ts gains `registerLifecycle()`, `registerBeforeHide(fn)`, `whenVisible()`, `isStale()`; e2e/helpers/lifecycle.ts gains `startHidden(page)`.
- Tests: R-73 saved when hidden (hidePage, pageHide); R-73 activeMs flushed not on ticks; R-76 clock sentences (won/gaveUp, fresh deal, New game); AD-17 hidePage single write and resume only when visible; Q-38 bfcache halt and own-write no-halt case; AD-9 shell Vitest (registerBeforeHide order, whenVisible); AD-4 shell Vitest (own writes leave isStale() false); AD-15 halted: hide flush writes no wordcell:session (Playwright, spy); AD-16 halted boot registers no lifecycle listeners, registerLifecycle() guard (shell Vitest).
- Owns: whenVisible (entry 9 uses it) and the isStale protocol (entries 7 and 10 implement it).
- Listeners and resume: `registerLifecycle()` adds the store's visibilitychange, pagehide and pageshow listeners, then `clock.resume` iff visible; it runs after `load()` for both `active` and `rejected` (rejected root included, CAP-8 whenVisible). main.ts keeps its halted early return and calls it right after `load()`, before mount (AD-16 order). It throws (`AD-16 registerLifecycle() while <kind>`) while booting or halted and on a second call (rule 6, style of load/dispatch). visibilitychange and pageshow resume only when visible.
- Hide flush (hidden, pagehide): before-hide callbacks, take and pause run in every state; accrue, write and assign only while `active`: write `serializeSession(accrued)` unconditionally, then assign it as the store's Session (write first, then assign, like dispatch), so the taken ms are not lost. While rejected the flush writes nothing, and New game's discarded take drops the rejected-screen time. No try/catch: a throwing before-hide callback or flush write propagates to the AD-15 surface and the rest of that flush does not run (rule 6).
- registerBeforeHide: callbacks run in registration order, dispatch no command and cannot change what is written (AD-9); tested with stub callbacks only; the gesture cancel comes with epic 4's controller (SPEC E10).
- whenVisible: throws before `registerLifecycle()`; resolves at once if `document.visibilityState` is `'visible'`, otherwise every pending caller resolves on the store's next visibilitychange to visible (a pageshow while hidden does not resolve it); independent of store state.
- isStale halt (Q-38): each key owner keeps the last text it read or successfully wrote for its key (`null` when absent) and exposes `isStale(): boolean`, which rereads via `storage.read` and compares. The game store sets its session text at every Session read (load, including the rejected and halted-boot paths) and after every successful write (load's first-launch write, dispatch, newGame/replay, hide flush). On persisted pageshow, before resume, the handler ORs a fixed list of directly imported owner checks (session now; entries 7 and 10 each append theirs) and halts with `'another-window'` when any is true; it applies while rejected too and is skipped while halted (halt keeps an earlier fatal).
- startHidden: per build-notes CAP-5, with its e2e/helpers.spec.ts test.
- Halted boot: `registerLifecycle()` is not called while halted (entry 5's boot rule); write counts use entry 5's storage-spy helper armed after boot.

## Acceptance Criteria

- Verify: npm run test:all is green.
- Playwright android setup: page.clock installed before goto and advanced with `runFor` (`pauseAt` as e2e/blocking.spec.ts does), so stored activeMs values are asserted exactly (seeded + N).
- R-73: after hidePage the whole spy log is exactly one entry, for wordcell:session (AD-9: the flush writes only that key); pageHide alone writes the accrued activeMs; with the spy armed after boot, a page.clock advance with no input records zero writes (not on ticks).
- R-76: a seeded playing fixture grows by exactly the visible advance; a hidden interval adds nothing; session-won.json and session-gave-up.json keep their seeded activeMs after a visible advance plus hidePage; a fresh unseeded first-launch deal grows; a startHidden page does not grow activeMs until showPage; hidePage, pageShow({ persisted: false }), advance N, pageHide while still hidden → stored activeMs unchanged since the hide.
- Hide flush assigns: advance A, hidePage, showPage, advance B, Undo → stored activeMs = seeded + A + B.
- New game: seed session-gave-up.json, advance A, press New game, advance B, hidePage → stored activeMs equals B exactly (CAP-5; Replay stays shell Vitest AD-4, Playwright in epic 6).
- Q-38 bfcache: page.evaluate sets wordcell:session to a different valid Session text (e.g. another fixture's text), current() still active, then pageShow persisted → halted with the another-window message (history/prefs variants come with entries 7 and 10). No-halt: after an own dispatch (e.g. Undo) and pageHide(page), pageShow(page, { persisted: true }) stays active.
- AD-15 halted: halt through the persisted-pageshow path, then hidePage and pageHide record no wordcell:session write.
- Shell Vitest: AD-4 own dispatch, hide-flush and newGame writes each leave isStale() false; AD-16 halt before load, load, registerLifecycle throws and no visibilitychange/pagehide/pageshow listener was added; AD-9 whenVisible at once, pending while hidden (including through a pageshow), resolved by visibilitychange; AD-9 registerBeforeHide order.

## References

- parent — _bmad-output/initiative-wordcell-v1/epic-app-shell/epic-app-shell.md
- _bmad-output/specs/spec-epic-3-app-shell/SPEC.md — CAP-5
- _bmad-output/specs/spec-epic-3-app-shell/build-notes.md — CAP-5 Lifecycle; CAP-4 Q-38 back/forward cache bullet
- ARCHITECTURE-SPINE.md — AD-9, AD-16, AD-17 Time and hide
- _bmad-output/specs/spec-epic-3-app-shell/rule-coverage.md — R-73, R-76, Q-38 bfcache, AD-9/AD-15/AD-16/AD-17 rows

## Notes

- Open question: None.
