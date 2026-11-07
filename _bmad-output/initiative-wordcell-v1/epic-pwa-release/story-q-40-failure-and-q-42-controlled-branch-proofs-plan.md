---
title: 'Q-40 failure and Q-42 controlled-branch proofs'
type: 'feature'
ticket: '7'
created: '2026-10-31'
status: done
baseline_revision: '360b966b79d2d8121bbdbf35200eb8129c713f6c'
route: 'full'
route_source: 'auto'
review: 'thorough'
review_source: 'auto'
lenses_ran: ['blind-hunter', 'edge-case-hunter', 'verification-gap', 'intent-alignment']
review_loop_iteration: 0
followup_review_recommended: false
context:
  - '{project-root}/_bmad-output/initiative-wordcell-v1/epic-pwa-release/story-q-40-failure-and-q-42-controlled-branch-proofs.md'
  - '{project-root}/_bmad-output/specs/spec-epic-7-pwa-release/build-notes.md'
warnings: ['oversized']
deferred: []
---

<intent-contract>

## Intent

**Problem:** CAP-5's Q-40 failure paths (missing worker script, precache 404 during the first install, `sw.ts` chunk 404) and Q-42's controlled-worker retry branch have no Playwright proof on either build; the epic 3 P7 rows for Q-40 and Q-42 wait on them (F15, closed by entry 11).

**Approach:** Test-only: three `Q-40` cases in `dist-smoke.spec.ts`'s `F6 serviceWorkers allow` describe (hook-free `dist/`: boot, deal, validate, nothing shown), the same three failures in a new `pwa`-only `e2e/pwa/sw-failure.spec.ts` (`dist-test/`: AD-15 fatal surface, `swState()` `failed`), and one `Q-42` test in a new `pwa`-only `e2e/pwa/dictionary-retry.spec.ts` (F7: precache entry deleted, worker's network fetch answered 404 by `context.route`). The ticket's Description is the step-by-step contract; this plan adds only what it leaves to the build.

## Boundaries & Constraints

**Always:** Reuse entry 6's `pinNextSeed`, `composeTan`, `dealNewGame` (`e2e/helpers/offline.ts`), entry 5's `recordBootCalls`/`bootCalls` (`e2e/helpers/boot-calls.ts`), entry 3's `copy()` (`e2e/helpers/static-server.ts`, `stop()` in `finally`), entry 1's `swChunkFile()`/`buildRoot()` (`e2e/helpers/dist-test.ts`), `expectNoPrompt` (`e2e/helpers/live-region.ts`), `isList`/`waitForDictionary` (`e2e/helpers/restore.ts`). Every test asserts its route or server request was hit. `test.setTimeout(60_000)` on every new test (as entry 6's offline specs), bounded polls 15 s. Each route handler that is not the failing request answers `route.fallback()`.

**Never:** No `src/` change, no production branch (F7); no `playwright.pwa.config.ts` change (its explicit `dist-smoke` `testMatch` already omits both new files; only verified); no edit of either `rule-coverage.md` (entry 11); no file-level `test.use` in `dist-smoke.spec.ts` (F6); never weaken an assertion, drop the `request.serviceWorker()` filter or swap the failure mechanism to get green — the Stop rule applies instead.

**Stop rule (rule 7, ticket Notes + review-log minors 2, 3):** record in Implementation Notes and HALT `blocked` for the owner if: the held icon 404 does not turn the install redundant (`dist-test/`: no `failed`; `dist/`: a worker active or waiting); a worker request never reaches the `context.route` (icon or list: no hit with `request.serviceWorker()` non-null); or Q-42's page list response on the 404 reload is not status 404 with `fromServiceWorker()` true (the Workbox `PrecacheStrategy` network-fallback path is unverified on Playwright 1.63).

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Missing script, `dist/` | `copy(buildRoot())`, `remove('sw.js')`, serve | `/sw.js` 404 in `requests()`; log polled to exactly `register`, `register-settled` `rejected`, `persisted`, `persist`; nothing shown; deal, validate | Log never reaches the list → poll fails with the log |
| Missing script, `dist-test/` | same on `dist-test/` | `/sw.js` 404 in `requests()`; `swState()` `failed`; fatal surface | — |
| Icon 404, `dist/` | `context.route` on pathname `/icons/icon-192.png` before first `goto` | worker hit held until `register-settled` `fulfilled`, then 404; `getRegistration()` `undefined` or no `active`/`waiting`/`installing`; nothing shown; deal, validate | Log shows `register-settled` `rejected` → handler answers 404 and rejects the awaited promise with the log (minor 6) |
| Icon 404, `dist-test/` | same route | worker hit held until `swState()` `installing`, then 404; `failed`; fatal surface | `swState()` `failed` first → reject with a named error |
| Chunk 404, `dist/` | `page.route(chunkUrl)` holds | hit once; one macrotask later no `persisted`; then 404; log polled to exactly `persisted`, `persist` (no `register`); nothing shown; deal, validate | — |
| Chunk 404, `dist-test/` | `page.route(chunkUrl)` answers 404 at once | hit once; `failed`; fatal surface; one macrotask later no `register`/`persisted`/`persist` | — |
| Q-42 | controlled page, list entry deleted, `context.route` `**/en*.txt` | hit 1: 404; hit 2 held: banner, `loading`, no `load`; released: `ready`, banner gone, no `load`, exactly 2 hits | Hit 3+ answered 404 and recorded; non-worker hit recorded and `fallback()`ed; both fail the final assertion |

</intent-contract>

## Code Map

- `e2e/pwa/dist-smoke.spec.ts` -- add three tests at the end of `test.describe('F6 serviceWorkers allow')` (after the offline case, which shows the seeding/`pageerror`/`Promise.all` style); `errorsOf` is NOT used (console 404 lines; review-log pass 1 item 7). A local `playAndValidate(page)`: `composeTan`, `dealNewGame`, `composeTan`, Validate → `Confirm`, `glidesSettled`, `expectNoPrompt`.
- `e2e/pwa/sw-failure.spec.ts` -- new, `pwa` only; file-level `test.use({ serviceWorkers: 'allow' })` with an F6 comment.
- `e2e/pwa/dictionary-retry.spec.ts` -- new, `pwa` only; file-level `allow` with an F6 comment.
- `e2e/pwa/boot-order.spec.ts` -- pattern source: `chunkUrl(baseURL)`, `macrotask`, `order()` (its settle steps only: `persist` polled, `networkidle`, one macrotask; it also asserts `dictionary` keys and `current()`, absent on `dist/`).
- `e2e/pwa/update.spec.ts` -- pattern source for `copy()`/`served.url` and the `swState()` `failed` self-test on a `dist-test/` copy without `sw.js`.
- `e2e/dictionary.spec.ts` (AD-8 stubbed-controller test) -- pattern for held count, `loading`, banner (`text.wordListFailed`, "Word list didn't load."), `page.on('load')`.
- `e2e/helpers/precache.ts` `readPrecacheManifest`, `src/shell/test-hook.ts` `PRECACHE_PREFIX` (`workbox-precache`) -- for the icon-in-manifest check and the Q-42 cache delete.
- Read-only: `src/main.ts` boot tail (F17 catch: hook builds `reportError` → halt → no persistence; `dist/` → persistence), `src/shell/sw.ts` (`fail`), `src/shell/dictionary.svelte.ts` (`retry()` throws unless `failed`; in place when `navigator.serviceWorker.controller`), `src/ui/Halted.svelte` (fatal = one `alertdialog` titled `text.fatalTitle` "Something went wrong.").

## Tasks & Acceptance

**Execution:**
- [x] `e2e/pwa/dist-smoke.spec.ts` -- three cases per Matrix and the ticket's `dist-smoke` bullet; each: `pageerror` collected, `pinNextSeed`, `seedStorage(session-idle-fresh.json)`, `recordBootCalls` (all three: the precache gate reads it), `goto`, failure settled → `expectNoPrompt`, `playAndValidate`, `errors` `[]`. The precache case first asserts `readPrecacheManifest(request)` lists `icons/icon-192.png`, awaits the handler's promise, then polls `getRegistration()` and asserts the worker hit count is exactly 1 -- proves Q-40 on `dist/`.
- [x] `e2e/pwa/sw-failure.spec.ts` -- three boot-only cases per Matrix; local `expectFatal(page)`: `swState()` polled to `failed`, one `alertdialog` with heading `Something went wrong.`, `current().kind` `halted`. Hit checks: missing script `/sw.js` 404 in `requests()`; precache worker hits exactly 1 with `request.serviceWorker()` non-null; chunk route hits exactly 1. Chunk case arms `recordBootCalls` before `goto` -- proves Q-40 on `dist-test/`.
- [x] `e2e/pwa/dictionary-retry.spec.ts` -- one Q-42 test, steps exactly as the ticket's Q-42 bullet (no seed; delete by pathname across `workbox-precache*` caches, exactly one deleted; `Promise.all([page.reload(), page.waitForResponse(isList)])`) -- proves both Q-42 controlled rows.
- [x] Verify the `dist-smoke` list excludes the two new files (no config edit).

**Acceptance Criteria:**
- Given `npm run test:e2e:pwa`, when it runs, then the three `Q-40` tests of `sw-failure.spec.ts` and the `Q-42` test of `dictionary-retry.spec.ts` pass, each asserting its route or server hit.
- Given `npm run build && npm run test:e2e:dist`, when it runs, then the three `Q-40` cases of `dist-smoke.spec.ts` pass and neither new file is listed.
- Given `npm run test:all`, when it runs, then it exits 0.

## Implementation Notes

- Stop rule not triggered: on both builds the held icon 404 turned the first install redundant (`dist-test/`: `swState()` `failed` + fatal surface; `dist/`: `getRegistration()` polled to no worker in any slot), every worker request reached its `context.route` with `request.serviceWorker()` non-null (icon: exactly 1 hit; list: exactly 2), and Q-42's page list response on the 404 reload was status 404 with `fromServiceWorker()` true (Workbox `PrecacheStrategy` network fallback passes the 404 through on Playwright 1.63).
- `expect.poll(...).toSatisfy` is not available on `expect.poll` in 1.63: the `dist/` registration poll returns `'empty'` (no registration, or no installing/waiting/active worker) or the slot states, polled `toBe('empty')`.
- The dist-smoke helpers (`arm`, `playAndValidate`, `pageErrors`, `macrotask`) are local to the `F6 serviceWorkers allow` describe; `chunkUrl`/`macrotask` are re-declared in `sw-failure.spec.ts` rather than exported from boot-order (spec files export nothing).
- Every held-route wait is bounded: the handler polls 15 s and then rejects the test's awaited promise with a named error; the test races that promise against a 30 s "no worker request reached the context.route" timer.
- `playwright.pwa.config.ts` unchanged; `PW_PREVIEW=dist ... --list` shows 27 tests in 4 files, none from `sw-failure` or `dictionary-retry`.

## Plan Change Log

## Review Triage Log

### 2026-10-31 — Review pass
- verdicts: 18 findings — high 0, medium 1, low 10, false 7, maybe-false 0
- findings:
  - `[medium]` `[patch]` (blind) Q-42 collects no `pageerror` and never reads the store, so an AD-15 halt during the retry (Halted replaces App, banner gone, `dictionaryState()` `ready`) passes as "banner hides" — patched: `pageerror` collected before the first `goto`; after step 7 errors `[]` and `current().kind` `'active'`.
  - `[low]` `[patch]` (blind) icon handlers: a rejecting `bootCalls`/`swState` read leaves the route unanswered and the test fails 30 s later with the false "no worker request" message; deviates from Design Notes ("a handler's failure must reach the test as a rejected promise") — patched: hold loop in try/catch, fulfil 404 and `answered.reject(error)` (both files).
  - `[low]` `[patch]` (blind) dist-smoke Q-40 block comment claims every case requests persistence after the failure; the icon case never reads the log (persistence there follows the fulfilled `register()`) — patched: sentence narrowed to the missing-script and chunk cases.
  - `[low]` `[reject]` (blind) `sw-failure` missing-script case does not assert no persistence on the halted launch — not asked by the ticket; the F4 halt-during-registration case in `boot-order.spec.ts` already proves "no `persisted`/`persist` after a halt"; the fix adds assertions, not a correction.
  - `[false]` `[reject]` (blind) `sw-failure` icon case never proves the install turned redundant — `swState()` `failed` after the handler observed `installing` can only come from `sw.ts`'s redundant judgement (`register()` already fulfilled, the chunk loaded, so neither the rejected-register nor the F17 path is reachable).
  - `[low]` `[reject]` (blind) icon-hold logic, `macrotask`, `pageErrors` duplicated across spec files — real duplication (the try/catch patch landed twice), but extracting a tested `e2e/helpers/` helper is more than a direct correction; two call sites.
  - `[false]` `[reject]` (blind) `**/en*.txt` glob broader than `isList` could catch another asset — `dist/` and `dist-test/` hold exactly one `.txt` (`assets/en-*.txt`); the glob is AD-8 Tests' prescribed pattern (ticket); the duplicated `workbox-precache` prefix literal has no named divergence.
  - `[false]` `[reject]` (blind) `held[0]?.continue()` / `held[0]?.fulfill()` / `lists[0] as string` can silently skip — each is preceded by an assertion that the array has exactly one element (`expect.poll(held.length).toBe(1)`, `toHaveLength(1)`).
  - `[low]` `[patch]` (edge) dist-smoke icon handler unguarded `bootCalls` rejection — same root cause as the blind handler finding; patched there.
  - `[low]` `[patch]` (edge) sw-failure icon handler unguarded `swState` rejection — same root cause; patched there.
  - `[low]` `[patch]` (edge) comment vs icon case persistence — same root cause as the blind comment finding; patched there.
  - `[low]` `[reject]` (intent) R3b: dist icon check polls "empty" in one condition, so an active/waiting worker fails as a 15 s poll timeout with the slot states rather than at once — still fails, diagnosably (the last polled value lists the slots); restructuring adds a branch.
  - `[false]` `[reject]` (intent) R2a: `pwa` boot-only cases and Q-42 do not seed — the ticket's Q-42 bullet starts at "first `goto`" and the `pwa` cases are "boot only"; the seed belongs to the deal/validate sequence.
  - `[low]` `[reject]` (intent) R4b: a page-made list hit fails only at the final `pageHits` check — it is recorded and fails the test; the earlier 404/`fromServiceWorker()` assertions would also catch a page-served list; failing earlier adds a branch.
  - `[false]` `[reject]` (intent) R5b: delete across all `workbox-precache*` caches rather than one named cache — "exactly one entry deleted" holds in total; vite.config sets no `cacheId`, so there is one precache cache.
  - `[false]` `[reject]` (intent) extra assertions beyond the ticket (exact hit counts, still controlled, empty log) — strengthen, never contradict, the ticket.
  - `[low]` `[patch]` (intent) comment overclaims persistence for the icon case — same root cause as the blind comment finding; patched there.
  - `[false]` `[reject]` (intent) AC "`npm run test:all` green" not evidenced in the plan — run in this step's verification and recorded under Auto Run Result.

## Design Notes

Test names (rule-coverage mapping): `dist-smoke` row 19 → `Q-40 the worker script missing: …` and `Q-40 a precached icon 404 during the first install: …`; row 21 `dist/` half → `Q-40 (F17) the sw.ts chunk 404: …`; row 20 → `sw-failure.spec.ts` `Q-40 AD-15 the worker script missing …` and `Q-40 AD-15 a precached icon 404 …`; row 21 test-build half → `Q-40 AD-15 (F17) the sw.ts chunk 404 …`; rows 23–24 → `Q-42 under a controlling worker, Reload after a 404 retries in place with the banner kept and no page load, and the banner hides when the retry succeeds`.

Review-log unapplied minors: (1) missing script uses `order()`'s settle steps plus `expect.poll(() => bootCalls(page)).toStrictEqual([...])`, then `networkidle`, a macrotask and the same exact read (no `dictionary` key on `dist/`); (2), (3) Stop rule; (4) chunk `dist/`: "no `persisted`" read one macrotask after the hit; (5) chunk `pwa`: answers 404 at once (the F17 catch halts synchronously before the persistence check), recorder armed explicitly; (6) icon handler rejects with the log on `rejected`; (7) `test.setTimeout(60_000)`; (8) frontmatter `after` mirrors tickets.toml, entries 1 and 4 done: no change (tickets are never written by the build); (9) the no-surface check (`expectNoPrompt` + no `pageerror`) is `dist-smoke`-only, `pwa` expects the fatal surface; (10) `pwa` hit checks in Tasks; (11) Q-42 hit 3+ answered 404 and recorded.

A route handler's failure must reach the test as a rejected promise it awaits (never only an exception inside the handler, which surfaces as a timeout).

## Verification

**Commands:**
- `npm run lint && npm run check` -- expected: clean.
- `npm run test:e2e:pwa -- --grep "Q-40|Q-42" --repeat-each 3` -- expected: 12/12 pass.
- `npm run build && npm run test:e2e:dist -- --grep "Q-40" --repeat-each 3` -- expected: 9/9 pass.
- `PW_PREVIEW=dist npx playwright test -c playwright.pwa.config.ts --list` -- expected: no `sw-failure` or `dictionary-retry` entry.
- `npm run test:all` -- expected: exit 0.

## Auto Run Result

- Summary: test-only CAP-5 proofs. Three `Q-40` cases on the hook-free `dist/` build (missing `sw.js`, a precached icon 404 during the first install, the `sw.ts` chunk 404) each boot, deal and validate with nothing shown, with the boot-call log showing persistence after the missing-script and chunk failures. The same three failures on `dist-test/` reach the AD-15 fatal surface with `swState()` `failed`. One `Q-42` test under a real controlling worker shows Reload retrying in place (banner kept, no `load`) and the banner hiding once the held retry is released. No `src/` or config change.
- Files changed:
  - `e2e/pwa/dist-smoke.spec.ts` -- three `Q-40` cases inside the `F6 serviceWorkers allow` describe, with local `arm`, `playAndValidate`, `pageErrors`, `macrotask`.
  - `e2e/pwa/sw-failure.spec.ts` -- new, `pwa` only: three `Q-40 AD-15` boot-only cases and `expectFatal`.
  - `e2e/pwa/dictionary-retry.spec.ts` -- new, `pwa` only: the `Q-42` controlled-branch test (F7).
- Review (thorough: blind-hunter, edge-case-hunter, verification-gap, intent-alignment): 18 findings. Patched 3 entries (6 rows): medium 1 (Q-42 `pageerror` and `current().kind` `active` check), low 2 (icon-handler try/catch, the reject reaching the awaited promise; dist-smoke comment narrowed). Deferred: none. Rejected: 12 rows. Low ones rejected: no-persistence assertion on the halted missing-script launch (already covered by boot-order F4); helper extraction (more than a direct correction); R3b single-condition poll (still fails diagnosably); R4b late page-hit failure (still fails). False ones: the redundant proof (implied by `failed` after `installing`), glob breadth (one `.txt` in the builds), optional chaining (preceded by length assertions), no seeding (not asked), cross-cache delete (one precache cache), extra assertions, test:all evidence (recorded here).
- Follow-up review recommended: false (patched: high 0, medium 1, low 2; a single medium does not meet the threshold).
- Ticket review-log minors 1–11: resolved in Design Notes (8 recorded as no change: the ticket's frontmatter mirrors tickets.toml, entries 1 and 4 are done, and the build never writes ticket files). The ticket Notes stop rule did not trigger (Implementation Notes): on Playwright 1.63 the icon 404 turns the install redundant on both builds, worker requests reach `context.route` with `request.serviceWorker()` non-null, and the Q-42 404 reaches the page with `fromServiceWorker()` true.
- Verification (2026-10-31, after the patches): `npm run lint`, `npm run check` clean. `npm run test:e2e:pwa -- --grep "Q-40|Q-42" --repeat-each 3`: 18 passed (the 12 new runs plus the existing `update.spec.ts` Q-40 tests the grep matches). `npm run build && npm run test:e2e:dist -- --grep "Q-40" --repeat-each 3`: 9 passed. `PW_PREVIEW=dist … --list`: no `sw-failure` or `dictionary-retry` entry. `npm run test:all`: exit 0 (3733 unit, 27 `dist-smoke`, 1152 dev-server e2e, 36 `pwa`).
- Residual risks: the icon-hold logic is duplicated between `dist-smoke.spec.ts` and `sw-failure.spec.ts` (a candidate for entry 10's refactor sweep). Entry 11 still has to close the epic 3 P7 rows against these test names (the Design Notes mapping).
