# Review log — story-q-40-failure-and-q-42-controlled-branch-proofs.md (ticket 7.7)

State: pass 1: done

Mode: docs, thorough, max 7, budget default (2.5x pass 0 ≈ 800 words). Pass 0: 320 words, `story-q-40-failure-and-q-42-controlled-branch-proofs.review-log.passes/pass0.md`, HEAD bd9baa6.
Intent carried from `epic-pwa-release/tickets.toml` entry 7 (not copied at pull; the fixer adds them to the Description in pass 1):
- tests: Q-40 rows (P7 `dist-smoke`, P7 `pwa` `sw-failure.spec.ts`); Q-42 controlled-branch rows (P7) of rule-coverage.md.
- owns: The Q-40 and Q-42 proofs.
- consumers: Entry 11 (closes the epic 3 P7 rows against these tests, F15).
- plan_checkpoint: true.
Refs: `_bmad-output/specs/spec-epic-7-pwa-release/` SPEC.md, rule-coverage.md, device-checks.md, release-checklist.md, build-notes.md; epic-pwa-release.md; ARCHITECTURE-SPINE.md; AGENTS.md; done-ticket plans `epic-pwa-release/*-plan.md` (7.1–7.6); docs/game-flow-spec.md Q-40, Q-42 and epic 3 rule-coverage.md (ticket refs).

## Pass 1 — 2026-10-31
Reviewers: builder's reading, edge-case hunter, adversarial, ref alignment  |  Findings: major 7, minor 7, decision-needed 0  |  Dropped in triage: 2
Words (docs): 682 (2.1x pass 0)  |  Snapshot: story-q-40-failure-and-q-42-controlled-branch-proofs.review-log.passes/pass1.md  |  Fix diff: pass1.fix.diff
Fixer: all 12 items applied, no conflicts; `plan_checkpoint: true` in frontmatter (as story-two-build-update-proof.md); helper names checked in repo; `request.serviceWorker()`, `response.fromServiceWorker()`, `route.continue()`/`fallback()` checked in installed Playwright 1.63.0 types (not run); no runnable commands added.
### Applied
- [major] Description — tickets.toml entry 7 tests/owns/consumers/plan_checkpoint missing; rows to map and entry 11's consumption unstated (all four reviewers; carried intent) → fixer item 1
- [major] Description Q-42 clause + AC — no file or project for Q-42; AC reads as Q-42 on both builds (all four) → item 2
- [major] Description Q-42 clause — setup order (precache complete, control check, entry delete, route, 404 reload), per-hit route behaviour and what the held retry is fulfilled with unspecified; F6 "route before first goto" would fail the install (adversarial, builder, edge, ref) → item 3
- [major] Description dist-smoke chunk case — boot-call log (e2e/helpers/boot-calls.ts) has no chunk entry, so "persistence after the chunk 404" is unobservable (builder, edge, adversarial) → item 4
- [major] Description precache-404 case — the icon 404 can make the install redundant before `sw.ts` reads the registration slots (src/shell/sw.ts `recompute` sees no worker → no `failed`, pwa case flaky, dist case never exercises the failure path) (edge) → item 5
- [major] Description precache-404 case + Notes — no assertion that the install actually failed (a succeeding install also has no worker installing); open question has no stop rule (builder, adversarial) → item 6
- [major] Description "nothing shown" — undefined; the file's `errorsOf` console check fails on the browser's own 404 console lines (edge; builder, adversarial as minor) → item 7
- [minor] dist-smoke cases go in the existing `F6 serviceWorkers allow` describe (ref, edge, adversarial) → item 8
- [minor] pwa chunk case negative persistence assertion needs a checkpoint (edge, builder, adversarial) → item 9
- [minor] persistence order wording: after the failed `register` settles / after the chunk 404 (ref) → item 10
- [minor] pwa missing-script case uses a static-server copy of `dist-test/` (adversarial) → item 11
- [minor] deal/validate sequence: reuse entry 6's helpers (adversarial) → item 12
- [minor] Notes open question applies the no-surface check to dist-test (adversarial) → folded into item 6
- [minor] Q-42 control check and "the precache entry" → the dictionary's (ref) → folded into item 3
### Default applied (technical)
- Q-42 file — new `e2e/pwa/dictionary-retry.spec.ts`, `pwa` only, file-level `allow` with F6 comment (outside `dist-smoke`'s explicit `testMatch`)
- Precache-404 timing — the context route holds the worker's icon request until the page has observed the install (`swState()` `installing` on dist-test; boot-call `register-settled` on dist), then answers 404
- Install-failed proof — `getRegistration()` resolves `undefined` or with no `active`/`waiting`; if it does not hold, the build records it in the plan and stops (rule 7), never swaps mechanism
- Chunk order — chunk route held, asserted hit, no `persisted` while held, then 404 and the log polls to exactly `persisted`, `persist`, no `register`
- No-surface check — `expectNoPrompt` (live-region.ts), fatal title absent, no `pageerror`; console not checked (as entry 6's offline case)
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- edge: "no-installing poll treats an undefined `getRegistration()` as done" as a separate item — folded into item 6
- adversarial: "this ticket edits neither rule-coverage file" stated as a finding — kept only as part of item 1's consumer wording
