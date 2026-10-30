---
title: 'Worker failure split and no-skip-waiting guards'
type: 'feature'
ticket: '2'
created: '2026-10-30'
status: 'built'
baseline_revision: '1a960689030762c6619e3dedfe0195df21bdfd26'
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
  - '{project-root}/_bmad-output/initiative-wordcell-v1/epic-pwa-release/story-worker-failure-split-and-no-skip-waiting-guards.md'
warnings: ['oversized']
deferred:
  - summary: >-
      Dropping `&& !halted()` from main.ts's F17 report has no runtime test (no spec makes the sw.ts chunk import reject, halted first or not); the source pin `AD-16 src/main.ts reports the F17 chunk failure on the hook gate alone, halted or not` (src/architecture-tree-scan.test.ts) now covers the condition.
    evidence: |-
      Verification-gap, blind and intent lenses: grep of e2e/ and src/ for F17, `chunk did not load`, `shell/sw` finds only e2e/pwa/test-hook.spec.ts (successful import). Entry 7 (tickets.toml, sw-failure.spec.ts / dist-smoke) owns the F17 chunk-404 proofs; its F17 case does not halt first, so the source pin, not entry 7, pins the unconditional report.
    location: >-
      src/main.ts:273
    severity: low
---

<intent-contract>

## Intent

**Problem:** `sw.ts` (ticket 7.1) throws on a rejected or `undefined` `register()`, never notices a worker that turns redundant, and lets `new Workbox()` throw when `navigator.serviceWorker` is absent; nothing guards against a skip-waiting call creeping into `src/` or the generated `sw.js` (SPEC CAP-1, F5, Q-40).

**Approach:** Add the Q-40 failure split to `src/shell/sw.ts` (sticky `failed`, one hook-build `reportError` per launch, the attempt always resolving), drop `&& !halted()` from `main.ts`'s F17 report, add a `skip-waiting` rule to the AD-1 scanner with fixtures and an `AD-16` tree test, move `sw.js`'s `clientsClaim` assertion into a new build-output test that also pins the single guarded `skipWaiting(`, and re-run the F6 audit.

## Boundaries & Constraints

**Always:** `failed` only from: rejected `register()`, `register()` resolving `undefined`, absent `navigator.serviceWorker` (checked before `new Workbox`), or the redundant-worker rule below; each sets `failed` and the attempt resolves (never rejects) for these. Report gate `import.meta.env.VITE_TEST_HOOKS === '1'` read at call time; gate on → `reportError(new Error('Q-40 …', { cause }))` exactly once per launch, on the transition into `failed` (cause where one exists); gate off → silent. Redundant rule: a worker observed by `sw.ts` (in a slot at `register()` or any recompute) whose state is `redundant`, never seen `activated` by any observation, with no newer non-redundant worker in any slot → `failed`. "Newer" = first observed later; within one slot read, first-seen order is active, then waiting, then installing. Within one recompute: record first-seen workers and `activated` observations first, then the failure check, then the state. Test names start `AD-16`. One `statechange` listener per worker (7.1).

**Never:** catch anything else in `sw.ts` (a throwing `Workbox` constructor or a throwing listener reaches AD-15, rule 6); a test-only export or `reset()`; a trailing `halted()` check or `requestPersistence()` (entry 5); `precacheComplete()` (entry 4); edits to the ticket file, `vite.config.ts` PWA policy, the engine, Session or history; renaming `AD-16 the build has no registerSW.js and registers a worker only from the sw.ts chunk` (pinned by the 7.1 plan for entry 8).

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected | Report (gate off / on) |
|---|---|---|---|
| First-install redundant | installing I at `register()`; I → `redundant`, slots empty | `failed` | 0 / 1 |
| Update failure | active A (`activated`) + installing I at `register()`; I → `redundant`, still slotted or installing slot null first | `failed` (A older by ranking) | 0 / 1 |
| Second update found later | active A; `updatefound` U1 → `installed` → `activated` (A redundant); `updatefound` U2 → `redundant`, no newer | `failed` | 0 / 1 |
| Rejected `register()` | `register()` rejects (F6 `block` stubs land here) | `failed`, attempt resolves | 0 / 1, `cause` = rejection |
| `undefined` registration | `register()` resolves `undefined` (type-only branch) | `failed`, attempt resolves | 0 / 1 |
| Absent container (F5) | `navigator` stubbed without `serviceWorker` | `failed`, fake `Workbox` never constructed | 0 / 1 |
| Already redundant at first read | lone installing slot worker already `redundant` | `failed` | 0 / 1 |
| Sticky | installing I fails, then `updatefound` U → `redundant` | stays `failed` (slots say otherwise) | 1 call total, gate on |
| Replacement | waiting W (`installed`) + installing I at `register()`; W → `redundant` still in waiting slot | not `failed` | 0, gate on |
| Activated-then-superseded | active A (`activated`) at `register()`; A → `redundant`, no new worker in any slot | not `failed` | 0, gate on |
| Constructor throws | `navigator.serviceWorker` present, fake `Workbox` constructor throws | `registerWorker()` rejects; state not `failed` | 0, gate on |

</intent-contract>

## Code Map

- `src/shell/sw.ts` -- `registerWorker()`: `new Workbox('/sw.js', { scope: '/' }).register()`, throws on `undefined`; `listened` WeakSet; `recompute` reads `installing, waiting, active` (in that loop order: change the recording order to active, waiting, installing), attaches `statechange`, sets state by precedence. Header comment says a rejection reaches AD-15: update.
- `src/shell/sw-state.ts` -- `swState()`, `setSwState()` (sticky `failed`). No change; use `swState() === 'failed'` as the "already reported" guard.
- `src/shell/sw.test.ts` -- `vi.mock('workbox-window')` fake with `fake.constructed`, `messageSkipWaiting`, `messageSW`, `register`; `FakeWorker.move(state)` dispatches `statechange`; `load()` does `vi.resetModules()` then imports; `worker(state)`; `afterEach` asserts no message calls. Existing precedence case uses invalid states (`worker('waiting')`) and the updatefound case never fires `statechange` (7.1 minors 3–4).
- `src/main.ts:268-276` -- F17 catch: `if (import.meta.env.VITE_TEST_HOOKS === '1' && !halted())` → drop `&& !halted()`. `halted()` stays (other uses). Comment at :136-139 stays true.
- `src/shell/game.svelte.ts:205-216` -- `halt('fatal')` replaces an earlier fatal text and an another-window cause (why the guard can go).
- `src/architecture-scan.ts` -- `Rule` union (:19); `check()` (:529): per script `commentsOnly = strip(sf, true)` (strings kept), `isTest`, `isSvelte`, markup checks after the script loop (:576); `run(cases)` (:630) titles every case `AD-1 …`; `SELF` (:661) the tree-scan exclusions.
- `src/architecture-ad1.test.ts:847-863` -- `describe('AD-1 popstate', () => run([...]))`: the fixture pattern (string fails, comment passes, markup case in `.svelte extraction` :1036). Imports fixture paths `S`, `ST`, `ET`, `UV` from the scan module.
- `src/architecture-tree-scan.test.ts` -- walks `src` minus `SELF`, runs `check` on each file.
- `e2e/pwa/build-output.spec.ts:57-80` -- registerSW test; its last lines hold the `clientsClaim` assertion and the "No skipWaiting assertion" comment. Runs under `pwa` and `dist-smoke`: stay hook-free. Current `dist/sw.js`: `self.addEventListener("message",e=>{e.data&&"SKIP_WAITING"===e.data.type&&self.skipWaiting()})`, one `skipWaiting(`.
- `e2e/pwa/*.spec.ts` -- F6 audit set: `build-output`, `dist-smoke`, `font`, `precache`, `test-hook`, `theme` (only `theme.spec.ts` routes: `page.route` on the uncontrolled first `goto`, `route.continue()`; `page.route` does not intercept the worker's precache fetches).
- `node_modules/workbox-window/Workbox.js` -- constructor adds a `navigator.serviceWorker` `message` listener (hence F5 before construction); `register()` reads `navigator.serviceWorker.controller` and `.waiting`, so a `block` stub rejects before ever resolving `undefined`.

## Tasks & Acceptance

**Execution:**
- [x] `src/shell/sw.ts` -- add the F5 check before construction, wrap only `await workbox.register()` in try/catch, replace the `undefined` throw, add first-seen order, `activated` observations and the redundant check to `recompute`, add a module-local `fail(reason, cause?)` (see Design Notes); update the header and JSDoc -- CAP-1, Q-40, F5.
- [x] `src/shell/sw.test.ts` -- per-case `vi.stubGlobal('navigator', { serviceWorker: {} })` (or `{}` for F5), `vi.stubGlobal('reportError', vi.fn())` fresh per case, `vi.stubEnv('VITE_TEST_HOOKS', '1' | '')`, all inside `load()` with options; `afterEach` adds `vi.unstubAllGlobals()` and `vi.unstubAllEnvs()`; a shared `const STATE = { installing: 'installing', waiting: 'installed', active: 'activated' } as const` used by every slot-filling case; the updatefound case moves the update to the waiting slot and fires `statechange` (`'installed'`) → `waiting`; every I/O Matrix row as an `AD-16` case: failure rows `it.each` over gate off/on asserting 0/1 `reportError` calls (on: one `Error` whose message starts `Q-40`; rejected case also `cause`), non-failure rows and all existing state cases run gate on and assert zero calls; F5 case asserts `fake.constructed` empty and tests `navigator.serviceWorker === undefined` semantics by stubbing `navigator` itself (Node 24 has a global `navigator`); constructor-throws case via a `fake.construct` hook -- AC.
- [x] `src/main.ts` -- F17 report condition becomes `import.meta.env.VITE_TEST_HOOKS === '1'` (AD-15 later fatal replaces earlier text; 7.1 code review minor 1).
- [x] `src/architecture-scan.ts` -- add `'skip-waiting'` to `Rule`; export `SKIP_WAITING_NAMES = ['messageSkipWaiting', 'SKIP_WAITING', 'updateSW', 'virtual:pwa-register']`; in `check()`, when `!isTest`, push `['skip-waiting', name]` for each name in `commentsOnly` (per script) and in Svelte `markup`; give `run(cases, id = 'AD-1')` an id parameter used in the title -- SPEC CAP-1 scan.
- [x] `src/architecture-ad1.test.ts` -- after `AD-1 popstate`, `describe('AD-16 skip-waiting names', () => run([...], 'AD-16'))`: fails: `'SKIP_WAITING'` in a string (`S`); `updateSW(true)` (`S`); `const id = 'virtual:pwa-register'` (`S`); `.svelte` markup `<button onclick={() => wb.messageSkipWaiting()}>x</button>` (`UV`); passes: names only in a comment (`S`); shell and engine `*.test.ts` with `'SKIP_WAITING'` (`ST`, `ET`); `skipWaiting` alone (`S`).
- [x] `src/architecture-tree-scan.test.ts` -- `it('AD-16 no skip-waiting names in non-test src/')`: same file list as the AD-1 test, assert it contains `src/shell/sw.ts` and `src/main.ts`, and no violation has rule `skip-waiting`.
- [x] `e2e/pwa/build-output.spec.ts` -- remove the `clientsClaim` assertion and its comment from the registerSW test (name unchanged); add `AD-16 the generated sw.js skips waiting only on SKIP_WAITING and has no clientsClaim`: no `clientsClaim`; `skipWaiting(` occurs exactly once; that occurrence is immediately preceded (`&&`) by a guard matching either operand order, `["'`]SKIP_WAITING["'`]\s*===\s*[\w$]+\.data\.type` or `[\w$]+\.data\.type\s*===\s*["'`]SKIP_WAITING["'`]` (minified names tolerated); comment on why (vite-plugin-pwa `prompt` mode output, AD-16 no skip-waiting).
- [x] F6 audit -- re-read every `e2e/pwa/` spec and the helpers they use for anything that can make a first install turn redundant (a failed precached URL via `context.route`, a route intercepting worker fetches, unregister, cache or storage clearing during install, closing the context mid-install is harmless); fix any spec found; record specs checked, any changed and why in Implementation Notes.

**Acceptance Criteria:**
- Given the faked registration in `src/shell/sw.test.ts`, when every I/O Matrix row runs, then each named `AD-16` case passes with its state and report count, and `messageSkipWaiting`/`messageSW` are never called.
- Given `src/` today, when the tree scan and `AD-16 no skip-waiting names in non-test src/` run, then no file reports `skip-waiting`, and the `AD-16` fixture cases fail/pass as listed.
- Given `dist/` and `dist-test/`, when `AD-16 the generated sw.js skips waiting only on SKIP_WAITING and has no clientsClaim` runs, then it passes; the registerSW test still passes under its 7.1 name.
- Given the full suite, when `npm run test:all` runs, then it is green and every `pwa` spec still passes with the hook-build halt live (F6).

## Implementation Notes

Review-log unapplied minors, resolved: (1) the build-output test is named in full and pinned by the 7.1 plan for entry 8 — Never, Tasks; (2) non-failure cases assert no `reportError` with the gate on — Tasks, Matrix; (3) `undefined` `register()` is the type's branch only; F6 `block` stubs reject first (`register()` reads `.controller`/`.waiting`) and fall under the rejected case — Matrix, Code Map; (4) "reached `activated`" = some observation saw it `activated` — Always; (5) record first-seen workers, then check — Always, Design Notes; (6) either operand order before the single `skipWaiting(` — Tasks; (7) stub `navigator` itself, test `navigator.serviceWorker === undefined` — Tasks, Design Notes; (8) "(F17 included)" is moot in `sw.ts` (it never loads after F17); the sticky guard is `swState() === 'failed'` — Design Notes; (9) comment-only passing and `.svelte` markup failing fixtures — Tasks; (10) gate: the plan's `VITE_TEST_HOOKS === '1'` deliberately omits build-notes' `import.meta.env.DEV ||` (equivalent: `sw.ts` never loads in dev, F3; and it lets Vitest run gate off), so CAP-9 syncs build-notes to this as-built form; (11) constructor-throws case — Matrix; (12) the ticket wording is not edited (never write a ticket file); the plan's rule omits the redundant clause. Carried pass-2 items: scan placement (a `check()` rule plus a dedicated `AD-16` tree test), one `Q-40`-prefixed message per cause with `cause`, `unstubAll*` in `afterEach`, the already-redundant row, the sticky two-worker setup, F6 audit scope, and 7.1 minor 2 (moot: dropping `&& !halted()` leaves no branch) — all adopted above.

As built (2026-10-30):
- `sw.ts`: `recompute` tracks the newest non-redundant slot worker's first-seen order in the slot loop (`newestLive`) instead of a second pass over the slots; a seen worker fails when it is `redundant`, not in `reached` and `newestLive < order`. A seen-order `Map` replaces 7.1's `listened` WeakSet (it also holds the one-listener guard). Mutation-checked: disabling the redundant check fails 9 cases; reverting the slot read order to installing, waiting, active fails the update-failure and replacement cases.
- `sw.ts` (code review): each worker is judged once, at the first recompute that sees it `redundant` (`judged` WeakSet), so a replaced worker is never re-judged after its replacement later turns redundant; the redundant report names the worker's `scriptURL`. `sw.test.ts` adds the judged-once and gate-read-at-call-time cases, keeps the failing worker slotted in the update-failure case, and unstubs before the `afterEach` assertions.
- `sw.test.ts`: `load(options)` takes `registration`, `rejection` (the rejected promise is created only when `register()` is called, so no unhandled rejection), `gate`, `container` and `construct`. The sticky case drives a second worker (`updatefound` → `installed` → `redundant`). The activated-then-superseded case ends `unregistered` (slots empty).
- `architecture-tree-scan.test.ts`: the AD-1 and AD-16 tree tests share one lazily computed scan (AD-17 Speed: a second full scan cost about 1.9 s on drvfs).
- `build-output.spec.ts`: the guard regex also tolerates a bare `skipWaiting(` (receiver optional) after the `&&`; checked against today's `dist/sw.js`.
- F6 audit: checked `build-output`, `dist-smoke`, `font`, `precache`, `test-hook`, `theme` and the helpers they use (`board`, `celebration`, `dist-test`, `lifecycle`, `precache`, `seed`). No spec sets `serviceWorkers`, uses `context.route`, unregisters, or clears caches or storage during install; `seed.ts` only writes `localStorage` in an init script; `theme.spec.ts`'s `page.route` holds the entry chunk and `route.continue()`s it (page-level only, the worker's precache fetches are unaffected, so the install still succeeds). No spec changed.

## Plan Change Log

## Review Triage Log

### 2026-10-30 — Review pass
- verdicts: 22 findings — high 0, medium 1, low 14, false 7, maybe-false 0
- findings:
  - `[low]` `[patch]` (blind) `registerWorker` JSDoc says "always resolves" though a throwing constructor rejects — JSDoc now says it resolves after a Q-40 `failed`, other throws reject (rule 6).
  - `[low]` `[patch]` (blind) header "rejected or empty `register()`" clashes with the "empty registration is unregistered" test — now "a `register()` rejecting or resolving `undefined`".
  - `[low]` `[patch]` (blind) no failure case fires `redundant` while the failing worker is still slotted — update-failure case keeps the worker in `installing` during `move('redundant')`, still `failed`.
  - `[false]` `[reject]` (blind) straight-to-active supersede not exercised — the AC fixes this row as "no newer worker observed" so only the reached-`activated` rule keeps it out of `failed`; a newer worker in a slot is the newer-worker clause the replacement and update-failure cases pin.
  - `[low]` `[patch]` (blind) "gate read at call time" untested — added `AD-16 the report gate is read when the failure fires, not at import` (gate off at load, on before the failure → one report).
  - `[low]` `[defer]` (blind) main.ts F17 report change untested — grouped with the verification-gap row; entry 7 owns F17 proofs; added to `deferred`; since pinned by the source test `AD-16 src/main.ts reports the F17 chunk failure on the hook gate alone, halted or not`.
  - `[low]` `[reject]` (blind) build-notes `DEV ||` drift not in `deferred` — the fix edits this plan; Implementation Notes (10) records it for CAP-9, which owns the build-notes sync.
  - `[false]` `[reject]` (blind) plan has no review or verification evidence — the triage log is written at this point; `npm run test:all` exit 0 is recorded in Auto Run Result.
  - `[low]` `[reject]` (blind) an unregister or site-data clear while a worker is installing/waiting sets `failed` — matches SPEC CAP-1's literal rule (redundant before `activated`, no newer worker); silent in production; no spec unregisters (F6 audit); a guard needs an async `getRegistration()` branch.
  - `[low]` `[reject]` (blind) scan matches substrings (`updateSWBadge`) — consistent with the `popstate` check; a false positive fails loudly and a rename settles it; no such name exists in `src/`.
  - `[low]` `[patch]` (blind) redundant report carries no detail — reason now ends with the worker's `scriptURL`.
  - `[low]` `[patch]` (blind) `afterEach` asserts before unstubbing — unstubs first.
  - `[false]` `[reject]` (blind) strong `seen` Map vs weak `reached` unexplained — the comment says every seen worker is judged, also after leaving its slot, which needs an iterable strong map; at most a handful of workers per launch.
  - `[low]` `[reject]` (edge) external unregister reported as Q-40 — same root and reason as the blind unregister row.
  - `[low]` `[reject]` (edge) skip-waiting code in `index.html` or `public/` escapes the scan — the intent scopes the scan to non-test `src/` (SPEC CAP-1); the generated `sw.js` is pinned by the build-output test.
  - `[low]` `[defer]` (verification-gap) F17 report while already halted has no test — lens disposition `defer`; entry 7 owns F17; `deferred` entry; since pinned by the same source test.
  - `[medium]` `[patch]` (intent) a redundant worker is re-judged on every recompute, so a worker replaced while a newer live worker existed is reported later once the replacement activates and then turns redundant with slots empty — `judged` WeakSet: each worker judged once, at the first recompute that sees it `redundant`; new `AD-16 a replaced worker is judged once …` case (fails without the guard).
  - `[false]` `[reject]` (intent) "newer" read as "in a slot" vs "first observed after" — a registered non-redundant worker always sits in a slot; SPEC CAP-1 says "in any slot"; no observable difference.
  - `[false]` `[reject]` (intent) already-redundant-at-first-read widens the rule — SPEC's "any worker `sw.ts` observes … turning redundant" covers it; adopted from the review log's carried items.
  - `[false]` `[reject]` (intent) failure split only tested on fakes, not real hook builds — the AC sets the S surface; the Playwright Q-40 cases are CAP-5 (entry 7); `e2e/pwa/test-hook.spec.ts` still reaches `active` with the halt live.
  - `[low]` `[defer]` (intent) main.ts F17 change untested — same group as the verification-gap row; since pinned by the same source test.
  - `[false]` `[reject]` (intent) acceptance evidence missing — `npm run test:all` exit 0 before and after patches (Auto Run Result).

## Design Notes

`sw.ts` shape (boundaries, not literal code):

```ts
function fail(reason: string, cause?: unknown): void {
  if (swState() === 'failed') return;            // sticky, reported once
  setSwState('failed');
  if (import.meta.env.VITE_TEST_HOOKS === '1') reportError(new Error(`Q-40 ${reason}`, cause === undefined ? undefined : { cause }));
}
export async function registerWorker(): Promise<void> {
  if (navigator.serviceWorker === undefined) return fail('navigator.serviceWorker is absent'); // F5, before new Workbox
  const workbox = new Workbox('/sw.js', { scope: '/' });  // a throw here reaches AD-15
  let registration; try { registration = await workbox.register(); } catch (cause) { return fail('Workbox.register() rejected', cause); }
  if (registration === undefined) return fail('Workbox.register() resolved no registration');
  // seen: Map<ServiceWorker, number> first-seen order; reached: WeakSet of workers seen 'activated'
  // recompute: for [active, waiting, installing]: record new (order, statechange listener);
  //   for every seen worker: state 'activated' → reached;
  //   any seen worker 'redundant' && !reached && no slot worker with higher order and state !== 'redundant' → fail(...);
  //   then setSwState(precedence) as today (ignored once failed).
}
```

The check runs over every seen worker, not only slotted ones, so a worker that left its slot before its `redundant` `statechange` is still judged. `swState`'s import into `sw.ts` is from `./sw-state` (already imported for the setter).

## Verification

**Commands:**
- `npm test` -- expected: green, including `src/shell/sw.test.ts`, the `AD-16` fixtures and tree test.
- `npm run check` and `npm run lint` -- expected: clean.
- `npm run test:all` -- expected: exit 0 (`build` budget, `dist-smoke`, `test:e2e`, `test:e2e:pwa`).

## Auto Run Result

**Summary:** `src/shell/sw.ts` now carries the Q-40 failure split: an absent `navigator.serviceWorker` (F5, before `new Workbox`), a `register()` rejecting or resolving `undefined`, and a worker judged once when first seen `redundant`, never seen `activated`, with no newer live slot worker (first-seen order active < waiting < installing per slot read) set the sticky `failed`; the attempt resolves; the transition is reported once per launch through `reportError(new Error('Q-40 …'))` only when `VITE_TEST_HOOKS === '1'` at call time. `main.ts`'s F17 report is unconditional in hook builds. The AD-1 scanner gains a `skip-waiting` rule (strings kept, Svelte markup, non-test sources) with `AD-16` fixtures and the tree test `AD-16 no skip-waiting names in non-test src/`; the new build-output test `AD-16 the generated sw.js skips waiting only on SKIP_WAITING and has no clientsClaim` takes the `clientsClaim` assertion from the registerSW test (name kept for entry 8). F6 audit re-run: no `pwa` spec can make an install turn redundant; none changed.

**Files changed:**
- `src/shell/sw.ts` — F5 check, `register()` catch, `fail()` with the hook-build report, redundant-worker rule (seen order, `reached`, `judged`).
- `src/shell/sw.test.ts` — per-case `navigator`/`reportError`/env stubs, shared slot → state table, every I/O Matrix row plus judged-once and gate-at-call-time cases.
- `src/main.ts` — F17 report drops `&& !halted()`.
- `src/architecture-scan.ts` — `skip-waiting` rule, `SKIP_WAITING_NAMES`, `run(cases, id)`.
- `src/architecture-ad1.test.ts` — `AD-16 skip-waiting names` fixtures (4 fail, 4 pass).
- `src/architecture-tree-scan.test.ts` — shared lazy tree scan; `AD-16 no skip-waiting names in non-test src/`.
- `e2e/pwa/build-output.spec.ts` — new generated-`sw.js` test; `clientsClaim` assertion moved out of the registerSW test.

**Review findings:** 22 findings (high 0, medium 1, low 14, false 7). Patched 7 rows (1 medium: redundant workers re-judged on later recomputes → judged once; 6 low: JSDoc, header wording, slotted-redundant test, gate-at-call-time test, `scriptURL` in the report, `afterEach` unstub order). Deferred 1 entry (3 rows, low): the unconditional F17 report has no runtime test; a source pin in `src/architecture-tree-scan.test.ts` covers its condition. Rejected 12 with reasons in the Review Triage Log (7 `false`; 5 `low`: unregister/site-data clear reported as Q-40 per SPEC's literal rule (two rows), substring matching, build-notes drift owned by CAP-9, `index.html`/`public/` outside the intent's `src/` scope).

**Follow-up review recommendation:** `false` — first pass, patched counts by verdict: high 0, medium 1, low 6.

**Verification:** `npm run lint` and `npm run check` clean; `npm run test:all` exit 0 before and after the patches (after: unit 3,679 passed; `dist-smoke` 22 passed; dev e2e 1,126 passed; `pwa` 19 passed); size budget 560,685 / 600,000 (margin 39,315). Matrix audit: all 11 rows covered by named `AD-16` cases in `src/shell/sw.test.ts`, all run and passed.

**Residual risks:** in hook builds an external unregister or site-data clear while a never-activated worker is installing or waiting is reported as a Q-40 failure (SPEC CAP-1's literal rule; no spec does this; silent in production). The F17 unconditional report is pinned at source level only (no runtime halted-then-chunk-404 case). CAP-9 must sync build-notes' gate to the as-built `VITE_TEST_HOOKS === '1'` (no `DEV ||`). The ticket's plan checkpoint was not honoured as a pause: the invocation did not direct a halt after planning.
