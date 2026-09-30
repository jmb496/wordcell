# Epic autopilot — epic-rules-engine — run 20260930-0738

Epic: epic-rules-engine (`_bmad-output/initiative-wordcell-v1/epic-rules-engine/`)
Branch: epic-2-engine
Start commit: fad187e
Arguments: stop-after=2.13
Authorisation: owner (Jared) authorised autopilot mode on 2026-09-28 (methodology § Autopilot); ticket 2.13 (D-STATS) approved by the owner on 2026-09-30.

## 2.13 Statistics exclude negative given-up scores — done
What it adds: best score and average score now leave out given-up games that ended below zero. Won games always count, and a given-up game at 0 or more counts. Left-out games still count in games played, games given up and longest word ever. With no qualifying game, best and average show "—".
Ticket review: 2 passes, converged (majors 2, 0); nothing needed your input
Build: built; commits 39856a9
Code review: quick, 1 pass, converged; 0 fixes applied
Tests: all passing
Ref to fix upstream: none
Worth knowing: nothing

## Run complete
Ticket 2.13 done (stop-after=2.13). Every ticket of epic 2 is done. Next: `/bmad-retrospective` on epic-rules-engine.
