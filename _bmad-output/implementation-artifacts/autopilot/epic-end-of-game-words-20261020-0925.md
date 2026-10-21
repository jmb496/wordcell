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
