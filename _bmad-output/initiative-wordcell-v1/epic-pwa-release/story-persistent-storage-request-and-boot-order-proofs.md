---
id: 5
type: story
title: "Persistent-storage request and boot-order proofs"
parent: epic-pwa-release
covers: [CAP-3, CAP-1, CAP-4]
after: [2, 4]
risk: low
---

# Persistent-storage request and boot-order proofs

## Description

Adds CAP-3: `requestPersistence()` in `src/shell/storage.ts` (absent `navigator.storage` → return; `persisted()` true → return; else `persist()`, result ignored; no catch, a rejection reaches AD-15). `main.ts` calls it once per launch: one `if (halted()) return;` then `await requestPersistence()` after the whole `if (!import.meta.env.DEV)` block, so it runs after F3's dev skip, a settled attempt and F17's catch (F17 "persistence follows as after a failed attempt"; entry 7's chunk-404 cases prove that path); no catch at the call site either (rule 6: a rejection reaches AD-15's `unhandledrejection` handler); the call is the spec-sanctioned exception to "`storage.ts` is called only by the shell stores", which entry 11 records in AGENTS.md.

The single-owner scan gains `navigator.storage` outside `src/shell/storage.ts`: a new rule id mirroring the `localStorage` rule under the same `storageCheck` exclusions, on the string-stripped script and on Svelte markup, matching `navigator`, then `.` or `?.`, then `storage` as a whole identifier (`window.navigator.storage` matches, `navigator.storageBuckets` does not); fixture cases mirror the `localStorage` set, plus `navigator?.storage` and `window.navigator.storage` flagged and `navigator.storageBuckets` not flagged.

The call-recording init script, owned here, is an `e2e/helpers/` module (e.g. `boot-calls.ts`) taking a `Page` and using `page.addInitScript`, never `context.addInitScript`: it wraps `register`, `persisted` and `persist`, stubs `persisted()` false and records a `dictionaryState()` snapshot with every logged event (`register` call, `register` settle, `persisted`, `persist`), skipped when `window.__wordcell` is absent (entry 7 reuses it on `dist/`). The `register` wrapper logs the original promise's settle, fulfilled or rejected, through `then(onFulfil, onReject)`, never an unhandled rejection (entry 7's hook-free cases have `register` reject), and returns the original promise; with an option (off by default) on, it returns a new promise settling as the original did once the test calls the helper's release function. `e2e/helpers.spec.ts` covers a rejected `register`, hold and release, and the hook-absent snapshot skip.

The boot-order P7 tests, `pwa` cases in a new `e2e/pwa/boot-order.spec.ts`; every route here, dictionary and `sw.ts` chunk, is a `page.route` on the uncontrolled first-launch page, so the worker's precache fetch is unaffected (CAP-3):

- First-launch order (CAP-4's first-launch clause, CAP-1's dynamic-import row, rule-coverage's AD-8 boot-order P7; review log unapplied minor): the dictionary route held until its handler is hit, then two animation frames plus a macrotask, then released; the `sw.ts` chunk route (entry 1's `swChunkFile()`) not hit while it is held, hit only after release, and `dictionaryState()` not `loading` when it is.
- A dictionary-404 launch and a dictionary-timeout launch, each dictionary route asserted hit (timeout: `page.clock.install()` before `goto`, the route held, `page.clock.fastForward` past `TIMEOUT_MS` (30 s); the worker runs outside the page clock (unverified), so it asserts order only).
- The dev case (F3): the existing `e2e/test-hook.spec.ts` dev test, extended and renamed to start `AD-16 AD-7 AD-17`.
- Three F4 halt cases named `AD-16 AD-7 (F4) …`, init script and routes on the first page only, each halting by `reportError(new Error(...))` via `page.evaluate` (no second page): halt while the dictionary request is held, its route asserted hit (the `sw.ts` chunk routed too; fulfil, poll `dictionaryState()` out of `loading`, one macrotask, then `waitForLoadState('networkidle')`); halt while the `sw.ts` chunk request is held, its route asserted hit (released by `route.continue()`, never a stub, which leaves `sw.registerWorker` undefined; then `page.evaluate` of `import(<chunk URL>)`, the same module record, resolving only after evaluation, then one macrotask); halt during the registration attempt (`register` held by the init script's option and asserted called, halt, release, poll `swState()` out of `unregistered` (`registerWorker()`'s last step), one macrotask; the one case reaching CAP-3's trailing `halted()` check).

Entry 5 fields: interface — `requestPersistence()`, the init script. Tests — AD-7 `requestPersistence()`, AD-1 scan (S); rule-coverage AD-16 dynamic-import, AD-8 boot-order, AD-7 once-per-launch, (F3) and (F4) rows (P7, Playwright dev). Owns — persistence, its scan, the init script, the boot-order proofs. Consumers — entry 7 (init script, hook-free on `dist/`, Q-40), entry 11 (AGENTS.md exception).

## Acceptance Criteria

Verify: Shell Vitest `AD-7` cases: absent `navigator.storage` → resolves `undefined` without throwing; `persisted()` true → no `persist()`; `persisted()` false → exactly one `persist()`, its `false` result ignored (resolves `undefined`); `persisted()` rejecting (no `persist()`) and `persist()` rejecting each reject `requestPersistence()` with that error. The `navigator.storage` scan, its fixture cases and the `helpers.spec.ts` cases pass. `pwa` tests named AD-16 AD-7 (the first-launch order test `AD-8 AD-16 AD-7 …`) show dictionary settled → exactly one `register` call → `register` settled → one `persisted` then one `persist` call on first launch, after a dictionary 404 and after a dictionary timeout (dictionary route hit; snapshots `ready` on first launch, `failed` after the 404 and the timeout), once the `persist` entry appears, `networkidle` plus one macrotask, then the whole log asserted; on first launch the `sw.ts` chunk is hit only after the dictionary's release, with `dictionaryState()` not `loading` at its handler. The two pre-registration F4 cases show their held route hit and no `register`, `persisted` or `persist` call (the dictionary-held one also no `sw.ts` chunk request), read after the `networkidle` wait (dictionary-held) or the evaluated `import(<chunk URL>)` plus one macrotask (chunk-held); the registration-attempt case, read after the release once `swState()` leaves `unregistered`, plus one macrotask, shows `register` called and no `persisted` or `persist` call. The renamed dev test shows no `register`, no `/src/shell/sw.ts` request and one `persisted` then one `persist`, the snapshot at `persisted` settled (`ready` or `failed`). `npm run test:all` is green.

## References

- parent — _bmad-output/initiative-wordcell-v1/epic-pwa-release/epic-pwa-release.md
- spec — SPEC.md CAP-3, CAP-1 (P7 order cases), F3, F4; build-notes.md Persistence, Worker module and state (Boot); SPEC.review-log.md Result (unapplied minors)
- architecture — ARCHITECTURE-SPINE.md AD-1, AD-7, AD-15, AD-16
- code — src/shell/storage.ts, src/main.ts, src/shell/dictionary.svelte.ts (TIMEOUT_MS), src/architecture-scan.ts, e2e/test-hook.spec.ts

## Notes

- Decided: the epic Notes (owner, 2026-10-29) answer the Firefox persistent-storage question "keep AD-7, request once per launch in every browser (A-A3 unchanged)", so `requestPersistence()` is as specified.
- If `page.clock` cannot drive the dictionary timeout on `dist-test/`, the build stops `blocked` with the evidence (no test-only timeout seam, no change to the row's test kind).
- F4 supersedes AD-15's "later steps still run" and AD-7's "after the attempt settles" wording until entry 11 (CAP-9) syncs the spine (SPEC F4); not a spine bug to stop on.
