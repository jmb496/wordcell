# Autopilot digest — epic 10 End-of-game word list and win celebration

Epic: epic-end-of-game-words
Branch: end-of-game-words
Start commit: a0db217
Run id: 20261020-0925
Authorisation: owner-authorised autopilot mode (methodology § Autopilot, 2026-09-28).

## 10.1 Engine word list and its fixture — done
What it adds: The game engine can now list every word of a finished game, longest first, plus a ready-made won-game test fixture containing a repeated word, a tie, a long word and a card used twice.
Ticket review: 2 passes, converged; nothing needed your input
Build: built; commits eb25751, 4cac784
Code review: quick, 2 passes, converged; 1 fix applied (test tightening)
Tests: all passing, screenshots not needed (no UI change)
Ref to fix upstream: none
Tokens: Tokens: 4.8M input-equivalent (build 48%, ticket review 26%, code review 18%, other 4%, orchestrator 4%); orchestrator peak context 61k
Worth knowing: nothing
Close-out docs: none

## 10.2 End-sheet Words section — done
What it adds: The end-of-game sheet shows a Words list (longest first) below its buttons, with an empty-game line.
Ticket review: 4 passes, converged; nothing needed your input
Build: built; commits 02b125b
Code review: quick, 2 passes, converged; fixes applied in 5068d95
Tests: test:all passing (first run had 8 unrelated timeout flakes in dictionary and drag-interruptions specs, which passed alone and on a full rerun). Screenshots: the 3 given-up end-sheet baselines (expanded, history-unreadable, not-added; android and desktop) differed by about 4% because the sheet now has a Words section; owner reviewed the full-list screenshots, approved, and the baselines were regenerated in the container (full suite then 66 passed).
Ref to fix upstream: none
Tokens: Tokens: 4.6M input-equivalent (ticket review 50%, build 26%, code review 13%, other 7%, orchestrator 5%); orchestrator peak context 67k
Worth knowing: Unapplied minors were handed to the build. The 1-letter row is covered by the Vitest AD-3 test only (exempt from P6, min word 3).
Close-out docs: none

## 10.3 Celebration step, renderer and run controller — done
What it adds: The behind-the-scenes pieces of the win celebration: the motion rules for the bouncing word cards, the drawing of one row of card copies per word, and the controller that starts, ends and cancels a run. Nothing shows in the game yet; later tickets mount and trigger it.
Ticket review: 7 passes, converged; nothing needed your input
Build: built; commit e161c3c
Code review: thorough, 2 passes, converged; fixes applied in 4c9f853 (majors 2, 0)
Tests: all passing, screenshots passed
Ref to fix upstream: none
Tokens: 6.7M input-equivalent (ticket review 54%, build 24%, code review 19%, orchestrator 3%); orchestrator peak context 64k
Worth knowing: The ticket review left one open major (Verify lacks clauses for `advance` being a no-op when idle/not manual/ms<=0 and `setManual` read only at `start`); the build covered both in the plan and tests, the ticket text itself was not changed. This checkout is on a case-insensitive drvfs mount, so `./celebration.svelte` resolved to `Celebration.svelte` and 19 tests failed; the code review fixed it with explicit `.ts` import paths and added `allowImportingTsExtensions` to `tsconfig.app.json` (a root config change you may want to glance at).
Close-out docs: none

## 10.4 Celebration overlay entry — stopped
What it adds: Hooks the win celebration into the game's overlay system: when it may start, what ends or cancels it (back, Undo, New game), and which keys and taps still work while it plays.
Ticket review: 5 passes, converged (majors 8, 6, 2, 1, 0); one item needs your input (below)
Build: not started
Code review: not started
Tests: not run
Ref to fix upstream: none
Paused: usage limit at Step A pass 2 (previous session), reset 11:50am (America/New_York), resumed 2026-10-23 15:52 UTC. That session ended without writing a Stopped section; the review log and WIP commits settled the resume point (mismatch noted here).
Tokens: 6.0M input-equivalent (ticket review 97%, orchestrator 2%, other 1%); orchestrator peak context 63k
Worth knowing: The ticket lists five readings of AD-13/AD-19 (start closes a sticky WordCell view first; Undo and N still work during the run; the top and action bars stay usable; the removal pops the entry before the run stops; "inert board" means no input, not HTML `inert`), flagged for the build's plan checkpoint and the entry 9 close-out. Three word-neutral minors were left for the build (review log `## Result`).
Close-out docs: none yet

## Stopped — decision needed
Ticket 10.4, Step A (ticket review converged; Step A's "harden" commit not yet made). Question (SPEC Open Questions, ticket Keys bullet): while the celebration plays, do `?`, a WordCell tap or `Enter`, and every other game key (Redo, column digits, …) do nothing, with only Undo, `N`, `M`, the ☰ button, `Space`/`Esc` (skip) and back acting? Proposed default: yes, as the SPEC states. Resume: record the answer (ticket Keys bullet, epic Notes, SPEC Open Questions/memlog), commit, rerun `.claude/skills/epic-autopilot/scripts/loop.sh epic-end-of-game-words`; the next session continues at Step B.

## 10.4 Celebration overlay entry — done
What it adds: Hooks the win celebration into the game's overlay system: when it may start, what ends or cancels it (back ends it; Undo and New game cancel it), and which keys and taps still work while it plays. Nothing shows yet; ticket 10.5 triggers it on a win.
Ticket review: 5 passes, converged (majors 8, 6, 2, 1, 0); your keys-while-it-runs answer (accept the default, SPEC F15, 2026-10-23) was recorded and the harden commit a194a2e made between sessions
Build: built; commit 6dc0018
Code review: thorough (risk high, one deferred medium), 2 passes, converged (majors 1, 0); fixes in 3d29683, log 03766db
Tests: all passing (unit 3448, e2e 1054, pwa 16, dist 18), screenshots passed (66)
Ref to fix upstream: none
Tokens: 9.0M input-equivalent (build 51%, code review 43%, orchestrator 3%, other 2%); orchestrator peak context 70k
Worth knowing: The ticket had `plan_checkpoint: true`; the build planned it unattended (as for 10.3), so the plan's Design Notes owner items are worth a read. Handed to ticket 10.5: start the run only from the still-pending winning `whenSettled` callback, and cancel any in-progress press before `startCelebration()` (deferred medium: a long-press held on a WordCell by a second finger while the win is confirmed would hit an internal error; the same case exists today when the end sheet opens). Until ticket 10.7, pressing ☰ during a running celebration halts the app, so the epic branch must not be merged before 10.7. A one-off flake in e2e/nav.spec.ts:162 occurred during the build and did not recur. Five spine readings (ticket Notes a–e) wait for the 10.9 close-out.
Close-out docs:
- EXPERIENCE.md § Keyboard ← F15: while the celebration plays only Undo, N, M, ☰, Space/Esc and back act; ?, a WordCell tap or Enter and every other game key do nothing (owner, 2026-10-23); the table states only the Space skip, so check it states the rest (SPEC.md already records F15)

## 10.5 Win trigger and celebration test seam — stopped
What it adds: Winning a game now starts the word celebration: the celebration plays, and the end sheet opens when it finishes. It does not play after a relaunch, with reduced motion, or after Give up. Tests get a switch that turns the celebration on and lets them step through it frame by frame. The switch is off by default, so existing win tests are unchanged.
Ticket review: 5 passes, converged (majors 13, 5, 5, 1, 1); nothing needed your input. One open major (the Fast cap test could pass on a run that never started) and 14 minors were handed to the build.
Build: built; commit 691c8e6 (pulled 8d5147f, harden 00a1304)
Code review: thorough (risk high), 1 pass, converged (majors 0); no fixes applied; one item needs your input (below); 5 minors left in the log
Tests: build's run green apart from the known e2e/nav.spec.ts:162 flake under load (unit 3461, e2e 1067, dist 19, pwa 17); the orchestrator's test:all and screenshot check not run yet (Step D)
Ref to fix upstream: none
Tokens: 15.9M input-equivalent (ticket review 58%, build 28%, code review 11%, orchestrator 2%, other 1%); orchestrator peak context 71k
Worth knowing: The plan checkpoint was built unattended (as for 10.3 and 10.4). Still open: until 10.7, ☰ or M during a running celebration throws, so the branch must not merge before 10.7. Deferred (medium) to 10.8: no test yet shows that a real win in the hook-free production build starts the celebration. Celebration.svelte now logs a harmless Svelte dev warning (binding_property_non_reactive), a candidate for the 10.10 sweep. e2e/nav.spec.ts:162 failed under load in two of the build's full runs and passed 5/5 alone.
Close-out docs: pending your answer (AD-19 Start and EXPERIENCE.md "Never plays", synced by 10.9)

## Stopped — decision needed
Ticket 10.5, Step C: the code review converged, and its log `_bmad-output/implementation-artifacts/review-loop/10-5-build.md` is committed with `## Result`. Question (plan Design Notes, owner checkpoint item 1): if the app is in the background at the moment a winning board settles, the end sheet shows with no celebration; and with reduced motion (or the test seam off) no celebration step is added to back-button history. Keep both? Proposed default: keep as built (the ticket's Start bullet specifies both); 10.9 syncs AD-19 Start and EXPERIENCE.md "Never plays". Resume: record the answer (ticket Notes, epic Notes, SPEC memlog), commit, rerun `.claude/skills/epic-autopilot/scripts/loop.sh epic-end-of-game-words`; the next session continues at Step D (test:all, screenshots, mark done).

## 10.5 Win trigger and celebration test seam — done
What it adds: Winning a game now starts the word celebration, and the end sheet opens when it finishes. It does not play after a relaunch, with reduced motion, after Give up, or when the win happens while the app is in the background. Tests get a switch (off by default) that turns the celebration on and steps through it frame by frame.
Ticket review: 5 passes, converged (majors 13, 5, 5, 1, 1); nothing needed your input
Build: built; commit 691c8e6
Code review: thorough (risk high), 1 pass, converged (majors 0); no fixes applied; your answer on background wins and reduced-motion history (accept the default, SPEC F16, 2026-10-23) was recorded between sessions in 7fc287b
Tests: all passing (unit 3461, e2e 1068, dist 19, pwa 17; the e2e/nav.spec.ts:162 flake did not recur), screenshots passed (66)
Ref to fix upstream: none
Tokens: 0.1M input-equivalent this session (orchestrator 69%, other 31%); orchestrator peak context 60k (earlier sessions: 15.9M, see the stopped entry above)
Worth knowing: Until ticket 10.7, pressing ☰ or M during a running celebration halts the app, so the epic branch must not be merged before 10.7. Deferred (medium) to 10.8: a test that a real win in the hook-free production build starts the celebration. Celebration.svelte logs a harmless Svelte dev warning (binding_property_non_reactive), a candidate for the 10.10 sweep. 5 code-review minors are left in `_bmad-output/implementation-artifacts/review-loop/10-5-build.md`.
Close-out docs:
- ARCHITECTURE-SPINE.md AD-19 Rule, Start bullet ← F16: a win whose board settles while the page is hidden opens the end sheet on return with no celebration; reduced motion or the seam off pushes no `celebration` history entry (owner, 2026-10-23); 10.9 syncs it
- EXPERIENCE.md § celebration "Never plays" ← F16: add the background (hidden-page) win (owner, 2026-10-23); 10.9 syncs it (SPEC.md already records F16)

## 10.6 Celebration skip — stopped
What it adds: Lets the player skip the win celebration: a tap on the board (outside the top bar, action bar and dictionary banner) that starts after the celebration began, Space or Esc on desktop, or the Android back gesture. Each one opens the end sheet straight away. The tap that skips does nothing else. A finger already down when the win happened, or a tap on a banner button, does not skip. The ticket also lets your Android read adjust the bounce timing and size.
Ticket review: 5 passes, converged (majors 10, 8, 7, 2, 0); one item needs your input (below); 15 minors handed to the build in the log's Result
Build: built (resumed after the usage limit); commit 5f67795
Code review: thorough (risk high, one deferred medium), 4 passes, converged (majors 2, 2, 1, 0); 6 majors and 15 minors fixed in 527de08, 4384a07, 800364c; log d0e93bb; two items need your input (below)
Tests: the review loop's unit run passed (3529), lint and check pass, celebration and helper e2e specs pass (95); the orchestrator's test:all and screenshot check not run yet (Step D)
Ref to fix upstream: none
Tokens: 11.1M input-equivalent (ticket review 97%, orchestrator 1%, other 1%); orchestrator peak context 64k. Build and code review session: 14.9M input-equivalent (code review 65%, build 32%, orchestrator 2%, other 1%); orchestrator peak context 67k
Worth knowing: The ticket has `done_checkpoint = true` (your Android read of a real win with the long-word fixture settles the copy cost, the initial constants and A-D12), so once built and verified it stays `built` for your check rather than being marked done. Also `plan_checkpoint = true`, so the plan's Design Notes owner items will be worth a read. Two minors to fix first: the Verify line puts the Space/Esc row on `android` when it runs on `desktop`, and if the app halts during a celebration, the first tap on the error screen's Reload would be taken as a skip.
Startup note: the handoff JSON still showed the Step A stop after the usage-limit stop commit; the ticket files (plan `in-progress`) settled it, and Step B resumed.
Also built unattended (plan checkpoint, Design Notes): run listeners pass everything through while the app is halted; the skipping press and Space are consumed by short post-run tails (an AD-19 Skip refinement); the whole dictionary banner is exempt from skipping where R-87 names only the bars; entry 9 syncs both. One deferred unverified flake risk: the e2e tap must land before the 400 ms long-press time.
Close-out docs: pending your answers (AD-19 Skip; R-87 bar and banner wording; synced by 10.9)

## Stopped — decision needed
Ticket 10.6, Step A: the ticket review converged and the ticket and its log (with `## Result`) are committed (69c9ca6). Question (log Pass 1): on desktop, after the winning word is confirmed by a click or Enter, focus stays on the action bar's primary button, which then reads New game. AD-19 Skip says Space/Esc skip "unless a bar or banner control holds focus", so in that usual flow Space would start a new game and Esc would do nothing. R-87, EXPERIENCE.md Keyboard and SPEC F9 give no focus exception. Proposed default: Space and Esc skip whatever holds focus while the celebration plays; AD-19's focus exception is dropped at 10.9's doc sync. Resume: record the answer (ticket Notes, epic Notes, SPEC memlog), commit, rerun `.claude/skills/epic-autopilot/scripts/loop.sh epic-end-of-game-words`; the next session continues at Step B (build).

## Stopped — usage limit
Ticket 10.6, Step B (build): the F17 answer is recorded (2a0bfbd); the build started 20:24 and hit the session limit at 20:32 (`You've hit your session limit · resets 9:50pm (America/New_York)`); the orchestrator was limited too. The build's own uncommitted plan `story-celebration-skip-plan.md` (status `in-progress`) is left in the tree for bmad-build-auto's resume (Setup 2 exception); step log kept as `10.6-B-attempt1.log`. Resume after the reset: `LIMIT_CHECK=off .claude/skills/epic-autopilot/scripts/loop.sh epic-end-of-game-words`.

## Stopped — decision needed
Ticket 10.6, Step C: the code review converged (4 passes) and its log `_bmad-output/implementation-artifacts/review-loop/10-6-build.md` is committed with `## Result` (d0e93bb); every technical fix is in the WIP commits 527de08, 4384a07, 800364c. Two questions (log Result and Pass 4):
1. Double-tap after a press skip: the end sheet opens under the finger and only the skipping press is consumed, so a second quick tap can hit Replay this deal or New game. Proposed default: after a press skip, ignore new presses for 300 ms (the existing SWALLOW_MS) from the skipping press's release. Not built; a yes needs a small code change before Step D.
2. Confirm two spec-over-spine changes the review made: the bar test uses the press point (a touch just beside a bar button skips instead of pressing it), and chorded or held Space never presses a focused button during the run (SPEC F17). Proposed default: keep both; entry 9 rewrites AD-19 Skip.
Resume: record the answers (ticket Notes, epic Notes, SPEC memlog) and, if item 1 is yes, apply the 300 ms guard with its test and commit; then rerun `.claude/skills/epic-autopilot/scripts/loop.sh epic-end-of-game-words`. The next session continues at Step D (test:all, screenshots), and the ticket then stays `built` for your Android read (done checkpoint).

## 10.6 Celebration skip — built, waiting for you
What it adds: Lets the player skip the win celebration by tapping the board, pressing Space or Esc on desktop, or using the Android back gesture; each opens the end sheet straight away. After a tap skips, any other tap in the next 0.3 s is ignored, so a double-tap can't hit Replay this deal or New game on the sheet that just opened.
Ticket review: 5 passes, converged (entry above)
Build: built; commit 5f67795; your answers applied in 2af38ac (F18 double-tap guard with its tests; F19 kept the press-point bar test and Space chord blocking)
Code review: thorough, 4 passes, converged (entry above); 6 majors and 15 minors fixed
Tests: test:all passing (1083 + 17 e2e, exit 0) on 2af38ac, screenshots passed (67 passed, 39 project skips as usual)
Ref to fix upstream: none
Tokens: 0.1M input-equivalent (orchestrator 57%, other 43%); orchestrator peak context 55k
Startup note: handoff, git log and digest agreed (10.6 at Step D after the owner's answers in 2af38ac).
Worth knowing: Stopped by rule 4: the ticket's done checkpoint is your Android read of a real win with the long-word fixture (ticket AC "Device read" lists the setup and checklist). The ticket stays `built`; 10.7 is next once you mark 10.6 done. Pressing ☰ or M during a celebration still halts the app until 10.7, so don't merge the branch before 10.7. The two minors noted earlier (the Verify line's Space/Esc project, a first tap on Reload after a halt during a celebration) and the deferred 400 ms long-press flake risk stay recorded in the plan and the review log.
Close-out docs:
- ARCHITECTURE-SPINE.md AD-19 Skip ← F17 keys skip whatever holds focus (owner standing rule, 2026-10-23); F18 300 ms press guard after a press skip (2026-10-24); F19 press-point bar test, chorded or repeat Space never activates a control (2026-10-24); the post-run tails and pass-through while halted (plan Design Notes); synced by 10.9
- docs/game-flow-spec.md R-87 ← the whole dictionary banner is exempt from skipping, as well as the two bars (plan Design Notes; owner to confirm at 10.9)
- From 10.5 (F16, 2026-10-23): ARCHITECTURE-SPINE.md AD-19 Start; EXPERIENCE.md "Never plays"

## 10.6 Celebration skip — done
What it adds: Skipping the win celebration (a tap on the board, Space or Esc on desktop, the back gesture), plus the owner's tuning of the celebration from six Android reads: cards spaced 35 % apart, each card following the one ahead along its word's arc so the word reads as a rainbow, evenly spaced and stacked so letters stay visible, one steady speed per word, cards appearing at their WordCell in turn, and words crossing the screen toward the far side.
Ticket review: 5 passes, converged; F17 (Space/Esc skip whatever holds focus) accepted under the standing rule
Build: built; commits 5f67795; F18 guard 2af38ac; tuning 0f0ef0d, d9119fc, c448180, 1b464a7 (superseded), 3d8366c, 96f3cc5
Code review: thorough, 4 passes, converged (F18, F19 accepted); tuning review 1: thorough, 2 passes, converged (F22 accepted); tuning review 2: thorough, 1 pass, converged (F25 wording kept as built)
Tests: all passing (unit 3572, e2e 1083, pwa 19, dist 17), screenshots passed (67; celebration mid-run baseline regenerated per Tuning)
Ref to fix upstream: none
Tokens: 16.0M input-equivalent since 00:41Z (other 64%, code review 35%, orchestrator 1%)
Worth knowing: Device reads ran over Tailscale (node scripts/device-preview.mjs, docs/device-testing.md, fe9744a). Open for the sweep (10.10): a second finger pressed before the skipping finger lifts still reaches the end sheet; a band no taller than a card gives NaN physics. Carried to 10.9's long-list read: the 40 % floor, a 23-letter row, hundreds of copies, per-word tempo when the pace fit engages (portrait fixture's last word 1.44x).
Close-out docs:
- ARCHITECTURE-SPINE.md AD-19 Skip ← F17 keys skip whatever holds focus (2026-10-23); F18 300 ms press guard after a skip; F19 bar test by press point, chorded/repeat Space blocked (2026-10-24)
- ARCHITECTURE-SPINE.md AD-19 Rule bullet 1 (per-group transform) ← F21/F23/F26 per-card motion, trail, appear at the WordCell (owner, 2026-10-24)
- SPEC CAP-2 ("moves groups") and F25 wording ← F21–F27 (owner, 2026-10-24)
- DESIGN.md Win celebration (50 % overlap, row) ← F20 35 % overlap, F26 no launch row (owner, 2026-10-24)
- EXPERIENCE.md Win celebration ← F27 words cross toward the far wall (owner, 2026-10-24)
- docs/game-flow-spec.md R-87 ← the dictionary banner is exempt from press skips, as the two bars

## 10.7 Celebration interruptions — built, waiting for you
What it adds: The win celebration now ends cleanly when the player opens the menu (☰ or M: the end sheet comes up, then the menu over it), when the app goes to the background (the end sheet is waiting when they come back), or when the screen is resized or rotated. Tests also prove that Undo, New game and N cancel it without a sheet, that Redo of the winning move starts it again, and that ? and the WordCell keys do nothing while it runs.
Ticket review: 4 passes, converged (majors 10, 3, 2, 0); nothing needed your input during the loop; 12 minors handed to the build
Build: built; commit eae5179 (pulled 765affe, harden eaf8ffb); 22 internal findings, 7 patched, none deferred
Code review: thorough (risk high), 1 pass, converged (majors 0); no fixes applied; 6 minors left in the log (717f92b)
Tests: all passing (unit 3581, e2e 1093, pwa 19, dist 17) on 717f92b, screenshots passed (67; 39 project skips as usual)
Ref to fix upstream: none
Tokens: 16.4M input-equivalent (ticket review 55%, build 26%, code review 12%, other 4%, orchestrator 2%); orchestrator peak context 78k
Startup note: handoff, git log and digest agreed (10.6 done, 10.7 next, ticket pulled this session).
Worth knowing: Stopped by rule 1 (rule 7 plan checkpoint, built unattended as for 10.4–10.6): the plan's owner items 1–2 (Design Notes) need your answer before done. `openMenu()` lives in a new `src/ui/open-menu.ts` rather than `open-surface.ts` (putting it there broke 2 unit files at import). Residuals for 10.9's Android read: a mobile-browser toolbar show/hide counts as a resize and ends the run; a back gesture in the instant between ☰ and the sheet opening is absorbed; a bfcache restore after navigating away mid-run may swallow the first back. This ticket closes the ☰/M merge blocker once you accept items 1–2.
Close-out docs (pending your answers):
- ARCHITECTURE-SPINE.md AD-19 Hide ← hide uses the ordinary end (queued pop), registered by `installInterruptions`, not main.ts (owner item 1)
- EXPERIENCE.md Win celebration message row ← the no-announce exemption applies only to a sheet opened while hidden (owner item 1)
- SPEC (epic 10) new F-row ← ☰/M mid-run drops the menu open when the top at settle is not the end sheet (owner item 2)
- ARCHITECTURE-SPINE.md AD-13/AD-19 ← `openMenu()` in `src/ui/open-menu.ts` (technical, plan item 4); tickets.toml entry 7 `interface` stale (entry 9 sync)

## Stopped — decision needed
Ticket 10.7, Step D: test:all and screenshots green on 717f92b; code review log committed with `## Result`. Two questions (plan `story-celebration-interruptions-plan.md` Design Notes, owner items 1–2):
1. Hide (rule 7 vs AD-19 Hide): when the app goes to the background mid-celebration, the build ends the run the ordinary way (removes its back-history step with a queued pop) instead of AD-19's separate "hide mode". Proposed default: approve; 10.9 syncs AD-19 Hide and the EXPERIENCE.md row; Android proof at 10.9's read. A no means a ticket revision (new nav operations).
2. ☰/M when something else lands on top before the sheet opens (a back gesture in that instant, or a second press that already opened the menu): the menu open is dropped. Proposed default: keep; 10.9 adds a SPEC F-row.
Resume: record the answers (ticket Notes, epic Notes, SPEC memlog), commit, rerun `LIMIT_CHECK=off .claude/skills/epic-autopilot/scripts/loop.sh epic-end-of-game-words`; the next session finds the review log with `## Result` and goes to Step D (test:all, screenshots, mark done).

## 10.7 Celebration interruptions — done
Owner checkpoint items 1–2 accepted under the standing rule as SPEC F28 (hide ends the run the ordinary way) and F29 (a raced ☰/M menu open is skipped); no player-visible change. test:all and screenshots passed on eae5179/717f92b (above); marked done without a rerun since only docs changed after. The ☰/M merge blocker is closed.
Close-out docs: ARCHITECTURE-SPINE.md AD-19 Hide ← F28 (2026-10-24); EXPERIENCE.md Win celebration message row ← F28; SPEC ← F29 row (added); AD-13/AD-19 naming `open-menu.ts`.

## 10.8 Hook-free celebration suite — done
What it adds: Two automatic tests that win a real game in the finished, shippable build of the app (the one without test shortcuts) and check that the celebration really plays there, and that a tap or the back button skips it straight to the end sheet. This closes the gap left open by 10.5.
Ticket review: 3 passes, converged; nothing needed your input (one open technical point and 11 small suggestions handed to the build, which resolved them all in its plan)
Build: built; commits a10bbbe
Code review: thorough (ticket risk medium), 1 pass, converged; 0 fixes applied
Tests: all passing; screenshots not needed (no UI change: only e2e/pwa/dist-smoke.spec.ts changed)
Ref to fix upstream: none
Tokens: 6.7M input-equivalent (ticket review 64%, code review 14%, build 12%, other 7%, orchestrator 4%); orchestrator peak context 69k
Worth knowing: The build checked the tests can fail: with the celebration switched off in the shipped build, both new tests failed as they should, then the change was reverted. The skip happens about 1 s after Confirm against a natural celebration length of about 5.8 s, so a much slower test machine (about 5× slower) would be needed before a natural finish could pass for a skip. One small code-review suggestion is left for the 10.10 sweep (`review-loop/10-8-build.md`): a check in the new test that cannot fail, which should instead assert that no celebration is on screen before Confirm. Startup note: a stale `10.6-C3.done.pid` from an earlier session named no live process and was ignored. Next is 10.9, which is a hands-on ticket for you (`hitl`), so the next session will stop before it.
Close-out docs: none

## Stopped — hands-on ticket
Ticket 10.9 (Close-out: documents, AGENTS pitfall and device check), before Step A: the ticket is `hitl` and no owner authorisation for this run was found (epic folder, ticket entry, digest), so stop rule 4 applies and nothing was started. Startup note: the handoff, git log (725965e) and digest agreed: 10.8 done, 10.9 next. The stale `10.6-C3.done.pid` again named no live process.
Resume: either run 10.9 yourself (the Android read of a long word list, the hide path and the end sheet's Words section, plus the doc syncs gathered as Close-out docs in the 10.5–10.7 entries), or record in the ticket entry that the autopilot may run its non-device parts and leave it `built` for your device check, commit, and rerun `LIMIT_CHECK=off .claude/skills/epic-autopilot/scripts/loop.sh epic-end-of-game-words`. 10.10 (refactor sweep) waits for 10.9.
Tokens: 0.0M input-equivalent (orchestrator 100%)

## Stopped — usage limit
Ticket 10.9, Step A (ticket review): pass 1 committed (c1518af); the review log is partial and resumes by the review-loop resume rule. Limit: `You've hit your session limit · resets 4pm (America/New_York)`. Resume after the reset: `LIMIT_CHECK=off .claude/skills/epic-autopilot/scripts/loop.sh epic-end-of-game-words`.

## 10.9 Close-out: documents, AGENTS pitfall and device check — stopped
What it adds: Brings the rule book, design and architecture documents in line with what was built for the celebration and word list, adds the two celebration-copy lines to AGENTS.md, adds a won game with a long word list (`session-won-long-words`) for your phone check, and adds a test that a press on the dictionary banner does not skip the celebration.
Ticket review: 4 passes (resumed after the usage limit), converged; nothing needed your input (8 small suggestions handed to the build)
Build: built; commits 52d5aa5
Code review: quick (ticket risk low, every medium finding patched), 1 pass, converged; 0 fixes applied (5 small wording suggestions left in `review-loop/10-9-build.md`)
Tests: test:all FAILED on one test: `[android] e2e/nav.spec.ts:162 §2 AD-13 a double tap on New game on the rejected root opens the notice at wc 1 and no Reset confirm` (the Reset confirm dialog was still showing). Lint, check, unit (3597), build and dist (21) passed; the remaining android e2e passed (1093); the desktop e2e (skipped once android failed) and the pwa suite did not run. Screenshots not run yet.
Ref to fix upstream: none
Tokens: 17.9M input-equivalent (build 49%, ticket review 38%, code review 7%, other 4%, orchestrator 2%); orchestrator peak context 75k
Worth knowing: This test has failed under load before: once in the 10.4 build, twice in the 10.5 build, and once in this build (5/5 passes when run alone). `e2e/nav.spec.ts` has not changed since epic 6, and this ticket does not touch the New game or Reset code, so the failure is very likely the same flake. It is now showing up often enough to be a 10.10 sweep item. Build owner items: the fixture has 21 words and 161 copies (fewer than the "few hundred" carried from 10.6); its words are not English; its smallest scale is 0.553 and its pacing is measured at 360x740, so your phone may differ. The build read the ticket's authorisation of "the AGENTS.md pitfall" as also covering the Conventions-line exception that the next bullet authorises. Still to apply when 10.9 is marked done: tickets.toml entry 7 `interface`, the epic References F-range, and your A-D12 verdict into DESIGN.md. Startup note: the handoff JSON still described the earlier hitl stop (the usage-limit stop commit did not update it). The ticket files (pass 1 committed, partial log) settled it: resume 10.9 at Step A. The stale `10.6-C3.done.pid` again named no live process.
Close-out docs: docs/game-flow-spec.md R-87 + preamble amendment ← dictionary banner exempt from press-skip (owner standing rule, 2026-10-24; applied in 52d5aa5); DESIGN.md Win celebration / A-D12 ← your Android verdict (pending, at done)

## Stopped — test:all failed
Ticket 10.9, Step D.1: `npm run test:all` failed on `[android] e2e/nav.spec.ts:162` (above). Ticket 10.9 is `built` with its ticket review, build and code review committed; only the verification is left. Resume: rerun `LIMIT_CHECK=off .claude/skills/epic-autopilot/scripts/loop.sh epic-end-of-game-words`. The next session resumes at Step D: it reruns test:all and the screenshot check, then stops with 10.9 `built` for your Android read.

## Stopped — test:all failed again
Ticket 10.9, Step D.1 (rerun): `npm run test:all` failed again on the same single test, `[android] e2e/nav.spec.ts:162 §2 AD-13 a double tap on New game on the rejected root opens the notice at wc 1 and no Reset confirm` (line 176: the "Delete the score history?" confirm was still showing). Lint, check, unit (3597), build and dist (21) passed; 1093 android e2e passed; the desktop e2e and pwa suites were skipped after the failure. Screenshots not run. Earlier log kept as `10.9-T-attempt1.log`.
Startup note: the handoff, git log (d47269c) and digest agreed (10.9 at Step D: plan `built`, `10-9-build.md` has `## Result`). The stale `10.6-C3.done.pid` again named no live process.
Worth knowing: This is now 2 of 2 full runs for 10.9's verification and 5 failures across 10.4–10.9, always this one test, always in the full run, never alone. It is no longer a rare flake: it blocks every full run, so it needs a fix (a timing race in the test or in the double-tap handling on the rejected-save screen) before 10.9 can pass its checks. The autopilot does not fix code itself.
Resume: fix or stabilise `e2e/nav.spec.ts:162` (a small fix commit on this branch, or your call to quarantine it until 10.10), then rerun `LIMIT_CHECK=off .claude/skills/epic-autopilot/scripts/loop.sh epic-end-of-game-words`; the next session resumes at Step D (test:all, screenshots), then stops with 10.9 `built` for your Android read.
Tokens: 0.2M input-equivalent (other 59%, orchestrator 41%); orchestrator peak context 56k

## 10.9 Close-out: documents, AGENTS pitfall and device check — built, waiting for you
Tests: all passing on 169c6bc (unit 3597, e2e 1096, pwa 17, dist 21), screenshots passed (67; 39 project skips as usual), no baseline regenerated. The `e2e/nav.spec.ts` double-tap failure is fixed by your commit 169c6bc (the `doubleTap` helper with stamped tap times), and it passed this time in the full run.
Startup note: the handoff, git log (169c6bc) and digest agreed (10.9 at Step D: plan `built`, `10-9-build.md` has `## Result`). The stale `10.6-C3.done.pid` again named no live process. The earlier test logs are kept as `10.9-T-attempt1.log` and `10.9-T-attempt2.log`.
Stopped by rule 4: the ticket's only hands-on part, your Android read, is left. 10.9 stays `built` until you mark it done.
Tokens: 0.2M input-equivalent (other 53%, orchestrator 47%); orchestrator peak context 60k
Close-out docs: docs/game-flow-spec.md R-87 + preamble amendment ← dictionary banner exempt from press-skip (owner standing rule, 2026-10-24; applied in 52d5aa5); DESIGN.md Win celebration / A-D12 ← your Android verdict (pending, at done); tickets.toml entry 7 `interface` and the epic References F-range (F1…F29), also at done
Resume: run the phone check (below), record it and your A-D12 verdict in the epic Notes, mark 10.9 done, then rerun `LIMIT_CHECK=off .claude/skills/epic-autopilot/scripts/loop.sh epic-end-of-game-words` for 10.10 (refactor sweep).

## 10.9 Close-out: documents, AGENTS pitfall and device check — done
Owner's Android read passed 2026-10-24 ("Phone tests look great"): long list, hide path, Words section, interruptions; A-D12 accepted. test:all (after the doubleTap flake fix 169c6bc) and screenshots passed at 6c2042d; only docs changed since. Close-out docs: DESIGN.md Win celebration / A-D12 ← accepted (owner, 2026-10-24); ARCHITECTURE-SPINE.md AD-17 Touch ← `doubleTap`; tickets.toml entry 7 `interface`; epic References F-range F1…F29.

## Stopped — usage limit
Ticket 10.10, Step A (ticket review): passes 1–3 committed (1958108); the review log is partial and resumes by the review-loop resume rule. Limit: `You've hit your session limit · resets 9:30pm (America/New_York)`. Resume: `LIMIT_CHECK=off .claude/skills/epic-autopilot/scripts/loop.sh epic-end-of-game-words`.

## Stopped — decision needed (ticket 10.10, Step A)
Ticket review resumed at pass 4 after the usage limit and converged after 5 passes (majors 13, 9, 6, 1, 1); harden commit aaa8fe2. Startup note: the handoff JSON still named 10.9 as done (the usage-limit stop commit 66e145d did not update it); the ticket files (partial review log) settled it as 10.10 Step A. One open major for the build: the Scope 4 console capture must turn the celebration seam on (`__wordcell.celebration.setEnabled(true)`, a group mounted) before "absent at HEAD" may close that item. Three owner questions (ticket Scope 9 owner-call rows; the build changes none of them):
1. A second finger down before a press skips the celebration can tap the just-opened end sheet (Replay / New game). Proposed default: leave as built.
2. On a window shorter than the bars plus one card the celebration plays as about 6 s of nothing (NaN physics). Proposed default: skip it and open the end sheet at once, as reduced motion does (new behaviour, not built in 10.10).
3. Below 20 fps a Normal celebration runs past EXPERIENCE.md Motion's 6 s. Proposed default: keep as built and note the low-frame-rate exception in EXPERIENCE.md Motion / AD-19.
Resume: record the answers (ticket Scope 9, epic Notes, SPEC memlog), commit, rerun `.claude/skills/epic-autopilot/scripts/loop.sh epic-end-of-game-words`; the next session continues at Step B (build).
Tokens: 4.0M input-equivalent (ticket review 91%, other 5%, orchestrator 4%); orchestrator peak context 67k

## 10.10 Refactor sweep — built, waiting for you
What it adds: no new behaviour. It tidies the epic's leftovers: corrects stale comments and test names, tightens tests, removes a lint warning and a Svelte console warning in the celebration, syncs two doc lines, and lists every deferred finding of the epic in one table (plan Appendix C) with what happened to it.
Ticket review: 5 passes, converged; three owner questions answered 2026-10-24 (SPEC F30–F32, commit 728b18a); the open major (Scope 4 console capture with the celebration seam on) was resolved in the build (10 warnings at HEAD, 0 after, groups mounted).
Build: built; commits 767ed42, 013200e, af1ed54, 5f1b705. Stops at `built` by the ticket's done checkpoint.
Code review: quick (no high or medium left by the build's own review, risk low), 1 pass, converged; 0 fixes applied; log 37c0d18.
Tests: all passing (unit, build 559956/600000, dist 21, e2e 1098, pwa 17); screenshots passed (67 passed, 39 skipped, no baseline change).
Ref to fix upstream: none
Tokens: 16.1M input-equivalent (build 87%, code review 6%, other 5%, orchestrator 2%); orchestrator peak context 64k
Worth knowing: startup files agreed (10.10 at Step B); a leftover pid file `.autopilot/20261020-0925/10.6-C3.done.pid` names a dead process (ignored). Deferred (low): the Svelte warning fix has no lasting regression check (only the one-off capture). Warm unit median 4.32 s against the 5 s budget (wall time with npx start-up up to 5.01 s); the 1 s watch re-run was not measured. Owner checkpoint items are in the plan's Auto Run Result "For the owner": owner-call rows 40, 45/110, 63, 64, 78/79, 109; flagged declines 41 and 12; doc proposals in Appendix B (AD-17 Touch `doubleTap`, DESIGN.md:692, the F32 notes); the item 10 figures to check.
Close-out docs:
- EXPERIENCE.md § Motion (:414) ← F32: the 6 s cap is simulated time; below 20 fps a Normal run lasts longer (owner, 2026-10-24)
- ARCHITECTURE-SPINE.md AD-19 (:971) ← F32: same low-frame-rate note (owner, 2026-10-24)
- EXPERIENCE.md § Motion and ARCHITECTURE-SPINE.md AD-19 ← F31: a window shorter than the bars plus one card skips the celebration as under reduced motion; follow-up ticket for the retrospective, not built (owner, 2026-10-24)
- none for F30 (left as built)

## 10.10 Refactor sweep — done
Cleanup only (comments, test names and tests, a lint warning and a console warning, two doc lines, one table of every deferred finding). Ticket review 5 passes converged (F30–F32 accepted under the standing rule); build built; code review quick, 1 pass, converged; test:all and screenshots passed. Done checkpoint: Appendix C owner-call rows took their defaults under the owner's standing rule (2026-10-25): test-gap rows 40, 41, 45/110, 78/79 → follow-ups; doc rows 63, 64 and F32 notes → retrospective; 109 noted.

## Run complete
All ten tickets of epic 10 are done (2026-10-25). Next: `/bmad-retrospective` on the epic, apply its owner-approved doc fixes (the Close-out docs below), then mark the epic container done with `bmad-preview-ticketing`.
Close-out docs:
- ARCHITECTURE-SPINE.md AD-19 Start ← F16 (2026-10-23); Skip ← F17, F18, F19; Rule bullet 1 ← F21/F23/F26 per-card motion; Hide ← F28; AD-19 cap ← F32 low-fps note; AD-13/AD-19 ← `src/ui/open-menu.ts`; AD-17 Touch ← `doubleTap` (2026-10-24) — 10.9 applied most; check what remains
- EXPERIENCE.md "Never plays" ← F16; Win celebration rows ← F27, F28; Motion ← F31, F32
- DESIGN.md Win celebration ← F20 35 % overlap, F26 no launch row; A-D12 accepted (owner read 2026-10-24); line 692 wording (10.10 row 64)
- epic SPEC CAP-2 and F25 wording ← F21–F27; References F-range F1…F32
- docs/game-flow-spec.md R-87 ← dictionary banner exempt from press skips (applied in 52d5aa5)
- tickets.toml entry 7 `interface` (declined, not maintained after pull)
Follow-ups for the retrospective: F31 short-window skip (new ticket); 10.10 test-gap rows 40, 41, 45/110, 78/79; the unit-suite watch re-run budget (unmeasured).
