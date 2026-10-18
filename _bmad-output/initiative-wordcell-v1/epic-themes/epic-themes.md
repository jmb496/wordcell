---
type: epic
title: "Alternate visual themes"
parent: initiative-wordcell-v1
covers: []
after: [epic-how-to-play-scenes]
assignee: ""
risk: medium
---

# Alternate visual themes

## Description

WordCell keeps its minimalistic dark theme as the default and gains the ability to wear other looks: more colour and richer visuals chosen by the player. The epic runs research first (what alternatives exist, what suits a word card game), then an owner decision on which themes to build and how they are chosen, then the build: a theme mechanism over the existing `--wc-*` tokens, a Preferences control, and the chosen themes. Today DESIGN.md fixes one dark theme (A-D1), and its Avoid list rules out gradients on cards, green success states and a third interaction accent; any theme that needs those is an owner decision, not an agent choice.

## Outcome

Jared (and later players) can pick a look in Preferences, the default dark theme is unchanged to the pixel, and every theme keeps cards, states and letters as legible as the default; the signal is the owner's read of each theme on his Android install and the contrast and screenshot checks passing for every theme.

## Requirements

Epic-local source (no parent ids); proposed from the owner's 2026-10-18 request, to be confirmed at inception. Rules cited are `docs/game-flow-spec.md`; design is DESIGN.md.

- TH-1: A research brief compares candidate directions (at least three) for the owner, each as a token set plus a mockup of the same representative board, with competitive and user-voice evidence; the owner picks which themes to build, if any.
- TH-2: Every colour the UI draws comes from a `--wc-*` token; no hex or rgb literal in `src/**` outside the token definitions, so a theme is a token set.
- TH-3: A theme is chosen by a stored preference in Preferences, applied before first paint (no flash of the default), and mirrored to the browser `theme-color` meta; the manifest `theme_color` stays the default theme's.
- TH-4: The default dark theme is visually unchanged: its screenshot baselines pass without regeneration.
- TH-5: Every theme meets the DESIGN.md accessibility floor: the contrast ratios DESIGN.md Colors states (text, outlines, card edge, accents), and no state relies on hue alone; a unit test computes the ratios from each theme's token values.
- TH-6: Each built theme has screenshot baselines (board, tray, a sheet, How to play scene) generated in the Playwright container.
- TH-7: DESIGN.md (A-D1, Colors, Avoid list), EXPERIENCE.md Preferences, the spec's preference list (§7.10) and AD-10 / AD-7 describe the theme preference before it is built; the owner approves each change (AGENTS.md rule 7).
- TH-9: A theme may also supply a table background and a card-face texture (art, not just colour), as theme data the token layer applies; card backs are never shown and are out of scope. Letters keep the card-ink contrast of TH-5 measured over the worst point of the texture, and art never changes layout or card size.
- TH-8: Themes stay inside the 600,000-byte bundle budget and add no runtime dependency.

## Done when

1. The research brief and mockups exist and the owner has recorded which themes to build (TH-1), or recorded that none is wanted.
2. `npm run test:all` and `npm run test:screens` are green with the default theme's existing baselines untouched (TH-4) and a baseline set per built theme (TH-6).
3. A Playwright test on `android` switches theme in Preferences, sees the root attribute and `theme-color` change, reloads with no flash and keeps the theme (TH-3).
4. The contrast unit test passes for every theme (TH-5), and a source scan finds no colour literal outside the token files (TH-2).
5. The spec, UX docs and spine describe the theme preference as built (TH-7) and the owner has played each theme on his phone.

## Boundaries

The visual layer: `src/ui/app.css` and token files, `src/ui/` components' colour use, Preferences, `src/shell/prefs.svelte.ts` (one new preference), `index.html` and the manifest colour, tests and docs. Not the engine, not the Session, not layout geometry or card sizes (AD-11), not game rules or the dealt layout, not new interaction states. Imagery that needs assets (card backs, textures, illustrations) is in scope only if the owner picks it at TH-1 and the size budget holds.

## References

- design — _bmad-output/planning-artifacts/ux-designs/ux-wordcell-2026-09-27/DESIGN.md, Colors, Brand & Style, A-D1, Avoid list
- design — _bmad-output/planning-artifacts/ux-designs/ux-wordcell-2026-09-27/EXPERIENCE.md, Preferences
- architecture — _bmad-output/planning-artifacts/architecture/architecture-wordcell-2026-09-27/ARCHITECTURE-SPINE.md, AD-10, AD-7 (prefs defaults), AD-16 (boot order)
- rules — docs/game-flow-spec.md, §7.10, Q-36
- code — src/ui/app.css, src/shell/prefs.svelte.ts, src/ui/PreferencesPanel.svelte, src/ui/scenes/Scene.svelte, index.html, vite.config.ts
- constraint — AGENTS.md, Architecture rules 3, 6, 7 and Policy (no change to the dealt layout)

## Notes

- Decision (owner, 2026-10-18): the current minimalistic dark theme stays and is the default; alternate themes are additions.
- Decision (owner, 2026-10-18): start with documentation and ticketing for a research-then-decide-then-build process.
- Decision (owner, 2026-10-18): theme is a manual choice in Preferences only; no `prefers-color-scheme` following.
- Decision (owner, 2026-10-18): themes may change colours, textures and the table background; card backs are never shown, so out of scope. Candidate themes the owner named: sci-fi, garden, steampunk, plus simple colour variations of the current look. DESIGN.md's "no gradients on cards" and "no green success" lines are relaxed per theme only as entry 2 records them with the owner.
- Decision (owner, 2026-10-18): the `theme` preference is added to prefs version 1 (no bump), so a stored v1 prefs keeps its Animation speed and timer; an absent `theme` means the default dark theme (AD-7 default).
- Decision (2026-10-18): tracer bullet is entry 3 (token plumbing, default theme identical); entries 1 and 3 can run in parallel; entry 7 (art themes) is split per chosen theme when entry 2 closes, by revisiting the breakdown with the owner.
- Unknown: whether any `src/**` colour is still a literal beyond `Scene.svelte`; entry 3 finds out with the TH-2 scan.
- Unknown: whether `Scene.svelte` hex values are scene art that should stay fixed or tokens.
- Waits on epic-how-to-play-scenes because: the How to play scenes use `Card` and Scene colours, which themes must cover, and epic 8 is accepted done (2026-10-18).
