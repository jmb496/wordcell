# Review loop — ticket 7.4 (precacheComplete() test hook)

State: pass 4: done

Target: `_bmad-output/initiative-wordcell-v1/epic-pwa-release/story-precachecomplete-test-hook.md` (docs mode, thorough, max 7)
Pre-loop: HEAD 7b800d0; pass 0 copy `story-precachecomplete-test-hook.review-log.passes/pass0.md`, 262 words (growth budget 1500 words, stated).
Intent also includes tickets.toml entry 4 fields not copied into the ticket: interface, tests, owns, consumers (copy at `.passes/entry4.toml`; fixer adds them to the Description in pass 1).
Refs: SPEC.md and companions rule-coverage, device-checks, release-checklist, build-notes of `_bmad-output/specs/spec-epic-7-pwa-release/`, epic-pwa-release.md, ARCHITECTURE-SPINE.md, AGENTS.md, plans of done tickets 7.1, 7.2, 7.3.

## Pass 1 — 2026-10-30
Reviewers: builder's reading, edge-case hunter, adversarial, ref alignment  |  Findings: major 5, minor 11, decision-needed 0  |  Dropped in triage: 0 (duplicates merged across lenses)
Words (docs): 696 (2.66x pass 0; budget 1500)  |  Snapshot: story-precachecomplete-test-hook.review-log.passes/pass1.md (fix diff pass1.fix.diff)
Fixer: all 16 items applied, no conflicts; checked against Workbox 7.4.1 in node_modules: precache cache name `workbox-precache-v2-<scope>` (no `cacheId` set), keys `new URL(url, sw.js URL)` with `__WB_REVISION__` only when revision non-null; `dist-test/sw.js` entries relative, one `precacheAndRoute(`.
### Applied
- [major] Description, recompute — overlapping calls under `expect.poll` can fetch `/sw.js` twice (breaks "once"; a late fetch offline rejects to AD-15 in entry 6) and a stale recompute can overwrite a newer value → fixer item 1
- [major] Description, "failing fast" — a synchronous accessor cannot throw the async failure; routing (AD-15 via `unhandledrejection`), the failure set and the Vitest seam unstated; "while online" reads as a guard → fixer item 2
- [major] Description, comparison — relative manifest URLs vs absolute cache keys, which cache, and "every URL" unstated (AD-17 Reading state) → fixer item 3
- [major] AC, Vitest list — fetch-once-and-keep, `activating` worker and partial cache untested → fixer item 4
- [major] AC, dev read — initial value unstated, so one dev read is vacuous → fixer item 5
- [minor] "later recomputes read only Cache Storage" reads as skipping the registration check → fixer item 6
- [minor] build-notes "never at boot or on activation" dropped → fixer item 7
- [minor] `src/shell/test-hook.test.ts` missing from change-together list; six keys unnamed → fixer item 8
- [minor] module location choice open (tree-shaking, AGENTS.md list, AD-17 Binds) → fixer item 9
- [minor] "(entry 2's files)" — entry 1 owns them → fixer item 10
- [minor] F1 has no named check → fixer item 11
- [minor] `pwa` test has no independent cache cross-check → fixer item 12
- [minor] parse definition loose (zero/two calls, empty array, non-OK) → fixer item 13 (with item 2)
- [minor] revision-agnostic check and fixed `/sw.js` URL: callers reach `true` before any build swap → fixer item 14
- [minor] absent `navigator.serviceWorker` outcome unstated → fixer item 15
- [minor] tickets.toml entry 4 interface/tests/owns/consumers not copied → fixer item 16
### Default applied (technical)
- concurrency → one shared manifest promise; only the most recently started recompute writes the value
- failures → uncaught, reach AD-15 via `unhandledrejection`; no catch, no `navigator.onLine` check; parser an exported pure function `precacheUrls(source)` unit-tested directly
- comparison → URLs resolved against the absolute `/sw.js` URL; keys of caches whose name starts with `workbox-precache`, `__WB_REVISION__` param removed; `true` only when every URL is present
- initial value `false`; dev test reads again after the recompute settles and asserts no `/sw.js` request
- location → `src/shell/test-hook.ts`, helpers called only from the gated block
- absent `navigator.serviceWorker` → `false` (no activated worker, CAP-2), no fetch
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- none

## Pass 2 — 2026-10-30
Reviewers: fix diff, edge-case hunter, adversarial, ref alignment  |  Findings: major 2, minor 11, decision-needed 0  |  Dropped in triage: 0 (duplicates merged)
Words (docs): 956 (3.65x pass 0; budget 1500)  |  Snapshot: story-precachecomplete-test-hook.review-log.passes/pass2.md (fix diff pass2.fix.diff)
Fixer: all 13 items applied; item 2 vs the no-fetch cases resolved by asserting no fetch on a fresh module instance; checked against today's `dist/`, `dist-test/`: `precacheAndRoute(` only in `sw.js`, no `cacheId` in vite.config.ts, 5 `revision:null` entries beside revisioned ones.
### Applied
- [major] Failures/Parse, AC Vitest — the failure rules (non-OK with status, rejected `getRegistration()`/fetch/Cache Storage never turned into `false`, unclosed array) have no test and no seam: the accessor fire-and-forgets the recompute (pass 1 item 2 only half fixed) → fixer item 1
- [major] AC Vitest/pwa — the value starts `false`, so every `false` case (and the pwa "from `false`") passes with a recompute that never writes → fixer item 2
- [minor] comparison — cache-name filter untested; union over matching caches; prefix holds while no `cacheId` → fixer item 3
- [minor] "absent from `dist/`" has no check beyond `__wordcell` → fixer item 4
- [minor] newest-only write rule starves under fast polling → fixer item 5
- [minor] source of the absolute `/sw.js` URL unstated (node Vitest has no `location`) → fixer item 6
- [minor] all-present fake must mix revisioned and plain keys → fixer item 7
- [minor] dev read: first call before the hook exists returns `undefined` → fixer item 8
- [minor] rejected shared promise kept or reset unstated → fixer item 9
- [minor] calls after an offline reload refetch `/sw.js` → fixer item 10
- [minor] entry 5 shares `e2e/test-hook.spec.ts` and runs after entry 4 → fixer item 11
- [minor] pwa poll timeout (existing swState poll uses 15 s) → fixer item 12
- [minor] "no active worker" is two fakes (registration `undefined`, `active: null`) → fixer item 13
### Default applied (technical)
- seam → exported `recomputePrecacheComplete(): Promise<boolean>` (writes the value, rejects on failure), the accessor `void`s it from the gated block; Vitest awaits it
- false cases → reach `true` first on the same module instance, flip one condition, await, assert `false`; pwa bullet polls to `true`
- array close → string-aware bracket-depth scan from the `[` after the single `precacheAndRoute(` (whitespace allowed), as `arraySlice` in `e2e/helpers/precache.ts`
- write rule → a result writes only if its start number is higher than the last written one
- base → `new URL('/sw.js', location.href)` for fetch and resolution; Vitest stubs `location`
- dist check → a `dist-smoke` assertion that no app JS chunk contains `precacheAndRoute(` (plan picks the spec)
- rejected URL promise kept, never retried (rule 6)
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- none

## Pass 3 — 2026-10-30
Reviewers: fix diff, edge-case hunter, adversarial, ref alignment  |  Findings: major 2, minor 10, decision-needed 0  |  Dropped in triage: 0 (duplicates merged; the `dist-smoke` needle finding rated minor, as 3 of 4 lenses did and as its pass 2 origin)
Words (docs): 1212 (4.63x pass 0; budget 1500)  |  Snapshot: story-precachecomplete-test-hook.review-log.passes/pass3.md (fix diff pass3.fix.diff)
Fixer: all 12 items applied; checked: no `dist/assets/*.js` holds `precacheAndRoute` or `__WB_REVISION__` (today they sit in `dist/sw.js` and `dist/workbox-*.js`), `dist-smoke.spec.ts` runs only under `dist-smoke` (`pwa` testIgnore), dev test name at `e2e/test-hook.spec.ts:45`; unverified: the in-page `getRegistration()` settle step (runtime behaviour).
### Applied
- [major] Recompute/AC Vitest — what `recomputePrecacheComplete()` resolves with is unstated; the reject cases' "value unchanged" is vacuous (never at `true` first) or unwritable (reading the accessor starts another, rejecting, recompute); the kept rejected URL promise is untested (pass 2 item 1 follow-up) → fixer item 1
- [major] Accessor/AC — the accessor's own contract (import starts nothing, each call starts exactly one recompute, returns the last written value) is untested; every case awaits the recompute directly (CAP-2 "only when called", build-notes) → fixer item 2
- [minor] AC `dist-smoke` check — needle `precacheAndRoute(` misses a regex spelling; placement in a spec that also runs under `pwa` would fail → fixer item 3
- [minor] exports vs SPEC Constraints / 7.1–7.2 "no test-only export"; Interface omits them → fixer item 4
- [minor] parse silently drops a `url:` entry in another form → fixer item 5
- [minor] dev settle (macrotask, network idle) may not wait for `getRegistration()` → fixer item 6
- [minor] "exactly one `/sw.js` fetch" vs zero in dev → fixer item 7
- [minor] "called only from the env-gated block" vs Vitest direct calls → fixer item 8
- [minor] dev test: new or existing unstated → fixer item 9
- [minor] pwa page-side cache check duplicated by entry 6 → fixer item 10
- [minor] parse fixture not tied to the real `sw.js` shape → fixer item 11
- [minor] `__WB_REVISION__` removal method (trailing `?`) → fixer item 12
### Default applied (technical)
- recompute resolves with the stored value after its write step; `getRegistration()`/Cache Storage rejections start from `true`, restore stubs, then read `true`; fetch/non-OK/parse rejections assert a second recompute rejects too with one fetch, accessor never called after
- accessor case through `window.__wordcell.precacheComplete()` with spies: import calls nothing; first call returns `false` and calls `getRegistration()` once; after settle the next call returns `true`
- `dist-smoke` check in `e2e/pwa/dist-smoke.spec.ts`: no `dist/assets/*.js` contains `precacheAndRoute` or `__WB_REVISION__`
- parse throws unless the `url:` key count equals the `url:"…"` match count
- dev settle: in-page `await navigator.serviceWorker.getRegistration()` plus a macrotask; extend and rename the existing dev test
- strip via `URL.searchParams.delete('__WB_REVISION__')`; passing parse fixture excerpted from `dist-test/sw.js`
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- none

## Pass 4 — 2026-10-30
Reviewers: fix diff, edge-case hunter, adversarial, ref alignment (late-pass bar)  |  Findings: major 0, minor 10 (after merging 16 raw), decision-needed 0  |  Dropped in triage: 0
Words (docs): 1212 (4.63x pass 0; budget 1500), no fix pass  |  Snapshot: story-precachecomplete-test-hook.review-log.passes/pass3.md (unchanged)
### Applied
- none (converged; minors below left for the build's plan)
### Default applied (technical)
- none
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- none

## Result — converged after 4 passes

Majors per pass: 5, 2, 2, 0. No decision-needed items; no open major. Words 262 → 1212 (budget 1500).

Unapplied minors (for the build's plan):
- AC Vitest — the accessor `void`s its recompute, so "after that recompute settles" / "await the recompute that read started" have no promise: flush one macrotask (`setTimeout(0)`, fakes resolve on microtasks) after every accessor call and before each case ends (before `vi.unstubAllGlobals()`); check the `getRegistration()` count after the flush; the next call makes the second `getRegistration()` call.
- AC pwa — name the file and test: a new test in `e2e/pwa/test-hook.spec.ts` (rule-coverage.md AD-17 row) whose name starts with its ids.
- Parse — "or escaped" holds only if the match excludes backslashes (`url:"([^"\\]*)"`); otherwise cut "or escaped".
- AC dev — also assert the page stayed un-halted (`current().kind` `active` or no `pageerror`), since a rejecting dev recompute leaves every other assertion true.
- AC dev — read the collected request paths after the settle step plus a second `networkidle` placed after it.
- AC Vitest — "the first three also assert no fetch" is ambiguous with four fakes: name them (no `serviceWorker`, both no-active-worker fakes, `activating`).
- Recompute — the module reads `navigator`, `fetch`, `caches` and `location` as bare globals, stubbed with `vi.stubGlobal` (the existing `load()` stubs `window` as `{}`).
- Failures — a kept rejected promise reports to AD-15 on every poll call; the plan confirms `fatal` tolerates repeats (no guard in the hook).
- Parse — the `url:` key count is not string-aware (a `url:` inside a quoted string would throw on a valid manifest; Vite hashed names hold no `:`).
- Opening paragraph — "proved by the `dist-smoke` check" → "checked by".
