---
id: 4
type: story
title: "Primary action, New game, Replay and feedback"
parent: epic-app-shell
covers: [CAP-3]
after: [3]
risk: low
---

# Primary action, New game, Replay and feedback

## Description

- Adds the minimal board's primary-action (Validate disabled with its DESIGN.md label until entry 9, Confirm in Place, New game when status ≠ playing), the store's newGame() and replay() per AD-4 (clock.take discarded, createSession, active, written at once, history untouched), feedback.rejectedWord, src/ui/text.ts for the strings it shows, and the standalone dispatch-cost script under scripts/ on Playwright's library API (E8) with max and median recorded in the plan and a dispatch over 16 ms recorded as a flag for the epic 7 device check, not optimised; the flag is the synchronous figure's `flagged`, the double-rAF figure reports max and median only.
- Interface: game.svelte.ts gains `newGame(): void`, `replay(): void` and a `$state` `feedback` getter (AD-4) returning `{ readonly rejectedWord?: string }` (field absent when cleared); src/shell/dictionary.svelte.ts exports a `words` binding; new src/ui/text.ts; new scripts/measure-dispatch.mjs (not in test:all) exporting `summarise`.
- Tests: R-73 Confirm and New game saved; R-74 New game fresh seed; AD-4 shell Vitest for replay() (same seed, activeMs 0, discarded take), feedback cleared on changed dispatch, New game and Replay; newGame() from active and rejected (fresh seed via setup()'s `seed` stub); each throwing state.
- Owns: src/ui/text.ts (every later entry adds its catalogue strings there) and the primary-action control.
- Primary action: one `<button data-testid="primary-action">` whose label and handler change by phase and status. Until entry 9: Validate always disabled; Idle reads plain `Validate`; Composing reads `Need 3+ letters` when `view.draft?.structural` is `{ ok: false, reason: 'too-short' }`, otherwise `Validate`. Entry 9 adds the loading/failed labels and enablement.
- Confirm in Place: enabled iff `view.canConfirm`, dispatches `confirm`. New game (status won or gaveUp): calls `game.newGame()`, not dispatch, at once with no confirm dialog (the R-74 in-progress confirm is epic 6's; entry 8 adds `overlays.resetForNewSession()`, AD-4). The minimal board adds no guard against a Confirm then New game double tap (EXPERIENCE.md as written; the board UI epic owns it).
- Look: the DESIGN.md primary button (Buttons): disabled `Need 3+ letters` in ink-secondary, plain `Validate` in ink-disabled; it sits on the minimal board with no action-bar layout (epic 4, SPEC Non-goals).
- text.ts exports, as one frozen `as const` object, the player-visible labels this ticket shows: the primary-action labels and the Undo/Redo accessible names moved from App.svelte.
- feedback.rejectedWord: dispatch passes `dictionary: words` (undefined until entry 9, which loads it); the store sets it from `result.rejectedWord` and clears it per AD-4.
- newGame() runs from `active` or `rejected`; replay() only from `active` (`createSession(state.session.seed)`); both throw otherwise, like dispatch (entry 5 adds `halted`). Order per AD-4, in one task: take and discard, createSession, enter `active` (clearing feedback.rejectedWord), then write; a throwing write rethrows to the AD-15 surface (entry 5 halts).
- E8 script: `node scripts/measure-dispatch.mjs` expects an existing dist-test (fails with a message to run `npm run build:test` if missing); spawns `vite preview --outDir dist-test --port 4174 --strictPort` (4173 is playwright.pwa.config.ts's) and kills it on exit; the plan runs `npm run build:test` right before the measured run and records the commit; uses `devices['Pixel 7']` (the `android` project); seeds session-won.json through `seedStorage`/`fixture` from e2e/helpers/seed.ts, loaded with a non-literal dynamic import (`new URL('../e2e/helpers/seed.ts', import.meta.url).href`), and takes `const { chromium, devices } = await import('@playwright/test')`, following scripts/build-icons.mjs, so `npm run check` (tsconfig.node.json: lib ES2023, checkJs) stays green with the script present; needs Node ≥ 22.18 (unflagged type stripping; host-only, not in CI); CDP Emulation.setCPUThrottlingRate rate 4. Undo until `undo` is disabled, then Redo until `redo` is disabled, each loop capped at 200 steps (fails with a message at the cap); the Undo and Redo counts must be equal; samples are pooled per figure. Per step, `page.evaluate` with in-page code passed as a string times `t0 = performance.now(); button.click(); t1 = performance.now()` (the synchronous handler: dispatch with replay and the storage write; the 16 ms flag applies to this) and also click to double `requestAnimationFrame` (a single rAF runs before that frame's render); one click per step yields both figures (t1 synchronously after click(), t2 after the double rAF); the plan states both definitions beside max and median; a flagged run prints the figures and the flag and exits 0 (only setup or walk failures exit non-zero). A pure `summarise(ms[])` → `{ count, max, median, flagged: max > 16 }` (throws on `[]`, rule 6; even-count median is the mean of the two middle values; flagged strictly max > 16) is tested on [], one sample, an even count, 16 (not flagged) and 16.01 (flagged) in scripts/measure-dispatch.test.mjs (runs in `npm run test`); the browser run sits behind size-budget.mjs's direct-execution guard (`realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)`), so the test's import only exposes `summarise`; only the browser run stays out of test:all.

## Acceptance Criteria

- Verify: npm run test:all is green; the plan records max and median dispatch time.
- Playwright android: on session-place.json, after each of Undo, Redo and Confirm the stored Session equals current().session before the next step, by extending and renaming the existing R-73 Undo/Redo test in e2e/game-store.spec.ts (rule-coverage R-73 row).
- Playwright android, own test named `R-74 R-73 …`: game-over New game on session-gave-up.json stores at once a Session equal to the full R-74 fresh shape (current version, uint32 seed, moves [], cursor {index 0, phase idle}, gaveUp false, activeMs 0) and equal to current().session, and primary-action then reads `Validate`, disabled; the seed is not compared with the fixture's.
- Playwright android, primary-action label per phase (test name starts with AD-3): session-idle-fresh `Validate` disabled; session-idle-pending-draft `Validate` disabled; session-composing-draft-2-letters `Need 3+ letters` disabled, then after Undo (Idle with a 2-letter pending draft) `Validate` disabled; session-composing `Validate` disabled; session-place Confirm enabled; session-gave-up and session-won `New game` enabled.
- Shell Vitest AD-4, feedback: `vi.doMock` of src/shell/dictionary.svelte.ts inside the feedback tests before the dynamic import (game.svelte.test.ts's reset-and-import pattern), with a small inline Set so a Validate on session-composing.json is rejected; rejectedWord set on the failed Validate (changed false), kept on a no-op and on an accrue-only dispatch (resume the clock, advance the stubbed performance.now by an integer, then a no-op command from the AD-2 TABLE, `setDestinationCount` with k 1, equal to its k; assert a write happened and changed is false), cleared on a changed dispatch, on newGame() and on replay(); `vi.doUnmock` after the feedback tests so later tests see `words` undefined.
- Shell Vitest AD-4, newGame()/replay(): newGame from active and from rejected, with setup()'s `seed` option stubbing crypto.getRandomValues to a value ≠ 1, writes a fresh Session whose stored seed equals that value and replaces the stored bytes; from rejected, loaded() still equals the launch result `{ session: { rejected: reason } }` (AD-17); replay() stores the same fresh shape with the old seed; neither touches any key other than wordcell:session; the fresh Session is stored before newGame()/replay() returns; newGame() while booting, replay() while booting and while rejected, each throws; a throwing write rethrows and leaves the stored bytes unchanged (the in-memory state after it is entry 5's halt).
- Shell Vitest AD-4, discarded take: resume the clock, advance a stubbed performance.now by an integer before newGame()/replay() and by an integer after it (clock.take keeps the sub-ms `carry`, which AD-4's discard leaves), dispatch `giveUp` once (legal on any fresh deal, R-75), assert activeMs equals the advance after the call; also for newGame() from rejected.
- The placeholder-board baselines (android and desktop) of e2e/placeholder.screens.spec.ts are regenerated in the container and `npm run test:screens` is green.

## References

- parent — _bmad-output/initiative-wordcell-v1/epic-app-shell/epic-app-shell.md
- _bmad-output/specs/spec-epic-3-app-shell/SPEC.md — Non-goals, E1, E8
- _bmad-output/specs/spec-epic-3-app-shell/build-notes.md — CAP-3, CAP-4
- ARCHITECTURE-SPINE.md — AD-4
- EXPERIENCE.md — Component Patterns (Validate, Confirm), Phase matrix
- DESIGN.md — Buttons
- _bmad-output/specs/spec-epic-3-app-shell/rule-coverage.md — R-73, R-74 rows

## Notes

- Open question: None.
- The shell Vitest here also covers SPEC CAP-5's Replay `activeMs = 0` / discarded-take and CAP-6's Replay-untouched-history sentences early (per SPEC).
