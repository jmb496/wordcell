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

- Adds the minimal board's primary-action (Validate disabled with its DESIGN.md label until entry 9, Confirm in Place, New game when status ≠ playing), the store's newGame() and replay() per AD-4 (clock.take discarded, createSession, active, written at once, history untouched), feedback.rejectedWord, src/ui/text.ts for the strings it shows, and the standalone dispatch-cost script under scripts/ on Playwright's library API (E8) with max and median recorded in the plan and a dispatch over 16 ms recorded as a flag for the epic 7 device check, not optimised.
- Interface: game.svelte.ts gains newGame(), replay(), feedback; src/shell/dictionary.svelte.ts exports a `words` binding; new src/ui/text.ts; new scripts/measure-dispatch.mjs (not in test:all) exporting `summarise`.
- Tests: R-73 Confirm and New game saved; R-74 New game fresh seed; AD-4 shell Vitest for replay() (same seed, activeMs 0, discarded take), feedback cleared on changed dispatch, New game and Replay; newGame() from active and rejected; each throwing state.
- Owns: src/ui/text.ts (every later entry adds its catalogue strings there) and the primary-action control.
- Primary action until entry 9: Validate always disabled; Idle reads plain `Validate`; Composing reads `Need 3+ letters` when `view`'s structural check is `too-short`, otherwise `Validate`. Entry 9 adds the loading/failed labels and enablement.
- Confirm in Place: enabled iff `view.canConfirm`, dispatches `confirm`. New game (status won or gaveUp): calls `game.newGame()`, not dispatch, at once with no confirm dialog (the R-74 in-progress confirm is epic 6's).
- Look: the DESIGN.md primary button in the action bar (Buttons, Action bar; disabled style included); no further layout.
- text.ts exports the player-visible labels this ticket shows: the primary-action labels and the Undo/Redo accessible names moved from App.svelte.
- feedback.rejectedWord: dispatch passes `dictionary: words` (undefined until entry 9, which loads it); the store sets it from `result.rejectedWord` and clears it per AD-4.
- newGame() runs from `active` or `rejected`; replay() only from `active` (`createSession(state.session.seed)`); both throw otherwise, like dispatch (entry 5 adds `halted`). Order: take and discard, createSession, write, then assign `active` in the same task, so a throwing write leaves memory equal to storage.
- E8 script: `node scripts/measure-dispatch.mjs` expects an existing dist-test (fails with a message to run `npm run build:test` if missing); spawns `vite preview --outDir dist-test --port <fixed> --strictPort` and kills it on exit; uses `devices['Pixel 7']` (the `android` project); seeds session-won.json through `seedStorage`/`fixture` from e2e/helpers/seed.ts (Node type stripping, verified on Node 24.1.0); CDP Emulation.setCPUThrottlingRate rate 4. Undo until `undo` is disabled, then Redo until `redo` is disabled, recording the sample count. Per step, `page.evaluate` times `t0 = performance.now(); button.click(); t1 = performance.now()` (the synchronous handler: dispatch with replay and the storage write; the 16 ms flag applies to this) and also click to next `requestAnimationFrame`; the plan states both definitions beside max and median. A pure `summarise(ms[])` → `{ count, max, median, flagged: max > 16 }` is tested in scripts/measure-dispatch.test.mjs (runs in `npm run test`); only the browser run stays out of test:all.

## Acceptance Criteria

- Verify: npm run test:all is green; the plan records max and median dispatch time.
- Playwright android: Confirm on session-place.json is stored before the next action, by extending and renaming the existing R-73 Undo/Redo test in e2e/game-store.spec.ts (rule-coverage R-73 row).
- Playwright android, own R-73/R-74 test: game-over New game on session-gave-up.json stores at once a Session equal to the full R-74 fresh shape (current version, uint32 seed, moves [], cursor {index 0, phase idle}, gaveUp false, activeMs 0) and equal to current().session; the seed is not compared with the fixture's.
- Playwright android, primary-action label per phase: session-idle-fresh `Validate` disabled; session-composing-draft-2-letters `Need 3+ letters` disabled; session-composing `Validate` disabled; session-place Confirm enabled; session-gave-up and session-won New game.
- Shell Vitest AD-4, feedback: vi.mock of src/shell/dictionary.svelte.ts with a small inline Set so a Validate on session-composing.json is rejected; rejectedWord set on the failed Validate (changed false), kept on a no-op and on an accrue-only dispatch, cleared on a changed dispatch, on newGame() and on replay().
- Shell Vitest AD-4, newGame()/replay(): newGame from active and from rejected writes a fresh Session and replaces the stored bytes; replay() stores the same fresh shape with the old seed; each disallowed state throws; a throwing write rethrows and leaves state unchanged.
- Shell Vitest AD-4, discarded take: resume the clock and advance a stubbed performance.now before newGame()/replay(), dispatch once, assert activeMs holds only the time after the call.
- The placeholder-board baseline of e2e/placeholder.screens.spec.ts is regenerated in the container and `npm run test:screens` is green.

## References

- parent — _bmad-output/initiative-wordcell-v1/epic-app-shell/epic-app-shell.md
- _bmad-output/specs/spec-epic-3-app-shell/SPEC.md — E1, E8
- _bmad-output/specs/spec-epic-3-app-shell/build-notes.md — CAP-3, CAP-4
- ARCHITECTURE-SPINE.md — AD-4
- EXPERIENCE.md — Component Patterns (Validate, Confirm), Phase matrix
- DESIGN.md — Buttons, Action bar
- _bmad-output/specs/spec-epic-3-app-shell/rule-coverage.md — R-73, R-74 rows

## Notes

- Open question: None.
