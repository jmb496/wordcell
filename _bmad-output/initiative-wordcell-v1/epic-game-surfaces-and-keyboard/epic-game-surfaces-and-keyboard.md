---
type: epic
title: "Game surfaces and keyboard"
parent: initiative-wordcell-v1
covers: []
after: [epic-tray-and-place]
assignee: ""
risk: high
---

# Game surfaces and keyboard

## Description

Adds everything around the board that makes WordCell a finishable, restartable game: the menu sheet and button with the app version footer; the New game and Replay confirm dialogs (R4's one `newGame()` already landed; new entry points only call it); the end sheet (Replay this deal and Statistics buttons) with its `finished`/`unfinished` wiring, deferred open and history-unreadable block; the Statistics, Preferences (with the timer) and How to play panels; the pending-draft line; the full keyboard map with focus moves and the F39 fix; screen-reader labels and the live region; the end-sheet half of the AD-14 winning guard; and the carry-ins I-68 and the epic 4 retrospective A8 items. It ends with a refactor sweep. The epic spec `spec-epic-6-surfaces` owns the capabilities, constraints, non-goals and decisions; its `rule-coverage.md` maps every (UI) sentence and spine behaviour to a capability and test kind, and `build-notes.md` holds the how.

## Outcome

A player can play a game start to finish on a phone or desktop: win or give up, read the result, see statistics, restart with or without a confirm, set speed and timer, learn the rules, and play by keyboard; the SPEC's Success signal is the measure.

## Requirements

The spec's capabilities replace this section: `_bmad-output/specs/spec-epic-6-surfaces/SPEC.md`, CAP-1…CAP-12. The epic has no parent ids; the source is spine Proposed epics row 6, epic 5 SPEC Non-goals (first bullet) and the carry-ins F39, R4, I-68 and A8.

## Done when

1. `npm run test:all` and `npm run test:screens` are green, and every `rule-coverage.md` row whose Kind includes P6 has a passing `android` Playwright test named with its id (`desktop` where the row says so).
2. On `android` a game is played to a win and to a Give up; each opens the end sheet with the right score, band, longest word and words placed; Undo closes it; New game from the action bar starts a fresh deal and Replay this deal from the sheet restarts it; Statistics counts the game.
3. The menu opens every panel and dialog; New game and Replay confirm only while a game is in progress; back closes the topmost surface and never undoes.
4. On `desktop` EXPERIENCE.md Flow 6 plays a full move by keyboard alone; Undo, Redo, the menu and keys close an open WordCell view first and never throw (F39).
5. During the winning animation a second tap starts no new game, a menu press only completes it, and Undo (button or key) completes it and then undoes with no end sheet.
6. Cards, WordCells and `QU` carry the specified accessible names and the live region announces phase changes, invalid words, commits and the outcome.
7. Once the owner gives the go-ahead, epic 6 is merged and deployed like epics 1–5; the agent never pushes.

## Boundaries

`src/ui/` (new surface components, overlays, text, TopBar, ActionBar, Tray's pending line, key handler), `src/main.ts` (key handler and live-region wiring), `vite.config.ts` and `src/app-version.d.ts` (`__APP_VERSION__` only), `fixtures/` (scripted valid Sessions the spec needs), `e2e/` and its helpers, tests. Not the engine, a shell change beyond what AD-9/AD-13 already provide, or any rule; not the service worker, device checks, Q-42 proof or B9 (epic 7). SPEC.md Non-goals.

## References

- spec — _bmad-output/specs/spec-epic-6-surfaces/SPEC.md, Capabilities, Constraints, Non-goals, Decisions F1–F5
- spec — _bmad-output/specs/spec-epic-6-surfaces/rule-coverage.md, build-notes.md
- spec — _bmad-output/specs/spec-epic-5-tray/SPEC.md, Non-goals (first bullet), F8, F23, F9
- retro — _bmad-output/initiative-wordcell-v1/epic-tray-and-place/epic-tray-and-place-retrospective.md, A7, A8
- retro — _bmad-output/initiative-wordcell-v1/epic-board-and-gestures/epic-board-and-gestures-retrospective.md, Action items A8, F3, F7
- retro — _bmad-output/initiative-wordcell-v1/epic-app-shell/epic-app-shell-retrospective.md, R4, C-E6 (I-68)
- rules — docs/game-flow-spec.md, R-62, R-70–R-76, R-80–R-84, §2, §7.10, Q-24, Q-29, Q-33, Q-35, Q-36, Q-44
- architecture — _bmad-output/planning-artifacts/architecture/architecture-wordcell-2026-09-27/ARCHITECTURE-SPINE.md, AD-3, AD-4, AD-9, AD-10, AD-13, AD-14, AD-17, Consistency Conventions, Proposed epics row 6
- design — _bmad-output/planning-artifacts/ux-designs/ux-wordcell-2026-09-27/DESIGN.md, Components (Top bar, Menu sheet, End sheet, Panels, Dialogs), Elevation & Depth
- design — _bmad-output/planning-artifacts/ux-designs/ux-wordcell-2026-09-27/EXPERIENCE.md, Information Architecture, Component Patterns, State Patterns, Keyboard, Motion, Accessibility Floor, How to play panel, Flows 4–7
- constraint — AGENTS.md, Architecture rules 1–7, Policy, Conventions, Known pitfalls
- methodology — docs/development-methodology.md, Per-ticket loop, Autopilot, Definition of done

## Notes

- Decision: epic branch `epic-6-surfaces`, cut from `epic-5-tray` so its two docs commits are folded in (owner, 2026-10-14); every ticket's build precondition is a clean tree on it.
- Decision: no owner questions were open at spec time; EXPERIENCE.md and DESIGN.md already fix every visible behaviour (technical default, 2026-10-14).
- Decision: 17 entries, past the typical 8–12, because they are one lane through `overlays.svelte.ts`, `src/ui/` surfaces and the key handler; the autopilot runs table order (technical default, 2026-10-14).
- Decision: CAP-4 is split into entries 6 (sheet, Give up, deferred open, relaunch) and 7 (history-unreadable block); CAP-10 into entries 10 (overlay keys, F39, stale tile selection) and 11 (board keys, focus, tooltips); CAP-5 (entry 12) waits for both the end sheet and the key aliases; CAP-12 is entry 14; the Success signal is entry 15; the sweep is entries 16 (code) and 17 (paperwork) per L2 (technical default, 2026-10-14).
- Decision: every ticket keeps `npm run test:screens` (Docker in WSL2) in its checks (retrospective L3) and lists the other consumers of any shared rule input it changes (L1) (process, 2026-10-14).
- Decision: no entry is `hitl`; gates 3 and 4 run under the epic autopilot (owner, 2026-09-28, standing). The How to play text (entry 9) is read by the owner at ticket review (SPEC F3).
- Decision: Done when 7 (merge and deploy) has no entry; it is the close-out after entry 17 and the retrospective, only on the owner's go-ahead.
- Waits on epic-tray-and-place because: the tray, FLIP, the winning guard and the shared UI modules are its output; that container is done, so it does not gate the entries.
