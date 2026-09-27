# Review loop log — DESIGN.md

Target: `_bmad-output/planning-artifacts/ux-designs/ux-wordcell-2026-09-27/DESIGN.md`
Mode: docs · max 4 · depth thorough · refs: brief, `docs/game-flow-spec.md`, `docs/requirements-carryover.md`,
`docs/platform-decision.md`, `CLAUDE.md` (EXPERIENCE.md read as companion only). Pre-loop state: `e119791`, pass-0 copy in scratchpad.

## Pass 1 — 2026-09-27
Reviewers: builder's reading, edge-case hunter, adversarial, ref alignment  |  Findings: major 26, minor 30 (merged to 26 fix items)  |  Decision needed: 0  |  Dropped in triage: 0 (duplicates merged)
### Applied
- [major] Layout — tray outside one-thumb reach (brief §9) → tray band moved between columns and action bar, A-D8
- [major] Layout — height rule approximate, no floor, tray height missing → exact sum with insets, minimum card height 53, page scrolls below; leftover height above the WordCell row
- [major] Layout — tile counts irreproducible, compact tile wider than card at 360 px → tile width max(card, 44), gap/padding formula, 7 per row / 14 in two rows; band reserved height; growth past two rows named as the one exception
- [major] Layout — 40 px cards below 44 px target → hit rects are the full slot pitch
- [major] Typography — serif subset lacks digits used by end score and Place line → numbers and symbols in sans
- [major] Components — 23-letter word overflows word line → word line shrinks 20→14 px; meta on its own sans line
- [major] Components — points preview `+36` wrong under R-80 when a free letter leaves its cell → net change, `+30`
- [major] Components — WordCell view defined only to 18 cards → 9 per row, any rows, scroll past 60 % height
- [major] Colors — flourish and band name broke the accent rule → neutral flourish, ink-primary band name, icon named as the exception
- [major] Colors — disabled contrast misquoted, "every disabled control has a reason" false → 2.49:1 stated, claim limited to Validate
- [major] Elevation — end sheet scrim vs usable action bar → action bar above the scrim; collapsed sheet has no scrim
- [major] Components — column numbers in mock but "not drawn" → removed from mock; foot row shows numbers on hover devices
- [major] Components — D cards in Place drawn as locked → ordinary movable tiles in Place
- [major] Components — used WordCell states and combinations undefined → ghost + hatch, ring over hatch in Place
- [major] Components — no visual spec for Validate reason, dictionary banner, history notice, error dot, hover outline, dialog action styles → added
- [minor] ×11 — QU glyph and badge boxes, button-label token, circles for icon buttons, invalid-message lifetime deferred to EXPERIENCE, inert wording, QU on word line, strip reading order across rows, whole-column placeholder, outline token for non-text contrast, rounding rule, stats tile wrap
### Decision needed
- none
### Dropped
- none

## Pass 2 — 2026-09-27
Reviewers: builder's reading, edge-case hunter, adversarial, ref alignment  |  Findings: major 22, minor 26 (merged to 28 fix items)  |  Decision needed: 0  |  Dropped in triage: 0 (duplicates merged)
### Applied
- [major] Components — dictionary banner hid the live score and timer (R-82, R-76) → 44 px strip under the top bar; score and timer stay
- [major] Components — WordCell view 9 per row wider than phones → per-row formula (7 on phones), row order stated
- [major] Components — hover peek had no visual spec → anchored below the cell over the columns, no scrim, at most 14 cards
- [major] Components — `Here` pill could not fit a slot → whole foot pad filled, ui-label
- [major] Layout — action-bar, empty-column caption and invalid-message overflow at 360 px → icon-only Undo/Redo, caption replaces controls, shrink then ellipsis
- [major] Layout — minimum portrait still scrolled over `touch-action: none` cards → meta line folded into the control row, chrome trimmed (top bar 44, gap 4, action bar 60), A-D3 now 360 × 740; pan-y only on non-card regions when scrolling is unavoidable
- [major] Layout — height rule not invertible, strip unrounded → integer card-width search, rounded strip
- [major] Components — bottom/top labels had no room in compact rows → tags inside the first/last tiles
- [major] Components — drop highlight on the source column, D cards in the column during Place, selected-target ghost without room, focus vs selection indistinguishable → specified or removed
- [major] Layout vs EXPERIENCE — fixed px heights vs scaling text → board text fixed px, panels and dialogs rem (A-D9)
- [minor] ×17 — disabled Validate reason in ink-secondary, card-edge to 3.2:1, brand sentence, desktop gutter media query, wrapped D block, compact tile glyph, Qu font size, glyph positions, hover scoping, stats wrap order, Game over inert, U+2212 everywhere, band growth per row, meta per phase, Pixel 7 test viewport, A-D10 origin tag in Place
### Decision needed
- none (the self-drop question is logged against EXPERIENCE.md)
### Dropped
- none

## Pass 3 — 2026-09-27
Reviewers: builder's reading, edge-case hunter, adversarial, ref alignment  |  Findings: major 9, minor 38 (merged to 21 fix items)  |  Decision needed: 0  |  Dropped in triage: 0 (duplicates merged)
### Applied
- [major] Layout — action bar "pinned" yet "pushed down" by band growth and the banner → sticky action bar; growth and banner consume the leftover band first
- [major] Layout — viewport measure and recompute timing unstated; hit rects could move mid-gesture → `window.innerHeight`, `viewport-fit=cover`, recompute deferred until no gesture (A-D11)
- [major] Components — compact Place tiles had colliding marks and no star position → corner map (▼/★ top-left, ×2 top-right, origin tag bottom-left)
- [major] Components — wrapped D segments without a lock relied on hue alone → a lock on every segment
- [minor] ×17 — QU glyph below the badge row, 738→740 arithmetic and H > 92 closed form, tile mode switches after drop, sheet width and peek order/clamp, end-sheet max height/bar position/collapse triggers/history block, foot-pad shape cue and desktop Here, badge pills, lift overlap, extra pan-y regions, sprite wording, card-edge 3:1 on surface, tile glyph sizing, rem conversion, Idle Validate label colour, inline SVG icons, accent wording, caption in player vocabulary
### Decision needed
- none
### Dropped
- none

## Pass 4 — 2026-09-27
Reviewers: builder's reading, edge-case hunter, adversarial, ref alignment  |  Findings: major 9, minor 33 (merged to 24 fix items)  |  Decision needed: 0  |  Dropped in triage: 1
### Applied
- [major] Typography — card face left to build time (brief §9 gives card art to UX) → Fraunces 600, opsz 48, SOFT 0, WONK 0 named (A-D2)
- [major] Layout — no insertion preview for a full tray row → teal caret, no tile moves; mode switches after release
- [major] Layout — tile-mode trigger covered drops only → any completed edit; play area may shift after the edit for words over 14 tiles
- [major] Layout — growth arithmetic wrong for H > 92 → general formula; phone +48/+96, desktop +45/+93
- [major] Layout — horizontal pan blocked by `pan-y` below 360 px → `pan-x pan-y` there
- [minor] ×19 — card-width floor, scroll criterion vs 740 floor, QU vertical box and fixed badge, full icon inventory with colours, action bar in the layer order, count badge/check chip/lock boxes, bars span board width, used + not-legal opacity, ghost vs placeholder stroke, banner wording and deferral, secondary button border, orange wording, flourish omitted under tags, safe-area padding, `+n older cards`, `±0` preview, pending-line ellipsis, WordCell drag ghost, Place word line
### Decision needed
- none
### Dropped
- WordCell view "6 per row at 360 px" (ref-alignment) — wrong arithmetic: inner width 320, floor(324 ÷ 44) = 7; text states 7 and that the formula governs

## Result — capped at 4 passes
Majors fell 26 → 22 → 9 → 9 but did not reach zero. The pass-4 fixes were applied and are not re-reviewed. Late majors were geometry and edge detail (full-row insertion, growth arithmetic, touch-action), not contradictions with the refs; no ref needs fixing.

## Owner answers — 2026-09-27
- Tray position: Jared chose the tray directly under the WordCell row (free letters next to it); action bar stays at the bottom. A-D8 removed; recorded as an owner decision relaxing brief §9's one-thumb goal for the tray only.
- All other assumptions confirmed.

## Pass 5 (requested by the owner, beyond the cap) — 2026-09-27
Reviewers: builder's reading, edge-case hunter, adversarial, ref alignment  |  Findings: major 6 (3 distinct after merge), minor 38  |  Decision needed: 0  |  Dropped in triage: 0
### Applied
- [major] Hover peek text and anchor differed from EXPERIENCE.md → one definition (top 14, `+n older cards` above the first row)
- [major] Desktop hover with a tail selected highlighted source-column cards as a drop target, but a click re-selects → highlight only over empty space, placeholder, `Here`
- [major] Word line in Place ambiguous after reorder; sticky bars missing from the layer order; "full row" undefined for reorder drags → specified
- [minor] ×25 — badge ink, 11 px list, one desktop media query, A-D3 trigger wording, ghost/hatch/chip/outline/segment values, view-sheet token, tray internals, opacity wording, fixed-px board text, dialog secondary fill, recompute triggers, action-bar height, static font instance with no silent fallback, flourish geometry, focus ring on strips, error fill for danger, scroll vs resize, emptied self-destination, ↩ only in Composing, count badge until commit, mock lock glyph, disabled menu row, pan-x keyed to overflow

## Result — finalized after pass 5
All pass-5 majors fixed; no open questions. Status set to final.

## Layout revision — 2026-09-27
Owner decision revised: the WordCell row and tray move below the columns (order: top bar, columns, WordCell row, tray, action bar), so WordCells, tray, Validate, Confirm and Undo share the bottom thumb zone. Fallback: WordCells and tray back above the columns if ergonomics disappoint in testing; band order to live in one layout definition, switchable in dev builds. One cross-document consistency check afterwards: 1 major (peek sticky threshold 60 % vs 80 %) and 1 minor (column-area edge wording), both fixed.

## Layout revision 2 — 2026-09-27
Owner decisions: band order top bar (menu, score, timer, Undo, Redo), leftover, columns, tray, WordCell row, 8 px gap, action bar with only the full-width primary button. Cards flow one way down the screen; Undo/Redo moved to the top bar (overrides brief §9's Undo-in-thumb-reach goal).
Clear-context review (one reviewer, both spines, four lenses combined): major 2, minor 7, decision-needed 0, plus one orchestrator error caught by the fixer (collapsed end-sheet bar placed over the WordCells). All applied: layer order puts lifted tails above the bars; growth beyond the leftover keeps the WordCell row fixed via scrollTop (also for the dictionary-failed banner); collapsed bar over the empty tray band; Undo rationale corrected to R-71; band summaries, gap wording, banner stickiness and name, top-bar safe-area padding, Idle tray line.
