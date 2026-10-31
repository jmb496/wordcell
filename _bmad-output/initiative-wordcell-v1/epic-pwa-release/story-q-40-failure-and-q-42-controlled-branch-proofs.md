---
id: 7
type: story
title: "Q-40 failure and Q-42 controlled-branch proofs"
parent: epic-pwa-release
covers: [CAP-5]
after: [3, 5, 6]
risk: medium
plan_checkpoint: true
---

# Q-40 failure and Q-42 controlled-branch proofs

## Description

Adds CAP-5's Playwright proofs; no production branch is added. Boot, deal and validate reuse entry 6's helpers (`e2e/helpers/offline.ts`) as `e2e/pwa/offline.spec.ts` and the dist-smoke offline case do: seed `session-idle-fresh.json`, `pinNextSeed` before `goto`, play (`composeTan`; the New game confirm needs a game in progress), `dealNewGame`, `composeTan`, Validate. The no-surface check is `expectNoPrompt(page)` (`e2e/helpers/live-region.ts`), the AD-15 fatal title absent and no `pageerror`; console errors are not checked (as entry 6's offline case); it runs once the failure has settled and again after the validate. Entry 5's boot-call log is `e2e/helpers/boot-calls.ts`.

- `dist-smoke` (hook-free `dist/`): three cases inside the existing `F6 serviceWorkers allow` describe of `e2e/pwa/dist-smoke.spec.ts` (F6: mode per describe, never file level), each booting, dealing and validating with the no-surface check:
  - worker script missing: a copy without `sw.js` on entry 3's static server; its `/sw.js` 404 asserted first; the log polls to exactly `register`, `register-settled` (`rejected`), `persisted`, `persist`.
  - precache 404: `icons/icon-192.png`, which the page does not load, answered 404 during the first install by `context.route`, matched by pathname (the worker's fetch carries `?__WB_REVISION__=`); non-worker requests go to `route.fallback()`. The handler holds the worker's icon request (`request.serviceWorker()` non-null) until the page has observed the install (the log's `register-settled` `fulfilled`, so this case also arms entry 5's init script), then answers 404 and resolves a promise the test awaits before polling the registration and the first no-surface check. After no worker is installing, `navigator.serviceWorker.getRegistration()` resolves `undefined` or a registration with no `active` and no `waiting` worker.
  - chunk 404 (F17): the `page.route` for the `sw.ts` chunk (entry 1's chunk helper) on the uncontrolled first-launch page (as `boot-order.spec.ts`) holds the request; assert it was hit and the log has no `persisted` entry while held; then answer 404 and poll the log to exactly `persisted`, `persist` (after the chunk 404) with no `register` entry.
- `pwa` (`dist-test/`), `e2e/pwa/sw-failure.spec.ts` (`pwa` only): the same three (the missing-script case on a static-server copy of `dist-test/`, SPEC CAP-5) reach the AD-15 fatal surface with `swState()` `failed`; the precache case holds the icon request until `swState()` is `installing`. In the chunk case, once the fatal surface is visible and `swState()` is `failed`, plus one macrotask (as the F4 cases), the log has no `register`, `persisted` or `persist` entry.
- Q-42 under a controlling worker (F7, test-only), `pwa` only (it needs the hook): a new `e2e/pwa/dictionary-retry.spec.ts` with file-level `test.use({ serviceWorkers: 'allow' })` and an F6 comment; `dist-smoke`'s explicit `testMatch` leaves it out. Order: first `goto`; `precacheComplete()` polled true; reload, assert `navigator.serviceWorker.controller` non-null (`swState()` `active` is not control, build-notes) and poll `dictionaryState()` to `ready`; delete the list URL's pathname from the `workbox-precache-*` cache (exactly one entry deleted); add `context.route` on `**/en*.txt` (AD-8 Tests; each hit must have `request.serviceWorker()` non-null; first hit answered 404, that response `fromServiceWorker()` (unverified on Playwright 1.63); second hit, the Reload retry, held); reload so the controlled page gets the 404 banner; attach `page.on('load')`; tap Reload; poll until the second hit is held, then assert the banner visible, `dictionaryState()` `loading` and no `load` event; release the held request to the network (`route.continue()`/`route.fallback()`, the real list); once the banner hides and `dictionaryState()` is `ready`, assert again no `load` event and exactly two route hits (as `e2e/dictionary.spec.ts`'s AD-8 stubbed-controller test).

Tests: Q-40 rows (P7 `dist-smoke`, P7 `pwa` `sw-failure.spec.ts`); Q-42 controlled-branch rows (P7) of rule-coverage.md; the plan maps each CAP-5 Q-40/Q-42 row to its test name. Owns: the Q-40 and Q-42 proofs. Consumers: entry 11 (closes the epic 3 P7 rows against these tests, F15), so this ticket edits neither rule-coverage file.

## Acceptance Criteria

Verify: `npm run test:e2e:pwa` passes the tests named Q-40 (all three failures, `sw-failure.spec.ts`) and Q-42 (`dictionary-retry.spec.ts`, retry in place, banner hides); `npm run build && npm run test:e2e:dist` passes the three Q-40 `dist-smoke` cases, so Q-40 is proven on both builds; each test asserts its route or server request was hit; `playwright.pwa.config.ts` keeps `sw-failure.spec.ts` and `dictionary-retry.spec.ts` out of `dist-smoke`; `npm run test:all` is green.

## References

- parent — _bmad-output/initiative-wordcell-v1/epic-pwa-release/epic-pwa-release.md
- spec — SPEC.md CAP-5, F6, F7, F8, F15, F17; build-notes.md Playwright mechanics (Q-40, Q-42)
- rules — docs/game-flow-spec.md Q-40, Q-42
- code — e2e/pwa/dist-smoke.spec.ts, playwright.pwa.config.ts, src/shell/dictionary.svelte.ts
- spec — _bmad-output/specs/spec-epic-3-app-shell/rule-coverage.md (P7 rows for Q-40 and Q-42)

## Notes

- If the held 404 does not turn the install redundant (no `failed` on `dist-test/`, or a worker active or waiting on `dist/`), or Q-42's 404 is not `fromServiceWorker()`, the build records it in the plan and stops for the owner under rule 7, never weakening the assertion or swapping the failure mechanism.
