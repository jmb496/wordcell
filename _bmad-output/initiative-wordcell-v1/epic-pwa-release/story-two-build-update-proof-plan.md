---
title: 'Two-build update proof'
type: 'feature'
ticket: '3'
created: '2026-10-30'
status: done
baseline_revision: 'f45add304e81639f230d841977b68d3ab43c6ab5'
route: 'full'
route_source: 'auto'
review: 'thorough'
review_source: 'auto'
lenses_ran: ['blind-hunter', 'edge-case-hunter', 'verification-gap', 'intent-alignment']
review_loop_iteration: 0
followup_review_recommended: false
context:
  - '{project-root}/_bmad-output/specs/spec-epic-7-pwa-release/SPEC.md'
  - '{project-root}/_bmad-output/specs/spec-epic-7-pwa-release/build-notes.md'
  - '{project-root}/_bmad-output/initiative-wordcell-v1/epic-pwa-release/story-two-build-update-proof.md'
warnings: ['oversized']
deferred: []
---

<intent-contract>

## Intent

**Problem:** CAP-4's update rule (Q-40, AD-16, A-A15: a waiting build activates only once every window has closed, with no prompt) has no proof, and entries 6 and 7 need a static server that can swap or drop `sw.js` (F8) and a shared no-prompt check.

**Approach:** Add `e2e/helpers/static-server.ts` (copy a build dir, swap or remove files, serve it from disk), `expectNoPrompt(page)` beside `REGION`, their `AD-17` self-tests in `e2e/helpers.spec.ts`, and `e2e/pwa/update.spec.ts` with two `Q-40 AD-16 A-A15` tests on a marked `dist-test/` copy.

## Boundaries & Constraints

**Always:** hook-free helpers (no `window.__wordcell` in `static-server.ts` or `expectNoPrompt`). The update spec uses `serviceWorkers: 'allow'` set explicitly with a comment (F6) and `retries: 0`, also on CI, because a retry could hide an activation that is only sometimes early. Each test has its own copy and server, and its `finally` closes the context's pages before `stop()`. Every text substitution throws unless its anchor matches exactly once (rule 6). No fixed sleeps: poll with stated bounds. A `failed` `swState()` or a `redundant` B fails at once and prints the request log.

**Never:** `context.route`/`page.route` in the update spec; `registration.update()` except the step-2 fallback; any `src/` change; edits to the ticket file, `vite.config.ts`, the generated `sw.js` policy or other specs; `test.skip`/`test.fixme`; directory-index mapping beyond `/`; another missing-path heuristic than `Sec-Fetch-Mode: navigate`.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected | Error handling |
|---|---|---|---|
| Root | `GET /` | `index.html`, `text/html` | none |
| Query | `GET /sw.js?x=1` | the `sw.js` file; logged path `/sw.js` | none |
| Navigate fallback | navigation to a missing path (`Sec-Fetch-Mode: navigate`) | `index.html`, 200, HTML | none |
| Missing, not navigate | same-origin `fetch` of a removed `sw.js` | 404, logged | none |
| Outside root | raw request whose decoded path leaves the copy | 404 | none |
| Swap | `swap('sw.js', x)` then a `GET` | new content (temp file + `rename`) | none |
| No-prompt pass | idle board, only App's live region | resolves | none |
| No-prompt fail | New game confirm (`dialog`); injected `alertdialog`; `alert`; an extra `status` with `aria-live="polite"`; an extra plain `status`; App's region removed | rejects (one case each) | none |
| B redundant / `failed` | state poll sees `failed`, or B's handle sees `redundant` | fail at once with the request log | a test fix, not the D route |
| Early activation | marker B, or `swState()` `active` after `waiting` was seen, on a page while another page is open or after a reload (steps 2–3) | test fails with the label `A-A15 timing differs (SPEC Assumptions, G3)` | stop the build for Jared |

</intent-contract>

## Code Map

- `e2e/helpers/dist-test.ts` -- `buildRoot()` (throws unless `PW_PREVIEW` is set: only the update spec calls it; the helper cases never do).
- `e2e/helpers/live-region.ts` -- `REGION = '[role="status"][aria-live="polite"]'`; add `expectNoPrompt` here.
- `e2e/helpers.spec.ts` -- `AD-17` self-tests; `beforeEach` skips all but `android`; `describe` blocks per helper; imports from `./helpers/*`. Add two `describe`s at the end.
- `e2e/confirm.spec.ts:18-31` -- opening the New game confirm: Menu button → `dialog` "Menu" → row "New game"; `session-idle-empty-column` (one move) opens the confirm `dialog` "Start a new game?" (a fresh deal acts at once).
- `e2e/pwa/test-hook.spec.ts` -- the `swState()` poll idiom (`page.evaluate(() => window.__wordcell?.swState())`, 15 s).
- `playwright.pwa.config.ts` -- `pwa` project (Pixel 7, `dist-test/`, every `e2e/pwa/` spec except `dist-smoke.spec.ts`); `dist-smoke` `testMatch` omits the new spec. No config change.
- `dist-test/sw.js` -- one `{url:"index.html",revision:"<32 hex>"}` entry (minified, no spaces); `dist-test/index.html` has one `<head>`.
- `src/ui/App.svelte:106` -- App's live region. `Panel.svelte` and `WordCellView.svelte` keep inert `role="dialog"` nodes, which `getByRole` does not count (`e2e/history.spec.ts:289` shows `getByRole('dialog')` at 0 on an idle board).
- `src/shell/game.svelte.ts:351` -- the `storage` listener halts another page with Q-38. A halted page never registers (`swState()` stays `unregistered`), so a page open across a close gets no state poll.

## Tasks & Acceptance

**Execution:**
- [x] `e2e/helpers/static-server.ts` -- `copy(srcDir): Copy`: `mkdtempSync(join(tmpdir(), 'wordcell-site-'))` plus `cpSync` recursive. `Copy` = `{ dir; swap(file, content); remove(file); serve(): Promise<Served>; stop(): Promise<void> }` and `Served` = `{ url; requests(): Logged[]; stop }`, with the same `stop`. `Logged` = `{ path, mode: string | null, status }`. `swap` writes a temp file in the target's dir and then `renameSync`s it. `remove` uses `rmSync` without `force`, so a missing file throws. `serve` listens on `127.0.0.1` port 0 and sets `url` to `http://127.0.0.1:<port>`. On each request it reads from disk and takes the pathname only (query dropped), `decodeURIComponent`d and resolved under `dir`; a path outside `dir` gets 404. `/` maps to `index.html`. A missing file or a directory gets `index.html` only when `sec-fetch-mode` is `navigate`; otherwise 404. Content type comes from the served file's extension (html, js `text/javascript`, css, json, webmanifest, svg, png, ico, woff2, txt; unknown types `application/octet-stream`) with `Cache-Control: no-store`. Every request is logged. `stop()` is idempotent: it calls `closeAllConnections()`, then `close()`, then removes `dir`. -- F8, ticket interface.
- [x] `e2e/helpers/live-region.ts` -- `export async function expectNoPrompt(page)`, a snapshot taken after the caller's state poll settles. It needs exactly one `locator(REGION)` and exactly one `getByRole('status')`, and that status must match `REGION` (`getByRole('status').and(locator(REGION))` count 1). It needs zero `getByRole('dialog' | 'alertdialog' | 'alert')`. It uses plain `expect(await …count()).toBe(n)` (no auto-retry), and each failure message names the role. -- AD-16 no prompt.
- [x] `e2e/helpers.spec.ts` -- add `describe('static server')`. Each case uses a synthetic temp src (`index.html`, `sw.js`, `assets/a.css`) and cleans up in `finally`. Cases, each named `AD-17 …`: `/` gives `index.html` as HTML, logged `navigate`/200; `swap` changes the next same-origin `fetch`; `/sw.js?x=1` gives the file, logged `/sw.js`; `page.goto` to a missing path gives `index.html`, 200, logged `navigate`; `remove('sw.js')` then `fetch('/sw.js')` gives 404, logged non-`navigate`/404; a raw `node:http` request to `/..%2f<file>` gives 404; `stop()` removes `dir`. Add `describe('no-prompt check')`: the idle board (`session-idle-fresh`) passes. Each forbidden case from the Matrix rejects (`await expect(expectNoPrompt(page)).rejects.toThrow()`): the confirm through the menu on `session-idle-empty-column`; the others are elements injected by `page.evaluate`, or App's region removed. -- Matrix rows.
- [x] `e2e/pwa/update.spec.ts` -- see Design Notes; the two tests are named `Q-40 AD-16 A-A15 build B stays waiting on reloads and while pages open and close: every page keeps marker A, no prompt` and `Q-40 AD-16 A-A15 build B activates only once every page has closed: a new page shows marker B, controlled, active, no prompt`. -- CAP-4.

**Acceptance Criteria:**
- Given `npm run test:e2e`, when the `AD-17` static-server and no-prompt cases run on `android`, then each passes.
- Given `npm run test:e2e:pwa`, when `update.spec.ts` runs, then both `Q-40 AD-16 A-A15` tests pass. If one fails on the `A-A15 timing differs` label, the plan records the timing and the reason, and the run HALTs `blocked` for Jared's §6.4 acceptance (no skip, no deletion, no kind change).
- Given the full suite, when `npm run test:all` runs, then it is green.

## Design Notes

Local helpers in the update spec:
- `marker(page)`: the content of the single `meta[name="wc-build"]` (count 1).
- `controlled(page)`: whether `navigator.serviceWorker.controller` is non-null.
- `pollState(page, want, site, opts)`: a 100 ms loop. `failed` throws at once with `site.requests()`. On timeout (15 s) it throws with the last value. When `opts.afterWaiting` is set and it sees `active`, it throws `A-A15 timing differs (SPEC Assumptions, G3)`.
- `replaceOnce(text, anchor, value)`.

Shared setup (steps 1–2):
1. Copy `buildRoot()`. Insert marker A with `replaceOnce('<head>', '<head>\n    <meta name="wc-build" content="A">')`. Serve the copy and `goto` `${url}/`. Poll `active`. Reload; `controlled` true, marker A, poll `active`.
2. Take `mark = requests().length`. `swap('index.html', B)`, where B = A's HTML with `replaceOnce` of marker A → marker B. Then `swap('sw.js', …)`, replacing the whole `/\{url:"index\.html",revision:"[0-9a-f]+"\}/g` entry, which must match exactly once, with `{url:"index.html",revision:"<md5 of B's index.html>"}`. Assert the new revision differs from the old one. Reload. Poll the log for a `/sw.js` 200 after `mark`, bounded at 10 s. On a miss, call `page.evaluate(() => navigator.serviceWorker.getRegistration().then((r) => r?.update()))` and add a `test.info().annotations` entry `update-fallback`. Poll `waiting`. Marker A, then `expectNoPrompt`. Reload again: poll `waiting` (`afterWaiting`), marker A, `expectNoPrompt`.

A-side test (step 3), page 1 being the original:
- Open page 2: marker A, `controlled`, poll `waiting` (`afterWaiting`).
- Close page 1. Page 2 is now open across a close: marker A only (it may show Q-38).
- Open page 3: marker A, `controlled`, poll `waiting` (`afterWaiting`).
- A marker B on any page throws the timing label.

All-closed test (step 4), after the shared setup:
- With page 1 open, B's handle is the single `context.serviceWorkers()` entry whose `evaluate(() => self.registration.waiting === self.serviceWorker)` is true. Exactly one must match; none is an observation fault.
- Close every page and assert `context.pages()` is empty.
- Poll `handle.evaluate(() => self.serviceWorker.state)` to `activated`, 30 s; `redundant` fails at once with the log.
- If the poll times out or the handle closes, open one probe page. Marker A throws the timing label; marker B throws `observation fault`. Both fail the test.
- Then open a new page: marker B, `controlled`, poll `active`, `expectNoPrompt`.
- Annotate the route (`worker-handle`).

Each test calls `test.setTimeout(120_000)`; trim this from the measured run.

Sentence → test map:
- Q-40 "does not activate on reload": shared step 2's two reloads (`waiting`, marker A).
- "while any page stays open … two pages, one closed, another opened: still A": the A-side test's pages 2 and 3 (marker A, `controlled`, `waiting` polls), page 2's marker after the close (page 2 not reloaded or replaced), and the 5 s hold (`HOLD_MS`) after page 3's checks, in which page 3's `swState()` stays `waiting` with pages 2 and 3 open after page 1's close.
- "all closed: B": the all-closed test's final page.
- AD-16 no-prompt row, update part: the single reloaded page (shared step 2), plus the final marker-B page (step 4, the same check the AC mentions).

Planning probe (2026-10-30, Playwright 1.63 Chromium, `dist-test/` copy):
- `Sec-Fetch-Mode: navigate` reaches `127.0.0.1` on uncontrolled navigations.
- B's install fetch is plain `/index.html` (`cors`, no query).
- B stays `waiting` across two reloads and a second page.
- B activated about 1.0 s after the last page closed. The `context.serviceWorkers()` handle evaluates with no page open.
- The browser-level CDP `ServiceWorker.enable` does not exist ("wasn't found"), so the CDP version route is unavailable. Only the handle route is used, and the plan records this.
- A controlled page's navigation to a missing path is answered by the worker, not the server. That is why the navigate-branch case uses an uncontrolled synthetic copy.

## Verification

**Commands:**
- `npx playwright test e2e/helpers.spec.ts --project android -g "static server|no-prompt"` -- expected: all pass.
- `npm run build:test && PW_PREVIEW=dist-test npx playwright test -c playwright.pwa.config.ts --project pwa e2e/pwa/update.spec.ts --repeat-each 3` -- expected: 6 passed (timing stable).
- `npm run lint && npm run check` -- expected: clean.
- `npm run test:all` -- expected: exit 0.

## Implementation Notes

How the review log's Result minors are resolved:
- (1) step 3 polls every new page right after it opens, and no page after a close (Design Notes).
- (2) Content type follows the served file, so `/` and the fallback serve `index.html` as HTML.
- (3) A `redundant` handle fails at once with the log.
- (4) The D-route observable is marker B, or `active` after `waiting`, with a page open or after a reload (the timing label). Any other poll timeout is a test fix.
- (5) The log holds the pathname, and there is a query case.
- (6) The CDP route is unavailable (planning probe). The route is recorded per run as an annotation, and a missing handle is an observation fault.
- (7) One `copy(srcDir)` signature, whose `stop()` removes `dir`.
- (8) The replace anchors on the whole entry, and the new value is B's MD5.
- (9) The sentence map cites pages 2 and 3.
- (10) The 10 s log bound comes before the `update()` fallback, with an annotation.
- (11) `expectNoPrompt(page)` sits in `live-region.ts`.
- (12) The AC's final-page check is step 4's check: one check, not two.

Earlier passes' minors adopted: the full MIME map, `closeAllConnections`, the snapshot count, the original page closing, `retries: 0`, `no-store`, the `dialog` case on a one-move fixture, `controlled` on new pages, `stop()` after the pages close, both probe outcomes failing, `context.pages()` empty, and the test names and file recorded.

Residual risks: CAP-9 syncs the F8 and build-notes wording to the as-built behaviour (no `?__WB_REVISION__` fetch, no CDP route, handle-only observation).

As built (2026-10-30, Playwright 1.63 Chromium):
- Both update tests pass and Chromium's timing matches A-A15: there is no `A-A15 timing differs` result and no D route. `--repeat-each 3` gave 6 of 6 passing, about 3.8 s (A-side) and 4.5 s (all-closed) per test. Every run used the `worker-handle` route, and no run needed `update-fallback`, because the reload's own update check fetched `/sw.js`.
- `test.setTimeout` is 150 s, not 120 s. That covers the sum of the bounded waits one test can hit (115 s) plus time for page loads, so each bounded wait fails with its own message before Playwright's generic timeout.
- The 7 static-server and 8 no-prompt `AD-17` cases pass on `android`, and `npm run test:all` exits 0.
- The outside-root case sends `Sec-Fetch-Mode: navigate`, and its path resolves to a file that exists outside the copy (the synthetic source's `index.html`). The 404 therefore shows that the root check runs before both the file lookup and the navigate fallback. The `remove` case also checks that a second `remove` throws (`ENOENT`).
- As built, matrix audit: the Matrix rows "B redundant / `failed`" and "Early activation" describe the update spec's own failure branches, and no test checked them. `update.spec.ts` now has three `AD-17` self-tests. (1) With `sw.js` removed, `pollState` rejects at once on `failed`, and the message holds the request log (`404 … /sw.js`). (2) With page 1 open, a build C written over B and found by a reload replaces waiting B; the activation poll rejects at once with "turned redundant" and the log. (3) The test sends `SKIP_WAITING` to waiting B with page 1 open, so the `afterWaiting` state poll and a new page's `expectMarkerA` both reject with the timing label. To make this possible, step 4's identification and poll became `waitingHandle(context)` and `pollActivated(handle, served, context)`; the all-closed test uses them, with the same name and passing path. Test (2) found a real defect. The spec's Install algorithm terminates a replaced waiting worker before it marks it `redundant`, so B's own handle closes without ever reading `redundant`. The old poll then opened a probe page, saw marker A and threw the timing label, which would have stopped the build for Jared on what is a test fault. The fix: `waitingHandle` also requires exactly one active worker (A) and installs a `statechange` recorder for B in A's scope. Once B's handle closes, `pollActivated` reads B's state from A's record. `--repeat-each 3` gave 15 of 15 passing.

## Plan Change Log

- 2026-10-30 (code review): `update.spec.ts` has five tests, not the ticket AC's "two tests": the two `Q-40 AD-16 A-A15` tests plus three `AD-17` self-tests of the spec's own failure branches (Implementation Notes, matrix audit), and `test.setTimeout` is 150 s, not 120 s. The `redundant` and `SKIP_WAITING` self-tests call `setup()` (steps 1–2), so a G3 acceptance that removes the tests for shared steps 1–2 also removes them (a comment above the self-tests says so).
- 2026-10-30 (code review, rule 7 technical deviation from ticket step 4): `waitingHandle` also requires exactly one active worker (A) at identification and installs a `statechange` recorder for B in A's scope; `pollActivated` reads B's state from A's record once B's handle closes (a replaced waiting worker is terminated before it turns `redundant`). Step 4 named only B's handle. The CAP-9 residual-risk line stays.

## Review Triage Log

### 2026-10-30 — Review pass
- verdicts: 33 findings — high 0, medium 2, low 22, false 9, maybe-false 0
- findings:
  - `[medium]` `[patch]` (blind) SKIP_WAITING self-test race: the poll could read `waiting` before B activates and resolve — the evaluate now awaits one `controllerchange` after posting.
  - `[low]` `[patch]` (blind) 60 s test timeout below the sum of bounded waits (setup 70 s + 30 s activation poll), so a generic timeout could pre-empt the labelled probe — `TEST_TIMEOUT_MS` 150 s, comment states it covers the sum (115 s) plus loads.
  - `[low]` `[reject]` (blind) static-server handler throws (`decodeURIComponent`, `statSync`/`readFileSync`) crash the worker unlogged — browsers and the specs send valid paths; a throw already fails fast (rule 6); handling adds branches.
  - `[false]` `[reject]` (blind) `expectNoPrompt` misses native dialogs, live-region text and role-less banners — the check is SPEC CAP-4/build-notes' definition (roles `dialog`, `alertdialog`, `alert`, `status` besides App's region); AD-16 prompt surfaces are judged by those roles.
  - `[false]` `[reject]` (blind) A-side test never runs the no-prompt check on page 3 — SPEC CAP-4 and rule-coverage scope the update no-prompt check to the single reloaded page and the final marker-B page; the multi-page step is "markers only".
  - `[low]` `[reject]` (blind) static-server self-tests omit directory paths, css/octet-stream types, double `serve`, unserved `stop`, closed-server check — every ticket-listed branch is covered; the rest are unlikely to regress unnoticed and add cases beyond the ticket's list.
  - `[low]` `[patch]` (blind) `expectNoPrompt`'s third assertion has no self-test — grouped with verification-gap; added `AD-17 expectNoPrompt rejects a lone status role that is not App's live region` (App's region `aria-hidden`, injected plain status).
  - `[low]` `[patch]` (blind) header comment says A and B differ only in `index.html` though B's `sw.js` revision changes — reworded.
  - `[low]` `[reject]` (blind) `swap`/`remove` do not confine paths to the copy — callers pass fixed literals (`index.html`, `sw.js`); guard adds a branch for a mistake nobody makes.
  - `[low]` `[reject]` (blind) `inSlot` evaluating a closed worker gives a raw Playwright error — no run met it; any error still fails the test with its trace; catch adds a branch.
  - `[false]` `[reject]` (blind) stray `/` in `AD-17 / serves index.html…` — the `/` is the root path under test.
  - `[low]` `[reject]` (edge) malformed percent-encoding / NUL in the request path throws in the listener — same root as the blind handler-throws row.
  - `[low]` `[reject]` (edge) file removed between `statSync` and `readFileSync` — `swap` renames atomically and no spec removes during a request.
  - `[low]` `[reject]` (edge) `serve()` after `stop()` on an unserved copy — no caller does this; a server on a deleted dir fails loudly on every request.
  - `[low]` `[reject]` (edge) `server.close` rejection leaks the copy and caches the rejection — `close` rejects only when not listening, which the handle never reaches; a guard adds complexity.
  - `[low]` `[reject]` (edge) early activation before `waiting` is ever seen in step 2's first poll yields a generic timeout (last `active`), not the timing label — Chromium was verified to keep B waiting; the timeout message names the last state and the request log, and any failure stops the build either way; classifying it needs new branches (residual risk).
  - `[medium]` `[patch]` (edge) SKIP_WAITING self-test race — same root as the blind row; same fix.
  - `[false]` `[reject]` (edge) B's handle closing before `activated` reports a correct activation as an observation fault — that is ticket step 4's specified outcome (marker B on the probe → observation fault, a test fix); A's recorder now narrows it.
  - `[low]` `[reject]` (edge) B leaving the waiting slot between `inSlot` and the recorder install gives a TypeError — a sub-millisecond race with no trigger in the flow; fails loudly.
  - `[low]` `[reject]` (edge) `inSlot` on a closed entry — same as the blind `inSlot` row.
  - `[low]` `[patch]` (edge) timeout below the sum of bounds — same root as the blind row; same fix.
  - `[false]` `[reject]` (edge) role-less DictionaryBanner passes `expectNoPrompt` — the banner is the Q-42 surface, not an update prompt; the check follows the SPEC's role definition.
  - `[low]` `[reject]` (edge, claim) the matrix's "after a reload" early-activation label is not reached on step 2's first reload — same root as the step-2 generic-timeout row; recorded as residual risk.
  - `[low]` `[reject]` (edge, claim) "every request is logged" fails when the handler throws — same root as the handler-throws row.
  - `[low]` `[patch]` (verification-gap) third `expectNoPrompt` assertion unverified — same root as the blind row; same new case.
  - `[low]` `[reject]` (intent) A's `statechange` recorder is a third observation route beyond the intent's two; plan residual says "handle-only" — it is derived from the worker-handle route (A's handle) and only fills in when B's handle closes; the wording fix edits the plan (Auto Run Result records it).
  - `[low]` `[patch]` (intent) the timing label is thrown before control is checked, so an uncontrolled page (marker B from the network) would read as D, which the AC forbids — pages 2 and 3 now assert `controlled` before `expectMarkerA`.
  - `[false]` `[reject]` (intent) five tests vs the AC's "two tests" — the AC counts the `Q-40 AD-16 A-A15` tests (its D-acceptance removal logic covers only those); the three `AD-17` self-tests test spec-local functions and do not claim rule coverage.
  - `[low]` `[patch]` (intent) after the `registration.update()` fallback the `/sw.js` 200 is never asserted — `fetched()` now asserted after the `waiting` poll on both branches.
  - `[false]` `[reject]` (intent) no-prompt check is a snapshot over the accessibility tree — the chosen reading (ticket review pass 2 minor: snapshot after the state poll; pass 3: `getByRole`).
  - `[low]` `[patch]` (intent) 30 s/60 s timeouts only "generous" vs the measured run — grouped with the timeout-sum row; test timeout now 150 s; the 30 s activation bound is about 30× the measured 1 s.
  - `[false]` `[reject]` (intent) "plan records" items live outside the diff — by design: the plan records them (Design Notes probe, Implementation Notes).
  - `[false]` `[reject]` (intent) small surface differences (marker A written before first `goto`, page 1 closed, `/` name) — all within the intent; no defect.

## Auto Run Result

**Summary:**
- `e2e/helpers/static-server.ts` (F8) copies a build dir to a temp dir, swaps files atomically or removes them, and serves the copy from disk on `127.0.0.1:<port 0>`.
  - It resolves the pathname (query dropped) under the copy and maps `/` to `index.html`.
  - A missing path gets `index.html` only on `Sec-Fetch-Mode: navigate`; any other missing path is 404, `/sw.js` included.
  - It sets the content type from the served file's extension and sends `no-store`.
  - It logs `{ path, mode, status }` for every request.
  - `stop()` is idempotent and removes the copy.
- `expectNoPrompt(page)` sits beside `REGION`. It is hook-free and takes a snapshot: App's live region must be the only `status`, and there must be no `dialog`, `alertdialog` or `alert`.
- `e2e/pwa/update.spec.ts` proves CAP-4's update rule on a marked `dist-test/` copy with two `Q-40 AD-16 A-A15` tests:
  - The A-side test: B stays `waiting` with marker A across two reloads, a second page, a close and a third page.
  - The all-closed test: B's worker handle reaches `activated` once every page has closed, and a new page shows marker B, controlled, `active`, with no prompt.
- Three `AD-17` self-tests cover the spec's own failure branches (`failed`, a replaced B turning `redundant`, early activation through a test-sent `SKIP_WAITING`).
- Chromium's timing matches A-A15, so there is no D gap and no owner acceptance is needed.
- Observation route: `worker-handle`. The browser-level CDP `ServiceWorker` domain does not exist in Playwright 1.63's Chromium.
- No run needed the `registration.update()` fallback.
- `Sec-Fetch-Mode: navigate` is sent to `127.0.0.1`.
- B's install fetch is a plain `/index.html`.

**Files changed:**
- `e2e/helpers/static-server.ts` — new F8 static server (`copy` → `dir`/`swap`/`remove`/`serve`/`stop`; `Served` = `{ url, requests(), stop() }`).
- `e2e/helpers/live-region.ts` — `expectNoPrompt(page)`.
- `e2e/helpers.spec.ts` — `AD-17` static-server cases (7) and no-prompt cases (8).
- `e2e/pwa/update.spec.ts` — the two `Q-40 AD-16 A-A15` update tests plus three `AD-17` self-tests of the spec's failure branches.

**Review findings:** 33 findings (high 0, medium 2, low 22, false 9).
- Patched 6 entries:
  - 1 medium: the SKIP_WAITING self-test race. The test now awaits `controllerchange`.
  - 5 low:
    - the test timeout is raised to cover the sum of the bounds (150 s);
    - a self-test now covers `expectNoPrompt`'s third assertion;
    - the header comment is reworded;
    - pages 2 and 3 now check `controlled` before the marker;
    - the `/sw.js` 200 is asserted on both branches of step 2.
- Deferred: none.
- Rejected, with reasons in the Review Triage Log:
  - the static-server handler throwing on malformed paths and the stat/read race;
  - serve-after-stop and close rejection;
  - `swap`/`remove` path confinement;
  - `inSlot` and recorder-install races on closed workers;
  - extra static-server cases beyond the ticket's list;
  - the step-2 first-poll early-activation label (residual risk);
  - A's recorder described as a third route (plan wording);
  - 9 `false` rows: no-prompt scope per SPEC (native dialogs, banner, page 3), the stray `/` name, the handle-closed outcome as specified, "five tests", snapshot semantics, plan-recorded items, and small surface differences.

**Follow-up review recommendation:** `false`. This was the first pass, with patched entries at high 0, medium 1, low 5.

**Verification:**
- `npm run lint` and `npm run check` are clean.
- The `AD-17` helper cases pass on `android`.
- `update.spec.ts` with `--repeat-each 3` passed 15 of 15 after the patches.
- `npm run test:all` exited 0 before and after the patches. After the patches: unit 3,684 passed, `dist-smoke` 22 passed, dev e2e 1,141 passed, `pwa` 24 passed. Size budget 560,683 / 600,000 (margin 39,317).
- Matrix audit: every I/O Matrix row has a named test that ran and passed. The two failure-branch rows are covered by the `AD-17` self-tests in `update.spec.ts`.

**Residual risks:**
- CAP-9 syncs SPEC F8 and the build-notes wording to the as-built behaviour:
  - no `?__WB_REVISION__` install fetch;
  - the browser-level CDP route is unavailable;
  - observation runs through B's worker handle, plus a `statechange` recorder in A's scope once B's handle closes;
  - the all-closed test needs exactly one waiting and one active worker at identification.
- If Chromium ever activated B early during step 2's first `waiting` poll (before `waiting` was seen), the poll times out with state `active`; once the `/sw.js` 200 was fetched, `setup` reloads page 1 once and throws the `A-A15 timing differs` label if it is controlled and shows marker B, otherwise it rethrows the timeout with the request log.
- The static server's request handler throws, uncaught, on a malformed percent-encoding (fail fast, rule 6); no spec sends one.
- The pause at the ticket's plan checkpoint (`plan_checkpoint: true`) was not honoured, because the invocation did not direct a halt after planning.
