---
id: SPEC-epic-10-end-of-game-words
companions:
  - rule-coverage.md
  - ../spec-epic-6-surfaces/SPEC.md
  - ../../../docs/game-flow-spec.md
  - ../../planning-artifacts/architecture/architecture-wordcell-2026-09-27/ARCHITECTURE-SPINE.md
  - ../../planning-artifacts/ux-designs/ux-wordcell-2026-09-27/EXPERIENCE.md
  - ../../planning-artifacts/ux-designs/ux-wordcell-2026-09-27/DESIGN.md
  - ../../../AGENTS.md
  - ../../../docs/development-methodology.md
sources: []
---

> **Canonical contract.** This SPEC and the files in `companions:` are the contract for what to build, test and validate. Rules are in `docs/game-flow-spec.md` v0.11 (R-86…R-88, Q-46…Q-48, §7.12); this spec cites them and restates none.

# Epic 10 — End-of-game word list and win celebration

## Why

After a game ends the player sees a score, a band and one longest word, but not the words they made. Q-46…Q-48 add a list of every word of the latest game (win or give-up), longest first, and a bouncing-words celebration for a win. The rules are decided; the UX details and the animation layer's architecture are not (Open Questions). Builds on epic 6's end sheet (`EndSheet.svelte`, `end-sheet.ts`) and epic 9's themes (card art).

## Capabilities

In build order; each depends on those above it unless noted.

- **CAP-1** Engine word list (R-86; AD-2, AD-3, AD-6)
  - **intent:** The engine derives the finished game's word list, so no component computes or stores words.
  - **success:** `GameView` carries `wordList`, present when status is won or gaveUp, one entry per committed move: `{ spelling, letterCount, cards, cell }` with `cards` the `CardId`s in R-30 word order (a QU card is one entry of `cards`) and `cell` the WordCell (3–10) the move placed the word in. Order: `letterCount` descending, then `spelling` ascending; equal entries keep move order. A pending draft and the redo tail have no entry. A card reused as a free letter appears in every word that used it. The entry type is new: `CommittedWord` and AD-6's `longestWord` key set stay unchanged (no `HISTORY_VERSION` or `SESSION_VERSION` change). Unit tests named `R-86` cover order, ties, duplicates, QU letter count, empty, reuse across words, draft exclusion and Undo of the finish; The same ticket adds `WordListEntry` to the hard-coded exported-type list in `src/architecture-ad2-ad12-ad17.test.ts` and to the `expectTypeOf` pins in `src/engine/index.test.ts`, and keeps the AD-1 scan and the runtime-key pin green; the AD-3 field list is amended in the spine.

- **CAP-2** Celebration layer (R-87; AD-19)
  - **intent:** A module animates each word as a bouncing group of card-face copies, independent of game state.
  - **success:** A pure `step(state, dtMs)` in `src/ui/celebration/` (dt clamped to 50 ms) moves groups on an arcing, falling-and-rebounding path (floor bounce, constant horizontal drift, exit past a side wall); each group launches from its entry's `cell` (the WordCell label's position) in overlapping waves in list order, and the whole run, including the closing 1 × base fade-out, ends within the cap `6000 × prefs.motion.baseMs / BASE_MS.normal` from `motion.ts` (`BASE_MS` exported from `prefs.svelte.ts`); launch parameters derive from the entry index, the launch origin and the band size, with no `Math.random`. `Celebration.svelte` builds one row of face copies per entry (`data-celebration`, `aria-hidden`, no `data-card-id`, `data-testid` or `data-mirror-of`; 50 % card-width overlap, scaled to fit per DESIGN.md) clipped to the visible band (AD-12: below the top bar and a shown dictionary banner, above the action bar), and writes `transform` per frame; copies take their look from the live theme. UI Vitest `AD-19` drives `step` for floor contact, exit, determinism, dt clamp, the cap and an empty list; the overlay never touches live card elements or `GameView`.

- **CAP-3** Celebration wiring (R-87, R-70, R-73; AD-9, AD-13, AD-14, AD-19)
  - **intent:** A win plays the celebration at the right moment and every other path ends or cancels it cleanly.
  - **success:** `end-sheet.ts` `onDispatched` pushes the `celebration` overlay entry and starts the run in the existing `whenSettled` callback, after the winning-commit settle and the 300 ms guard; the end sheet's token-guarded open runs when the run ends. Ends (call `done`): finish, the cap, a press outside the bars and the dictionary banner that began after the start (consumed), `Space` or `Esc` (desktop), back (`closedByBack`; the app stays open), the ☰ button and `M` (sheet expanded, then `openSurface('menu')` after the push settles), the before-hide callback (the sheet opens on the next visible) and `resize`/`orientationchange`; the removal callback runs `done` in a microtask so the sheet's push is never swept up by `closedByBack` (AD-13). Cancels (no `done`): Undo, New game (Replay is reachable only through the menu or the end sheet, which already ended it). It does not start on relaunch (R-73), under reduced motion, for Give up or when the AD-17 seam is disabled; `?`, a WordCell tap or `Enter` and the other game keys do nothing while it runs; a Redo that restores the win starts it again. Playwright `android` tests named `R-87` cover each row of `rule-coverage.md`.

- **CAP-4** End-sheet word list (R-88, R-83; AD-3, AD-13)
  - **intent:** A player can read every word of the latest game, longest first, after a win or a give-up.
  - **success:** The expanded end sheet offers the list (placement per UX), rendered only from `view.wordList` and strings from `text.ts`; it shows for won and gaveUp, after a relaunch, and is gone after Undo of the finish, New game or Replay. The sheet's content area scrolls (its handle stays fixed), never a list inside it, without moving the bars (AD-11); rows are text only and at least 44 px high; the list is named `Words` by role and name. Playwright `R-88` tests cover both outcomes, order with a duplicate and a tie, relaunch and Undo; screenshot specs cover the sheet at 360 px in at least Charcoal and one light theme.

- **CAP-6** Test seam and hook-free suite (AD-17, AD-19; listed here for numbering; the seam is built with the win trigger (epic 10 entry 5) and the hook-free suite in entry 8)
  - **intent:** The celebration is testable deterministically and no existing spec stalls on it.
  - **success:** `src/shell/test-hook.ts`, `e2e/globals.d.ts`, `e2e/test-hook.spec.ts` and `e2e/pwa/test-hook.spec.ts` change together (the frozen object gains the key `celebration`, so the exact-key assertions list four keys); `main.ts` registers the UI side only in hook builds, in the step that registers `registerBeforeBack`; the celebration is off by default in hook builds, including `dist-test/`, so the existing win specs pass unchanged (a test records that default); a shared helper in `e2e/helpers/` enables it and advances to the end; an audit lists every `dist-smoke` spec (the only hook-free project) that wins a game and updates each to end the run by a press outside the bars; a hook-free test proves a real win plays, is skipped by a press and opens the expanded end sheet.

- **CAP-5** Close-out
  - **intent:** The planning documents match what was built.
  - **success:** EXPERIENCE.md (message catalogue, End sheet row, Motion) and DESIGN.md (word list, celebration) match the build; the spine (AD-3, AD-13, AD-17, AD-19, Capability → Architecture Map) matches the build; `AGENTS.md` pitfalls gain the celebration copies (`data-celebration`, neither live nor mirror) through `bmad-project-context`, not by hand; `rule-coverage.md` has no empty row; `npm run test:all` and `npm run test:screens` are green.

## Constraints

- Engine purity (rule 1): CAP-1 only; the celebration lives in `src/ui/`; no timers or randomness in the engine.
- Thin renderer (AD-3) and one writer (AD-4): the list and the celebration read `GameView`; nothing is dispatched or stored; no new Session or history field.
- One live element per card (AD-14): celebration copies are neither live elements nor board mirrors; they carry `data-celebration` only. The winning guard's window ends before the celebration starts.
- Animation never gates state: Undo, New game, Replay and relaunch act at once; the celebration only delays the end sheet's open.
- Overlay state only in `overlays.svelte.ts`: the run is its `celebration` entry (one history entry, so back skips it, AD-13/AD-19); run data is `celebration.svelte.ts`.
- Durations: JS timing from `src/ui/motion.ts` (baseMs speed preference applies) and `prefers-reduced-motion` skips it; all strings in `text.ts`; every App button through `act()`.
- No new runtime dependency; the size budget (AD-18, 600,000 bytes) holds; R-02 golden deal literals unchanged.
- Test split (AD-17): `R-86` untagged → engine Vitest; `R-87`, `R-88` (UI) → Playwright `android` first; UI Vitest tests are `AD-n`, never R-id coverage; screens only inside the container.
- Spine and UX documents are amended, never silently deviated from (rule 7); AD-19 and the AD-3/AD-9/AD-13/AD-14/AD-17 amendments are in the spine (2026-10-20).

## Non-goals

- Replaying the celebration, trails, colour cycling, sound (Q-20), sharing or exporting the list.
- Word lists for earlier games, per-word history in statistics, scoring or definitions of words.
- A celebration for a give-up, or any change to scoring, rules, the deal or the Session.
- Epic 7 items and anything epic 9 owns (themes themselves).

## Success signal

On `android`, in a seeded near-won position: confirm the last word, see the words bounce, tap to skip, land on the expanded end sheet and open the word list in order (longest first, a repeated word twice, ties alphabetical); Undo, win again and let it finish; Give up in another game and open its list with no animation; reload on a finished game and see the list without animation. `npm run test:all` and `npm run test:screens` are green with every row of `rule-coverage.md` covered.

## Assumptions

- DOM face copies with per-frame transforms are fast enough for the longest realistic word list (tens of words, a few hundred cards); Jared checks this on his Android at the first ticket that skips a real win (epic 10 entry 6), with a final read at close-out.
- Epic number 10: epic 7 is the deferred service-worker epic.

## Open Questions

None for the owner: the keys-while-it-runs default is confirmed (F15).  Jared answered the UX items on 2026-10-20 (F6…F11). Process only (done 2026-10-20): the spine amendments (AD-3 `wordList`, AD-19, Map row, AD-17 seam) go through `bmad-architecture`; the EXPERIENCE.md/DESIGN.md additions through `bmad-ux`. Wave size, stagger and exact physics constants are tuning values within the F6/F7 bounds, adjusted at the first device read (epic 10 entry 6).

## Decisions

Technical defaults under the standing rule; none changes functionality, UX or gameplay.

| # | Question | Decision |
| --- | --- | --- |
| F1 | Where do CardIds per word come from? | CAP-1's new entry type; `CommittedWord` has only spelling and letterCount and AD-6 fixes the history key set. |
| F2 | Canvas or DOM? | DOM face copies with per-frame `transform` (rule 3 style); no trail means no persistent surface, and themed CSS card art applies. Canvas rejected: it needs per-theme bitmaps. |
| F3 | Determinism | Launch parameters from the entry index, the launch origin and the band size (Opus review 2026-10-23: each group drifts to the side with more room and bounces before it leaves), `step` pure, test hook advances the clock. |
| F4 | Epic id and branch | 10; branch `end-of-game-words`, moved onto `main` (which now contains epic 9) on 2026-10-20. |
| F5 | Where does the celebration start? | In the existing `whenSettled` callback of `onDispatched`; the token-guarded open runs when it finishes or is skipped. |
| F6 | Launch cadence (owner, 2026-10-20). | Overlapping waves, in word-list order. |
| F7 | Duration cap (owner, 2026-10-20). | 6 s at normal speed, scaled by the speed preference. |
| F8 | Launch origin (owner, 2026-10-20). | The WordCell the word was placed in (`cell`), not where its cards ended up, since cards move between words. |
| F9 | Skip key (owner, 2026-10-20). | `Space` and `Esc` both skip on desktop; a press outside the bars skips on touch. |
| F10 | List placement and entry content (owner, 2026-10-20). | A section of the expanded end sheet; each entry shows the spelling and its letter count. |
| F11 | Skip press scope (owner, 2026-10-20). | A press outside the bars skips and is consumed; a bar button acts normally and stops the celebration. |
| F12 | Test seam default (review, 2026-10-20). | In hook builds the celebration is off until a test enables it, so existing win specs keep passing; hook-free builds always run it and their winning specs skip by press (CAP-6). Trade-off: the disabled path is test-only code in a seam, as AD-17 allows. |
| F13 | Back, menu, hide, Redo (owner, 2026-10-20). | Back skips it (the run owns one history entry, AD-13); ☰ or `M` ends it, then the sheet, then the menu; hiding or resizing ends it; a Redo that restores the win plays it again. Reverses the earlier "not an overlay" call. |
| F14 | Words row separators (Opus review, 2026-10-23; owner standing rule: accept the proposed default). | `--wc-hairline` lines as DESIGN.md Words section says, not `--wc-outline` as built in 10.2; the separators are fainter in every theme (`7352e29`, baselines `4e0d813`). |
| F15 | Keys while it runs (ticket 10.4 review, 2026-10-23; owner standing rule: accept the proposed default). | While the celebration runs only Undo, `N`, `M`, the ☰ button, `Space`/`Esc` (skip) and back act; `?`, a WordCell tap or `Enter` and every other game key do nothing (AD-13). |
| F16 | Background win and reduced-motion history (ticket 10.5 code review, 2026-10-23; owner standing rule: accept the proposed default). | A win whose board settles while the page is hidden opens the end sheet on return without the celebration; with reduced motion (or the seam off) no `celebration` history entry is pushed and back behaves as before the epic (AD-19 Start, EXPERIENCE.md "Never plays"; entry 9 syncs the docs). |
| F17 | Skip keys and focus (ticket 10.6 review, 2026-10-23; owner standing rule: accept the proposed default). | `Space` and `Esc` skip the celebration whatever holds focus, a bar or banner control included (R-87, EXPERIENCE.md Keyboard, F9); AD-19 Skip's "unless a bar or banner control holds focus" is a spine bug, dropped at entry 9's doc sync. During the run `Space` never activates a focused button; Z/N/M and clicks still act. |
| F18 | Guard after a press skip (ticket 10.6 code review, 2026-10-24; owner standing rule: accept the proposed default). | After a press skips the celebration, any new press is consumed for `SWALLOW_MS` (300 ms) from the skipping press's release, as the winning move's own guard; a double-tap to skip cannot hit Replay this deal or New game on the sheet that just opened. |
| F19 | Skip by press point and chorded Space (ticket 10.6 code review, 2026-10-24; owner standing rule: accept the proposed default). | Whether a press is on a bar is judged by the press point (`elementFromPoint`, as epic 4 SPEC F13; R-87 "outside the top and action bars"), not Chromium's retargeted touch target, so a near-miss beside a bar button skips; a chorded or repeat `Space` during the run never activates a focused control (F17). Entry 9 syncs AD-19 Skip. |

Next owner answer takes F20.
