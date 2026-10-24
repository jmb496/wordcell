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
Build: not started
Code review: not started
Tests: not run
Ref to fix upstream: none
Tokens: 11.1M input-equivalent (ticket review 97%, orchestrator 1%, other 1%); orchestrator peak context 64k
Worth knowing: The ticket has `done_checkpoint = true` (your Android read of a real win with the long-word fixture settles the copy cost, the initial constants and A-D12), so once built and verified it stays `built` for your check rather than being marked done. Also `plan_checkpoint = true`, so the plan's Design Notes owner items will be worth a read. Two minors to fix first: the Verify line puts the Space/Esc row on `android` when it runs on `desktop`, and if the app halts during a celebration, the first tap on the error screen's Reload would be taken as a skip.
Close-out docs: pending your answer (AD-19 Skip, synced by 10.9)

## Stopped — decision needed
Ticket 10.6, Step A: the ticket review converged and the ticket and its log (with `## Result`) are committed (69c9ca6). Question (log Pass 1): on desktop, after the winning word is confirmed by a click or Enter, focus stays on the action bar's primary button, which then reads New game. AD-19 Skip says Space/Esc skip "unless a bar or banner control holds focus", so in that usual flow Space would start a new game and Esc would do nothing. R-87, EXPERIENCE.md Keyboard and SPEC F9 give no focus exception. Proposed default: Space and Esc skip whatever holds focus while the celebration plays; AD-19's focus exception is dropped at 10.9's doc sync. Resume: record the answer (ticket Notes, epic Notes, SPEC memlog), commit, rerun `.claude/skills/epic-autopilot/scripts/loop.sh epic-end-of-game-words`; the next session continues at Step B (build).

## Stopped — usage limit
Ticket 10.6, Step B (build): the F17 answer is recorded (2a0bfbd); the build started 20:24 and hit the session limit at 20:32 (`You've hit your session limit · resets 9:50pm (America/New_York)`); the orchestrator was limited too. The build's own uncommitted plan `story-celebration-skip-plan.md` (status `in-progress`) is left in the tree for bmad-build-auto's resume (Setup 2 exception); step log kept as `10.6-B-attempt1.log`. Resume after the reset: `LIMIT_CHECK=off .claude/skills/epic-autopilot/scripts/loop.sh epic-end-of-game-words`.
