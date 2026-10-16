# Review log — ticket 6.12 (Winning guard: the end-sheet half)
State: pass 4: review
Pre-loop: HEAD a11599b; words 298 (budget 1500); copy /mnt/d/CodeProjects/wordcell/_bmad-output/initiative-wordcell-v1/epic-game-surfaces-and-keyboard/story-winning-guard-the-end-sheet-half.review-log.passes/pass0.md

## Pass 1 — 2026-10-15
Reviewers: builder, edge-case, adversarial, ref alignment  |  Findings: major 7 (merged), minor 4, decision-needed 0  |  Dropped in triage: 0
Words (docs): 875 (2.9x pass 0; budget 1500)  |  Snapshot: passes/pass1.md
### Applied
- [major] Undo-alias predicate and "Undo enabled" source (injected canUndo) → fixer 1
- [major] Who cancels the open (existing onUnfinished/cancelEndSheetOpen via Undo dispatch) → 2
- [major] Open timing max(settled, install+300), no-animation case, backstop independence → 3
- [major] Acceptance matrix from build-notes rows, desktop-only keys, no new screens spec → 4
- [major] Dropped CAP-5 clauses (token kill, hide, back, Esc/Tab/M/N/New game/Replay) → 5
- [major] Held Z repeats/keyup → 6
- [major] Menu-button case → 7
- [minor] Redo win regression-only; inUndo wording → 8, 9
### Default applied (technical)
- Undo-enabled source → injected canUndo from GameView flag
- Cancel owner → Undo dispatch unfinished result
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- none

## Pass 2 — 2026-10-15
Reviewers: fix-diff, edge-case, adversarial, ref alignment  |  Findings: major 5 (merged), minor 4, decision-needed 0  |  Dropped in triage: 0
Words (docs): 1208  |  Snapshot: passes/pass2.md
### Applied
- [major] Undo button pointerdown/click race: accepted Undo press suppresses the pending open until dispatch or cancel → 1
- [major] Alias aligned with EXPERIENCE/keys.ts (Shift+Z is Undo, Alt excluded) → 2
- [major] Held Z repeats follow keys.ts → 3
- [major] Hide vs 300 ms floor → 4
- [major] AC rows: Redo button, input between settle and 300 ms, Undo after open → 5
- [minor] floor home whenOpenAllowed; win-path only; open uninstalls guard; modifier keydown → 6-9
### Default applied (technical)
- Floor in motion.ts whenOpenAllowed; suppress-open on accepted Undo press
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- none

## Pass 3 — 2026-10-15
Reviewers: fix-diff, edge-case, adversarial, ref alignment  |  Findings: major 3 (merged), minor 4, decision-needed 0  |  Dropped in triage: 0
Words (docs): 1458  |  Snapshot: passes/pass3.md
### Applied
- [major] Held-back open release mechanism (setTimer(0) after gesture end; dispatch/blur/hide/uninstall/reset clear) → 1
- [major] Guard keeps consuming non-Undo inputs while held (uninstall deferred) → 2
- [major] Hide/back completion had no wiring: finishGuard() added to main.ts hooks → 3
- [minor] held Z wording; Y/Ctrl+Y; whenOpenAllowed uninstalls on open; R-62 Normal/Slow AC → 4-7
### Default applied (technical)
- Time-based hold release via injected timers; finishGuard() export
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- none
