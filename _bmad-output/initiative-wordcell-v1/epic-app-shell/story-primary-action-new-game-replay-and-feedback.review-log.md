# Review log — story-primary-action-new-game-replay-and-feedback (ticket 3.4)
State: pass 1: done

Mode: docs, thorough, max 7, budget 1500 words. Pass 0: 204 words, snapshot `story-primary-action-new-game-replay-and-feedback.passes/pass0.md`, HEAD a003cc7.
Note: the pull from tickets.toml entry 4 dropped `interface`, `tests`, `owns`; they are passed to reviewers and fixer as intent, and the pass 1 fixer adds them to the Description as `Interface:`, `Tests:`, `Owns:` lines.

## Pass 1 — 2026-09-30
Reviewers: builder's reading, edge-case hunter, adversarial, ref alignment  |  Findings: major 10, minor 13, decision-needed 0  |  Dropped in triage: 3 (duplicates merged across lenses; see Dropped)
Words (docs): 810 (3.97 x pass 0)  |  Snapshot: story-primary-action-new-game-replay-and-feedback.passes/pass1.md  |  Fixer: all 18 applied; verified node v24.1.0 imports e2e/helpers/seed.ts (type stripping, experimental warning), build:test exists, vite 8.3.1 preview has --outDir/--port/--strictPort; unverified: CDP setCPUThrottlingRate, the fixed port value
### Applied
- [major] Description, primary action — interim Validate label before entry 9 unspecified (4 lenses) → fixer 1
- [major] Description/Tests, feedback.rejectedWord — cannot be set without a dictionary; set/keep/clear sentences untested → fixer 2
- [major] Description, newGame()/replay() — allowed store states unspecified; newGame() has no shell Vitest → fixer 3
- [major] Tests, discarded take — vacuous while nothing resumes the clock (entry 6) → fixer 4
- [major] Verify, R-74 fresh Session — only moves/activeMs asserted; gaveUp/cursor copy would pass → fixer 5
- [major] Verify — primary action changes the minimal board; placeholder screenshot baseline goes stale → fixer 6
- [major] E8 — timed interval undefined → fixer 7
- [major] E8 — Undo ×8 / Redo ×8 does not walk session-won's moves (undo steps phase by phase: 24 steps) → fixer 8
- [major] E8 script setup — build, preview lifecycle, device, seeding through seedStorage (AGENTS.md) unspecified → fixer 9
- [major] Pulled entry lost interface/tests/owns → fixer 10
- [minor] newGame()/replay() order — AD-4 "enter active, then write" vs entry 3 write-then-assign → fixer 11
- [minor] E8 summarise logic untested (scripts/*.mjs convention) → fixer 12
- [minor] Confirm extends the existing R-73 test (rule-coverage) → fixer 13
- [minor] Primary action wiring: Confirm iff canConfirm; New game calls game.newGame(), no confirm dialog; won shows New game too → fixer 14
- [minor] text.ts scope and shape → fixer 15
- [minor] Primary button look per DESIGN.md → fixer 16
- [minor] Fresh seed: no seed ≠ fixture assertion (probabilistic) → fixer 17
- [minor] Notes stale; References thin → fixer 18
### Default applied (technical)
- Interim Validate label — Idle plain `Validate`; Composing `Need 3+ letters` when view structural is too-short, else plain `Validate`; always disabled until entry 9
- Dictionary seam — `words` binding in src/shell/dictionary.svelte.ts (undefined until entry 9), vi.mock'ed in the shell Vitest
- newGame() from active or rejected, replay() only from active; other states throw
- Write, then assign (entry 3's invariant; same task, AD-4 "at once" holds)
- E8 measure — synchronous click in page.evaluate (flagged figure) plus click-to-next-frame (recorded)
- E8 script — expects prior build:test, spawns and kills vite preview, Pixel 7, seeds via e2e/helpers/seed.ts under Node 24 type stripping
- summarise() tested in scripts/measure-dispatch.test.mjs
- text.ts: frozen label object, primary labels and Undo/Redo names
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- Event Timing PerformanceObserver measure (edge) — superseded by the simpler in-page synchronous measure (fixer 7)
- Idle label `Loading words…` before entry 9 (edge) — would never clear on this build; interim plain label taken
- Duplicate findings across lenses merged
