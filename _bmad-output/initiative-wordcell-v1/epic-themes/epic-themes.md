---
type: epic
title: "Alternate visual themes"
parent: initiative-wordcell-v1
covers: []
after: [epic-how-to-play-scenes]
assignee: ""
risk: medium
status: done
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
- Decision (owner, 2026-10-18): after reading the 9.1 brief (`research/brief.md`), build all five directions with the art as mocked up: A sci-fi (table grid, scan-line face texture), B garden (leaf-vein table, paper-fibre face texture), C steampunk (wood-grain table, leather face texture), D Daylight Paper, E Plum Dusk. Daylight Paper supersedes A-D1 and the "ivory on charcoal" line; garden's green "act here" accent relaxes the "no green success" wording (nothing turns green on success). Card-face textures are accepted for now and may be removed after gameplay feel. DESIGN.md was written for the dark theme only, so entry 2 refactors it: the default dark values become one theme's token set and the theme-neutral principles (layout, contrast floors, motion, tokens-only colour) stay general; new themes diverge from the specific colour choices. Entry 5 adds a pixel-sampled letter-contrast check over each texture.
- Unknown: whether any `src/**` colour is still a literal beyond `Scene.svelte`; entry 3 finds out with the TH-2 scan.
- Unknown: whether `Scene.svelte` hex values are scene art that should stay fixed or tokens.
- Waits on epic-how-to-play-scenes because: the How to play scenes use `Card` and Scene colours, which themes must cover, and epic 8 is accepted done (2026-10-18).
- Decision (owner, 2026-10-18): entry 7 split per theme once 9.2 closed: 9.6 Daylight Paper (first alternate, light, no art), 9.7 Deep Space, 9.8 Greenhouse Dusk, 9.9 Brass and Walnut, 9.10 Plum Dusk, in sequence (all edit app.css and PreferencesPanel); the refactor sweep is now 9.11. 9.2 and 9.3 marked done.
- Decision (owner, 2026-10-22, Opus review decisions D1–D6; "accept all decision defaults": every proposed default taken; log `opus-review-epic-9.md`): D1 the Theme control becomes a vertical single-choice list, one row of at least 44 px per theme (EXPERIENCE.md "single-choice list"), recorded in DESIGN.md Panels; its 360 px test no longer scrolls and checks every label sits inside the group and is hit by `elementFromPoint`. D2 the Halted screen stays Charcoal (5561ecf) and `fatal()` also resets the status-bar `theme-color` meta to `#15171B`, with an e2e under a stored theme. D3 the four dark alternate themes use DESIGN.md's lifted-card shadow `#0008` like Charcoal; Daylight Paper keeps its lighter one. D4 a drop-target card keeps its theme texture under the teal wash (wash layered over `--wc-card-texture`), with a `theme-art.spec.ts` drag case. D5 the focused segment in the Theme and Animation speed groups gets a table-coloured inner gap (DESIGN.md Focus ring), with a desktop test per theme. D6 the contrast harness gains the washed worst-point rows for the empty-column and placeholder drop-target outlines, and Greenhouse Dusk's table-art opacity is lowered (or its `--wc-outline` lightened) until they reach 3:1.
- Decision (owner, 2026-10-22): the two follow-up looks from the D1–D6 build are kept as built (owner: "accept all decision defaults"): Q1 Theme list rows have their label left with 16 px side padding, `--wc-outline` separators in a `{rounded.md}` box and the selected row filled teal; Q2 the focused segment's ring sits between two table-coloured lines (`inset 0 0 0 6px var(--wc-table)`, ring at −4 px), recorded in DESIGN.md Focus ring.
- Post-close review (2026-10-22): Opus re-review of the Sonnet-built epic (`a6bc586..19acd17`), review-loop code mode, thorough, three loops: loop 1 diverging after 4 passes (majors 3, 2, 1, 2), fixes `5210279`, log `opus-review-epic-9.md`; loop 2 converged after 5 passes (majors 3, 3, 3, 1, 1; one open major carried to the decisions step), fixes `a88cf67`, log `opus-review-epic-9b.md`; decisions D1–D6 (`e6443fd`) built in `45f6a13` and reviewed by a 2-pass loop (majors 5, 0), log `opus-review-epic-9-decisions.md` (all logs in `_bmad-output/implementation-artifacts/review-loop/`). Main themes: alternate theme blocks won only by stylesheet order (now `:root[data-theme]` with a computed-token e2e over every registered theme); no test proved the first painted frame wears the stored theme (now a deterministic production no-flash test and a head-order test); the TH-2 colour-literal scan missed markup expressions, short hex and named colours and then swung between misses and prose false positives (now one AST visitor judging each declaration on its own); prefs theme ids not tied to `ThemeId`; art contrast assumed a monotone worst point. Orchestrator finding: the screenshot gate's default per-pixel threshold (0.2) let dark-on-dark changes pass, so 24 baselines were stale since epic 6 (menu rows, end sheet, focus rings, the 2026-10-18 rating names); threshold now 0.05 (`fc3c20c`) and baselines regenerated and evaluated (`ecb01d8`, approve, no escalation). `test:all` green at each commit (one load flake, `e2e/nav.spec.ts:162`, passes alone 8/8). Owner-doc edits applied under D1/Q2: DESIGN.md Panels (Theme list) and Focus ring. 48 minors (22 + 19 + 7) carried to the next refactor sweep or retrospective.
- Close-out applied (owner go-ahead 2026-10-23, "update all bmad docs"; listed 2026-10-22): (1) DESIGN.md Colors states the TH-2 colour-literal rule as `src/ui/theme/colour-literals.ts` implements it (colour functions and 6/8-digit hex anywhere in a string; short hex and named colours only in a colour value position). (2) ARCHITECTURE-SPINE.md AD-15 and DESIGN.md Themes' theme-color line: the fatal surface wears Charcoal and `clearTheme()` resets the `theme-color` meta (owner 5561ecf, D2); for the fatal cause this supersedes ticket 9.4's "halts after it wear the stored theme", and the other Blocking causes keep the stored theme. (3) AGENTS.md "Where things are" gains a themes pointer (`src/ui/app.css` theme blocks, `src/ui/theme/`, the TH-2 gate, the pre-paint script) and its AD range reads AD-1…AD-19; the spine's AD-10 Binds and Capability Map gain `src/ui/theme/` and a Themes row. The AGENTS.md lines are a hand edit inside the managed block, so the next `bmad-project-context` refresh re-verifies them. (4) Spine Scaffold deltas: an epic 9 entry for `tsconfig.arch.json` (the Node-only theme harness, `types: ["node", "vite/client"]`) and `playwright.screens.config.ts` `threshold: 0.05`.
