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

Replaces the top bar's menu slot with the 44 × 44 ☰ button (inline SVG glyph, as TopBar does; it exists only where TopBar renders, the Board root; the `M` key and desktop tooltip arrive with entry 10) and opens the menu sheet only through the 6.1 `openSurface('menu')` (SPEC F8: it clears tail and tile selection, closes a sticky WordCell view and peeks, pop before push), adding no clearing of its own; the top bar is `inert` while the menu is open (SPEC F6, build-notes per-surface Menu row). ☰ and the rows are wrapped in `act()`. The sheet has only the rows whose targets already exist (one 52 px row each with its inline SVG glyph; Statistics, Preferences and How to play rows are added by entries 5, 4 and 9, each opening its real surface):

- New game calls `newGame()` (src/ui/new-game.ts); Replay this deal calls `game.replay()` then `overlays.resetForNewSession()`; Give up `dispatch`es the giveUp command. Each closes the sheet first, then acts once (no push), at once until entry 3 adds the confirms (replacing the call, not the row). New game and Replay are enabled in every state, Game over included. After an acting row focus goes to the board, as for a close with no choice (build-notes Menu row).
- Give up is `disabled` from `view.canGiveUp` (AD-3, R-75: Idle while playing), no UI re-derivation; the disabled look is DESIGN.md Menu sheet (ink-disabled label and glyph, no press feedback). It acts with no confirmation and leaves Game over with no end sheet until entry 6 (interim; Undo still works, R-75).
- Title, row labels, the ☰ name and the close label go into src/ui/text.ts from the EXPERIENCE.md catalogue (it lists no menu strings: they take the DESIGN.md/EXPERIENCE.md Menu sheet wording, flagged for the owner); controls are located by role and name.
- Footer line from `__APP_VERSION__` (`<package.json version> (<7-char git SHA>)`) through a Vite `define` in vite.config.ts, declared by a global ambient `declare const __APP_VERSION__: string;` in src/app-version.d.ts (`npm run check` and the architecture tests must accept it). A non-empty `WORDCELL_APP_VERSION` is used verbatim and git is never consulted; unset runs `git rev-parse --short=7 HEAD`; if git fails, or the value is empty or whitespace, the build throws (rule 6); no dirty-tree suffix. The resolver runs in every Vite mode (dev, build, Vitest) and throws there too (rule 6); the override is the workaround where git is absent. It is set in the `webServer` `env` of playwright.config.ts (`npm run dev`, android project), `build:test`, the `test:screens` docker run (`-e`) and the ci.yml screens job `env` (playwright.screens.config.ts inherits the container env; the pwa config previews `dist-test/`). Checked against Scaffold deltas: they have no entry for the define/override, so the build plan records a close-out spine edit (not a deviation). The resolver is a small unit-tested function.
- The error dot arrives with entry 5; no placeholder surfaces.

## Acceptance Criteria

Verify: npm run test:all and npm run test:screens are green with Playwright on android that opens the menu from ☰ (while a sticky WordCell view is open its scrim covers the top bar, so a tap there only closes the view, owner 2026-10-15), shows the three rows and the footer version (the override value), disables Give up in Composing, Place and Game over by won and by gaveUp, enables it in Idle (a disabled row dispatches nothing), checks New game gives a new seed and Replay the same seed with empty moves, each also from Game over (won and gaveUp), dispatches Give up with no confirmation (`wordcell:session` parses with `gaveUp` true right after the click; the end sheet itself is entry 6), clears a tail selection and a tile selection on open, leaves wordcell:session byte-identical (baseline read just before ☰ is tapped) on a close by the close control, Esc, back and a scrim tap, keeps Tab and Enter from reaching Undo and Redo under the menu, keeps 52 live card elements with the menu open (AD-14), and at a fixed 360 x 320 viewport the sheet is at most 80 % of the viewport high (Sheet.svelte `max-height: 80dvh`), its close control is inside the viewport and every row and the footer are reachable inside the viewport after scrolling. Also green: Vitest for AD-3 enablement and for the version resolver (format, override, missing-git throw); top-bar baselines regenerated in the container with the fixed footer version; the 360 px top-bar fit with ☰ and a negative score; Undo/Redo FLIP capture/play wiring in TopBar.svelte unaffected (it is the epic 5 F6, F7 host).

## References

- parent — _bmad-output/initiative-wordcell-v1/epic-game-surfaces-and-keyboard/epic-game-surfaces-and-keyboard.md
- spec — _bmad-output/specs/spec-epic-6-surfaces/SPEC.md, Capabilities (CAP-2), Decisions
- design — _bmad-output/planning-artifacts/ux-designs/ux-wordcell-2026-09-27/EXPERIENCE.md, Component Patterns, Keyboard, State Patterns
- design — _bmad-output/planning-artifacts/ux-designs/ux-wordcell-2026-09-27/DESIGN.md, Components
- Decision (owner, 2026-10-15): while a WordCell view is open the ☰ menu button does not work; the view's dim layer covers the top bar and the player closes the view first. Undo and Redo behave the same.
