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

Adds CAP-3: `requestPersistence()` in `src/shell/storage.ts` (absent `navigator.storage` → return; `persisted()` true → return; else `persist()`, result ignored; no catch, a rejection reaches AD-15), called once from `main.ts` when entry 1's attempt settles unless `halted()` (F4; the spec-sanctioned exception to "`storage.ts` is called only by the shell stores", which entry 11 records in AGENTS.md); the single-owner scan gains `navigator.storage` outside `src/shell/storage.ts` with the `localStorage` check's exclusions and a scanner fixture case; and the boot-order P7 tests through a call-recording init script (wraps `register`, `persisted`, `persist`; stubs `persisted()` false; records `dictionaryState()` at `register` and at its settle, the snapshot skipped when `window.__wordcell` is absent, since entry 7 reuses the script on `dist/`) owned here: the first-launch order (CAP-4's first-launch clause and CAP-1's dynamic-import row: the dictionary route held, the `sw.ts` chunk route, found through entry 1's chunk helper, not hit while it is held, hit only after release, and `dictionaryState()` not `loading` when it is; review log unapplied minor), a dictionary-404 launch, a dictionary-timeout launch (`page.clock`), the dev case in `e2e/test-hook.spec.ts` (F3), and CAP-1's two F4 halt cases (halt while the dictionary request is held; halt while the `sw.ts` chunk request is held).

## Acceptance Criteria

Verify: Shell Vitest `AD-7` covers `requestPersistence()`'s branches (absent, already persisted, `false` ignored, rejection propagates); the `navigator.storage` scan and its fixture case pass; `pwa` tests named AD-16 AD-7 show dictionary settled → `register` called → `register` settled → one `persisted` then one `persist` call on first launch, after a dictionary 404 and after a dictionary timeout, the `sw.ts` chunk not requested while the dictionary is held, and no `register`, `persisted` or `persist` call in either F4 halt case; the dev test shows no `register`, no `/src/shell/sw.ts` request and one `persisted` then one `persist`; `npm run test:all` is green.

## References

- parent — _bmad-output/initiative-wordcell-v1/epic-pwa-release/epic-pwa-release.md
- spec — SPEC.md CAP-3, CAP-1 (P7 order cases), F3, F4; build-notes.md Persistence, Worker module and state (Boot); SPEC.review-log.md Result (unapplied minors)
- architecture — ARCHITECTURE-SPINE.md AD-1, AD-7, AD-15, AD-16
- code — src/shell/storage.ts, src/main.ts, src/shell/dictionary.svelte.ts (TIMEOUT_MS), src/architecture-scan.ts, e2e/test-hook.spec.ts

## Notes

- Open question: Whether `page.clock` drives `dictionary.svelte.ts`'s 30 s timeout on `dist-test/` without disturbing the worker's install; the owner's answer to the Firefox persistent-storage question (epic Notes) is expected before this entry starts, and an "installed app only" answer changes `requestPersistence()`.
