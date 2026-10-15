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

Adds the Preferences panel and its menu row, and the top-bar timer between score and Undo, fitting at 360 px.

Panel: `PreferencesPanel.svelte` renders inside Panel.svelte (opener `openSurface('preferences')`, SPEC F8). The Menu row `Preferences` goes after Give up (EXPERIENCE.md Menu sheet order) and, closes the menu then opens the panel. Controls: radiogroup `Animation speed` with radios `Fast`/`Normal`/`Slow`, and a `role=switch` named `Show timer` (default off); labels in text.ts; every control and the back control `act()`-wrapped; no `data-testid`. Setters `prefs.setAnimationSpeed`/`setShowTimer` write at once and are called uncaught (rule 6; they throw while halted or booting, AD-10); a change applies to the next glide (`--wc-base-ms` 90/180/320, AD-10; reduced motion wins) and never touches the Session (not undoable). Esc: Panel.svelte has no keydown handling, so the panel gets an interim `act()`-wrapped window handler like Menu's, active only when `overlays.top === 'preferences'`, replaced by entry 10's keymap; Back closes it through the panel's back control and `history` pop; at close focus goes to the ☰ button after `tick()` unless the menu reopened, as ConfirmDialogs does (presence's restoreFocus aims at the exiting menu row).

Timer: the UI cannot read `activeMs` or `clock.peek` (GameView has none; the game store does not re-export the clock), so `game.svelte.ts` gains one read-only accessor `game.elapsedMs(now)`: the Session's `activeMs + clock.peek(now)` while `view.status === 'playing'`, `activeMs` for `'won'` and `'gaveUp'` (AD-9), throwing when the store is halted, rejected or booting (rule 6; TopBar mounts only in App's `active` branch, so the expression and its effect never run there); read-only, so AD-3, AD-4 and the AD-17 test hook are unaffected. TopBar always renders `text.timer(game.elapsedMs(performance.now()))`, never a stored `now`, only while Show timer is on, in a fixed 64 px right-aligned box between score and Undo with tabular numerals (DESIGN.md Top bar); the box is absent when off, so baselines are unchanged. A 1000 ms `setInterval` created in a `$effect` keyed on `prefs.value.showTimer` and `view.status === 'playing'` bumps a refresh trigger and is cleared in the effect cleanup (toggle off, Game over, New game, Replay, destroy); every dispatch and a visible `visibilitychange` bump it too, and leaving playing re-derives (AD-9), so the frozen value equals `activeMs`. It shows `0:00` after New game or Replay, grows nothing while hidden (R-76), resumes from the stored value after Undo out of Game over, and stays in the bar, frozen, in Game over. An open panel neither stops nor writes.

Formatter: `text.timer(ms)` in src/ui/text.ts (beside `text.score`), flooring to whole seconds, `m:ss` below one hour and `h:mm:ss` from it, minutes and seconds zero-padded, hours unpadded and uncapped; it throws on negative or non-finite input (rule 6). Table: 0 → `0:00`, 59 999 → `0:59`, 60 000 → `1:00`, 3 599 999 → `59:59`, 3 600 000 → `1:00:00`, 43 384 000 → `12:03:04`.

- interface: new src/ui/PreferencesPanel.svelte; TopBar.svelte gains the timer; text.ts gains `timer(ms)` and the panel strings; game.svelte.ts gains the read-only `elapsedMs(now)`; the Menu row.
- tests: R-76 (UI) timer shown only when on, frozen when over (P6); spec §7.10 Preferences persist and survive New game (P6); Q-36 unreadable prefs default (existing S); AD-10 timer format (U); AD-9 `elapsedMs` (U, UI Vitest).
- owns: the Preferences panel and the timer.
- consumers: TopBar.svelte layout is shared with entry 2 and the screenshot baselines.

## Acceptance Criteria

Verify: npm run test:all and npm run test:screens are green, Playwright on android (Esc also on desktop; after Esc or Back from the panel `toBeFocused` on the ☰ button), showing:

- from the Menu row `Preferences`, Show timer on shows the timer ticking while `status` is playing and not at all when off; `fixtures/prefs-non-default.json` (slow, showTimer true, via `seedStorage`) drives the reload, New game and Replay persistence of both preferences; a New game or Replay shows `0:00`;
- relaunch into Game over from `fixtures/session-won.json` (`0:00`, covers the won branch) and `fixtures/session-gave-up.json` (`0:01`, the frozen-value proof) with `wordcell:prefs` seeded `showTimer` true: the timer is in the bar, frozen; Undo out of Game over resumes from the stored value;
- tick writes nothing: with `page.clock`, every `wordcell:*` key stays byte-identical and the move count unchanged across a clock advance both with the interval running while playing and in the Game over relaunch;
- hidden (`hidePage`, e2e/helpers/lifecycle.ts) with `page.clock` advanced, the displayed value stays constant (R-76) and resumes after `showPage`;
- Fast (`fixtures/prefs-fast.json`) gives `--wc-base-ms` 90 (Normal 180, Slow 320) and a WAAPI `getTiming().duration` for the same move shorter than under Normal (reduced motion off), applying to the next glide;
- Q-36: seeded from `fixtures/prefs-unreadable.json` the panel shows Normal and off and the first change writes a valid record; a preference change leaves `wordcell:session` byte-identical and Undo/Redo state unchanged;
- at 360 px the top bar fits with the timer shown, showing an `h:mm:ss` value (`session-gave-up.json` read in the test with `activeMs` set to 43 384 000, within AD-7's 0…2^52) and its `Score −530` (R-82, U+2212): no overlap or overflow (`scrollWidth <= clientWidth`, boxes inside the board width) and the timer box width constant across ticks (a playing `session-composing.json` with `activeMs` 3 599 000 crossing `59:59` to `1:00:00`);
- UI Vitest: AD-10 `text.timer` over the table above and its throws; AD-9 `game.elapsedMs` for playing, won, gaveUp and its halted/rejected throws.

Screens specs: `e2e/preferences.screens.spec.ts` (Preferences panel at 360 px; top bar with the timer at 360 px, including a negative score), android, baselines generated in the container.

## References

- parent — _bmad-output/initiative-wordcell-v1/epic-game-surfaces-and-keyboard/epic-game-surfaces-and-keyboard.md
- spec — _bmad-output/specs/spec-epic-6-surfaces/SPEC.md, Capabilities (CAP-7), Decisions
- spec — docs/game-flow-spec.md, R-76, R-82, §7.10, Q-36
- architecture — _bmad-output/planning-artifacts/architecture/architecture-wordcell-2026-09-27/ARCHITECTURE-SPINE.md, AD-3, AD-9, AD-10
- design — _bmad-output/planning-artifacts/ux-designs/ux-wordcell-2026-09-27/EXPERIENCE.md, Component Patterns, Keyboard, State Patterns, Motion
- design — _bmad-output/planning-artifacts/ux-designs/ux-wordcell-2026-09-27/DESIGN.md, Components, Top bar, Panels
