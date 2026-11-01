# Review loop — ticket 7.10 build (code, 575fdf7..HEAD)
State: pass 1: done

Target: commit range `575fdf7..HEAD` (build commits b11abd5, 6629acd, 38a52d5, 38f5dd8; orchestrator commits 7526c3d, 5eb79db, af364fe, a96de01 are context; staged as `7-10-build.passes/pass0.diff` excluding `_bmad-output/implementation-artifacts/autopilot/` and `tickets.toml`); intent `_bmad-output/initiative-wordcell-v1/epic-pwa-release/story-refactor-sweep-plan.md`. Depth thorough, max 7.
Pre-loop: HEAD 38f5dd809420da4d0b8c484f76b095a7dc402322, tree snapshot 0 f2c2d4afaf67bdf716d7f0837910b499946eac9e.
Refs: docs/game-flow-spec.md, docs/requirements-carryover.md, CLAUDE.md, AGENTS.md, ARCHITECTURE-SPINE.md, epic-pwa-release.md, story-refactor-sweep.md, story-refactor-sweep-plan.md, docs/device-testing.md.

## Pass 1 — 2026-10-31
Reviewers: correctness, edge cases, verification gap, intent alignment  |  Findings: major 2, minor 9, decision-needed 0  |  Dropped in triage: 0 (2 duplicates merged)
Snapshot: tree b1a28ea479bef1589668c387b1074dae5d8fa7b2 (fix diff `7-10-build.passes/pass1.fix.diff`). Fixer: 11/11 applied (plan; device-preview.test.mjs session-only and history-only cases; update.spec.ts `readState` restart flag and `withSite` cause; test-hook.spec.ts rejected `persist()` case; tree-scan D-23 pin bounded to the accessor; helpers.spec.ts holdListText body-failure case; mutations recorded for D-22 (distinguishing 20 ms delayed throw: new 8/8 fail, baseline 8/8 pass), D-34, holdListText). Fixer runs: item 6 three android runs 902 passed each (D-64 0/3, D-65 0/3); item 7 on a Linux clone: unit median 4.65 s, watch 478 ms, AD-18 margin 39,298; final `npm run test:all` **exit 1**: `test:e2e` 1 failed, `AD-17 doubleTap gives two touch taps whose clicks have detail 1 then 2, even 600 ms apart in real time` (e2e/helpers.spec.ts:1102, untouched this pass; clicks `[1, 1]`, second tap 1780 ms after the first), `test:e2e:pwa` not reached (run alone after: 41 passed); `test:screens` not run. Fixer added row D-71 with disposition open. Orchestrator: `npm test` 3787 passed, `npm run lint` pass, `npm run check` 0 errors. The `test:all` failure is a major for pass 2.
### Applied
- [major] plan § Entry-11 amendment (:206) — "none proposed so far" contradicts the plan's own D-65 tickets.toml fix ticket (now entry 13, which entry 11 waits on) → fixer item 1
- [major] `scripts/device-preview.test.mjs` "AD-17 device preview run" — only no-fixture and both-fixture runs are tested; `seeded` `||` → `&&` survives, so D-53's "seed write only when seeded" clause is unproven for the session-only (G5) and history-only (G6) runs → fixer item 2
- [minor] plan frontmatter `deferred` — still lists the settled T5/D-70 item as `medium (unverified)`; plan elsewhere says Deferred: none (two lenses) → fixer item 3
- [minor] plan D-29 — "closed by item 7's re-measurement" is not one of ticket item 2's disposition forms → fixer item 4
- [minor] `e2e/pwa/update.spec.ts` `readState`/`track` — a restart is not remembered, so later iterations evaluate B's restarted handle again (Playwright waits for a new context with no deadline); doc comment says the poll then reads A's record → fixer item 5
- [minor] `e2e/test-hook.spec.ts` D-33 — only a `persisted()` rejection is tested; a `persist()` rejection path (storage.ts:39) has no case → fixer item 6
- [minor] `e2e/pwa/update.spec.ts` `withSite` — the AggregateError hides the cleanup error and body stack in Playwright's report (only message/stack/cause serialised) → fixer item 7
- [minor] `src/architecture-tree-scan.test.ts` "AD-17 recomputePrecacheComplete … env-gated accessor" — pin bounds only the env-gated block, not the accessor → fixer item 8
- [minor] `e2e/helpers/boot-calls.ts` `holdListText` / helpers.spec case — no helper-side mutation recorded for the case; the added `original.catch` path has no case → fixer item 9
- [minor] plan T6 / D-22 — the recorded mutation also fails the old placement; no distinguishing run → fixer item 10
- [minor] plan T1 / D-34 — the `.svelte <script>` and template-substitution fixtures have no recorded mutation → fixer item 11
### Default applied (technical)
- fixer item 2 — two fake-io cases (session-only, history-only) plus the recorded `&&` mutation
- fixer item 5 — remember a `restarted` handle error in `track()` so later reads skip B's handle; self-test case
- fixer item 7 — keep the body error, attach the cleanup error as `cause` (AggregateError with `cause` + body stack when the body error already has one)
- fixer item 8 — anchor the bound on the `precacheComplete` accessor (or rename the test if anchoring is brittle)
- fixer item 10 — a distinguishing delayed-throw mutation; if none separates them, D-22 becomes declined with the evidence
- any code change re-triggers ticket items 6 and 7, the final `test:all` and `test:screens` (ticket item 6: "any later such commit's author, review fixer included, re-runs them"); fixer re-runs and records them
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- none
