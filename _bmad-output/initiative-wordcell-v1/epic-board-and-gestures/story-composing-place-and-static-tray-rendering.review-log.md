# Review log — story-composing-place-and-static-tray-rendering.md (ticket 4.3)

State: pass 1: done

Mode: docs, thorough, max 7, budget 1120 words (2.5 x (339 pass-0 words + 109 carried toml words)). Pass 0: HEAD c01b011, copy story-composing-place-and-static-tray-rendering.passes/pass0.md, 339 words.

Intent carried from tickets.toml entry 3 (not copied by the pull): unknown, interface, tests, owns; pass-1 fixer adds interface, tests, owns to Description as 'Interface:', 'Tests:', 'Owns:' (unknown is already in Notes as the open question).

## Pass 1 — 2026-10-02
Reviewers: builder, edge-case, adversarial, ref-alignment  |  Findings: major 13, minor 2, decision-needed 0  |  Dropped in triage: ~14 (duplicates merged; 'card 9 free letter' wrong, it is 28)
Words (docs): 978 (2.9 x pass 0; 0.87 of budget)  |  Snapshot: story-composing-place-and-static-tray-rendering.passes/pass1.md
Fixer: all 15 items applied; engine probes via npx tsx (fixture views, Undo/Redo walk, rebuild byte-equal). Orchestrator note: fixer moved the valid-fixture list test from src/architecture.test.ts into serialize.test.ts in error (it is src/architecture.test.ts:1932) → carry to pass 2.
### Applied
- [major] Description — toml interface/tests/owns not carried → fixer item 1
- [major] AC — R-42 session-place, R-22 idle-empty-column, R-33 after Undo missing; AD-14 on Composing with a free letter → 2
- [major] AC — Redo-into-Composing path unnamed (Undo ×2, Redo) → 3
- [major] AC — AD-14/reload checks have no fixed expected values → 4
- [major] AC — reload clause lists used cell/target for session-composing → 5
- [major] Mirrors may carry data-place (F23 press targets) → 6
- [major] Open question answered by F2; compact/clipped branch untested → 7
- [major] D block reversal (R-30) and destination-block look dropped → 8
- [major] New fixture needs ValidName/PROPERTIES and a dictionary for its rebuild → 9
- [major] Whole-column placeholder rule has no test → 10
- [major] smoke.spec.ts 'live cell cards' test contradicts the used-cell mirror → 11
- [major] --pass-with-no-tests not dropped; screenshot fixtures unnamed → 12
- [major] Count-badge 1/2 boundary handed over by 4.2 dropped → 13
- [minor] Ghost membership via view.draft, not slicing → 14
- [minor] Static tile tags → 15
### Default applied (technical)
- Tray mode → pure UI helper with UI Vitest at 7/8/14/15 tiles, 412/360 px
- Expected mirror sets/orders → engine-computed literals in the plan
- Static tray tiles → plain face, no origin/position/star tags (epic 5 owns tags)
- Count badge → assert if reachable from fixture Undo/Redo states, else Notes deferral
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- Duplicates across the four lenses merged; edge-case 'free letter card 9' disproved (cell 3's top is 28).
