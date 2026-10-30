---
id: 2
type: story
title: "Worker failure split and no-skip-waiting guards"
parent: epic-pwa-release
covers: [CAP-1]
after: [1]
risk: medium
---

# Worker failure split and no-skip-waiting guards

## Description

Completes CAP-1 on entry 1's `sw.ts` and state module:

- **Failure:** `failed` on a rejected or `undefined` `register()` (F6's `block` stub; replaces the current throw); on any worker observed this launch turning redundant before it reached `activated` (reached: any observation saw it `activated`) with no newer worker (newer: first observed by `sw.ts` after it; one slot read, at `register()` or a recompute, ranks active < waiting < installing; `updatefound` workers come later; a redundant worker never counts, even still in a slot when its `statechange` fires); and on an absent `navigator.serviceWorker` (F5), checked in `sw.ts` before `new Workbox(...)` (the real constructor touches it; 7.1 plan Residual risks). Only these set `failed`, then the attempt resolves; any other throw still reaches AD-15 (rule 6, SPEC Constraints).
- **Report:** `failed` is sticky and reported once per launch, on the transition into it (F17 included): silent in production; `reportError(new Error(...))` in hook builds (AD-15 halt; entry 5's trailing `halted()` check then skips persistence; this ticket adds no trailing check), a redundant install a listener sees later included. Gate: `import.meta.env.VITE_TEST_HOOKS === '1'` read at call time, as `main.ts` (`sw.ts` never loads in dev, F3). This ticket drops `&& !halted()` from `main.ts`'s F17 report so every Q-40 hook-build report is unconditional (AD-15: a later fatal replaces an earlier surface text; 7.1 code review Unapplied minor 1).
- **Scan:** an architecture source scan (string literals kept, `strip(sf, true)`; SPEC CAP-1's exclusions: `*.test.ts`, the `src/architecture-*.test.ts` files, `src/architecture-scan.ts`; Svelte markup checked too, as the `popstate` check) finds no `messageSkipWaiting`, `SKIP_WAITING`, `updateSW` or `virtual:pwa-register` in non-test `src/`; a scanner fixture case has `'SKIP_WAITING'` in a string.
- **Build output:** `e2e/pwa/build-output.spec.ts`'s existing no-`clientsClaim` test also asserts exactly one `skipWaiting(` in `sw.js`, after a `"SKIP_WAITING"===` guard on the message data's `type` (minified names tolerated), replacing its "No skipWaiting assertion" comment.
- **F6:** re-runs entry 1's F6 audit for any `pwa` spec the hook-build halt now breaks (an install silently turning redundant) and fixes it.

Interface: `failed` in the state module; the hook-build report through `reportError`; the new scan in `src/architecture-*.test.ts` / `src/architecture-scan.ts`. Tests: AD-16 failure rows (S); no-skip-waiting scan (S) and generated `sw.js` (B). Owns: Q-40 failure detection and the no-skip-waiting guards. Consumers: entries 3, 5 and 7 (the `failed` state and the halt in hook builds, so a broken install fails a spec at once instead of leaving it waiting). Plan checkpoint: yes.

## Acceptance Criteria

Verify: shell Vitest `AD-16` with a faked registration (`environment: 'node'`: gate via `vi.stubEnv`; `navigator.serviceWorker` and `reportError` via `vi.stubGlobal` per case, existing cases included) names and passes:

- first-install redundant (installing worker present at `register()`) → `failed`;
- update failure (older worker staying active) → `failed`;
- a second update found later via the module's own `updatefound`, redundant with no newer worker → `failed`;
- rejected and `undefined` `register()` → `failed`;
- absent `navigator.serviceWorker` → `failed`, the faked `Workbox` never constructed;
- sticky: a second failure leaves `failed` with no second `reportError` call;
- replacement (a waiting or installing worker superseded by a newer observed one, even still in its slot when the event fires) → not `failed`;
- activated-then-superseded → not `failed`.

Failure cases check the split (gate off: no `reportError` call; on: exactly one); non-failure cases assert none; these are rule-coverage's "Q-40 failure in a test build" S part. `sw.test.ts` uses one shared slot → `ServiceWorkerState` table (`installing`/`installed`/`activated`) and its updatefound case fires `statechange` (7.1 Unapplied minors 3–4). `AD-16 no skip-waiting names in non-test src/` (with its fixture case) and `AD-16 the generated sw.js skips waiting only on SKIP_WAITING and has no clientsClaim` pass; the plan records the F6 audit (specs checked, any changed, why); `npm run test:all` is green.

## References

- parent — _bmad-output/initiative-wordcell-v1/epic-pwa-release/epic-pwa-release.md
- spec — SPEC.md CAP-1, F4, F5, F6, F17; build-notes.md Worker module and state (Failure), Packaging and budget; rule-coverage.md (AD-16 no-prompt row: S, B; Q-40 test-build row: S)
- rules — docs/game-flow-spec.md Q-40
- architecture — ARCHITECTURE-SPINE.md AD-1 (scan list), AD-15, AD-16
- ticket 7.1 — story-worker-registration-state-module-and-swstate-plan.md; _bmad-output/implementation-artifacts/review-loop/7-1-build.md (Unapplied minors 1, 3, 4)
- code — src/shell/sw.ts, src/shell/sw-state.ts, src/shell/sw.test.ts, src/main.ts, src/architecture-scan.ts, src/architecture-ad1.test.ts (fixture cases, beside the popstate check), src/architecture-tree-scan.test.ts, e2e/pwa/build-output.spec.ts
