---
title: 'Refactor sweep (epic 11)'
type: 'chore'
ticket: '6'
created: '2026-10-29'
status: 'built'
baseline_revision: '5a86a03fd89410dc3bfb15c9fee9ca009f9a396b'
route: 'oneshot'
route_source: 'auto'
review: 'quick'
review_source: 'auto'
lenses_ran: ['quick']
review_loop_iteration: 0
followup_review_recommended: false
context: ['{project-root}/_bmad-output/initiative-wordcell-v1/epic-place-preview/story-refactor-sweep.md', '{project-root}/_bmad-output/initiative-wordcell-v1/epic-place-preview/story-refactor-sweep.review-log.md']
warnings: ['oversized']
deferred: []
---

<intent-contract>

## Intent

**Problem:** Epic 11 closed with deferred findings spread over its plans, build review logs, the autopilot digest and handoff: four live test gaps (ticket Scope 1 (a)–(d)), the `nav.spec.ts:163` double-tap flake and the `flip-controller.spec.ts:350` fade flake (Scope 2), the end-of-epic budgets (Scope 3) and a set of rows to close, decline or hand to the owner (Scope 4–5). The ticket (`story-refactor-sweep.md`) is the contract; this plan resolves its review log's `## Result` items and records every measurement.

**Approach:** Test-only edits (tests, test helpers, comments, this plan; ticket Scope 5 edit boundary) committed locally per Scope, each tightening proved by a temporary source mutation that is reverted; three pre-fix and (if a fix lands) three post-fix `--project=android` runs; budgets on a fresh Linux clone; one deferred-findings table (below) accounting for every source; stop at `built` for the owner's done checkpoint (tickets.toml entry 6 `done_checkpoint`).

</intent-contract>

## Implementation Notes

Route: oneshot (about 90 lines of test code over five files; the rest is measurement and the table). Implemented in the main session.

**Review-log `## Result` items, resolved** (story-refactor-sweep.review-log.md:160-172):
- Owner-facing rows: the 360 px meet (table R18), an unconfirmed nav fix (R11, if it ends so), the ★ glyph doc proposal (R10), epic 10 retro B3, B4, B6, B7 (R26). None is decided here.
- 1(c) timing: one `page.evaluate` clicks Confirm, reads the hold copy, dispatches a `keydown` `m` on `window` (keys.ts:597 `installKeys` listens there; `menu` → `act(openMenu)`, keys.ts:259, :560) in the same task, then checks once after one `requestAnimationFrame`; `prefs-non-default` (Slow, 640 ms flight) is seeded so the flight cannot end first.
- 1(c) route: "cannot be driven" (the copy is not present before the key, or the key cannot reach the menu row) → declined, covered by composition. A test that runs and passes at HEAD but survives the `controller.ts:1046` mutation fails its Pass → not committed, owner-call row. This plan picks that split.
- 1(c) file: `e2e/fly-to-cell.spec.ts` (android-only, :13-15).
- AC bullet 3: the rerun is one full `npm run test:all` at the same commit.
- Scope 2: any other test failing in any run is handled as a failing row (test-only fix rerun to 0/3, else owner call). Each run writes its own `--output /tmp/wc-11.6/<run>` so traces survive. The `nav.spec.ts:163 --repeat-each=20` runs at default (full-run) workers, 20 repeats sharing them; recorded as such. The flake runs are android-only, lighter than `test:all`; recorded.
- Stop and report = HALT `blocked` before `built`; the done checkpoint is the normal stop at `built`.
- "Final commit" = the last commit touching code or tests; plan-only commits after it are equivalent.
- Scope 3 is measured before the final `test:all`; over budget profiles and reports only, no code change.
- References the ticket body cites but does not list, used here: spine AD-17 (Touch, Speed), AD-18 (Size); end-of-game-words retrospective B3–B8 (`epic-end-of-game-words-retrospective.md:213-218`); tickets.toml entry 6.
- Left to the plan: clone setup is `git clone /mnt/d/CodeProjects/wordcell ~/wordcell-sweep-11.6 && git checkout <sha> && npm ci`, then `git status --porcelain` must be empty (lockfile untouched); a helpers.spec.ts case for a changed helper passes at the fix commit and pins the changed behaviour (fails on the pre-fix helper where the change is observable, else the plan says why); Scope 4 closures quote the epic Notes device-read words (R16, R17); the `expectMarkCorner` probe goes in a new local helper `expectMarkOverFace`, called at the three non-meeting call sites (`place-preview.spec.ts:197`, `:586`, `:587`), not at `:214` where the badge meets the pill.

**Scope 1 working decisions:**
- (a) `expectPreviewLive` gains `cell.locator('[data-card-id]:visible')` count 1. Mutation: WordCellRow.svelte:60 preview branch `hidden: id !== preview.top` → `hidden: false` (cell 6's 48, 9, 1, 34 and compact cell 4's 20 become visible). `expectPreviewBeneath` (place.spec.ts:283) gets the same line only if a mutation fails it on its callers (place.spec.ts:515, :541: cell 4 [20, 28] with 28 used leaves only 20 live, so the hidden-flag mutation cannot reach it); otherwise its half is not committed and becomes an owner-call row with the case.
- (b) `expectMarkOverFace(card)`: sets `pointer-events: auto` on the pill and the `:scope > .face`, `elementFromPoint` at the pill centre, restores in `finally`, expects the pill. Mutation: Card.svelte `.face` rule gains `z-index: 2` (the face paints over the pill).
- (c) New test `AD-14 F28 Q-49 an act() key (M) right after Confirm on session-place ends the hold: the copy of the new top 28 leaves wordcell 3 by the next frame, the cells keep their cards`. Mutation: controller.ts:1046 `deps.finishGlides()` removed.
- (d) scenes.test.ts:1234-1237: each case anchored on its full message (`/^scene place: frame 2 has no previews entry at after 3$/`, `/^scene place: frame 2 has no after$/`). Mutation: Scene.svelte:179's `after === undefined` throw removed (the no-after frame then throws the no-entries message, which the old prefix accepted).
- Helper fold (11.2 plan :111): judged after (a)/(b) — declined unless a fold changes no caller's assertions (R6).
- Pass: every edited or calling e2e test passes `--repeat-each=5 --project=android` (run over `e2e/place-preview.spec.ts`, `e2e/fly-to-cell.spec.ts` and, if edited, `e2e/place.spec.ts`).

## Deferred-findings table

Reconciliation grep (run from `_bmad-output/`): `grep -cE 'deferred:|Residual|Unapplied|Worth knowing|Close-out|Still open|Not applied|Not edited|Device read'` over the 11.1–11.5 plans and ticket review logs, `implementation-artifacts/review-loop/11-*-build.md`, the digest, the handoff, the 11.5 ticket and the epic. Hits by source: 11.1 plan 3, 11.2 plan 2, 11.3 plan 3, 11.4 plan 3, 11.5 plan 1 (title only); ticket review logs 1 each (11.1–11.4); 11-1..11-4-build.md 1 each; digest 19; handoff 3; 11.5 ticket 4; epic 4. Each hit's finding lines are rows below (merged where duplicated); a hit with nothing live is in R27.

Paths: plans and review logs are `story-<slug>…` beside this plan (11.1 engine-place-preview-on-cellview, 11.2 wordcell-row-place-preview, 11.3 fly-to-cell-keeps-the-previewed-top, 11.4 how-to-play-place-scene-preview, 11.5 close-out-documents-and-device-read); `NN-build` = `implementation-artifacts/review-loop/11-N-build.md`; digest = `implementation-artifacts/autopilot/epic-place-preview-20261028-1937.md`; handoff = `…/epic-place-preview-handoff.md`; retro = `epic-end-of-game-words/epic-end-of-game-words-retrospective.md`.

| # | Source | Finding | Live at HEAD 5a86a03 | Disposition |
|---|---|---|---|---|
| R1 | 11-2-build:48; digest :64 (3) | `expectPreviewLive` never asserts the cell's other live cards stay hidden | yes, e2e/place-preview.spec.ts:131-146 | fixed here (Scope 1 commit): `[data-card-id]:visible` count 1; fails on the WordCellRow.svelte:63 `hidden: false` mutation (tests :282, :299, :457, :526 at :140) |
| R2 | ticket Scope 1(a) | `expectPreviewBeneath` same gap | yes, e2e/place.spec.ts:283-289 | owner call (Pass not met, not committed): on its callers (place.spec.ts:515, :541, cell 4 [20, 28], 28 used) only 20 is live in the cell, so no mutation can make a second live card visible there; under the :63 mutation both tests pass. Proposal: decline (the check would be vacuous), or add a call on a fixture with a card beneath (e.g. `session-place-used-cells` cell 6), a new test |
| R3 | 11-2-build:49; digest :64 (3) | `expectMarkCorner` does not prove the ★ paints above the face | yes, e2e/place-preview.spec.ts:172-183 | fixed here (Scope 1 commit): new `expectMarkOverFace` (lift, `elementFromPoint`, restore) at :221, :612, :613; fails on the Card.svelte `.face { z-index: 2 }` mutation (tests :207, :603) |
| R4 | 11-3-build:25; digest :100 (2) | no e2e that the hold copy leaves when an act() interrupts a fly-in | yes, e2e/fly-to-cell.spec.ts (no such test) | fixed here (Scope 1 commit): new test fly-to-cell.spec.ts:350; fails on the controller.ts:1046 `deps.finishGlides()` removal (copies 1, expected 0) |
| R5 | 11-4-build:38; digest :127 (3); handoff :13 | bad-frame cases match only the prefix | yes, src/ui/scenes/scenes.test.ts:1234-1237 | fixed here (Scope 1 commit): full-message anchors; fail on the Scene.svelte:179 no-after throw removal (the old prefix passed it) |
| R6 | 11.2 plan :111 | near-duplicate preview helpers in three specs | yes, place-preview.spec.ts:104/:131/:149, place.spec.ts:262/:283, board-phases.spec.ts:360 | declined: the helpers assert different sets (`expectPreviewMirror` also pins the mirror count, `empty` and bare attributes, `expectPreviewTarget` does not; `expectPreviewLive` now pins the visible count, `expectPreviewBeneath` does not), so one shared helper changes some caller's assertions |
| R7 | 11.3 plan :105 | reduced-motion test repeats `expectFlight` | yes, e2e/fly-to-cell.spec.ts:375-406 | declined: reuse would add `empty`, badge and `ids` assertions (ticket Scope 1) |
| R8 | 11.3 plan :106 | onto-committed loop not in `test.step` | yes, e2e/fly-to-cell.spec.ts:241-258 | declined: cosmetic, Playwright reports the line |
| R9 | 11.2 plan :110 (second half) | `.preview-mark` repeats the badge font literal | yes, src/ui/Card.svelte:242 vs src/ui/WordCellRow.svelte `.count` (11px/1 vs 11px/16px) | declined: line-heights differ, no shared value |
| R10 | 11.2 plan :110 (first half), :174; digest :64 (2) | ★ is a font glyph (`text.star`, src/ui/text.ts:162) against DESIGN.md:311 "Icons are inline SVG, not … font glyphs" | yes, DESIGN.md:311-312 lists `★` | owner call, doc proposal for the epic 11 retrospective, no edit: DESIGN.md:311 old "**Icons** are inline SVG, not emoji or font glyphs, in `{colors.ink-primary}` unless stated:" → new "**Icons** are inline SVG, not emoji or font glyphs, in `{colors.ink-primary}` unless stated (the `★` is the exception: the font glyph `text.star`, on the strip's top tile and the WordCell preview pill):" — or the owner asks for an SVG star (a look change, its own ticket) |
| R11 | digest :127 (1); handoff :13; 11.5 ticket :45; `.autopilot/20261028-1937/11.4-testall-attempt1.log:2489-2519` | `[android] nav.spec.ts:163` doubleTap check fired, details `[1, 1]` | yes, e2e/nav.spec.ts:163, e2e/helpers/touch.ts:87-131 | owner call, kept, unconfirmed (no cause found; never reproduced before the fix: pre 0/3 at e99350f, 0/64 under load): fix 9394922 is test-only and diagnostic, `doubleTap`'s failure now lists the page's touch and click events with `timeStamp`s and the CDP stamps (AD-17 Touch contract unchanged; helpers.spec.ts case green, fails on the pre-fix helper); at 9394922 post 0/3 full runs, `--repeat-each=20` 0/20. The owner may revert it. Proposal: its own fix ticket (retro B8) that waits for the next occurrence's report and fixes from it |
| R12 | 11.4 plan :99 | `flip-controller.spec.ts:350` reduced-motion fade failed once in a full run | not reproduced | declined, evidence 0/3 (pre-1..3 at e99350f) |
| R13 | 11.4 plan :186 | `src/architecture-tree-scan.test.ts` 5 s timeout | drvfs only | declined: drvfs only (ticket Scope 2) |
| R14 | 11.2 plan :174 (first half); digest :64 (1) | interim fly-in hold shows the previous top | no: src/ui/WordCellRow.svelte:89-98 (copy of the new top first) | closed by c0664ef (11.3) |
| R15 | digest :44, :65, :85, :101-103, :129; handoff :8-11; 11.3 plan :161; 11.4 plan :193 | close-out docs (badge above ★, hold wording, AD-14 mirror list, How to play no badge) | no: DESIGN.md:574, :576; EXPERIENCE.md:491; spine :686, :693 | closed by d67b42a (11.5) |
| R16 | 11.3 plan :159; digest :100 (1) | stacking look checked by DOM, not pixels | judged on device | closed by the 11.5 read, epic Notes :60: "Confirm's fly-to-cell (no old top flashes) … read as expected; no change asked" |
| R17 | 11.4 plan :192 (triage :114) | scene target ring overlaps the pill by ~1 px | judged on device | closed by the 11.5 read, epic Notes :60: "the How to play Place scene and the `★` as subtle all read as expected; no change asked" |
| R18 | epic Notes :63; digest :36, :43, :47; 11.2 review log Result | 360 px two-digit badge / ★ meet | not judged: the read's `session-place-used-cells` badges are ≤ 5 | owner call: judge on `node scripts/device-preview.mjs session-place-long` (badge 15) on a 360 px device or Chrome emulation; no code change |
| R19 | 11.3 plan :124, :160, triage :113; 11.3 review log minor 8 | no fixture for a used target's free letter earlier than last | yes (no fixture) | declined: covered by construction (one `flyingSet`, copy = `cards.at(-1)`); fixtures untouched |
| R20 | digest :18 | only-card used target runs on a test-built position | yes, src/engine/view.test.ts | declined: covered by construction; fixtures untouched |
| R21 | 11.4 plan :191 | scene ★ positioned against `.stack` | yes, src/ui/scenes/Scene.svelte | declined: correct while each previewed scene cell is one card (by construction) |
| R22 | 11.5 ticket :44 | epic 5 SPEC F28 "previous top" clause not edited | yes | declined: a closed epic's record; DESIGN.md and AD-14 say Q-49 replaces it |
| R23 | digest :18; 11.1 review log :84; 11.1 plan :103, :118 | tickets.toml entry 1 drift from the hardened ticket | yes, tickets.toml entry 1 | declined: toml not maintained after pull (as epic 10 sweep item 9) |
| R24 | digest :127 (2) | tickets.toml entry 4 "fixture unchanged" clause | yes, tickets.toml entry 4 | declined: same reason as R23 |
| R25 | 11-2-build:46, :47; 11-3-build:23, :24; digest :64 (3), :100 (2); 11.1 review log :80 (11.1 plan :103, digest :18); 11.3 review log :113 (digest :84) | done records: 11.2 plan AC mapping and stale triage/verification lines; 11.3 Auto Run Result commit and Undo-mid-flight rationale; ticket files (11.1 R-65 reference, 11.3 minor 13 long sentence) | yes (records unchanged) | declined, one group: done tickets' records are not rewritten |
| R26 | retro :213, :214, :216, :217 | epic 10 retrospective B3, B4, B6, B7 | yes | declined: outside epic 11's Boundaries; carried to the epic 11 retrospective (B4 is behaviour) |
| R27 | 11-1-build:23 "Unapplied minors: none"; 11.1–11.4 plans :17 `deferred: []`; 11.1 plan :119 residual (closed: src/ui/WordCellRow.svelte:57 reads `cell.preview`, d021c5e); 11.2/11.3/11.4 ticket review-log minors (resolved in their plans: digest :43, :84; 11.4 plan :183); digest :32, :43 (resolved/owner 09b2af2), :73 "nothing else", :100 (3) (R-52 hold removed, informational), :112 (answered, 8cd6b84); 11.5 plan (frontmatter only); 11.5 device read "no change asked" ; title-only or stop/resume hits with no finding: digest :19 and :33 (Close-out docs none), :74 (11.3 close-out none yet; answered ce9ed84, docs in R15), :132 and :135 (the 11.5 stop and its resume, since run), 11.3 plan :125 (the close-out wording, applied in R15), 11.5 plan :2 and 11.5 ticket :4, :12 (titles) | nothing live | none (search: the grep above, read line by line) |

## Verification

**Commands:**
- Scope 1: each mutation applied, the named test fails, mutation reverted (`git diff --exit-code -- src` after each); `npx playwright test --project=android --repeat-each=5 e2e/place-preview.spec.ts e2e/fly-to-cell.spec.ts [e2e/place.spec.ts]` -- 0 failures; `npx vitest run src/ui/scenes/scenes.test.ts` -- pass.
- Scope 2: `npx playwright test --project=android --output /tmp/wc-11.6/pre-N` × 3 at the Scope 1 commit; after a fix commit `--output /tmp/wc-11.6/post-N` × 3 and `npx playwright test --project=android e2e/nav.spec.ts:163 --repeat-each=20`; counts per test recorded.
- Scope 3: fresh clone — `npm run build` (AD-18 margin), `npm test` × 4 (median of the last 3 < 5 s), a watch re-run of the slowest engine test file (< 1 s).
- `npm run test:all` -- exit 0 at the final commit; `npm run test:screens` (Docker) -- pass, `git status --porcelain e2e` shows nothing under `*-snapshots`.
- `git diff --exit-code d5015e5 -- src/engine/deal.test.ts package.json package-lock.json` -- empty; `git diff --exit-code 5a86a03 -- fixtures` -- empty; `grep -n "SESSION_VERSION =\|HISTORY_VERSION =" src/engine/*.ts` unchanged against d5015e5.

## Scope 1 record

- Mutations, each applied alone, the named test run on `android`, then reverted (`git diff --exit-code` on the file): (a) WordCellRow.svelte:63 `hidden: false` → place-preview.spec.ts :282, :299, :457, :526 fail at the new :140 line (other failures elsewhere by older lines); place.spec.ts :509-style callers of `expectPreviewBeneath` (:515, :541) pass under it (R2). (b) Card.svelte `.face` `z-index: 2` → :207, :603 fail at `expectMarkOverFace`. (c) controller.ts:1046 removed → the new :350 test fails (`copies` 1). (d) Scene.svelte:179 removed → the scenes.test.ts case fails; with the old prefix anchors it passes.
- `--repeat-each=5 --project=android` over `e2e/place-preview.spec.ts` and `e2e/fly-to-cell.spec.ts`: 145 passed, 0 failed. `npx vitest run src/ui/scenes/scenes.test.ts` green; `npm run check` 0 errors; Biome clean.
- (c) drives a real `keydown` on `window` (keys.ts:597), in the Confirm click task; the flight had running animations at the read (`running` > 0).

## Scope 2 record (flake evidence)

- Commit e99350f (the Scope 1 commit), tree clean but for this plan, `CI` unset (retries 0), default workers (8 of 16 cores); android project only, lighter than `test:all` (no desktop project, unit, build, dist or pwa suites).
- `npx playwright test --project=android --output /tmp/wc-11.6/pre-N`: pre-1 867 passed, 225 skipped, 0 failed (4.3 m); pre-2 the same; pre-3 the same. Every e2e test 0/3, including `nav.spec.ts:163` and `flip-controller.spec.ts:350`. No other test failed, so no other row.
- `nav.spec.ts:163` diagnosis. Attempt1 log (`11.4-testall-attempt1.log:2489-2519`): only the helper's final poll, details `[1, 1]` after 5 s, so both taps clicked and Chromium did not count the second as a repeat; the trace is gone. `touch.ts:87-131` stamps both taps from one `Date.now()` (second +80 ms), so a repeat needs Chromium to honour the stamps. Experiments on `android`, throwaway spec, deleted: renderer CPU throttling 6× and 20× (tap 1 took up to 1.3 s to dispatch) gave `[1, 2]` 12/12; stamps skewed −3 s, −0.3 s, +0.3 s, +3 s from the wall clock with a 600 ms real gap gave `[1, 2]` 10/10, and the page saw the stamped times (no clamping); the real test `--repeat-each=64 --workers=16` passed 64/64. No cause found; nothing committed (R11).
- Pre-fix decision was to commit nothing (no cause); the review pass (Review Triage Log) held that the ticket asks for a test-only fix even then, so the diagnostic fix 9394922 was made: `doubleTap` records `touchstart`, `touchend` and `click` (with `detail`) at `window` capture, passive, and on a failed poll rethrows the poll error with those events and the CDP stamps (`{ cause }` kept). The click list and its `[1, 2]` check are unchanged. New case `e2e/helpers.spec.ts` "AD-17 doubleTap that gets no repeat click fails listing …" (a cancelled `touchend` suppresses the clicks): passes at 9394922, fails with the pre-fix `touch.ts`.
- Post-fix at 9394922 (Scope 2's last measured commit): `--output /tmp/wc-11.6/post-N` × 3: 868 passed, 225 skipped, 0 failed each (4.3 m; +1 for the new case). `npx playwright test --project=android e2e/nav.spec.ts:163 --repeat-each=20` at default workers (8, the full-run count, 20 repeats sharing them): 20 passed.

## Scope 3 record (budgets)

- Re-measured at 9394922 (Scope 2's last measured commit) on a new fresh clone, `npm ci` exit 0, tree clean after: AD-18 total 560,554 / 600,000 (margin 39,446); `npm test` warm-up 7.29 s (cold, discarded), then 4.65, 4.61, 4.64 s → median 4.64 s; `src/engine/view.test.ts` watch re-runs 510, 467, 475, 452, 467, 483 ms. The e99350f figures below are kept as the first measurement.

- Fresh clone `~/wordcell-sweep-11.6` (ext4) of e99350f, `npm ci` exit 0, `git status --porcelain` empty after it (lockfile untouched).
- AD-18: `npm run build` total 560,552 / 600,000 bytes, margin 39,448.
- AD-17 Speed: `npm test` warm-up 4.61 s (discarded; the first `npx vitest run` before it was the cold 6.92 s), then 4.72, 4.57, 4.53 s → median 4.57 s (< 5 s), 3638 tests.
- Slowest engine test file by the JSON reporter: `src/engine/view.test.ts` (447 ms; next how-to-play-scenes 139 ms). `npx vitest --watch src/engine/view.test.ts`, six edits: re-runs 544, 461, 466, 467, 471, 470 ms (< 1 s).

## Final verification record

- Final code/test commit 9394922 (the plan-only commit after it is equivalent, per the review-log item). The first final run at e99350f (exit 0; unit 3638, e2e 1121, dist 21, pwa 17; screens 68) is superseded.
- `npm run test:all` at 9394922 (+ this plan): exit 0 — lint, check, unit 3638, build 560,554 / 600,000, dist 21 passed, e2e 1122 passed / 1064 skipped, pwa 17 passed. Scope 3 was measured before it.
- `npm run test:screens` (Docker `mcr.microsoft.com/playwright:v1.63.0-noble`) at 9394922: 68 passed, 40 skipped; `git status --porcelain` shows nothing under `e2e/*-snapshots`.
- `git diff --exit-code 5a86a03 -- fixtures` empty; `git diff --exit-code d5015e5 -- src/engine/deal.test.ts package.json package-lock.json` empty; `SESSION_VERSION` 1 (src/engine/session.ts:51) and `HISTORY_VERSION` 1 (src/engine/history.ts:8) unchanged against d5015e5.

## Implementation Notes — errata (review pass)

- Scope 1 (a): the mutated line is WordCellRow.svelte:63, not :60. 1(c) timing: the menu key's act() wrap is keys.ts:548 (`attempt`), not :560. The committed (c) name ends "… the cell keeps its cards with only 28 shown". The route line's size: about 60 test lines over three files at Scope 1, plus the 9394922 helper diagnostic (two files).

## Review Triage Log

### 2026-10-29 — Review pass
- verdicts: 7 findings — high 0, medium 1, low 5, false 1, maybe-false 0
- findings:
  - `[medium]` `[patch]` Scope 2 committed no test-only nav fix although the ticket asks for one and keeps an unconfirmed fix ("no cause found" is a fix-unconfirmed case) — true: the ticket's Scope 2 says "make a test-only fix" before listing "no cause found" among the unconfirmed outcomes. Patched: 9394922 adds a diagnostic failure report to `doubleTap` (contract unchanged) with a helpers.spec.ts case; post-fix 0/3 full runs and 0/20 repeats at it; R11 reads "kept, unconfirmed".
  - `[low]` `[reject]` The deferred-findings table does not map some grep hits (digest :19, :33, :74, :132, :135; 11.3 plan :125; 11.5 ticket :4, :12) — true, but the fix edits this build's plan (rule). Those hits have no finding of their own; they are listed in R27 with the R11 rewrite, for the AC's "accounts for every source".
  - `[low]` `[reject]` Working decision (a) cites WordCellRow.svelte:60 while R1 and the record cite :63 — true (:63); plan edit only (rule); noted in the errata.
  - `[low]` `[reject]` keys.ts:560 is `pressEscape`, the menu act() is at :548 — true; plan edit only; noted in the errata.
  - `[low]` `[reject]` The planned (c) test name differs from the committed one — true; plan edit only; noted in the errata.
  - `[false]` `[reject]` The new fly-to-cell test leads with AD-14 although a Q-id applies — Q-49 has no fly-in sentence, so AGENTS.md Conventions put AD-14 first, as decided for this file's tests (11.3 ticket review log minor 11, story-fly-to-cell-keeps-the-previewed-top.review-log.md:111) and as every sibling test is named; the ticket's `Q-49 AD-14 F28` is an "e.g.".
  - `[low]` `[reject]` The route line overstates the change ("about 90 lines … five files") — true at Scope 1 (about 60 lines, three files); plan edit only; noted in the errata.

## Auto Run Result

- **Status:** `built`, stopped at the owner's done checkpoint (tickets.toml entry 6 `done_checkpoint`). Not pushed.
- **Commits:** e99350f (Scope 1 test tightening and the first plan), 9394922 (doubleTap failure report, Scope 2), then the plan commit.
- **Summary:** Scope 1 (a), (b), (c), (d) applied and each proved by a reverted mutation; the `expectPreviewBeneath` half of (a) is not committed (vacuous on its callers, R2 owner call). Scope 2: 0/3 for every e2e test before and after the fix; the nav flake was not reproduced and has no found cause, so its diagnostic fix is kept, unconfirmed (R11 owner call). Scope 3 within budget. Scope 4 cites hold. The table accounts for every source (R1–R27).
- **Files changed:** `e2e/place-preview.spec.ts` (visible-count check in `expectPreviewLive`; new `expectMarkOverFace` at three call sites); `e2e/fly-to-cell.spec.ts` (new act()-key interrupt test); `src/ui/scenes/scenes.test.ts` (full-message anchors); `e2e/helpers/touch.ts` (doubleTap failure report); `e2e/helpers.spec.ts` (its case); this plan.
- **Review findings:** quick lens, 7 findings: 1 patched (medium, the nav test-only fix), 0 deferred, 6 rejected (5 low plan-wording errata whose fix is a plan edit, noted in the errata; 1 false, the test-name order).
- **Follow-up review recommended:** false (patched: high 0, medium 1, low 0).
- **Verification:** see Final verification record; mutation runs in the Scope 1 record; flake and budget runs in the Scope 2 and 3 records.
- **For the owner at the done checkpoint:** R2 (decline the vacuous `expectPreviewBeneath` check, or add a call on a cell with a card beneath), R10 (the ★ glyph DESIGN.md:311 doc proposal, for the retrospective), R11 (keep or revert 9394922; open the B8 fix ticket), R18 (judge the 360 px badge/★ meet on `session-place-long`), R26 (B3, B4, B6, B7 carried to the epic 11 retrospective).
- **Residual risks:** the nav.spec.ts:163 flake can return; its next failure now carries the event times. The `expectPreviewBeneath` gap stays open until the owner decides R2.
