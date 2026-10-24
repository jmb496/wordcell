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
- Decision (owner standing rule, 2026-10-24, ticket 10.6 code review): SPEC F18, a new press is consumed for 300 ms after a press skip; SPEC F19, bar hits by press point and chorded/repeat `Space` blocked during the run (AD-19 Skip synced by entry 9).
- Decision (owner, 2026-10-24, Android read of 10.6): frame rate good; SPEC F20, celebration cards overlap 35 % (was 50 %); SPEC F21, follow-the-leader per-card motion along the word's arc (a rainbow), within the F7 cap. Entry 9 syncs DESIGN.md Win celebration, SPEC CAP-2, A-D12 and AD-19.
- Decision (owner, 2026-10-24, second Android read of 10.6): SPEC F23, trailing cards keep one row step (0.65 card width x scale) behind the card ahead measured along the path, so the word reads as a bent row; supersedes F21's time lag.
- Decision (owner, 2026-10-24, third Android read of 10.6): SPEC F24, a more consistent speed along the arc (apex slowdown slight, about two-thirds of peak at least); path shape unchanged.
- Decision (owner, 2026-10-24, fourth Android read of 10.6): SPEC F25, constant speed along the arc with each lap's duration as the physical path (F24 was too fast); supersedes F24's speed rule.
- Decision (owner, 2026-10-24, fifth Android read of 10.6): SPEC F26, each card appears at the WordCell launch point in turn (no launch row, no slide); SPEC F27, words drift toward the farther wall and cross the screen.
- Decision (owner standing rule, 2026-10-24, ticket 10.7 plan checkpoint): SPEC F28, hide ends the run the ordinary way (pops its history entry); SPEC F29, a ☰/M open raced by back or an open menu is skipped. The ☰/M merge blocker from 10.4–10.6 is closed.
- Decision (owner, 2026-10-24): the autopilot runs 10.9's non-device parts and stops with it `built` for the owner's Android read (ticket Notes); R-87 gains the dictionary-banner skip exemption as built.
- Flake fixed (2026-10-24, during 10.9's checks): `e2e/nav.spec.ts:162` and three other double-tap tests sent two `touchscreen.tap`s 80 ms apart; under parallel load the real gap passed Chromium's 400 ms tap-count window, so the second click had `detail` 1 and acted. New AD-17 Touch helper `doubleTap` (`e2e/helpers/touch.ts`, stamped CDP taps, asserts detail 1 then 2). Close-out doc: ARCHITECTURE-SPINE.md AD-17 Touch bullet should list `doubleTap` (for the retrospective).
- Owner Android read (2026-10-24, ticket 10.9, `session-won-long-words` over Tailscale): all good. A-D12 verdict: accepted (copies readable at the smallest measured scale, 0.553); long list smooth; hide path, Words section, no trail or colour change, toolbar and ☰-then-back interruptions as specified. Nothing carried to 10.10 from the read.
- Post-close review (2026-10-23): Opus re-review of the Sonnet-built tickets 10.1-10.3 (`19acd17..91e03d7`), review-loop code mode, thorough, one loop converged after 5 passes (majors 12, 7, 4, 2, 0; 25 fixed), fixes `c84a1df`, log `_bmad-output/implementation-artifacts/review-loop/opus-review-epic-10.md`. Main themes: the celebration drifted toward the nearer wall against EXPERIENCE.md and its test pinned the inverted side; on desktop and landscape most groups left without a floor bounce (horizontal speed now per group from its launch origin and exit distance); the band ignored a shown dictionary banner (now the AD-12 visible-band owner); `data-celebration` sat on groups, not copies; the layer sat under the drag layer (z-index 6 per DESIGN.md layer order); tests that would pass on broken code (word order after a non-default placement order, duplicate tie-break, visible Words text, waves, arc, cap scaling, fade, launch origins, manual-clock remainder); an unowned deferral (the per-run mount, now tickets.toml entry 5). Decision F14 (above). Owner-doc close-out edits applied on the owner's go-ahead 2026-10-23: AD-19 Rule bullet 1 and SPEC CAP-2/F3 read "entry index, the launch origin and the band size" (CAP-2 also clips to the AD-12 visible band); Scaffold deltas record `tsconfig.app.json` `allowImportingTsExtensions`; rule-coverage.md Exempt records the R-88 `1 letter` P6 exemption the 10.2 plan names. 15 minors carried to the refactor sweep (entry 10), notably: the 6 s cap counts simulated time (longer in wall time below 20 fps); a band no taller than a card gives NaN physics; the wave stagger is even (`i·g/3`), tuning at entry 6. `test:all` green; `test:screens` green after the F14 baselines; models Opus only.
- Tuning applied (2026-10-24, ticket 10.6, SPEC F20/F21/F23; for entry 9's doc sync): `step.ts` `CARD_STEP` 0.65 (replaces `OVERLAP` 0.5: card centres 0.65 card widths apart, 35 % overlap), `FIT_SHARE` 0.9 and the 0.4 floor unchanged (a 23-letter row at card width 40 on 360 px now scales to 0.53, was 0.675); follow the leader: each copy has its own transform on one closed-form group path (rise RISE_SHARE 0.5, elastic floor rebound, constant drift), the card at the leading end first; SPEC F23: each card one row step (`CARD_STEP` 0.65 card units) behind the card ahead measured along the path (arc length in card units: x over the scaled card width, y over the scaled card height, so horizontal stretches keep the 0.65-width row step and steep ones get 0.65 card heights instead of 0.49; the closed-form arc sampled at launch, `ARC_SAMPLES` 64 per segment, inverted by binary search and one Newton step; within a group the lower card (greater y) is drawn above, equal y keeps row order, z-index written only on a change), trailing card k sliding along the row's line behind the launch point until the leader has run k steps; drift from the leading card's travel (`EXIT_AFTER_CONTACTS` 2, `SPEED_STEP` 0.15), and a group whose last card would leave after cap − 1 × base plays its whole arc faster (SPEC F22: vx, vy × pace, gravity × pace²; with the card-unit F23 trail the pace at Normal on `step.test.ts`'s real layouts is 1.00 for every fixture and long-scene row at all three geometries except the long scene's 23-letter row in landscape 839x412, 1.093 (was up to 1.11 and 2.7 under F21's time lag); a late, long row, e.g. a 23-letter 31st entry, ≈ 1.64), so every card exits before the closing fade (the fixture run ends ≈ 4.83 s at Normal, ≈ 8.59 s at Slow, portrait); waves, stagger and fall constants unchanged; A-D12's 40 % floor, a 23-letter row, hundreds of per-card layers and per-word bounce tempo under the trail fit still carried to entry 9's long-list read. AD-19 Rule bullet 1 / CAP-2 ("moves groups", per-group transform) and DESIGN.md's 50 % overlap are synced by entry 9.
- Tuning applied (2026-10-24, ticket 10.6, SPEC F25, replaces F24's; for entry 9's doc sync): the path, the F23 trail and the stacking unchanged; each word's leader runs the path at one constant speed in card units (the trail's measure, so all its cards share it; on screen a steep stretch runs up to cardH / cardW ≈ 1.33 x faster in px than a level one), `speed` = the arc to the group's exit over the path's own time to it, so every run takes the pre-F24 time (`MIN_SPEED_SHARE` and the clock tables removed); one speed per word, not per lap: full laps' speeds agree within ≈ 3 %, the last partial lap differs up to 1.83 x on the portrait fixture, so full laps run within 8.1 % of the path's; F22 fit back to F23's values (pace 1.00 on the real layouts but the long scene's 23-letter landscape row, 1.093; ≈ 1.64 for a 23-letter 31st entry at 360 px); fixture run (portrait) 4.832 s Normal, 8.592 s Slow, 2.416 s Fast (F24: 3.344, 5.952, 1.680); only `celebration-mid-run-android-linux.png` regenerated.
- Tuning applied (2026-10-24, ticket 10.6, SPEC F26/F27, fifth owner read; for entry 9's doc sync): no launch row: every card of a word waits hidden at its WordCell origin (SPEC F8) and appears there when the leader has run its `CARD_STEP` card units of arc (`cardShown` in `step.ts`; the controller writes a copy's `visibility` only on a change, `hidden` then `''`, and no transform while it waits), then follows the leader; F23 trail, F25 constant speed, stacking, per-card contact and exit, F6 waves and the F7 cap unchanged. Each word drifts toward the farther wall (unchanged since `c84a1df`, tie at the exact centre goes right) and leaves past it at the apex of the hop after `contacts` floor contacts, the count (at least 1) that makes the hop nearest `HOP_SHARE` 0.28 of the band width x (1 + `SPEED_STEP` 0.15 x slot) (`EXIT_PHASE` 0.5 replaces `EXIT_AFTER_CONTACTS` 2; today's hops were 0.11–0.57 of the band, about 0.3 typical; now 0.81–1.30 of the target, 1 contact from the centre to 3 from an edge). F22 fit recomputed (pace at Normal): portrait fixture up to 1.436 (its last word from WordCell 3; also 1.143 for the 10-letter first), desktop/landscape fixture up to 1.03, long scene portrait up to 1.246, landscape 1.156, desktop 1.00; a 23-letter 31st entry 1.91. Fixture run (all three geometries, at the fit) 2.912 s Fast, 5.824 s Normal, 10.352 s Slow (F25: 2.416, 4.832, 8.592); A-D12 row scale kept for the copy size though no row is drawn; only `celebration-mid-run-android-linux.png` regenerated.
