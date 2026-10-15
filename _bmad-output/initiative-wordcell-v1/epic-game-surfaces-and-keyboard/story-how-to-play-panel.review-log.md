# Review log — story-how-to-play-panel.md

State: pass 3: done

Pre-loop: HEAD ae31bafbb84ba3dd16240be0c00aa8cabe9bfc85; copy at story-how-to-play-panel.review-log.passes/pass0.md; 217 words; budget 1500 words.

## Pass 1 — 2026-10-15
Reviewers: builder's reading, edge-case hunter, adversarial, ref alignment  |  Findings: major 8, minor 4, decision-needed 1  |  Dropped in triage: 0 (duplicates merged)
Words (docs): 695 (3.2 x pass 0; budget 1500)  |  Snapshot: story-how-to-play-panel.review-log.passes/pass1.md
### Applied
- [major] Description — panel mount/open/close plumbing unspecified (openSurface, row last, skipFocus, Esc/back/focus return, selection cleared, `?` belongs to entry 10) → fixer item 1
- [major] Description/Notes — static card mechanism left open; resolved as technical default (Card static rendering, no data-card-id/testid/place, no FLIP) → item 2
- [major] Description — §8 worked example content undefined; four words must be visible non-aria-hidden text → item 3
- [major] Description — eight headings not named; use EXPERIENCE.md outline names as h2 → item 4
- [major] Description — controls tables source undefined (EXPERIENCE.md Keyboard/gestures into text.ts; `?` wiring is entry 10) → item 5
- [major] Acceptance — band names: text.ts has private BANDS, needs an exported accessor; six names in order → item 6
- [major] Acceptance — Verify omits tests for static cards, no-Cancel/no-hints/Q-12, tables, Esc/focus, screens at 360, six row names, no horizontal overflow → item 7
- [major] Acceptance — "every string is in text.ts" check has no mechanism → item 8
- [minor] after-list/dependencies; Notes open question resolved (one scrolling page); section→rule checklist → item 9
### Default applied (technical)
- Card static path, text.ts band accessor, test mechanics, screens spec name → defaults as above
### Decision needed (functionality / UX / gameplay)
- Band section — show only the six names, or also each band's score threshold? — proposed default: names in ascending order only, no numbers (owner reads text at ticket review, SPEC F3)
### Dropped
- none

## Pass 2 — 2026-10-15
Reviewers: fix diff, edge-case hunter, ref alignment, builder's reading  |  Findings: major 4, minor 5, decision-needed 0  |  Dropped in triage: 0 (duplicates merged)
Words (docs): 899 (4.1 x pass 0; budget 1500)  |  Snapshot: story-how-to-play-panel.review-log.passes/pass2.md
### Applied
- [major] Verify "no Cancel / hint in the text" contradicts the body that states their absence → assert the text.ts sentences and no button named Cancel/Hint (fixer item 1)
- [major] Example paragraph — static Card call shape, sizing vars (Board-only), touch-action (.card is none), data-mirror-of collisions → item 2
- [major] Verify headings — Panel's own title is an h2, so sections are h3 and nine headings assert → item 3
- [major] Verify omits tests for selection clear, one history entry, scroll reset on reopen, Game over open → item 4
- [minor] back-control name, per-panel Esc handler + refocus effect, exact getByText, band accessor name → item 5
### Default applied (technical)
- static card: placeholder id, place column, no data-mirror-of, local size vars, touch-action pan-y; sections h3 → defaults taken
### Decision needed (functionality / UX / gameplay)
- none new (band thresholds item from pass 1 stands)
### Dropped
- none

## Pass 3 — 2026-10-15
Reviewers: fix diff, edge-case hunter, adversarial, ref alignment  |  Findings: major 1, minor 8, decision-needed 0  |  Dropped in triage: 1 (adversarial "touch/mouse rows unset" downgraded to minor: SPEC F3 delegates drafting the text to the build, owner reads it)
Words (docs): 1051 (4.8 x pass 0; budget 1500)  |  Snapshot: story-how-to-play-panel.review-log.passes/pass3.md
### Applied
- [major] Example paragraph — static card layout variant unnamed (strip card shows a corner letter only) → fixer item 1
- [minor] Game-over check — drop the `unverified` hedge (☰ is live above the expanded end sheet: App.svelte INERT_UNDER, EndSheet.svelte) → item 2
- [minor] interface line lacks App.svelte mount → item 3
- [minor] table labels not headings; scroll element is Panel `.content` → item 4
- [minor] caption form; screenshot target → item 5
### Default applied (technical)
- full-height static card in a flex row with local size vars; Worked example region baseline
### Decision needed (functionality / UX / gameplay)
- none new
### Dropped
- touch/mouse rows list and the §8 derivation clause: left as unapplied minors (owner reviews the text, SPEC F3)
