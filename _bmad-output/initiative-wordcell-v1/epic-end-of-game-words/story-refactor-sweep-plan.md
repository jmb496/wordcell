---
title: 'Refactor sweep (epic 10 deferred findings)'
type: 'refactor'
ticket: '10'
created: '2026-10-24'
status: done
baseline_revision: '728b18ac277802979795dfb0eb7a65bad33348f5'
route: 'full'
route_source: 'auto'
review: 'thorough'
review_source: 'auto'
lenses_ran: ['blind-hunter', 'edge-case-hunter', 'verification-gap', 'intent-alignment']
review_loop_iteration: 0
followup_review_recommended: false
context:
  - '{project-root}/_bmad-output/initiative-wordcell-v1/epic-end-of-game-words/story-refactor-sweep.md'
  - '{project-root}/_bmad-output/initiative-wordcell-v1/epic-end-of-game-words/story-refactor-sweep.review-log.md'
  - '{project-root}/_bmad-output/specs/spec-epic-10-end-of-game-words/SPEC.md'
warnings: ['oversized', 'multiple-goals']
deferred:
  - summary: >-
      Ticket 10.10 item 4's Svelte warning fix has no lasting regression check.
    evidence: |-
      Restoring `bind:this={elements[g]}` in Celebration.svelte keeps celebration.spec.ts, dist-smoke and svelte-check green while the 10 dev console warnings return; the only evidence is the throwaway seam-on console capture (Implementation Notes, item 4). The plan declined a lasting console assertion (Design Notes: a dev-only warning is not a product rule). Review lens verification-gap, 2026-10-25.
    location: >-
      src/ui/celebration/Celebration.svelte
    severity: low
---

<intent-contract>

## Intent

**Problem:** Epic 10 closed with about 150 deferred review findings, digest notes and stale names across the 10.1-10.9 plans, review loops and digest. Some are live: stale comments, weak tests, one lint warning, a Svelte dev warning, and two doc syncs the owner already decided. None has a recorded disposition, and the end-of-epic budgets have not been measured.

**Approach:** Apply ticket 10.10's Scope items 1-7 as listed (comments, titles, tests, the Svelte warning fix, the item 6 repro-then-decline, the two decided doc syncs). Commit those edits locally, then at that commit measure item 5 (three full android runs) and item 10 (budgets). Record every finding in the item 11 table (Appendix C) with a disposition. Stop at `built` for the owner's done checkpoint.

## Boundaries & Constraints

**Always:**
- Cite rules by id (R-xx, SPEC Fnn, AD-n); test titles start with their id, and a renamed title keeps its prefix.
- Item 1's diff touches only comments and titles. Items 2-3 are test-only (src `*.test.ts`, `e2e/**`).
- Production code changes are limited to item 4 (Celebration.svelte only) and, if item 6 reproduced, end-sheet.ts. It does not reproduce (Appendix B), so end-sheet.ts stays untouched.
- Doc edits are only item 7's two (DESIGN.md:753 A-D12, epic References F-range). Every other doc mismatch is an old → new proposal in the plan.
- Every new or strengthened test passes at HEAD+edits and fails on its recorded mutation; the mutation is reverted (`git diff` shows only intended edits).
- A new/strengthened test that fails on correct code is not committed: it becomes an owner-call row with the failing case.
- A changed e2e test must pass `--repeat-each=5` on its project; failing a repeat gets a test-only fix and a rerun, else an owner-call row.
- The owner answers F30/F31/F32 apply: F30 and F31 are declined rows (F31 is a follow-up ticket for the retrospective), and F32 is kept with its EXPERIENCE.md/AD-19 note as a retrospective close-out proposal.

**Never:**
- Change behaviour, owner-tuned motion (step.ts constants and formulas), a spine contract or an owner doc beyond item 7.
- Touch `fixtures/`, `SESSION_VERSION`, `HISTORY_VERSION`, `deal.test.ts`, `package.json` or the lockfile.
- Change any measured SPEC F25-F27 literal in step.test.ts (:585-590, :602, :1076 and the `PACES` table).
- Regenerate or add screenshot baselines; run `test:screens` on the host.
- Use `svelte-ignore` to silence item 4.
- Edit tickets.toml or the ticket file.
- Change timeouts, retries or worker counts.
- Push.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Item 4 capture at HEAD | dev server, `session-won-words`, `enableCelebration` (seam on), winning Confirm, ≥ 1 `[data-celebration-group]` | 10 console warnings `binding_property_non_reactive` (measured during planning) | none |
| Item 4 capture after fix | same | 0 such warnings; celebration.spec.ts green; mid-run baseline unchanged | if > 0: fix incomplete, no commit |
| Item 4 seam-off control | plain win, no `setEnabled` | 0 groups, 0 warnings (this is why the seam must be on) | none |
| Item 6 guard test | real controller + `startTracker`, reduced-motion winning `play` (no animation) → `whenOpenAllowed` → `openDeferred`; WordCell press during the guard | press consumed (`stopPropagation`), no long-press timer, no throw, sheet opens at the 300 ms floor | contrast without tracker throws `AD-13 openPeek while endSheet…` (documented in the test comment, not asserted as a pass) |
| Tightened test fails on correct code | e.g. I2.b reference group paced on one geometry | not committed; owner-call row with the failing case | — |
| Flake run | `npx playwright test --project=android` ×3, CI unset (retries 0) | 0/3 for the 4 R-87 touch rows and the double-tap test; any other failure is recorded per test | a failing row gets a test-only fix rerun to 0/3, else an owner call; Playwright "flaky" counts as a failure |
| Budget over | build total > 600000, a non-empty package/deal diff, or a warm median ≥ 5 s | stop and report (HALT blocked) | — |

</intent-contract>

## Code Map

Worklists with exact HEAD lines, new wording, test bodies, mutations and commands: **Appendix A** (items 1-3), **Appendix B** (items 4, 6, 7, 8, 10). They were produced at HEAD 728b18a during planning; line numbers drift as edits land, so re-anchor by text.

- `src/ui/celebration/step.ts` -- comments only, at :3-5, :16-17, :28-29, :41(+:276), :244-246, :395-399 (I1.c, f, e, j, g). Constants and formulas untouched.
- `src/ui/celebration/step.test.ts` -- :585-587 comment (I1.e); :808-847 fade tests `vx: 0` → `speed: 0` plus finite-position asserts (I2.a); :64-67 `paceOf` reference-gravity form plus a ≥ 1 bound (I2.b). Measured literals unchanged.
- `src/ui/celebration/celebration.svelte.ts` -- comments :1-2 (I1.d), :123-124 (I1.h).
- `src/ui/celebration/celebration.svelte.test.ts` -- QU `viewOf` case (I2.d), `start()` throw rows (I2.f).
- `src/ui/celebration/Celebration.svelte` -- item 4: replace `bind:this={elements[g]}` with `{@attach keep(g)}` and a plain-write `keep` (Appendix B variant C). The array stays plain, nothing becomes reactive, `register([...elements])` in `onMount` is unchanged.
- `src/ui/celebration/Celebration.test.ts` -- :30 title (I1.a), :47 regex (I2.c), :113 title and :120-122 comment (I1.f).
- `src/ui/celebration/interruptions.ts` :5-7, `skip.ts` :8-16, `src/shell/test-hook.ts` :54 -- comments (I1.b, i, k).
- `src/ui/celebration/attached.test.ts` -- two-run row (I2.h).
- `src/ui/overlays.svelte.test.ts` :851-866 (I2.g); `src/ui/keys.test.ts` :1531-1537 and a new second-`M` row (I2.i); `src/ui/end-sheet.test.ts` :395-412 (I2.j) and the hidden-`done` variants beside :324 (I2.l); `src/engine/view.test.ts` the gaveUp list (I2.e) and the :1144-1153 tail (I2.k).
- `src/ui/gestures/controller.test.ts` -- item 6 guard test near the :3319 tracker test (Appendix B outline). `src/ui/end-sheet.ts` is not edited.
- `e2e/end-sheet.spec.ts` -- :845 lint (I3.a), :853 bound and the 3-letter row (I3.b), :900 history shape (I3.c). Never name a binding `history` (AGENTS.md pitfall): use `scoreHistory`.
- `e2e/pwa/dist-smoke.spec.ts` -- I3.d-f; needs `npm run build` before running, and a rebuild after a src mutation.
- `e2e/celebration.spec.ts` -- I3.g-j, l-p. `e2e/helpers.spec.ts` -- I3.k and the `watchAdded` self-test (I3.q). `e2e/win-guard.spec.ts` -- drop `watchFor`/`__seen` and use `watchAdded` from `e2e/helpers/celebration.ts` (I3.q).
- `_bmad-output/planning-artifacts/ux-designs/ux-wordcell-2026-09-27/DESIGN.md:753` and `epic-end-of-game-words.md:46` -- item 7's two edits (Appendix B, Apply 1-2).
- Read-only references: `src/ui/motion.ts` (:55 `MIN_GUARD_MS`, :123-137 install, :265-277 evaluate, :341 `onEvent`, :430-436 consume), `src/ui/flip.ts:329-342`, `src/ui/end-sheet.ts:40-63`, `e2e/helpers/celebration.ts` (`enableCelebration`, `finishCelebration`, `running`, `skipByPress`, `watchAdded`), `e2e/helpers/board.ts` (`openFixture`).

## Tasks & Acceptance

**Execution:**
- [ ] `src/**` comments and titles -- apply I1.a-k (Appendix A) -- item 1: each comment says what the code does now and cites a real source.
- [ ] `src/**/*.test.ts` -- apply I2.a-l. For each, run the test green, apply its mutation, see it fail, revert, and record the result in Implementation Notes -- item 2. I2.m: no code change (rows in Appendix C).
- [ ] `src/ui/gestures/controller.test.ts` -- add the item 6 guard test `AD-12 a press during a won settle's guard (no animation, reduced motion) is consumed: no long-press timer, and the sheet opens at the floor with no throw`, per Appendix B -- item 6 decline evidence.
- [ ] `src/ui/celebration/Celebration.svelte` -- item 4 attachment fix. Run the temporary console-capture spec (Appendix B; place it in `e2e/` and delete it after) at HEAD and after the fix, and record both counts -- item 4.
- [ ] `e2e/**` -- apply I3.a-q. Run each changed test with `--repeat-each=5` on its project (Appendix A commands), apply each mutation, and record the results -- item 3.
- [ ] `DESIGN.md:753`, `epic-end-of-game-words.md:46` -- item 7 Apply 1-2, citing the digest's 10.9 done entry -- item 7.
- [ ] Commit the cleanup locally: `refactor(epic-10): ticket 10.10 sweep — comments, tests, Svelte warning, doc syncs`.
- [ ] At that commit -- item 5: run `npx playwright test --project=android` three times (CI unset, default workers) and record failures/3 for the four `-g "R-87 a (touch (press|held)|quick second tap)"` rows, the nav.spec.ts double-tap test and any other failing test -- item 10: run `npm run build` (margin), the `git diff` checks (Appendix B Item 10), `git diff --stat 728b18a -- fixtures/` empty, and the warm `npm test` median of 3 on a fresh clone at that commit under `~/` (ext4; `git clone` the repo path, `npm ci`, one cold run, then three timed runs). Record each measurement's commit.
- [ ] Final -- `npm run test:all` green, then `npm run test:screens` (Docker), then `git status --porcelain -- e2e/` shows no `*-snapshots` change.
- [ ] This plan -- fill Appendix C's "live at HEAD" and disposition columns from the outcomes (mutations, flake runs, the item 6 test); add the old → new title map for renamed titles; status `built`; commit the plan.

**Acceptance Criteria:**
- Given the cleanup commit, when `npm run lint` runs, then it reports 0 warnings and 0 errors.
- Given the item 4 fix, when the seam-on console capture runs on the dev server, then it logs 0 `binding_property_non_reactive` (HEAD: 10), and `e2e/celebration.spec.ts` plus the mid-run baseline (test:screens) stay green.
- Given each new or strengthened Vitest test, when its recorded mutation is applied, then it fails, and it passes again once the mutation is reverted.
- Given each changed e2e test, when it runs with `--repeat-each=5` on its project, then 5/5 pass, and it fails on its recorded mutation (title-only renames excepted).
- Given the final commit, when `npm run test:all` and `npm run test:screens` run, then both are green and no baseline changes.
- Given `git diff 728b18a -- fixtures/` and `git diff 19acd17 -- package.json package-lock.json src/engine/deal.test.ts src/engine/session.ts src/engine/history.ts`, when run at the final commit, then all are empty.
- Given Appendix C, when the owner reads it, then every source of ticket item 11 has a row (or a "none" row naming its search), each row has evidence for whether it is live at HEAD and a disposition, and "fixed here" appears only for findings that items 1-7 name.

## Implementation Notes

Build 2026-10-24/25 (unattended, one agent). Cleanup commit **767ed42** `refactor(epic-10): ticket 10.10 sweep — comments, tests, Svelte warning, doc syncs`; every mutation below was applied temporarily and reverted (`git diff` showed only the intended edits before the commit).

**Item 1 (comments and titles):** I1.a-k applied as worded (rewrapped to 100 columns; step.ts constants and formulas untouched; the optional :276 one-liner added). Diff is comments and test titles only.

**Items 2-3 (results per worklist entry):**
- I2.a: green; mutation (a) restore `vx: 0` → 3 tests fail (new finite check); (b) step.ts fade `/ (2 * state.baseMs)` → 3 fail. Reverted.
- I2.b: green on all 9 scenes (portrait/desktop/landscape × 3 lists) and the overrun test; `exitOf` hoisted (also used by the F25/F27 lap test, literals unchanged). Mutation (a) step.ts `pace = Math.max(1, …)` → bare ratio: 11 fail, the reference's unpaced assertion (`5820 < 5819`) among them. Robustness record (b) FALL_FRAC 0.2 → 0.25: the new `paceOf` reads 1 for the unpaced groups (HEAD's literal form would read ≈ 0.8); the PACES pins and the overrun test fail on the changed physics only (e.g. the lone 23-letter row is paced 1.155 at 0.25). Reverted.
- I2.c: green; mutation Celebration.svelte `style:opacity="0"` → `"0.5"` → the I1.a test and the F20/F26 test fail. Reverted.
- I2.d: green; mutation celebration.svelte.ts `letters: entry.cards.length` → `entry.letterCount` → the QU test fails. Reverted.
- I2.f: 4 rows green (top bar, action bar, .board-root, --wc-w); mutation delete the `--wc-w missing` throw → the `--wc-w unreadable` row fails. Reverted.
- I2.h: green; mutation delete celebration.svelte.ts `pending = null;` in `removed()` → the two-run row fails (only it, of the 225 celebration tests). Reverted.
- I2.g: green, rows renamed '… with a hover peek'; mutation openHoverPeek early return also on `selection !== null` → the tail-selection row fails (and an existing openDeferred test); on `endSheet !== 'hidden'` → the collapsed-sheet row fails. Reverted.
- I2.i: (1) renamed row + `press('m')` false: green; mutation keys.ts `attempt` return-false condition `&& id !== 'menu'` → the renamed row fails (plus the AD-12 "M … do nothing" rows). (2) new second-`M` row: the keys.test celebration mock gained a test-only `onCelebrationEnd` hook so the run's end closes `celebration` (pop pending) and opens the sheet, as the real end does; green; mutation keys.ts waiter `void attempt(id, again.ctx)` → `ROWS[id].run(...)` → the new row fails (plus two AD-12 pending-pop rows). Reverted.
- I2.j: green (stub now CAT then BAKED, asserted in that order); mutation EndSheet.svelte `return v.wordList;` → a letter-count re-sort → fails. Reverted.
- I2.l: 3 rows green (playing, no GameView, token cancelled by resetForNewSession); mutation end-sheet.ts hidden branch drop `if (game.view?.status === 'won')` → the playing and no-GameView rows fail; the token row is guarded inside `openDeferred` (no end-sheet.ts mutation reaches it). Reverted.
- I2.e: green; mutation view.ts comparator `current !== 'won' ? 0 : …` → the new gaveUp row fails (and the I2.k tail row). Reverted.
- I2.k: three Undos land the cursor at `{ index: 2, phase: 'idle' }` with 3 moves; list `['ones:4', 'tan:3']`; mutation view.ts `b.letterCount - a.letterCount` → `a - b` → the tail row fails (HEAD's length-only check would pass), as do 5 other R-86 rows. Reverted.
- I3.c (history shape): the planned check fails on correct code: `openFixture(page, 'session-won-words', …)` stores no `wordcell:history` at boot (`R-88 no wordcell:history after boot`, 5/5 repeats), so there is no record to pin; not committed (owner-call row).
- I3.a: lint 0 warnings after the change; 5/5 (with I3.b). I3.b: both rows 5/5 on android; mutation EndSheet.svelte `.word` clamp max 1rem → 1.125rem → both fail (18 px). Reverted.
- I3.d-f (dist-smoke, `npm run build` first): both R-87 hook-free rows 10/10 (`--repeat-each=5`). I3.d mutation helpers/celebration.ts `seen[selector] = true` initial → both rows fail on the new `added()` false check (HEAD's passes). I3.e mutation skip.ts `onGuardEnd` throws, rebuilt → the press row fails on the `errors` check (pageerror/console "mutation"); HEAD's spec passes on the same build. Rebuilt clean after. I3.f mutation helpers `waitForTimeout(6000)` before the tap → the new `__rootAtPress` check fails (false); note: HEAD's row already fails on that mutation too, at `toBeFocused` (the tap lands on the opened sheet), so the plan's "HEAD passes" did not hold; the new check now runs before `expectSkippedToSheet` so it is the first to fail.
- I3.g: the 'copies' and 'Redo plays it again' rows 5/5. The plan's two-file mutation (`faces.slice(0, 0)` + drop the faces-count throw) crashes the controller's render (`face.style` of undefined) so the HEAD and fixed helpers both fail at the earlier 55-copies count or in `advance`; used instead a scratch page-side childless `[data-celebration-group]` prepended to body before `stepUntilShown` with `> 0` asserted: the fixed helper passes (skips it), HEAD's returns 0 (fails). Scratch reverted.
- I3.h: row 5/5. The plan's mutation (no nav push/pop for `celebration`) is caught by HEAD's `wcOf` = 1 check while running; used instead: the run's close skips its `nav.pop()` and the next `endSheet` push skips its `nav.push()` (wc and history.length unchanged): the new popstate counter fails (0, expected 1), HEAD's spec passes. Reverted.
- I3.i: both rows 5/5; mutation Tray.svelte collapsed-bar condition `|| overlays.top === 'celebration'` → both new checks fail. Reverted.
- I3.j: NOT committed (owner-call row). The new row passed 5/5 but is vacuous: the mutation (delete overlays.svelte.ts `if (viewOnTop) close('wordcellView');` in `startCelebration`) still passes. Probe (throwaway spec, deleted): on `session-won` a sticky view opened on any WordCell (3-10) is closed by the Undo of the finish (wc 0, no `[data-view-sheet]` after Undo), so no view is open at the Redo; end-sheet.spec.ts 'AD-13 R-62 a win by Redo while a sticky WordCell view is open …' never reaches its view either.
- I3.l: title-only rename plus the comment extension (structural, MODAL_TOP); 5/5 desktop; mutation n/a (rename).
- I3.m: android ☰ row and desktop M-twice row 5/5; mutation Menu.svelte `focusMenuButton()` → `focusByPhase(view)` → both new focus checks fail. Reverted.
- I3.n: desktop row 5/5; mutation WordCellRow.svelte `tabindex` dropped for cell 3 → the new `toBeFocused` fails. Reverted.
- I3.o: android row 5/5. The plan's mutation (a `requestAnimationFrame` extra `open('menu')`) is already caught by HEAD's wc poll; with a 30 ms `setTimeout` instead the new row failed 3/3 (twice on the new later-frames `wcOf` check), HEAD's 1/3 (passed 2/3). Reverted.
- I3.p: desktop row 5/5 with both keydowns dispatched in one task on the focused element (a `document` target throws in the trackers' `target.closest`), 0 dialogs between them. The plan's mutation (drop open-menu.ts's `top === 'endSheet'` check) does not fail it: the second M waits in keys.ts's pending-pop waiter, whose re-`attempt()` is false over the menu. Used instead the keys.ts waiter mutation (run the row without `attempt()`): the new row fails 2/2 (no menu, AD-15), HEAD's two real presses pass 2/2 (the second lands after the settle, so HEAD never pinned the race). Reverted.
- I3.k: 5/5 (with the watchAdded self-test, 10 passed); mutation helpers `skipByPress` touch branch → `page.mouse.click` → the android half records `["mouse"]`, fails. Reverted.
- I3.q: win-guard.spec.ts `watchFor`/`__seen` removed, 4 calls now `watchAdded` (helpers/celebration.ts); the 4 win-guard rows, both projects, all speeds: 90/90 (`--repeat-each=5`). Self-test 5/5; mutations: drop `|| node.querySelector(selector)` → the wrapped marker reads false, fails; initial `seen[selector] = true` → the first false read fails. Reverted.

**Old → new test titles (renames; ids kept):**
- `src/ui/celebration/Celebration.test.ts`: `AD-19 every group is hidden, carries data-celebration and aria-hidden, and has no live-card attributes` → `AD-19 every group is hidden and carries data-celebration-group; each copy carries data-celebration and aria-hidden; no live-card attributes` (cited by the 10.9 plan :189, row 17).
- `src/ui/celebration/Celebration.test.ts`: `AD-19 SPEC F23 stacking: the copies carry no z-index of their own; the letter and badge sit in the top of the face, so a lower copy drawn above covers only the bottom` → `… so on rising and falling stretches a lower copy drawn above covers only the bottom` (cited by the 10.6 plan Tuning applied).
- `src/ui/end-sheet.test.ts`: `AD-3 the rows equal the stubbed view.wordList` → `AD-3 the rows equal the stubbed view.wordList, in its order (no UI re-sort)` (cited by the 10.9 plan :246).
- `src/ui/overlays.svelte.test.ts`: `AD-13 startCelebration with a tail selection throws with no state or nav change` → `AD-13 startCelebration with a tail selection with a hover peek throws with no state or nav change`; `… with the collapsed end sheet throws …` → `… with the collapsed end sheet with a hover peek throws …`.
- `src/ui/keys.test.ts`: `AD-13 with another suspending entry over the celebration Z and N do nothing` → `AD-13 with another suspending entry over the celebration Z, N and M do nothing`.
- `e2e/celebration.spec.ts`: `R-87 a mouse click on a non-empty WordCell hovered past the long-press time skips the run, consumed: no pointerdown, pointerup or click reaches the page, no hover peek, nothing activated, Session unchanged` → the same without `, no hover peek`.
- No rule-coverage.md row cites a renamed title (grep); no rule-coverage test was removed.

**Item 4:** variant C applied (`keep(g)` plain-write attachment, `{@attach keep(g)}` replaces `bind:this={elements[g]}`; no `svelte-ignore`). Capture (the Appendix B spec copied to `e2e/tmp-item4-capture.spec.ts`, deleted after; dev server, android, seam on, groups mounted): HEAD 12 console messages / **10 hits**; after the fix 2 messages / **0 hits**. `svelte-check` 0 errors 0 warnings; `e2e/celebration.spec.ts` green on both projects; the mid-run baseline: see Final.

**Item 6:** the guard test is committed in `src/ui/gestures/controller.test.ts` (beside the AD-14 hover-timer tracker test). Evidence runs (scratch, reverted): forwarding the press to the controller whatever the tracker did → the long-press `setTimer` is called; with no `startTracker` (no guard, the open runs at once) the press arms the timer and `advance(400)` throws `AD-13 openPeek while endSheet is the top entry`. Declined; `src/ui/end-sheet.ts` is not edited.

**Item 7:** applied DESIGN.md:753 (A-D12 accepted on device 2026-10-24, ticket 10.9) and epic References F1…F32, citing the digest's 10.9 done entry (DG:228). Proposals in Appendix B stay unapplied.

**Item 5 (flake evidence), at 767ed42:** `npx playwright test --project=android` three times, CI unset (retries 0), default 8 workers: 844 passed, 0 failed, 0 flaky, 225 skipped in each run (4.0 / 4.1 / 4.0 min). Named rows, failures/3: `R-87 a touch press on an empty band point …` 0/3; `R-87 a touch press on a non-empty WordCell …` 0/3; `R-87 a quick second tap on Replay this deal after a touch press skip …` 0/3; `R-87 a touch held on an empty band point from before the Confirm …` 0/3; nav.spec.ts `§2 AD-13 a double tap on New game on the rejected root opens the notice at wc 1` 0/3. No other test failed. Leave it.

**Item 10 (budgets), at 767ed42, clean tree (only this plan untracked):**
- `npm run build` → `total 559957 / 600000`: AD-18 margin **40043** (planning at 728b18a: 40040).
- `git diff --exit-code 19acd17 -- package.json package-lock.json` → empty, exit 0.
- `git diff 19acd17 -- src/engine/deal.test.ts | wc -l` → 0; `git diff --stat 19acd17 -- src/engine/session.ts src/engine/history.ts src/engine/serialize.ts` → empty; `SESSION_VERSION = 1`, `HISTORY_VERSION = 1`.
- `git diff --stat 728b18a -- fixtures/` → empty.
- Warm unit median on a fresh clone at 767ed42 under `~/` (ext4, `npm ci`): cold `npm test` 6.44 s (3609 passed); three warm `npx vitest run`: 4.23 / 4.38 / 4.32 s Vitest Duration (wall 4.87 / 5.01 / 4.93 s incl. npx start-up): **median 4.32 s**, under 5 s. Watch re-run < 1 s: not measured (no unattended `vitest` watch), declined as not a ticket pass condition.

**Final:**
- `npm run lint`: 0 warnings, 0 errors (342 files); HEAD's one warning (`es:845` noNonNullAssertion) is gone.
- `npm run test:all` at 767ed42: green (lint, check, unit 3609 passed, build `total 559957 / 600000`, `test:e2e:dist` 21 passed, `test:e2e` 1098 passed, `test:e2e:pwa` 17 passed).
- `npm run test:screens` (Docker, `mcr.microsoft.com/playwright:v1.63.0-noble`) at 767ed42: 67 passed, 39 skipped, including `AD-17 celebration mid-run frame at 360 px` (android); `git status --porcelain -- e2e/` empty afterwards (no `*-snapshots` change).

**Deviations from the plan (rule 7 note):** I3.c and I3.j were not committed (owner-call rows 40, 45, 110), as the Boundaries prescribe for a test that fails on correct code or cannot reach its case. Where a planned mutation did not isolate the new assertion (I3.f, I3.g, I3.h, I3.o, I3.p) a substitute mutation is recorded above; I2.i's second row needed a test-only hook in keys.test.ts's celebration mock. I3.p replaced the two `page.keyboard.press('m')` calls with one in-page task dispatching both keydowns on the focused element (the plan allowed replacing them).


## Plan Change Log

## Review Triage Log

### 2026-10-25 — Review pass
- verdicts: 24 findings — high 0, medium 0, low 20, false 4, maybe-false 0
- findings:
  - `[low]` `[patch]` blind-hunter: step.ts header "so a frame allocates nothing" contradicts the rewritten render comment (`step()` spreads state, maps groups) — narrowed to "finding a card's path time allocates nothing" (af1ed54).
  - `[low]` `[patch]` blind-hunter: item 6 guard test's `t.down` fallback is dead after `expect(stopPropagation).toHaveBeenCalled()`, so the timer/peek asserts cannot fail — reordered: `onDoc`, forward unless stopped, then assert; fails with motion.ts `consume` removed (af1ed54).
  - `[low]` `[patch]` blind-hunter: same test re-enacts the chain by hand and cites `end-sheet.ts:40-43` — line cite replaced by the branch name (af1ed54); the hand composition kept: flip.ts:331 install on every won play and the no-animation floor are pinned by flip.test.ts:1292-1320, and ticket item 6's decline path asks only for the repro test plus motion.ts `onEvent`.
  - `[low]` `[patch]` blind-hunter: desktop M-twice `between` dialog count is read before any microtask, so it holds whatever the code does — dropped; same-task dispatch and comment kept (the second keydown lands before the async pop settles); the keys.ts waiter mutation still fails the row (Implementation Notes I3.p) (af1ed54).
  - `[low]` `[patch]` blind-hunter: `watchAdded`/`observeAdded` doc says "added from now on" but seeds from `querySelector` (present-at-start reads true), now relied on by dist-smoke and win-guard — doc says "present when the watch starts or added later"; self-test asserts a present node reads true (af1ed54).
  - `[low]` `[patch]` blind-hunter: `paceOf` relaunches the reference on every call and the ≥ 1 bound recomputes every pace — paces computed once per scene and reused (af1ed54); suite stays under the 5 s budget (item 10).
  - `[low]` `[reject]` blind-hunter: fade tests repeat the finiteness block and do not assert the leader stays at its origin — cosmetic duplication; the finite check is the tune2 minor 5 point, and speed 0 means arc 0 by step.ts's definition (`speed` x elapsed); no everyday harm.
  - `[low]` `[reject]` blind-hunter: view.test tail half now has a one-move redo tail (was ≥ 2 by length only) — the 10-1 review's own default prescribed fewer Undos with a literal list; the redo tail stays excluded and the sort mutation now fails; a multi-move-only regression is not plausible in everyday change.
  - `[low]` `[patch]` blind-hunter: popstate counter has no 0 baseline before the finish and its comment claims an order it cannot see — `expect(pops()).toBe(0)` before `finishCelebration`; comment says the order follows from wc and `history.length` (af1ed54).
  - `[low]` `[reject]` blind-hunter: keys.test second-M title says "row"/"attempt() is false" and asserts `waiters` length — "row" is keys.ts's ROWS term; the outcome asserts (one `celebration.end`, top `menu`, depth 2) are present; title wording cosmetic.
  - `[low]` `[patch]` edge-case-hunter: dead `t.down` fallback makes the guard asserts vacuous — same root cause and fix as row 2 (af1ed54).
  - `[low]` `[patch]` edge-case-hunter: the comment claims the no-tracker throw though the test never runs that case — comment now says it was observed in the build's evidence run (Implementation Notes, item 6), not by this test (af1ed54).
  - `[low]` `[patch]` edge-case-hunter: `between === 0` cannot fail — same root cause and fix as row 4 (af1ed54).
  - `[low]` `[defer]` verification-gap: item 4's warning fix has no lasting check (restoring `bind:this` stays green) — the plan declined a lasting console assertion (dev-only warning, not a product rule); deferred to frontmatter.
  - `[low]` `[patch]` verification-gap: item 6 test dead code / vacuous asserts — same root cause and fix as row 2 (af1ed54).
  - `[low]` `[reject]` verification-gap: item 6 test re-enacts end-sheet.ts by hand — pieces covered by flip.test.ts :1298 and :1406 (the lens's own note); the ticket's decline path is met.
  - `[low]` `[reject]` intent-alignment: item 6 evidence drives motion.ts, not end-sheet.ts/flip.ts, and covers only reduced motion — the guard is installed by flip.ts:331 for every won play whatever the branch (reduced motion, hidden, seam off), so the consume property is branch-independent; ticket item 6 allows decline citing the test and `onEvent`; residual recorded as row 109.
  - `[low]` `[reject]` intent-alignment: F29 row uses synthetic same-task keydowns, not real presses — real presses never landed in the pending window (HEAD never pinned the race, Implementation Notes I3.p); keys.ts reads no `isTrusted`; the 10-9 minor 7 asked to pin the landing, which only a same-task dispatch does deterministically.
  - `[false]` `[reject]` intent-alignment: rapid-restart `elements` reset declined, `props()`/`running()` marked closed though listed — the dispositions carry evidence: App.svelte `{#key run}` remounts per run and Celebration.svelte registers `[]` on destroy (row 33); celebration.svelte.ts:93 `$state.raw` with its test :870 (row 34); item 2 is test-only, so a reset is out of its scope.
  - `[false]` `[reject]` intent-alignment: F23 stacking comments state an untested limit; renamed title promises less — the narrowed claim is the tune2 minor 3 probe's measurement (0.051 card units apart at a contact); narrowing an overclaim is item 1's purpose; assertions unchanged by design (comment/title-only).
  - `[low]` `[reject]` intent-alignment: no unit test pins `keep(g)` filling `elements` before `onMount` — Vitest runs `environment: 'node'` (no mount, declined in the ticket); celebration.spec.ts :343/:642 and dist-smoke's run fail if `register` got `[]` (verification-gap lens confirmed).
  - `[low]` `[reject]` intent-alignment: Appendix C reconciliation line said item 4's warning was not reproduced — fix edits this plan (rejected per triage rule); the stale planning-time sentence was corrected as bookkeeping while filling Appendix C.
  - `[false]` `[reject]` intent-alignment: dist-smoke imports `SWALLOW_MS` from `src/` and proves the skip by a window capture listener — e2e specs already import src constants (celebration.spec.ts:3); the listener is the 10-8 minor 4 default; not a defect.
  - `[false]` `[reject]` intent-alignment: I3.c history shape not delivered as a test — ticket item 3's own rule: a test failing at HEAD is not committed, owner-call row (row 40).

## Design Notes

- **Review-log items resolved here** (ticket review log Pass 5 open major, Pass 5 minors, Not-applied lists of passes 2-4):
  - Pass 5 open major (item 4 capture): the capture enables the seam (`enableCelebration` → `setEnabled(true)`) and waits for `[data-celebration-group]` count > 0. At HEAD it logged 10 hits; the seam-off control logged 0. So "already closed" does not apply, and the fix is needed.
  - P5 "other live ones": Appendix C uses four dispositions: fixed / closed by / declined / owner call. "Fixed here" is used only for findings items 1-7 name.
  - P5 split deferrals: rows 59/60/65 (10.4) and 56/58/67 (10.6) give one row per half.
  - P5 "no findings" none rows: rows 1-3 name their searches.
  - P5 failing e2e repeat: Boundaries (test-only fix, else owner call).
  - P5 item 7 wording: A-D12 is the owner verdict; the F-range is a mechanical sync. Both are applied, citing the digest 10.9 done entry.
  - P5 shape check: AC adds `session.ts` and `history.ts` to the 19acd17 diff. `serialize.ts` exists and is checked in Appendix B.
  - P5 item 8 redundancy: no action.
  - P5 item 6 rule wording: the decline cites the AD-13 throw as a bug (rule 6) and the guard evidence.
  - P5 history-shape location: I3.c at :900.
  - P5 non-reproducing repro: committed as a passing guard test and cited by row 59.
  - P5 16 px root: I3.b comment.
  - P5 "new or strengthened": Boundaries.
  - Passes 2-4, AGENTS.md watch re-run < 1 s: recorded in item 10. It is measured only if cheap on the clone (`vitest` watch is not run unattended); otherwise declined as not a ticket pass condition.
  - Passes 2-4, wave-stagger and test-hook locations: I1.j :41/:276 and I1.k :54-58.
  - Passes 2-4, console capture as a lasting e2e assertion: declined. A dev-only console warning is not a product rule, and the capture spec stays throwaway, recorded here.
  - Passes 2-4, other double-tap specs from 169c6bc: covered by the full android runs. Their failures, if any, get rows.
  - Passes 2-4, dist-smoke project config: I3.d-f command (build first).
  - Passes 2-4, old → new title map: a task.
  - Passes 2-4, measurement commit: recorded per measurement.
  - Passes 2-4, FALL_FRAC reference unpaced 1-card non-QU: I2.b asserts it.
  - Passes 2-4, CI unset / flaky = failure: matrix.
  - Passes 2-4, rule-coverage via the done plans' maps: renames keep ids, and no rule-coverage test is removed. The title map lists every rename a done plan cites (10.9 plan :189, :246).
- **Planning flags for the owner** (Appendix C):
  - Row 41: ticket item 8 lists opus GAVE_ROWS as closed, but the Undo-then-Give-up path (`e2e/end-sheet.spec.ts:944-946`) still asserts only `not.toEqual(WON_ROWS)`. Items 1-7 don't name it, so it is declined here and becomes a retrospective candidate.
  - Row 63: the digest's 10.9 done entry lists the AD-17 `doubleTap` sync as done; the spine lacks it. It stays a proposal.
  - Rows 12/79: live, but not named.
  - Item 6 residual: a press arriving after the guard floor but before its timer fires passes untracked after the sheet opened (motion.ts:342, :417-419). This is an owner-awareness row: unverified in a browser, and `cancelGesture()` would not close it.
- **Item 4 fix choice:** an attachment removes the binding. `$state([])` also silences the warning but adds a deep proxy for a dev check only, and `$state.raw` does not fix it (Appendix B table).
- **Doc proposals (old → new, not applied):** spine AD-17 Touch `doubleTap`, DESIGN.md:692, EXPERIENCE.md:414 and spine AD-19 :971 F32 note. The exact text is in Appendix B.

## Verification

**Commands:**
- `npm run lint` -- expected: 0 warnings.
- `npm test` -- expected: green; the new tests run.
- `npx playwright test <spec> --project=<p> -g "<title>" --repeat-each=5` -- expected: 5/5 for each changed e2e test (Appendix A).
- `npx playwright test --project=android` ×3 -- expected: 0/3 for the five named rows, with other failures recorded.
- `npm run build` -- expected: `total N / 600000`, N < 600000 (planning: 559960).
- `npm run test:all` -- expected: green at the final commit.
- `npm run test:screens` -- expected: green; `git status --porcelain` clean under `e2e/*-snapshots`.


## Appendix A: items 1-3 worklist (planning, HEAD 728b18a)


Conventions: line numbers are HEAD. Comments must stay at 100 columns or fewer (biome formatter). Titles keep their id prefix (AGENTS.md: shell/UI Vitest = AD-n, engine = R-n). "Mutation": apply it temporarily, run the named test, see it fail, revert (`git diff` empty afterwards). Renamed titles that a done plan's rule → test map cites (10.9 plan :189 `every group is hidden…`, :246 `the rows equal the stubbed…`) get an old → new line in this ticket's plan (pass 3 unapplied minor).

---

### Item 1 — stale comments and titles (comment/title-only diff)

**I1.a Celebration.test.ts:30 title**
- Source: 10.9 plan :315 stale names ("test title `AD-19 every group is hidden, carries data-celebration…` (the copies carry it)"); opus pass 2 item 2 moved `data-celebration` to the copies.
- Live: yes. :30 title says groups carry data-celebration; the body (:36-45) asserts 5 copies carry it and groups carry `data-celebration-group`.
- New title: `'AD-19 every group is hidden and carries data-celebration-group; each copy carries data-celebration and aria-hidden; no live-card attributes'` (AD-19 Rule bullet 4: "each copy carries `data-celebration` and `aria-hidden`"). Item 2's I2.c changes the same test's body.

**I1.b interruptions.ts:5-7**
- Source: 10.9 plan :316 ("`interruptions.ts` ("pending the owner's rule 7 nod", settled by F28)").
- Live: yes, :6 "pending the owner's rule 7 nod (ticket 10.7 Hide)". SPEC F28 (SPEC.md:116) and AD-19 Hide (spine :968) now say it.
- New text (replace `The plain \`end()\` departs … (ticket 10.7\n// Hide);`): `The plain \`end()\` is AD-19 Hide as amended by SPEC F28: the ordinary end, which also pops the entry;` (the rest of the sentence, "`done` (end-sheet.ts) defers…", stays).

**I1.c step.ts:2-5 "still say entry index"**
- Source: 10.9 plan :316 ("`step.ts` (spine wording)"); opus pass 3 item 2.
- Live: yes, :4 "(AD-19 Rule bullet 1 and SPEC CAP-2/F3 still say "entry index", see the 10.3 plan's Plan Change Log)". At HEAD SPEC F3 (SPEC.md:91) reads "entry index, the launch origin and the band size", CAP-2 (:33) "the entry index, the launch origin and the band size", AD-19 Rule bullet 1 (spine :966) "Launch time derives from the entry index …, side and drift from the launch origin and the band width".
- New text for :3-5: `// derives from the entry index; side and horizontal speed derive from the entry index, the launch\n// origin and the band size (AD-19 Rule bullet 1, SPEC CAP-2 and F3, amended 2026-10-23).`

**I1.d celebration.svelte.ts:1-2 "hide follows (entry 7)"**
- Source: 10-7-build.md unapplied minor 6 ("stale; name interruptions.ts (hide, resize, orientationchange) and open-menu.ts (☰/`M`) as the entry-7 `end()` callers").
- Live: yes, :2.
- New text :1-2: `// AD-19 (R-87): the win celebration's run controller, the only owner of the run data. App.svelte\n// mounts its run and end-sheet.ts starts it (entry 5); skip.ts ends it on a skip (entry 6);\n// interruptions.ts (hide, resize, orientationchange; AD-19 Hide, SPEC F28) and open-menu.ts (☰/\`M\`,\n// SPEC F13) call \`end()\` (entry 7).` (rewrap the following lines as needed).

**I1.e step.ts:28-29 and step.test.ts:585-587 "F25's 10 %"**
- Source: 10-6-tune2.md minor 1 ("SPEC F25 has no 10 %; the threshold is the plan's fourth-read tuning note (`story-celebration-skip-plan.md:181`). Cite that instead").
- Live: yes. step.ts:29 "(more than F25's 10 %)"; step.test.ts:586 "more than F25's 10 %". SPEC F25 (SPEC.md:113) has no 10 %; the 10 % is in story-celebration-skip-plan.md:181 ("one speed per word since per-lap speeds differ by more than 10 %").
- New step.ts:28-29: `// as long as the path did. One speed per word, not per lap (SPEC F25): the last partial lap to the\n// exit differs from the first lap by up to 1.14 x on the portrait fixture, over the 10 % per-lap\n// spread the ticket 10.6 fourth device read allowed (10.6 plan, Tuning applied).`
- New step.test.ts:585-587 comment: `// Measured 2026-10-24 (SPEC F27): the last partial lap's speed differs from the first lap's by\n// up to 1.136 x, over the 10 % per-lap spread of ticket 10.6's fourth device read (SPEC F25: one\n// speed per word); full laps run within 7.1 % of the path's.` Literals :588-589 unchanged (AC 2).

**I1.f tune2 minor 3 code sites (stacking claim)**
- Source: 10-6-tune2.md minor 3 ("at apexes and floor contacts neighbours sit side by side or nearly coincide (probe: 0.051 card units apart at a contact…), so the copy above covers the other's letter/badge there. Narrow the claim to rising and falling stretches").
- Live: yes, four sites:
  - step.ts:16-17 "so a card never hides the letter of the card above it." → `gets 0.65 card heights: on a rising or falling stretch a card covers only the bottom of the card\n// above it; near a floor contact or an apex, where neighbours nearly coincide or sit side by side,\n// it can cover the other's letter (SPEC F23 stacking).`
  - step.ts:395-399 (`stackOrder` doc) "so a card only ever covers the bottom of the card above it, never its letter or badge" → `the card lower on screen is drawn above, so on rising and falling stretches it covers only the\n * bottom of the card above it (near a floor contact or an apex it can cover that card's letter or\n * badge); equal y keeps …` (rest unchanged).
  - Celebration.test.ts:113 title → `'AD-19 SPEC F23 stacking: the copies carry no z-index of their own; the letter and badge sit in the top of the face, so on rising and falling stretches a lower copy drawn above covers only the bottom'`.
  - Celebration.test.ts:120-122 comment → `// The glyph fills the top 72 % (its letter centred at 36 %), the QU badge the top 13 px: on a\n// rising or falling stretch a copy drawn above sits lower and misses both (SPEC F23 stacking); near a\n// floor contact or an apex neighbours nearly coincide or sit side by side, and it can cover them.`
- (epic Notes line is a doc: excluded, ticket "code sites".)

**I1.g tune2 minor 4 code site (contact count)**
- Source: 10-6-tune2.md minor 4 ("the code rounds the contact count, not the hop … Reword to what the code does (hops 0.81–1.30 x the target, as the F27 test pins)").
- Live: yes, step.ts:245-246 "the count that makes a hop nearest the slot's target"; code :293 `Math.round(lead / hop + 1 - EXIT_PHASE - contactMs / periodMs)`; test step.test.ts:762-768 pins 0.8 < hop/target < 1.31.
- New text :244-246: `… after \`contacts\`\n * floor contacts: the fractional count at the slot's target hop, rounded, so a hop is 0.8 to 1.3 x\n * the target on the real layouts (SPEC F27; the contacts test pins it). The drift is also fitted`. (Contact-count rewrite declined, ticket item 9.)

**I1.h celebration.svelte.ts:123-124 "a frame allocates only…"**
- Source: 10-6-tune2.md minor 2 ("overstates: each frame also allocates the rAF closure, `step()`'s state spread, `groups.map`/`every` closures, `String(group.opacity)` and, in the closing fade, `{ ...group }`"); rAF hoist declined (ticket item 1).
- Live: yes, :123-124. render loop allocates the transform template strings (:153), `String(k)` z-index (:168) and `String(group.opacity)` (:170); `frame()` (:206-214) allocates the rAF arrow; `step()` (step.ts:427-432) spreads state, maps groups, `every` closure; `advance` (step.ts:423) spreads a changed group.
- New text: `// Index loops: this render allocates only each shown copy's transform string, a changed z-index's\n// string and each shown group's opacity string; the rest of a frame's allocation is the rAF\n// callback and AD-19's \`step(state) → state\` (a new state and groups array, a changed group's copy).`

**I1.i skip.ts:8-16 header**
- Source: 10-6-build.md pass 4 minors 1-2: (1) ":12-16 — the repeat-Space enumeration omits a plain Space held from before the start (also prevented)"; (2) ":8-10 — "keys.ts sees a prevented key" is wrong for a skipping key (stopped in document capture; keys.ts listens on window bubble); only the non-skipping Space keydowns reach it, prevented."
- Live: yes. Code skip.ts:219-222 prevents every Space with `e.repeat || chord || e.shiftKey` (a plain held repeat included); keys.ts:598 `installKeys(window)` bubble (main.ts:255); skip consumes via `stopPropagation` at document capture (:64).
- New text :8-16: `// F17). A skip is \`stopPropagation()\` + \`preventDefault()\`, then \`cancelGesture()\` (a press held\n// from before the start, the controller's hover-peek upkeep) and \`end()\`: stopped in document\n// capture, the skipping input reaches neither the bubble-phase pointer controller nor keys.ts (a\n// window bubble listener). Only the skipping input is consumed: a pointer held from before the start\n// never is (its \`pointerup\` is not the run's), and a finish or the cap consumes nothing. Every other\n// \`Space\` keydown of the run, a chorded one (Shift, Ctrl, Meta or Alt) or a repeat (a plain \`Space\`\n// held from before the start, a chord held past the repeat delay, or one whose modifier was\n// released), does not skip but is \`preventDefault()\`ed only: it reaches keys.ts prevented and never\n// activates a focused button (SPEC F17; preventing the keydowns is enough in Chromium, the keyup\n// then clicks nothing).`

**I1.j wave-stagger comment (step.ts:41, :276)**
- Source: opus-review-epic-10.md pass 1 minor 1 ("`floor(i/3)·g + (i%3)·g/3` equals `i·g/3`: the "waves" are an even stagger with per-slot speed variety; … state it in the comment"); rewrite declined (ticket item 9).
- Live: yes. :41 "Groups per wave; later waves launch later, in list order."; :276 `Math.floor(i / WAVE_SIZE) * waveGap + (slot * waveGap) / WAVE_SIZE` = `i * waveGap / WAVE_SIZE`.
- New :41: `/** Wave-slot count: launches are an even stagger, entry i at i x waveGap / WAVE_SIZE, so waves\n * overlap in list order (SPEC F6); a group's slot (i % WAVE_SIZE) sets its speed variety. */`. Optionally one line above :276: `// An even stagger: i x waveGap / WAVE_SIZE (SPEC F6).`

**I1.k test-hook.ts `advance` invariant (:54-58)**
- Source: 10-5-build.md minor 5 ("on a real-rAF run the controller's `advance` returns silently; unreachable today (`setEnabled` always pairs with `setManual`); record that invariant in the header comment").
- Live: yes. test-hook.ts:63-64 `setEnabled` calls `setManual(on)`; controller celebration.svelte.ts:332 returns silently when `!current.manual`; no comment says so.
- New comment above :54 (or appended to header :4-6): `// \`setEnabled\` always sets the manual clock with the flag, so a run the hook can see runs on the\n// manual clock; the controller's silent \`advance\` on a real-rAF run is unreachable here (AD-17\n// Celebration seam).`

---

### Item 2 — unit-test tightening (test-only)

**I2.a step.test.ts:808-847 closing-fade tests with `vx: 0`**
- Source: 10-6-tune2.md minor 5 ("`vx: 0` makes the card-unit arc 0 x asinh(u/0) = NaN, so cardX/cardY are NaN and the group stays unexited only because NaN comparisons are false. Default: keep the launched vx … (or patch `speed: 0`) and assert finite positions").
- Live: yes, `withGroup(…, { launchMs: 0, vx: 0 })` at :810, :819, :836; drift 0 → step.ts:153 `asinh(u / 0)` → NaN.
- Change: patch `{ launchMs: 0, speed: 0 }` instead (leader arc stays 0 → `pathMs` 0 → card at its origin, finite; never exits). Add in each: `for (const j of cards(first(s))) expect([j, Number.isFinite(card(s, first(s), j).x), Number.isFinite(card(s, first(s), j).y)]).toEqual([j, true, true]);`. Comment :809 → "(speed 0: the leader stays at its launch point)". Titles unchanged.
- Mutations: (a) test-setup: restore `vx: 0` → the new finite check fails; (b) code: step.ts:421 `/ state.baseMs` → `/ (2 * state.baseMs)` → the Fast/Slow fade tests fail (still live). Record (a) as the review's point.
- Risk: none expected.

**I2.b step.test.ts:64-67 `paceOf` FALL_FRAC literal + no pace ≥ 1 bound**
- Source: 10-6-tune.md pass 2 minors 1-2 ("copies step.ts's `FALL_FRAC` 0.2 as a literal; a retune raising FALL_FRAC under-reports pace (default: … take the reference gravity from a 1-letter group in the same band and cap)"; "no lower bound: removing `Math.max(1, …)` from `pace` leaves every step test green"). Review log pass 4/5: reference group asserted unpaced, 1-card non-QU; no export.
- Live: literal yes (:67 `0.2 * s.capMs`). Lower bound: effectively closed at HEAD by the PACES pins (:1086-1110, many `1`s at 3 digits) and :1166 `expect(paceOf(s, relaxed)).toBe(1)`, which fail without `Math.max(1, …)`; still add the explicit bound.
- Change: replace `paceOf` with a reference-gravity form: `const unpacedGravity = (s) => { const ref = launch({ ...BASE, groups: [{ x: (s.walls.left + s.walls.right) / 2, y: (s.ceiling + s.floor) / 2, letters: 1 }], floor: s.floor, ceiling: s.ceiling, walls: s.walls, capMs: s.capMs, baseMs: s.baseMs }); const g = first(ref); /* unpaced: its one card is out strictly before the fit deadline cap − baseMs (SPEC F22) */ expect(exitOf(ref, g)).toBeLessThan(s.capMs - s.baseMs - 1); return g.gravity; }; const paceOf = (s, g) => Math.sqrt(g.gravity / unpacedGravity(s));` (exitOf = the bisection already at :562-567, hoisted as a helper; 1 card, so no trail; `letters` is a card count, so QU does not arise: comment it). In the PACES test (:1112-1123) add `expect(s.groups.every((g) => paceOf(s, g) >= 1 - 1e-9)).toBe(true);`.
- Mutations: (a) step.ts:312 `Math.max(1, outMs / …)` → `outMs / …`: the reference is then fitted to exit exactly at cap − baseMs, so the new unpaced assertion fails (and the ≥ 1 bound, PACES pins); (b) robustness record: step.ts:39 `FALL_FRAC = 0.2` → `0.25` — HEAD `paceOf` reads ≈ 0.8 for unpaced groups (false failures at :1166); the new one reads 1. Record both; only (a) is the pass mutation.
- Risk: the reference must really be unpaced at every scene used (portrait/desktop/landscape, Normal); if the exit assertion fails at HEAD for one geometry, move the reference origin (e.g. nearer its far wall is worse; centre-of-band origin is best) — else owner-call row.

**I2.c Celebration.test.ts:47 `includes('opacity: 0')`**
- Source: 10-3-build.md pass 2 minor 3 ("`opacity: 0` substring also matches `opacity: 0.5`; use `/opacity: 0(;|")/`").
- Live: yes, :47. (The F20/F26 test :101 already pins `'opacity: 0;'` for a single group, so the suite catches it once; :30 itself does not.)
- Change: `t.includes('opacity: 0')` → `/opacity: 0(;|")/.test(t)` in the I1.a test.
- Mutation: Celebration.svelte:60 `style:opacity="0"` → `"0.5"` → the I1.a test fails (and :101).

**I2.d QU boundary in celebration.svelte.test.ts `viewOf` (:139-148)**
- Source: opus pass 1 minor 5 ("entries always have `letterCount === cards.length`; no QU case pins that the controller sizes rows by `cards.length`").
- Live: yes, `viewOf` sets `letterCount: letters` and `letters` cards.
- New test: `'AD-19 a QU entry is sized by its cards, not its letterCount: letterCount 24 over 23 cards gives 23 copies at the 23-card row scale'` — a view with one entry `{ letterCount: 24, cards: 23 ids, cell: 3 }`; capture the launched state via `mocked.relaunch = (s) => (seen = s)`; assert `c.props()?.groups[0]` length 23, `seen.groups[0].cards === 23`, `seen.groups[0].scale === rowScale(23, 40, 360)` and `!== rowScale(24, 40, 360)`; `c.register(asEls(fakeEls(1, 23)))`, `c.advance`… (or a stub-rAF `tick`) renders without throwing.
- Mutation: celebration.svelte.ts:262 `letters: entry.cards.length` → `letters: entry.letterCount` → cards 24 / scale differs; render throws "23 faces for 24 cards".

**I2.e gaveUp word list ≥ 3 words, tie and duplicate (view.test.ts R-86)**
- Source: 10-1-build.md unapplied minor 2 ("add a gaveUp case with >=3 committed words of different lengths plus a tie, asserting the sorted list (ordering only tested on won sessions)"); ticket adds a duplicate.
- Live: yes; gaveUp cases at :1087, :1114, :1134 assert no ≥ 3-word order.
- New test (in `describe('R-86 word list')`): `'R-86 a gaveUp list orders as a won one: letter count descending, a tie alphabetical, a duplicate in move order'`. EN has A3, N3, T3, E4 (en.ts), so: `start = startOf(['TEA', 'ORES', 'ANT', 'TEA', 'XYZ'])`; `seam(start, [...whole(1, 3), ...whole(2, 4), ...whole(3, 3), ...whole(4, 3), GIVE_UP], ['tea', 'ores', 'ant'])`; `expect(status).toBe('gaveUp')`; `expect(wordList).toStrictEqual([{ spelling: 'ores', letterCount: 4, cards: start.columns[1], cell: 4 }, { 'ant', 3, columns[2], cell 3 }, { 'tea', 3, columns[0], 3 }, { 'tea', 3, columns[3], 3 }])` (move order tea, ores, ant, tea).
- Mutation: view.ts:290-294 comparator → `(a, b) => current !== 'won' ? 0 : (…existing…)` → list stays in move order; fails.
- Risk: default target cell = letter count as in :1041-1046; if startOf/DICT rejects a word, pick other letters within EN counts.

**I2.f `start()` fail-fast throws (celebration.svelte.test.ts)**
- Source: 10-3-build.md pass 2 minor 2 ("start() fail-fast throws (missing topBar/actionBar/board band, --wc-w unreadable) untested besides the wordcell-<n> one").
- Live: yes, only :219 (`wordcell-4`).
- New test (parametrised, beside :219): `` `AD-19 start throws with ${name} and leaves no run active` `` for rows: no top bar (`present.delete('topBar')` → `/data-band="topBar"/`, visible-band.ts:28), no action bar (`/actionBar/`), no `.board-root` (`present.delete('board')` → `/\.board-root missing/`), `--wc-w` unreadable (`vi.stubGlobal('getComputedStyle', () => ({ getPropertyValue: () => '' }))` → `/--wc-w missing/`). Each: `running()` false, `frames.size` 0, `listening.size` 0 (skip not attached).
- Mutation: delete celebration.svelte.ts:255 (`if (!(cardW > 0)) throw …`) → the `--wc-w` row fails (start proceeds).

**I2.g hoverPeek ILLEGAL rows (overlays.svelte.test.ts:851-866)**
- Source: 10-4-build.md pass 2 minor 1 ("assert `o.hoverPeek` is 6 after `openHoverPeek(6)` (guards against the arrangement silently no-op'ing) and name the rows "… with a hover peek"").
- Live: yes, rows 'a tail selection' (:852) and 'the collapsed end sheet' (:860) never assert the peek opened.
- Change: rename rows `'a tail selection with a hover peek'`, `'the collapsed end sheet with a hover peek'` (test titles become `AD-13 startCelebration with … with a hover peek throws with no state or nav change`); after `o.openHoverPeek(6)` add `expect(o.hoverPeek).toBe(6);`.
- Mutation: overlays.svelte.ts:246 `if (peek !== null || viewCell !== null) return;` → add `|| selection !== null` (and for the second row `|| endSheet !== 'hidden'`) → the new expect fails; HEAD rows pass vacuously. (The original fix mutation, moving :340 `hoverPeek = null` above the throws, still fails them.)

**I2.h two-run row (attached.test.ts)**
- Source: 10-4-build.md pass 2 minor 3 ("no two-run row proving a later run's back/Esc takes its own live `done`, not a stale `pending` (dropping `pending = null` in `removed()` passes every test)").
- Live: yes (no such row in attached.test.ts; list at :188-333).
- New test: `'AD-19 a later run's back takes its own done: run 1 ends by end() and its done runs once; run 2 ends by closedByBack and only run 2's done runs, once'` (run 1 `end()` → flush → done1 ×1, sheet opened; close/collapse back to a startable state per the file's helpers; run 2 `startCelebration()`+`start(view, done2)` → `overlays.closedByBack(depth)` → flush → done1 still ×1, done2 ×1).
- Mutation: delete celebration.svelte.ts:193 `pending = null;` → run 2's removal takes stale done1; fails.

**I2.i keys.test.ts `M` rows (10-7)**
- Source: 10-7-build.md minors 1-2: (1) "'AD-13 with another suspending entry over the celebration Z and N do nothing' — add `expect(press('m')).toBe(false)` … rename '… Z, N and M do nothing'"; (2) "no case for a second `M` arriving before the settle … add one with the nav mock unsettled: `celebration.end` logged once, the second press runs no row".
- Live: yes, :1531-1537 (no `m`); no pending-pop `M` case.
- Changes: (1) rename to `'AD-13 with another suspending entry over the celebration Z, N and M do nothing'`, add `expect(press('m')).toBe(false)` before the log check. (2) new `'AD-13 a second M before the settle runs no row: celebration.end once, the second press waits on the pending pop and attempt() is false over the menu'` — `celebrate(); mocks.pending = true` (or as the mocked `celebration.end` leaves the pop pending), `press('m')`, `press('m')`, `settle()`; assert `ACTED(mocks.log)` holds one `'celebration.end'` and no second menu row.
- Mutations: (1) keys.ts:538 append `&& id !== 'menu'` to the return-false condition → M acts under historyNotice; new assert fails. (2) keys.ts:586-589 waiter: call the row without the re-`attempt()` (e.g. replace `void attempt(id, again.ctx)` with a direct run of the `menu` row) → second M acts; fails. Implementer confirms mock names (`mocks.pending`, `settle`, `ACTED`) at keys.test.ts:7-121.
- Risk: (2) depends on how the keys.test mock of open-menu.ts logs; if the second M is already blocked before keys.ts (mock artefact), say so and pick the mutation that reaches it.

**I2.j end-sheet.test.ts:395 stub already in engine order**
- Source: opus pass 3 minor 3 ("the stub list is already in engine order, so a UI re-sort (AD-3 re-derivation) passes").
- Live: yes, :398-401 baked:5 then cat:1.
- Change: swap the stub to `[{ cat, 1 }, { baked, 5 }]`, flip :410 to `html.indexOf('CAT') < html.indexOf('BAKED')`; title → `'AD-3 the rows equal the stubbed view.wordList, in its order (no UI re-sort)'`.
- Mutation: EndSheet.svelte:72 `return v.wordList;` → `return [...v.wordList].sort((a, b) => b.letterCount - a.letterCount);` → fails.

**I2.k view.test.ts:1144-1153 tail half asserts only the length**
- Source: 10-1-build.md pass 2 triage + unapplied minor 1 ("use fewer UNDOs so cursor lands on a known non-zero index and assert the literal list (e.g. ['tan:3']) and cursor").
- Live: yes, :1153 `toHaveLength(kept)` (kept is 0 or 1 at HEAD per :1150).
- Change: `startOf(['TAN', 'ONES', 'BAKED'])`, `[...whole(1, 3), ...whole(2, 4), ...whole(3, 5), UNDO × n, GIVE_UP]` with n chosen so `tail.cursor` is `{ index: 2, phase: 'idle' }` and `tail.moves` length 3; assert both literally and `brief(list)` `toStrictEqual(['ones:4', 'tan:3'])`. Title unchanged.
- Mutation: view.ts:292 `b.letterCount - a.letterCount` → `a.letterCount - b.letterCount` → ['tan:3','ones:4']; the HEAD length-only check passes, the new one fails.

**I2.l 10-5 minor 3: end-sheet.test.ts hidden `done` re-check**
- Source: 10-5-build.md minor 3 ("the hidden `done` branch's `status === 'won'` re-check is never exercised; add variants that set `store.view` to playing/undefined (and one that cancels the token) before `whenVisible` resolves, asserting nothing opens").
- Live: yes, only :324 'AD-19 done on a hidden page opens nothing until whenVisible resolves, then expanded with no announce'.
- New (parametrised beside :324): `` `AD-19 done on a hidden page opens nothing when ${name} before whenVisible resolves` `` for `store.view = { status: 'playing' }`, `store.view = undefined`, and the token cancelled (`overlays.onUnfinished()` or `resetForNewSession()`): resolve the whenVisible resolver; `overlays.endSheet` stays `'hidden'`, no announce.
- Mutation: end-sheet.ts:58 drop `if (game.view?.status === 'won')` → playing/undefined variants open; fail. (The token variant is guarded inside `openDeferred`; record that no end-sheet.ts mutation reaches it.)

**I2.m 10-3-build.md pass 1 minors not applied**
- (a) `start()` does not reset `elements` on rapid restart: live in code (celebration.svelte.ts:233-303 never touches `elements`), unreachable: App.svelte:124-132 `{#if run}{#key run}` remounts per run and Celebration.svelte:38-41 registers `[]` on destroy. Disposition: declined (unreachable; a reset is a code change outside item 2's test-only scope).
- (b) plain-`let` `props()`/`running()`: closed by opus pass 1 item 11 (celebration.svelte.ts:93 `$state.raw`; test celebration.svelte.test.ts:870).
- (c) no client mount test: declined (vite.config.ts `environment: 'node'`, ticket).
- (d) measurement into `src/ui/layout/`: declined (ticket).

---

### Item 3 — e2e tightening and lint (test-only)

Projects: `playwright.config.ts` → `android` (Pixel 7) and `desktop` (Desktop Chrome), dev server :5173; describes gate with `onAndroid`/`onDesktop` (e2e/helpers/project.ts). `helpers.spec.ts` runs on android only (:91). `e2e/pwa/dist-smoke.spec.ts` runs in `dist-smoke` (playwright.pwa.config.ts, `PW_PREVIEW=dist`, needs `npm run build` first; a src mutation needs a rebuild, a test/helper mutation does not). CI unset → retries 0.

**Lint at HEAD** (`npx biome check .`, 342 files): exactly 1 warning — `e2e/end-sheet.spec.ts:845:14 lint/style/noNonNullAssertion` (`(await item.boundingBox())!.height`). No other warnings or errors.

**I3.a end-sheet.spec.ts:845 lint**
- Change (rule 6, no `?.` silent path): `const box = await item.boundingBox(); if (box === null) throw new Error('R-88 Words row has no box'); expect(box.height).toBeGreaterThanOrEqual(44);`.
- Pass: `npm run lint` 0 warnings. Test: `npx playwright test e2e/end-sheet.spec.ts --project=android -g "R-88 the section scrolls with the sheet" --repeat-each=5`.

**I3.b end-sheet.spec.ts:853 `wordSize >= 14` weak bound + 3-letter row**
- Source: 10-2-build.md pass 2 minor 2 ("add <= 16 and a 3-letter row at 16px"); 16 px assumes Playwright's default 16 px root (`.word` clamps to 1rem, EndSheet.svelte:273).
- Live: yes, :853 lower bound only.
- Change: add `expect(wordSize).toBeLessThanOrEqual(16);` after :853. New android-words test `'R-88 a 3-letter word keeps the 16 px body size on one line at 360 px'`: viewport 360x740, `openFixture(page, 'session-won-long-words', { endSheet: 'expanded' })` (LONG_WORDS' last row is 3 cards, step.test.ts:1033), `const row = page.getByRole('listitem', { name: /, 3 letters$/ }).first()`, font-size of `.word` `toBe(16)`, one line (range rects as :874-879). Comment the 16 px root assumption.
- Mutation: EndSheet.svelte:273 clamp max `1rem` → `1.125rem` → 3-letter row 18 px and the 10-letter row > 16; both fail.
- Risk: a word under 14 px or wrapping above it → owner call (ticket). `-g "R-88 a 3-letter word keeps"` / `-g "R-88 the section scrolls"`, `--project=android --repeat-each=5`.

**I3.c end-sheet.spec.ts:900 history-shape check**
- Source: opus pass 5 minor ("`before` is taken after boot's reconcile, so a history record that grew … would pass; assert the stored `wordcell:history` record has exactly the six AD-6 keys and HISTORY_VERSION"); now :900-916.
- Live: yes, :904 `before` read after boot; only equality checked.
- Change: after :906 parse `wordcell:history` from `before`: `const scoreHistory = JSON.parse(stored) as { version: number; records: Record<string, unknown>[] }`; `expect(Object.keys(scoreHistory).sort()).toEqual(['records', 'version'])`, `expect(scoreHistory.version).toBe(1)`; the won record: `Object.keys(r).sort()` `toEqual(['activeMs', 'finalScore', 'longestWord', 'outcome', 'seed', 'version'])` (AD-6 spine :271-273), `r.version` 1 (HISTORY_VERSION, Q-43; e2e literal with a comment). Avoid naming a binding `history`.
- Mutation: src/engine/history.ts `gameRecord` add a field (e.g. `words: 1`) to the returned record → HEAD test passes, new fails (dev server, no rebuild).
- Command: `npx playwright test e2e/end-sheet.spec.ts --project=android -g "R-88 scrolling, collapsing and expanding leave localStorage untouched" --repeat-each=5`.

**I3.d dist-smoke.spec.ts:76 tautological `added()` + no absence before Confirm (10-8 minor 1)**
- Source: 10-8-build.md minor 1 ("tautological once the groups poll passed … nothing asserts the root absent before the Confirm. Default: `toHaveCount(0)` (or `added()` false) before the Confirm click").
- Live: yes, :71-76.
- Change: before :72's click: `await expect(page.locator(ROOT)).toHaveCount(0); expect(await added()).toBe(false);`. Keep :76.
- Mutation: e2e/helpers/celebration.ts:98 `seen[selector] = document.querySelector(selector) !== null;` → `= true;` → HEAD passes, new `false` check fails (no rebuild).

**I3.e dist-smoke (a)/(b) `networkidle` resolves at once (10-8 minor 3)**
- Source: 10-8-build.md minor 3 ("the AD-15 error check does not wait past the press skip's post-run tail (skip.ts click swallower, 300 ms). Default: in (a) wait ~400 ms in-page before `expect(errors)`, with a comment").
- Live: yes, :117 and :133.
- Change in test (a) (:108-119): before :118 `await page.evaluate((ms) => new Promise((r) => setTimeout(r, ms)), SWALLOW_MS + 100);` (import `SWALLOW_MS` from `../../src/ui/gestures/click-swallow`, as celebration.spec.ts:3) with a comment citing AD-19 Skip / SPEC F18 tail.
- Mutation: src/ui/celebration/skip.ts guard-expiry timer callback: add `throw new Error('mutation')`; `npm run build`; (a) at HEAD passes, new fails. Revert and rebuild.

**I3.f dist-smoke (a) natural finish before the press (10-8 minor 4)**
- Source: 10-8-build.md minor 4 ("a natural finish in that window … would still pass. Default: a page-side capture-phase `pointerdown` listener recording that `[data-celebration-root]` was present at the press, asserted after the skip").
- Live: yes.
- Change: before `skipByPress` in (a): `await page.evaluate(() => window.addEventListener('pointerdown', () => { (window as unknown as { __rootAtPress?: boolean }).__rootAtPress ??= document.querySelector('[data-celebration-root]') !== null; }, { capture: true }));` — on **window** capture (runs before skip.ts's document-capture listener; on document a microtask between listeners can unmount the root first). After the sheet: expect `__rootAtPress` true. No `__wordcell` name (AD-18).
- Mutation: e2e/helpers/celebration.ts between :81 boundingBox and :85 tap insert `await page.waitForTimeout(6000);` → natural finish (≈ 5.8 s), new check false; fails.
- Command (I3.d-f): `npm run build && PW_PREVIEW=dist npx playwright test -c playwright.pwa.config.ts --project dist-smoke dist-smoke.spec.ts -g "R-87 hook-free build" --repeat-each=5` (2 tests × 5).

**I3.g celebration.spec.ts:141 `stepUntilShown` true for a childless group**
- Source: 10-6-tune.md pass 2 minor 4 ("`firstElementChild?.style.transform !== ''` is true for a group with no child (default: require the child non-null)").
- Live: yes, :149-152.
- Change: `const first = g.firstElementChild as HTMLElement | null; return Number(getComputedStyle(g).opacity) > 0 && first !== null && first.style.transform !== '';`.
- Mutation (two files): Celebration.svelte:63 `{#each faces as face, i (i)}` → `{#each faces.slice(0, 0) as face, i (i)}` and drop celebration.svelte.ts:140-142 (faces-count throw) → childless groups, HEAD helper returns 0, fixed returns −1; :325/:624 fail.
- Command: `npx playwright test e2e/celebration.spec.ts --project=android -g "R-87 the copies: 55 face copies|R-87 a Redo that restores the win plays it again" --repeat-each=5`.

**I3.h 10-5 minor 1: popstate counter on the run row (:211)**
- Source: 10-5-build.md minor 1 ("the wc/`history.length` proof cannot tell pop-then-push from no nav activity … add a page-side `popstate` counter that rises by exactly 1 before the sheet opens").
- Live: yes, :218-225.
- Change: after `winIntoRun`, install `window.addEventListener('popstate', () => w.__pops++)` (counter 0); after `finishCelebration`, `expect(pops).toBe(1)`; after `animationFrames(page, 3)` still 1.
- Mutation: overlays.svelte.ts `close('celebration')` path for the run's end: skip the nav pop (and :341 `push('celebration')` without nav push) → no popstate; new fails, HEAD's wc/length checks pass.
- Command: `npx playwright test e2e/celebration.spec.ts --project=android -g "R-87 a win plays the celebration with the sheet hidden" --repeat-each=5`.

**I3.i 10-5 minor 2: collapsed bar absent while running (:211, :238)**
- Source: 10-5-build.md minor 2 ("checks only the expanded dialog; also assert the collapsed bar is absent while `running()`").
- Live: yes (:219, :244 sheet only).
- Change: add `await expect(collapsedBar(page)).toHaveCount(0);` (helper :170; move its const above :208 if needed) beside :219 and :244.
- Mutation: Tray.svelte:99 `overlays.endSheet === 'collapsed'` → `(overlays.endSheet === 'collapsed' || overlays.top === 'celebration')` → bar mid-run; fails.
- Command: `-g "R-87 a win plays the celebration with the sheet hidden|R-87 at Slow the run still runs after the Fast cap" --project=android --repeat-each=5`.

**I3.j 10-5 minor 4: R-87 variant of the Redo-with-sticky-view row**
- Source: 10-5-build.md minor 4 ("no R-87 variant of end-sheet.spec.ts:350 (win by Redo with a sticky WordCell view open) with the celebration enabled; assert the view closes, `running()`, then wc 1 and the sheet expanded after `finishCelebration`").
- Live: yes (no such row in celebration.spec.ts).
- New android row: `'R-87 a win by Redo while a sticky WordCell view is open closes the view and plays the celebration; its end opens the sheet expanded at wc 1'` — as end-sheet.spec.ts:350-367 (`openFixture(page, 'session-won')`, tap wordcell-6, view visible, wc 1, Undo/Redo by `dispatchEvent('click')`, `glidesSettled`) with `enableCelebration(page)` after open; then `[data-view-sheet]` count 0, `running()` true, wc 1, `finishCelebration`, sheet visible, wc 1.
- Mutation: overlays.svelte.ts:341 delete `if (viewOnTop) close('wordcellView');` → view stays (or AD-13 throw); fails.
- Command: `-g "R-87 a win by Redo while a sticky WordCell view" --project=android --repeat-each=5`.
- Risk: the celebration may need `session-won` to have a non-empty word list and the run origin WordCells present; if the win-by-Redo cannot start the run under the seam, record the failing case (owner-call row).

**I3.k 10-6 pass 4 minor 4: skipByPress pointer type (helpers.spec.ts:1459)**
- Source: 10-6-build.md pass 4 minor 4 ("does not assert the pointer type, so an always-mouse helper passes on android; record `pointerType` and assert `['touch']` / `['mouse']`").
- Live: yes.
- Change: in `skipOn`, before `skipByPress`, add a window-capture `pointerdown` recorder of `e.pointerType` (window capture runs before skip.ts consumes at document); after, `expect(types).toEqual([touch ? 'touch' : 'mouse'])`.
- Mutation: e2e/helpers/celebration.ts:85 replace the touch branch with `await page.mouse.click(x, y)` → android half records `['mouse']`; fails.
- Command: `npx playwright test e2e/helpers.spec.ts --project=android -g "AD-17 skipByPress ends a run" --repeat-each=5`.

**I3.l 10-6 pass 4 minor 5: "no hover peek" in the mouse-click title (celebration.spec.ts:825)**
- Source: 10-6-build.md pass 4 minor 5 ("structural (`MODAL_TOP` holds `celebration` and `endSheet`), not evidence about `cancelGesture()`; drop it from the name or comment it").
- Live: yes, title :825 and :833/:839 assertions.
- Change: title → `'R-87 a mouse click on a non-empty WordCell hovered past the long-press time skips the run, consumed: no pointerdown, pointerup or click reaches the page, nothing activated, Session unchanged'`; keep the two `[data-hover-peek]` checks with the existing comment extended "(structural: overlays.svelte.ts:248 MODAL_TOP; not evidence for `cancelGesture()`)". Title-only: no mutation; record "n/a (rename)".
- Command: `npx playwright test e2e/celebration.spec.ts --project=desktop -g "R-87 a mouse click on a non-empty WordCell hovered" --repeat-each=5`.

**I3.m 10-7 minor 3: ☰ focus after the menu closes (:681 android, :844 desktop)**
- Source: 10-7-build.md minor 3 ("after the `goBack` that closes the menu, assert `menuButton(page)` focused").
- Live: yes, neither asserts focus.
- Change: after `await expect(menu(page)).toHaveCount(0);` in both, add `await expect(menuButton(page)).toBeFocused();`.
- Mutation: Menu.svelte:43 `focusMenuButton()` → `focusByPhase(view)`; fails.
- Commands: `--project=android -g "R-87 ☰ ends the run, the sheet expanded behind the menu"`; `--project=desktop -g "R-87 M twice mid-run gives one menu"`; both `npx playwright test e2e/celebration.spec.ts … --repeat-each=5`.
- Risk: the triage verified final focus ☰ by reasoning only; if focus is Replay at HEAD, owner-call row.

**I3.n 10-7 minor 4: WordCell focus guard (:857 desktop)**
- Source: 10-7-build.md minor 4 ("assert `wordcell-3` toBeFocused after `.focus()` so the Enter half cannot pass vacuously").
- Live: yes, :861-862.
- Change: after :861 `await expect(page.getByTestId('wordcell-3')).toBeFocused();`.
- Mutation: the WordCell button's focusability removed (e.g. `tabindex="-1"` + `disabled`, or `inert`, on `[data-testid="wordcell-3"]` in its component) → `.focus()` no-ops; new assert fails.
- Command: `--project=desktop -g "and WordCell Enter do nothing while it runs" --repeat-each=5` (`?` is a regex metachar; omit it).
- Risk: mid-run focus may be refused if the WordCell is inert under the celebration; App.svelte `mainInert` excludes `celebration` (spine :656), so expected focusable.

**I3.o 10-7 minor 5: Undo/Redo row a few frames later (:723)**
- Source: 10-7-build.md minor 5 ("append `animationFrames(page, 3)`, sheet count 1 and wc 1").
- Live: yes, ends at :736.
- Change: append `await animationFrames(page, 3); await expect(sheet(page)).toHaveCount(1); expect(await wcOf(page)).toBe(1);`.
- Mutation: end-sheet.ts:56 visible branch, after the open, add `requestAnimationFrame(() => overlays.open('menu'))` (a late extra entry) → wc 2 a frame later; new `wcOf` check fails, HEAD's poll had already passed.
- Command: `--project=android -g "R-87 Undo mid-run, then a Redo that restores the win" --repeat-each=5`.

**I3.p 10-9 minor 7: F29 race row**
- Source: 10-9-build.md minor 7 ("P6 tests e2e/celebration.spec.ts:701/:851 do not pin that the second press lands while the deferred open is still pending. In one test, assert the menu count is 0 before the second `m`, or note on the row …").
- Live: yes (:844-855 presses `m` twice via CDP; timing not pinned).
- Change (desktop 'M twice'): dispatch both keydowns in one `page.evaluate` (`document.dispatchEvent(new KeyboardEvent('keydown', { key: 'm', bubbles: true }))` twice; keys.ts reads no `isTrusted`) and return `document.querySelectorAll('[role="dialog"]')`-based menu count read synchronously between them (must be 0); then `expectOneMenu`. Keep the CDP presses as a second half, or replace them.
- Mutation: src/ui/open-menu.ts drop the "only when `endSheet` is on top" check before `openSurface('menu')` → two menus / AD-13 throw; fails.
- Command: `--project=desktop -g "R-87 M twice mid-run gives one menu" --repeat-each=5` (shared with I3.m).
- Risk: synthetic keys skip motion.ts's document tracker path; if keys.ts ignores synthetic events in practice, fall back to the rule-coverage note (a doc edit: owner-call/declined row, not done here).

**I3.q `observeAdded` (e2e/helpers/celebration.ts:94-110) duplicates win-guard.spec.ts:34-52 `watchFor`**
- Source: 10.5 plan :120 ("`observeAdded` duplicates win-guard.spec.ts's `watchFor` — … candidate for the entry 10 sweep").
- Live: yes. Same MutationObserver logic; differences: `watchFor` observes `document.body` and stores in `window.__seen`; `observeAdded` observes `document` (a superset) in `window.__added`.
- Dedupe: delete `watchFor` and the `__seen` field of `Recorded` (win-guard.spec.ts:32); `import { watchAdded } from './helpers/celebration'`; replace the 4 calls (:437, :465, :486, :515). Optional (cleaner, more files): move `observeAdded`/`reader`/`watchAdded`/`watchAddedFromBoot` to a neutral `e2e/helpers/added.ts` and update the 5 importers; default the minimal import. Add a self-test in helpers.spec.ts `'celebration helpers'`: `'AD-17 watchAdded records a node added and removed again before the read, and reads false when none was added'` (append+remove a marker div in-page; a second selector stays false).
- Mutation (self-test): celebration.ts:104 drop `|| node.querySelector(selector)` and add the marker inside a wrapper → fails; or `seen[selector] = true` initial → the false half fails.
- Commands: `npx playwright test e2e/win-guard.spec.ts -g "AD-14 a non-Undo input between settle|AD-14 R-70 Undo button after the floor|AD-14 R-70 Control\\+z after the floor|AD-14 a WordCell tap during the window" --repeat-each=5` (both projects, all speeds); `npx playwright test e2e/helpers.spec.ts --project=android -g "AD-17 watchAdded" --repeat-each=5`.

---

### Failing-at-HEAD / repeat rule (ticket items 2-3, review log pass 5)
- Any new or strengthened test that fails at HEAD is not committed: owner-call row with the failing case in the plan.
- A changed e2e test failing any of its 5 repeats: test-only fix, rerun 5/5; else owner-call row.
- Highest risk: I2.b reference unpaced on every geometry; I3.j sticky-view + celebration start; I3.m focus; I3.p synthetic keys; I3.f window-capture timing.

## Appendix B: items 4, 6, 7, 8, 10 investigation (planning, HEAD 728b18a)


Repo root abbreviated `R/`. No repo file was edited. Scratch files are under /tmp/1010/: `console-capture.spec.ts`, a `wt/` copy of HEAD (`git archive`, node_modules symlinked) used to try fixes, `variant-C-attach.diff`.

### Item 4: `binding_property_non_reactive` (Celebration.svelte:36 / :59)

**Why Svelte warns.** Svelte 5.57.1, runes mode, dev build. The compiler puts `$.validate_binding` around any member-expression `bind:` and around `bind:this` inside an `{#each}`/`{#if}`/`{#await}`/`{#key}` (node_modules/svelte/src/compiler/phases/3-transform/client/visitors/BindDirective.js:25-40). At runtime (internal/client/validate.js:20-55) it reads `elements[g]` inside a render effect. If that read tracks no signal (`effect.deps === null`), it warns once per binding instance. `elements` is a plain `const elements: HTMLElement[] = []`, so every group warns, which gives 10 warnings for `session-won-words`. The warning only flags the pattern. Nothing reads `elements` reactively: `onMount` copies it once (`register([...elements])`, :38-41), and the controller keeps its own plain copy (celebration.svelte.ts:97, :223-230) that `render()` reads each frame (:116-127). `{#key run}` in App.svelte:124-133 remounts the component for every run.

**Console capture (the Pass 5 open major is confirmed).** I ran it from a temporary spec copied into `e2e/` and deleted it afterwards. The tree was clean before and after.

```ts
import { expect, test } from '@playwright/test';
import { openFixture } from './helpers/board';
import { enableCelebration, finishCelebration, running } from './helpers/celebration';
test('AD-19 item-4 console capture …', async ({ page }) => {
  const messages: string[] = [];
  page.on('console', (msg) => messages.push(`${msg.type()}: ${msg.text()}`));
  await openFixture(page, 'session-won-words', { steps: ['undo'] });
  await enableCelebration(page);                      // waits current().kind === 'active', then setEnabled(true)
  await page.getByTestId('primary-action').click();   // the winning Confirm
  await expect.poll(() => running(page)).toBe(true);
  await expect.poll(() => page.locator('[data-celebration-group]').count()).toBeGreaterThan(0);
  await finishCelebration(page);
  const hits = messages.filter((m) => m.includes('binding_property_non_reactive'));
  console.log(`hits: ${hits.length}`);
});
```

Command: `npx playwright test e2e/<tmp>.spec.ts --project=android`. Playwright's `webServer` starts `npm run dev` on port 5173 (`reuseExistingServer` when CI is unset).

Results:
- **At HEAD, seam enabled and groups mounted:** 12 console messages, **10 hits** (one per group). Exact `msg.text()`:
  `%c[svelte] binding_property_non_reactive\n%c\`bind:this={elements[g]}\` (src/ui/celebration/Celebration.svelte:59:6) is binding to a non-reactive property\nhttps://svelte.dev/e/binding_property_non_reactive font-weight: bold font-weight: normal`, type `warning`.
  Vite also forwards it to the dev-server stdout as `[vite] (client) [console.warn] [svelte] binding_property_non_reactive`.
- **Control, seam off (plain win, no `setEnabled`):** 0 groups and 0 hits. A capture that does not enable the seam would therefore wrongly take the "absent at HEAD" exit.

**Fix options, each tried in the scratch copy with the same capture plus all of `e2e/celebration.spec.ts` (android):**

| Variant | Capture hits | celebration.spec.ts |
|---|---|---|
| HEAD | 10 | green |
| A: `const elements: HTMLElement[] = $state([]);` | **0** | 28 passed |
| B: `$state.raw([])` | 10 (does not fix it: an index read on a raw array tracks nothing) | 28 passed |
| C: attachment (diff below) | **0** | 28 passed; `svelte-check` 0 errors / 0 warnings |

Recommended: **C**. It removes the binding outright, and the write stays plain and non-reactive, which fits the AD-19 "nothing reactive per frame" header (:8-17). Option A also works, but it adds a deep `$state` proxy whose only job is to satisfy the dev check. Do not use a `svelte-ignore` comment: it hides the warning rather than removing it (rule 6 spirit).

```diff
 const elements: HTMLElement[] = [];
+/** Keeps group `g`'s element for the mount-time `register` (a plain write, nothing reactive). */
+const keep = (g: number) => (el: HTMLElement) => {
+  elements[g] = el;
+};
 …
-      bind:this={elements[g]}
+      {@attach keep(g)}
```

Why behaviour is unchanged:
- Attachments and `bind:this` both run as template effects created before the component's `onMount` user effect (svelte internal/client/dom/elements/attachments.js, bindings/this.js), so `register` still receives all the elements.
- The DOM output is identical: neither variant renders an attribute.
- One difference: `bind:this` nulls the slot on teardown and the attachment does not. That cannot matter, because `onMount` takes a copy, the destroy path calls `register([])`, and `{#key run}` gives each run a new instance.
- AD-14/AD-19 constraints still hold: copies keep `data-celebration`, groups keep `data-celebration-group`, and live elements and FLIP are untouched (spine :969).
- No Vitest test mounts Celebration.svelte (Vitest runs with `environment: 'node'`), so the pass evidence is the capture at HEAD (10 hits) against the capture after the fix (0), plus celebration.spec.ts and the mid-run screenshot baseline (Docker).

### Item 6: end-sheet.ts:41-43 calls `openDeferred` without `cancelGesture()`

**Reachability under the ticket's criterion (a press started after the dispatching `act()` and before the settle, with the guard live): not reproducible.**

1. **The guard is live on this branch too.** `flip.ts:329-331` `play()` calls `install(result.finished === 'won', finishAll)` for every winning play. That covers reduced motion, the seam off and a hidden page alike: none of them is checked there. Under reduced motion `playMove` may start no animation, and then `flip.ts:334-337` calls `notifySettled()` + `drainSettled()` at once. `drainSettled` (:340-342) hands end-sheet's callback to `whenOpenAllowed` (motion.ts:170-180). With the guard installed, that callback waits for the 300 ms floor (`MIN_GUARD_MS`, motion.ts:55; `evaluate` :265-277). flip.test.ts:1292-1320 pins exactly this ("a winning play that starts no animation runs the callback at the 300 ms floor"). In production the tracker always exists (main.ts:191-201, `startTracker` before `createController`).
2. **Presses during the guard never reach the controller.** The tracker listens in the document capture phase (motion.ts:440, :480). `onEvent` (:341) marks every new start while installed as consumed and calls `consume(event)` (`preventDefault` + `stopPropagation`, :430-436). Presses already open at install are marked consumed too (`install`, :123-137). So no `pointerdown` reaches controller.ts:663, and no long-press timer can be armed.
3. **Before the guard.** `act()` / key commands call `cancel()` first (AGENTS.md), and `play` runs synchronously inside the dispatch, so no input can land between the cancel and `install`.
4. **When the guard comes down.** `evaluate` uninstalls and runs the pending callbacks synchronously (motion.ts:273-277), so there is no gap in which a press could arm a timer before `openDeferred`. A hidden page is also covered: the hide flush calls the controller's `cancel()` first (AD-9) and `hideClear` clears open gestures.

**Residual found (not item 6's case, and the proposed fix would not close it).** `onEvent` starts with `evaluate(t)` (motion.ts:342). Suppose a `pointerdown` arrives after the floor has passed but before its `setTimeout` has fired.
- That `evaluate` runs the pending open first (`openDeferred`, so endSheet is now on top).
- The press then passes through untracked (`if (!t.installed) { t.open.set(id,false); return; }`, :417-419).
- The controller (listeners on `main`) resolves it with `elementFromPoint`. If that still lands on a WordCell, the timer is armed (controller.ts:713-715), and 400 ms later `openPeek` would throw `AD-13 openPeek while endSheet is the top entry` (overlays.svelte.ts:221-223 via `checkNoModalTop`, MODAL_TOP :45-56).
- In a real browser the microtask checkpoint between native-event listeners should run Svelte's flush first, which renders the end sheet's scrim (EndSheet.svelte:136; the scrim is outside `main`). The hit would then be the scrim, which resolves as `OUTSIDE` and arms no timer. I did not verify this.
- `cancelGesture()` before `openDeferred` cannot help here, because the press arrives after the call. The celebration branch is safe for a different reason: `celebrating: overlays.isOpen('celebration')` suppresses the timer (controller.ts:710, :713).
- Record it as a declined/owner-awareness row only if the plan wants it.

**Vitest repro outline (expected result: no throw; per the pass 5 minor, commit it as a passing AD-12/AD-14 guard test that the declined row cites).**
- File: `src/ui/gestures/controller.test.ts`, near the :3319 tracker test (real controller from `setup()`, fake timers, real `overlays`).
- Setup:
  - `t.detach()`, then a won view (the existing `wonView()` helper, ~:6040).
  - `const motion = await import('../motion')`. Call `startTracker(fakeDoc, fakeWin, () => now, timers, () => false)`, where `fakeDoc.addEventListener` saves the capture listener `onDoc` and `timers` delegate to `vi` fake timers (`setTimeout`/`clearTimeout`) so the floor fires.
  - `const token = t.overlays.deferEndSheetOpen()`.
  - `motion.install(true, () => {})`.
  - `motion.notifySettled()` (the reduced-motion "no animation" path).
  - `motion.whenOpenAllowed(() => { if (t.overlays.openDeferred(token)) {} })`, which mirrors end-sheet.ts:42.
- Steps:
  - At `now = 100`, build the WordCell pointerdown event, pass it to `onDoc(ev)` first, and forward it to the controller (`t.down(t.b.cellCard, ev)`) only if `ev.stopPropagation` was not called.
  - Expect `stopPropagation` called and no long-press `setTimer`.
  - Advance 400 ms: `peek` stays null and nothing throws.
  - Advance the clock to the floor (`now = 300`, run timers): `top === 'endSheet'`, no throw.
- Contrast, documenting why a bare repro is meaningless: the same steps without `startTracker` (the module's `tracker === null` means no guard) arm the timer, and `advance(400)` throws `AD-13 openPeek while endSheet is the top entry`. This is the "arms the timer itself" trap from pass 2.
- Conclusion: **decline item 6's fix**, citing flip.ts:331 (`install` on every won play), motion.ts:341/:430-436 (`onEvent` consumes presses while installed), motion.ts:273-277 (uninstall, then the callback runs synchronously) and the passing guard test.
- If the plan nevertheless keeps the fix (owner call), its shape is: in the :41-43 branch, `if (game.view?.status === 'won' && overlays.isLiveToken(token)) { cancelGesture(); if (overlays.openDeferred(token)) announceOutcome(); }`, mirroring :45-49.

### Item 7: doc syncs (apply two, citing the 10.9 done entry; the rest are proposals)

Sources:
- Digest `_bmad-output/implementation-artifacts/autopilot/epic-end-of-game-words-20261020-0925.md:228-229` (10.9 done entry: "Close-out docs: DESIGN.md Win celebration / A-D12 ← accepted (owner, 2026-10-24); ARCHITECTURE-SPINE.md AD-17 Touch ← `doubleTap`; tickets.toml entry 7 `interface`; epic References F-range F1…F29").
- Epic Notes `epic-end-of-game-words.md:75` (owner Android read, 2026-10-24, ticket 10.9, "A-D12 verdict: accepted (copies readable at the smallest measured scale, 0.553)") and :74 (`doubleTap` close-out doc).

**Apply 1: DESIGN.md:753 (A-D12).**
- old: `a 23-letter word stays readable at 360 px (to confirm on device, epic 10; overlap amended 2026-10-24, epic 10 SPEC F20).`
- new: `a 23-letter word stays readable at 360 px (accepted on device 2026-10-24, owner Android read, epic 10 ticket 10.9; overlap amended 2026-10-24, epic 10 SPEC F20).`
- This is the only "to confirm on device" left in planning-artifacts, specs and docs.

**Apply 2: epic-end-of-game-words.md:46 (References).**
- old: `- spec — _bmad-output/specs/spec-epic-10-end-of-game-words/SPEC.md, CAP-1…CAP-6, decisions F1…F13; rule-coverage.md`
- new: `… CAP-1…CAP-6, decisions F1…F32; rule-coverage.md`
- SPEC.md:89-120 now holds F1-F32 (":122 Next owner answer takes F33"). The ticket's "F1…F29" and the digest's are stale. The 10.9 plan's line :161 also says F29.

**Proposals only (old → new), not edits:**

1. Spine AD-17 Touch bullet, ARCHITECTURE-SPINE.md:854-858.
   - old:
     ```
     the stepwise held touch `touchHold(page, from)` → `{ moveTo(point), end() }` on one CDP
         session (epic 4 SPEC F10);
         desktop tests use `page.mouse`.
     ```
   - new:
     ```
     the stepwise held touch `touchHold(page, from)` → `{ moveTo(point), end() }` on one CDP
         session (epic 4 SPEC F10), and `doubleTap(page, target, { between })`: two stamped CDP taps
         that fail unless the page's clicks are exactly two, `detail` 1 then 2 (epic 10, 169c6bc);
         desktop tests use `page.mouse`.
     ```
   - Signature checked at e2e/helpers/touch.ts:87-94.
2. DESIGN.md:692 Win celebration (10-9-build.md minor 2).
   - old `Each word is a row of card copies` → new `Each word is a set of card copies`.
   - old `a row wider than 90 % of the band scales down uniformly` → new `a word whose row would be wider than 90 % of the band scales down uniformly`.
3. F32 (SPEC.md:120), EXPERIENCE.md:414 Motion row, Win celebration.
   - old ends: `…a word still moving fades out as a whole over the last 1 × base of the cap, then the end sheet opens |`
   - new ends: `…then the end sheet opens. The cap counts simulated time (each frame steps at most 50 ms), so below 20 fps a run lasts longer than the cap in wall time (epic 10 SPEC F32) |`
4. F32, spine AD-19 Duration, ARCHITECTURE-SPINE.md:971.
   - old: `…a word still moving fades as a whole over the last base, and the run ends by the cap. No other module holds a duration.`
   - new: `…and the run ends by the cap, counted in simulated time (step's 50 ms dt clamp), so below 20 fps a run passes the cap in wall time (SPEC F32). No other module holds a duration.`
5. The DESIGN.md Win celebration verdict from the digest's "DESIGN.md Win celebration / A-D12 ← accepted" needs no text beyond A-D12: :692 carries no "to confirm" wording.

### Item 8: "already closed" cites, checked at HEAD

| Cite | Evidence now | Closed? |
|---|---|---|
| 10.4 deferral: openPeek under `celebration` | end-sheet.ts:47-49 comment + `cancelGesture()` before `startCelebration()` :50; also controller.ts:710/:713 `celebrating` suppresses the timer | yes |
| 10.5 deferral: hook-free real win | e2e/pwa/dist-smoke.spec.ts:66 `winIntoRealRun` (watchAdded ROOT, :112, :127) | yes |
| 10.6 deferral: 400 ms budget by page `timeStamp`s | celebration.spec.ts:355 (`pointerup − pointerdown < LONG_PRESS_MS`), :440 (`keydown − pointerdown`); recorder :94-123 | yes (flake half is item 5) |
| 10.8 deferral 1: seam "press or back" | spine :839 "end the run by a press or back (epic 10 SPEC F12, CAP-6)"; SPEC.md:100 F12 "skip by a press or back" | yes |
| 10.8 deferral 2: AD-19 per-copy transform | spine :969 "writes `opacity` per group and `transform` per shown copy directly" | yes |
| 10.9 deferral: nav.spec.ts:162/163 flake | nav.spec.ts:163 is the test title line; 169c6bc "deterministic double taps with a stamped doubleTap helper" touches nav.spec.ts, touch.ts, history-notice.spec.ts, celebration.spec.ts | fix in code; the 0/3 evidence is item 5's |
| Halted Reload first tap taken as a skip | skip.ts:96-99 gated listener `if (!deps.halted()) listener(event);` | yes |
| `allowImportingTsExtensions` | spine :1087 Scaffold deltas (ticket 10.3, `4c9f853`) | yes |
| opus GAVE_ROWS | end-sheet.spec.ts:751 def, :808, :928 | yes |
| R-88 `1 letter` Exempt | rule-coverage.md:60 | yes |
| `Math.max(lead, w)` | `grep -rn "Math.max(lead" src` empty; removed in 96f3cc5 (diff lines show `-…Math.max(lead, w)…`) | yes |
| 10.7 toolbar-resize, ☰-then-back residuals | epic Notes :75 "toolbar and ☰-then-back interruptions as specified" (10.9 read) | yes (bfcache first-back not in the read: Scope 9 owner call) |

### Item 10 prep (values at HEAD 728b18a)

- `git merge-base main HEAD` → `19acd1772e9030063d6e29d0da1b5167883e0775`.
- `npm run build` → `total 559960 / 600000`, so the AD-18 margin is **40040**. dist/ is git-ignored (`.gitignore:11`); the tree stayed clean.
- `git diff --exit-code 19acd17 -- package.json package-lock.json` → empty, exit 0.
- `git diff 19acd17 -- src/engine/deal.test.ts | wc -l` → 0.
- `git diff 19acd17 --stat -- src/engine/session.ts src/engine/history.ts src/engine/serialize.ts` → empty. All three files exist.
- `SESSION_VERSION = 1` at src/engine/session.ts:51 and `HISTORY_VERSION = 1` at src/engine/history.ts:8, the same at 19acd17.
- **Note:** `git diff 19acd17 --stat -- fixtures/` is **not** empty. Seven files, 158 insertions and 4 deletions, from eb25751 (10.1), 377ecd9, b6272b0, 011935c (epic 6/8 Opus fixes on this branch) and 52d5aa5 (10.9). The AC "fixtures/ untouched by this ticket's diff" must therefore be checked against the ticket's start commit: `git diff --stat 728b18a -- fixtures/` (empty now). It must not be checked against 19acd17.

### Final `git status --porcelain`

(empty)

## Appendix C: deferred-findings table (ticket item 11)

Dispositions as planned; the build updates rows from its outcomes (mutations, flake runs, the item 6 test). Build updates (767ed42): rows 21, 33, 40, 45, 47, 55, 56, 58, 59 rewritten from the outcomes; rows 109 (item 6 residual) and 110 (I3.j probe finding) added. The per-disposition counts below are the planning counts; after the build, rows 40 and 45 moved from fixed here to owner call, row 33 to declined, rows 21 and 47 also record fixed-here edits, and 109-110 are owner calls.


Paths: `EP` = `_bmad-output/initiative-wordcell-v1/epic-end-of-game-words/`, `RL` = `_bmad-output/implementation-artifacts/review-loop/`, `DG` = `_bmad-output/implementation-artifacts/autopilot/epic-end-of-game-words-20261020-0925.md`, `SP` = spine `ARCHITECTURE-SPINE.md`, `SPEC` = `_bmad-output/specs/spec-epic-10-end-of-game-words/SPEC.md`, `DES` = DESIGN.md, `cs` = `e2e/celebration.spec.ts`, `es` = `e2e/end-sheet.spec.ts`, `ds` = `e2e/pwa/dist-smoke.spec.ts`, `cel/` = `src/ui/celebration/`.

### Reconciliation

Commands run (repo root):

1. Plan `deferred:` frontmatter:
   `for f in EP/*-plan.md; do awk 'NR==1&&/^---/{fm=1;next} fm&&/^---/{exit} fm{print NR": "$0}' "$f" | grep -n -A40 deferred; done` and `grep -n '^ticket' EP/*-plan.md` (ticket ids; step-renderer = 3, end-sheet-words-section = 2).
2. Review-loop Results: `for f in RL/10-*.md RL/opus-review-epic-10.md; do n=$(grep -n '^## Result' $f | cut -d: -f1); sed -n "$n,\$p" $f; done`, then followed each pointer to its pass list (`grep -n -E '^## |^### |not applied|Minors' RL/10-6-build.md`, `cat -n` of every RL file). 10-2-build.md's Result (:27) is empty: its pass 2 "Minors (unapplied)" (:21-25) were used; 10-3-build.md Result (:31) points to pass 1 (:19-20) and pass 2 "Minors not applied" (:25-28) is also unapplied, both used.
3. `sed -n '300,325p' EP/story-close-out-documents-agents-pitfall-and-device-check-plan.md` (:314-317) and `sed -n '110,125p' EP/story-win-trigger-and-celebration-test-seam-plan.md` (:120).
4. Ticket review logs: `for f in EP/story-*.review-log.md (minus story-refactor-sweep); do n=$(grep -n '^## Result' $f | tail -1 | cut -d: -f1); sed -n "$n,\$p" $f; done`; plan coverage of each: `grep -n -i -E 'review.log|unapplied|minors' EP/*-plan.md`, then read each plan's "Review-log items left for the build, resolved" / "Owner checkpoint items" (10.4 :136/:165, 10.5 :157-170, 10.6 :152-174, 10.7 :134-157, 10.8 :57-69, 10.1 :90, 10.3 :62/:114, 10.9 D2-D11 :369-405). A finding counts as "left open" when the plan only recorded it as an owner/entry-9/entry-10 item.
5. Digest: `grep -n -i 'worth knowing\|^## ' DG`, every `Worth knowing:` line for 10.1-10.9 (:17, :28, :39, :51, :65, :77, :91, :104, :130, :144, :162, :187, :206, :215); the 10.9 done entry (:228) read for item 7.
6. Liveness: grep/read of `src/`, `e2e/`, spine, SPEC, DESIGN.md, tickets.toml, epic file (cites in table); `npx biome lint e2e/end-sheet.spec.ts` (1 warning, :845). Item 4's dev warning was not reproduced by this planning inventory (no dev server run); the planning capture with the seam on (Appendix B) and the build (row 55) reproduced it.

Counts before merging (findings; "none" rows extra):

| Source | Findings | Breakdown |
| --- | --- | --- |
| 1 plan `deferred` | 6 | 10.4: 1, 10.5: 1, 10.6: 1, 10.8: 2, 10.9: 1; 10.1, 10.2, 10.3, 10.7: none (row 1) |
| 2 review-loop Results | 75 | 10-1: 2, 10-2: 4, 10-3: 7, 10-4: 4, 10-5: 5, 10-6-build: 8 (pass 4 ×6, Result second-finger, Result spine sync), 10-6-tune: 5 (pass 2 ×4 + carried NaN), 10-6-tune2: 7, 10-7: 6, 10-8: 4, 10-9: 7, opus: 16 (15 minors + Result owner close-out) |
| 3 stale names / `observeAdded` | 5 | 10.9 plan :315 (1), :316 (2), :317 (1); 10.5 plan :120 (1) |
| 4 ticket review-log Results left open by plans | 21 | 10.3: 7 (open major + 6 minors), 10.4: 3, 10.5: 1, 10.6: 4, 10.7: 4, 10.9: 2; 10.1, 10.2, 10.8: none (all resolved by their plans; row 2) |
| 5 digest Worth knowing | 44 | :28 2, :39 2, :51 2, :65 5, :77 5, :91 4, :104 3, :130 3, :144 3, :162 5, :187 3, :206 6, :215 1; :17 none (row 3) |
| Total | 151 | merged into 108 rows (3 "none" rows, 104 finding rows, 1 pointer row merged into others) |

Rows per disposition: fixed here 47 (item 1: 11, item 2: 14, item 3: 16, item 4: 1, item 5: 2, item 6: 1, item 7: 2), closed 31, declined 21, owner call 5, none 3, merged pointer 1. Planner flags (search `FLAG`): rows 21, 34, 47 (named by items 2-3 as work, already closed in code); row 41 (live, ticket item 8 wrongly lists it closed); row 63 (live, digest :228 lists it as a done sync); rows 12, 79 (live, not named by items 1-7).

### Table

| # | source file:line (every source) | finding (short) | live at HEAD | disposition | ticket item |
| --- | --- | --- | --- | --- | --- |
| 1 | `deferred: []` in EP/story-engine-word-list-and-its-fixture-plan.md:19, EP/story-end-sheet-words-section-plan.md:17, EP/story-celebration-step-renderer-and-run-controller-plan.md:18, EP/story-celebration-interruptions-plan.md:18 | none (source 1 search, step 1) | n/a | none | 11 |
| 2 | EP/story-engine-word-list-and-its-fixture.review-log.md:24-29 (resolved by plan :90), EP/story-end-sheet-words-section.review-log.md:60-61 (no minors), EP/story-hook-free-celebration-suite.review-log.md:81-83 (resolved by plan :57-69) | none left open (source 4 search, step 4) | n/a | none | 11 |
| 3 | DG:17 | none (10.1 Worth knowing "nothing") | n/a | none | 11 |
| **Item 1, comments and titles** | | | | | |
| 4 | EP/…close-out…-plan.md:315; EP/story-close-out-documents-agents-pitfall-and-device-check.review-log.md:147 (optional pitfall word) | Celebration.test.ts title says every *group* carries `data-celebration` (copies do) | yes `cel/Celebration.test.ts:30` | fixed here (item 1) | 1 |
| 5 | EP/…close-out…-plan.md:316 | interruptions.ts "pending the owner's rule 7 nod" (settled F28) | yes `cel/interruptions.ts:5-6` | fixed here (item 1) | 1 |
| 6 | EP/…close-out…-plan.md:316 | step.ts header says AD-19/SPEC "still say entry index" | yes `cel/step.ts:3-5`; SP:966 and SPEC:33, :91 now name the launch origin | fixed here (item 1) | 1 |
| 7 | RL/10-7-build.md:35 (minor 6) | celebration.svelte.ts header "hide follows (entry 7)" stale | yes `cel/celebration.svelte.ts:1-2` | fixed here (item 1) | 1 |
| 8 | RL/10-6-tune2.md:18 (minor 1) | "more than F25's 10 %" (F25 has no 10 %) | yes `cel/step.ts:29`, `cel/step.test.ts:586` | fixed here (item 1) | 1 |
| 9 | RL/10-6-tune2.md:20 (minor 3) | "a card never hides the letter above" overclaims (side by side at apex/contact) | yes `cel/step.ts:17`, `cel/step.ts:396-397` (stackOrder doc), `cel/Celebration.test.ts:113` title, :122-123 comment | fixed here (item 1; renamed :113 keeps `AD-19`) | 1 |
| 10 | RL/10-6-tune2.md:21 (minor 4, code half) | launch doc "count that makes a hop nearest the target" (code rounds the contact count) | yes `cel/step.ts:245-246` | fixed here (item 1) | 1 |
| 11 | RL/10-6-tune2.md:21 (minor 4, rule half) | change the contact-count rule itself | yes (as row 10) | declined, motion owner-approved; comment reword only | 9 |
| 12 | RL/10-6-tune2.md:21 (minor 4, epic-Notes half) | epic Notes repeat "makes the hop nearest HOP_SHARE" | yes EP/epic-end-of-game-words.md:80 | declined: dated "Tuning applied" record, not a code site; item 1 covers code only. FLAG: live, items 1-7 do not name it | 9 |
| 13 | RL/10-6-tune2.md:19 (minor 2, comment half) | "a frame allocates only the transform strings" overstates (rAF closure, step spread, map closures) | yes `cel/celebration.svelte.ts:123-124` | fixed here (item 1, narrowed) | 1 |
| 14 | RL/10-6-tune2.md:19 (minor 2, refactor half) | hoist rAF callback / index loops in `step` | yes (shape `step(state) → state`) | declined, motion owner-accepted (item 1) | 1, 9 |
| 15 | RL/10-6-build.md:84-85 (pass 4 minors 1-2) | skip.ts header: repeat-Space list omits a plain Space held from before start; "keys.ts sees a prevented key" wrong for a skipping key | yes `cel/skip.ts:10` ("keys.ts sees a prevented key"), :12-16 | fixed here (item 1) | 1 |
| 16 | RL/opus-review-epic-10.md:27 (pass 1); EP/story-celebration-step-renderer-and-run-controller.review-log.md:92 ("stagger formula") | wave launch formula `floor(i/3)·g + (i%3)·g/3` = `i·g/3`; comment claims waves | yes `cel/step.ts:41-44` comments, :276 formula | fixed here (item 1, comment states the even stagger) | 1 |
| 17 | same as 16 | give waves real structure (rewrite) | yes | declined, owner-tuned motion (item 9) | 9 |
| 18 | RL/10-5-build.md:23 (minor 5) | test-hook `advance` invariant (real-rAF run's `advance` returns silently; `setEnabled` pairs `setManual`) unrecorded | yes `src/shell/test-hook.ts:54-58`, :60-64; `cel/celebration.svelte.ts:332` | fixed here (item 1) | 1 |
| **Item 2, unit tests** | | | | | |
| 19 | RL/10-6-tune2.md:22 (minor 5) | closing-fade tests use `vx: 0` → NaN positions | yes `cel/step.test.ts:810`, :819, :836 | fixed here (item 2) | 2 |
| 20 | RL/10-6-tune.md:33 (pass 2 minor 1) | `paceOf` copies FALL_FRAC 0.2 as a literal | yes `cel/step.test.ts:65-67` | fixed here (item 2) | 2 |
| 21 | RL/10-6-tune.md:34 (pass 2 minor 2) | no pace ≥ 1 lower bound (drop `Math.max(1, …)` stays green) | no: `PACES` literal pins incl. 1 for unpaced groups `cel/step.test.ts:1077-1098`, asserted :1121-1122, and `toBe(1)` :1166 fail if `cel/step.ts:312` `Math.max(1, …)` goes | closed by step.test.ts PACES pins and the overrun `toBe(1)` (build: mutation `pace = Math.max(1, …)` → bare ratio fails 11 tests); the explicit ≥ 1 bound was added anyway (I2.b, fixed here) | 2 |
| 22 | RL/10-3-build.md:28 (pass 2 minor 3) | hidden-group check `includes('opacity: 0')` also matches 0.5 | yes `cel/Celebration.test.ts:47` | fixed here (item 2) | 2 |
| 23 | RL/opus-review-epic-10.md:31 (pass 1) | `viewOf` always `letterCount === cards.length`; no QU sizing case | yes `cel/celebration.svelte.test.ts:139-148` | fixed here (item 2) | 2 |
| 24 | RL/10-1-build.md:40 | no gaveUp list with ≥ 3 words, tie, duplicate | yes `src/engine/view.test.ts:1114`, :1134 only gaveUp cases | fixed here (item 2) | 2 |
| 25 | RL/10-3-build.md:27 (pass 2 minor 2) | `start()` fail-fast throws untested beyond wordcell | yes throws `cel/celebration.svelte.ts:78` (`.board-root`, label), :255 (`--wc-w`); test only `cel/celebration.svelte.test.ts:219-222` | fixed here (item 2) | 2 |
| 26 | RL/10-4-build.md:29 (pass 2 minor 1) | ILLEGAL rows with hover peek do not assert `hoverPeek` 6 / name it | yes `src/ui/overlays.svelte.test.ts:851-866` | fixed here (item 2) | 2 |
| 27 | RL/10-4-build.md:31 (pass 2 minor 3) | no two-run row (later back takes its own `done`; drop `pending = null` passes) | yes no such test in `cel/attached.test.ts`; `pending = null` `cel/celebration.svelte.ts:193` | fixed here (item 2) | 2 |
| 28 | RL/10-7-build.md:30 (minor 1) | keys.test "other suspending entry … Z and N" lacks `M` | yes `src/ui/keys.test.ts:1531-1537` | fixed here (item 2) | 2 |
| 29 | RL/10-7-build.md:31 (minor 2) | no second `M` before the settle case | yes `src/ui/keys.test.ts:1513-1521` single `M` | fixed here (item 2) | 2 |
| 30 | RL/opus-review-epic-10.md:86 (pass 3) | end-sheet AD-3 stub already in engine order, UI re-sort passes | yes `src/ui/end-sheet.test.ts:395-412` (BAKED then CAT) | fixed here (item 2) | 2 |
| 31 | RL/10-1-build.md:39, :33 (pass 2 triage) | view.test tail half asserts only length | yes `src/engine/view.test.ts:1152-1153` | fixed here (item 2) | 2 |
| 32 | RL/10-5-build.md:21 (minor 3) | hidden `done` branch's won re-check unexercised (playing/undefined/dead token before `whenVisible`) | yes `src/ui/end-sheet.test.ts:324-342` only the won path | fixed here (item 2) | 2 |
| 33 | RL/10-3-build.md:20 (pass 1, 1st) | `start()` does not reset `elements` on rapid restart | yes `cel/celebration.svelte.ts:97`, start :232-300 no reset; only `register([])` `cel/Celebration.svelte:39` | declined: unreachable (`{#key run}` remount, `register([])` on destroy); a reset is a code change outside item 2 (I2.m (a)) | 2 |
| 34 | RL/10-3-build.md:20 (pass 1, 2nd) | `props()`/`running()` plain `let`, not reactive | no: `cel/celebration.svelte.ts:93` `$state.raw`; test `cel/celebration.svelte.test.ts:870` (opus pass 1 fix 11, pass 2 fix 1) | closed by celebration.svelte.ts:93, test :870. FLAG: item 2 lists it as work | 2 |
| 35 | RL/10-3-build.md:20 (pass 1, 3rd); RL/opus-review-epic-10.md:106 (pass 4, obsolete note) | start measures by rects, not `src/ui/layout/` | partly: band now `createVisibleBand` `cel/celebration.svelte.ts:247-249`, card size `--wc-w` :252-255, sizes `cardMetrics` | declined (item 2 pre-assigned) | 2 |
| 36 | RL/10-3-build.md:20 (pass 1, 4th); RL/opus-review-epic-10.md:87 (pass 3, attribution) | no client-side mount test for `register` | yes (Vitest `environment: 'node'`, vite.config.ts:58); P6 copies row `cs:305` mounts it | declined (item 2, environment node) | 2 |
| **Item 3, e2e and lint** | | | | | |
| 37 | RL/10-8-build.md:27 (minor 1); DG:187; EP/story-hook-free-celebration-suite-plan.md:63 ("`added()` kept") | `expect(await added()).toBe(true)` tautological; no root-absent check before Confirm | yes `ds:71-77` | fixed here (item 3) | 3 |
| 38 | RL/10-8-build.md:29 (minor 3) | closing `networkidle` resolves at once; error check does not wait past 300 ms tail | yes `ds:117-118`, :133-134 | fixed here (item 3) | 3 |
| 39 | RL/10-8-build.md:30 (minor 4) | root asserted before `skipByPress` round trips, not at the press | yes `ds:98` (root asserted in setup), :113-114 | fixed here (item 3) | 3 |
| 40 | RL/opus-review-epic-10.md:118 (pass 5); EP/story-refactor-sweep.review-log.md:171 | history-shape check's `before` taken after reconcile | yes `es:921` (moved by I3.b's new row); build: no `wordcell:history` is stored at boot for the seeded `session-won-words` fixture | owner call: the planned shape check fails on correct code (`R-88 no wordcell:history after boot`, 5/5), so it is not committed (Boundaries). Options for the owner: assert the key absent in `before` (the equality then catches any history write), or seed a history fixture and pin its record's AD-6 keys | 3 |
| 41 | RL/opus-review-epic-10.md:30 (pass 1) | Undo-then-Give-up asserts only `not.toEqual(WON_ROWS)` and length 9, not `GAVE_ROWS` | **yes** `es:944-946`; the ticket item 8 cites `es:808` (seeded give-up test) and `es:928` (give-up reload test), neither is this path | declined here: not in items 1-7 (test-only; ticket item 8 wrongly lists it closed). FLAG: planner reports the wrong item 8 cite; adding it to item 3 is a ticket amendment for the owner | 8 (mis-cited) |
| 42 | RL/10-6-tune.md:36 (pass 2 minor 4) | `stepUntilShown` true for a childless group | yes `cs:149-152` (`?.style.transform !== ''`) | fixed here (item 3) | 3 |
| 43 | RL/10-5-build.md:19 (minor 1) | R-87 run row cannot tell pop-then-push from no nav (no `popstate` counter) | yes `cs:211-226` | fixed here (item 3) | 3 |
| 44 | RL/10-5-build.md:20 (minor 2) | run and Slow cap rows check only the expanded dialog, not the collapsed bar | yes `cs:219`, :244 `sheet()` = dialog (`cs:41`); `collapsedBar` (`cs:170`) used only :654 | fixed here (item 3) | 3 |
| 45 | RL/10-5-build.md:22 (minor 4) | no R-87 variant of a Redo win with a sticky WordCell view open | no such test; build: the scenario is unreachable through Undo of the finish (probe: a sticky view on WordCell 6, 7 or 8 of `session-won` is closed by the Undo, wc 0, no `[data-view-sheet]`) | owner call: the new row passed 5/5 but was vacuous (deleting `if (viewOnTop) close('wordcellView')` in `startCelebration` still passed), so it is not committed. New finding: `es:350` 'AD-13 R-62 a win by Redo while a sticky WordCell view is open …' never has its view open at the Redo either; reaching `startCelebration`/`openDeferred` with a view on top needs another route (owner/test design call) | 3 |
| 46 | RL/10-6-build.md:87 (pass 4 minor 4) | `skipByPress` self-test does not assert `pointerType` | yes `e2e/helpers.spec.ts:1459-1486` | fixed here (item 3) | 3 |
| 47 | RL/10-6-build.md:88 (pass 4 minor 5) | "no hover peek" in the mouse-hover title is structural | partly: comment `cs:832-833` explains it (the minor's "or comment it" option); title `cs:825` unchanged | fixed here (item 3: title drops "no hover peek"; comment notes it is structural, MODAL_TOP) | 3 |
| 48 | RL/10-7-build.md:32 (minor 3) | after the menu-closing back, ☰ focus unasserted | yes `cs:681-692`, :844-855 | fixed here (item 3) | 3 |
| 49 | RL/10-7-build.md:33 (minor 4) | `wordcell-3` focus unasserted before Enter | yes `cs:862-863` | fixed here (item 3) | 3 |
| 50 | RL/10-7-build.md:34 (minor 5) | Undo-Redo row: no later frames check for one sheet | yes `cs:732-736` | fixed here (item 3) | 3 |
| 51 | RL/10-9-build.md:37 (minor 7) | F29 rows do not pin the second press landing while the open is pending | yes `cs:694-704`, :844-855 | fixed here (item 3) | 3 |
| 52 | EP/story-win-trigger-and-celebration-test-seam-plan.md:120 | `observeAdded` duplicates win-guard `watchFor` | yes `e2e/helpers/celebration.ts:94-125` vs `e2e/win-guard.spec.ts:36` | fixed here (item 3) | 3 |
| 53 | RL/10-2-build.md:23 (pass 2) | `wordSize >= 14` weak (add `<= 16`, 3-letter row at 16 px) | yes `es:850-853` | fixed here (item 3) | 3 |
| 54 | RL/10-2-build.md:25 (pass 2); "1 pre-existing warning" in RL/10-3-build.md:31, 10-4:34, 10-6-build:92, 10-7:24, 10-8:24, 10-9:25, opus :119 | `boundingBox()!` noNonNullAssertion lint warning | yes `es:845` (`npx biome lint`: 1 warning) | fixed here (item 3) | 3 |
| **Items 4-7** | | | | | |
| 55 | DG:77, DG:91 | Svelte dev warning `binding_property_non_reactive` | yes: reproduced at HEAD with the seam on, 10 hits (12 console messages); after the fix 0 hits (2 messages) | fixed here (item 4, `{@attach keep(g)}`, Appendix B variant C) | 4 |
| 56 | EP/story-celebration-skip-plan.md:19-24 (deferred, load half); RL/10-6-build.md:86 (pass 4 minor 3); DG:130 | R-87 touch rows may flake under load (hold spans the 16 ms poll and CDP touchEnd) | no: 0/3 for the four `R-87 a (touch (press|held)|quick second tap)` rows (three full `--project=android` runs at 767ed42, CI unset, 8 workers, 844 passed / 0 failed / 0 flaky each) | fixed here (item 5: evidence 0/3, leave it) | 5 |
| 57 | EP/…close-out…-plan.md:20-26 (deferred); RL/10-9-build.md:21 (triage), :31 (minor 1); DG:65, :77, :206, :215 | `nav.spec.ts` double-tap test failed under full android load | no: `doubleTap` helper `e2e/nav.spec.ts:172-173` (169c6bc); test:all green at 169c6bc and 6c2042d (DG:221, :228) | closed by 169c6bc | 8 |
| 58 | same as 57 (load half) | flake evidence for the double-tap test after 169c6bc | no: 0/3 for nav.spec.ts '§2 AD-13 a double tap on New game on the rejected root opens the notice at wc 1' (same runs) | fixed here (item 5: evidence 0/3, leave it) | 5 |
| 59 | EP/story-celebration-overlay-entry-plan.md:19-24 (deferred, endSheet half: "as openDeferred does today under endSheet") | reduced-motion / hidden / seam-off branch opens the sheet with no `cancelGesture()`; pending `openPeek` can throw | not reproducible with the guard live: controller.test.ts 'AD-12 a press during a won settle’s guard (no animation, reduced motion) is consumed …' (a contrast without `startTracker` throws `AD-13 openPeek while endSheet is the top entry`) | declined (item 6): flip.ts:331 `install` on every won play, motion.ts:341/:430-436 `onEvent` consumes presses while installed, motion.ts:273-277 uninstall then the callback runs; the throw would be a bug (rule 6) but needs the guard absent; the passing guard test is committed; end-sheet.ts untouched | 6 |
| 60 | same as 59 | gave-up open with no `cancelGesture()` | yes `src/ui/end-sheet.ts:62-63` | declined, unreachable (Give up runs in `act()`, Menu.svelte:122) | 6 |
| 61 | DG:206 ("your A-D12 verdict into DESIGN.md"), DG:228; EP/…close-out…-plan.md:273, :400 | DESIGN.md A-D12 still "(to confirm on device, epic 10 …)" | yes `DES:753` | fixed here (item 7; accepted 2026-10-24, epic Notes EP/epic-end-of-game-words.md:75) | 7 |
| 62 | DG:206, DG:228; EP/…close-out…-plan.md:161, :400 | epic References give F1…F13 (now F1…F32) | yes EP/epic-end-of-game-words.md:46 | fixed here (item 7) | 7 |
| 63 | DG:228 ("ARCHITECTURE-SPINE.md AD-17 Touch ← `doubleTap`", recorded as applied) | spine AD-17 Touch bullet lacks `doubleTap` | **yes** SP:854-858 (no `doubleTap` anywhere in SP), though DG:228 lists it as a done sync | owner call: old → new proposal (item 7, spine contract). FLAG: digest claims it applied | 7 |
| 64 | RL/10-9-build.md:32 (minor 2) | DES Win celebration "Each word is a row of card copies … a row wider than 90 %" | yes `DES:692` | owner call: old → new proposal (item 7, owner doc) | 7 |
| **Item 8, already closed** | | | | | |
| 65 | EP/story-celebration-overlay-entry-plan.md:19-24 (deferred, celebration half); RL/10-4-build.md:22, :34; DG:65; EP/story-celebration-overlay-entry.review-log.md:128 (start from the pending callback) | press timer armed at run start throws at `openPeek` under `celebration`; start only from the live winning callback | no: `cancelGesture()` `src/ui/end-sheet.ts:47-49`; live-token check :46 | closed by end-sheet.ts:46-49 | 8 |
| 66 | EP/story-win-trigger-and-celebration-test-seam-plan.md:19-24 (deferred); EP/…seam-plan.md:127; DG:77, :91 | no test that a real hook-free win starts the celebration | no: `winIntoRealRun` `ds:66-98`, tests :108, :124 | closed by ds:66-98 (10.8) | 8 |
| 67 | EP/story-celebration-skip-plan.md:19-24 (deferred, mechanism half); RL/10-6-build.md:13 (pass 1 major), :89 | `< LONG_PRESS_MS` timed by Node wall clock from before `touchHold` | no: page `timeStamp`s `cs:355`, :440 | closed by cs:355, :440 | 8 |
| 68 | EP/story-hook-free-celebration-suite-plan.md:20-25 (deferred 1) | AD-17 seam / CAP-6 / F12 say press only; build skips by press or back | no: SP:839 ("skip by a press or back" wording), SPEC:100 F12 "skip by a press or back" | closed by SP:839, SPEC:100 | 8 |
| 69 | EP/story-hook-free-celebration-suite-plan.md:27-32 (deferred 2) | AD-19 says transform to groups; build writes opacity per group, transform per copy | no: SP:969 | closed by SP:969 | 8 |
| 70 | DG:104, DG:130; EP/story-celebration-skip.review-log.md:138 | after a halt mid-run the first tap on Halted's Reload is a skip | no: listeners gated by `halted()` `cel/skip.ts:95-101`; test `cel/attached.test.ts:422` | closed by skip.ts:95-101 | 8 |
| 71 | RL/10-3-build.md:26 (pass 2 minor 1); RL/opus-review-epic-10.md:28 (pass 1); DG:39 | `allowImportingTsExtensions` not in Scaffold deltas | no: SP:1087; tsconfig.app.json:9 | closed by SP:1087 | 8 |
| 72 | RL/opus-review-epic-10.md:29 (pass 1); DG:28 | R-88 `1 letter` not in the Exempt list | no: `_bmad-output/specs/spec-epic-10-end-of-game-words/rule-coverage.md:60` | closed by rule-coverage.md:60 | 8 |
| 73 | RL/10-6-tune.md:35 (pass 2 minor 3) | `Math.max(lead, w)` guard untested/unreachable | no: absent from `cel/step.ts` (grep) | closed by 96f3cc5 | 8 |
| 74 | EP/story-celebration-interruptions.review-log.md:106; EP/story-celebration-interruptions-plan.md:155 (owner item 5); DG:162 | toolbar show/hide resize ends the run | no (read as specified): EP/epic-end-of-game-words.md:75 | closed by the 10.9 read (epic Notes :75) | 8 |
| 75 | EP/story-celebration-interruptions-plan.md:155; DG:162 | a back between ☰ and the sheet push is absorbed | no: epic Notes :75 ("☰-then-back … as specified"); F29 back race in rule-coverage Exempt | closed by the 10.9 read (epic Notes :75) | 8 |
| **Item 9, owner calls and declines** | | | | | |
| 76 | EP/…close-out…-plan.md:317 | `onEnd` has no production caller | yes: no `.onEnd(` outside tests; defined `cel/celebration.svelte.ts:317` | declined, AD-19 names `onEnd` | 9 |
| 77 | EP/story-celebration-interruptions.review-log.md:111; EP/story-celebration-interruptions-plan.md:153 (owner item 3); EP/…close-out…-plan.md:160, :400; DG:206, DG:228 (listed as done) | tickets.toml entry 7 `interface` still `end(hide-mode)`, main.ts registrations | yes EP/tickets.toml:124 | declined (not maintained after pull, bmad-preview-ticketing SKILL.md:96) | 9 |
| 78 | DG:162; EP/story-celebration-interruptions-plan.md:155 | bfcache restore mid-run may leave nav's pending pop unsettled (first back absorbed) | yes, not read: epic Notes :75 names no bfcache case | owner call (item 9) | 9 |
| 79 | EP/story-celebration-interruptions.review-log.md:112; EP/story-celebration-interruptions-plan.md:155 | bfcache navigation away may keep the visible branch's outcome announce | yes, unread (`src/ui/end-sheet.ts:52-53` announces when visible at `done`) | owner call (behaviour). FLAG: live, item 9 names only the first-back half | 9 (not named) |
| 80 | RL/10-6-build.md:94 (Result); DG:144 | second finger down before a press skip's lift can tap the just-opened sheet | yes (F18 guard covers presses after the release only, `cel/skip.ts` press tail) | declined, left as built (SPEC F30, SPEC:118) | 9 |
| 81 | RL/10-6-tune.md:20 (dropped as carried), :40 (Result carried); RL/opus-review-epic-10.md:84 (pass 3); DG:144 | band no taller than a card gives NaN/Infinity physics | yes `cel/step.ts` launch (no guard; floor − ceiling ≤ card) | declined here, follow-up ticket (SPEC F31, SPEC:119) | 9 |
| 82 | RL/opus-review-epic-10.md:85 (pass 3); EP/story-celebration-step-renderer-and-run-controller.review-log.md:92 ("cap counts simulated time") | below 20 fps a Normal run passes 6 s wall time | yes: `DT_MAX_MS` 50 `cel/step.ts:34`; no low-frame-rate note in SP or EXPERIENCE.md (grep "20 fps", "simulated") | owner call answered: kept (SPEC F32, SPEC:120); the EXPERIENCE.md Motion / AD-19 note is a close-out doc for the retrospective, not edited here | 9 |
| 83 | RL/10-9-build.md:33-36 (minors 3-6); RL/10-8-build.md:28 (minor 2); RL/10-4-build.md:30 (pass 2 minor 2); RL/10-6-build.md:89 (pass 4 minor 6); RL/10-6-tune2.md:23-24 (minors 6-7); RL/opus-review-epic-10.md:32, :60, :61, :87, :106 (plan/log attributions) | done tickets' plan and log errata | yes (text in done plans/logs) | declined, one row group: done records not rewritten | 9 |
| **Other (not named by items 1-9)** | | | | | |
| 84 | RL/10-2-build.md:22 (pass 2 minor 1) | screens spec `scrollTop > 0` poll assumes overflow in every project | no: viewport pinned 360x740 `e2e/end-sheet.screens.spec.ts:57` in every project | declined, not live | — |
| 85 | RL/10-2-build.md:24 (pass 2 minor 3) | `.word` clamp heuristic; worst-case wide word unmeasured | no: 20-letter test `es:867` (opus pass 2 fix 7) | closed by es:867 | — |
| 86 | RL/10-6-build.md:65-67, :92 (Result spine sync); EP/story-celebration-skip-plan.md:167 (owner item 1); EP/story-celebration-skip.review-log.md:137 | AD-19 Skip: press point not target, chorded/repeat Space prevented, post-run tails, halted pass-through | no: SP:972 | closed by SP:972 (10.9 sync) | — |
| 87 | EP/story-celebration-skip-plan.md:168 (owner item 2); EP/story-celebration-skip.review-log.md:137 | R-87 names only the bars; build exempts the dictionary banner | no: docs/game-flow-spec.md:376 | closed by game-flow-spec.md:376 (52d5aa5) | — |
| 88 | RL/opus-review-epic-10.md:123 (Result owner close-out); RL/opus-review-epic-10.md:80 (pass 3 major 2) | AD-19 Rule bullet 1 and SPEC CAP-2/F3 should name the launch origin | no: SP:966, SPEC:33, SPEC:91 | closed by SP:966, SPEC:33, :91 | — |
| 89 | RL/opus-review-epic-10.md:105 (pass 4 minor 1) | SPEC CAP-5 success line does not list the CAP-2/F3 amendment | no: CAP-2/F3 already amended (row 88); CAP-5 SPEC:47-49 | declined, obsolete | — |
| 90 | RL/10-9-build.md:31 (minor 1) | plan `built` without one green `test:all` | no: test:all green at 169c6bc (DG:221) and 6c2042d (DG:228) | closed by DG:221, :228 | — |
| 91 | EP/story-celebration-step-renderer-and-run-controller.review-log.md:90 (open major); DG:39 | ticket 10.3 Verify lacks `advance` no-op and `setManual` clauses | no in code/tests (10.3 plan :114; `cel/celebration.svelte.ts:332`); ticket text unchanged | declined: done ticket text, covered by the plan's AC and tests | — |
| 92 | EP/story-celebration-step-renderer-and-run-controller.review-log.md:92 (perf-fallback note) | no performance fallback note | no: owner read "long list smooth" (epic Notes :75) | declined, obsolete | — |
| 93 | EP/story-celebration-step-renderer-and-run-controller.review-log.md:92 (registration API, unmount) | registration API name and unmount counterpart | no: `register` prop, `register([])` on destroy `cel/Celebration.svelte:37-40` | closed by Celebration.svelte:37-40 | — |
| 94 | EP/story-celebration-step-renderer-and-run-controller.review-log.md:92 (resize mid-run) | resize mid-run unhandled | no: `cel/interruptions.ts`; tests `cel/attached.test.ts:563` | closed by interruptions.ts (10.7) | — |
| 95 | EP/story-celebration-step-renderer-and-run-controller.review-log.md:92 (realistic 10-letter `rowScale`, "large list" size) | no realistic 10-letter scale case; large-list size unstated | no: fixture/long-list scenes `cel/step.test.ts:1100-1127` (scale pin :1125), `fixtures/session-won-long-words.json` | closed by step.test.ts:1100-1127 (10.9) | — |
| 96 | EP/story-celebration-overlay-entry.review-log.md:129 (hide `done`); EP/story-celebration-interruptions-plan.md:151 (owner item 1); DG:162 (items 1-2), DG:175; EP/story-celebration-interruptions.review-log.md:102 (dropped deferred open) | hide via plain `end()` (rule 7) and the dropped raced menu open | no: SPEC F28, F29; SP:968 Hide | closed by SPEC F28/F29, SP:968 | — |
| 97 | EP/story-celebration-overlay-entry.review-log.md:130; EP/story-celebration-skip.review-log.md:144; DG:65, :77, :91, :130 | ☰/`M` mid-run halts until 10.7: no merge before 10.7 | no: `src/ui/open-menu.ts`, `cel/attached.test.ts:608-652`; DG:175 "merge blocker is closed" | closed by 10.7 (DG:175) | — |
| 98 | DG:51, DG:65 (five spine readings a-e; three minors left for the build), DG:162 (`openMenu()` in open-menu.ts); EP/story-celebration-interruptions-plan.md:154 (owner item 4) | spine readings a-e and the open-menu.ts interface deviation wait for 10.9 | no: SP:656 (celebration entry), SP:417, SP:968; 10.4 plan :136/:165 resolved its 13 minors | closed by the 10.9 spine sync (SP:656, :968) | — |
| 99 | EP/story-win-trigger-and-celebration-test-seam.review-log.md:145; DG:77 | hidden-at-settle / reduced / disabled no-push paths need the owner | no: SPEC F16 (SPEC:104) | closed by SPEC F16 | — |
| 100 | EP/story-celebration-skip.review-log.md:143; DG:144 (40 % floor, 23-letter row, hundreds of copies, per-word tempo); DG:206 (21 words, 161 copies, non-English words, 360x740 pacing) | long-list device read items and fixture shortfall | no: epic Notes :75 (A-D12 accepted at 0.553, long list smooth) | closed by the 10.9 read (epic Notes :75) | — |
| 101 | EP/story-celebration-interruptions-plan.md:155 ("sheet push after the hide callback") | Android handling of the sheet push after the hide callback | no: epic Notes :75 ("hide path … as specified") | closed by the 10.9 read | — |
| 102 | DG:104 (Verify line Space/Esc project), DG:130; EP/story-celebration-skip.review-log.md:133 | Space/Esc row is `desktop`, Verify said `android` | no: 10.6 plan AC 1 (EP/story-celebration-skip-plan.md:153) | closed by skip plan :153 | — |
| 103 | DG:65, :77 (plan checkpoint built unattended), DG:104, :130 (done checkpoint stop) | owner checkpoint items to read | no: tickets 10.4-10.9 done (DG:57, :83, :136, :175, :179, :227) | closed (procedural) | — |
| 104 | DG:187 (5× slowdown margin) | natural finish could stand in for a skip on a ~5× slower runner | no defect: Confirm-to-skip 942-985 ms vs ≈5.8 s, 1 s bound `ds:115`, :129 (10.8 plan :66) | declined, recorded margin only | — |
| 105 | DG:187, DG:206 (stale `10.6-C3.done.pid`, handoff JSON) | autopilot startup notes | not repo code | declined, autopilot procedure | — |
| 106 | EP/…close-out…-plan.md:313, :405; DG:206; EP/story-close-out-documents-agents-pitfall-and-device-check.review-log.md:148 | Notes bullet 1 names only "the AGENTS.md pitfall"; build read it as covering the Conventions-line exception | no: both AGENTS.md lines present (Conventions "except the win celebration's copies", Known pitfalls); 10.9 done (DG:227) | declined: done ticket wording, owner accepted at done | — |
| 107 | EP/…close-out…-plan.md:95, :335; EP/story-close-out-documents-agents-pitfall-and-device-check.review-log.md:146 | warm unit median measured on the bind mount (22.9 s), 5 s Linux budget unjudged | unmeasured on a Linux clone | declined as a finding: measured by item 10 (budget check, no fix) | 10 |
| 108 | DG:28 ("unapplied minors handed to the build"), DG:91 ("5 code-review minors"), DG:130 ("two minors") | pointers to minors | dup of rows 43-45, 18, 32, 53, 54, 84, 85, 70, 102 | merged (see those rows) | — |
| 109 | Appendix B Item 6 residual (planning) | a press after the guard floor but before its timer fires passes untracked after `openDeferred` (motion.ts:342, :417-419) and could arm a long-press timer | unverified in a browser (a scrim hit would resolve OUTSIDE) | owner call (awareness only; `cancelGesture()` before `openDeferred` would not close it) | 6 |
| 110 | build of this ticket (I3.j probe) | `es:350` 'AD-13 R-62 a win by Redo while a sticky WordCell view is open …' is vacuous: the Undo of the finish closes the view, so no view is open at the Redo | yes (probe, cells 6-8 of `session-won`) | owner call (test design; see row 45) | — |

## Auto Run Result

**Summary:** Ticket 10.10 sweep built. Scope items 1-7 applied:
- comments and titles;
- unit and e2e tightening;
- the lint warning removed;
- the Svelte `binding_property_non_reactive` warning removed with an attachment (seam-on capture: 10 hits at HEAD, 0 after);
- item 6 declined with a committed guard test;
- the two decided doc syncs.

Items 5 and 10 were measured at 767ed42. Item 11 is Appendix C: 151 source findings merged into 110 rows, with rows 109 and 110 added by the build. Stops at `built` for the owner's done checkpoint (ticket Description).

**Commits (local, not pushed):**
- `767ed42` the cleanup;
- `013200e` the plan;
- `af1ed54` the review fixes;
- the plan finalization commit.

**Files changed:**
- `src/ui/celebration/step.ts`, `skip.ts`, `interruptions.ts`, `celebration.svelte.ts`, `src/shell/test-hook.ts` -- comments only (item 1).
- `src/ui/celebration/Celebration.svelte` -- `{@attach keep(g)}` replaces `bind:this` (item 4).
- `src/ui/celebration/step.test.ts`, `Celebration.test.ts`, `celebration.svelte.test.ts`, `attached.test.ts`, `src/ui/overlays.svelte.test.ts`, `src/ui/keys.test.ts`, `src/ui/end-sheet.test.ts`, `src/engine/view.test.ts` -- item 2 tests.
- `src/ui/gestures/controller.test.ts` -- item 6 guard test.
- `e2e/celebration.spec.ts`, `e2e/end-sheet.spec.ts`, `e2e/pwa/dist-smoke.spec.ts`, `e2e/helpers.spec.ts`, `e2e/helpers/celebration.ts`, `e2e/win-guard.spec.ts` -- item 3.
- `DESIGN.md` A-D12 and the epic References F-range -- item 7.

**Review:** thorough, 4 lenses, 24 findings (high 0, medium 0, low 20, false 4):
- 7 root causes patched, all low (af1ed54);
- 1 deferred (item 4 has no lasting console check, low);
- 12 low and 4 false rejected, each with its reason in the Review Triage Log.

`followup_review_recommended: false`: no high was patched, and no medium.

**Verification (final):**
- `npm run test:all` at af1ed54 is green:
  - lint 0 warnings;
  - check 0 errors;
  - unit 3609 passed;
  - build `total 559956 / 600000`;
  - dist 21 passed;
  - e2e 1098 passed;
  - pwa 17 passed.
- `npm run test:screens` (Docker) at af1ed54: 67 passed, 39 skipped, no `*-snapshots` change.
- Item 4 capture re-run by the orchestrator at 013200e: 0 hits, groups mounted.
- Item 5: 0/3 for all five named rows and no other failure (at 767ed42).
- Item 10 at 767ed42:
  - margin 40043;
  - package, deal, session, history and serialize diffs from 19acd17 empty;
  - fixtures diff from 728b18a empty;
  - warm unit median on a fresh ext4 clone 4.32 s (Vitest Duration; wall time including npx start-up 4.87-5.01 s).

**For the owner (done checkpoint):**
- **Owner-call rows:**
  - 40 (I3.c: the fixture stores no `wordcell:history`, so there is no record to pin);
  - 45 and 110 (I3.j: the Undo of the finish closes the sticky view, and the existing es:350 R-62 row is vacuous);
  - 63 (spine AD-17 `doubleTap`: the digest claims it was applied, but it is not);
  - 64 (DESIGN.md:692);
  - 78 and 79 (bfcache);
  - 109 (item 6 residual, awareness only).
- **Declined but flagged:**
  - 41 (ticket item 8 mis-cites opus GAVE_ROWS as closed; the Undo-then-Give-up path es:944-946 is still weak);
  - 12 (epic Notes wording).
- **Doc proposals (Appendix B, old → new):**
  - AD-17 Touch `doubleTap`;
  - DESIGN.md:692;
  - F32 notes for EXPERIENCE.md:414 and AD-19 :971;
  - F31 follow-up ticket (retrospective).
- **Check:** the item 10 figures.

**Residual risks:**
- The warm unit median is 4.32 s against 5 s. Wall time including npx start-up touched 5.01 s once.
- The watch re-run < 1 s budget was not measured.
