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

## 8.7 Scenes 1 and 2: move and compose, then add a WordCell letter — done (resumed after owner decision)
What it adds: How to play scene 1 shows lifting cards, setting the count with plus/minus, arranging to BAKED and pressing Flip; scene 2 flips back, borrows the top card L of a WordCell to make BALKED, and validates.
Ticket review: 5 passes, converged; owner set scene 1 and 2 content and the Flip ending (BAKED then BALKED) on 2026-10-17 (commit e915ac0)
Build: built; commit 6841d78
Code review: thorough, 3 passes, converged; fixes applied in 2 WIP commits (d63d3dd, 0d554d1)
Tests: all passing, screenshots passed
Ref to fix upstream: none
Tokens: 6.7M input-equivalent (build 54%, code review 39%, other 5%, orchestrator 2%); orchestrator peak context 56k
Worth knowing: unapplied ticket-review minors were passed to the build; tickets.toml entry 7 interface/references still differ from the ticket (sync noted in review log).
Close-out docs: none new (owner's scene content decision lives in the ticket; EXPERIENCE.md carousel entry from 8.6 stands)

## 8.8 Scene 3: place with cards tucking into the WordCell — stopped (step A, decision needed)
What it adds: the Place scene (scene 3) shows the word's cards tucking one by one into the chosen WordCell, ending with a single top card.
Ticket review: 6 passes, converged; majors 8, 7, 5, 2, 2, 0; one item needs your input (caption wording)
Decision: keep the Scene 3 caption as it is ("Pick a WordCell no higher than the word is long. Order the cards: the last one becomes that cell's free letter. Then Confirm.") or reword it to mention the cards tucking in? Only the on-screen text changes; no behaviour or animation. Proposed default: keep it. The epic says scene captions are owner-reviewed.
Build: not started

## 8.8 Scene 3: place with cards tucking into the WordCell — done (resumed after owner decision)
What it adds: In the How to play Place scene the word's six cards now tuck one by one into the chosen WordCell, leaving a single top card (E).
Ticket review: 6 passes, converged; owner kept the Scene 3 caption as approved (2026-10-17, commit 85b6121)
Build: built; commit 118c272
Code review: quick, 1 pass, converged; 0 fixes applied
Tests: all passing, screenshots passed
Ref to fix upstream: none
Tokens: Tokens: 2.9M input-equivalent (build 71%, code review 12%, other 11%, orchestrator 5%); orchestrator peak context 60k
Worth knowing: the build prompt omitted the ticket review's unapplied minors (orchestrator oversight); the code review found nothing major. The owner reviews all scene captions at the epic end.
Close-out docs: none

## 8.9 Scene 4: scoring with stacks growing — stopped (decision needed)
What it adds: the Scoring scene, where each WordCell's stack grows and its score shows (9, 16, 36, total 61).
Ticket review: 4 passes, converged; majors 8, 6, 6, 0; one item needs your input
Decision: should each WordCell grow and then show its own number one cell at a time (3 → 9, 4 → 16, 6 → 36, then total 61), or should all three stacks grow first and then the numbers and total show? Proposed default: one cell at a time (as the ticket now says). Effect: only pacing and teaching order, reduced-motion frames and tap steps; no rules change.
Build: not started

## 8.9 Scene 4: scoring with stacks growing — done (resumed after owner decision)
What it adds: the How to play Scoring scene now shows the three stacks (cells 3, 4, 6) growing downwards in turn, then the figures 9, 16, 36 together, then the total 61.
Ticket review: 4 passes converged, then a 2-pass re-review (majors 4, 0) after the owner chose stacks first (2026-10-17)
Build: built; commit 5aa3ca9 (committed by the orchestrator: the step was told not to commit)
Code review: thorough, 1 pass, converged; 0 fixes applied
Tests: all passing, screenshots passed
Ref to fix upstream: none
Tokens: see handoff run; orchestrator session small
Worth knowing: the build skipped its own internal review; the code review loop covered it. Two minors not applied (defineScene checks), reasons in the plan. Review noted an untested `cards < 2` throw in script.ts and no assertion of top letters beyond the screenshot baseline. The owner reviews all scene captions at the epic end.
Close-out docs: epic-how-to-play-scenes SPEC.md (Scene 4 pacing) ← stacks grow first, then figures, then total (owner, 2026-10-17), if the spec describes the interleaved order

## 8.10 Scene 5: the one Tricky rule — done
What it adds: How to play now ends with one Tricky-rule scene (lift E D K A, drop back on column 1, F must join, FAKED shows in the tray) replacing the three old Tricky scenes; the empty-column and one-top-card scenes are gone.
Ticket review: 4 passes, converged (majors 8, 6, 1, 0); nothing needed your input
Build: built; commit 7bdd8fa
Code review: quick, 1 pass, converged; 0 fixes applied
Tests: all passing (one unrelated desktop e2e teardown timeout in board-keys on the first run passed alone and on a full rerun), screenshots passed
Ref to fix upstream: none
Tokens: Tokens: 5.4M input-equivalent (ticket review 61%, build 26%, code review 6%, orchestrator 4%, other 3%); orchestrator peak context 64k
Worth knowing: epic file Done-when/HP-4/HP-5 wording still says three Tricky scenes, and tickets.toml entry 11 description needs narrowing; both left for 8.11 or the retro. Code review noted no scene-level test for the R-22 empty-column caption sentence and that the harness's rejected branch is removed in 8.11.
Close-out docs: none
