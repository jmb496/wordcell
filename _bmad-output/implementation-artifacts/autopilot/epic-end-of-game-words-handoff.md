outcome: done
ticket: 10.5
reason: done
next: 10.6 (Celebration skip)

Plain language: ticket 10.5 is done. Winning a game now plays the word celebration and then opens the end sheet. Your answer (keep both behaviours as built: a win that happens while the app is in the background shows the end sheet with no celebration, and reduced motion adds no back-button step) is recorded as SPEC F16. The full test suite and the screenshot check both passed. The test that had failed under load before (e2e/nav.spec.ts:162) passed this time.

Worth knowing:
- Until ticket 10.7, pressing ☰ or M during a celebration halts the app. Don't merge the epic branch before 10.7.
- 10.8 should add a test that a real win in the production build starts the celebration.

Close-out docs (applied at the retro or by 10.9):
- ARCHITECTURE-SPINE.md AD-19 Rule, Start bullet ← F16 (owner, 2026-10-23): background win opens the sheet with no celebration; reduced motion or the seam off pushes no celebration history entry
- EXPERIENCE.md celebration "Never plays" ← F16 (owner, 2026-10-23): add the background win
- Carried from 10.4: EXPERIENCE.md § Keyboard ← F15 (owner, 2026-10-23)

Digest: _bmad-output/implementation-artifacts/autopilot/epic-end-of-game-words-20261020-0925.md
Resume: the driver continues with 10.6 (`.claude/skills/epic-autopilot/scripts/loop.sh epic-end-of-game-words`).
