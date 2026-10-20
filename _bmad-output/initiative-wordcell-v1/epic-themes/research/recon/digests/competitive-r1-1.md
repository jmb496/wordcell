# Competitive recon r1-1: themes in solitaire and word games (quick preset)

Method: 8 WebSearch calls (search-result summaries only; no page fetched in full). Accessed 2026-10-18. Class = primary / secondary / tertiary.

| # | Claim | Source URL | Publisher | Pub date | Accessed | Confidence | Class |
|---|---|---|---|---|---|---|---|
| 1 | Microsoft Solitaire Collection (iOS listing) shows themes incl. Classic, Beach, Dark Mode and Retro card backs (1990s style) | https://apple.co/2gCnkVc | Apple App Store (Microsoft listing) | not shown | 2026-10-18 | medium | primary (store page, via search snippet) |
| 2 | Premium membership includes a Retro bundle and Xbox card backs | https://apps.apple.com/app/1103438575 | Apple App Store (Microsoft listing) | not shown | 2026-10-18 | medium | primary |
| 3 | Paid card-back packs (Baby Fox, Cow, Kittens, Puppies, Retro, Retro Pattern 2) as in-app purchases; prices vary by country, may be stale | https://apps.apple.com/FR/app/id1103438575 | Apple App Store (Microsoft listing) | not shown | 2026-10-18 | medium | primary |
| 4 | Players can customise theme: own background image and some face-card images, plus a small set of card designs; Aquarium theme also named | https://www.giantbomb.com/games/3030-39318/ ; https://www.timeextension.com/games/xbox-for-pc/microsoft_solitaire_collection | Giant Bomb; Time Extension | not shown | 2026-10-18 | low | tertiary |
| 5 | MobilityWare Solitaire: each new theme ships with its own card back AND background; examples Summer Sports, Summer; Daily Challenge calendar assigns a theme per month (seasonal cadence) | https://apptopia.com/ios/app/284791396/about | Apptopia (store metadata mirror) | not shown | 2026-10-18 | medium | secondary |
| 6 | MobilityWare Spider Solitaire added six card-back+background themes: Summer, Fall, Winter, Halloween, Valentine's Day, Summer Sports | https://apps.apple.com/app/id391855805 | Apple App Store (MobilityWare listing) | not shown | 2026-10-18 | medium | primary |
| 7 | Wordle high-contrast option (settings gear) swaps green/yellow for orange/blue; shared emoji grid changes too; a critic says it is hard to find and the meaning is unexplained | https://en.wikipedia.org/wiki/Wordle ; https://billfischer.substack.com/p/these-2-wordle-colors-undermine-color | Wikipedia; Bill Fischer Substack | not shown | 2026-10-18 | medium | secondary |
| 8 | NYT Games: no official dark-mode or colour-blind setting found in results; dark mode appears only via third-party browser extensions (Better NYTC, NY Times Games Dark Mode) | https://www.chromeboard.com/extension/better-nytc-alnkedkadmkfjecjinjbkkjpkbhldldk | Chromeboard (extension listing) | not shown | 2026-10-18 | low (absence of evidence, other titles may differ) | tertiary |
| 9 | WCAG 1.4.1 (Level A): colour must not be the only visual means of conveying information or distinguishing elements; sufficient techniques add text cues or visual cues | https://w3c.github.io/wcag/understanding/use-of-color.html | W3C | not shown | 2026-10-18 | high | primary |
| 10 | WCAG 1.4.3 (AA): 4.5:1 for normal text, 3:1 for large text (>=18pt or 14pt bold); incidental text in photos exempt; images of text are covered | https://w3c.github.io/wcag/understanding/contrast-minimum ; https://www.w3.org/TR/2016/NOTE-UNDERSTANDING-WCAG20-20161007/visual-audio-contrast-contrast.html | W3C | not shown | 2026-10-18 | high | primary |
| 11 | Tile-size rule of thumb: background tile over ~20 KB probably too large; small tiles (~100-256 px) suggested; 20x20 px minimum; flat art as GIF/optimised PNG. Dated, single-vendor guidance | https://product.corel.com/help/Painter/540232071/Main/EN/Doc/Corel-Painter-Web-Page-Backgrounds.html ; https://css-tricks.com/forums/reply/re-seamless-texture-size/ | Corel; CSS-Tricks forum | not shown | 2026-10-18 | low | secondary/tertiary |

## Synthesis for the decision (my reading, not sourced)
- Theme families seen: light/dark base, nature/scene (Beach, Aquarium), retro, animal card backs, seasonal. Pattern: theme = background + card back bundle; paid or premium for extras; seasonal on a calendar.
- Wordle-style colour-blind mode is a palette swap (orange/blue), which suits a token-based theming approach.
- Text-on-texture: keep letters on solid card faces and put art on table/back only, so 1.4.3 contrast stays testable.

## Leads (not followed)
- Microsoft support pages for Solitaire Collection themes (official list).
- MobilityWare support/blog posts on theme releases.
- Wordle/NYT Games help-centre pages on Hard Mode, dark theme, high contrast.
- W3C Understanding 1.4.11 Non-text Contrast (3:1) for card edges/borders.
- web.dev / MDN on SVG pattern and WebP texture sizes; Balatro card-back/deck options.

## Not found
- Official full theme lists for Microsoft Solitaire Collection or MobilityWare.
- Any Words With Friends or Wordscapes theme information (search returned nothing relevant).
- Official NYT Games dark/colour-blind settings.
- Current, authoritative size figures for SVG/WebP theme art (only dated Corel/forum rules).
- Publication dates for all sources (search snippets did not provide them).
- Balatro and other Balatro-style card games were not searched (budget).
