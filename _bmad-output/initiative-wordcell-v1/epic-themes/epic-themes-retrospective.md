---
epic: epic-themes
date: 2026-10-19
verdict: accepted-with-open-items
criteria: declared
headless: false
---

# Retrospective: epic 9, Alternate visual themes

## Epic summary

Branch `epic-9-themes`. All eleven tickets are `done` (`tickets.py status`, `pending_tickets` empty, none left at `built`): 9.1 research brief, 9.2 decisions into spec, UX and spine, 9.3 token plumbing and contrast harness, 9.4 theme preference and pre-paint apply, 9.5 art layer, 9.6 Daylight Paper, 9.7 Deep Space, 9.8 Greenhouse Dusk, 9.9 Brass and Walnut, 9.10 Plum Dusk, 9.11 refactor sweep.

Ranges: one range for the code tickets, `1e8ea3f^..HEAD` (89 commits, 1 merge, 131 files), since each plan's baseline follows on from the last and the plans of 9.1 and 9.2 (documents only, no `baseline_revision`) have no range of their own. Baselines: 9.3 `1e8ea3f`, 9.4 `e89feb4`, 9.5 `f52f803`, 9.6 `c24825e`, 9.7 `2a696af`, 9.8 `f793042`, 9.9 `e4176e6`, 9.10 `95dd9d1`, 9.11 `e701292`. The range runs to `HEAD` (inferred, no later non-epic work).

Evidence available: epic file, eleven plans, ticket review logs, code review logs (`_bmad-output/implementation-artifacts/review-loop/9-*-build.md`), the autopilot digest `epic-themes-20261018-1343.md` and handoff, `git_evidence.py` output, the previous retro. Missing: conversation session logs (process lessons rest on the digest only); 9.1 and 9.2 have no plan baseline.

Going-in concerns were not asked: the owner resumed under autopilot and the retro ran in one pass.

## Findings

| # | Finding | Source | Disposition |
|---|---|---|---|
| F-1 | Done when 1 to 5 each met (see Verdict). Unit suite 3033 passed in 80 files this run; the theme e2e specs passed on `android` (25 of 25). | `npm test`; `npx playwright test e2e/theme.spec.ts e2e/theme-art.spec.ts --project=android`; digest 9.11 (`test:all` and 62 screenshots passed) | Accept |
| F-2 | Desktop keyboard and teardown tests failed under full-suite load in five tickets (9.3, 9.4, 9.5, 9.7, 9.8), each a different test, each passing alone. 9.11's flake run (10 repeats of the board-key specs) found 0 failures and changed nothing. Not tied to the theme code. | Digest entries 9.3, 9.4, 9.5, 9.7, 9.8, 9.11 | Defer: watch; if it returns, a ticket outside this epic owns it |
| F-3 | Review cost grew with each ticket: 2.0M tokens at 9.6 to 5.9M at 9.11; ticket review was 57% to 62% of the spend on 9.10 and 9.11. 9.11 was a 121-word stub that took 6 review passes with no budget cap. | Digest entries 9.6, 9.9, 9.10, 9.11 | Process lesson (A3) |
| F-4 | The same gap as the previous retro's A6 recurred: the ticket review's unapplied minors were not passed into the build prompt (9.9). Code review found nothing, so no defect followed. | Digest 9.9 "Worth knowing"; previous retro A6 | Process lesson (A4) |
| F-5 | Test-hardening minors stay open: unapplied 9.5 items (main.ts dev-await note, geometry required on rect/circle, alpha<1 fail-fast, data-URI scan corner case) and per-theme minors 9.6 to 9.10 (contrast ratio not recorded per texture, art tokens unpinned, build-output checks match substrings). Owner decided on 2026-10-19 that they stay deferred. | 9.11 plan section 6 "Deferred findings"; handoff | Defer (owner decision) |
| F-6 | Plum Dusk retired the end-to-end test for Halted on an unregistered stored theme, since no unregistered theme remains. `theme.spec.ts` line 339 covers an unknown stored value booting the default (Q-36), so the loss may be partial or none. Not re-checked beyond that line. | Digest 9.10; `e2e/theme.spec.ts:339` | Defer: dev confirms (A5) |
| F-7 | Cold start of a light or plum theme shows one frame of the dark default (status-bar tint `#15171B` against plum page `#17121C`; dark installed-app splash). Owner accepted, AD-16 unchanged. | Digest 9.4, 9.6, 9.10; handoff | Accept (owner, 2026-10-19) |
| F-8 | `--wc-hairline` has no production read; no opacity ceiling on table art. Owner decided to keep the token and set no ceiling. | Handoff; 9.11 plan item 3 | Accept (owner) |
| F-9 | Docs landed: Q-45 and §7.10 list the six themes; spine mentions theme 15 times; DESIGN.md contrast floors and the stale Themes sentence were fixed in `0306917`; `tickets.toml` entry 6 `after` aligned in `39eff1e`. | `docs/game-flow-spec.md:406,478`; commits | Accept, no close-out doc edits remain |
| F-10 | Bundle margin recorded: 551,996 of 600,000 bytes, 48,004 spare, no new dependency. Five themes with art cost about 52,000 bytes against epic 8's margin of 50,371, so the budget now has room for roughly one more art theme. | 9.11 plan section 4; digest 9.11; previous retro Done when 4 | Accept; note for the next visual epic |
| F-11 | `main` has moved on since this branch was cut (epic 8 merge `a6bc586`, rating band commits `c640608`, `bb7f062`); `epic-9-themes` is not a descendant of `main`. A merge is the owner's go-ahead. | `git merge-base --is-ancestor main epic-9-themes` printed nothing | Open (A6) |

Diff-scope lenses: the epic touched `src/ui/theme/*` (new), `app.css`, prefs, `index.html` and tests, with no engine change (`git diff --stat -- src`: 20 files, 1918 insertions, 44 deletions, none under `src/engine`). The seam between 9.5 (art layer) and 9.7 to 9.10 (art users) has the largest shared surface (`art.ts`, `contrast.test.ts`), and both were re-reviewed in every theme ticket; no cross-ticket defect found. I did not run `bmad-review` as a separate pass, so the adversarial lens was narrowed to this reading of the ranges and the per-ticket code reviews.

## Behavior verification

Run this session: `npm test` (3033 passed) and the theme Playwright specs on `android` (25 passed: switching each theme, reload keeps it, no `prefers-color-scheme` following, unknown stored value boots the default). Not run by me: `test:all`, `test:screens` (taken from the 9.11 digest), Android play-tests of each theme (the owner did them and marked 9.11 done).

## Previous-retro follow-through

Previous epic: `epic-how-to-play-scenes` (its retro).

| Item (owner) | Landed? | Evidence |
|---|---|---|
| A1 read the five scene captions (Owner) | Yes: owner read them in the app | epic 8 Notes, Decision 2026-10-20 |
| A2 reword epic 8 Boundaries for `scene-replay.ts` (Owner) | Yes | epic 8 file Boundaries and Notes, 2026-10-20 |
| A3 scoring-script tests (Dev) | No evidence found | not checked in code |
| A4 sync `tickets.toml` entries 7 and 11 (Owner/Dev) | No evidence found for 7 and 11; entry 6 of this epic was synced in `39eff1e` | |
| A5 done checkpoint on first full composition (process) | Not applicable to this epic's shape; 9.3 and 9.4 carried a plan checkpoint | digest 9.3, 9.4 |
| A6 pass unapplied minors into builds (process) | No: recurred (F-4) | digest 9.9 |
| A7 mark epic 8 done, merge | Yes: epic 8 is `done` and merged (`a6bc586`) | `tickets.py status`; `git log main` |

## Action items

All are proposals; none is applied.

| # | Action | Owner | Kind |
|---|---|---|---|
| A1 | Mark epic 9 done (owner accepted, 2026-10-20: done) | Owner | Gate, resolved |
| A2 | Epic 8's A1 (caption read) and A2 (Boundaries wording): resolved by the owner 2026-10-20 | Owner | Docs, resolved |
| A3 | For stub tickets (under about 300 words) keep the review budget cap of 1500 in the autopilot prompt, and consider capping ticket review passes at 4 when majors have fallen to 0 | Process | Lesson |
| A4 | Have the autopilot append the ticket review's unapplied minors to every build prompt (second time seen) | Process | Lesson |
| A5 | Confirm the unknown-stored-theme boot path is covered after the Halted test was retired (`e2e/theme.spec.ts:339` looks sufficient) | Dev, small | Remediation, low |
| A6 | Merge `epic-9-themes` to `main` and deploy (owner go-ahead 2026-10-20) | Owner | Gate, resolved |
| A7 | Next visual epic: budget for the 48,004-byte margin before adding art | Owner | Process note |

Resolved by the owner on 2026-10-20: A1, A2, A6. A3 to A5 and A7 are technical defaults for the dev loop.

## Acceptance verdict

**accepted-with-open-items**, criteria declared (the epic file's Done when). All eleven tickets are finished, so the unfinished-ticket rule does not apply.

1. Research brief and owner's pick recorded: met (`research/brief.md`; epic Notes decision, 2026-10-18).
2. `test:all` and `test:screens` green, default baselines untouched, a set per theme: met as of 9.11 (62 screenshots passed); I did not rerun them.
3. Android theme switch, root attribute, reload keeps it: met (`e2e/theme.spec.ts` passed on `android` this run).
4. Contrast test per theme and no colour literal outside tokens: met (`src/ui/theme/contrast.test.ts`, `colour-literals.test.ts` in the 3033 passing).
5. Docs describe the preference and the owner played each theme: met (F-9; owner's Android play-test, handoff).

Open items carried: F-2, F-5, F-6, F-11 and the process lessons. None is a failing criterion.

## Open questions

1. Accept the verdict and mark epic 9 done: answered yes, 2026-10-20.
2. Merge `epic-9-themes` with `main` and deploy: answered go, 2026-10-20.

## Assumptions

None to record: the run was interactive. The epic named in the invocation was `epic-themes`.
