# Review loop — ticket 7.4 (precacheComplete() test hook)

State: pass 2: done

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
