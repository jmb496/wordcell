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

## 10.2 End-sheet Words section — stopped (screenshot baselines)
What it adds: The end-of-game sheet shows a Words list (longest first) below its buttons, with an empty-game line.
Ticket review: 4 passes, converged; nothing needed your input
Build: built; commits 02b125b
Code review: quick, 2 passes, converged; fixes applied in 5068d95
Tests: test:all passing (first run had 8 unrelated timeout flakes in dictionary and drag-interruptions specs, which passed alone and on a full rerun). Screenshots FAILED: the 3 existing end-sheet baselines (expanded, history-unreadable, not-added; android and desktop) differ by about 4% of pixels because the sheet now has a Words section. All other 60 screenshot checks passed.
Ref to fix upstream: none
Tokens: Tokens: 4.6M input-equivalent (ticket review 50%, build 26%, code review 13%, other 7%, orchestrator 5%); orchestrator peak context 67k
Worth knowing: ticket stays "built"; not marked done. Unapplied minors were handed to the build. The 1-letter row is covered by the Vitest AD-3 test only (exempt from P6, min word 3).
Close-out docs: none
