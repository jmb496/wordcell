---
title: 'Refactor sweep: paperwork and budget'
type: 'chore'
ticket: '17'
created: '2026-10-16'
status: built
baseline_revision: 'e7976a0439f9cd71bed12225dd96d0b4d2476812'
route: 'oneshot'
route_source: 'auto'
review: 'quick'
review_source: 'auto'
lenses_ran: [quick]
review_loop_iteration: 0
followup_review_recommended: false
context: []
warnings: []
deferred: []
---

<intent-contract>

## Intent

**Problem:** Epic 6 ends with unaudited paperwork: `rule-coverage.md` has rows no passing test is shown to cover, the unit and size budgets were never measured on the Linux filesystem, and the close-out edits are scattered in notes.

**Approach:** Audit every row against passing tests from this ticket's own `test:all` and `test:screens` runs, correct row text where a test exists, list the owner-facing doc edits in `build-notes.md` (not applied), measure both budgets, and record the retrospective inputs here. No code, test, fixture or baseline changes.

</intent-contract>

## Implementation Notes

Oneshot: paperwork and measurements only (about 60 changed doc lines). Files touched: this plan, `_bmad-output/specs/spec-epic-6-surfaces/build-notes.md` (close-out section extended, loose note converted), `_bmad-output/specs/spec-epic-6-surfaces/rule-coverage.md` (three row-text corrections). Order followed: worklist and close-out lists, static audit, one `test:all` and one `test:screens`, measurements, then this fill-in. `git status --short` after the runs showed a clean tree before the doc edits (no tracked output from the runs). No rerun was needed and no flake was seen.

### Misses

None. Every Verify clause is met (below).

### Worklist (6.16 rows `handed to 6.17`)

The 6.16 plan row reads "D35, D38 (wording), D40, D45, D46-D48" as one grouped row; the individual source rows of D46-D48 are not itemised anywhere in the plan, the review logs or the autopilot digest. Outcomes:

| id | what | outcome |
|---|---|---|
| D35 | CAP-12 rule-coverage gap (no test id carries A8) | applied: the A8 row is split into wheel, hover-peek and bfcache rows, each pointing at its test or at build-notes Carry-ins (bfcache) `accepted non-reproduction` |
| D38 (wording) | catalogue wording of the new strings | applied: listed in the build-notes close-out (Message catalogue entry); the rest of D38 stays `recorded for owner` |
| D40 | build-notes/SPEC/EXPERIENCE/spine edits | applied for the doc edits found by the sweep (build-notes close-out list, 8 entries); any item beyond them is `recorded for owner` |
| D45 | roving-model/doc text | recorded for owner: the one-Tab-stop-per-column decision (2026-10-15) is in the 6.11 ticket, EXPERIENCE.md Keyboard text was not re-read for it |
| D46-D48 | ticket and plan text | recorded for owner: no itemised source rows; known open ticket text is `tickets.toml` entry 3 wording (6.3 digest) and 6.13 ticket test-bullet wording (digest "Ref to fix upstream") |

Close-out edits: see build-notes.md "Close-out edits" (AD-13 entry kept once; added buried cards (EXPERIENCE Accessibility Floor and SPEC CAP-11), SPEC CAP-5, spine AD-13 `nav.settled`, message catalogue, pending-draft 360 px, DESIGN focus ring). Already satisfied, not listed: SPEC F6 and DESIGN Elevation (☰ covered by the sticky view), EXPERIENCE Rating bands English score, Statistics and end-sheet catalogue rows. The loose "Close-out note" line is removed.

### Audit (rule-coverage.md; "passing" = green in this ticket's `test:all` (android and desktop lines of the dev-server run) or `test:screens`; U halves are inside the `npm test` pass, 72 files, 2755 tests)

Row text corrected where noted; line numbers are the spec files at HEAD.

| Row | Test (file:line, project) | Result |
|---|---|---|
| R-62 end sheet on win | `end-sheet.spec.ts:92` "R-62 a win by Confirm opens the sheet after the glide" android; `:119` Redo win; `win-guard.spec.ts:210` android+desktop | covered, passing |
| R-70, R-75 Undo closes sheet, Give up | `end-sheet.spec.ts:283` "R-70 R-75 Undo from the expanded sheet", `:301` collapsed, no pop; `menu.spec.ts:222` "R-75 Give up is enabled in Idle" (android) | covered, passing |
| R-72 pending-draft line | `pending-draft.spec.ts:20`, `:42`, `:73`, `:87` "R-72 …" android; A-E13 is an assumption id, so the row text now says the tests carry R-72 | covered after row text correction |
| R-73 relaunch into Game over | `end-sheet.spec.ts:186` "R-73 a relaunch into session-won opens the sheet expanded" android | covered, passing |
| R-74 confirm dialogs, Replay (Q-29), I-68 proofs | `confirm.spec.ts:42,54,67,98,147` "R-74 …", `:172` "Q-29 Replay accepted" android; I-68 proofs: `:195` (full title "on android › I-68 › AD-13 win, New game from the action bar …"), `keys.spec.ts:264` "I-68 Esc on the New game confirm opened from the menu" desktop; `confirm.spec.ts:213` desktop Esc | covered, passing |
| I-68 Esc closes the topmost surface (desktop) | `keys.spec.ts:264` "I-68 Esc on the New game confirm opened from the menu" desktop; `:53`; `surfaces-success.spec.ts:206` | covered, passing |
| Win, New game, back (AD-13) | `confirm.spec.ts:195` "AD-13 win, New game from the action bar: bare Board … one back leaves the app" android; `nav.spec.ts:187` | covered, passing |
| R-76 timer, Show timer, formatter (U, P6) | U `src/ui/text.test.ts:80` "AD-10 timer(ms) reads …"; P6 `preferences.spec.ts:71` "R-76 Show timer on …", `lifecycle.spec.ts:96` android | both halves covered, passing |
| R-81, R-83 penalty line, score, band | `end-sheet.spec.ts:132,150` "R-81 …", `:156,164,172` "R-83 …" android | covered, passing |
| R-82 top-bar score at 360 px, U+2212 | `board.spec.ts:124` "R-82 (UI) the top bar shows Score 0", `preferences.spec.ts:319` "R-82 at 360 px the top bar fits Score −530 and a 12:03:04 timer" android | covered, passing |
| R-84, Q-35, Q-44 statistics | `statistics.spec.ts:50` "R-84 …", `:112` "Q-35 …", `:96` "Q-44 …" android | covered, passing |
| §2 version and history messages, Q-33 | `history-notice.spec.ts:115` "§2 an unreadable history …", `statistics.spec.ts:151` "Q-33 …", `blocking.spec.ts:278` "§2 …" android | covered, passing |
| Q-24, A-E7 keyboard table (desktop) | `board-keys.spec.ts:553` "Q-24 A-E7 EXPERIENCE.md Flow 6", `tooltips.spec.ts:19`, `keys.spec.ts:34` desktop | covered, passing |
| F39 key commands close an open view (P6, U) | P6 `keys.spec.ts:129,143,156,201` "F39 …" desktop only; U `src/ui/commands.test.ts:79` "AD-12 F39: Undo and Redo with a sticky WordCell view open …" | both halves covered; row text corrected to P6 `desktop` (keys exist only on desktop) |
| AD-14 winning guard (android + desktop; Undo key aliases desktop) | `win-guard.spec.ts:210,215,232,276,401,413,429` android and desktop; `:263` "Control+z / z during the window undoes with no sheet" desktop | covered, passing |
| AD-13 overlay stack, confirm dismissal (U) | `src/ui/overlays.svelte.test.ts:29` "AD-13 open pushes one entry per id …"; `src/ui/overlays-surfaces.test.ts:81` "AD-13 …: dismissal closes only the confirm" | covered, passing |
| Confirm dismissed from a menu row: focus on ☰ | `confirm.spec.ts:98` "R-74 … confirm dismissed by … closes only the confirm: … focus on the menu button" android | covered, passing |
| AD-13 two-overlay reload (Statistics plus Reset confirm) | `statistics.spec.ts:246` "AD-13 reload with Statistics and its Reset confirm open", `nav.spec.ts:78` android | covered, passing |
| AD-13 Game-over reload, unreadable history | `end-sheet.spec.ts:553` "AD-13 a relaunch into Game over with an unreadable history shows the notice over the sheet; confirm and back sequence" android | covered, passing |
| Discriminating win smoke test | `end-sheet.spec.ts:92` (win title, final score = pre-win score plus committed delta), `surfaces-success.spec.ts:183` "R-62 Success signal win by Confirm" android | covered, passing |
| Spec §7.10 Preferences | `preferences.spec.ts:103,240,246,273` "§7.10 …" android | covered, passing |
| A-E9 labels, live region (U, P6) | U `src/ui/announce.test.ts:84` "AD-3 a commit reads the word, cell and delta …", `:193` commit then outcome; P6 `screen-reader.spec.ts:197` "A-E9 a win announces the commit text first, then the outcome" android | both halves covered, passing |
| How to play outline | `how-to-play.spec.ts:34` "AD-3 the menu lists the six rows in order, then How to play opens the outline" android | covered, passing |
| A8 wheel during a mouse drag | U `src/ui/gestures/controller.test.ts:5749` "AD-12 F3 a wheel during a mouse column drag …"; P6 `wheel-drag.spec.ts:42` desktop | covered, passing (row split, D35) |
| A8 hover-peek re-anchor | P6 `hover-peek-reanchor.spec.ts:54,74` "AD-12 an open hover peek re-anchors …" desktop; no Vitest names the hover re-anchor, only the AD-11 anchor write (`layout.svelte.test.ts:394,564`) | covered by P6; row text corrected to P6 `desktop` (U half is the AD-11 anchor tests) |
| A8 bfcache hide flush | build-notes "Carry-ins", bfcache hide flush (epic 4 retro F7, not the SPEC F7): not reproduced, recorded here as `accepted non-reproduction` (SPEC CAP-12 "not a bug"); no test added | counted as covered, not a gap (D35) |
| WordCell view sheet and peek transition | `wordcell-view.spec.ts:509` "AD-14 WordCell view open/close transition (normal / reduced motion)" android | covered, passing |
| Version footer (U, P6) | U `src/ui/menu.test.ts:32` "AD-13 the sheet has the title, the close control and the footer version"; P6 `menu.spec.ts:39` "AD-13 ☰ opens the menu: six rows, the footer version" android | both halves covered, passing |
| Stale tile selection cleared at the source (U) | `src/ui/keys.test.ts:527` "AD-12 a phase-changing key clears the tile selection at the source before its row runs"; `controller.test.ts:5708` the `tileTap` throw stays separate | covered, passing |
| Esc fallback (desktop) | `keys.spec.ts:171` "Q-24 Esc pops a tail selection …", `:73`, `:182`, `:234` "R-75 Esc collapses the expanded end sheet" desktop | covered, passing |
| Space/Enter tile activation (desktop) | `board-keys.spec.ts:447` "R-35 Space on a tile selects, on another swaps", `:542` "Q-24 Enter on a tile validates …" desktop | covered, passing |

Every P6 row is covered; the three row-text corrections (R-72, F39, A8 split) are in `rule-coverage.md`.

### Runs and measurements (HEAD e7976a0439f9cd71bed12225dd96d0b4d2476812, branch epic-6-surfaces)

- `npm run test:all`: exit 0 (9 m 45 s). Lint, check and the 72-file unit pass (2755 tests) green; build green; `test:e2e:dist` 15 passed; dev-server e2e 909 passed, 855 skipped; `test:e2e:pwa` 13 passed. No failure, no rerun, no flake.
- `npm run test:screens`: exit 0, 37 passed, 13 skipped; no baseline change (`git status` clean of baselines).
- Size (`scripts/size-budget.mjs`, last `build` of the `test:all` run, exit 0): `total 536102 / 600000`; margin 63,898 bytes.
- Unit median, checkout `~/wordcell-p617` (Linux filesystem, `git clone` of the epic branch HEAD e7976a0439f9cd71bed12225dd96d0b4d2476812, `npm ci`, one warm-up `npm test` discarded, five timed runs of the full `npm test`, pretest included): 4.74, 4.43, 4.44, 4.40, 3.50 s, all exit 0; median 4.44 s (warm, Linux filesystem), under 5 s.
- Watch gate (informational): slowest engine file `src/engine/view.test.ts` (415 ms in the full engine run); a single-file `vitest run` re-run reports Duration 520-525 ms (three runs), process wall 1.12-1.14 s with Node start-up; under the 1 s target on Vitest's duration, no watch session on the Linux checkout was run. Not a miss.

### Retrospective inputs

- Owner decisions 2026-10-15: F6-F8 recorded in SPEC; ☰ stays covered by a sticky WordCell view (option A); Statistics, end-sheet, menu and panel wording kept as built; longest word in capitals with an `8 letters` caption; the unrecorded-game line only on the sheet open at the reset; the pending-draft line never wraps at 360 px; How to play lists band names with scores; one Tab stop per column; inside focus ring on cards; buried WordCell cards `aria-hidden`; autopilot keeps plain labels without stopping and lists new strings here.
- Digest of new catalogue strings (`src/ui/text.ts`): menu and panel names (`Menu`, `Close menu`, `Replay this deal`, `Preferences`, `Close preferences`, `Animation speed`, `Fast`/`Normal`/`Slow`, `Show timer`, `Statistics`, `Close statistics`, `How to play`, `Close how to play`); confirms (`Start a new game?`, `Replay this deal?`, `Keep playing`, `Replay`); Statistics tiles and `Finish or give up a game to see statistics here.`; end sheet (`Every column cleared.`, `Game given up.`, `Longest word`, `Words placed`, `Collapse result`, `Show result: N, band`, `N letters left: −P`, `This game wasn't added to your statistics.`); pending draft `Undone: WORD · Redo brings it back`; How to play section titles, text and controls table; tooltip form `Label (Key)`; screen-reader names and announcements (build-notes "Live region strings"). Of these, EXPERIENCE.md already lists the menu and panel names, the confirm strings (rows 97-98), Statistics, end-sheet and pending-draft rows; the rest are in the close-out Message catalogue entry (How to play section text is the owner's text review, 6.9).
- Recorded for owner from the 6.16 inventory: D4 (keys.ts view row vs `Controller.activate` differ in behaviour), D5-D6/D8-D9 (presence and exit rendering, silent focus guards), D7 (latent AD-13 throw from `openSurface('resetConfirm')` over the History notice), D12-D13 (two e2e comment/wait edits), D16 (presence opacity), D17, D19-D22, D24, D26-D32, D36-D42, D44-D45 (scrim over top bar, pointer-press focus, focus ring offset, test strength and renames, `releaseHold` rename, copy wording, baselines, flaky drag tests, roving model).
- Other carried items: baselines `board-idle-pending-draft` (android/desktop) predate the wider gap before "·" and should be regenerated at the next baseline refresh; `tickets.toml` entry 3 wording and 6.13 ticket test-bullet wording; hover-peek re-anchor has no Vitest of its own; two wheel unit cases pass on a no-scroll implementation (6.14 review).
- bfcache hide flush: not reproduced, no test (build-notes Carry-ins, bfcache; SPEC CAP-12 "not a bug").
- Flaky tests seen earlier in epic 6 (none in this run): the 52 px menu-row check (sub-pixel, fixed in 9f90cce), `board-keys.spec.ts` winning-commit focus test (one timeout, passed alone), `drag-interruptions.spec.ts` F32 reduced-motion animation test (failed once under load), load-dependent timing in `wordcell-view` and `board-keys`.
- Measurements: above.

## Plan Change Log

## Review Triage Log

### 2026-10-16 — Review pass
- verdicts: 5 findings — high 0, medium 0, low 4, false 1, maybe-false 0
- findings:
  - `[low]` `[patch]` R-74 row cited `confirm.spec.ts:195` as I-68 evidence though only the describe carries the id — patched: cited the full title (describe prefix) and added `keys.spec.ts:264`.
  - `[false]` `[reject]` Plan status `in-review` contradicts "None" misses — the status is `in-review` only while this review runs; Finalize writes `built`.
  - `[low]` `[patch]` Digest sentence wrongly implied confirm strings were not catalogue rows — patched: names EXPERIENCE rows 97-98 and the How to play text review.
  - `[low]` `[patch]` "build-notes F7" label ambiguous with SPEC F7 and not the note's words — patched in the plan and the rule-coverage row: "Carry-ins, bfcache (epic 4 retro F7)".
  - `[low]` `[reject]` Audit shows no per-project pass evidence — the intro names the dev-server android and desktop lines of the `test:all` log as the basis; fixing it means pasting log lines for about 60 tests.

## Auto Run Result

- Summary: paperwork and measurements for epic 6 close-out; no code, test, fixture or baseline touched.
- Files changed: this plan (worklist, audit table, measurements, retrospective inputs); `_bmad-output/specs/spec-epic-6-surfaces/build-notes.md` (close-out section extended with 7 edit entries, loose note removed); `_bmad-output/specs/spec-epic-6-surfaces/rule-coverage.md` (R-72 and F39 row text, A8 row split in three).
- Review: quick, 1 pass; 3 patches applied (all low, doc wording), 0 deferred, 2 rejected with reasons in the triage log. Follow-up review recommended: false.
- Verification: `npm run test:all` exit 0, `npm run test:screens` exit 0 (37 passed, 13 skipped); size 536102 / 600000; unit median 4.44 s on the Linux filesystem (5 runs); every P6 row covered. Verify is met.
- Residual risks: the D40, D45 and D46-D48 worklist rows could not be itemised (no source rows exist) and are `recorded for owner` in part; the watch-mode re-run was measured as a single-file `vitest run`, not a live watch session.

## Verification

**Commands:**
- `npm run test:all` -- expected: exit 0 (recorded above)
- `npm run test:screens` -- expected: exit 0, no baseline change (recorded above)
- `git status --short` -- expected: only this plan, `build-notes.md`, `rule-coverage.md` and the ticket's own review logs
