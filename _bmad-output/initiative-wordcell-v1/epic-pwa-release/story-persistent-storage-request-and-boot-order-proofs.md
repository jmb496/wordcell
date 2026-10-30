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

The single-owner scan gains `navigator.storage` outside `src/shell/storage.ts`: a new rule id mirroring the `localStorage` rule under the same `storageCheck` exclusions, on the string-stripped script and on Svelte markup, matching `navigator`, then `.` or `?.`, then `storage` as a whole identifier (`window.navigator.storage` matches, `navigator.storageBuckets` does not); fixture cases mirror the `localStorage` set (a shell file and markup flagged; `storage.ts`, a shell `*.test.ts` and a string not flagged).

The call-recording init script, owned here, is an `e2e/helpers/` module (e.g. `boot-calls.ts`) taking a `Page` and using `page.addInitScript`, never `context.addInitScript`: it wraps `register`, `persisted` and `persist`, stubs `persisted()` false and records a `dictionaryState()` snapshot with every logged event (`register` call, `register` settle, `persisted`, `persist`), skipped when `window.__wordcell` is absent (entry 7 reuses it on `dist/`). The `register` wrapper records the settle, fulfilled or rejected, through `then(onFulfil, onReject)` on the original promise and returns that promise unchanged, never creating an unhandled rejection (entry 7's hook-free cases have `register` reject); an option, off by default, holds the returned promise's settle until the test releases it, then settles it the same way. `e2e/helpers.spec.ts` covers a rejected `register` and the hook-absent snapshot skip.

The boot-order P7 tests, `pwa` cases in a new `e2e/pwa/boot-order.spec.ts`; every dictionary route here (held, 404, timeout) is a `page.route` on the uncontrolled first-launch page, so the worker's precache fetch is unaffected (CAP-3):

- First-launch order (CAP-4's first-launch clause, CAP-1's dynamic-import row, rule-coverage's AD-8 boot-order P7; review log unapplied minor): the dictionary route held until its handler is hit and `current().kind` is `active`, then two animation frames plus a macrotask, then released; the `sw.ts` chunk route (entry 1's `swChunkFile()`) not hit while it is held, hit only after release, and `dictionaryState()` not `loading` when it is.
- A dictionary-404 launch and a dictionary-timeout launch (`page.clock.install()` before `goto`, the held dictionary route asserted hit, the clock run past `TIMEOUT_MS` (30 s) as `e2e/dictionary.spec.ts` does in dev; the worker runs outside the page clock, so the case asserts order only).
- The dev case (F3): the existing `e2e/test-hook.spec.ts` dev test, extended and renamed to start `AD-16 AD-7 AD-17`.
- Three F4 halt cases, init script and dictionary route on the first page only, each halting by `reportError(new Error(...))` via `page.evaluate` (no second page): halt while the dictionary request is held (the `sw.ts` chunk routed too; fulfil, then `waitForLoadState('networkidle')`); halt while the `sw.ts` chunk request is held (fulfil, then `page.evaluate` of `import(<chunk URL>)`, the same module record, resolving only after evaluation, then one macrotask); `AD-16 AD-7 (F4) halt during the registration attempt` (`register` held by the init script's option and asserted called, halt, release, the settle plus one macrotask; the one case reaching the trailing `halted()` check).

Entry 5 fields: interface — `requestPersistence()` in `storage.ts`; the call-recording init script in `e2e/helpers/` (call log with `dictionaryState()` snapshots). Tests — AD-7 `requestPersistence()` (S); AD-1 `navigator.storage` scan (S); AD-16 dynamic-import order, AD-8 boot order, AD-7 once per launch, AD-16 AD-7 (F3) dev and (F4) halted rows of rule-coverage.md (P7, Playwright dev). Owns — persistence, its scan, the call-recording init script and the boot-order proofs. Consumers — entry 7 (the init script, hook-free on `dist/`, for the Q-40 persistence assertions), entry 11 (AGENTS.md exception).

## Acceptance Criteria

Verify: Shell Vitest `AD-7` cases: absent `navigator.storage` → no call; `persisted()` true → no `persist()`; `persisted()` false → exactly one `persist()`, its `false` result ignored (resolves `undefined`); `persisted()` rejecting (no `persist()`) and `persist()` rejecting each reject `requestPersistence()` with that error. The `navigator.storage` scan and its fixture cases pass; the `helpers.spec.ts` cases pass. `pwa` tests named AD-16 AD-7 (the first-launch order test `AD-8 AD-16 AD-7 …`) show dictionary settled → exactly one `register` call → `register` settled → one `persisted` then one `persist` call on first launch, after a dictionary 404 and after a dictionary timeout, the whole log asserted once the `persist` entry appears, then `networkidle` plus one macrotask; on first launch the `sw.ts` chunk is not requested while the dictionary is held, is hit only after release, and `dictionaryState()` is not `loading` when the request reaches the handler. The two pre-registration F4 cases show no `register`, `persisted` or `persist` call (the dictionary-held one also no `sw.ts` chunk request, all read after the `networkidle` wait); the registration-attempt case shows `register` called and no `persisted` or `persist` call. The renamed dev test shows no `register`, no `/src/shell/sw.ts` request and one `persisted` then one `persist`, the snapshot at `persisted` settled (`ready` or `failed`), never `loading`. `npm run test:all` is green.

## References

- parent — _bmad-output/initiative-wordcell-v1/epic-pwa-release/epic-pwa-release.md
- spec — SPEC.md CAP-3, CAP-1 (P7 order cases), F3, F4; build-notes.md Persistence, Worker module and state (Boot); SPEC.review-log.md Result (unapplied minors)
- architecture — ARCHITECTURE-SPINE.md AD-1, AD-7, AD-15, AD-16
- code — src/shell/storage.ts, src/main.ts, src/shell/dictionary.svelte.ts (TIMEOUT_MS), src/architecture-scan.ts, e2e/test-hook.spec.ts

## Notes

- Decided: the epic Notes (owner, 2026-10-29) answer the Firefox persistent-storage question "keep AD-7, request once per launch in every browser (A-A3 unchanged)", so `requestPersistence()` is as specified.
- If `page.clock` cannot drive the dictionary timeout on `dist-test/`, the build stops `blocked` with the evidence (no test-only timeout seam, no change to the row's test kind).
- F4 supersedes AD-15's "later steps still run" and AD-7's "after the attempt settles" wording until entry 11 (CAP-9) syncs the spine (SPEC F4); not a spine bug to stop on.
