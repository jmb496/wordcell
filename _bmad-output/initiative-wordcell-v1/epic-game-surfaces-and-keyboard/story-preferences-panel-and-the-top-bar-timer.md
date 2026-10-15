---
id: 4
type: story
title: "Preferences panel and the top-bar timer"
parent: epic-game-surfaces-and-keyboard
covers: [CAP-7]
after: [2]
risk: medium
---

# Preferences panel and the top-bar timer

## Description

Adds the Preferences panel and its menu row (three-way segmented Animation speed Fast/Normal/Slow, Show timer switch, default off) writing through prefs.svelte.ts and applying at once, and the top-bar timer between score and Undo (`m:ss`, `h:mm:ss` from one hour) showing activeMs + peek(now) while playing and activeMs otherwise (AD-9), driven by a UI interval that runs only while Show timer is on and status is playing and never dispatches or writes, and that fits at 360 px.

## Acceptance Criteria

Verify: npm run test:all and npm run test:screens are green (screens specs the ticket adds listed per build-notes) with Playwright on android that sets Show timer and sees it tick then freeze in Game over, opens Preferences from its new menu row, sets Fast and sees a shorter glide, reloads with both kept, keeps both after New game and Replay, at 360 px the top bar fits with the timer shown and, with a negative score, the top-bar score beside the timer and Undo/Redo uses U+2212 (R-82), and with page.clock a relaunch into Game over shows the stored activeMs and a tick writes nothing; UI Vitest AD-10 on the formatter at 0, 59 999 ms and above 10 h, 3 599 000 ms (59:59) and 3 600 000 ms (1:00:00), hours unpadded with no cap (12:03:04); the Game over freeze and relaunch tests use seeded won/gaveUp fixtures and do not depend on the end sheet.

## References

- parent — _bmad-output/initiative-wordcell-v1/epic-game-surfaces-and-keyboard/epic-game-surfaces-and-keyboard.md
- spec — _bmad-output/specs/spec-epic-6-surfaces/SPEC.md, Capabilities (CAP-7), Decisions
- design — _bmad-output/planning-artifacts/ux-designs/ux-wordcell-2026-09-27/EXPERIENCE.md, Component Patterns, Keyboard, State Patterns
- design — _bmad-output/planning-artifacts/ux-designs/ux-wordcell-2026-09-27/DESIGN.md, Components
