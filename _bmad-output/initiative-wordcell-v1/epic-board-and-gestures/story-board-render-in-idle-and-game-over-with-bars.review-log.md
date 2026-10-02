# Review log — story-board-render-in-idle-and-game-over-with-bars.md (ticket 4.2)

State: pass 1: done

Mode: docs, thorough, max 7, budget 1500 words. Pass 0: HEAD 88bf030, copy story-board-render-in-idle-and-game-over-with-bars.passes/pass0.md, 361 words.
Intent carried from tickets.toml entry 2 (not copied by the pull): verify, unknown, interface, tests, owns, references; pass-1 fixer adds interface, tests, owns to Description as 'Interface:', 'Tests:', 'Owns:' (verify, unknown, references are already in AC, Notes, References).

## Pass 1 — 2026-10-01 21:00
Reviewers: builder, edge-case, adversarial, ref-alignment  |  Findings: major 11, minor 7, decision-needed 0  |  Dropped in triage: ~6 (duplicates merged)
Words (docs): 1064 (2.9 x pass 0)  |  Snapshot: story-board-render-in-idle-and-game-over-with-bars.passes/pass1.md
Fixer: all 16 items applied; --pass-with-no-tests verified against Playwright 1.63.0 (`playwright test --help`).
### Applied
- [major] Description — toml interface/tests/owns not carried; Verify omits AD-14 Game over, R-70/R-71, AD-11 order check → fixer item 1
- [major] Description scope — Composing/Place rendering before entry 3 unspecified (Verify and epic 3 specs load them) → item 2
- [major] WordCellRow — non-top cell cards must stay live, visually hidden (AD-14 52 on session-won); smoke.spec y-order test conflicts → item 3
- [major] App replacement — invalid-word line home, Board inert under History notice, dialogs beside Board, wordcell-<n> accessible name → item 4
- [major] Mount inputs to cardWidth/bands unspecified; banner appears after mount → item 5
- [major] font.spec.ts Seed sample runs hook-free (dist-smoke); cannot move to current() → item 6
- [major] Card wrapper/face split breaks app-shell/font card style asserts; glyph locator; QU glyph `Qu` vs literal QU → item 7
- [major] AD-11 order check has no band locator → item 8
- [major] Visually hidden h1 must keep toBeVisible waits passing; name 'WordCell' → item 9
- [major] Deleting the only screens spec makes test:screens:run fail 'No tests found' → item 10
- [major] Score Verify has no oracle and no named Redo-across-commit flow → item 11
### Default applied (technical)
- Mount insets → {top:0,bottom:0} until entry 4's probe; hoverFine one matchMedia read; trayRows 1; bannerShown false; banner band content-sized
- Band locator → data-band="<BandId>"
- Glyph/face hooks → classes .face/.glyph, no new data-testid
- h1 → 1×1 px clipped sr-only pattern
- Screens → --pass-with-no-tests on test:screens:run until entry 3
- Tooltip → title attribute = text.undo/text.redo
- Font sample → top-bar Score text
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- Duplicates across lenses merged into items 1–11; "used/target states duplicated with entry 3" folded into minor 13.
