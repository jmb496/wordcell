---
id: 9
type: story
title: "How to play panel"
parent: epic-game-surfaces-and-keyboard
covers: [CAP-8]
after: [2]
risk: medium
---

# How to play panel

## Description

Adds the How to play panel and its menu row (the sheet now lists all six rows) with the eight sections in order, text drafted from spec §3–§6 and §9 (no Cancel, no hints, Q-12), rating-band names from text.ts, the §8 worked example drawn with the real card component as static non-interactive images, and the controls section with the touch, mouse and keyboard tables; the owner reads the text at ticket review.

Panel: `HowToPlayPanel.svelte` renders inside Panel.svelte (opener `openSurface('howToPlay')`, the overlay id exists, SPEC F8). The Menu row `How to play` is last, after Preferences, and closes the menu then opens the panel, setting Menu's `skipFocus` as tickets 6.3/6.4 do. Opening clears a tail or tile selection as the other rows do and pushes one history entry; back, Esc and the panel's back control close it through one `act()`-wrapped close function (Esc via the interim window handler of 6.4), focus returns to the ☰ button after `tick()`, and a reopen starts scrolled to the top. The `?` key is wired in entry 10 (CAP-10), not here. One scrolling page, no accordions or tabs (EXPERIENCE.md Panels, "Static scrolling page").

Sections: eight `h2` headings in EXPERIENCE.md's order and names (The goal, The table, A move, Undo and Redo, Empty columns, Scoring, giving up and bands, Worked example, Controls), page title `How to play`. Body text lives in text.ts and states the Q-12 empty-column rule and the absence of Cancel and hints.

Bands: text.ts exports one accessor over the existing private `BANDS` table (no copy); the section lists all six names in band 0–5 order, names only, no thresholds.

Example: per word of BAKED, BALKED, FAKED, FLAKED (spec §8) one row of static cards plus a visible caption from text.ts naming the word; letters come from the §8 words, not a UI letter table (AD-3); no `QU`. Card.svelte gets a fifth `mirror` value `'static'`: the existing mirror path already emits `data-mirror-of` and `aria-hidden` and no `data-card-id`, `data-testid` or `data-place` (AD-14), it takes no pointer handlers and never joins a FLIP glide; the real face renders unchanged.

Controls: touch, mouse and keyboard tables; touch and mouse rows from EXPERIENCE.md's interaction text; the keyboard table is the complete EXPERIENCE.md Keyboard map as text.ts strings (documentation only, behaviour is entry 10's).

- interface: new src/ui/HowToPlayPanel.svelte; text.ts how-to-play strings and a band-name accessor; Card.svelte `mirror: 'static'`; the Menu row.
- tests: How to play outline (P6); AD-14 no live element for the static example cards (P6 part).
- owns: the How to play page.

## Acceptance Criteria

Verify: npm run test:all and npm run test:screens are green. Playwright (android; `toBeFocused` on ☰ after close) opens the panel from the row after asserting the menu rows in order (New game, Replay this deal, Give up, Statistics, Preferences, How to play), then asserts via `getByRole('heading')` the page title and the eight `h2` in order, the four words by `getByText`, the six band names, the three controls tables, no "Cancel" button instruction or "hint" in the text and the Q-12 empty-column rule stated, Esc and back each closing it with focus on ☰, at 360 px a vertical scroll with no horizontal overflow, no `[data-card-id]` or `[data-testid^=card-]` inside the panel with the example cards `aria-hidden` and the live 52 cards still one element each (AD-14); one baseline at 360 px in `e2e/how-to-play.screens.spec.ts` via `npm run test:screens`. Vitest tests named `AD-3 …`: a server render of HowToPlayPanel whose headings and bodies each equal a text.ts export and whose source markup has no prose text node outside `{…}` expressions; every key of the EXPERIENCE.md Keyboard table appears in the keyboard strings; the band accessor returns six names in order.

## References

- parent — _bmad-output/initiative-wordcell-v1/epic-game-surfaces-and-keyboard/epic-game-surfaces-and-keyboard.md
- spec — _bmad-output/specs/spec-epic-6-surfaces/SPEC.md, Capabilities (CAP-8), Decisions
- design — _bmad-output/planning-artifacts/ux-designs/ux-wordcell-2026-09-27/EXPERIENCE.md, Component Patterns, Keyboard, State Patterns
- design — _bmad-output/planning-artifacts/ux-designs/ux-wordcell-2026-09-27/DESIGN.md, Components

## Notes

- Owner text review checklist (section → rule): goal and table (incl. `QU` ×2, Q-06); move with Q-12 (R-22, R-31); undo (Q-01, no Cancel); empty columns (R-22); scoring and bands (R-80, R-81, R-83).
