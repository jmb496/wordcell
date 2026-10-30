---
title: 'Worker registration, state module and swState()'
type: 'feature'
ticket: '1'
created: '2026-10-30'
status: 'built'
baseline_revision: '96cca7cddd9d15ef48673f989d49b2040943d0f9'
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
  - '{project-root}/_bmad-output/initiative-wordcell-v1/epic-pwa-release/story-worker-registration-state-module-and-swstate.md'
warnings: ['oversized']
deferred:
  - summary: >-
      No test in this ticket pins AD-16's boot order (the sw.ts chunk requested and register called only after the dictionary settles); moving the tail above dictionary.load() would pass every test here.
    evidence: |-
      Verification-gap lens: e2e/pwa/test-hook.spec.ts only polls swState() to active; the dev test skips the branch; sw.test.ts calls registerWorker() directly. tickets.toml entry 5 owns the first-launch order test (dictionary route held, sw.ts chunk route via swChunkFile() not hit while held, dictionaryState() not loading when hit).
    location: >-
      src/main.ts boot tail
    severity: medium
---

<intent-contract>

## Intent

**Problem:** The production app registers no service worker, so it neither installs its offline precache nor reports worker state to tests (SPEC CAP-1, CAP-2 tracer bullet; ticket 7.1).

**Approach:** Add a shell worker-state module (F1), a dynamic `src/shell/sw.ts` chunk registering `/sw.js` through `workbox-window`'s `Workbox` (F2), the `main.ts` boot tail (F3, F4, F17), `swState()` as the fifth hook key, the narrowed build-output check with a shared `swChunkFile()` helper, and the F6 audit.

## Boundaries & Constraints

**Always:** AD-16 boot order (registration only after `dictionary.load()` settles); `workbox-window` imported only by `sw.ts`, never in the main chunk; state precedence and sticky `failed` per CAP-1; one `statechange` listener per worker; rule 6 (a rejected `register()` propagates to AD-15 in this ticket); tests named by id (`AD-16`, `AD-17`); `package.json` `dependencies` `"workbox-window": "7.4.1"` exact, lockfile updated in the same change.

**Never:** prompt UI, `updateSW`, `messageSkipWaiting`, `messageSW`, `SKIP_WAITING`, `virtual:pwa-register`; a function or binding named `registerSW` (kept build-output marker); a `reset()` or other test-only export (SPEC Constraints); `requestPersistence()` or a trailing `halted()` check after the attempt (entry 5); the `failed` detection in `sw.ts` (entry 2); `precacheComplete()` (entry 4); `serviceWorkers: 'block'` in any spec; changes to `vite.config.ts` PWA policy, the engine, Session or history.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Before `register()` resolves | any | `swState()` `unregistered` | — |
| Empty registration | no slots | `unregistered` | — |
| Pre-existing single slot | installing / waiting / active | `installing` / `waiting` / `active` | — |
| Several slots | waiting+installing, waiting+active, all three → `waiting`; installing+active → `installing` | precedence waiting > installing > active | — |
| Update found later | active only, then registration fires `updatefound` with a new installing worker | `installing` | — |
| `statechange` slot move | worker moves installing → waiting → active | recomputed each time | — |
| Worker at `register()` also in `updatefound` | same worker | exactly one `statechange` listener on it | — |
| Dev server | `import.meta.env.DEV` | no `sw.ts` request, `unregistered` | — |

</intent-contract>

## Code Map

- `src/main.ts` -- `boot()` ends `await dictionary.load()` (~line 300); `halted()` helper above `boot()`; hook-build gate expression `import.meta.env.DEV || import.meta.env.VITE_TEST_HOOKS === '1'`; `game.halt('fatal')` replaces a Q-38 `another-window` cause (`src/shell/game.svelte.ts:210-212`), hence the `!halted()` guard on the F17 report.
- `src/shell/test-hook.ts` -- frozen `window.__wordcell` (4 keys) and its `declare global` type; add `swState` here.
- `src/shell/test-hook.test.ts:45-53` -- Vitest four-key list; pattern for fresh modules per case (`vi.resetModules()` + `vi.stubGlobal`).
- `e2e/globals.d.ts` -- mirrors the hook type; add `swState(): 'unregistered' | 'installing' | 'waiting' | 'active' | 'failed'`.
- `e2e/test-hook.spec.ts`, `e2e/pwa/test-hook.spec.ts` -- first test of each pins the four keys under the title "… exposes loaded, current, dictionaryState and celebration".
- `e2e/pwa/build-output.spec.ts:40` -- "AD-16 the build registers no service worker automatically": `registerSW.js` absence, four markers over `index.html` + `assets/*.js`, `sw.js` no `clientsClaim`.
- `e2e/helpers/dist-test.ts` -- `buildRoot(repo)` (optional root pattern), `readSite`, `walk`.
- `e2e/helpers.spec.ts:1297` -- `test.describe('buildRoot', …)` with tmpdir pattern (`mkdtempSync`, `rmSync`); file runs on `android` only.
- `e2e/pwa/theme.spec.ts` -- the one routing spec: `page.route('**/assets/index-*.js')` on the first, uncontrolled `goto`.
- `e2e/pwa/dist-smoke.spec.ts`, `font.spec.ts`, `precache.spec.ts` -- audited: no route, no reload (the R-87 "relaunch" test is a fresh `goto`); `errorsOf` + `networkidle` see page traffic only.
- `scripts/size-budget.mjs` -- `SW_KEY = 'src/shell/sw.ts'`; excludes the `sw.ts` static closure once a dynamic edge exists (entry chunk stays counted). No change.
- `node_modules/workbox-window` 7.4.1 -- `module` entry is the prod build (no console logging); `register()` resolves `ServiceWorkerRegistration | undefined` (undefined only on the dev-build double register), waits for `load` unless `immediate`.

## Tasks & Acceptance

**Execution:**
- [x] `package.json`, `package-lock.json` -- `npm install --save-exact workbox-window@7.4.1` (new `dependencies` block; no new package) -- F2.
- [x] `src/shell/sw-state.ts` -- `export type SwState`; `swState()` getter, `setSwState(next)` setter; starts `unregistered`; once `failed` the setter leaves it; no imports -- F1.
- [x] `src/shell/sw.ts` -- named export `registerWorker(): Promise<void>` (see Design Notes) -- F2, CAP-1.
- [x] `src/shell/sw.test.ts` -- Vitest `AD-16` per the I/O Matrix rows 1–7 with a faked `Workbox` (`vi.mock('workbox-window')`), fresh `sw-state` and `sw` per case via `vi.resetModules()`; fake registration and workers are `EventTarget`s with mutable slots/`state`; the registration (not the worker) dispatches `updatefound`; every case asserts `messageSkipWaiting`/`messageSW` never called; one case asserts the constructor args `('/sw.js', { scope: '/' })`.
- [x] `src/main.ts` -- boot tail after `await dictionary.load()` (see Design Notes); import `setSwState` statically.
- [x] `src/shell/test-hook.ts`, `e2e/globals.d.ts` -- `swState: () => swState()` (five keys); update the comment and both types.
- [x] `src/shell/test-hook.test.ts`, `e2e/test-hook.spec.ts`, `e2e/pwa/test-hook.spec.ts` -- all three key lists gain `swState`; retitle the two Playwright tests "… frozen, exposes exactly its hook keys".
- [x] `e2e/pwa/test-hook.spec.ts` -- add `AD-16 AD-17 the registered worker reaches swState() active in the test build`: `goto('/')`, `expect.poll(swState())` to `active`; no key-list re-assertion.
- [x] `e2e/test-hook.spec.ts` -- add `AD-16 AD-17 the dev server never requests src/shell/sw.ts and swState() stays unregistered`: `page.on('request')` before `goto` records `new URL(url).pathname`; poll `dictionaryState()` out of `loading`; one macrotask (`page.evaluate` of a `setTimeout(0)` promise); `waitForLoadState('networkidle')`; assert `unregistered` and no pathname exactly `/src/shell/sw.ts`. Entry 5 extends this test and renames it to carry AD-7.
- [x] `e2e/helpers/dist-test.ts` -- `swChunkFile(root = buildRoot()): string` reading `<root>/.vite/manifest.json`; throws when `src/shell/sw.ts` is missing, not `isDynamicEntry: true`, or has no string `file` (rule 6).
- [x] `e2e/helpers.spec.ts` -- `test.describe('swChunkFile')`, `AD-17 …` case on synthetic manifests in a tmpdir: missing key throws, non-dynamic throws, valid returns the file.
- [x] `e2e/pwa/build-output.spec.ts` -- rename to `AD-16 the build has no registerSW.js and registers a worker only from the sw.ts chunk`; `serviceWorker.register` must be absent in every scanned file except `swChunkFile()`, where it must be present (and that file is in the scanned list); the other three markers, `registerSW.js` absence and `sw.js` no-`clientsClaim` unchanged; drop the "Epic 7 narrows" comment.
- [x] `e2e/pwa/theme.spec.ts` -- F6: record the route handler hit and assert it; comment that the first `goto` is uncontrolled so `page.route` sees the request.

**Acceptance Criteria:**
- Given `dist-test/`, when the page boots, then `swState()` polls to `active` and the frozen hook has exactly the five sorted keys.
- Given the dev server, when the dictionary settles and the network is idle, then no `/src/shell/sw.ts` request was made and `swState()` is `unregistered`.
- Given `dist/` and `dist-test/`, when the renamed build-output test runs, then `serviceWorker.register` appears only in the `sw.ts` chunk and `registerSW.js`, the other markers and `clientsClaim` are absent.
- Given the full suite, when `npm run test:all` runs, then every existing `pwa` and `dist-smoke` spec passes and the postbuild budget stays ≤ 600,000 bytes.

## Implementation Notes

Review-log unapplied minors, resolved: (1) three key-list tests incl. `src/shell/test-hook.test.ts`, Playwright tests retitled — Tasks; (2) tail ends after the attempt, no trailing check — Never, Design Notes; (3) dev test named `AD-16 AD-17`, entry 5 renames with AD-7 — Tasks; (4) one macrotask then `networkidle` — Tasks; (5) the `pwa` test lives in `e2e/pwa/test-hook.spec.ts` and does not re-assert keys — Tasks; (6) `updatefound` on the fake registration — Tasks; (7) `vi.resetModules()`, no `reset()` export — Tasks, Never; (8) F17 `{ cause }` and the `!halted()` guard — Deferred coverage, Design Notes; (9) F6 findings recorded below; (10) rejected `register()` → AD-15 on `dist/` until entry 2 — residual risk below; (11) `updatefound` listener attached synchronously after `register()` resolves, before the first slot read — Design Notes.

Deferred coverage (kept out of the I/O Matrix, which lists only rows this ticket tests): the two F4 `halted()` returns (entry 5's halt cases); the F17 catch, `failed` plus, in hook builds and only if not already `halted()`, `reportError(new Error('Q-40 F17 …', { cause }))`, attempt skipped (entry 7's chunk-404 cases); a rejected `register()` propagating to AD-15 (replaced by `failed` in entry 2). Residual risk (transitional, nothing merges before entry 2): a rejected `register()` shows the AD-15 surface on `dist/`. Plan checkpoint (`tickets.toml` `plan_checkpoint = true`): the invocation did not direct a halt after planning, so the build continues (autopilot delegation). Build-output new name for entries 2 and 8: `AD-16 the build has no registerSW.js and registers a worker only from the sw.ts chunk`.

F6 audit (planning read; confirm at build): only `e2e/pwa/theme.spec.ts` routes (first uncontrolled `goto`, gains the hit assertion); no `pwa` or `dist-smoke` spec routes across a reload or fails a precached URL.

As built (2026-10-30): F6 audit confirmed at build: a grep of `e2e/pwa/` for `route(` and `reload(` finds only `theme.spec.ts`; the shared helpers those specs use (`board.ts`, `seed.ts`, `celebration.ts`) neither route nor reload. Size budget after `npm run build`: total 560,662 / 600,000 (margin 39,338; +109 bytes over epic 11's 560,553 for the boot tail and state module in the entry chunk); `dist/.vite/manifest.json` `src/shell/sw.ts` → `assets/sw-*.js`, `isDynamicEntry: true`, the only scanned file containing `serviceWorker.register`. The dev-server test polls `dictionaryState()` to `ready` or `failed` (not "not `loading`"), so an undefined hook before boot cannot pass it vacuously. `swChunkFile()` also throws on a non-string `file` (a third case beside the two the ticket names). Verification: `npm test` green (3650 tests, including `src/shell/sw.test.ts` and the five-key list), `npm run check` and `npm run lint` clean, `npm run test:all` exit 0 (`dist-smoke`, `test:e2e` 1126 passed, `pwa` 18 passed).

## Plan Change Log

## Review Triage Log

### 2026-10-30 — Review pass
- verdicts: 30 findings — high 0, medium 6, low 12, false 12, maybe-false 0
- findings:
  - `[medium]` `[reject]` (blind) `new Workbox()` touches `navigator.serviceWorker` in its constructor, so an absent container throws to AD-15 on `dist/` — confirmed in `workbox-window.prod.es5.mjs` (constructor adds a `message` listener); the intent assigns F5 to entry 2 ("the failure detection is entry 2's"); recorded as a residual risk: entry 2's F5 check must precede `new Workbox`.
  - `[low]` `[reject]` (blind) `registration === undefined` throw untested and unreachable with the prod build — a rule-6 type narrowing that fails fast; the prod `register()` never resolves `undefined` (a `block` stub yields a TypeError first); a test adds nothing users meet.
  - `[low]` `[patch]` (blind) dead `import.meta.env.DEV ||` in `hookBuild` inside the `!DEV` branch — gate is now `import.meta.env.VITE_TEST_HOOKS === '1' && !halted()`.
  - `[low]` `[patch]` (blind) dev test did not check CAP-1's "`workbox-window` not imported in `vite dev`" — added: no request pathname contains `workbox-window`.
  - `[low]` `[patch]` (blind) slot-move case did not assert one `statechange` listener — added `expect(moving.statechangeListeners).toBe(1)`.
  - `[low]` `[reject]` (blind) plan's Deferred coverage omits entry 2's sticky-`failed` and second-update cases — fix edits this build's plan; both are named in tickets.toml entry 2 and the ticket.
  - `[false]` `[reject]` (blind) review recorded but triage log empty — the log is written at this point of the review step.
  - `[low]` `[reject]` (blind) `boot()` header comment does not mention the transitional AD-15 path — the comment ("a failure is an unhandledrejection") stays true; transitional until entry 2.
  - `[low]` `[patch]` (blind) "five keys here, six at entry 4" schedules a future ticket in a comment — clause dropped from `src/shell/test-hook.ts`.
  - `[false]` `[reject]` (blind) hook `swState()` delegation only checked by name — the same accessor returns `active` on `dist-test/` and `unregistered` in dev, which a constant cannot.
  - `[low]` `[patch]` (blind) `swChunkFile` title omits the file-less case; build-output message unclear — retitled ("missing, non-dynamic or file-less") and message now "`<file>` lacks/contains serviceWorker.register".
  - `[medium]` `[reject]` (edge) absent `navigator.serviceWorker` → AD-15 in production — same as the first row; entry 2's F5.
  - `[medium]` `[reject]` (edge) a rejected `register()` halts production — the intent specifies propagation to AD-15 until entry 2 (rule 6); residual risk recorded.
  - `[medium]` `[reject]` (edge) a redundant install is not `failed` — intent: failure detection is entry 2's.
  - `[low]` `[reject]` (edge) `register()` resolving `undefined` throws without setting `failed` — unreachable in the prod build; `failed` and the always-resolving contract are entry 2's.
  - `[low]` `[patch]` (edge) `it.each` title fed (slot, state) read "waiting worker alone gives installed" — retitled "(state %s) alone gives the slot name".
  - `[low]` `[patch]` (edge) `swState()` poll used the default 5 s expect timeout during a whole-build precache — `{ timeout: 15_000 }` (measured 778 ms locally).
  - `[false]` `[reject]` (edge) `networkidle` may resolve before a late `sw.ts` request — the request listener records any request issued; after the settled poll plus one macrotask the tail's `import()` would already have been issued.
  - `[false]` `[reject]` (edge) claim of a "final `halted()` check" that does not exist — the plan states no trailing check (entry 5 appends it); the code matches the plan.
  - `[false]` `[reject]` (edge) F6 grep misses a second navigation under a controlling worker — F6 concerns routes not firing under control; only `theme.spec.ts` routes and it navigates once; `dist-smoke`'s `goBack` is in-document history.
  - `[medium]` `[defer]` (verification-gap) AD-16 boot order not pinned by any test here — owned by entry 5's first-launch order test; added to `deferred`.
  - `[low]` `[reject]` (intent) plan checkpoint not honoured — process, not code: the invocation (epic autopilot, owner-delegated gates) did not direct a halt after planning; recorded in Implementation Notes and the result.
  - `[false]` `[reject]` (intent) F17 `!halted()` guard narrows "in hook builds" — required by the invocation's review-log minor (keeps a Q-38 cause from being overwritten by `fatal`, `game.svelte.ts:210-212`).
  - `[false]` `[reject]` (intent) `undefined` registration rejects — duplicate of the rule-6 narrowing above; unreachable in the prod build.
  - `[false]` `[reject]` (intent) no trailing `halted()` check — required by the invocation's review-log minor.
  - `[false]` `[reject]` (intent) the fake cannot model `Workbox` dropping its own listener — the module listens on the registration directly, independent of `Workbox`'s listener, which the test shows.
  - `[medium]` `[defer]` (intent) boot order untested at the production surface — grouped with the verification-gap row (same root cause); deferred to entry 5.
  - `[false]` `[reject]` (intent) Playwright titles renamed — required by the invocation's review-log minor.
  - `[false]` `[reject]` (intent) dev test waits for `ready|failed` instead of "leaves `loading`" — equivalent once the hook exists, and stops an undefined hook passing vacuously.
  - `[false]` `[reject]` (intent) F6 audit exists only as prose — the audit is a reading; its evidence is the recorded grep and every `pwa`/`dist-smoke` spec passing under `test:all`.

## Design Notes

`sw.ts` shape (boundaries, not literal code):

```ts
export async function registerWorker(): Promise<void> {
  const registration = await new Workbox('/sw.js', { scope: '/' }).register();
  if (registration === undefined) throw new Error('AD-16 Workbox.register() resolved no registration');
  const listened = new WeakSet<ServiceWorker>();
  const recompute = () => { /* attach statechange once per slot worker, then setSwState(waiting ? 'waiting' : installing ? 'installing' : active ? 'active' : 'unregistered') */ };
  registration.addEventListener('updatefound', recompute); // before the first slot read
  recompute();
}
```

Boot tail (after `await dictionary.load()`): `if (halted()) return;` then, unless `import.meta.env.DEV` (a branch, not a `return`), `let sw; try { sw = await import('./shell/sw'); } catch (cause) { setSwState('failed'); if (hook build && !halted()) reportError(new Error('Q-40 F17 the sw.ts chunk did not load', { cause })); }` and, when `sw` loaded, `if (halted()) return; await sw.registerWorker();`. Only the `import()` expression sits in the try (build-notes "the one specified catch"). Entry 5 appends the final `halted()` check and `requestPersistence()` after this block.

## Verification

**Commands:**
- `npm test` -- expected: green, including `src/shell/sw.test.ts` and the five-key Vitest list.
- `npm run build` -- expected: postbuild budget passes; `dist/.vite/manifest.json` has `src/shell/sw.ts` with `isDynamicEntry: true`; record the total/600,000 margin in Implementation Notes.
- `npm run test:all` -- expected: green (lint, check, unit, build, `test:e2e:dist`, `test:e2e`, `test:e2e:pwa`).

## Auto Run Result

**Summary:** the production and test builds register `/sw.js` through a dynamic `src/shell/sw.ts` chunk (`workbox-window` `Workbox`) after the dictionary settles; a shell worker-state module (`src/shell/sw-state.ts`, sticky `failed`) feeds `window.__wordcell.swState()` (five keys); the boot tail carries the two F4 `halted()` returns, the dev branch and the F17 import-only catch; the build-output check narrows `serviceWorker.register` to the `sw.ts` chunk through `swChunkFile()`; the F6 audit adds the `theme.spec.ts` handler-hit assertion.

**Files changed:**
- `package.json`, `package-lock.json` — `workbox-window` 7.4.1 exact in `dependencies` (no new package).
- `src/shell/sw-state.ts` — the F1 state getter/setter.
- `src/shell/sw.ts` — `registerWorker()`: register, own `updatefound`, one `statechange` per worker, slot precedence.
- `src/shell/sw.test.ts` — Vitest `AD-16` state cases with a faked `Workbox`.
- `src/main.ts` — the AD-16 boot tail (F3, F4, F17).
- `src/shell/test-hook.ts`, `e2e/globals.d.ts` — `swState` hook key and type.
- `src/shell/test-hook.test.ts`, `e2e/test-hook.spec.ts`, `e2e/pwa/test-hook.spec.ts` — five-key lists, retitled tests, the dev and `pwa` `swState()` tests.
- `e2e/helpers/dist-test.ts`, `e2e/helpers.spec.ts` — `swChunkFile()` and its self-test.
- `e2e/pwa/build-output.spec.ts` — renamed narrowed registration check.
- `e2e/pwa/theme.spec.ts` — F6 handler-hit assertion.

**Review findings:** 30 findings; 7 rows patched (all `low`, 8 edits); 2 rows deferred (one entry, `medium`, boot order → entry 5); 21 rejected with the reasons in the Review Triage Log (12 `false`; 4 `medium` the intent assigns to entry 2; 5 `low` not worth fixing or process-only).

**Follow-up review recommendation:** `false` — first pass, patched counts by verdict: high 0, medium 0, low 7.

**Verification:** `npm run test:all` exit 0 before and after the patches (unit 3,650 passed; `dist-smoke` 21 passed; dev e2e 1,126 passed, 1,066 skipped by project; `pwa` 18 passed); size budget 560,662 / 600,000 (margin 39,338). Matrix audit: rows 1–7 covered by `src/shell/sw.test.ts`, the dev row by `e2e/test-hook.spec.ts` `AD-16 AD-17 …`, all run and passed.

**Residual risks:** until entry 2, a rejected `register()` and an absent `navigator.serviceWorker` (the `Workbox` constructor touches it, e.g. Firefox private windows) reach the AD-15 surface on `dist/`; entry 2's F5 check must run before `new Workbox(...)`. Deferred coverage: F4 returns (entry 5), F17 catch (entry 7), boot order (entry 5). The ticket's plan checkpoint was not honoured as a pause: the invocation did not direct a halt after planning.

