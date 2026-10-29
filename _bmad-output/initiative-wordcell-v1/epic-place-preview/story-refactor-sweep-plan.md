---
title: 'Refactor sweep (epic 11)'
type: 'chore'
ticket: '6'
created: '2026-10-29'
status: 'in-progress'
baseline_revision: '5a86a03fd89410dc3bfb15c9fee9ca009f9a396b'
route: 'oneshot'
route_source: 'auto'
review: ''
review_source: ''
lenses_ran: []
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
| R11 | digest :127 (1); handoff :13; 11.5 ticket :45; `.autopilot/20261028-1937/11.4-testall-attempt1.log:2489-2519` | `[android] nav.spec.ts:163` doubleTap check fired, details `[1, 1]` | yes, e2e/nav.spec.ts:163, e2e/helpers/touch.ts:87-131 | pending build (Scope 2) |
| R12 | 11.4 plan :99 | `flip-controller.spec.ts:350` reduced-motion fade failed once in a full run | pending runs | pending build (Scope 2) |
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
| R27 | 11-1-build:23 "Unapplied minors: none"; 11.1–11.4 plans :17 `deferred: []`; 11.1 plan :119 residual (closed: src/ui/WordCellRow.svelte:57 reads `cell.preview`, d021c5e); 11.2/11.3/11.4 ticket review-log minors (resolved in their plans: digest :43, :84; 11.4 plan :183); digest :32, :43 (resolved/owner 09b2af2), :73 "nothing else", :100 (3) (R-52 hold removed, informational), :112 (answered, 8cd6b84); 11.5 plan (frontmatter only); 11.5 device read "no change asked" | nothing live | none (search: the grep above, read line by line) |

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
