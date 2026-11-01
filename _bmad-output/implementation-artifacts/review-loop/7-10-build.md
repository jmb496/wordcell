# Review loop — ticket 7.10 build (code, 575fdf7..HEAD)
State: pass 4: done

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

## Pass 2 — 2026-10-31
Reviewers: fix diff, edge cases, verification gap, intent alignment  |  Findings: major 2, minor 7, decision-needed 0  |  Dropped in triage: 0 (4 duplicate reports of major 1 and 3 of minor 1 merged)
Snapshot: tree 0762fb9428906b6499e149b815b81e0e96adaa7b (fix diff `7-10-build.passes/pass2.fix.diff`; content outside `_bmad-output/` identical to the fixer's measured tree 2d012001e96d5610b132a023cae2fc87852d746c). Fixer: 9/9 applied (D-71 → fix ticket merged into D-64's backlog proposal; `readState` non-sticky with a per-read deadline race and self-test cases; `why` label; `withSite` non-Error case; `void done.catch` in sw-failure/dist-smoke; device-preview port-taken case; plan records name bbdd2d5 and the pass-2 tree). Fixer runs at the measured tree: `npm test` 3788; item 6 three android runs 902 passed each (D-64 0/3, D-65 0/3, D-71 0/3); D-70 three `test:e2e:pwa` runs 41 passed each (0/3); item 7 Linux clone: unit median 4.68 s, watch 473 ms, AD-18 margin 39,297; final `npm run test:all` exit 0 (unit 3788, dist-smoke 28, e2e 1160, pwa 41); `npm run test:screens` exit 0 (68 passed), no snapshot changes; invariants exit 0; plan status `built`. Orchestrator: `npm test` 3788 passed, `npm run lint` pass, `npm run check` 0 errors.
### Applied
- [major] plan frontmatter `status: built`, D-71 row, Auto Run Result Status/Verification, Final runs at the review pass 1 tree — at bbdd2d5 the final `test:all` exited 1 (D-71), `test:e2e:pwa` was not reached, `test:screens` not run, and D-71's disposition is "open" (not a ticket item 2 form); ticket AC and AGENTS.md require green `test:all` and `test:screens` before `built` (all four lenses) → fixer item 1
- [major] plan D-70 row — pass 1 changed D-70's fix code (`readState`), but D-70's "fixed" evidence (three counted `npm run test:e2e:pwa` runs and a final `test:all` reaching the pwa suite) was not re-run for it → fixer item 2
- [minor] plan pass-1 run records — "hash assigned at commit"; base given as both 38a52d5 and 38f5dd8; item 7 not tied to a commit (three lenses) → fixer item 3
- [minor] `e2e/pwa/update.spec.ts` `readState` — pass 1 made a restart sticky, but Playwright reloads a crashed worker target into a new context (`Inspector.targetReloadedAfterCrash`), so a live B that restarts in the main activation test is never read again and the poll can end in a false observation fault → fixer item 4
- [minor] `e2e/pwa/update.spec.ts` `pollActivated` `why` label still says "handles closed" for a restart → fixer item 5
- [minor] `e2e/pwa/update.spec.ts` `withSite` self-test — the non-`Error` body branch the doc comment promises is untested (two lenses) → fixer item 6
- [minor] `e2e/pwa/sw-failure.spec.ts` / `e2e/pwa/dist-smoke.spec.ts` D-46 race — when the timer wins, a later `answered.reject` on `done` is unhandled → fixer item 7
- [minor] `scripts/device-preview.test.mjs` — no `run` case for the port-taken throw (`io.portOpen` true) → fixer item 8
- [minor] plan Auto Run Result Implemented/Review — still "D-01–D-70" and "Follow-up review: false" rests on the 38a52d5 runs → fixer item 9
### Default applied (technical)
- fixer item 1 — D-71 disposition: fix ticket merged into D-64's owner-backlog proposal (same double-tap timing mechanism under load; sighting, counts, reproduction command), so it is treated as an item 6 row's test; then the final runs re-run; status `built` only if they are green, else back to blocked with `blocked_reason` naming the failure
- fixer item 3 — record runs against the measured content: a tree id of the measured state, verifiable against the checkpoint commit with `git diff <tree> <commit> -- . ':(exclude)_bmad-output'`; pass-1 records name bbdd2d5
- fixer item 4 — non-sticky read, each `evaluate` raced against the poll's remaining deadline (returns `null` for that read); self-test: first read rejects `restarted`, second resolves `activated`; plus a no-hang case
- fixer item 7 — `void done.catch(() => {})` right after creating `done`, both specs
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- none

## Pass 3 — 2026-10-31
Reviewers: fix diff, edge cases, verification gap, intent alignment  |  Findings: major 2, minor 5, decision-needed 0  |  Dropped in triage: 1 (duplicates merged: per-read bound ×2, gone-on-any-null ×2, D-71 channel ×2)
Snapshot: tree 32c6977c98659192a8067aa7d4ff86428b8c0992 (fix diff `7-10-build.passes/pass3.fix.diff`; content outside `_bmad-output/` identical to the fixer's measured tree f29b440cf0ba2c62bbe0736a8712bab9310a717b). Fixer: 5/5 applied (`READ_MS` per-read bound, `readState` `{state}|{gone:'closed'|'unreadable'}`, loop extracted to `activationOutcome`, `activationFault` never TIMING on unreadable, three page-less self-tests each mutation-checked; D-71 its own B8 fix-ticket proposal, entry 11 to wait on it; D-46 forced timer-wins mutation recorded both specs; holdListText armed-late guard case; G9 pin counts `boot()` returns from the TS syntax tree). Fixer runs at the measured tree: `npm test` 3788; item 6 three android runs 903 passed each (D-64 0/3, D-65 0/3, D-71 0/3); D-70 three `test:e2e:pwa` runs 44 passed each (0/3); item 7 Linux clone: unit median 4.64 s, watch 475 ms, AD-18 margin 39,296; final `npm run test:all` exit 0 (unit 3788, dist-smoke 28, e2e 1161, pwa 44); `npm run test:screens` exit 0 (68 passed), no snapshot changes; invariants exit 0; plan status `built`. Orchestrator: `npm test` 3788 passed, `npm run lint` pass, `npm run check` 0 errors.
### Applied
- [major] `e2e/pwa/update.spec.ts` `readState`/`pollActivated` — each read is raced only against the whole poll deadline, so a B `evaluate` that hangs (restarted, never reloaded, e.g. a redundant B) uses up the 30 s; A's fallback read then gets a 0 ms timer and B's redundancy is never reported as designed (D-70 row's own claim); no pollActivated-level test (verification gap, edge cases) → fixer item 1
- [major] `e2e/pwa/update.spec.ts` `pollActivated` `if (state === null) { gone = true; break; }` — any iteration where both reads are null (a transient restart or a raced read, likeliest at B's activation when A terminates) still ends the poll, so pass 2's Applied minor 4 (false observation fault after a live B restarts) is not resolved; the plan's new residual risk concedes it (fix diff; edge cases as minor) → fixer item 1
- [minor] same path — a "gone" ending caused by unreadable (restarted/raced) handles can still throw the A-A15 TIMING label when the probe shows marker A, though SPEC routes TIMING to a D gap only for Chromium's own timing (intent alignment) → fixer item 1
- [minor] plan D-71 row / Fix tickets — D-71 routed into D-64's out-of-epic backlog entry and declared "an item 6 row's test" for the AC rerun; ticket item 6 reserves that route for nav.spec.ts:163, other flakes go to a B8 tickets.toml fix-ticket row (fix diff, intent alignment) → fixer item 2
- [minor] plan Review pass 2 D-46 note — `void done.catch(() => {})` recorded as "no mutation"; item 5: tooling fixes' mutation reverts the fix → fixer item 3
- [minor] `e2e/helpers/boot-calls.ts` `listTextCalls`/`releaseListText` "no held text() in this document" throws — no helpers.spec.ts case → fixer item 4
- [minor] `src/architecture-tree-scan.test.ts` G9 pin — `return` counted with a raw word regex over `boot()`'s source; a comment or nested callback would fail it on a correct order → fixer item 5
### Default applied (technical)
- fixer item 1 — per-read bound `Math.min(deadline, now + READ_MS)` (about 2 s); `readState` reports why it returned null; `gone` only when both handles are `closed()`; other null reads tick and keep polling; a poll ending with unreadable handles throws the observation-fault message, never TIMING; page-less pollActivated self-tests (B hangs + A `redundant` → redundant message well under 30 s; B restarts once then `activated` while A is closed → passes), each with a recorded mutation; residual-risk bullet updated
- fixer item 2 — D-71 gets its own B8 tickets.toml fix-ticket proposal (like D-65; title, sighting, counts, files, reproduction), entry 11 to wait on it; drop the "treated as an item 6 row's test" clause; the orchestrator/owner applies tickets.toml
- fixer item 3 — record a forced timer-wins mutation run without the line, or record it as exempt hardening with the reason
- fixer item 5 — count `return` on the comment-stripped slice
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- edge cases: sw-failure/dist-smoke D-46 worst case (30 s late hit + 15 s hold + 15 s final poll) can reach the 60 s test timeout — the outcome is still a failure (generic label), never a pass; the fixes (raise the per-test timeout, or shorten the worker-request wait) are a timeout loosening item 3 allows only as a recorded-cause flake fix, or a new false-failure risk; listed as an unapplied minor

## Pass 4 — 2026-10-31
Reviewers: fix diff, edge cases, verification gap, intent alignment  |  Findings: major 0, minor 7, decision-needed 0  |  Dropped in triage: 0 (1 duplicate merged: D-65 row count ×2)
Snapshot: tree 32c6977c98659192a8067aa7d4ff86428b8c0992 (no fix pass; unchanged since pass 3, committed as c8440d1). Orchestrator at the final state (pass 3 run): `npm test` 3788 passed, `npm run lint` pass, `npm run check` 0 errors; fixer at the same code: final `test:all` exit 0, `test:screens` exit 0.
### Applied
- none (converged: zero majors after triage)
### Reclassified
- edge cases [major → minor] `e2e/pwa/update.spec.ts` `activationOutcome`/`activationFault` — after an A restart, A's `__wcWaiting` reads `undefined` in the fresh context, so the poll can end `stayed undefined` and, with marker A, throw the A-A15 TIMING label for an observation limit. Late-pass bar: the gate's verdict is unaffected (the test fails, never passes); only the failure label is misattributed, in a rare double-fault path (A restarts and B never activates); consistent with pass 3's classing of the TIMING-on-unreadable label as minor.
### Default applied (technical)
- none
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- none

## Result — converged after 4 passes
Majors per pass: 2, 2, 2, 0. Checkpoint commits: bbdd2d5 (pass 1), 6127385 (pass 2), c8440d1 (pass 3). Final state c8440d1: `npm test` 3788 passed, lint pass, check 0 errors; final `test:all` and `test:screens` green at the measured tree f29b440 (content-identical to c8440d1 outside `_bmad-output/`).
For the orchestrator (technical, from the plan's "For the owner or orchestrator"): apply the plan's D-71 B8 fix-ticket proposal to tickets.toml (entry 11 to wait on it), as was done for D-65 / entry 13.

Unapplied minors (for the next build or loop):
- plan D-65 row — item 6 counts stop at the review pass 2 tree; append "0/3 at the review pass 3 tree f29b440" (fix diff, verification gap)
- plan Auto Run Result "For the owner or orchestrator" item 4 — still says D-64's backlog entry carries D-71's test; pass 3 removed that sub-entry; drop or mark superseded
- plan Implementation Notes Review pass 3 — the whole-deadline mutation's recorded `Received: 28314` cannot come from `bound = deadline` (expected ≥ 30,000 ms); re-run and record the observed value
- `e2e/pwa/update.spec.ts` readState self-test `READ_MS` case — only an upper bound on the elapsed time; add `toBeGreaterThanOrEqual(READ_MS - 50)` (or a half-`READ_MS` answer reading `{ state }`) and record a shrunken-bound mutation
- plan D-70 row / Review pass 3 notes — cite that an `unreadable` ending is 7.3 step 4's "neither route can observe B" case (observation fault, build stops) and that `stayed`/`closed` with marker A keep the TIMING label (A-A15 gate not loosened)
- `e2e/pwa/update.spec.ts` `activationOutcome` — treat `undefined` from A's record as unreadable so an A restart cannot yield `stayed undefined` + TIMING; page-less self-test (B closed, A rejects `restarted` then resolves `undefined`, marker A → observation fault)
- `e2e/pwa/update.spec.ts` `readState` — when B's read is bounded at the poll deadline, A's fallback read in the same iteration gets a 0 ms bound and reads `unreadable`; give A's read its own `READ_MS` bound or report the last state seen; self-test with hanging B and A `installed`
- (pass 3, dropped) sw-failure/dist-smoke D-46 worst case (30 s late hit + 15 s hold + 15 s final poll) can reach the 60 s test timeout; still a failure, never a pass
