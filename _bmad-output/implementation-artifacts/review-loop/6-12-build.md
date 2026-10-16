# Review loop: ticket 6.12 build (code mode)
State: pass 1: review
Target: commit range eb4d1ca..HEAD (4a93645), diff at 6-12-build.passes/pass0.diff; tree snapshot 0 bb98e6cdfe8aaec4302a0992ecdace0b4e36232c; HEAD 4a93645
Intent: _bmad-output/initiative-wordcell-v1/epic-game-surfaces-and-keyboard/story-winning-guard-the-end-sheet-half-plan.md

## Pass 1 — 2026-10-15
Reviewers: correctness, edge cases, verification gap, intent alignment  |  Findings: major 3, minor 3, decision-needed 0  |  Dropped in triage: 6
### Accepted majors
- src/ui/new-game.ts — resetForNewSession does not clear the guard hold/pending opens (ticket: (c) and "clears the hold and any pending open"); wire a `releaseHold()` call from the new-game path (technical, ticket-specified) → default applied
- src/ui/motion.test.ts 'Undo alias' loop and 'held Z' — never assert the open is cancelled / hold in effect
- e2e/win-guard.spec.ts — no case for New game/Replay consumed in the window (ticket Tests line 40)
### Accepted minors
- motion.test.ts: tests named `R-62 AD-14 …` / `R-70 AD-14 …` should start with `AD-14` (AGENTS.md convention)
- e2e Undo-after-floor test: assert an animation is running before the click
### Dropped
- backstop branch loses pending open (disproved: onEvent calls evaluate(t) first, which opens and uninstalls once the floor has passed)
- install/uninstall stale pending/hold state (uninstall clears hold, evaluate takes pending; previously rejected in plan triage)
- second Undo gesture/hold timeout; pending branch ignores consumedOpen (plan triage rejected: tracked events still consumed after uninstall)
- back wiring has only finishGuard unit coverage (known deferral, main.ts not importable; ticket asks a unit case, which exists) → minor, unapplied
- hide only at Slow on desktop → minor, unapplied
### Fix outcome (pass 1)
Fixer applied all 5 (new-game.ts calls releaseHold in newGame/replayDeal + unit case; alias/held-Z assertions; New game/Replay unreachable by UI beyond menu rows, so a unit case plus plan note instead of e2e; test renames; running>0 before Undo). npm test 2700 pass, check 0 errors, lint 1 warning (pre-existing motion.test.ts:691 void vs undefined, exit 0). Snapshot: tree e7ae97341055899d30581b7629b9d62b77f2c0dd
State: pass 1: done
