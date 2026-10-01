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

Builds storage.ts (stateless read/write/remove, the only localStorage user, calling localStorage at call time), seed.ts, the passive clock.ts, and the game store's AD-4 load (absent key → createSession(newSeed()) written at once; parse not ok → rejected, nothing written) and dispatch in AD-4 order with writes on every new reference and DispatchResult, the test hook's loaded() (throws while booting) and current() (the AD-17 union; its active variant carries only session until entries 7 and 10 add history and prefs), the minimal board (E1: columns, WordCells, Undo and Redo with test ids, Seed line), and moves the smoke, dist-smoke and screenshot specs onto fixtures/session-idle-fresh.json with the baseline regenerated in the container.

Load: removes the E7 module-load createSession(1) (the store starts booting, no top-level storage reads); main.ts calls game.load() synchronously before mount; load() throws once it has run (state active or rejected); entry 5 adds the halted-before-load path (load parses, records loaded(), writes nothing, stays halted). First launch writes, then enters active, so a throwing first-launch write leaves the store booting and propagates. Parse ok → active with the parsed Session, nothing written. Parse not ok → rejected with `reason` = the parse failure minus `ok` (`{ reason, version? }`, keeping `version` for version-unknown and replay-failed), carried by the store state, current() and loaded().session's `{ rejected: … }`, the variant read as `reason.reason`. The store keeps its launch parse result (stored shape, null when absent, { rejected: … }) for loaded(); test-hook.ts reads loaded() and current() from the store only (storage.ts is called only by shell stores).

States: the GameState union carries all four AD-4 kinds (halted unreachable until entry 5); until entry 5 the page shows only the WordCell heading while rejected; no entry-3 spec asserts the rejected state (e2e/helpers.spec.ts's raw seeds reach it harmlessly; rejected is shell Vitest only).

Dispatch: every wordcell:session write is storage.write(SESSION_KEY, serializeSession(session)) and reads go through parseSession (AD-7). Write first, then assign the new state, so a throwing write leaves memory equal to storage and the error propagates (AGENTS.md rule 6). DispatchResult is the full AD-4 type now: changed (result.session !== accrued), rejectedWord passed through from apply's ApplyResult now, finished/unfinished from view(accrued).status vs view(result.session).status (playing → won/gaveUp; not playing → playing), computed once per changing dispatch (entry 7's reconcile reuses that comparison). The store passes `dictionary: undefined` until entry 9 (validate without one throws `command-dictionary`), so rejectedWord's test lands with entry 9's Validate; changed, finished and unfinished each get an AD-4 shell Vitest case now (e.g. Undo off the win from fixtures/session-won.json (unfinished), then Redo onto it (finished 'won'); Undo on fixtures/session-gave-up.json (unfinished)). Entry 7 later inserts reconcile between apply and the writes without changing these fields.

Clock: the clock starts paused; nothing in entry 3 calls clock.resume (AD-16's resume-iff-visible lands with entry 6's lifecycle listeners), so in the app take() returns 0 and accrue returns the same reference; the shell Vitest cases for changed-vs-accrued and the accrue-only write (setDestinationCount with k = 1 on fixtures/session-composing.json, the TABLE's R-71 no-op) resume the clock themselves under a stubbed performance.now. Each store test runs vi.resetModules(), stubs globals, then dynamically imports game.svelte.ts and clock.ts.

Board (E1): DESIGN.md colour and type tokens; Undo and Redo as text-labelled secondary buttons named Undo and Redo (not DESIGN.md's 44×44 icon-only buttons; the board is disposable), the native `disabled` attribute following canUndo/canRedo; WordCells 3–10 as wordcell-<n> stacks, bottom→top, of live cards (AD-14, data-place "cell"), each labelled by its cell number, no AD-11 band geometry; primary-action is entry 4, not here. The Seed line replaces the meta line.

Spec moves: besides smoke, dist-smoke and screenshot, e2e/pwa/font.spec.ts (its non-card text locator, now `/placeholder board/`, targets the Seed line) and e2e/test-hook.spec.ts and e2e/pwa/test-hook.spec.ts (now assert exactly the keys loaded and current; the hook stays frozen). e2e/globals.d.ts uses `import type { ParseSessionResult, Session } from '../src/engine/index'`; change both hook type declarations together.

Interface: New src/shell/storage.ts (read, write, remove, key constants), seed.ts (newSeed), clock.ts (resume, pause, take, peek); game.svelte.ts gains load(), dispatch(command): DispatchResult and the rejected state (entry 5 adds halt and haltCause); test-hook.ts and e2e/globals.d.ts gain loaded() and current() (the AD-17 union); loaded() and current()'s active variant carry only session until entries 7 and 10 add history and prefs (never reported as null before).
Tests: R-73 Undo/Redo saved; R-73 kill variant; R-74 first-launch deal and uint32 seed; AD-7 storage.ts Vitest against a stubbed localStorage (read null when absent, write throws through, localStorage looked up at call time); R-73 no off-origin or non-GET request (seed session-place.json, Undo, reload, page.on('request') on android, dev server); AD-4 and AD-9 shell Vitest (states, dispatch order, changed vs accrued, a throwing session write rethrows and leaves game.state unchanged, loaded() and current() after a rejected load (version-unknown with its version, version-unreadable without), loaded() unchanged after a changing dispatch, a throwing first-launch write (key absent, setItem stub throws) → load() rethrows, state stays booting and loaded() still throws, a second load() throws, a parse-ok load writes nothing, importing the store with a throwing localStorage stub succeeds (no top-level read), crypto.getRandomValues stubbed to 0 and to 4294967295 with the written Session parsing back ok; clock cases: take() before any resume returns 0; from resume(0): fractional carry across takes, peek does not consume, resume while running and pause while paused are no-ops).
Owns: storage.ts, seed.ts, clock.ts, the store API every later entry extends, the test-hook accessors, and the seeded smoke/screenshot baseline.

## Acceptance Criteria

Verify: npm run test:all and npm run test:screens are green, and Playwright on android shows a fresh context storing a uint32-seeded Session before any input, Undo and Redo on session-place.json each stored before the next action, with current().session after each click differing from its value before it, and on session-place-free-letter-redo-tail.json an Undo whose stored Session (JSON.parse, read before the crash) deep-equals current().session and differs from the seeded fixture, then CDP Page.crash, then an unseeded new page in the same context whose loaded().session and current().session deep-equal that pre-crash Session. Per rule-coverage: the stored Session (JSON.parse of wordcell:session) deep-equals current().session after the fresh-launch load (where loaded().session === null) and after each Undo and Redo before the next action; two fresh contexts get different seeds; a dispatch-and-reload session makes no off-origin and no non-GET request; the AD-4 shell Vitest cases include dispatch throwing outside active and a rejected load writing nothing.

## References

- parent — _bmad-output/initiative-wordcell-v1/epic-app-shell/epic-app-shell.md
- spec — _bmad-output/specs/spec-epic-3-app-shell/build-notes.md, As-built facts, CAP-3
- spec — _bmad-output/specs/spec-epic-3-app-shell/SPEC.md, CAP-3 and Decisions E1
- coverage — _bmad-output/specs/spec-epic-3-app-shell/rule-coverage.md, §5 R-73/R-74 rows and the AD-4/AD-9/AD-17 rows carrying 3, only the parts named in Tests (Confirm, New game and feedback are entry 4, halt entry 5, the restore suite entry 11)

## Notes

- Open question: Whether rune modules test in node Vitest (the first shell test is the reactivity probe; fallback a client-transform Vitest project, SPEC Assumptions).
- The epic Notes CAP-3 split line gives the kill variant to entry 4, but tickets.toml entry 3 owns it; this ticket keeps it (epic note stale, for the epic owner).
- Any later entry changing the minimal board regenerates the screenshot baseline in the container in its own Verify (keep file names).
- As built (recorded at the epic 3 retrospective, 2026-10-01): Undo and Redo were built as DESIGN.md's 44×44 icon-only buttons with accessible names `Undo` and `Redo` per SPEC E1 ("in the DESIGN.md components and tokens"), not as the text-labelled secondary buttons the Description names (plan Residual risks).
