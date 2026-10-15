---
id: 2
type: story
title: "Menu sheet, menu button and version footer"
parent: epic-game-surfaces-and-keyboard
covers: [CAP-2]
after: [1]
risk: medium
---

# Menu sheet, menu button and version footer

## Description

Replaces the top bar's menu slot with the 44 × 44 ☰ button and opens the menu sheet with only the rows whose targets already exist (New game and Replay this deal acting at once, Give up; one 52 px row each with its glyph; Statistics, Preferences and How to play rows are added by entries 5, 4 and 9, each opening its real surface), clears any tap or tile selection on open, enables New game and Replay whenever a Session is active, enables Give up only in Idle while playing (R-75) and dispatches it at once with no confirmation, runs the menu items after closing the sheet (the pop completes before any push), and adds the footer line from `__APP_VERSION__` (`<package.json version> (<7-char git SHA>)` through a Vite `define` declared in src/app-version.d.ts; the build fails if git is unavailable; env override WORDCELL_APP_VERSION applying to every build and set in the screenshot container run; the define, git rule and override are to verify in the ticket against Scaffold deltas); the error dot arrives with entry 5; no placeholder surfaces.

## Acceptance Criteria

Verify: npm run test:all and npm run test:screens are green with Playwright on android that opens the menu from ☰, shows the three rows and the footer version, disables Give up in Composing, Place and Game over, enables it in Idle and dispatches Give up (status becomes gaveUp, Session stored; the end sheet itself is entry 6), clears a tail selection and a tile selection on open, leaves wordcell:session byte-identical on a close with no choice, and at a fixed 360 x 320 viewport the sheet scrolls with its close control visible.

## References

- parent — _bmad-output/initiative-wordcell-v1/epic-game-surfaces-and-keyboard/epic-game-surfaces-and-keyboard.md
- spec — _bmad-output/specs/spec-epic-6-surfaces/SPEC.md, Capabilities (CAP-2), Decisions
- design — _bmad-output/planning-artifacts/ux-designs/ux-wordcell-2026-09-27/EXPERIENCE.md, Component Patterns, Keyboard, State Patterns
- design — _bmad-output/planning-artifacts/ux-designs/ux-wordcell-2026-09-27/DESIGN.md, Components
