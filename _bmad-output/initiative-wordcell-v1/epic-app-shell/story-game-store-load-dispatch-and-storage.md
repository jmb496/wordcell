---
id: 3
type: story
title: "Game store load, dispatch and storage"
parent: epic-app-shell
covers: [CAP-3]
after: [1]
risk: medium
---

# Game store load, dispatch and storage

## Description

Builds storage.ts (stateless read/write/remove, the only localStorage user, calling localStorage at call time), seed.ts, the passive clock.ts, and the game store's AD-4 load (absent key → createSession(newSeed()) written at once; parse not ok → rejected, nothing written) and dispatch in AD-4 order with writes on every new reference and DispatchResult, the test hook's loaded() (throws while booting) and current() for the Session only, the minimal board (E1: columns, WordCells, Undo and Redo with test ids, Seed line), and moves the smoke, dist-smoke and screenshot specs onto fixtures/session-idle-fresh.json with the baseline regenerated in the container.

Load: removes the E7 module-load createSession(1) (the store starts booting, no top-level storage reads); main.ts calls game.load() synchronously before mount; load() throws unless booting; parse ok → active with the parsed Session, nothing written. The store keeps its launch parse result (stored shape, null when absent, { rejected: reason }) for loaded(); test-hook.ts reads loaded() and current() from the store only (storage.ts is called only by shell stores).

States: the GameState union carries all four AD-4 kinds (halted unreachable until entry 5); until entry 5 the page shows only the WordCell heading while booting or rejected; no entry-3 Playwright spec seeds an invalid fixture (rejected is shell Vitest only).

Dispatch: write first, then assign the new state, so a throwing write leaves memory equal to storage and the error propagates (AGENTS.md rule 6). DispatchResult is the full AD-4 type now: changed (result.session !== accrued), rejectedWord passed through from apply's ApplyResult, finished/unfinished from view(accrued).status vs view(result.session).status (playing → won/gaveUp; not playing → playing), each with an AD-4 shell Vitest case (e.g. Redo onto the win from fixtures/session-won.json, Undo off it). Entry 7 later inserts reconcile between apply and the writes without changing these fields.

Clock: nothing in entry 3 calls clock.resume (AD-16's resume-iff-visible lands with entry 6's lifecycle listeners), so in the app take() returns 0 and accrue returns the same reference; the shell Vitest cases for changed-vs-accrued and the accrue-only write resume the clock themselves under a stubbed performance.now. Each store test runs vi.resetModules(), stubs globals, then dynamically imports game.svelte.ts.

Board (E1): DESIGN.md colour and type tokens and the button component for Undo/Redo, enabled by canUndo/canRedo; WordCells 3–10 as simple labelled stacks, no AD-11 band geometry; primary-action is entry 4, not here. The Seed line replaces the meta line.

Spec moves: besides smoke, dist-smoke and screenshot, e2e/pwa/font.spec.ts (its non-card text locator, now `/placeholder board/`, targets the Seed line or the heading) and e2e/test-hook.spec.ts and e2e/pwa/test-hook.spec.ts (now assert exactly the keys loaded and current; the hook stays frozen). e2e/globals.d.ts uses `import type { Session } from '../src/engine/index'`; change both hook type declarations together.

Interface: New src/shell/storage.ts (read, write, remove, key constants), seed.ts (newSeed), clock.ts (resume, pause, take, peek); game.svelte.ts gains load(), dispatch(command): DispatchResult and the rejected state (entry 5 adds halt and haltCause); test-hook.ts and e2e/globals.d.ts gain loaded() and current() (session only).
Tests: R-73 Undo/Redo saved; R-73 kill variant; R-74 first-launch deal and uint32 seed; R-73 no off-origin or non-GET request; AD-4 and AD-9 shell Vitest (states, dispatch order, changed vs accrued, clock fractional carry across takes, peek does not consume, resume while running and pause while paused are no-ops).
Owns: storage.ts, seed.ts, clock.ts, the store API every later entry extends, the test-hook accessors, and the seeded smoke/screenshot baseline.

## Acceptance Criteria

Verify: npm run test:all and npm run test:screens are green, and Playwright on android shows a fresh context storing a uint32-seeded Session before any input, Undo and Redo on session-place.json each stored before the next action, and on session-place-free-letter-redo-tail.json an Undo, then CDP Page.crash, then an unseeded new page in the same context whose loaded().session deep-equals JSON.parse of the wordcell:session text read after the Undo. Per rule-coverage: the stored Session (JSON.parse of wordcell:session) deep-equals current().session after the fresh-launch load and after each Undo and Redo before the next action; two fresh contexts get different seeds; a dispatch-and-reload session makes no off-origin and no non-GET request; the AD-4 shell Vitest cases include dispatch throwing outside active and a rejected load writing nothing.

## References

- parent — _bmad-output/initiative-wordcell-v1/epic-app-shell/epic-app-shell.md
- spec — _bmad-output/specs/spec-epic-3-app-shell/build-notes.md, As-built facts, CAP-3
- spec — _bmad-output/specs/spec-epic-3-app-shell/SPEC.md, CAP-3 and Decisions E1
- coverage — _bmad-output/specs/spec-epic-3-app-shell/rule-coverage.md, §5 R-73/R-74 rows and the AD-4/AD-9/AD-17 rows carrying 3

## Notes

- Open question: Whether rune modules test in node Vitest (the first shell test is the reactivity probe; fallback a client-transform Vitest project, SPEC Assumptions).
- The epic Notes CAP-3 split line gives the kill variant to entry 4, but tickets.toml entry 3 owns it; this ticket keeps it (epic note stale, for the epic owner).
- Any later entry changing the minimal board regenerates the screenshot baseline in the container in its own Verify (keep file names).
