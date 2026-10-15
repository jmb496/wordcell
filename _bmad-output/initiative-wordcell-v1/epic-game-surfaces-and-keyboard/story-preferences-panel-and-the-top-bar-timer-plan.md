---
title: 'Preferences panel and the top-bar timer'
type: 'feature'
ticket: '4'
created: '2026-10-15'
status: 'built'
baseline_revision: 'b5b379853daff781c20e16943539d79622e19127'
route: 'full'
route_source: 'auto'
review: 'thorough'
review_source: 'auto'
lenses_ran: [blind-hunter, edge-case-hunter, verification-gap, intent-alignment]
review_loop_iteration: 0
followup_review_recommended: false
context:
  - '{project-root}/_bmad-output/specs/spec-epic-6-surfaces/SPEC.md'
  - '{project-root}/_bmad-output/specs/spec-epic-6-surfaces/build-notes.md'
  - '{project-root}/_bmad-output/initiative-wordcell-v1/epic-game-surfaces-and-keyboard/story-preferences-panel-and-the-top-bar-timer.md'
  - '{project-root}/_bmad-output/initiative-wordcell-v1/epic-game-surfaces-and-keyboard/story-preferences-panel-and-the-top-bar-timer.review-log.md'
warnings: []
deferred: []
---

<intent-contract>

## Intent

**Problem:** The menu has no Preferences row, no panel sets Animation speed or Show timer, and the top bar shows no timer.

**Approach:** Implement the ticket file as written (`story-preferences-panel-and-the-top-bar-timer.md`; its Description and Acceptance Criteria are the contract): `PreferencesPanel.svelte` and the Menu row, `text.timer` and panel strings in text.ts, the read-only `game.elapsedMs(now)` accessor, the TopBar timer driven by a UI interval, and the Vitest, Playwright and screens coverage the ticket names. Also resolve the open review-log major: add to AC bullet 1's e2e a live playing-to-Game-over step (Show timer on, Give up or win, advance `page.clock`, timer text equals the value at the transition and equals `text.timer` of the stored `activeMs`); if it cannot be built, record why in Implementation Notes.

## Boundaries & Constraints

**Always:** Rules 1–7 of AGENTS.md; spec wins over spine; open only through `openSurface('preferences')`; every control `act()`-wrapped; prefs written only via `prefs.svelte.ts` setters, uncaught; timer reads only `game.elapsedMs(performance.now())`; the interval never dispatches or writes; the UI holds no visibility listener (AD-9).

**Never:** end sheet or Statistics or How to play surfaces; the keymap (entry 10); `data-testid` on new controls; a second store; changes to the dealt layout or SESSION_VERSION.

</intent-contract>

## Code Map

- `src/ui/TopBar.svelte` -- add the 64 px timer box between score and Undo/Redo; `$effect` interval keyed on showTimer and playing.
- `src/ui/Menu.svelte` -- add the Preferences row after Give up (close menu, set `skipFocus`, `openSurface('preferences')`).
- `src/ui/Panel.svelte`, `src/ui/open-surface.ts`, `src/ui/overlays.svelte.ts` -- 6.1 foundation; reuse.
- `src/ui/PreferencesPanel.svelte` (new) -- radiogroup, switch, interim Esc handler, focus to ☰ on close.
- `src/ui/text.ts`, `src/ui/text.test.ts` -- `timer(ms)` and panel strings.
- `src/shell/game.svelte.ts` -- `elapsedMs(now)`; `src/shell/prefs.svelte.ts` -- setters exist (AD-10).
- `fixtures/prefs-*.json`, `fixtures/session-*.json`, `e2e/helpers/lifecycle.ts`, `e2e/helpers/seed.ts` -- reuse.
- `e2e/preferences.spec.ts` (new), `e2e/preferences.screens.spec.ts` (new) plus baselines.

## Tasks & Acceptance

**Execution:**
- [ ] `src/shell/game.svelte.ts` + Vitest -- `elapsedMs`: playing, won, gaveUp, halted/rejected throws
- [ ] `src/ui/text.ts` + test -- `timer` table and throws, panel strings
- [ ] `PreferencesPanel.svelte`, Menu row, `TopBar.svelte` timer
- [ ] `e2e/preferences.spec.ts` -- every Verify bullet of the ticket, plus the live playing-to-Game-over freeze step in bullet 1
- [ ] `e2e/preferences.screens.spec.ts` and baselines in the container

**Acceptance Criteria:**
- Given the ticket's Acceptance Criteria and the added live-freeze step, when `npm run test:all` and `npm run test:screens` run, then both are green.

## Implementation Notes

Route full: more than five files across shell, UI and e2e.

## Plan Change Log

## Review Triage Log

### 2026-10-15 — Review pass
- verdicts: 20 findings — high 0, medium 0, low 1, false 12, maybe-false 0 (rest rejected low)
- findings:
  - `[low]` `[patch]` live-freeze test compared against a local `mss` helper, not `text.timer` (intent auditor) — e2e now imports `text.timer`; preferences.spec.ts passes (22)
  - `[false]` `[reject]` timer not reactive after Give up/win, Undo out of Game over (blind) — the live-freeze and Undo e2e cases pass; `elapsedMs` reads `$state`
  - `[false]` `[reject]` hidden-tab and first-tick lag after showPage (blind, edge) — the UI holds no visibility listener by AD-9; the hidden e2e asserts constant value and resume within one tick
  - `[low]` `[reject]` 100 h+ overflows the 64 px box (edge) — unreachable in play, fix adds branches
  - `[low]` `[reject]` radio shows unstored value if a setter throws (edge) — setter throws mean a bug under rule 6, fail fast
  - `[low]` `[reject]` focus taken from another overlay on panel close (edge) — no path puts another overlay above Preferences
  - `[low]` `[reject]` global querySelector for ☰, a11y colour cues, 13 px size, aria-live, duplicated Esc handler, glide-test flake, desktop and Slow coverage, screens spec strength, plan housekeeping (blind) — spec-sanctioned interim patterns or cosmetic, no failing case shown
  - `[low]` `[reject]` live test covers Give up, not a live win (intent) — ticket says "Give up or win"; the won branch is covered by relaunch, Undo and Vitest
  - `[false]` `[reject]` verification-gap: no gaps filed

## Auto Run Result

- Summary: Preferences panel and Menu row, `game.elapsedMs`, `text.timer` and panel strings, TopBar timer with a 1000 ms interval, plus the live playing-to-Game-over freeze e2e step (review-log major resolved: Give up at 0:03, text equals stored `activeMs` via `text.timer` after clock advance and hide/show).
- Files: src/shell/game.svelte.ts(+test), src/ui/{PreferencesPanel.svelte,TopBar.svelte,Menu.svelte,App.svelte,text.ts,text.test.ts}, e2e/{preferences.spec.ts,preferences.screens.spec.ts,menu.spec.ts}, regenerated menu baselines and new preferences baselines.
- Review: 1 patch applied (low), the rest rejected with reasons above, none deferred.
- Follow-up review recommended: false.
- Verification: `npm run test:all` and `npm run test:screens` green (implementer); preferences.spec.ts re-run green after the patch.
- Residual risks: panel strings are my wording (catalogue has none), owner to confirm; `game.elapsedMs` is a new read path outside GameView, to be recorded as a sanctioned AD-9 read path in the spine/build-notes close-out; live win (not Give up) transition covered only by relaunch/Undo/Vitest.

## Verification

**Commands:**
- `npm run test:all` -- expected: all suites pass
- `npm run test:screens` -- expected: green (Docker)
