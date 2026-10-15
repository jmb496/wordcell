# Autopilot digest — epic-game-surfaces-and-keyboard (20261014-2230)

Epic: epic-game-surfaces-and-keyboard (epic 6)
Branch: epic-6-surfaces
Start commit: 4d4e5dd
Authorisation: owner-authorised autopilot, 2026-09-28 (methodology § Autopilot). Local commits only, never pushed.

## 6.1 Surface foundation and the one New game function — stopped
What it adds: the shared building blocks for every menu, panel and confirm dialog, plus the rule that New game stays one function.
Ticket review: 3 passes, diverging (majors 11, 4, 5); no decision-needed items, but three late majors touch spec/spine intent, so the run stopped (rule 1).
Build: not started
Ref to fix upstream:
- Undo/Redo reachability under menu, panels and confirms → build-notes.md, Per-surface behaviour table ("Bars live" column says "per EXPERIENCE.md" instead of saying only the end sheet leaves the bars live); a pass-2 fix added an unreachable Undo-over-a-surface path and should be reverted to the by-construction sentence in the ticket.
- Reduced-motion mechanism for CSS-driven surface transitions → ARCHITECTURE-SPINE.md AD-14 / AGENTS.md motion rule (`--wc-base-ms`) versus `duration('overlay')` 120 ms in src/ui/motion.ts.
- open(<new id>) against peek, hover peek, tile/tail selection and WordCell view on top; historyNotice's legal tops; transition rules with no test → ticket 6.1 Guards and Tests; ARCHITECTURE-SPINE.md AD-13.
Close-out docs: none
