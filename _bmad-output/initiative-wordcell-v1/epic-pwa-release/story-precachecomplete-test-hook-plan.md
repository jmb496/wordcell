---
title: 'precacheComplete() test hook'
type: 'feature'
ticket: '4'
created: '2026-10-30'
baseline_revision: '8e132f09c2fcb5079baf0b70d1adbbcd658d998a'
status: 'built'
route: 'full'
route_source: 'auto'
review: 'thorough'
review_source: 'auto'
lenses_ran: ['blind-hunter', 'edge-case-hunter', 'verification-gap', 'intent-alignment']
review_loop_iteration: 0
followup_review_recommended: true
context:
  - '{project-root}/_bmad-output/initiative-wordcell-v1/epic-pwa-release/story-precachecomplete-test-hook.md'
  - '{project-root}/_bmad-output/specs/spec-epic-7-pwa-release/build-notes.md'
warnings: ['oversized']
deferred: []
---

<intent-contract>

## Intent

**Problem:** The offline, update and Q-42 specs (entries 5–7) need to know when the generated worker is activated and its whole precache is in Cache Storage; the AD-17 hook has only five keys and no `precacheComplete()`.

**Approach:** Add `precacheComplete()` (sixth key) to the env-gated hook in `src/shell/test-hook.ts`, backed by two exported hook-module functions, `precacheUrls(source)` (pure parse of `/sw.js`'s single `precacheAndRoute([` array) and `recomputePrecacheComplete()` (async recompute, newest-start-wins write), tree-shaken from `dist/` and checked by `dist-smoke`. The story file's Description and Acceptance Criteria are the full rule text; this plan adds only resolutions and locations.

## Boundaries & Constraints

**Always:** code only in `src/shell/test-hook.ts` (never `sw.ts`, `sw-state.ts`, `main.ts`); the module reads `navigator`, `fetch`, `caches` and `location` as bare globals (Vitest stubs each with `vi.stubGlobal`; `load()` keeps stubbing `window` as `{}`); every failure rejects and is never caught (rule 6, AD-15 via `main.ts` `unhandledrejection`); the URL promise is one module-level promise, kept even when rejected; the six-key list changes together in `test-hook.ts`, `test-hook.test.ts`, `e2e/globals.d.ts`, `e2e/test-hook.spec.ts`, `e2e/pwa/test-hook.spec.ts`; test names start with their ids (`AD-17` for shell Vitest).

**Never:** a hand-written or build-time URL list; an online check, retry, catch or `false` on failure; recomputes at boot or on activation; importing `e2e/helpers/precache.ts` (Node `vm`) into `src/`; anything pulling `workbox-window` into the main chunk; touching the generated `sw.js` policy, `vite.config.ts` (no `cacheId`) or any engine file; editing the ticket file.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Complete | activated worker, every URL a `workbox-precache*` key (revision stripped) | `true` | none |
| No worker | no `navigator.serviceWorker`; `getRegistration()` → `undefined`; `active: null`; `activating` | `false`, no fetch | none |
| Partial | one URL missing, or only in a cache of another name | `false` | none |
| Later calls | after the first fetch | Cache Storage only, never a 2nd fetch | none |
| Race | older recompute settles after newer | newer value kept; older resolves with it | none |
| Failure | rejected `getRegistration()` / `caches`, rejected fetch, non-OK (status in message), parse throw | value unchanged; recompute rejects; URL-promise failures repeat on every call with fetch count 1 | uncaught → AD-15 |

</intent-contract>

## Code Map

- `src/shell/test-hook.ts` -- hook module; `Window['__wordcell']` declaration gains `precacheComplete(): boolean`; add module state (`value=false`, start counter, last-written number, `urls: Promise<string[]> | null`), `precacheUrls`, `recomputePrecacheComplete`, and the accessor `precacheComplete: () => { void recomputePrecacheComplete(); return value; }` inside the existing gate.
- `e2e/helpers/precache.ts` -- `arraySlice` (string-aware scan) and `CALL`: copy the logic into the hook module (not importable); add a page-side `precacheMissing(page, urls): Promise<string[]>` (same comparison: caches named `workbox-precache*`, `__WB_REVISION__` stripped, URLs resolved against `new URL('/sw.js', location.href)`), for this ticket's pwa test and entry 6's `dist-smoke` poll.
- `src/shell/test-hook.test.ts` -- `load()` (fresh module, `window` stub), `afterEach(vi.unstubAllGlobals)`, five-key list → six.
- `e2e/test-hook.spec.ts` -- dev key list; the `AD-16 AD-17 the dev server never requests src/shell/sw.ts …` test.
- `e2e/pwa/test-hook.spec.ts` -- test-build key list; existing `swState()` poll with `{ timeout: 15_000 }` is the pattern.
- `e2e/pwa/dist-smoke.spec.ts` -- `AD-18 no file in dist/ contains __wordcell` and `walk` from `e2e/helpers/dist-test` are the pattern for the new chunk check.
- `e2e/globals.d.ts` -- mirror type.
- `e2e/helpers.spec.ts` -- helper cases live here (dev server project).
- `src/main.ts:64,82` `fatal` -- read-only; repeat-tolerant (see Design Notes).
- Sample source: `dist/sw.js` (`npm run build:test` writes `dist-test/sw.js` of the same shape): `precacheAndRoute([{url:"index.html",revision:"…"},…,{url:"assets/index-….js",revision:null}],{}),e.cleanupOutdatedCaches()…`.

## Tasks & Acceptance

**Execution:**
- [x] `src/shell/test-hook.ts` -- implement per story Description: `precacheUrls` (exactly one `precacheAndRoute(`, whitespace, `[`, string-aware close, matches by `/url:"([^"\\]*)"/g`, ≥1 match and `url:` count equal to match count, else throw `AD-17 sw.js: …`); `recomputePrecacheComplete` (number, registration check, shared `new URL('/sw.js', location.href)` fetch+parse promise, non-OK throws with status, union over `workbox-precache*` caches, write only if number > last written, resolve with stored value); add the key; update the header comment -- CAP-2.
- [x] `src/shell/test-hook.test.ts` -- six-key list; new `describe('AD-17 precacheComplete')` covering every Vitest bullet of the story AC. Fakes resolve on microtasks, so flush one macrotask (`await new Promise((r) => setTimeout(r, 0))`) after every accessor call and before each case ends (before `vi.unstubAllGlobals()` runs); read the `getRegistration()` count after the flush; "the next call returns `true`" is the second accessor call, which makes the second `getRegistration()` call. The no-fetch-on-fresh-instance check covers four fakes by name: no `serviceWorker`, `getRegistration()` → `undefined`, `active: null`, `activating`. Parse fixture: an excerpt of today's `dist/sw.js` (mixed revisioned and `null` entries, trailing `,{}`); throws include an escaped entry (`url:"a\"b"`) -- story AC.
- [x] `e2e/helpers/precache.ts` + `e2e/helpers.spec.ts` -- add `precacheMissing`; one case `AD-17 precacheMissing …` on the dev page: cache `workbox-precache-v2-test` holding `/a.js?__WB_REVISION__=1` and `/b.css`, cache `other` holding `/c.txt`; `['a.js','b.css','c.txt']` → `['c.txt']`.
- [x] `e2e/globals.d.ts` -- `precacheComplete(): boolean;` with an AD-17 comment.
- [x] `e2e/test-hook.spec.ts` -- key list → six; rename the dev test to end `… stays unregistered and precacheComplete() stays false`; attach a `pageerror` collector before `goto`; after the dictionary poll: macrotask + `networkidle` (existing), call `precacheComplete()` → `false` (not `undefined`), settle by evaluating `await navigator.serviceWorker.getRegistration()` plus a macrotask, then a second `networkidle`, read again → `false`; then assert `current().kind` is `active`, no page errors, no `/sw.js`, `/src/shell/sw.ts` or `workbox-window` request, `swState()` `unregistered`.
- [x] `e2e/pwa/test-hook.spec.ts` -- key list → six; new test `AD-17 precacheComplete() polls to true once the worker is activated and every precache manifest URL is cached`: `expect.poll(…precacheComplete(), { timeout: 15_000 }).toBe(true)`, then `precacheMissing(page, (await readPrecacheManifest(request)).map((e) => e.url))` → `[]`.
- [x] `e2e/pwa/dist-smoke.spec.ts` -- new test `AD-17 AD-18 no app chunk in dist/assets contains precacheAndRoute or __WB_REVISION__` (asserts at least one `assets/*.js` scanned).

**Acceptance Criteria:**
- Given `npm run build`, when `dist-smoke` runs, then no `dist/` file holds `__wordcell` and no `dist/assets/*.js` holds `precacheAndRoute` or `__WB_REVISION__`, and `build-output.spec.ts` (worker only from the `sw.ts` chunk) stays green.
- Given `npm run test:all`, then lint, check, unit (under the 5 s budget), build with size budget, `dist-smoke`, `test:e2e` and `pwa` all pass.

## Implementation Notes

Review-log unapplied minors, resolved: (1) macrotask flush and second-call `getRegistration()` count — Tasks, Vitest; (2) pwa file and test name — Tasks; (3) "or escaped" kept: the match excludes backslashes (`url:"([^"\\]*)"`), so an escaped entry leaves the `url:` count above the match count and throws; (4) dev un-halted check (`current().kind` `active` and no `pageerror`) — Tasks; (5) second `networkidle` after the settle step, request paths read after it — Tasks; (6) the four no-fetch fakes named — Tasks; (7) bare globals stubbed with `vi.stubGlobal` — Always; (8) `fatal` tolerates repeats, no guard in the hook — Design Notes; (9) `url:` count not string-aware — accepted, Design Notes; (10) "proved by" → "checked by": this plan's wording; the build never writes the ticket file, so the ticket keeps its text.

## Plan Change Log

## Review Triage Log

### 2026-10-30 — Review pass
- verdicts: 23 findings — high 0, medium 4, low 7, false 10, maybe-false 2
- findings:
  - `low` `patch` (blind) resolution base untested: `location` stubbed at the origin root — patched: `location.href` stubbed at `${ORIGIN}/play/?seed=1`; resolving against it fails 13 cases.
  - `low` `patch` (blind) union over several `workbox-precache*` caches untested — patched: case `AD-17 recompute takes the union of every workbox-precache* cache`.
  - `low` `patch` (blind) "revisions ignored" untested: KEYS revisions equal SW_SOURCE's — patched: the `index.html` key carries a different `__WB_REVISION__`.
  - `low` `reject` (blind) older result writing after a newer one rejected is untested — matches the story's literal write rule ("higher than the last written one"); only reachable when a failure already halted the page (AD-15); a new pinning case is more than a direct correction.
  - `medium` `patch` (blind) pwa poll test has no `pageerror`/halt check, so a broken parse fails only as a 15 s timeout — grouped with the edge-case halted-page row; patched: `pageerror` collector before `goto`, then `current().kind` `active` and no errors.
  - `low` `reject` (blind) dist-smoke chunk check has no positive control — a `dist/sw.js` assertion would not prove sensitivity to a leaked hook; reviewers confirmed by grep that `dist-test/assets/index-*.js` holds both strings and `dist/assets/*.js` neither.
  - `false` `reject` (blind) header and `e2e/globals.d.ts` comments misdescribe the accessor — the header's added clause states it returns the last written value and starts a recompute per call; "the last recomputed value" is AD-17 Reading state's own wording (SPEC CAP-9).
  - `low` `reject` (blind) fetch/getRegistration/caches rejections reach AD-15 without an `AD-17` prefix — wrapping needs a catch-and-rethrow, which the story's Failures bullet forbids ("never caught").
  - `low` `patch` (blind) no-fetch cases picked by index (`FALSE_CASES.slice(0, 4)`) — patched: named `NO_WORKER_CASES`, spread into `FALSE_CASES`.
  - `false` `reject` (blind) plan records incomplete (empty triage log, Code Map `value` vs `complete`, line refs) — fix edits this build's plan; the triage log is written by this pass.
  - `false` `reject` (edge) `/sw.js` changing after the active worker installed checks the wrong build — the intent excludes it: "callers reach `true` before any build swap", list per page load.
  - `maybe-false` `reject` (edge) `caches.keys()` then `open()` can recreate a just-deleted cache — recomputes run only once activated, after Workbox's activate cleanup; would settle with a deletion between the two calls in a real update; if true only `low`, fix adds branches.
  - `maybe-false` `reject` (edge) same race in `precacheMissing` — as above, `low` if true.
  - `false` `reject` (edge) `searchParams.delete` reserialises other query params — no manifest URL has a query besides `__WB_REVISION__` (Vite hashed names); the story prescribes `URL.searchParams.delete`.
  - `medium` `patch` (edge) pwa test passes on a page AD-15 halted — grouped with the blind pwa row; patched as above.
  - `medium` `patch` (verification-gap) the accessor's never-caught path is unverified: a `.catch(() => {})` in the accessor passes every test — patched: dev test `AD-15 AD-17 a rejected precacheComplete() recompute reaches the AD-15 halt` (rejecting `getRegistration`, waits for `halted`, alertdialog description `AD-17 test`); fails under the catch.
  - `false` `reject` (intent) tree-shaking checked by two marker strings only — exactly the check the story AC names; one function calls the other, so a leak carries `CALL`.
  - `medium` `patch` (intent) failure routing to AD-15 tested only as unit rejection — grouped with the verification-gap row; patched by the same dev test.
  - `false` `reject` (intent) one fetch per page load proved only in Vitest — the story AC places it in Vitest; a page count would include the browser's own update fetch.
  - `false` `reject` (intent) the started recompute is settled by a macrotask, not awaited — the plan's resolution of the review-log minor; Vitest fails the run on an unhandled rejection.
  - `false` `reject` (intent) `precacheMissing` checks caches, not activation — the story names a cache check (`precacheCached(page, urls)`); entry 6's `dist-smoke` has no hook and pairs it with its own activation wait.
  - `false` `reject` (intent) only `caches.keys()` rejection stands for "a Cache Storage rejection" — the AC asks for one rejected Cache Storage call; `caches.open`/`cache.keys` reject through the same un-caught `await`.
  - `false` `reject` (intent) `rule-coverage.md` row untouched — its AD-17 row already names both spec files.

## Design Notes

Repeat AD-15 reports: a kept rejected URL promise rejects every polled recompute. `main.ts` `fatal` → `game.halt('fatal', text)` replaces the text and stays `halted` (`game.svelte.ts:206`), `clearTheme()` is idempotent, `console.error` repeats harmlessly and `showStandalone()` returns once `surface` is set, so repeats need no guard.

`url:` count: `/url:/g` over the slice is not string-aware, so a `url:` inside a quoted value would throw on a valid manifest. Accepted: Vite hashed names and Workbox revisions (hex) hold no `:`, and the failure is a fail-fast throw, never a false pass.

`URLSearchParams.delete` drops an emptied `?`, so `…/index.html?__WB_REVISION__=x` compares equal to `new URL('index.html', swUrl).href`.

## Verification

**Commands:**
- `npm test` -- expected: green, includes `AD-17 precacheComplete` cases and the six-key list.
- `npm run lint && npm run check` -- expected: clean.
- `npm run test:all` -- expected: exit 0.

## Auto Run Result

**Summary:** `window.__wordcell` gains the sixth key `precacheComplete()` (AD-17, CAP-2): each call starts `void recomputePrecacheComplete()` and returns the last written value; `precacheUrls` parses `/sw.js`'s single `precacheAndRoute([` array; one kept URL promise per page load; union over `workbox-precache*` caches with `__WB_REVISION__` stripped; failures uncaught to AD-15. All behind the hook's env gate and absent from `dist/`.

**Files changed:**
- `src/shell/test-hook.ts` — `precacheUrls`, `recomputePrecacheComplete`, module state, the sixth key and its type.
- `src/shell/test-hook.test.ts` — six-key list; `AD-17 precacheComplete` and `AD-17 precacheUrls` suites (35 cases in the file).
- `e2e/helpers/precache.ts` — page-side `precacheMissing(page, urls)` (same comparison; for entry 6's `dist-smoke` poll).
- `e2e/helpers.spec.ts` — `AD-17 precacheMissing …` case.
- `e2e/globals.d.ts` — `precacheComplete(): boolean`.
- `e2e/test-hook.spec.ts` — six keys; dev test renamed `… and precacheComplete() stays false` (two reads, settle, second `networkidle`, un-halted, no `/sw.js`); new `AD-15 AD-17 a rejected precacheComplete() recompute reaches the AD-15 halt`.
- `e2e/pwa/test-hook.spec.ts` — six keys; `AD-17 precacheComplete() polls to true …` (15 s poll, `precacheMissing` → `[]`, un-halted, no page errors).
- `e2e/pwa/dist-smoke.spec.ts` — `AD-17 AD-18 no app chunk in dist/assets contains precacheAndRoute or __WB_REVISION__`.

**Review findings:** 23 findings; 6 entries patched (2 medium groups: pwa halted-page guard, AD-15 routing test; 4 low: resolution base, cache union, revision ignored, named no-worker cases); 0 deferred; rejected with reasons in the Review Triage Log (10 false, 2 maybe-false at `low` if true, 4 low not worth the added complexity or contrary to the story).

**Follow-up review recommendation:** `true` — first pass patched two `medium` entries (patched counts: high 0, medium 2, low 4). Unverified risk: the two new halt assertions (the dev `AD-15 AD-17` halt test replacing `getRegistration` on the page, and the pwa test's un-halted check) were added after the lenses ran and no lens has read them.

**Verification:** after the patches: `npm run lint`, `npm run check` clean; `npm test` 3713 passed; `npm run build` (size budget) ok; `npm run test:e2e:dist` 23 passed; `npm run test:e2e:pwa` 25 passed; `npm run test:e2e` 1144 passed (1082 skipped by project). These are every `test:all` step; the implementer also ran `npm run test:all` to exit 0 before the review. `dist/assets/*.js` holds neither `precacheAndRoute` nor `__WB_REVISION__`; `dist/` holds no `__wordcell`.

**Residual risks:** unit-suite 5 s budget not measured (only measurable on a Linux-filesystem checkout; ~17 s on `/mnt/d`); `precacheUrls`' `url:` count is not string-aware (accepted, Design Notes); the ticket file keeps "proved by" (the build never writes ticket files; CAP-9 or the owner may reword it).
