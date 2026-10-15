---
title: 'Statistics panel, history flag and menu dot'
type: 'feature'
ticket: '5'
created: '2026-10-15'
status: built
baseline_revision: 'a1f53abfac2ffe845f243bd69f9700f64938691b'
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
  - '{project-root}/_bmad-output/initiative-wordcell-v1/epic-game-surfaces-and-keyboard/story-statistics-panel-history-flag-and-menu-dot.md'
  - '{project-root}/_bmad-output/initiative-wordcell-v1/epic-game-surfaces-and-keyboard/story-statistics-panel-history-flag-and-menu-dot.review-log.md'
warnings: ['oversized']
deferred: []
---

<intent-contract>

## Intent

**Problem:** The menu has no Statistics row, no panel shows the R-84 statistics or the unreadable-history message, and the ☰ button carries no error dot.

**Approach:** Implement the ticket file as written (`story-statistics-panel-history-flag-and-menu-dot.md`; its Description, Acceptance Criteria and the 2026-10-15 owner decision are the contract). Owner decision: the longest-word tile shows the word in capitals as the main value with a small ink-secondary caption beneath it, `8 letters` (`1 letter` for one), the caption built from a text.ts key; with no longest word the tile shows `—` and no caption. Also resolve the review-log § Result items: the Esc handlers cite 6.4 (PreferencesPanel `closeOnEsc`) and 6.3 (ConfirmDialogs covers only newGame/replay confirms), so the reset confirm gets its own top-gated handler, active only while the confirm was opened from the Statistics panel (the notice's confirm Esc stays as is: leaves it open, existing history-notice.spec); the shared Delete history closes only `resetConfirm` and the notice adds its own `historyNotice` close; `history-three-records.json` expects 3 / 1 / 2 / 355 / 355 / `LQUEJATA` `8 letters`; the dot appears wherever ☰ renders; the message renders only in the unreadable branch; a `statistics` title key goes in text.ts. Record in Implementation Notes why any remaining unapplied minor is left (long-word wrap baseline, fractional-mean guard, focus-return mechanism wording, empty-line/unreadable rule merge).

## Boundaries & Constraints

**Always:** Rules 1–7 of AGENTS.md; spec wins over spine; open only through `openSurface('statistics')`; every control `act()`-wrapped; shared reason-to-sentence mapping extracted from HistoryNotice.svelte into text.ts and used by notice and panel; no new copy for the message; no new `data-testid`; test names start with the id.

**Never:** end-sheet block (entry 7), the keymap (entry 10), a second store, engine changes, SESSION_VERSION or deal changes, changing the notice's behaviour or the existing history-notice specs.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Values | history-three-records.json | 3, 1, 2, 355, 355, `LQUEJATA` + `8 letters`; no empty line | none |
| Fresh | empty history | 0, 0, 0, `—`, `—`, `—`, empty line | none |
| Negative-only | new fixture, given-up games all negative, no longestWord | counts shown, best/average/longest `—`, no caption, no empty line | none |
| Tie | new fixture, two given-up records scoring 0, equal letterCount, different spellings | best 0, average 0, earlier record's spelling | none |
| QU / one letter | QU word; letterCount 1 | `QU` kept uppercase; `1 letter` | none |
| Unreadable | history-invalid-version-unknown / -array / -won-negative | message (own sentence + hint) and Reset history instead of tiles; dot | none |
| Reset | Delete history / Keep it, Esc, back, scrim | Delete: fresh view, dot gone, panel open, focus on heading; Keep: message, dot, panel stay, focus on Reset history | none |

</intent-contract>

## Code Map

- `src/ui/HistoryNotice.svelte` -- local `sentence()`, confirm and handlers move out; notice keeps its own `historyNotice` close and captured reason (`noticeReason()`).
- `src/ui/history-notice.svelte.ts` -- add the live getter over `scoreHistory.state` (`status === 'unreadable'`); no other change.
- `src/ui/PreferencesPanel.svelte`, `src/ui/Menu.svelte`, `src/ui/ConfirmDialogs.svelte`, `src/ui/Panel.svelte` -- patterns to copy (Esc, focus to ☰, `skipFocus`, heading focus); Menu gets the Statistics row between Give up and Preferences.
- `src/ui/TopBar.svelte` -- dot on the ☰ button, aria-hidden, plus visually hidden description element and `aria-describedby` only while true (error colour token).
- `src/ui/App.svelte` -- render `StatisticsPanel`; `src/ui/open-surface.ts` and `overlays.svelte.ts` already allow `statistics` and `resetConfirm` over it.
- `src/ui/text.ts`, `text.test.ts` -- statistics labels, empty line, letter-count caption, `statistics` title, close label, `sentence` mapping.
- `src/shell/history.svelte.ts` -- `scoreHistory.statistics`/`state`/`reset()` (read only); engine `Statistics` shape in `src/engine/history.ts`.
- `fixtures/` -- add valid tie and negative-only fixtures; reuse `history-three-records.json`, `history-invalid-*`.
- `e2e/helpers/dialogs.ts`, `seed.ts`, `board.ts`; model on `e2e/history-notice.spec.ts`, `e2e/preferences.spec.ts`, `e2e/preferences.screens.spec.ts`.

## Tasks & Acceptance

**Execution:**
- [x] `src/ui/text.ts` + `text.test.ts` -- strings, caption (`N letters`/`1 letter`), shared `sentence` mapping
- [x] shared reset-confirm component or function (new file in `src/ui/`) -- confirm + `keepIt`/`deleteHistory` (closes `resetConfirm` only), focus return per opener; HistoryNotice uses it unchanged in behaviour
- [x] `src/ui/history-notice.svelte.ts` -- unreadable-history getter + AD-named Vitest asserting the underlying `$state` (also in an inactive game state; false after reset)
- [x] `src/ui/StatisticsPanel.svelte`, `Menu.svelte`, `App.svelte` -- panel, row, interim top-gated Esc, focus to ☰ at close
- [x] `src/ui/TopBar.svelte` -- the dot and description
- [x] `fixtures/` -- the two new valid fixtures (parseHistory-valid)
- [x] `e2e/statistics.spec.ts`, `e2e/statistics.screens.spec.ts` + baselines (container) -- values, empty, negative-only, tie, QU, unreadable variants + dot, Reset flows and focus, AD-13 two-overlay reload; screens: panel with values, empty, unreadable, top bar with dot at 360 px

**Acceptance Criteria:**
- Given the ticket's Acceptance Criteria and the owner's longest-word wording, when `npm run test:all` and `npm run test:screens` run, then both are green.

## Implementation Notes

Route full: more than five files across UI, fixtures and e2e.

Built 2026-10-15. Shared confirm is `src/ui/ResetConfirm.svelte` (props `ondeleted`, `escKeeps`); the panel renders it only while it is open, the notice as before. `text.ts` keeps the three history sentences as module consts so `historySentence` shares them; its reason type is structural because e2e specs import `text.ts` and must not pull in the rune-based shell store. `e2e/menu.spec.ts` count updated for the new row.

Minors left unapplied: long-word wrap baseline (the tile wraps with `overflow-wrap: anywhere`, no 10-letter baseline: the 8-letter baseline covers the layout); fractional-mean guard (the engine rounds, A-E3, the panel formats only); focus-return wording (an effect after `tick()` in StatisticsPanel, as PreferencesPanel does); empty-line/unreadable rule merge (wording only, behaviour covered by tests). Review patch: Panel gained an optional `covered` prop, so the panel is inert while the reset confirm is open over it.

## Plan Change Log

## Review Triage Log

### 2026-10-15 — Review pass
- verdicts: 24 findings — high 0, medium 1, low 4, false 5, maybe-false 0 (rest rejected low or observations)
- findings:
  - `[medium]` `[patch]` panel not inert under the open reset confirm, Tab reaches the panel behind it (blind, edge) — Panel `covered` prop plus an e2e Tab test added
  - `[low]` `[reject]` Esc handler order between panel and confirm (blind, edge) — pinned by the passing e2e Esc test (verification-gap); a guard adds complexity
  - `[false]` `[reject]` QU test letterCount and inline JSON (blind) — letterCount counts letters (LQUEJATA is 8, Q-35); the string goes through seedStorage
  - `[low]` `[reject]` plan housekeeping, unticked boxes (blind, intent) — ticked at finalize
  - `[low]` `[reject]` new tile labels need owner sign-off (blind, intent) — the ticket says the build adds them to text.ts; recorded as a residual risk
  - `[low]` `[reject]` dot a11y, sr-only positioning, hard-coded sizes, TopBar reading the flag three times, helper location (blind, edge) — ticket-mandated shape; the top bar is sticky so it is the containing block; single instance
  - `[low]` `[reject]` focus-return DOM queries and silent optional chaining, dropped focus under another overlay (blind, edge) — same pattern as PreferencesPanel; no path puts another overlay above the panel
  - `[low]` `[reject]` flag test mocks the store, loops game kinds (blind, intent) — the existing notice tests mock the same way; the real reset is covered by the Delete history e2e
  - `[low]` `[reject]` screenshot specs wait for dictionary only on the dot test (blind, edge) — matches preferences.screens; baselines stable over three runs
  - `[false]` `[reject]` remaining coverage-gap and divergence observations (blind, intent) — checked by verification-gap, no gaps; descriptive only

## Verification

**Commands:**
- `npm run test:all` -- expected: green
- `npm run test:screens` -- expected: green with the new baselines generated in the container

## Auto Run Result

**Summary:** Statistics panel (six tiles, empty line, unreadable message with Reset history), Menu row, ☰ error dot with hidden description, live `historyUnreadable()` flag, shared `ResetConfirm`, shared reason-to-sentence mapping. Owner decision applied: longest-word tile shows the word in capitals with a grey caption `8 letters` (`1 letter`). Review-log § Result items resolved or recorded in Implementation Notes (no open major).

**Files:** `src/ui/StatisticsPanel.svelte` (new panel), `src/ui/ResetConfirm.svelte` (shared confirm), `src/ui/Panel.svelte` (`covered` prop), `src/ui/Menu.svelte` (row), `src/ui/TopBar.svelte` (dot), `src/ui/App.svelte`, `src/ui/HistoryNotice.svelte`, `src/ui/history-notice.svelte.ts` (flag), `src/ui/text.ts` (+tests), `fixtures/history-tie-longest-word.json`, `fixtures/history-negative-only.json`, `e2e/statistics.spec.ts`, `e2e/statistics.screens.spec.ts` + baselines, `e2e/menu.spec.ts`.

**Review:** 1 patch applied (panel inert under the confirm); 0 deferred; rejections recorded in the triage log.

**Follow-up review recommended:** false (one medium patched).

**Verification:** `npm run test:all` green; `npm run test:screens` green (22 passed), both after the patch.

**Residual risks:** tile labels and `Close statistics` are new copy not in the EXPERIENCE.md catalogue (flagged in text.ts for the owner).
