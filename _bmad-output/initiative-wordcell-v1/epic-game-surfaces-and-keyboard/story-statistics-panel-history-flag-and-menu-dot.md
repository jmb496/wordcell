---
id: 5
type: story
title: "Statistics panel, history flag and menu dot"
parent: epic-game-surfaces-and-keyboard
covers: [CAP-6]
after: [2]
risk: medium
---

# Statistics panel, history flag and menu dot

## Description

Adds the Statistics panel and its menu row. It reads scoreHistory.statistics and the engine's output is shown unchanged (R-84, Q-44); the panel only formats. Best and average leave out given-up games with a negative score, so neither tile can be negative: a 0 shows `0`, none qualifying shows `—`.

Tiles are 2 × 3 in this order: games played, won, given up, best score, average score, longest word. Layout per DESIGN.md Panels. The average is the engine's whole number. The longest-word tile shows the record's spelling uppercase (QU as QU) with the record's letter count, ties to the earliest record (R-84, Q-35); with none it shows `—` and no count. Labels and the empty line `Finish or give up a game to see statistics here.` live in src/ui/text.ts (no statistics keys exist, so the build adds them). The empty line shows only when games played is 0. A history holding only negative given-up games shows its played and given up counts, best and average `—` (longest word `—` only because that fixture holds no longestWord), and no empty line. After Delete history the panel shows what a fresh history shows: zeros, `—` and the empty line.

While the history is unreadable the panel shows only the History-unreadable message and Reset history, instead of the tiles: no empty line, no Not now, and the panel's own back, close or Esc dismisses it. The message reuses the History notice strings in text.ts (historyVersionUnknown, historyVersionUnreadable, historyContentsUnreadable, then historyResetHint), no new copy; panel and notice share one reason-to-sentence mapping (the local `sentence()` in HistoryNotice.svelte, which the build extracts to text.ts), fed the live scoreHistory.state.reason in the panel and noticeReason() in the notice.

The flag is a getter exported from src/ui/history-notice.svelte.ts, live over scoreHistory.state and true exactly when status is `unreadable`, whatever the game state, false after Delete history. TopBar.svelte shows the error-coloured dot on the ☰ button. The dot element is aria-hidden; while it shows, the button keeps its name `Menu` and gains an accessible description (aria-describedby to a visually hidden element carrying text.historyTitle).

Reset history opens the existing confirm, which with its handlers moves from HistoryNotice.svelte to a shared component or function used by notice and panel, the focus return set per opener (notice unchanged). Delete history closes only the dialog; the surface stays open showing the clean state. Keep it closes only the dialog, and the message and dot stay. Focus after the confirm closes returns to the Reset history button; if Delete history removed that button, to the panel's `Statistics` heading, where Panel.svelte starts focus; closing the panel returns it to the ☰ button, as the Preferences panel does (6.3 plan).

Interface: new src/ui/StatisticsPanel.svelte; a UI-layer getter (history-notice.svelte.ts) exports the one flag; TopBar.svelte gains the dot. Owns: the Statistics panel and the unreadable-history flag. Consumers: the flag is read by entry 7 (end-sheet block) and the History notice. Tests: R-84 statistics values and ties (P6); Q-44 best and average leave out negative given-up games, including a history with only those (P6); Q-33 unreadable message and menu dot (P6); Q-35 longest word spelling (P6 part); AD-13 two-overlay reload (P6).

## Acceptance Criteria

Verify: npm run test:all and npm run test:screens are green, the screens specs the ticket adds being baselines in e2e/<flow>.screens.spec.ts for the Statistics panel with values, its empty state, its unreadable state, and the top bar with the dot at 360 px. Playwright on android opens the panel from its menu row. Seeding only through e2e/helpers/seed.ts seedStorage.

- Values: history-three-records.json shows the six values, with the longest word `LQUEJATA` and letter count 8 (7 cards: Q-35). New valid fixtures (parseHistory-valid, listed in the plan): a longest-word tie of exactly two records, a won 101 and a given-up 0 (equal letterCount, different spellings: the earlier in array order shows; best 101, average 51), and a history of only negative given-up games holding no longestWord (counts shown, best, average and longest word `—` with no count, no empty line). A fresh history shows zeros, `—` and the empty line.
- Unreadable: history-invalid-version-unknown.json (unknown version), history-invalid-array.json (version itself unreadable) and history-invalid-won-negative.json (known version, unreadable contents) each show their own second sentence plus the hint, and the dot on each.
- Dot: asserted with every surface closed, by role and name (`Menu` button); the visually hidden description element is rendered with the dot and aria-describedby is set only while the flag is true.
- Reset history: Delete history clears the message and the dot with the panel staying open, showing the fresh-history view; Keep it, Esc, back and scrim tap leave the message, the dot and the panel, with focus on the Reset history button; after Delete history focus is on the `Statistics` heading; closing the panel then focuses the ☰ button.
- Getter: an AD-named UI Vitest asserts the underlying $state reference that the flag is true in an inactive game state too, and flips to false after reset.
- AD-13 two-overlay reload: seed history-invalid-version-unknown.json, open Statistics, open Reset history's confirm, reload. The Board shows with the History notice; answer it with Not now. history.state is { wc: 0, launch: new } (launch being the post-reload launch id), the menu dot is still shown, and back leaves the app. After reload the panel and the confirm are gone, the Board staying (SPEC CAP-6).

## References

- parent — _bmad-output/initiative-wordcell-v1/epic-game-surfaces-and-keyboard/epic-game-surfaces-and-keyboard.md
- spec — _bmad-output/specs/spec-epic-6-surfaces/SPEC.md, Capabilities (CAP-6), Decisions
- design — _bmad-output/planning-artifacts/ux-designs/ux-wordcell-2026-09-27/EXPERIENCE.md, Component Patterns, Keyboard, State Patterns
- design — _bmad-output/planning-artifacts/ux-designs/ux-wordcell-2026-09-27/DESIGN.md, Components
