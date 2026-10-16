---
epic: epic-game-surfaces-and-keyboard
date: 2026-10-16
verdict: accepted-with-open-items
criteria: declared
headless: false
---

# Retrospective: epic-game-surfaces-and-keyboard (epic 6)

Interactive run. The owner gave no separate going-in concerns; the carry-over list in the resume prompt and the three open 6.13 test gaps weighted the analysis. The team discussion was not requested.

## Epic summary

- Epic file: `epic-game-surfaces-and-keyboard.md` (risk high, after `epic-tray-and-place`, status still `in-progress`). Branch `epic-6-surfaces`, cut from `epic-5-tray`; HEAD `b872972`. Epic 5 is already on `main` (`db1ca56`), so the branch is 197 commits ahead of `main`.
- Tickets, build order from `tickets.py status`: 6.1 to 6.17. All 17 are `status: done`, `state: done`; none is at `built`, so `pending_tickets` is empty.
- Range: one epic-wide range `a27a690..HEAD` (6.1's baseline, the oldest; the plans' baselines are linear). The end is inferred (HEAD, no later work). `git_evidence.py`: 181 commits, 0 merges. Per-ticket attribution by commit subject is weak (many WIP and review-log commits); each plan's `baseline_revision` is the provenance.
- Engine delta: none. Shell delta: `src/shell/game.svelte.ts` +14 (`elapsedMs`, ticket 6.4) and `src/shell/nav.ts` +15 (`settled`, `whenSettled`, ticket 6.10), with tests. Everything else is `src/ui/`, `e2e/`, `fixtures/`, docs.
- Evidence available: epic file, 17 tickets with plans and review logs, SPEC, `rule-coverage.md`, `build-notes.md`, the autopilot digest and handoff, the previous retro, git. Missing: raw session transcripts. Process findings rest on the digest only (narrowed scope).

## Findings

Sources are relative to the repo root. Dispositions: fix, defer, accept.

### Aggregate views

**Architecture delta.** No layering violation found. The two shell additions are the only departures from the epic's Boundaries ("a shell change beyond what AD-9/AD-13 already provide" is out of scope). Both are small read-only or queue helpers; `nav.whenSettled` is not yet in the spine (F-1). Source: `git diff a27a690..HEAD -- src/shell`. The `src/architecture-*.test.ts` scans pass inside the 2755 unit tests I ran.

**Size growth.** Nothing near a god-class. The biggest new non-test files are `src/ui/keys.ts` (563 lines, new in 6.10/6.11), `src/ui/text.ts` (87 to 390, the message catalogue, expected), `src/ui/gestures/controller.ts` (990 to 1078, +9 %, after epic 5's split) and `src/ui/overlays.svelte.ts` (279 to 361). `git_evidence.py` file ranking, `wc -l`. Checked and clean.

**Duplication map (F-2, defer, owner-recorded).** The 6.16 inventory found several near-duplicate shapes it deliberately did not touch because merging changes behaviour: `keys.ts` view row vs `Controller.activate` (D4, sequences differ for Composing/Place and Space reopen) and the presence and exit rendering across `Panel`, `Dialog`, `Sheet` and `WordCellView` (D5, D6, D8, D9, D16). Source: `story-refactor-sweep-code-plan.md` inventory rows D4 to D9, D16. These are recorded for the owner; I did not re-derive them. Disposition: defer.

**Pattern divergence.** The scan of the non-test diff finds no `console.`, `Math.random` or new `catch`. One `biome-ignore noUnusedImports` per Svelte component (the accepted Biome limitation, repeated). Two items conflict with AGENTS.md rule 6 or its spirit:
- F-3 (defer, owner): `open-surface.ts` throws before clearing on a modal notice, but the clearing steps run before `overlays.open` when `id === 'resetConfirm'` sits over the History notice with a sticky view or tail selection beneath; the 6.1 build reported this as a latent AD-13 throw, no opener calls it that way yet (digest 6.1 "Worth knowing"; sweep row D7). The code is unchanged since (`src/ui/open-surface.ts:20-33`). I did not reproduce it; it is a latent bug, not a known failure.
- F-4 (defer, owner): silent focus guards and `presence` skips (D5, D6, D8, D9) are the kind of silent skip rule 6 discourages; the sweep recorded them for the owner instead of changing behaviour.

**Spec-to-implementation reconciliation.** Done when 1 to 6 are met (see verdict). Divergences and doc debt:
- F-1 (fix, owner docs): the owner-visible doc edits are collected but applied by no ticket, by design (`build-notes.md` "Close-out edits", 6.17). They are: EXPERIENCE.md Accessibility Floor and SPEC CAP-11 (buried WordCell cards `aria-hidden`, owner 2026-10-15); SPEC CAP-5 "(none: opens at once)" vs F23; spine AD-13 `nav.settled`/`whenSettled` and the "menu plus confirm" wording; the EXPERIENCE.md message catalogue (How to play close control, screen-reader names, live-region strings); EXPERIENCE.md Idle/pending-draft row and DESIGN.md Tray band (360 px never wraps); DESIGN.md focus ring (inside the card). Plus D45: EXPERIENCE.md Keyboard roving text vs the one-Tab-stop-per-column decision was never re-read.
- F-5 (fix, owner docs): the 6.10 owner decision (Validate, Confirm and Flip close an open word view first) is in the ticket Notes but not in EXPERIENCE.md Keyboard / word view rows. The EXPERIENCE.md Rating bands / How to play content (band names plus scores, owner 2026-10-15) is likewise only in the ticket and `text.ts`. Neither is in `build-notes.md` "Close-out edits" (the Rating bands row is noted as "already satisfied"; the Keyboard/word-view row is not listed). Source: `story-keyboard-overlay-keys-f39-and-stale-tile-selection.md` Notes; `build-notes.md` last bullet of the close-out section.
- F-6 (fix, owner docs): the `shell` additions `elapsedMs` (AD-9) are not described in the spine; the epic's Boundaries allowed only what AD-9 and AD-13 already provided. Propose a one-line AD-9 mention with the AD-13 edit.

### Diff-scope review (narrowed)

`bmad-review` was not invoked: the diff is about 180 commits, and every ticket already had a code-review loop with a log. I ran the adversarial, edge-case and verification-gap lenses inline over the review logs, the plans' deferred lists and the boundary items. Narrowing: no fresh line-by-line read of the 17 tickets' code. Boundary findings:

- F-7 (fix, tests): the three majors from the 6.13 code review's second pass were never fixed. The loop stopped as diverging (majors 1, then 3), and the digest's "test-strength fixes applied" describes pass 1 only. No commit after `a90805c` touches `src/ui/announce.test.ts`, `src/ui/labels.test.ts` or `e2e/screen-reader.spec.ts` (`git log a90805c..HEAD` on those paths is empty). The gaps, from `_bmad-output/implementation-artifacts/review-loop/6-13-build.md` § Pass 2:
  - the no-op test (`src/ui/announce.test.ts:140`) uses `flip` with an unchanged phase and passes with the `!result.changed` guard deleted;
  - the relaunch-is-silent e2e (`e2e/screen-reader.spec.ts:221`, `:228`) attaches `recordRegion` after boot, so a boot-time announcement is missed;
  - the `selected` state is tested with a one-card tail only (`src/ui/labels.test.ts:67`).
  The `AD-3 a no-op dispatch (changed false)` test is the sole proof of the "no-op announces nothing" rule. Disposition: fix (A1).
- F-8 (fix, tests): the 6.14 review noted two wheel unit cases that pass on a no-scroll implementation (`controller.test.ts`, "AD-12 F3 a wheel during a mouse column drag"), and hover-peek re-anchor has no Vitest of its own, only the desktop e2e (`e2e/hover-peek-reanchor.spec.ts`). Disposition: fix, low priority (A2).
- F-9 (accept): bfcache hide flush (epic 4 retro F7) did not reproduce in two attempts (`build-notes.md` Carry-ins); no test was added. Accepted non-reproduction (SPEC CAP-12 "not a bug"). A later bfcache report would reopen it.
- F-10 (defer): two Playwright cases are unit-tested only because no fixture exists (M during a touch peek; Undo disabled with a sticky view open), per the 6.10 digest. Disposition: defer.
- F-11 (defer, owner): the unapplied minors from the 6.11 review (static mirrors not asserted tabindex-free; Enter/Space on column cards tested only with a mocked controller; Space on a WordCell with an open view closes and reopens it) are recorded in `review-loop/6-11-build.md`. The Space reopen is a behaviour question (D4/D44), so the owner decides.
- F-12 (fix, test only): two ticket-review minors for 6.13 and the tickets.toml entry 3 wording remain unsynced (D46 to D48, recorded for the owner; no itemised source rows exist, so I cannot say which minors they were). I treat this as an evidence gap, not a defect.

### Process

- F-13 (process): flaky tests during the epic, all passing alone and on rerun: the 52 px menu row check (sub-pixel, fixed in `9f90cce` by `toBeCloseTo`), `board-keys.spec.ts` winning-commit focus test (one teardown timeout), `drag-interruptions.spec.ts` F32 reduced-motion test (once under load), `success-signal.spec.ts` "same move by drag" (once), load-dependent timing in `wordcell-view` and `board-keys` (digest 6.1, 6.9, 6.12, 6.13, 6.15). Disposition: defer; the 6.15 note suggests a look at the F32 animation test.
- F-14 (process, accept): the 6.15 autopilot run's first `test:all` exited 1 and the automatic rerun passed (`T2`); I did not read the first failure's cause, so it is unexplained. Accepted as the rerun-flake rule, not investigated.
- F-15 (process, positive): ticket review is the dominant cost. Passes: 3 to 7, with 6.1, 6.11 and 6.13 hitting the cap or diverging; ticket review was 37 to 96 % of tokens on several tickets (digest). The cap forced trims that dropped needed sentences (6.13 pass 6, caught in pass 7). The mechanism worked, but an over-budget ticket wastes passes: 6.13's ticket grew to 1497 words against a 1500 budget.
- F-16 (process, positive): owner decisions came as short plain-language questions with a stated default, each recorded in the ticket Notes and SPEC (F6 to F8 and the 2026-10-15 batch). Zero decision was taken silently.
- F-17 (process): the 6.13 digest entry says the diverging review's fixes were applied. They were not (F-7). The digest summary line should say "pass 1 fixes applied; 3 pass-2 majors open".
- F-18 (process): the speed budget. The 6.17 audit measured the unit median at 4.44 s on the Linux filesystem against the 5 s budget; the suite is now 2755 tests in 72 files (it was 2393 in 55 files at epic 5's end, 3.00 s median). The watch re-run was measured as a single-file `vitest run`, not a live watch session (6.17 plan, Residual risks). Margin is 0.56 s. Disposition: defer, but the next epic's tickets will cross 5 s unless the suite is trimmed.

## Behavior verification

The epic changed runtime behaviour (menu, panels, end sheet, keyboard, screen-reader names, winning guard).

- Observed this run: `npm test`: 72 files, 2755 tests passed, 14.8 s wall time on `/mnt/d` (cold; the 5 s budget is measured on the Linux filesystem, see F-18).
- Observed this run: `npx playwright test e2e/surfaces-success.spec.ts e2e/screen-reader.spec.ts e2e/win-guard.spec.ts e2e/wheel-drag.spec.ts`: 149 passed, 149 skipped (project-specific skips), 1.8 min. These are the Success-signal flow (win, Give up, end sheet, Statistics, collapse, New game, timer, How to play, reload), the A-E9 names and live region, the winning guard and the wheel carry-in.
- Reported, not re-run by me: `npm run test:all` exit 0 and `npm run test:screens` 37 passed, 13 skipped, at the 6.17 build (`story-refactor-sweep-paperwork-and-budget-plan.md` Verification). HEAD since then differs only in docs, so I take them as current.
- Not exercised by anyone: a real phone, a real screen reader (VoiceOver, TalkBack, NVDA) and a real bfcache navigation. The live-region and name wording is verified by text assertions, not by listening. No whole-epic hand check on a device is recorded.

## Previous-retro follow-through

Previous retro: `epic-tray-and-place/epic-tray-and-place-retrospective.md`, Action items section present.

| Item (owner) | Landed? | Evidence |
|---|---|---|
| A1 split `controller.ts` along its seams (Dev) | Superseded: done in epic 5's sweep | `controller.ts` is 1078 lines at HEAD (990 at `a27a690`), +9 % over this epic |
| A2 plain `Element` check in `motion.ts` (Dev) | Yes | `grep "typeof .*closest" src/ui` finds nothing |
| A3 to A6 spine, epic file, EXPERIENCE/DESIGN and AGENTS.md reconciliation (Owner) | Yes, recorded as applied in that retro's Resolved section (`41a9765` and the AGENTS.md refresh) | previous retro "Resolved (2026-10-14)"; not re-verified line by line |
| A7 capture = play invariant tests, lookup miss paths (Dev) | No evidence found | not named in any epic 6 ticket or sweep row |
| A8 rewrite the scroll-busy tray-growth e2e (Dev) | No evidence found | not named in any epic 6 ticket or sweep row |
| A9 autopilot to stop or record a Docker check when `test:screens` cannot run (Owner/process) | Not applied; moot this epic | `test:screens` ran in every epic 6 ticket gate from 6.2 (digest) |
| A10 shared `measure` helper | Yes | `src/ui/layout/measure.ts` `measureWidth`, used by ActionBar and WordLine |
| Epic-5 retro Q1: merge and deploy `epic-5-tray` | Yes | `db1ca56 docs(epic-5): mark epic tray-and-place done` is on `main` |
| Epic 4 retro A7 (sticky view over kept selection) | Yes | 6.10 F39 (`commands.test.ts:79`, `keys.spec.ts` F39 cases) |
| Epic 4 retro A8 (wheel, hover-peek, hide-flush, WordCellRow label to text.ts) | Yes, with one accepted non-reproduction | 6.14 (wheel fixed, hover-peek test, bfcache not reproduced), 6.13 (label moved to `text.ts`) |
| L3 keep `test:screens` in every gate | Yes | digest, "screenshots passed" on 6.1 to 6.17 where UI changed |

## Action items

All are proposals; none is applied. "Docs" means an owner-visible document.

| # | Action | Owner | Kind |
|---|---|---|---|
| A1 | Fix the three open 6.13 test gaps: a no-op test that fails without the `changed` guard; attach `recordRegion` before boot (or assert the region is empty) in the two relaunch specs; a `selected` case with a tail of two or more cards | Dev (small code ticket) | Remediation (F-7) |
| A2 | Strengthen the two wheel unit cases so they fail on a no-scroll implementation; add a Vitest for the hover-peek re-anchor | Dev | Remediation, low (F-8) |
| A3 | Apply the `build-notes.md` "Close-out edits" list: EXPERIENCE.md Accessibility Floor and Message catalogue and Idle/pending-draft row, DESIGN.md Tray band and focus ring, SPEC CAP-5 and CAP-11, spine AD-13 (`nav.settled`/`whenSettled`, "menu plus confirm") | Owner | Spec reconciliation, docs (F-1) |
| A4 | Add to that list and apply: EXPERIENCE.md Keyboard / word view rows (Validate, Confirm, Flip close an open view first), the roving text (one Tab stop per column, D45), the spine AD-9 `elapsedMs` mention | Owner | Spec reconciliation, docs (F-5, F-6) |
| A5 | Regenerate the two `board-idle-pending-draft` baselines (android, desktop) with `npm run test:screens`; skim the new 6.11 and 6.12 baselines (inside focus ring) | Owner/Dev | Carry-over |
| A6 | Skim the 6.9 How to play wording against the checklist in the ticket Notes; skim the new screen-reader strings (`build-notes.md` "Live region strings") | Owner | Review |
| A7 | Decide D4/D5 to D9/D16/F-3 (the behaviour-changing sweep leftovers: `keys.ts` vs `Controller.activate`, presence and exit rendering, the latent `openSurface('resetConfirm')` throw) and, if wanted, schedule a bug-fix ticket for F-3 | Owner | Decision |
| A8 | Trim the unit suite or accept a higher budget before the next epic: 4.44 s median against 5 s, 2755 tests; measure a live watch re-run | Owner/Dev | Process (F-18) |
| A9 | Autopilot digest: state "fixes applied" only for the passes whose majors were fixed, and list unfixed majors as open (F-17) | Process | Process |
| A10 | Device checks before release: one real-phone pass of the Success signal and a TalkBack or VoiceOver pass over the names and announcements (epic 7 scope) | Owner | Verification |

Needs the owner: A3 to A7, A10. A1, A2, A8 and A9 are technical defaults for the dev loop.

### Resolved (2026-10-16)

Applied after the owner's go-ahead; each is its own commit on `epic-6-surfaces`, nothing pushed.

- A1 done (`ee6085a`): the no-op announce test now covers a phase change, a commit, Undo and Redo and fails without the `changed` guard (checked by removing it); the two relaunch specs record from before boot (`recordRegionFromBoot`) with an Undo positive control; a two-card tail reads `selected` on both cards. F-7 closed.
- A3 and A4 done (`f0c571e`): every `build-notes.md` close-out edit is applied, plus the four additions (Validate, Confirm and Flip close an open word view first; one Tab stop per column; the AD-9 `elapsedMs` mention; Space on an open WordCell only closes it). F-1, F-5 and F-6 closed.
- F-3 fixed (`ee6085a`): reproduced first (`AD-13 close(wordcellView) while the top is historyNotice`), then `openSurface('resetConfirm')` over the History notice leaves what is beneath it alone; a test covers a view, a tail selection and a peek beneath.
- Owner decision (2026-10-16): Space on a WordCell whose view is open only closes it (`ee6085a`, test in `src/ui/keys.test.ts`). F-11's Space question is closed; the other F-11 minors stay recorded.
- A5 partly done (`853ab41`): the two `board-idle-pending-draft` baselines (android, desktop) are regenerated in the Playwright container with the wider gap before the dot. The owner skim of the 6.11 and 6.12 baselines is not recorded.
- A8 measured, not changed: median 4.35 s of 5 s over five warm runs on a Linux-filesystem clone (wall time including the pretest); `controller.test.ts` alone about 2.7 s and unsplit by owner decision F41. A live watch re-run was not measured. `npm run test:all` exit 0 after these changes.
- A2 done for the wheel (this commit): with the scroll handler disabled only one wheel test passed for the wrong reason (`a small wheel scroll during a free-letter drag keeps the gap…`); it now asserts the face follows the scroll (190 + 10 px) and fails without the listener (checked by disabling `rescroll`). The other tests that pass without the handler are legitimate no-op or listener checks. The hover-peek re-anchor stays covered by the desktop e2e only: it depends on real layout (`getBoundingClientRect`), which the node-environment unit tests can only fake, so a Vitest would add little; accepted.
- Owner decision (2026-10-16): the remaining owner items are left unreviewed and any problem is fixed when it arises: A6 (6.9 wording, screen-reader strings, 6.11 and 6.12 baselines), A7 (D4 to D9 and D16 sweep leftovers), A10 (device checks). A9 (autopilot Docker-check lesson) is moot and dropped. F-18 (unit-time headroom, 4.35 s of 5 s) is noted, not acted on.
- Still open: Done when 7 (mark the epic done; merge and deploy go-ahead).

## Acceptance verdict

**accepted-with-open-items**, criteria declared (the epic file has Done when). Every ticket is finished, so the unfinished-ticket rule does not apply.

1. Done when 1 (`test:all` and `test:screens` green; every P6 `rule-coverage.md` row has a passing `android` test, `desktop` where stated): **met**. Evidence: 6.17 plan Verification (`test:all` exit 0, 37 screenshots passed, every P6 row covered, three row texts corrected), plus `npm test` 2755 passing in this run.
2. Done when 2 (win and Give up on android, end sheet content, Undo closes it, New game, Replay, Statistics counts the game): **met**, `e2e/surfaces-success.spec.ts` and `e2e/win-guard.spec.ts`, passing in this run.
3. Done when 3 (menu opens every panel and dialog; confirms only while a game is in progress; back closes the topmost surface and never undoes): **met** by the 6.2, 6.3 and 6.10 specs (`menu.spec.ts`, `confirm` and `keys.spec.ts` rows in the 6.17 audit table).
4. Done when 4 (desktop keyboard-only move; Undo, Redo, menu and keys close an open view first, never throw): **met**, `e2e/keys.spec.ts` F39 cases, the desktop keyboard flow in `surfaces-success.spec.ts`.
5. Done when 5 (winning guard): **met**, `e2e/win-guard.spec.ts` passing in this run.
6. Done when 6 (accessible names and live region): **met** by text assertions in `src/ui/labels.test.ts`, `src/ui/announce.test.ts` and `e2e/screen-reader.spec.ts` (passing in this run), with the F-7 test-strength gaps open and no real screen-reader pass.
7. Done when 7 (merge and deploy on the owner's go-ahead): **open**. No go-ahead has been given for epic 6; this retro does not merge or deploy.

Open items carried (after the 2026-10-16 fixes, see Resolved above): F-8 (A2), F-18, the sweep leftovers in A7 and the owner reviews in A5 (6.11 and 6.12 baselines), A6 and A10. F-1, F-3, F-5, F-6, F-7 and F-11's Space question are closed. None is a failing criterion.

## Open questions

1. Done when 7 (still open): do you give the go-ahead to merge `epic-6-surfaces` and deploy, once you have applied or declined the doc edits in A3 and A4? Nothing in this retro changes that call, but the merge is owner-gated.
2. (Answered 2026-10-16: applied, `f0c571e`.) A3, A4: shall I apply the close-out doc edits for you (they are exact old/new text in `build-notes.md`), or do you want to apply them yourself?
3. (Answered 2026-10-16: fixed, `ee6085a`.) F-3: do you want the latent `openSurface('resetConfirm')` over the History notice fixed as a small ticket now, or left until an opener can reach it?
4. (Answered 2026-10-16: just close, `ee6085a`.) F-11 / D4: Space on a WordCell with an open view closes and reopens it. Is that the behaviour you want, or should it just close the view?
