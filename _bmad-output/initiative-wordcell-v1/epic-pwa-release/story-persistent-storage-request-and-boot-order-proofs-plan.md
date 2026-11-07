---
title: 'Persistent-storage request and boot-order proofs'
type: 'feature'
ticket: '5'
created: '2026-10-30'
status: done
baseline_revision: 'd3854dd19bcbc5b4081fd5d65aca9f55cc7fca18'
route: 'full'
route_source: 'auto'
review: 'thorough'
review_source: 'auto'
lenses_ran: ['blind-hunter', 'edge-case-hunter', 'verification-gap', 'intent-alignment']
review_loop_iteration: 0
followup_review_recommended: false
context:
  - '{project-root}/_bmad-output/initiative-wordcell-v1/epic-pwa-release/story-persistent-storage-request-and-boot-order-proofs.md'
  - '{project-root}/_bmad-output/specs/spec-epic-7-pwa-release/build-notes.md'
warnings: ['oversized']
deferred:
  - summary: >-
      The F17 path (rejected `sw.ts` chunk import, then `requestPersistence()` on the hook-free `dist/`; no persistence on `dist-test/`, which halts) has no runtime test in this change.
    evidence: |-
      Verification-gap, blind and intent lenses: no route in e2e/ answers the `sw.ts` chunk 404; boot-order.spec.ts only `route.continue()`s it; the F17 source pin in src/architecture-tree-scan.test.ts checks the catch's report condition only. The ticket assigns the proof to entry 7 (tickets.toml entry 7; rule-coverage.md row "Q-40 (F17)": `dist-smoke` shows `persisted`/`persist` after the chunk 404, `pwa` `sw-failure.spec.ts` shows none), reusing e2e/helpers/boot-calls.ts.
    location: >-
      src/main.ts:285
    severity: medium
  - summary: >-
      AGENTS.md still says "`storage.ts` is called only by the shell stores" and lists no `navigator.storage` single owner, while `main.ts` now calls `requestPersistence()`.
    evidence: |-
      Blind lens; the ticket and SPEC CAP-9 assign the AGENTS.md exception and the Single-owners entry to entry 11 (through `bmad-project-context`); agent-context file edits are deferred by rule.
    location: >-
      AGENTS.md (Conventions, Single owners)
    severity: low
---

<intent-contract>

## Intent

**Problem:** AD-7's persistent-storage request (SPEC CAP-3) does not exist, nothing stops `navigator.storage` spreading outside `storage.ts`, and the AD-16 boot order (dictionary settled → registration → persistence; F3 dev; F4 halts) has no P7 proof.

**Approach:** Add `requestPersistence()` to `src/shell/storage.ts` and one guarded call at the end of `main.ts`'s boot; add a `navigator-storage` scan rule with fixtures; add a call-recording init-script helper (`e2e/helpers/boot-calls.ts`) and use it in a new `e2e/pwa/boot-order.spec.ts` (first launch, dictionary 404, dictionary timeout, three F4 halts) and the renamed dev test. The story file's Description and Acceptance Criteria are the full rule text; this plan adds resolutions and locations.

## Boundaries & Constraints

**Always:** `requestPersistence()`: `navigator.storage` absent → return; `await persisted()` true → return; else `await persist()`, result ignored; no catch anywhere (rule 6, AD-15 `unhandledrejection`). `main.ts`: exactly `if (halted()) return; await requestPersistence();` after the whole `if (!import.meta.env.DEV) { … }` block (F3, F4, F17), no catch. Init script via `page.addInitScript` only (never `context.addInitScript`). Every route is a `page.route` on the uncontrolled first-launch page. Test names start with their ids (`AD-7` for shell Vitest; `pwa` cases `AD-16 AD-7 …`, first-launch `AD-8 AD-16 AD-7 …`, halts `AD-16 AD-7 (F4) …`; helper cases `AD-17`).

**Never:** a test-only timeout seam or a change to the timeout row's test kind (if `page.clock` cannot drive the 30 s timeout on `dist-test/`, or disturbs the registration attempt, HALT `blocked` with the evidence); a stubbed `sw.ts` chunk (leaves `sw.registerWorker` undefined); a second page in any case; edits to the ticket file, `sw.ts`, `sw-state.ts`, `test-hook.ts`, `vite.config.ts`, the engine, Session or history; AGENTS.md edits (entry 11 records the `main.ts` → `storage.ts` exception).

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected | Error handling |
|---|---|---|---|
| Absent | `navigator` stubbed `{}` | resolves `undefined`, nothing called | none |
| Persisted | `persisted()` → `true` | no `persist()` | none |
| Not persisted | `persisted()` → `false`, `persist()` → `false` | one `persist()`, resolves `undefined` | none |
| `persisted()` rejects | rejection `e` | rejects with `e`, no `persist()` | uncaught → AD-15 |
| `persist()` rejects | rejection `e` | rejects with `e` | uncaught → AD-15 |

</intent-contract>

## Code Map

- `src/shell/storage.ts` -- 25 lines; header says only module touching `localStorage`: extend to `navigator.storage` (AD-7, epic 7 CAP-3). Add `requestPersistence()`; the absent check mirrors `sw.ts`'s `navigator.serviceWorker === undefined`.
- `src/shell/storage.test.ts` -- `afterEach(vi.unstubAllGlobals)` already; add `describe('AD-7 requestPersistence', …)`.
- `src/main.ts:135-138` boot comment, `:263-281` boot tail (`halted()` at :265, DEV block :266-281, F17 catch :271-276, post-import `halted()` :278). Import `requestPersistence` from `./shell/storage`.
- `src/architecture-tree-scan.test.ts:54` -- F17 source pin slices from `catch (` to the report; keep that region textually as is.
- `src/architecture-scan.ts` -- known-limitation comment :7-10 (aliasing passes); `Rule` union :19; `MATH_RANDOM` :49 (`\s*(?:\?\.|\.)\s*` form); `LOCAL_STORAGE` :53; `check()`: `storageCheck` :551, script check on `full` :578, markup check :605. `navigator` is not an `ENGINE_TOKENS` name, so an engine source with `navigator.storage` reports only the new rule.
- `src/architecture-ad1.test.ts` -- `describe('AD-1 localStorage')` :901 (shell, UI fail; `storage.ts`, string, `localStorageKey` pass); test exemptions :925-944 (shell/UI tests pass, engine test fails `local-storage`); `.d.ts` case :229; markup case :1078. Fixture paths `S`, `ST`, `U`, `UT`, `UV`, `E`, `ET` from the scan module.
- `e2e/helpers/storage-spy.ts` -- pattern for a page helper with a window global, a per-page `WeakSet` and throwing readers.
- `e2e/helpers/dist-test.ts` -- `swChunkFile()` (e.g. `assets/sw-….js`, read from `.vite/manifest.json`).
- `e2e/helpers/restore.ts:75` `isList`; dictionary route pattern `**/en*.txt` (`e2e/dictionary.spec.ts`, whose timeout test `page.clock.install()` + held route is the dev precedent).
- `e2e/globals.d.ts` -- `Window` globals with comments (mirror rule: change with the helper).
- `e2e/helpers.spec.ts` -- `android`-only helper self-tests (dev server, `localhost:5173`); routed-HTML-probe pattern at :1468 (`page.route('**/region-probe', fulfill text/html)`).
- `e2e/test-hook.spec.ts` -- dev test `AD-16 AD-17 the dev server never requests src/shell/sw.ts and swState() stays unregistered and precacheComplete() stays false` (7.1 plan: entry 5 extends and renames it).
- `e2e/pwa/test-hook.spec.ts`, `e2e/pwa/theme.spec.ts` -- `pwa` patterns (`swState()` poll `{ timeout: 15_000 }`, `page.route` on the first uncontrolled `goto`).
- `playwright.pwa.config.ts` -- `pwa` project (`dist-test/`, `baseURL` `http://localhost:4173`) ignores only `dist-smoke.spec.ts`, so `boot-order.spec.ts` runs there only.
- `src/shell/sw.ts` -- read-only: `swState()` leaves `unregistered` only via `recompute()` after `register()` resolves, or `fail()`.

## Tasks & Acceptance

**Execution:**
- [x] `src/shell/storage.ts` -- add `export async function requestPersistence(): Promise<void>` per Always, JSDoc citing AD-7, CAP-3 and that `main.ts`'s call is the spec-sanctioned exception to "called only by the shell stores"; update the header.
- [x] `src/shell/storage.test.ts` -- one `AD-7` case per I/O Matrix row; every case, the absent one included, stubs `navigator` explicitly with `vi.stubGlobal` (`{}` for absent; Node's global `navigator` has no `storage`); `vi.fn` fakes; assert call counts, `undefined` resolution, `rejects.toBe(e)`.
- [x] `src/main.ts` -- import; after the DEV block add `if (halted()) return;` then `await requestPersistence();` with a comment (AD-7, CAP-3, F3/F4/F17; no catch, rule 6); update the boot comment (:135-138) and the tail comment (:263-264) to name CAP-3 and `requestPersistence()` after the attempt.
- [x] `src/architecture-scan.ts` -- `'navigator-storage'` in `Rule`; `export const NAVIGATOR_STORAGE = /(?<![\w$])navigator\s*(?:\?\.|\.)\s*storage(?![\w$])/;` (comment: epic 7 CAP-3, AD-1 as amended at CAP-9); in `check()` push `['navigator-storage', 'navigator.storage outside storage.ts']` when `storageCheck && NAVIGATOR_STORAGE.test(full)` and `['navigator-storage', 'navigator.storage in markup']` for Svelte markup, beside the `local-storage` checks; add `navigator['storage']` and destructuring (`const { storage } = navigator`) to the known-limitation comment's list.
- [x] `src/architecture-ad1.test.ts` -- after `AD-1 localStorage`, `describe('AD-1 navigator.storage', () => run([...]))`: fails `navigator-storage`: shell `navigator.storage.persist();` (`S`), UI (`U`), `navigator?.storage` (`S`), `window.navigator.storage` (`S`), `navigator . storage` (`S`), engine test (`ET`), engine source (`E`, only `navigator-storage`), `src/shell/x.d.ts` `declare const s: typeof navigator.storage;`, markup `<p>{navigator.storage}</p>` (`UV`); passes: `src/shell/storage.ts`, a shell string `'navigator.storage'`, a comment, `navigator.storageBuckets` (`S`), shell test (`ST`), UI test (`UT`).
- [x] `e2e/helpers/boot-calls.ts` -- see Design Notes: `recordBootCalls(page, { holdRegister? })`, `bootCalls(page)`, `releaseRegister(page)`.
- [x] `e2e/globals.d.ts` -- `__wordcellBootCalls?: BootCall[]` and `__wordcellBootRelease?: () => void` with a comment naming the helper (type declared once, the helper reuses it).
- [x] `e2e/helpers.spec.ts` -- `test.describe('recordBootCalls')` on a routed probe document (`**/boot-calls-probe/` fulfilled `text/html`, no app, so no `__wordcell`), `pageerror` collected from before `goto` and asserted `[]` in each: (a) `AD-17 recordBootCalls logs a rejected register's settle with no unhandled rejection, stubs persisted() false, calls persist through and records no snapshot without the hook`: `/boot-calls-probe/missing.js` routed 404; page registers it (scope `/boot-calls-probe/`, caller handles → `'rejected'`), then `persisted()` → `false`, `persist()` → a boolean; `toStrictEqual` log `[{event:'register'},{event:'register-settled',outcome:'rejected'},{event:'persisted'},{event:'persist'}]` (no `dictionary` key); (b) `AD-17 recordBootCalls with holdRegister settles register only after releaseRegister`: `/boot-calls-probe/sw.js` routed `text/javascript` empty body; page stores the settle of `register(…, { scope: '/boot-calls-probe/' })` in a window flag; poll the log until `register-settled` (`fulfilled`), one macrotask, flag still unset; `releaseRegister`; flag polls to `'fulfilled'`; (c) `releaseRegister` and `bootCalls` throw when not armed.
- [x] `e2e/test-hook.spec.ts` -- rename the dev test to `AD-16 AD-7 AD-17 the dev server never requests src/shell/sw.ts, swState() stays unregistered, precacheComplete() stays false and persistence is requested once`; `recordBootCalls(page)` before `goto`; after the existing waits poll the log until it holds a `persist` entry, then (after the existing second `networkidle`) assert the whole log `toStrictEqual([{event:'persisted',dictionary:'ready'},{event:'persist',dictionary:'ready'}])` (dev serves the real list: `ready`, not `failed`); keep every existing assertion.
- [x] `e2e/pwa/boot-order.spec.ts` -- new; cases per Design Notes.

**Acceptance Criteria:**
- Given shell Vitest, when `npm test` runs, then every I/O Matrix row passes as an `AD-7` case, the `AD-1 navigator.storage` fixtures fail/pass as listed and the AD-1 tree scan reports no `navigator-storage` in `src/`.
- Given `dist-test/`, when `boot-order.spec.ts` runs in `pwa`, then each case passes with the logs and route hits in Design Notes.
- Given the dev server, when the renamed dev test and the `recordBootCalls` cases run, then they pass.
- Given the full suite, when `npm run test:all` runs, then it exits 0.

## Implementation Notes

Review-log unapplied minors, resolved: (1) timeout bullet "asserts order only" — the timeout case asserts the same whole log as the 404 case (counts, `failed` snapshots); only worker state is not asserted (Design Notes); (2) `page.clock` fallback — `blocked` also if it disturbs the registration attempt (Never); (3) "first page only" — each case has one page (Never); (4) dev snapshot — asserts `ready` (Tasks); (5) scan — aliasing passes, added to the known-limitation comment; `navigator-storage` in `Rule`; `\s*` as `MATH_RANDOM`; engine-token and `.d.ts` mirror cases, engine source reports only the new rule (Tasks); (6) the chunk handler's not-`loading` read is the gating assertion, the hold only gives an eager import time (Design Notes); (7) `main.ts` boot comments (Tasks); (8) order cases assert `current().kind` `active` at the read point (Design Notes); (9) `vi.stubGlobal('navigator', …)` in every case (Tasks); (10) init script: `ServiceWorkerContainer.prototype.register`, `persist` calls through, hook checked per event, reader and globals, `helpers.spec.ts` probe page and assertions (Design Notes, Tasks); (11) dictionary-held F4: chunk handler records and `route.continue()`s; dictionary released by `route.continue()`; timeout route never released; chunk URL `new URL('/' + swChunkFile(), baseURL).href`, hit once (Design Notes).

## Plan Change Log

- 2026-10-30 build: `helpers.spec.ts` `recordBootCalls` cases (a) and (b) route the probe's worker scripts (`/boot-calls-probe/missing.js`, `/boot-calls-probe/sw.js`) with `page.context().route`, not `page.route`: a worker's main-script fetch is seen only by `context.route` (measured: `page.route` 0 hits, `context.route` 1 hit; with `page.route` the dev server 404s `sw.js` and (b)'s `register` rejects). Each case asserts its handler hit once. The boot-order cases keep `page.route` only (Always), since they route page requests (word list, `sw.ts` chunk), never a worker script.

## Review Triage Log

### 2026-10-30 — Review pass
- verdicts: 24 findings — high 0, medium 2, low 10, false 12, maybe-false 0
- findings:
  - `[false]` `[reject]` (blind) dev test pins `dictionary: 'ready'` though the AC allows `ready` or `failed` — the plan's resolution of review-log minor (4), which the invocation allows; the dev server serves the generated list (`test:all` needs it, and other dev specs validate words against it).
  - `[false]` `[reject]` (blind) F4 dictionary-held poll `not.toBe('loading')` passes on an `undefined` hook — the hook cannot be absent there: the preceding `halt()` waits on `window.__wordcell?.current().kind === 'halted'`, and halting does not remove the hook.
  - `[false]` `[reject]` (blind) F4 dictionary-held case `continue()`s instead of fulfilling; `held[0]?.continue()` can no-op — `route.continue()` is the invocation's resolution ("dictionary fulfilled by `route.continue()`"); each `?.continue()` follows a poll asserting `held.length` is 1.
  - `[low]` `[reject]` (blind) hold mode tested only with a fulfilling `register` — `gate.then(() => original)` passes a rejection through, and `original` already carries the logging handler (case (a) shows that handler raises no unhandled rejection); entry 7 never holds; adding a case is more than a direct correction.
  - `[low]` `[reject]` (blind) scan fixtures lack `src/main.ts`, a `.svelte` `<script>`, `globalThis.navigator.storage` and template-literal cases — one regex runs on every layer's `full` text, and the `localStorage` set has none of these either; extra fixtures are additions, not corrections.
  - `[low]` `[reject]` (blind) no later-launch (controlled reload) proof of once per launch — the boot tail has no branch on a controller; the intent's P7 cases are first launch, 404, timeout and dev; a new case is added scope.
  - `[low]` `[reject]` (blind) no e2e proof that a persistence rejection reaches AD-15 — the ticket review log (pass 1) dropped this deliberately: the Vitest proves the rejection and `main.ts` has no catch; AD-15's `unhandledrejection` path is tested elsewhere (e.g. `AD-15 AD-17 a rejected precacheComplete() recompute reaches the AD-15 halt`).
  - `[false]` `[reject]` (blind) `boot()` header "a failure is an unhandledrejection … (AD-8 outcomes never reject)" outdated — a persistence rejection is exactly such an unhandledrejection; the parenthetical still explains why dictionary outcomes are not failures.
  - `[low]` `[defer]` (blind) F17 comments claim persistence follows F17's catch, untested — the comments are accurate ("never on a halted launch" covers the hook build's F17 halt); the untested half shares the verification-gap root and is entry 7's (deferred).
  - `[false]` `[reject]` (blind) `storage.test.ts` lacks a `persisted` count in the rejecting case and order (a `Promise.all` version would pass) — a `Promise.all` version calls `persist()` when `persisted()` is true and fails `AD-7 persisted() true: no persist() call`; the other cases pin one `persisted()` call.
  - `[low]` `[defer]` (blind) AGENTS.md "called only by the shell stores" contradicts `main.ts`; no `navigator.storage` single owner listed — agent-context edit, owned by entry 11 (CAP-9); deferred.
  - `[false]` `[reject]` (edge) partial `StorageManager` (no `persisted`) throws a TypeError to AD-15 — rule 6 forbids such guards; every target browser ships both methods; a throw reaching AD-15 is the specified fail-fast.
  - `[false]` `[reject]` (edge) a halt while awaiting `persisted()` still calls `persist()` — SPEC CAP-3 / build-notes Boot gate persistence on one `halted()` check after the attempt ("then return if `halted()`, else `requestPersistence()`"); nothing forbids finishing a request already started.
  - `[low]` `[patch]` (edge) `recordBootCalls` marks the page armed before `addInitScript` resolves — fixed: `armed.set` moved after the awaited `addInitScript` (already-armed check still first).
  - `[low]` `[reject]` (edge) the chunk handler reads `dictionaryState()` through an async evaluate, so a chunk requested between release and settle could read `ready` — `released` is read synchronously at handler entry, so the realistic regression (an eager import at boot, during the hold) fails `released: true`; a page-side request-time read needs new machinery.
  - `[false]` `[reject]` (edge) same undefined-hook poll as the blind row — refuted as above.
  - `[medium]` `[defer]` (verification-gap) F17 → persistence has no runtime test — lens disposition `defer`; the ticket assigns it to entry 7 (`dist-smoke` and `sw-failure.spec.ts` chunk-404 cases with this recorder); `deferred` entry.
  - `[false]` `[reject]` (intent) dictionary released by `continue()` not fulfil — the invocation's own resolution; same evidence as the blind row.
  - `[low]` `[reject]` (intent) hold tested only with a fulfilling original — same as the blind row.
  - `[false]` `[reject]` (intent) dev test narrower than the AC (`ready` only) — the invocation lets the plan assert `ready` for the unrouted dev case.
  - `[false]` `[reject]` (intent) timeout case asserts more than order — the invocation's minor says the AC binds (the same log, no worker state); `register` fulfilling under the page clock is the evidence the Notes' `blocked` fallback asked for.
  - `[false]` `[reject]` (intent) hook-absent skip proven on a probe page, not `dist/` — the ticket places that case in `helpers.spec.ts`; entry 7 consumes it on `dist/`.
  - `[low]` `[reject]` (intent) no e2e rejection-to-AD-15 proof — same as the blind row.
  - `[medium]` `[defer]` (intent) F17 → persistence path not tested here — same root as the verification-gap row; deferred to entry 7.

## Design Notes

**Init script** (`e2e/helpers/boot-calls.ts`; source sent to the page, options passed as the arg). `BootCall = { event: 'register' | 'register-settled' | 'persisted' | 'persist'; outcome?: 'fulfilled' | 'rejected'; dictionary?: 'loading' | 'ready' | 'failed' }`. Each push reads `window.__wordcell` at that moment and adds `dictionary: hook.dictionaryState()` only when the hook exists (no key otherwise). Wraps `ServiceWorkerContainer.prototype.register`: push `register`, call the original, `original.then(() => push settled fulfilled, () => push settled rejected)` (never an unhandled chain); return `original`, or with `holdRegister` a promise resolving to `original` once `window.__wordcellBootRelease()` has been called (`gate.then(() => original)`). `StorageManager.prototype.persisted` → push, `Promise.resolve(false)`; `StorageManager.prototype.persist` → push, call through. `recordBootCalls` throws if armed twice on a page; `bootCalls` throws when the log is absent; `releaseRegister` throws unless armed with `holdRegister`.

**Reading a log** (`order` = shared helper in the spec): poll `bootCalls` until it holds `persist`, `waitForLoadState('networkidle')`, one macrotask (`page.evaluate` of a `setTimeout(0)` promise), then `toStrictEqual` the whole log `[register, register-settled fulfilled, persisted, persist]`, each `dictionary: <d>`, and `current().kind` `'active'`. `<d>` is `ready` (first launch), `failed` (404, timeout).

**`pwa` cases** (`chunkUrl = new URL('/' + swChunkFile(), baseURL).href`, a `page.route(chunkUrl, …)` exact string):
- `AD-8 AD-16 AD-7 first launch: dictionary settled → register → register settled → persisted → persist, the sw.ts chunk requested only after the dictionary`: dictionary route holds its route until hit; chunk handler pushes `{ released, state: dictionaryState() }` and `route.continue()`s; after the dictionary hit wait two animation frames plus a macrotask, assert no chunk hit, set `released`, `route.continue()` the dictionary; read the log (`ready`); chunk hits `toEqual([{ released: true, state: 'ready' }])` — the state read is the gating assertion.
- `AD-16 AD-7 after a dictionary 404 …`: fulfil 404, hit once; log with `failed`.
- `AD-16 AD-7 after a dictionary timeout …`: `page.clock.install()` before `goto`; route holds forever (never released); poll hit; `page.clock.fastForward(31_000)`; poll `dictionaryState()` to `failed`; log with `failed`; no `swState()` assertion (the worker runs outside the page clock, unverified).
- `AD-16 AD-7 (F4) a halt while the dictionary request is held …`: routes the dictionary and the chunk (chunk handler records and `route.continue()`s); poll dictionary hit; `page.evaluate(() => reportError(new Error('F4 test halt')))`; wait `current().kind === 'halted'`; `route.continue()` the dictionary; poll `dictionaryState()` out of `loading`; one macrotask; `networkidle`; log `[]`, chunk hits `[]`.
- `AD-16 AD-7 (F4) a halt while the sw.ts chunk request is held …`: chunk route holds until hit; halt as above; `route.continue()`; `page.evaluate((url) => import(url).then(() => undefined), chunkUrl)` (same module record, resolves after evaluation); one macrotask; chunk hit once, log `[]`.
- `AD-16 AD-7 (F4) a halt during the registration attempt …` (the one case reaching CAP-3's trailing `halted()` check here): `recordBootCalls(page, { holdRegister: true })`; poll log until `register`; halt; `releaseRegister`; poll `swState()` out of `unregistered` (`{ timeout: 15_000 }`); one macrotask; events `toEqual(['register', 'register-settled'])` with outcome `fulfilled`.

## Verification

**Commands:**
- `npm run lint && npm run check` -- expected: clean.
- `npm test` -- expected: green, `AD-7 requestPersistence` and `AD-1 navigator.storage` cases included.
- `npx playwright test e2e/test-hook.spec.ts e2e/helpers.spec.ts --project android -g "AD-16 AD-7 AD-17|recordBootCalls"` -- expected: pass.
- `npm run test:e2e:pwa` -- expected: pass, `boot-order.spec.ts` included.
- `npm run test:all` -- expected: exit 0.

## Auto Run Result

**Summary:** AD-7 persistence (SPEC CAP-3): `requestPersistence()` in `src/shell/storage.ts` (absent `navigator.storage` → return; `persisted()` true → return; else one `persist()`, its result ignored; no catch), called once from `main.ts` as `if (halted()) return; await requestPersistence();` after the whole non-dev registration block (after F3's skip, a settled attempt or F17's catch), with no catch. The AD-1 scanner gains a `navigator-storage` rule (`navigator`, `.`/`?.`, whole-word `storage`; `storageCheck` exclusions; scripts and Svelte markup), with 15 fixture cases. The new recorder `e2e/helpers/boot-calls.ts` (`page.addInitScript`; wraps `ServiceWorkerContainer.prototype.register`, stubs `persisted()` false, calls `persist` through; per-event `dictionaryState()` snapshot only when the hook exists; `holdRegister`/`releaseRegister`) has three `helpers.spec.ts` self-tests. The P7 proofs are in `e2e/pwa/boot-order.spec.ts` (first launch with the chunk gated after the dictionary, dictionary 404, dictionary timeout under `page.clock`, three F4 halts), plus the dev test renamed `AD-16 AD-7 AD-17 …`. `page.clock` drove the 30 s timeout on `dist-test/` and `register` still fulfilled, so the Notes' `blocked` fallback was not needed.

**Files changed:**
- `src/shell/storage.ts` — `requestPersistence()`; header names `navigator.storage`.
- `src/shell/storage.test.ts` — five `AD-7 requestPersistence` cases (I/O Matrix rows), `navigator` stubbed in each.
- `src/main.ts` — the guarded call after the DEV block; boot comments name CAP-3 and `requestPersistence()`.
- `src/architecture-scan.ts` — `navigator-storage` rule, `NAVIGATOR_STORAGE`, known-limitation comment gains the aliasing forms.
- `src/architecture-ad1.test.ts` — `AD-1 navigator.storage` fixtures (9 fail, 6 pass).
- `e2e/helpers/boot-calls.ts` — the call-recording init script and its readers.
- `e2e/globals.d.ts` — `__wordcellBootCalls`, `__wordcellBootRelease`.
- `e2e/helpers.spec.ts` — `recordBootCalls` self-tests (rejected register with no unhandled rejection and no snapshot without the hook; hold and release; throws).
- `e2e/test-hook.spec.ts` — dev test renamed and extended (log `persisted`, `persist`, both `ready`).
- `e2e/pwa/boot-order.spec.ts` — six `pwa` boot-order cases.

**Review findings:** 24 findings (high 0, medium 2, low 10, false 12). Patched 1 (low: `recordBootCalls` marked the page armed before `addInitScript` resolved). Deferred 2 entries: F17 → persistence runtime proof (medium, 3 rows; entry 7 owns it) and the AGENTS.md exception / single owner (low; entry 11). Rejected 21 with reasons in the Review Triage Log (12 false; 9 low: extra scan fixtures, hold-with-rejection case, controlled-reload case, e2e AD-15 rejection proof (×2), async chunk-state read, and duplicates).

**Follow-up review recommendation:** `false` — first pass, patched counts by verdict: high 0, medium 0, low 1.

**Verification:** `npm run test:all` exit 0 before the review and again after the patch (after: unit 3,733 passed; size budget 560,702 / 600,000, margin 39,298; `dist-smoke` 23 passed; dev e2e 1,147 passed; `pwa` 31 passed, including the six `boot-order.spec.ts` cases). The implementer removed the trailing `halted()` check and saw the registration-attempt F4 case fail, then restored it. Matrix audit: all five I/O rows covered by `AD-7` cases in `src/shell/storage.test.ts`, all ran and passed.

**Residual risks:** the F17 → persistence path (`dist/` persists, `dist-test/` halts first) is proven only once entry 7 lands. AGENTS.md disagrees with `main.ts` (`storage.ts` callers) until entry 11. The first-launch chunk-gating read is async (`page.evaluate` from the route handler); an import fired between the dictionary's release and its settle could read `ready`, though the boot-time eager-import regression fails the synchronous `released` check. The helper's `recordBootCalls` sets its armed mark after an `await`, so two overlapping unawaited calls on one page would both pass the double-arm check (no caller does this).
