---
title: 'Screenshot pipeline in the Playwright container'
type: 'feature'
ticket: '7'
created: '2026-09-28'
status: done
baseline_revision: '46dd98be64cc8e9bdefdb46869c555f486fb72a6'
route: 'oneshot'
route_source: 'auto'
review: 'quick'
review_source: 'auto'
lenses_ran: ['quick']
review_loop_iteration: 0
followup_review_recommended: false
context: ['{project-root}/_bmad-output/initiative-wordcell-v1/epic-scaffold-ci-deploy/story-screenshot-pipeline-in-the-playwright-container.md']
warnings: []
deferred:
  - summary: >-
      The ticket's Verify porcelain command uses the pathspec ':!_bmad-output', which git 2.43.0 rejects.
    evidence: |-
      `git status --porcelain --untracked-files=all -- . ':!_bmad-output'` prints `fatal: Unimplemented pathspec magic '_' in ':!_bmad-output'`. The build used the equivalent `':(exclude)_bmad-output'`. The ticket file is read-only to bmad-build-auto, so its text still has the broken form, and a verbatim rerun hits the same error.
    location: >-
      _bmad-output/initiative-wordcell-v1/epic-scaffold-ci-deploy/story-screenshot-pipeline-in-the-playwright-container.md (Verify step 5)
    severity: low
---

<intent-contract>

## Intent

**Problem:** AD-17 requires screenshot baselines generated and compared only inside `mcr.microsoft.com/playwright:v1.63.0-noble`; no screens config, script or spec exists yet (CAP-7, D4).

**Approach:** Implement ticket 1.7 exactly as its Acceptance Criteria specify: `playwright.screens.config.ts` (mirror of `playwright.config.ts` with the listed exceptions and the `WORDCELL_SCREENS_CONTAINER` load-time throw), `test:screens` / `test:screens:run` scripts verbatim, `e2e/placeholder.screens.spec.ts` (`AD-17 placeholder board screenshot`), committed android/desktop baselines, the AGENTS.md TODO(epic 1) edit, and the two append-only `_bmad-output/` lines (story-ci-workflow.md, build-notes CAP-8). Run the ticket's 12-step Verify sequence in order and quote its evidence here.

</intent-contract>

## Implementation Notes

Oneshot: about 70 lines across 4 source files plus 3 one-line doc edits; the ticket fixes every value (script text, config fields, error message, spec body), so no design choices remain.

Files: `playwright.screens.config.ts` (new), `e2e/placeholder.screens.spec.ts` (new), both baselines under `e2e/placeholder.screens.spec.ts-snapshots/`, `package.json` (`test:screens`, `test:screens:run` after `test:e2e:dist`), `AGENTS.md` (TODO(epic 1) line exactly as the ticket words it), append-only lines in `story-ci-workflow.md` (after the "SPEC CAP-8 success:" bullet) and build-notes CAP-8 screenshot-job bullet.

**Spec amendment for gate 4 / retrospective:** build-notes CAP-8 gains the additive note that the CI screenshot job sets `env: WORDCELL_SCREENS_CONTAINER: '1'`.

**Surprise (Verify command):** git 2.43.0 rejects the ticket's literal pathspec `':!_bmad-output'` (`fatal: Unimplemented pathspec magic '_'`: in short form `_` right after `!` is not parsed as a path). Every porcelain capture uses the equivalent long form `':(exclude)_bmad-output'`.

**Verify evidence (sequence steps 1–12, run in order, one at a time):**

1. `docker version`: Server Docker Desktop 4.92.0, Engine 29.8.0.
3. `npm run lint` (Biome, 50 files, no fixes) and `npm run check` (0 errors, 0 warnings) pass. Ports 5173/4173 free (`ss -ltn`). `npx playwright test --list`: 56 tests in 4 files, 0 lines matching `screens`. `env -u WORDCELL_SCREENS_CONTAINER … --list` and `WORDCELL_SCREENS_CONTAINER=0 … --list` both exit 1 with `Error: playwright.screens.config.ts runs only in the Playwright container (npm run test:screens); WORDCELL_SCREENS_CONTAINER must be 1`. Delta check `WORDCELL_SCREENS_CONTAINER=1 npx playwright test --list -c playwright.screens.config.ts`: `[android] › placeholder.screens.spec.ts:5:1 › AD-17 placeholder board screenshot`, `[desktop] › …` , "Total: 2 tests in 1 file".
4. `npm run test:screens -- --update-snapshots`: exit 0, 47.8 s wall; both "A snapshot doesn't exist … writing actual." lines, `2 passed (3.5s)`. webServer start time: `VITE v8.3.1  ready in 891 ms`. No `reloading` line (Vite printed `Forced re-optimization of dependencies` at start, which is not a reload).
5. Capture 1 (nothing staged):
   ```text
    M AGENTS.md
    M package.json
   ?? e2e/placeholder.screens.spec.ts
   ?? e2e/placeholder.screens.spec.ts-snapshots/placeholder-board-android-linux.png
   ?? e2e/placeholder.screens.spec.ts-snapshots/placeholder-board-desktop-linux.png
   ?? playwright.screens.config.ts
   ```
   `a9759974dc5540484034dc3c0041c8cdadb8a2b12739ba764efc61167a61a9c9  …android-linux.png`, `20da30e14290d93592941c9cf7d4c8c147361b28ccf24dcb6262f4a683d67907  …desktop-linux.png`.
6. Probe: `v24.20.0`, `11.19.0`, `/work` `1000:1000` (satisfies `engines.node >=22.12`).
7. `npm run test:screens`: exit 0; `npm ci`: `added 384 packages, and audited 385 packages in 6s`; `ready in 749 ms`; `2 passed (3.4s)`; no `reloading`.
8. Capture 2: porcelain lines and both hashes identical to capture 1 (`diff` empty).
9. Tamper run: exit 1, `✓ 1 [android] › e2e/placeholder.screens.spec.ts:5:1 › AD-17 placeholder board screenshot (663ms)`, `✘ 2 [desktop] …`, `Expected an image 412px by 839px, received 1280px by 720px. 675122 pixels (ratio 0.63 of all image pixels) are different.`, `1 failed`, `1 passed`. Restored immediately from `/tmp`; desktop hash `20da30e1…67907` equals capture 1. Plain re-run: exit 0, `2 passed (3.4s)`.
10. Host writes: `touch` of both PNGs and `generated/dictionary/en.txt` → 0; create/delete in `generated/dictionary/`, `test-results/`, `e2e/placeholder.screens.spec.ts-snapshots/` → 0/0 each.
11. Ports free; host `npm run test:all` exit 0: Vitest 309 passed (6 files); e2e 33 passed, 23 skipped (pre-existing android-only helper self-tests on desktop); pwa 12 passed.
12. Capture 3 recorded in the Auto Run Result before the commit.

Baselines inspected visually: android shows the full 52-card placeholder board; desktop is cropped at the viewport (accepted by the ticket until epic 4).

## Plan Change Log

## Review Triage Log

### 2026-09-28 — Review pass
- verdicts: 4 findings — high 0, medium 0, low 2, false 1, maybe-false 0 (1 finding with a plan-only fix is counted as low)
- findings:
  - `[false]` `[reject]` Step 12 capture 3 evidence is missing from the plan. Refutation: step 12 takes capture 3 right before the commit, which is Finalize. It was taken there, equals capture 1 and is quoted under Auto Run Result.
  - `[low]` `[reject]` Capture 2's porcelain and hashes are described, not quoted. The fix only edits this build's plan. They are still quoted under Auto Run Result as verification detail.
  - `[low]` `[reject]` The evidence list has no entry for step 2 (edits complete). The fix only edits this build's plan. Step 2 held: every file edit outside `_bmad-output/` was done before the step 3 lint/check, and no later edit outside `_bmad-output/` was made.
  - `[low]` `[defer]` The ticket's porcelain pathspec `':!_bmad-output'` fails on git 2.43.0 and the ticket keeps the broken text. The defect is in the ticket, not this change, and the ticket file is read-only here. Added to `deferred`, and flagged for the owner.

## Verification

**Commands:** the ticket's Verify sequence steps 1–12 (story file, Acceptance Criteria), in order, one at a time; ports 5173/4173 free before each host Playwright run.

## Auto Run Result

**Summary:** Adds the AD-17 screenshot pipeline (CAP-7, D4):
- `playwright.screens.config.ts` refuses to load unless `WORDCELL_SCREENS_CONTAINER=1`.
- `test:screens` runs the specs in `mcr.microsoft.com/playwright:v1.63.0-noble` with `node_modules` in the named volume `wordcell-screens-node-modules`; `test:screens:run` is the CI entry point.
- `AD-17 placeholder board screenshot` runs on `android` and `desktop`, with committed baselines.

**Files changed:**
- `playwright.screens.config.ts`: new. It mirrors `playwright.config.ts` with the ticket's exceptions and throws at load unless run in the container.
- `e2e/placeholder.screens.spec.ts`: new. It waits for the 52 cards and the font precondition (copied from `e2e/pwa/font.spec.ts`), then takes the viewport screenshot.
- `e2e/placeholder.screens.spec.ts-snapshots/placeholder-board-{android,desktop}-linux.png`: the baselines, generated in the container.
- `package.json`: adds `test:screens` and `test:screens:run`.
- `AGENTS.md`: the TODO(epic 1) items are gone; the line now reads "no items remain; the D8 audit removes this line".
- `story-ci-workflow.md` and build-notes CAP-8: one append-only line each. The CI screenshot job sets `WORDCELL_SCREENS_CONTAINER: '1'`.

**Spec amendment (owner, gate 4):** build-notes CAP-8's screenshot-job bullet gains that `env` line.

**Review:** 1 quick-lens pass, 4 findings. 0 patches, 1 deferred (the ticket's broken pathspec), 3 rejected. One rejection was false: capture 3 belongs to Finalize. Two were rejected because their only fix edits this plan. Patched counts: high 0, medium 0, low 0. Follow-up review recommended: false.

**Verification:** every step of the ticket's 12-step sequence passed; evidence is under Implementation Notes.
- Capture 2 (after the plain run) and capture 3 (immediately before the commit, nothing staged) both equal capture 1 exactly:
  ```text
   M AGENTS.md
   M package.json
  ?? e2e/placeholder.screens.spec.ts
  ?? e2e/placeholder.screens.spec.ts-snapshots/placeholder-board-android-linux.png
  ?? e2e/placeholder.screens.spec.ts-snapshots/placeholder-board-desktop-linux.png
  ?? playwright.screens.config.ts
  a9759974dc5540484034dc3c0041c8cdadb8a2b12739ba764efc61167a61a9c9  e2e/placeholder.screens.spec.ts-snapshots/placeholder-board-android-linux.png
  20da30e14290d93592941c9cf7d4c8c147361b28ccf24dcb6262f4a683d67907  e2e/placeholder.screens.spec.ts-snapshots/placeholder-board-desktop-linux.png
  ```
- Host `npm run test:all` passes.

**Residual risks:**
- Every container run downloads packages (`npm ci` over the wiped volume), so it needs network.
- The desktop baseline is cropped at the viewport; this is accepted until epic 4.
- Ticket 8 must set `WORDCELL_SCREENS_CONTAINER: '1'` in the CI screenshot job.

