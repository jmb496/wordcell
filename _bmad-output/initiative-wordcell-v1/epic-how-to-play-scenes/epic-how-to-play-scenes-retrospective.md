---
epic: epic-how-to-play-scenes
date: 2026-10-17
verdict: accepted-with-open-items
criteria: declared
headless: true
---

# Retrospective: epic-how-to-play-scenes (epic 8)

Headless run. No going-in concerns were given; the owner decisions of 2026-10-16 and 2026-10-17 (`Decision:` lines in the epic Notes) frame the analysis. The team discussion was skipped.

## Epic summary

- Epic file: `epic-how-to-play-scenes.md` (risk medium, after `epic-game-surfaces-and-keyboard`). Branch `epic-8-how-to-play`, HEAD `086e74a`. Epic 6 is on `main` (`91dfbed`).
- Tickets (`tickets.py status`): 8.1 to 8.11, all `status: done`, `state: done`; none at `built`; `pending_tickets` is empty.
- Shape: 8.1 to 8.5 built the original plan (list of five basic scenes plus three Tricky rules scenes). After the owner's first full look on 2026-10-17 the epic was reworked (commit `3545263`) into a five-scene carousel on a whole-play-area stage, tickets 8.6 to 8.11. 8.2 to 8.5 were mostly superseded by 8.6 to 8.11 (scenes 2 to 5 of the old list were rebuilt or deleted; HP-3, HP-4 and the HP-7 panel layout are annotated as superseded in the epic file).
- Plan baselines (linear, oldest first): 8.1 `6a8ad66`, 8.2 `be5c73d`, 8.3 `76fc0b4`, 8.4 `fe586c0`, 8.5 `ae50f4f`, 8.6 `412f96e`, 8.7 `e915ac0`, 8.8 `85b6121`, 8.9 `31d0bb2`, 8.10 `f12c91d`, 8.11 `6926b1f`. One epic-wide range `6a8ad66..HEAD`, end inferred (HEAD; no later work). `git_evidence.py`: 111 commits, 0 merges. Commit subjects name tickets only sometimes, so each plan's baseline is the provenance.
- Evidence available: epic file, 11 tickets with plans, review logs and pass files, both autopilot digests and the handoff, the previous retro, git. Missing: raw session transcripts (process findings rest on the digests only, narrowed scope).

## Findings

Sources are relative to the repo root. Dispositions: fix, defer, accept.

### Aggregate views

**Architecture delta (checked, clean except F-1).** Across the range `src/shell`, `src/ui/gestures` and every other engine file are untouched (`git diff --stat 6a8ad66..HEAD -- src/engine src/shell src/ui/gestures`: only `src/engine/how-to-play-scenes.test.ts` and `src/engine/scene-replay.ts`, both new). UI imports engine types only; the scene content is JSON under `fixtures/` read by UI and engine test (AD-1). `npm test` this run: 76 files, 2900 tests passed (includes the `src/architecture-*.test.ts` scans).

**Size growth (checked, clean).** Largest non-test files: `src/ui/scenes/Scene.svelte` 585 lines (+585 net, 12 commits), `src/ui/scenes/effects.ts` 339, `types.ts` 169, `Carousel.svelte` 168, `place.ts` 159. Tests dominate churn: `src/ui/scenes/scenes.test.ts` 1323 lines (17 commits), `e2e/how-to-play.spec.ts` +1151 net (17 commits), `src/engine/how-to-play-scenes.test.ts` 540. `Scene.svelte` is the one candidate to watch; it mixes markup for all five scenes. No file is a god-class yet. Source: `git_evidence.py` file ranking, `wc -l`. Disposition: accept.

**Duplication map (accept).** Per-scene modules (`move-compose.ts`, `free-letter.ts`, `place.ts`, `scoring.ts`, `source-drop.ts`) each repeat the board/tray setup but share `stage.ts`, `tray-scene.ts` and `geometry.ts`. The old per-scene modules (`compose.ts`, `destination.ts`, `drag.ts`, `top-card.ts`, `destination-rule.ts`) churned +/-0 net: they were replaced and deleted by 8.7 to 8.10, and 8.11 ran a fixed-point zero-importer audit (`story-rework-sweep-docs-budget-and-cleanup-plan.md` Implementation Notes). Checked and clean.

**Pattern divergence (checked, clean).** All scene text is in `src/ui/text.ts` (`howTo`); every `howTo` key has a live reference (8.11 audit (3)). Fixtures are named `fixtures/how-to-play-*.json`, tests carry ids. No new `console.*` or `catch` seen in the ticket plans.

**Spec-to-implementation reconciliation.**
- F-1 (accept, record): the epic Boundaries say "one engine replay test under `src/engine/` (test only, no engine source change)". Ticket 8.1 nevertheless added a non-test engine-directory file, `src/engine/scene-replay.ts` (the harness, 239 lines added in total), and 8.11 deleted part of it (`rejected` support). It exports nothing through `src/engine/index.ts` and is imported only by the test (8.11 plan "scene-replay.ts exception"; `grep scene-replay src` shows only `how-to-play-scenes.test.ts`). The deviation was never named when 8.1 added the file; 8.11 named only the deletion. The handoff asks the owner whether they disagree with the deletion-only exception. Disposition: accept; reword the epic Boundaries to say the harness file `src/engine/scene-replay.ts` is a test-support file.
- F-2 (defer, owner): Done when 5 (the owner has read the scene captions, SPEC F3 style review) has no recorded read. Captions for scenes 1 to 4 were set or kept (`Decision:` 2026-10-16, kept 2026-10-17 for scene 3, commit `85b6121`) and the 8.11 plan lists every new `text.ts` string with old and new text for the owner, but no later note records the read. The digests say "the owner reviews all scene captions at the epic end". The scene 1 and scene 2 captions are the combined new ones (`scenes.moveCompose`, `scenes.freeLetter`), drafted in ticket 8.7 and not yet seen by the owner as final wording.
- F-3 (accept): Done when 1, 3, 4, 5 are partly superseded by the 2026-10-17 decision and annotated in the epic file (8.11); the rewritten criteria are met in substance (see Verdict). The handoff's "SPEC.md (Scene 4 pacing)" close-out doc does not exist for this epic (no SPEC.md in the folder, and the epic Notes line for scene 4 already reads "stacks animate downwards ... then the numbers show", matching the built order). The EXPERIENCE.md carousel behaviours (no swipe, no wrap, opens on scene 1, restarts on entry) are in EXPERIENCE.md rows near lines 51, 166 and 450 to 470 (8.11). Close-out docs are therefore applied; nothing left.

### Diff-scope review (narrowed)

`bmad-review` was not invoked: the diff is 111 commits and every ticket had a ticket review loop and a code review loop with a log (`*.review-log.md`). I ran the adversarial, edge-case and verification-gap lenses inline over the review logs, the plans' deferred lists and the boundary between 8.6 (stage and carousel) and 8.7 to 8.10 (scenes). Narrowing: no fresh line-by-line read of the code.

- F-4 (defer, tests, low): `src/ui/scenes/script.ts:96` throws when a scoring step grows fewer than 2 cards; the 8.9 code review noted this throw is untested, and no test in `src/ui/scenes/scenes.test.ts` names it (`grep "cards < 2\|at least 2"` finds none). Same review: top letters of the stacks are asserted only by the screenshot baseline.
- F-5 (accept): the 8.1 owner review changed the player (slower steps, hand pointer) after the code review (commit `7164a66`); the 8.3 owner question (hide B from column 3) broke the static card count in `src/ui/how-to-play.test.ts` and was caught by `test:all`, then fixed (`81c2c31`). Both were caught by the gate.
- F-6 (accept): 8.3's hand-written cell 6 frames and the deferred "layers show through on a phone" medium were from the superseded design; the current `fixtures/how-to-play-place.json` states cells and scores that the engine test replays (`how-to-play-scenes.test.ts` R-52 R-60 cases). No evidence either survives; not re-derived frame by frame.
- F-7 (defer, docs): `tickets.toml` entry 7's `interface`/`references` differ from the ticket (8.7 review log), and entry 11's description was to be narrowed (8.10 digest "Worth knowing"). I did not verify entry 11 against the file. Both are bookkeeping, no behaviour.

### Process

- F-8 (process): the largest waste was ordering. Tickets 8.2 to 8.5 cost about 26 M input-equivalent tokens (6.9 + 8.3 + 7.5 + 3.7, from the digest) and were then largely replaced after the owner's first look at the full panel on 2026-10-17. The plan had a done checkpoint on 8.1 (the single scene in the panel), but the owner's decisive objection (scenes must show the whole play area, one scene at a time) concerned the whole stack of scenes, which only existed after 8.5. Lesson: for a visual, look-and-feel epic, put a done checkpoint on the first full composition (scene stage as it will really look), not only on the first scene.
- F-9 (process): ticket review is the dominant cost again (42 to 61 % of tokens on 8.2 to 8.11 in the digests), with 5 to 7 passes. Four tickets stopped for an owner question that a one-line default could have settled earlier (8.3 hide B, 8.7 content, 8.8 caption, 8.9 pacing); each was answered the same day and recorded in the ticket and epic Notes. Positive: no decision was taken silently.
- F-10 (process): two orchestrator slips, both caught by later gates: the 8.8 build prompt omitted the ticket review's unapplied minors; the 8.9 build skipped its own internal review (the code review loop covered it). Digest notes both.
- F-11 (process): flaky test, one `board-keys` desktop teardown timeout on 8.10's first `test:all`, passed alone and on rerun (digest 8.10); same family as epic 6's F-13. Accept.
- F-12 (process): the 8.1 plan checkpoint question (does the harness split from the player?) was answered by the plan; no sign it caused trouble.

## Behavior verification

The epic changed runtime behaviour (the How to play panel).

- Observed this run: `npm test`: 76 files, 2900 tests passed (16.2 s wall on `/mnt/d`, cold; the 5 s budget is measured on the Linux filesystem and was not re-measured here).
- Observed this run: `npx playwright test e2e/how-to-play.spec.ts --project=android`: 47 passed. These cover scene play, pause and restart by tap, the carousel arrows and dots, a closed panel running nothing, reduced motion stepping, Animation speed, resize, and the 360 px and landscape layouts.
- Reported, not re-run by me: `npm run test:all` green (unit 2900, dist-smoke 15, e2e 948, pwa 13), `npm run test:screens` green (42 passed, 18 skipped, six how-to-play baselines, no orphan PNG), and the size budget 549,629 of 600,000 bytes (margin 50,371) at the 8.11 build (`story-rework-sweep-docs-budget-and-cleanup-plan.md` Implementation Notes).
- Not exercised: a real phone or a real screen reader for the carousel (dot and arrow names are verified by text assertions only), and a human read of the animations beyond the owner's own looks during the epic.

## Previous-retro follow-through

Previous retro: `epic-game-surfaces-and-keyboard/epic-game-surfaces-and-keyboard-retrospective.md`, Action items section present.

| Item (owner) | Landed? | Evidence |
|---|---|---|
| A1 test gaps in 6.13 (Dev) | Yes | Resolved section, `ee6085a` |
| A2 wheel and hover-peek tests (Dev) | Yes for wheel; hover-peek accepted as e2e-only | Resolved section |
| A3, A4 close-out doc edits (Owner) | Yes | Resolved section, `f0c571e` |
| A5 regenerate idle-pending-draft baselines; owner skim of 6.11 and 6.12 baselines (Owner/Dev) | Regenerated yes (`853ab41`); skim not recorded | Resolved section |
| A6 skim 6.9 wording and screen-reader strings (Owner) | Left unreviewed by owner decision 2026-10-16; the 6.9 static page is replaced by this epic | Resolved section |
| A7 sweep leftovers D4 to D9, D16 (Owner) | Left unreviewed by owner decision | Resolved section |
| A8 unit-suite headroom (Owner/Dev) | Measured 4.35 s of 5 s at epic 6; suite is now 2900 tests in 76 files; no fresh median recorded this epic, no evidence found either way | 8.11 plan lists the budget as a rule; `test:all` passed |
| A9 autopilot digest wording (Process) | Dropped by the owner as moot | Resolved section |
| A10 device checks (Owner) | Left unreviewed by owner decision; still no device or screen-reader pass | Resolved section |
| Done when 7 (merge and deploy epic 6) | Yes: epic 6 is on `main` | `91dfbed` on `main`, `git merge-base main HEAD` is `1cfcbfd`, a descendant of epic 6 |

## Action items

All are proposals; none is applied. "Docs" means an owner-visible document.

| # | Action | Owner | Kind | Source |
|---|---|---|---|---|
| A1 | (Resolved: owner read them, 2026-10-20) Read the five scene captions and the carousel once in the real app and say "fine" or give wording changes (Done when 5; the combined scene 1 and scene 2 captions are the newest) | Owner | Review (changes on-screen text only if wording is changed) | F-2 |
| A2 | (Resolved: Boundaries reworded and deletion accepted, owner 2026-10-20) Reword the epic Boundaries so `src/engine/scene-replay.ts` is named as a test-support file in `src/engine/`, and record the 8.11 deletion as an accepted exception; confirm you do not disagree with that deletion | Owner (docs) | Spec reconciliation | F-1, handoff |
| A3 | Add a test for the scoring script's `cards < 2` throw and a check that each stack's top letter is what the fixture states (`src/ui/scenes/script.ts:96`, `scenes.test.ts`) | Dev (small) | Remediation, low | F-4 |
| A4 | Sync `tickets.toml` entries 7 and 11 with their tickets (interface, references, description) | Owner/Dev | Docs, bookkeeping | F-7 |
| A5 | For the next visual epic, put a done checkpoint on the first full composition of the shared stage, before building the rest of the scenes | Owner (process) | Process lesson | F-8 |
| A6 | Pass the ticket review's unapplied minors into every build prompt; do not let a build skip its internal review | Process | Process lesson | F-10 |
| A7 | Mark the epic done with bmad-preview-ticketing once the owner answers A1 and A2; merging epic 8 to `main` and deploying needs the owner's go-ahead | Owner | Gate | verdict |

Needs the owner: A1, A2, A5, A7. A3, A4 and A6 are technical defaults for the dev loop.

## Acceptance verdict

**accepted-with-open-items**, criteria declared (the epic file has Done when, annotated by the 2026-10-17 rework). Every ticket is finished, so the unfinished-ticket rule does not apply.

1. Done when 1 (carousel of five scenes, each looping, pausable and replayable, Playwright asserts play and pause by tap): met. `e2e/how-to-play.spec.ts` android, 47 passed this run.
2. Done when 2 (every scene script passes the engine replay; changing a rule constant or a scene move makes it fail): met. `src/engine/how-to-play-scenes.test.ts` in the 2900 passing unit tests; it has tamper cases that fail the harness (lines 301 to 381).
3. Done when 3 (reduced motion steps through frames; Slow is slower than Fast; a closed panel runs nothing): met by `HP-2` reduced-motion, `AD-10 Animation speed` and `closed, the scene animates nothing` e2e rows (47 passed this run).
4. Done when 4 (`test:all`, `test:screens`, a final-frame baseline of each scene, size budget): met as reported at the 8.11 build (not re-run by me): six baselines, margin 50,371 bytes.
5. Done when 5 (owner has read the scene captions; EXPERIENCE.md describes the new panel): EXPERIENCE.md part met (8.11); the owner caption read is not recorded: open (A1).

Open items carried: A1 to A7. None is a failing criterion; A1 is the only one that can change on-screen wording.

## Open questions

1. Are the captions of the five scenes right as built, in particular the combined scene 1 and the scene 2 caption? (A1)
2. Do you accept the deletion in `src/engine/scene-replay.ts` as a one-off exception to "no engine source change"? (A2)
3. Do you give the go-ahead to merge `epic-8-how-to-play` to `main` and deploy once the above are answered? This retro does not merge or deploy.

## Assumptions

- The epic reference resolved from the invocation's epic folder `_bmad-output/initiative-wordcell-v1/epic-how-to-play-scenes` (`tickets.py status <folder>`); `pending_tickets` was empty, so no override of the verdict applies.
- Headless: no confirmation was sought. Machine verdict **accepted-with-open-items** was rendered with no human decision; the owner may override.
- The previous epic is taken as `epic-game-surfaces-and-keyboard` (named by the epic's `after`); epic 7 does not exist as a folder.
- Each action item above is a proposal made without the owner; A3 to A6 take the technical default.
- Test counts and the android how-to-play run were observed by me; `test:all`, `test:screens` and the size margin are taken from the 8.11 plan and digest.
- Post-close follow-through (Opus review, 2026-10-22, `b6272b0`): A3 landed (scoring top-letter checks and the `cards < 2` throw test); A4 (tickets.toml entries 7 and 11 sync) is still open, listed as a minor in `opus-review-epic-8.md`.
