---
id: 6
type: story
title: "Celebration skip"
parent: epic-end-of-game-words
covers: [CAP-3]
after: [5]
risk: high
---

# Celebration skip

## Description

Adds the skips on top of entry 5's trigger: a press outside the top bar, action bar and dictionary banner that began after the start (one-shot click swallow, consumed; a held finger and a banner button do not skip), `Space`/`Esc` on desktop (not while a bar or banner control has focus), and the Android back gesture through entry 4's `closedByBack` path; this entry owns the press-outside-the-bars e2e helper and adjusts the wave, stagger and physics constants and the copy scale that Jared's Android read calls for.

- Interface: capture-phase listeners owned by `celebration.svelte.ts`, `pressEscape`'s `celebration` branch, the `e2e/helpers/` press helper. Tests: R-87 skip rows (P6, `desktop` for the keys); UI Vitest `AD-19` listener tests (U: a press after vs before the start, targets in a bar or the banner, keys with and without bar/banner focus, `end()` once, listeners gone after end, back, cap and cancel). Owns: the skips and the press helper. Consumers: entries 7 and 8 (entry 8 runs the press helper hook-free against `dist/`). Plan checkpoint: the build stops at its plan for the owner. Done checkpoint: gate 4 is Jared's Android read (Tuning; AC Device read).
- Press: the listeners attach at `start()` and detach on the internal stop every removal reaches (`ended` and `cancelled`; entry 4 Notes (d): teardown hangs there, not on `onEnd`). `end()` runs on the qualifying `pointerdown`: primary button only (`button === 0`), any pointer type, "after the start" judged per `pointerId` (a finger held from before the win stays inert even if a second finger lands); a target inside the top bar, the action bar or the dictionary banner passes through untouched (`act()` and its own path, AD-19 Skip). That press's `pointerup` and `click` stay consumed after the run ends (by this skip, the finish or the cap), reusing epic 5's click swallower and its expiry (`src/ui/gestures/click-swallow.ts`), so the release never collapses the just-opened sheet through its scrim or activates its first action. If the banner hides mid-run (Retry succeeds), the band stays as measured at `start()`; resize remains the only geometry end.
- Keys: a capture `keydown` listener (no platform gate; the key rows run on the `desktop` project) consumes `Space`/`Esc` and calls `end()` unless a top-bar, action-bar or banner control holds focus (AD-19 Skip); with such focus `Space` acts on the focused control natively. It ignores `event.repeat` and modifier chords (as `src/ui/keys.ts` does), cancels the pointer controller first (`act()`/`cancelGesture()`, as `pressEscape` does), and consumes the skipping `Space`'s matching `keyup`, so it cannot activate Replay this deal once the sheet takes focus. Esc today ends the run through `pressEscape` (`else overlays.close(top)`) whatever has focus; this ticket changes `pressEscape`'s `celebration` branch so a bar- or banner-focused Esc leaves the run running (entry 4 Notes).
- Helper: `skipByPress(page)` in `e2e/helpers/celebration.ts`: DOM only (no `window.__wordcell`), waits for the mounted `[data-celebration-group]`s, presses a point inside the AD-12 visible band outside both bars and the banner (touch on touch projects, the mouse otherwise), returns once the expanded end sheet is visible; its own test in `e2e/helpers.spec.ts`.
- Tuning: the build ships entry 3's constants and copy scale unchanged and stops at the done checkpoint. Changes Jared names are applied on this ticket within F6/F7 and the AD-19 cap, keeping the last Slow launch after the Fast cap (entry 5's plan relies on it) and the AD-19 `step` tests and R-87 cap rows green, then `npm run test:all` and `npm run test:screens` re-run; the values and the A-D12 verdict go in the epic file's Notes for entry 9's doc sync. A copy cost that fails on the device stops for the owner (it reopens F2), never handled by the builder.

## Acceptance Criteria

Verify: `npm run test:all` and `npm run test:screens` are green, and the four R-87 skip rows of rule-coverage.md pass on `android` (`desktop` for `Space`/`Esc`), the hide/resize and keys rows staying with entry 7:

- Press outside the bars (consumed): a press on a non-empty WordCell (or where the expanded sheet's scrim or Replay this deal will be) ends the run; after release the sheet is still expanded, no WordCell view opened, the Session unchanged.
- `Space` and `Esc` (`desktop`).
- Back: win → back → sheet expanded, app open; back again → sheet collapsed, app still open (no new code: entry 4/5's `closedByBack` path; this is the real-sheet proof entry 4 deferred here).
- Held finger and banner button: a touch held from before a keyboard Confirm (e.g. `e2e/helpers/touch.ts`) and released mid-run leaves `running()` true; a failing dictionary route (as in `e2e/dictionary.spec.ts`) shows the banner, and Retry mid-run leaves `running()` true and the sheet hidden.
- Screens: one frame in a new `e2e/celebration.screens.spec.ts` (won-words fixture, seam enabled, a fixed manual-clock advance mid-run, the `android` project's viewport, default theme), baseline generated in the container per AGENTS.md.
- Device read (done checkpoint): Jared's Android read of the first real win with the long-word fixture settles the copy cost, the initial constants and A-D12 as far as the fixture shows them; the 40 % scale floor and the large-list copy cost are judged at entry 9's close-out read (SPEC Assumptions "final read at close-out"). Handoff: hook-free `dist/` (`npm run build`, then `npm run preview -- --host` or equivalent on the LAN), `fixtures/session-won-words.json` written to `wordcell:session` via chrome://inspect remote DevTools, reload, Undo, Confirm. Checklist: copy cost and frame rate, the constants' feel, A-D12 readability at the fixture's sizes, no trail and no colour change (rule-coverage Exempt), the press skip, back to skip then a second back collapsing the sheet.

## References

- parent — _bmad-output/initiative-wordcell-v1/epic-end-of-game-words/epic-end-of-game-words.md
- architecture — ARCHITECTURE-SPINE.md AD-12 (visible band, `act()`/`cancel()`), AD-13, AD-14 (winning guard), AD-17 (Celebration seam), AD-19 (Skip)
- spec — SPEC.md CAP-3, F2, F6, F7, Assumptions; rule-coverage.md (R-87 skip rows, Exempt)
- design — EXPERIENCE.md Win celebration (Skip), Keyboard; DESIGN.md A-D12
- code — src/ui/celebration/, src/ui/motion.ts, src/ui/keys.ts, src/ui/overlays.svelte.ts, src/ui/gestures/click-swallow.ts, src/ui/gestures/visible-band.ts, e2e/helpers/celebration.ts, e2e/helpers/touch.ts, e2e/helpers.spec.ts, e2e/dictionary.spec.ts

## Notes

- Open question: How Android treats a back that ends the run and immediately pushes the sheet entry; the P6 back test proves the app-level sequencing, the device read's back check proves the platform.
