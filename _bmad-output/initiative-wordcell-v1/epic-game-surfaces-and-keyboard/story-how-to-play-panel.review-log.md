# Review log — story-how-to-play-panel.md

State: pass 1: done

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
