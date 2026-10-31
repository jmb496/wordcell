---
id: 7
type: story
title: "Q-40 failure and Q-42 controlled-branch proofs"
parent: epic-pwa-release
covers: [CAP-5]
after: [3, 5, 6]
risk: medium
---

# Q-40 failure and Q-42 controlled-branch proofs

## Description

Adds CAP-5's Playwright proofs: in `e2e/pwa/dist-smoke.spec.ts` (hook-free `dist/`), the worker script missing (a copy without `sw.js` on entry 3's static server, its `/sw.js` 404 asserted), one precached URL the page does not load answered 404 during the first install by `context.route` (handler hit by the worker, no worker still installing before the no-surface check) and the `sw.ts` chunk (entry 1's chunk helper) routed to 404 (F17, route hit) each boot, deal and validate with nothing shown, with entry 5's init script showing `persisted`/`persist` after the failure in the missing-script and chunk cases; in `e2e/pwa/sw-failure.spec.ts` (`pwa` only) the same three on `dist-test/` reach the AD-15 fatal surface with `swState()` `failed` (no `persisted`/`persist` call in the chunk case); and Q-42 under a controlling worker (F7, test-only: the precache entry deleted and the network answered 404 by `context.route`): Reload retries in place with the banner kept and no `load` event, and the banner hides when the held retry is fulfilled; no production branch is added.

## Acceptance Criteria

Verify: `npm run test:e2e:pwa` and `npm run build && npm run test:e2e:dist` pass the tests named Q-40 (both builds, all three failures) and Q-42 (retry in place, banner hides), each asserting its route or server request was hit, and `playwright.pwa.config.ts` keeps `sw-failure.spec.ts` out of `dist-smoke`; `npm run test:all` is green.

## References

- parent — _bmad-output/initiative-wordcell-v1/epic-pwa-release/epic-pwa-release.md
- spec — SPEC.md CAP-5, F6, F7, F8, F15, F17; build-notes.md Playwright mechanics (Q-40, Q-42)
- rules — docs/game-flow-spec.md Q-40, Q-42
- code — e2e/pwa/dist-smoke.spec.ts, playwright.pwa.config.ts, src/shell/dictionary.svelte.ts
- spec — _bmad-output/specs/spec-epic-3-app-shell/rule-coverage.md (P7 rows for Q-40 and Q-42)

## Notes

- Open question: Whether answering one precached icon 404 at context level during the first install reliably turns that install redundant before the no-surface check in both builds.
