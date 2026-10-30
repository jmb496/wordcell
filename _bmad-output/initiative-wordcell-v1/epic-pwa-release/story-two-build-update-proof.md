---
id: 3
type: story
title: "Two-build update proof"
parent: epic-pwa-release
covers: [CAP-4]
after: [2]
risk: medium
plan_checkpoint: true
---

# Two-build update proof

## Description

Adds CAP-4's update proof on entry 2's state (a redundant install of B reports `failed` and halts the spec instead of leaving it waiting). The build pauses after its plan.

- `e2e/helpers/static-server.ts` (F8): copies a build dir to a temp dir, removes files or `swap`s them (temp file in the same dir plus `rename`); `serve()` returns `{ url, requests(), stop() }`, listens on 127.0.0.1 port 0 (parallel workers; 4173 is `vite preview`'s), reads from disk on every request, resolves paths by pathname with the query ignored (F8), sets the content type by extension (`.js` as `text/javascript`); `/` maps to `index.html` directly, any other missing path gets `index.html` only on navigation requests (`Sec-Fetch-Mode: navigate`, unverified) and 404 otherwise, `/sw.js` included; `requests()` logs each request's path, `Sec-Fetch-Mode` and status; `stop()` closes it and removes the temp copy (in teardown even on failure). Per SPEC.review-log.md Result's unapplied minor the install fetch requests plain `/index.html`, so no `?__WB_REVISION__` rationale or case; that F8/build-notes wording is left for CAP-9's sync (the plan notes it).
- A shared no-prompt check in `e2e/helpers/`: no `dialog`, `alertdialog`, `alert` or `status` role besides App's live region (`REGION` in `e2e/helpers/live-region.ts`).
- `AD-17` helper cases in `e2e/helpers.spec.ts`, passing under `npm run test:e2e`: the static-server cases copy a small synthetic temp dir (e.g. `index.html`, `sw.js`, one asset), never `buildRoot()`, and cover `/` → `index.html`, `swap` changing the next response, the navigate branch by a real browser navigation (`page.goto` to a missing path → `index.html`, 200) and the 404 branch by an in-page `fetch` of a removed `sw.js` (404, logged); the no-prompt check passes on an idle board with only App's live region and fails once per forbidden role: `dialog` (New game confirm), `alertdialog`, `alert`, extra `status` (injected elements fine). If Chromium sends no `Sec-Fetch-Mode` to the server, the plan records it and the build stops (rule 7: another heuristic deviates from F8); no other heuristic.
- An `e2e/pwa/` update spec (`allow`, F6) on a `dist-test/` copy with build marker A:
  1. After A is active and a reload leaves the page controlled, B is written by `swap`: `index.html` with marker B first, A's `sw.js` with the `index.html` precache revision changed last. The revision swap and each marker write (A inserted after `<head>`, B replacing A's) throw unless they match exactly once (rule 6).
  2. After a reload, `swState()` polls to `waiting` with a `/sw.js` 200 logged after the B write; then marker A and the no-prompt check. A second reload with B waiting repeats them, `swState()` polling to `waiting` first. If Chromium runs no update check on the reload, the test may call `registration.update()` from `page.evaluate` (test-side only, recorded in the plan).
  3. With B waiting, two pages open, one closed and another opened: each page polls `swState()` to `waiting` right after it opens, before any page closes; after a close, markers only (marker A; Q-38 may show, AD-9).
  4. While a page is open, B's handle is identified: the `context.serviceWorkers()` entry where `self.registration.waiting === self.serviceWorker` (unverified), else its browser-level CDP `ServiceWorker` version (unverified; the plan records which). With every page closed that handle is polled to `activated`, with a generous timeout the plan states; no fixed sleep or probe page first. On timeout one page opens: marker A → Chromium's timing differs (AC), marker B → observation fault; if neither route can observe B, the plan records it and the build stops (rule 7). Then a new page shows marker B, controlled, `swState()` polling to `active`, then the no-prompt check.

Interface: `e2e/helpers/static-server.ts` (copy, swap, remove, serve → `{ url, requests(), stop() }`); the no-prompt check helper; the build-marker convention `<meta name="wc-build" content="A">`.
Tests: Q-40 AD-16 A-A15 update row and the AD-16 no-prompt row's update-spec part of rule-coverage.md (P7); `AD-17` static-server and no-prompt helper cases (`e2e/helpers.spec.ts`).
Owns: the static-server helper, the no-prompt check and the update proof.
Consumers: entry 6 (no-prompt check), entry 7 (static server and its request log).

## Acceptance Criteria

Verify: `npm run test:e2e:pwa` passes the update tests (only the remaining one once a D gap is accepted) and `npm run test:e2e` the `AD-17` helper cases; `npm run test:all` is green.

The update spec has two tests, both named `Q-40 AD-16 A-A15 …` (both rule-coverage.md rows under Tests): the A-side test (reloads, multi-page) and the all-closed test (also the final-page no-prompt check). If B activates while every open page is controlled (any step) or is still waiting after every page closed, Chromium's timing differs: the plan records the observed timing and reason and the build stops for Jared's explicit §6.4 gap acceptance in the epic Notes before the ticket goes to `built`; no `test.skip`/`test.fixme`/deletion and no change to the row's kind until he accepts (SPEC Assumptions, G3). On acceptance only the test asserting the differing timing is removed, with a comment citing the acceptance, and the row's kind follows (D (G3) for that part). Anything else (an early activation with an uncontrolled page open, an observation failure, a missing update check, routing/serving) is a test fix, never grounds for D.

## References

- parent — _bmad-output/initiative-wordcell-v1/epic-pwa-release/epic-pwa-release.md
- spec — SPEC.md CAP-4, F6, F8, Assumptions; build-notes.md Playwright mechanics (Update); SPEC.review-log.md Result (unapplied minors)
- architecture — ARCHITECTURE-SPINE.md AD-16 (update policy), AD-17 (Projects)
- ux — EXPERIENCE.md State Patterns (New app version installed), A-E4
- code — e2e/helpers/live-region.ts, e2e/helpers/dist-test.ts, e2e/helpers.spec.ts, playwright.pwa.config.ts

## Notes

- Open question (unverified): Playwright 1.63's Chromium activation timing, observing B with no page open (step 4) and `Sec-Fetch-Mode: navigate` to the local server.
