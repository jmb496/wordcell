# Autopilot run 20261017-0745: epic-how-to-play-scenes

Epic: epic-how-to-play-scenes (rework tickets 8.6 to 8.11)
Branch: epic-8-how-to-play
Start commit: 3545263
Authorisation: owner, 2026-09-28 (methodology § Autopilot)

## 8.6 Scene carousel and whole play-area stage — done
What it adds: How to play now shows one scene at a time in a carousel (arrow buttons, dots, Left/Right keys) on a stage that draws the whole play area.
Ticket review: 7 passes, converged; the owner confirmed the four carousel behaviours on 2026-10-17 (no swipe, no wrap-around, always opens on scene 1, scenes restart on entry)
Build: built; commit 68b5c41
Code review: thorough, 2 passes, converged; 1 fix applied (cd4d19f, e2e spec)
Tests: all passing, screenshots passed
Ref to fix upstream: none
Tokens: 5.7M input-equivalent (build 67%, code review 26%, other 5%, orchestrator 3%); orchestrator peak context 55k
Worth knowing: nothing
Close-out docs: EXPERIENCE.md (How to play carousel behaviours) <- owner confirmation 2026-10-17: no swipe, no wrap-around, always opens on scene 1, scene restarts on entry

## 8.7 Scenes 1 and 2: move and compose, then add a WordCell letter — stopped (step A, decision needed)
What it adds: the first two How to play scenes: move a stack and build a word with the destination letters, then borrow a WordCell's top card as a free letter.
Ticket review: 5 passes, converged (majors 9, 4, 2, 1, 0); two items need your input (below)
Build: not started
Ref to fix upstream: none
Worth knowing: the review log has an uncommitted final edit, committed with this stop.
