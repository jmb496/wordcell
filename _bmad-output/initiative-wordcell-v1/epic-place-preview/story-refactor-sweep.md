---
id: 6
type: story
title: "Refactor sweep"
parent: epic-place-preview
after: [1, 2, 3, 4, 5]
risk: low
hitl: false
done_checkpoint: true
---

# Refactor sweep

## Description

Closing cleanup of epic 11's deferred findings, after 11.5's owner Android read (epic Notes, 2026-10-29) asked for no change. Cleanup only, no new behaviour. Done checkpoint (tickets.toml entry 6): the build stops at `built`; the owner decides the owner-call rows and doc proposals, then marks it done.

## Scope

1. Test tightening (test-only), live at HEAD: (a) e2e/place-preview.spec.ts:131 `expectPreviewLive` never asserts the cell's other live cards stay hidden (11-2-build.md Result minor 3); (b) e2e/place-preview.spec.ts:172 `expectMarkCorner` does not prove the ★ pill paints above the face (11-2-build.md minor 4: `elementFromPoint` at the pill centre on a cell where it does not meet the badge); (c) no e2e that the fly-in's previewed-top copy leaves the DOM when an act()-wrapped New game interrupts a fly-in (11-3-build.md minor 3): add it; if the plan shows it cannot be driven, record "covered by composition (act() → cancel() → finishAll())" as declined; (d) src/ui/scenes/scenes.test.ts:1234-1237 both bad-frame cases match only `/^scene place: frame 2/`, so they cannot tell Scene.svelte:179/:182's two throws apart; anchor each on its full message (11-4-build.md). Build triage rejects: the near-duplicate preview helpers in three spec files (11.2 plan :111, "refactor only") and the 11.3 plan's reduced-motion test repeating `expectFlight` (:105) fold into e2e/helpers/ only if test-only with no assertion change, else declined. Pass: each tightened test fails on the mutation its review named, else one the plan names and records; names keep their id prefix; each changed e2e test passes `--repeat-each=5` on `android`; an item failing at HEAD is not committed: owner-call row, failing case in the plan.
2. Flake evidence: the `[android]` e2e/nav.spec.ts:163 test "§2 AD-13 a double tap on New game on the rejected root opens the notice at wc 1 and no Reset confirm" (the doubleTap helper's own check in e2e/helpers/touch.ts fired, details [1, 1] not [1, 2], after fix 169c6bc; digest 11.4 Worth knowing (1), handoff "Still open", log `.autopilot/20261028-1937/11.4-testall-attempt1.log`); e2e/flip-controller.spec.ts:350 reduced-motion fade, failed once in a full run (11.4 plan :99); src/architecture-tree-scan.test.ts 5 s timeout on /mnt/d drvfs (11.4 plan :186): a no-change row (drvfs). Run `npx playwright test --project=android` three times (default workers) at the sweep commit; record failures/3 for the two e2e tests; "leave it" needs 0/3; a failing row gets a test-only fix (e.g. e2e/helpers/touch.ts, with an e2e/helpers.spec.ts case) rerun to 0/3, else an owner-call row; any other test failing in any run gets the same row; timeout, retry or worker-count changes are an owner call.
3. End-of-epic budgets (epic Done-when 4): the AD-18 margin from `npm run build` and the warm `npm test` median of 3 runs on a fresh Linux-filesystem clone (AGENTS.md, under 5 s), recorded in the plan. Over budget: stop and report.
4. Already closed (check the cite, no work): 11.2's interim fly-in hold (digest 11.2 Worth knowing (1)), closed by 11.3 c0664ef; the DESIGN.md WordCell and spine AD-14 close-out docs (digest 11.2-11.4 Close-out docs), applied in d67b42a (ticket 11.5); the 11.3 stacking-look-not-by-pixels residual (11.3 plan :159) and the 360 px ★/badge meet, judged by the 11.5 device read; the 11.3 used-target-earlier-free-letter fixture gap, covered by construction (11.3 review-log minor 8, plan Design Notes :124).
5. Edit boundary and owner calls (rule 7): only comments, tests, test helpers and this ticket's plan are edited; a fix changing behaviour or look, an owner doc, the spine, or a closed epic's SPEC is an owner-call row. Pre-assigned: the ★ as a font glyph (`text.star`) vs DESIGN.md:311 "Icons are inline SVG, not emoji or font glyphs" (digest 11.2 Worth knowing (2)): an old → new doc proposal for the retrospective, no code or doc edit; `.preview-mark` repeating the badge font literal (11.2 plan :110; src/ui/Card.svelte vs src/ui/WordCellRow.svelte, line-heights differ): declined; epic 5 SPEC F28's "previous top" clause: declined (11.5 document check: a closed epic's record); tickets.toml entry 1 drift (digest 11.1) and entry 4 "fixture unchanged" clause (digest 11.4 (2)): declined (not maintained after pull, as epic 10 sweep item 9); done tickets' plan and log errata (11-2-build.md minors 1-2: plan AC mapping, stale triage rows :104/:115, "3628"; 11-3-build.md minors 1-2: Auto Run Result "not committed" vs c0664ef, the Undo-mid-flight rationale) and done ticket files (11.1 review log "add R-65 to References", 11.3 minor 13): one declined row group.
6. Deferred-findings table in the plan, one row per finding (duplicates merged). Columns: source file:line (every source), finding, live at HEAD (yes/no with file:line evidence), disposition (fixed here / closed by <commit or file:line> / declined, why / owner call). Sources: the `deferred` frontmatter and residual risks of the 11.1-11.5 plans and their triage rows rejected as "refactor only"; the unapplied minors and open majors in the `## Result` of review-loop/11-*-build.md; ticket review-log Results the matching plan left open; every Worth knowing line of the digest for 11.1-11.4 and the handoff's "Still open"; the 11.5 device read (epic Notes). Reconciliation: the plan names its grep over those files and counts by source; a source with nothing live (e.g. 11-1-build.md "Unapplied minors: none", the device read) gets a "none" row naming the search. "Fixed here" only for findings items 1-2 name; others: declined or owner call.

## Acceptance Criteria

Verify: one full `npm run test:all` at the final commit and `npm run test:screens` are green, every Scope pass condition holds, and item 6's table accounts for every source.

- `npm run test:screens` runs only in Docker (AGENTS.md; no Docker: stop and report). After it `git status --porcelain` shows nothing under `e2e/*-snapshots` (a new or failing baseline: revert its cause).
- `fixtures/` untouched by this ticket's diff; against d5015e5 (epic Notes: branch cut from main there) `SESSION_VERSION` and `HISTORY_VERSION` are unchanged and `git diff --exit-code d5015e5 -- src/engine/deal.test.ts package.json package-lock.json` is empty.
- Owner checkpoint per Description (docs/development-methodology.md, Definition of done).

## References

- parent — _bmad-output/initiative-wordcell-v1/epic-place-preview/epic-place-preview.md
- constraint — docs/development-methodology.md, Definition of done
- constraint — AGENTS.md
- evidence — _bmad-output/implementation-artifacts/autopilot/epic-place-preview-20261028-1937.md (digest) and epic-place-preview-handoff.md
- evidence — _bmad-output/implementation-artifacts/review-loop/11-*-build.md
- evidence — _bmad-output/initiative-wordcell-v1/epic-place-preview/*-plan.md and *.review-log.md
- evidence — .autopilot/20261028-1937/11.4-testall-attempt1.log (git-ignored)
