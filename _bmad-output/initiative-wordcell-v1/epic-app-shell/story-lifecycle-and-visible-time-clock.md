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

Registers the store's visibilitychange, pagehide and pageshow listeners after the load with clock.resume iff visible, the hide flush (before-hide callbacks, take, pause, accrue, unconditional wordcell:session write while active), registerBeforeHide, whenVisible() resolved by the store's own listener, the persisted-pageshow staleness halt through each key owner's isStale() (session here; history and prefs owners join in entries 7 and 10), and a startHidden helper in e2e/helpers/lifecycle.ts with its helpers.spec.ts test; registerLifecycle() is not called while halted (entry 5's boot rule, shell Vitest), and write counts use entry 5's storage-spy helper armed after boot.

## Acceptance Criteria

Verify: npm run test:all is green, and Playwright on android with page.clock shows hidePage alone producing exactly one wordcell:session write, pageHide alone writing the accrued activeMs, time growing only while visible and playing, a startHidden page not growing activeMs until showPage, a pageShow({ persisted: false }) while hidden not resuming, and a same-page key change followed by pageShow({ persisted: true }) halting with the another-window message while an unchanged one stays active.

## References

- parent — _bmad-output/initiative-wordcell-v1/epic-app-shell/epic-app-shell.md

## Notes

- Open question: None.
