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

- `e2e/helpers/static-server.ts` (F8): copies a build dir to a temp dir, swaps or removes files; `serve()` returns `{ url, requests(), stop() }`, listens on 127.0.0.1 port 0 (parallel workers; 4173 is `vite preview`'s), reads from disk on every request, resolves paths by pathname with the query ignored (F8), sets the content type by extension (`.js` as `text/javascript`); `/` maps to `index.html` directly, any other missing path gets `index.html` only on navigation requests (`Sec-Fetch-Mode: navigate`, unverified) and 404 otherwise, `/sw.js` included; `requests()` logs each request's path, `Sec-Fetch-Mode` and status; `stop()` closes it and removes the temp copy (in teardown even on failure). Per SPEC.review-log.md Result's unapplied minor the install fetch requests plain `/index.html`, so no `?__WB_REVISION__` rationale or case; that F8/build-notes wording is left for CAP-9's sync (the plan notes it).
- A shared no-prompt check in `e2e/helpers/`: no `dialog`, `alertdialog`, `alert` or `status` role besides App's live region (`REGION` in `e2e/helpers/live-region.ts`).
- `AD-17` helper cases in `e2e/helpers.spec.ts`, passing under `npm run test:e2e`: the static-server cases copy a small synthetic temp dir (e.g. `index.html`, `sw.js`, one asset), never `buildRoot()`, and cover `/` → `index.html`, `remove` → 404 (the logged 404 for a removed `sw.js`), `swap` changing the next response, the navigate branch by a real browser navigation (`page.goto` to a missing path → `index.html`, 200) and the 404 branch by an in-page `fetch`; the no-prompt check passes on an idle board with only App's live region and fails with a `dialog`/`alertdialog` open (e.g. the New game confirm) or an extra `status`. If Chromium sends no `Sec-Fetch-Mode` to the server, the plan records it and the build stops (rule 7: another heuristic deviates from F8); no other heuristic.
- An `e2e/pwa/` update spec (`allow`, F6) on a `dist-test/` copy with build marker A:
  1. After A is active and every open page controlled, B is written: `index.html` with marker B first, A's `sw.js` with the `index.html` precache revision changed last, each via a temp file in the same dir plus `rename`. The swap replaces exactly one `index.html` precache revision and throws otherwise; the marker insertion throws if it matches no `<head>` (rule 6).
  2. After a reload, `swState()` polls to `waiting` and the server log shows B's `sw.js` served; then marker A and the no-prompt check. If Chromium runs no update check on the reload, the test may call `registration.update()` from `page.evaluate` (test-side only, recorded in the plan), never grounds for D.
  3. With B waiting, two pages open, one closed and another opened: each page still shows marker A and reads `swState()` `waiting` (markers only; Q-38 may show, AD-9).
  4. With every page closed, B's activation is polled without opening a page: `self.serviceWorker.state` evaluated in the newest of `context.serviceWorkers()` (unverified), else a browser-level CDP `ServiceWorker` session (unverified; the plan records which); an observation limit is a test fix, never D. Then a page opened shows marker B, controlled, `swState()` polling to `active`, then the no-prompt check.

Interface: `e2e/helpers/static-server.ts` (copy, swap, remove, serve → `{ url, requests(), stop() }`); the no-prompt check helper; the build-marker convention `<meta name="wc-build" content="A">`.
Tests: Q-40 AD-16 A-A15 update row and the AD-16 no-prompt row's update-spec part of rule-coverage.md (P7); `AD-17` static-server and no-prompt helper cases (`e2e/helpers.spec.ts`).
Owns: the static-server helper, the no-prompt check and the update proof.
Consumers: entry 6 (no-prompt check), entry 7 (static server and its request log).

## Acceptance Criteria

Verify: `npm run test:e2e:pwa` passes the update spec (named Q-40 AD-16 A-A15; both rule-coverage.md rows under Tests) and `npm run test:e2e` the `AD-17` helper cases; `npm run test:all` is green.

The update spec's A-side steps (reload → B waiting, marker A, no prompt; multi-page markers A) always pass; only the all-closed step can fail on Chromium's own activation timing. If it does, the build records the observed timing and reason in the plan and stops for Jared's explicit §6.4 gap acceptance in the epic Notes before the ticket goes to `built`; no `test.skip`/`test.fixme`/deletion and no change to the rule-coverage row's kind until he accepts (SPEC Assumptions, G3). An early activation with an uncontrolled page open, an observation failure, or any routing/serving problem is a test fix, never grounds for D.

## References

- parent — _bmad-output/initiative-wordcell-v1/epic-pwa-release/epic-pwa-release.md
- spec — SPEC.md CAP-4, F6, F8, Assumptions; build-notes.md Playwright mechanics (Update); SPEC.review-log.md Result (unapplied minors)
- architecture — ARCHITECTURE-SPINE.md AD-16 (update policy), AD-17 (Projects)
- ux — EXPERIENCE.md State Patterns (New app version installed), A-E4
- code — e2e/helpers/live-region.ts, e2e/helpers/dist-test.ts, e2e/helpers.spec.ts, playwright.pwa.config.ts

## Notes

- Open question: Whether Playwright 1.63's Chromium activates the waiting worker exactly when every page of the context has closed, how that activation is observed with no page open (`context.serviceWorkers()` or a CDP `ServiceWorker` session), and whether it sends `Sec-Fetch-Mode: navigate` to the local server (unverified).
