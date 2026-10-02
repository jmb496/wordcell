# Review log — story-board-render-in-idle-and-game-over-with-bars.md (ticket 4.2)

State: pass 4: done

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

## Pass 2 — 2026-10-01 21:25
Reviewers: fix-diff, edge-case, adversarial, ref-alignment  |  Findings: major 8, minor 9, decision-needed 0  |  Dropped in triage: 4 (duplicates merged; AD-11 'hard-coded template' stretch kept as minor rename)
Words (docs): 1490 (4.1 x pass 0; at the 1500 budget)  |  Snapshot: story-board-render-in-idle-and-game-over-with-bars.passes/pass2.md
Fixer: all 14 items applied; fixture values (scores 0/0/9→15,15,15,24/355/−530, enablement, badges 24/21/7) checked with npx tsx against the engine; labels track is 16 px per geometry.ts.
### Applied
- [major] WordCellRow — 'visually hidden' ambiguous with h1 sr-only; non-top cell cards need a mechanism; card-0 board-ready waits hit non-top cards → fixer item 1
- [major] Bands — columns/footRow and labels/wordcells band elements vs contiguous column-<n> hit rect incl. foot pad (AD-12) → item 2
- [major] WordCellRow states — pass-1 reword dropped the not-legal (35 %) state (toml, SPEC CAP-2, build-notes CAP-2) → item 3
- [major] Bands — '0 px when empty' contradicts DESIGN reserved tray height; banner 'absent' vs always-rendered band → item 4
- [major] F26 — wordcell-<n> and card wrapper extents unspecified → item 5
- [major] R-70/R-71 — no fixtures or expected states → item 6
- [major] F11 measurement drops H, strip and band-stack fit (build-notes CAP-3) → item 7
- [major] Count badge, desktop column number, tooltip, tabular numerals have no assertion → item 8
### Default applied (technical)
- Non-top cell cards → visibility: hidden; card-0 visibility waits on fixtures where it is non-top → toBeAttached / another ready signal
- Two-band units → one CSS grid per unit, [data-band] row tracks, column-<n> grid item spanning both rows
- Desktop column number via CSS @media (hover: hover) and (pointer: fine); title always present
- Bars take no env() padding until entry 4's probe
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- Duplicates across lenses.

## Pass 3 — 2026-10-01 21:50
Reviewers: fix-diff, edge-case, adversarial, ref-alignment  |  Findings: major 6, minor 4 (over budget: only zero-word fixes sent), decision-needed 0  |  Dropped in triage: 9 (duplicates; plan-level notes: newGame prop, scrollbar shift, wordcell role, strip worked-example, 1-card badge boundary, test file names)
Words (docs): 1499 (4.2 x pass 0; budget 1500)  |  Snapshot: story-board-render-in-idle-and-game-over-with-bars.passes/pass3.md
Fixer: 6 majors + 3 zero-word minors applied; redundancy cut to stay under budget.
### Applied
- [major] Bands grid — empty [data-band] track elements overlap column-<n>/wordcell-<n> items; paint/hit order unstated (F26, CAP-4 elementFromPoint) → fixer item 1
- [major] Bands vs Mount inputs — banner band 0 px from mount bands() vs 44 px content pushing bands → item 2
- [major] Render rules AC — foot number via CSS cannot pass a textContent toHaveText on both projects → item 3
- [major] Board — 'no env() padding until entry 4' hands bar safe-area padding to an entry that does not own it (DESIGN Top bar/Action bar/banner) → item 4
- [major] Bands — wrapping single-band units would break sticky bars → item 5
- [major] Card — epic 3's touch-action: none / user-select: none on cards dropped (helpers.spec touchDrag) → item 6
### Default applied (technical)
- Track elements empty, first in DOM, pointer-events: none
- Banner band content-sized until entry 4
- Foot number DOM span, display: none outside the @media rule; asserted with innerText
- Bars carry DESIGN env() padding now; bands() takes insets {0,0} until entry 4
- Only two-band units get a wrapper; other bands are direct Board children
- Card wrapper keeps touch-action: none and user-select: none (entry 4 adds other regions)
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- Plan-level notes listed above; duplicates.

## Pass 4 — 2026-10-01 22:15
Reviewers: fix-diff, edge-case, adversarial, ref-alignment (late-pass bar)  |  Findings: major 3, minor 3 (zero-word), decision-needed 0  |  Dropped in triage: 8 (plan-level: e2e literals vs src imports, interim banner scroll, word-line position, shared newGame, state screenshots, desktop scrollbar, active-branch root naming; duplicates)
Words (docs): 1496 (4.1 x pass 0; budget 1500)  |  Snapshot: story-board-render-in-idle-and-game-over-with-bars.passes/pass4.md
Fixer: 3 majors + 3 zero-word minors applied; redundant restatements cut to pay for item 1.
### Applied
- [major] Board/Mount inputs — bars' env() padding vs bands() heights with zero insets: box model unspecified; on real-inset Android devices bars squeeze or overflow (shipped behaviour) → fixer item 1
- [major] Card hooks — count badge `.badge` collides with the QU ×2 badge inside wordcell-8 on session-won (gating render-rule test) → item 2
- [major] App — wordcell-<n> role unspecified; a generic div drops the accessible name the kept smoke check asserts (gating) → item 3
### Default applied (technical)
- Bar band heights are content-box; env() padding adds on top; leftover may be off on real-inset devices until entry 4's probe
- Count-badge hook `.count`
- wordcell-<n> role="group"
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- Plan-level items listed above.
