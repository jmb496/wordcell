---
type: epic
title: "End-of-game word list and win celebration"
parent: initiative-wordcell-v1
covers: []
after: [epic-themes]
assignee: ""
risk: high
---

# End-of-game word list and win celebration

## Description

After a game ends the player sees a score, a band and one longest word, not the words they made. This epic adds the list of every word of the latest game, longest first, to the end sheet for a win and a give-up, and a skippable, non-replayable win celebration in which each word bounces across the board as a group of card-face copies before the end sheet opens. The rules (R-86…R-88, Q-46…Q-48), the UX (EXPERIENCE.md Win celebration, DESIGN.md Words section and Win celebration) and the architecture (AD-3 `wordList`, AD-13 `celebration` entry, AD-17 seam, AD-19) are decided and reviewed twice; the epic spec is the requirement source.

## Outcome

A player who finishes a game can read the words they played, and a player who wins gets a short finale instead of an abrupt sheet; the signal is Jared's read of both on his Android install, plus the `rule-coverage.md` rows all passing.

## Requirements

The numbered source is the epic spec, `_bmad-output/specs/spec-epic-10-end-of-game-words/SPEC.md`; entries cite its capability ids. Rules are `docs/game-flow-spec.md`.

- CAP-1: engine `wordList` on `GameView` (R-86).
- CAP-2: celebration step function and renderer (R-87, AD-19).
- CAP-3: celebration wiring: start, skip, ends, cancels (R-87, R-70, R-73, AD-9, AD-13).
- CAP-4: end-sheet Words section (R-88).
- CAP-5: close-out: documents match the build, `AGENTS.md` pitfall, suites green.
- CAP-6: test seam and the hook-free suite (AD-17, AD-19).

## Done when

1. On `android`, a seeded near-won game: Confirm the last word, the words bounce, a tap skips, the end sheet opens expanded, and the Words section lists the words longest first with a duplicate twice and ties alphabetical (R-86, R-87, R-88).
2. Give up in another game shows its Words section (and `No words were played.` with no move) and no celebration; a reload on a finished game shows the list with no celebration (R-73, R-88).
3. Back, ☰ or `M`, hiding the app, resizing, Undo, New game and a Redo that restores the win each behave as `rule-coverage.md` says, and `dist-smoke` proves a real (hook-free) win plays and is skipped.
4. `npm run test:all` and `npm run test:screens` are green, every row of `rule-coverage.md` has a passing test, and no Session or score-history shape or version changed.
5. The spec, UX docs and spine match the build, `AGENTS.md` carries the celebration-copy pitfall via `bmad-project-context`, and Jared has watched the celebration with a long word list on his Android (copy cost, A-D12).

## Boundaries

The engine view, the end sheet and a new `src/ui/celebration/` module with its overlay entry, the test hook, tests and docs. Not scoring, rules, the deal or the Session; no sound, no replay, no trail, no word list for earlier games or per-word statistics (spec Non-goals).

## References

- spec — _bmad-output/specs/spec-epic-10-end-of-game-words/SPEC.md, CAP-1…CAP-6, decisions F1…F13; rule-coverage.md
- rules — docs/game-flow-spec.md, R-86…R-88, Q-46…Q-48, §7.12
- design — _bmad-output/planning-artifacts/ux-designs/ux-wordcell-2026-09-27/EXPERIENCE.md, Win celebration, End sheet, Message catalogue, A-E16; DESIGN.md, Words section, Win celebration, A-D12
- architecture — _bmad-output/planning-artifacts/architecture/architecture-wordcell-2026-09-27/ARCHITECTURE-SPINE.md, AD-3, AD-6, AD-9, AD-13, AD-14, AD-17, AD-19
- code — src/engine/view.ts, src/engine/replay.ts, src/ui/end-sheet.ts, src/ui/EndSheet.svelte, src/ui/overlays.svelte.ts, src/ui/motion.ts, src/shell/test-hook.ts
- constraint — AGENTS.md, Architecture rules 1–7, Policy

## Notes

- Decision (owner, 2026-10-19/20): win-only celebration; word list for win and give-up; each word a group of card-face copies on a Windows-style arc, no trail, no colour change; skippable, not replayable except that a Redo that restores the win plays it again; latest game only; duplicates listed; ties alphabetical (Q-46…Q-48).
- Decision (owner, 2026-10-20): overlapping waves, 6 s cap scaled by speed, launch from the placement WordCell, `Space`/`Esc`/press/back skip, list as a section of the expanded end sheet with the letter count, ☰ or `M` ends it then opens the sheet then the menu, hide and resize end it, `?`/WordCell keys do nothing while it runs.
- Decision (2026-10-20): tracer bullet is entries 1 → 2 (engine list to the visible Words section); the celebration is a second lane (entries 3 → 8), whose first real run is entry 5 and first visible motion entry 6.
- Decision (2026-10-20): branch `end-of-game-words` is cut from `main` after epic 9 merged.
- Unknown: DOM face copies' cost on a mid-range Android with a long word list; settled by Jared's device read at entry 6's done checkpoint (the first visible run), with a final read at entry 9.
- Unknown: whether pushing the end sheet's history entry after the hide callback behaves on Android; entry 7 proves it with the lifecycle helpers and the epic 7 device checks remain the final word.
- Decision (2026-10-20, ticket check): the sweep is last (entry 10, after the owner's device read); entry 1 owns the shared won-with-words fixture; there is no dev harness for the renderer (a unit render test stands in); the seam and the trigger ship together in entry 5 because the seam's checks need a real run, and the skips are entry 6 so each entry is one session; the sweep is entry 10.
- Decision (owner standing rule, 2026-10-23, Opus review): F14, the Words rows are separated by `--wc-hairline` lines as DESIGN.md Words section says (built in 10.2 with `--wc-outline`); fainter separators in every theme (`7352e29`, baselines `4e0d813`, evaluator approved).
- Decision (owner standing rule, 2026-10-23, ticket 10.4 review): SPEC F15, the keys-while-it-runs default confirmed; only Undo, `N`, `M`, ☰, `Space`/`Esc` and back act while the celebration runs.
- Decision (owner standing rule, 2026-10-23, ticket 10.5 code review): SPEC F16, a win that settles while the page is hidden shows the end sheet without the celebration; reduced motion (or the seam off) pushes no `celebration` history entry.
- Decision (owner standing rule, 2026-10-23, ticket 10.6 review): SPEC F17, `Space` and `Esc` skip the celebration whatever holds focus; AD-19 Skip's focus exception (spine bug) is dropped at entry 9's doc sync.
- Post-close review (2026-10-23): Opus re-review of the Sonnet-built tickets 10.1-10.3 (`19acd17..91e03d7`), review-loop code mode, thorough, one loop converged after 5 passes (majors 12, 7, 4, 2, 0; 25 fixed), fixes `c84a1df`, log `_bmad-output/implementation-artifacts/review-loop/opus-review-epic-10.md`. Main themes: the celebration drifted toward the nearer wall against EXPERIENCE.md and its test pinned the inverted side; on desktop and landscape most groups left without a floor bounce (horizontal speed now per group from its launch origin and exit distance); the band ignored a shown dictionary banner (now the AD-12 visible-band owner); `data-celebration` sat on groups, not copies; the layer sat under the drag layer (z-index 6 per DESIGN.md layer order); tests that would pass on broken code (word order after a non-default placement order, duplicate tie-break, visible Words text, waves, arc, cap scaling, fade, launch origins, manual-clock remainder); an unowned deferral (the per-run mount, now tickets.toml entry 5). Decision F14 (above). Owner-doc close-out edits applied on the owner's go-ahead 2026-10-23: AD-19 Rule bullet 1 and SPEC CAP-2/F3 read "entry index, the launch origin and the band size" (CAP-2 also clips to the AD-12 visible band); Scaffold deltas record `tsconfig.app.json` `allowImportingTsExtensions`; rule-coverage.md Exempt records the R-88 `1 letter` P6 exemption the 10.2 plan names. 15 minors carried to the refactor sweep (entry 10), notably: the 6 s cap counts simulated time (longer in wall time below 20 fps); a band no taller than a card gives NaN physics; the wave stagger is even (`i·g/3`), tuning at entry 6. `test:all` green; `test:screens` green after the F14 baselines; models Opus only.
