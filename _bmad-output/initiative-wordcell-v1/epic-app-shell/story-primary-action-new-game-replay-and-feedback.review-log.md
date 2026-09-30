# Review log — story-primary-action-new-game-replay-and-feedback (ticket 3.4)
State: pass 3: done

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

## Pass 2 — 2026-09-30
Reviewers: fix diff, edge-case hunter, adversarial, ref alignment  |  Findings: major 2, minor 17, decision-needed 0  |  Dropped in triage: 2
Words (docs): 1081 (5.3 x pass 0)  |  Snapshot: story-primary-action-new-game-replay-and-feedback.passes/pass2.md  |  Fixer: all 13 applied; verified tsc -p tsconfig.node.json exit 0 with a dynamic-import probe (static import control: TS2304 'window', exit 2; probes deleted), port 4174 unused, build:test and session-idle-pending-draft.json exist; unverified: Node ≥ 22.18 claim (only v24.1.0 on host)
### Applied
- [major] E8 script — static import of e2e/helpers/seed.ts (and DOM code in page callbacks) fails `npm run check` (tsconfig.node.json lib ES2023, checkJs; probe: seed.ts(30,5) TS2304 'window'); 2 lenses → fixer 1
- [major] newGame()/replay() order — pass 1's write-then-assign contradicts AD-4 / build-notes CAP-4 / entry 4 ("createSession, enter active, then write") without an agreed deviation (rule 7) → fixer 2
- [minor] discarded take — clock carry keeps the sub-ms fraction; test uses integer advances (reclassed from major) → fixer 3
- [minor] summarise empty/even count/threshold unpinned (reclassed from major) → fixer 4
- [minor] E8 loops uncapped; Undo/Redo samples pooled or not → fixer 5
- [minor] main-module guard; `@playwright/test` dynamic import → fixer 6
- [minor] port placeholder (4173 taken by playwright.pwa.config.ts); stale dist-test; Node ≥ 22.18 → fixer 7
- [minor] rAF figure misses render → double rAF → fixer 8
- [minor] feedback AC: accrue-only setup → fixer 9
- [minor] one `primary-action` button; New game enabled; idle-pending-draft label; label test id prefix → fixer 10
- [minor] Confirm "before the next action" wording; R-74/R-73 test naming → fixer 11
- [minor] screenshot baselines are android and desktop → fixer 12
- [minor] CAP-5/CAP-6 sentences covered early by the shell Vitest → fixer 13
### Default applied (technical)
- E8 script — build-icons.mjs precedent: in-page code as strings, non-literal dynamic import of seed.ts, `await import('@playwright/test')`, direct-execution guard; `npm run check` stays green
- Order — follow AD-4 as written (take and discard, createSession, enter active clearing feedback, then write); a throwing write rethrows to AD-15 (entry 5 halts)
- summarise — throws on [] (rule 6), even-count median is the mean of the middle two, flag strictly > 16
- E8 — each loop capped at 200 steps, Undo and Redo counts equal, samples pooled per figure; port 4174; plan runs build:test right before and records the commit
- Label test prefix AD-3
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- Interim Composing ≥3 letters plain `Validate` breaks "a disabled Validate always says why" (adversarial, stretch) — accepted in pass 1 as transitional until entry 9; no change
- Duplicates merged (tsc check ×2, Node version ×3, feedback clear placement ×2, port ×2, stale dist-test ×2)

## Pass 3 — 2026-09-30
Reviewers: fix diff, edge-case hunter, adversarial, ref alignment  |  Findings: major 2, minor 14, decision-needed 0  |  Dropped in triage: 1
Words (docs): 1188 (5.82 x pass 0)  |  Snapshot: story-primary-action-new-game-replay-and-feedback.passes/pass3.md  |  Fixer: all 13 applied (10 reworded to `view.draft?.structural` is `{ ok: false, reason: 'too-short' }` since draft is optional); verified setDestinationCount-equal-to-k TABLE noop and session-composing k 1, giveUp legal on a fresh deal (R-75, commands.ts prelude idle), DESIGN.md sticky action bar and disabled inks
### Applied
- [major] AC feedback — the accrue-only example "redo with nothing to redo" is a TABLE throw (r71-no-redo-data, commands.test.ts:605-611), not a no-op; 3 lenses → fixer 1
- [major] AC R-74 game-over New game test — name must carry R-73 too (AGENTS.md: covered only by a test whose name carries the id); 2 lenses → fixer 2
- [minor] AC discarded take — name the command dispatched on the fresh Session (undo/redo throw there) (reclassed from major) → fixer 3
- [minor] AC throwing write — assert the rethrow and unchanged stored bytes; in-memory state is entry 5's → fixer 4
- [minor] E8 — flagged run exits 0; one click per step yields both figures → fixer 5
- [minor] R-74 test — primary-action reads `Validate` disabled after New game → fixer 6
- [minor] Interface — newGame(): void, replay(): void, feedback getter shape → fixer 7
- [minor] Look — disabled inks per DESIGN.md; action bar sticky per DESIGN.md → fixer 8
- [minor] New game handler — overlays.resetForNewSession() deferred to entry 8 (AD-4) → fixer 9
- [minor] structural field path is view.draft.structural → fixer 10
- [minor] vi.doMock in the file's reset-and-import pattern → fixer 11
- [minor] "written before newGame()/replay() returns" → fixer 12
- [minor] text.ts shape (pass 1 default not carried into the text) → fixer 13
### Default applied (technical)
- Accrue-only no-op — TABLE `noop` row valid on session-composing.json (`arrange` equal in value or `setDestinationCount` equal to k)
- Discarded-take command — a TABLE-legal command on any fresh deal (e.g. `giveUp`, R-75), verified against the TABLE
- feedback — getter `{ readonly rejectedWord?: string }`, field absent when cleared
- text.ts — one frozen `as const` object
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- Duplicates merged (TABLE example ×3, test naming ×2, throw state ×3, overlays ×2)
