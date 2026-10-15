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

Panel: `HowToPlayPanel.svelte` renders inside Panel.svelte (opener `openSurface('howToPlay')`, the overlay id exists, SPEC F8). The Menu row `How to play` is last, after Preferences, and closes the menu then opens the panel, setting Menu's `skipFocus` as tickets 6.3/6.4 do. Opening clears a tail or tile selection as the other rows do and pushes one history entry; back, Esc and the panel's back control (text.ts `closeHowToPlay: 'Close how to play'`) close it through one `act()`-wrapped close function, focus returns to the ☰ button after `tick()`, and a reopen starts scrolled to the top. HowToPlayPanel carries its own interim Esc handler (`!event.repeat`, `overlays.top === 'howToPlay'`, the shared close) and the ☰ refocus effect copied from PreferencesPanel; entry 10 removes all the copies together. The `?` key is wired in entry 10 (CAP-10), not here. One scrolling page, no accordions or tabs (EXPERIENCE.md Panels, "Static scrolling page").

Sections: eight `h3` headings (Panel renders the title `How to play` as `h2`; EXPERIENCE.md fixes no level) in EXPERIENCE.md's order and names (The goal, The table, A move, Undo and Redo, Empty columns, Scoring, giving up and bands, Worked example, Controls). Body text lives in text.ts and states the Q-12 empty-column rule and the absence of Cancel and hints.

Bands: text.ts exports `bandNames()` over the existing private `BANDS` table (no copy); the section lists all six names in band 0–5 order, names only, no thresholds.

Example: per word of BAKED, BALKED, FAKED, FLAKED (spec §8) one row of static cards plus a visible caption from text.ts naming the word; letters come from the §8 words, not a UI letter table (AD-3); no `QU`. Card.svelte gets a fifth `mirror` value `'static'`: it takes a placeholder `id` 0 and `place: 'column'` (passing the AD-14 guard), emits `aria-hidden` but no `data-mirror-of` (it mirrors no real card; keeps `[data-mirror-of]` consumers such as gestures/resolve.ts and e2e/board.spec.ts counts clean), no `data-card-id`, `data-testid` or `data-place`, sets `touch-action: pan-y` (base `.card` is `none`, which would block panel scrolling), takes no pointer handlers and never joins a FLIP glide. `face` is `{letter, letterCount: 1}` per §8 letter (no engine helper exists; no `QU`). The example container sets its own `--wc-w`, `--wc-H`, `--wc-strip`, `--wc-slot` (Board.svelte sets them only on `.board-root`), sized so the 6-card rows (BALKED, FLAKED) fit at 360 px without horizontal overflow.

Controls: touch, mouse and keyboard tables; touch and mouse rows from EXPERIENCE.md's interaction text; the keyboard table is the complete EXPERIENCE.md Keyboard map as text.ts strings (documentation only, behaviour is entry 10's).

- interface: new src/ui/HowToPlayPanel.svelte; text.ts how-to-play strings and a band-name accessor; Card.svelte `mirror: 'static'`; the Menu row.
- tests: How to play outline (P6); AD-14 no live element for the static example cards (P6 part).
- owns: the How to play page.

## Acceptance Criteria

Verify: npm run test:all and npm run test:screens are green. Playwright (android; `toBeFocused` on ☰ after close) opens the panel from the row after asserting the menu rows in order (New game, Replay this deal, Give up, Statistics, Preferences, How to play), then asserts via `getByRole('heading')` the page title then the eight `h3` in order (names exact, from text.ts), the four captions by `getByText(caption, {exact: true})` scoped to the Worked example section, the six `bandNames()`, the three controls tables, the Undo and Redo body equal to the text.ts sentences stating no Cancel and no hints with no role-button named Cancel or Hint in the panel, the Q-12 empty-column rule stated, Esc, back and the `Close how to play` control each closing it with focus on ☰, with a tail selected opening the panel clears the selection and one back closes it (one history entry), scroll down then close and reopen gives scrollTop 0, open and close once from Game over (unverified whether Menu.svelte keeps ☰ reachable under the expanded end sheet; collapse it first if not), at 360 px a vertical scroll with no horizontal overflow, no `[data-card-id]` or `[data-testid^=card-]` inside the panel with the example cards `aria-hidden` and the live 52 cards still one element each (AD-14), no `[data-mirror-of]` match inside the panel, and computed `touch-action` on an example card not `none`; one baseline at 360 px in `e2e/how-to-play.screens.spec.ts` via `npm run test:screens`. Vitest tests named `AD-3 …`: a server render of HowToPlayPanel whose headings and bodies each equal a text.ts export and whose source markup has no prose text node outside `{…}` expressions; every key of the EXPERIENCE.md Keyboard table appears in the keyboard strings; the band accessor returns six names in order.

## References

- parent — _bmad-output/initiative-wordcell-v1/epic-game-surfaces-and-keyboard/epic-game-surfaces-and-keyboard.md
- spec — _bmad-output/specs/spec-epic-6-surfaces/SPEC.md, Capabilities (CAP-8), Decisions
- design — _bmad-output/planning-artifacts/ux-designs/ux-wordcell-2026-09-27/EXPERIENCE.md, Component Patterns, Keyboard, State Patterns
- design — _bmad-output/planning-artifacts/ux-designs/ux-wordcell-2026-09-27/DESIGN.md, Components

## Notes

- Owner text review checklist (section → rule): goal and table (incl. `QU` ×2, Q-06); move with Q-12 (R-22, R-31); undo (Q-01, no Cancel); empty columns (R-22); scoring and bands (R-80, R-81, R-83).
