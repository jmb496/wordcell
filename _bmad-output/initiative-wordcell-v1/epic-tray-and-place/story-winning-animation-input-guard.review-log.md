# Review log — story-winning-animation-input-guard (ticket 5.13)

State: pass 6: done

Pre-loop: HEAD b4217aca8a4b116c10a8e413a5e4e1992aa49812; copy /mnt/d/CodeProjects/wordcell/_bmad-output/initiative-wordcell-v1/epic-tray-and-place/story-winning-animation-input-guard.review-log.passes/pass0.md; 365 words (wc -w of whole file).
Mode: docs, thorough, max 7. Budget default 2.5x (~912 words).
Ticket-entry fields not copied into the story (to be added to the Description by the fixer in pass 1): interface, tests, owns, unknown, risk, consumers (entry 13 of tickets.toml, lines 246-260).

## Pass 1 — 2026-10-14
Reviewers: builder, edge-case, adversarial, ref-alignment  |  Findings: major 10 (merged), minor 1, decision-needed 0  |  Dropped in triage: 0 (duplicates merged)
### Applied
- [major] ticket-entry fields interface/tests/owns/unknown/risk/consumers added to Description (caller request) → item 1
- [major] Description — consumed-gesture rules dropped from F8 (triggering gesture never completes; all gestures before settle/within 300 ms consumed) → item 2
- [major] uninstall/backstop preconditions, 120 ms reduced backstop, uninstalling event not consumed → item 3
- [major] Undo precedence over 300 ms, key repeats/keyup after Undo uninstall, tracker outlives guard → item 4
- [major] blur listener ownership, hide-clear registration order, hide/blur cases → item 5
- [major] install point (not at flip.play start), settle/complete/hover-clear seams → item 6
- [major] injectable clock, multitouch cases → item 7
- [major] prefs-fast.json content → item 8
- [major] held-Enter fallback → item 9
- [major] hover-peek three cases, R-62, double-tap assertions → item 10
- [minor] epic-6 non-goal line → item 11
### Default applied (technical)
- held-Enter: Vitest repeat:true events authoritative; seams: motion.ts callbacks (no flip/gestures imports); prefs-fast Fast speed.
### Decision needed (functionality / UX / gameplay)
- none
Words (docs): 904 (2.48x pass 0)  |  Snapshot: /mnt/d/CodeProjects/wordcell/_bmad-output/initiative-wordcell-v1/epic-tray-and-place/story-winning-animation-input-guard.review-log.passes/pass1.md

## Pass 2 — 2026-10-14
Reviewers: fix-diff, edge-case, adversarial, ref-alignment  |  Findings: major 10 (merged), minor 3, decision-needed 0  |  Dropped in triage: 0 (duplicates merged)
### Applied
- [major] tracker start seam unnamed → item 1
- [major] settle notification for reduced-motion/empty-set play() → item 2
- [major] hide/blur uninstall vs backstop wording contradiction → item 3
- [major] repeat keydown with no tracked gesture after a clear → item 4
- [major] duplicate pointerId behaviour → item 5
- [major] click consumption rule → item 6
- [major] post-uninstall consumption of every consumed gesture → item 7
- [major] AC for idempotent install and stray keyup/pointerup → item 8
- [major] hide-clear wiring proof through boot → item 9
- [major] injectable clock seam and backstop timing cases → item 10
- [minor] consumers wording; install parenthetical → items 11, 12
### Default applied (technical)
- tracker at module load (or one main.ts call per AD-16); repeats consumed; duplicate id same gesture; all clicks consumed except in Undo.
### Decision needed (functionality / UX / gameplay)
- none
Words (docs): 1150 (3.15x pass 0, over the 2.5x budget)  |  Snapshot: /mnt/d/CodeProjects/wordcell/_bmad-output/initiative-wordcell-v1/epic-tray-and-place/story-winning-animation-input-guard.review-log.passes/pass2.md

## Pass 3 — 2026-10-14
Reviewers: fix-diff, edge-case, adversarial, ref-alignment  |  Findings: major 6 (merged), minor 1, decision-needed 0  |  Dropped in triage: 0 (duplicates merged)
### Applied
- [major] module-load tracker throws under Vitest node env (vite.config.ts environment 'node') → explicit startTracker from main.ts boot → item 1
- [major] reduced motion plays a real 120 ms fade (flip.ts flyToCell), settle at fade end, not early return → item 2
- [major] Playwright hide case asserted an unexposed predicate → observable tap after 420 ms → item 3
- [major] install point vs F8 "not when flip.play starts" → reading stated → item 4
- [major] new pointerdown/keydown while a consumed gesture is open after settle+300 ms → item 5
- [major] click ownership after uninstall (owed-click flag) → item 6
- [minor] backstop-expiry uninstall wording → item 7
### Default applied (technical)
- startTracker(doc, win, now, timers) from main.ts; owed-click flag; observable-based hide e2e.
### Decision needed (functionality / UX / gameplay)
- none
Words (docs): 1150 (3.15x pass 0, over the 2.5x budget)  |  Snapshot: /mnt/d/CodeProjects/wordcell/_bmad-output/initiative-wordcell-v1/epic-tray-and-place/story-winning-animation-input-guard.review-log.passes/pass3.md

## Pass 4 — 2026-10-14
Reviewers: fix-diff, edge-case, ref-alignment (adversarial dropped, late-pass)  |  Findings: major 3 (merged), minor 1, decision-needed 0  |  Dropped in triage: 0
### Applied
- [major] owed-click flag could swallow Undo's own click (contradicts Undo pass-through) → item 1
- [major] hide e2e "420 ms" figure wrong (backstop is duration('snap') of the active speed, from the hide) → item 2
- [major] consumers field lacked the four consumers required by tickets.toml → item 3
- [minor] "in the window" undefined → item 4
### Default applied (technical)
- Undo-click exempt from owed-click; hide e2e wait derived from active-speed snap.
### Decision needed (functionality / UX / gameplay)
- none
Words (docs): 1150 (3.15x pass 0, over the 2.5x budget)  |  Snapshot: /mnt/d/CodeProjects/wordcell/_bmad-output/initiative-wordcell-v1/epic-tray-and-place/story-winning-animation-input-guard.review-log.passes/pass4.md

## Pass 5 — 2026-10-14
Reviewers: fix-diff, edge-case, ref-alignment  |  Findings: major 2 (merged), minor 0 (two edge-case minors merged into majors), decision-needed 0  |  Dropped in triage: 0
### Applied
- [major] backstop-expiry uninstall wording dropped the 300 ms floor (F8/F23) → item 1
- [major] Undo exception only stated for click; Undo pointerdown/keydown vs owed-click clear and consumed-open rule → item 2
### Default applied (technical)
- Undo events (all types) pass through and are exempt from owed-click.
### Decision needed (functionality / UX / gameplay)
- none
Note: pass 4's fixer cut the unknown/tests/risk bullets of the Also: list (risk in frontmatter, unknown in Notes, tests in AC); the pass-5 fix-diff reviewer did not report the loss as a defect.
Words (docs): 1147 (3.14x pass 0, over the 2.5x budget)  |  Snapshot: /mnt/d/CodeProjects/wordcell/_bmad-output/initiative-wordcell-v1/epic-tray-and-place/story-winning-animation-input-guard.review-log.passes/pass5.md

## Pass 6 — 2026-10-14
Reviewers: fix-diff, edge-case (no findings), ref-alignment  |  Findings: major 1, minor 1, decision-needed 0  |  Dropped in triage: 0
### Applied
- [major] no test asserts the first new gesture completes the animation (calls `complete`) and the triggering gesture's events never do (F8 core clause) → item 1
- [minor] generalised Undo pass-through must not override already-consumed gestures' marks → item 2
### Default applied (technical)
- none
### Decision needed (functionality / UX / gameplay)
- none
Words (docs): 1148 (3.15x pass 0, over the 2.5x budget)  |  Snapshot: /mnt/d/CodeProjects/wordcell/_bmad-output/initiative-wordcell-v1/epic-tray-and-place/story-winning-animation-input-guard.review-log.passes/pass6.md
