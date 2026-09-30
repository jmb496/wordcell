# Review loop — ticket 3.2 build (code, 124ae04..64e96ca)
State: pass 1: done

Target: code diff 124ae04..64e96ca (excluding `_bmad-output/`), staged at `3-2-build.passes/pass0.diff`.
Intent: `_bmad-output/initiative-wordcell-v1/epic-app-shell/story-parse-hardening-and-engine-cleanup-plan.md` (ticket `story-parse-hardening-and-engine-cleanup.md`).
Pre-loop: HEAD 64e96ca2cb269e694d604fe1f0f3536262c6b933, tree snapshot 0 6614ace4b55ab03d470a2d9877111362c0ba8cfb.
Depth: thorough, max 7.

## Pass 1 — 2026-09-30
Reviewers: correctness, edge cases, verification gap, intent alignment  |  Findings: major 0, minor 4, decision-needed 0  |  Dropped in triage: 0
Snapshot: tree 6614ace4b55ab03d470a2d9877111362c0ba8cfb (no fix pass)
### Applied
- none (converged; no fix pass)
### Default applied (technical)
- none
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- none

## Result — converged after 1 pass

Final state (HEAD 64e96ca, unchanged): `npm test` pass (1429 tests, 22 files, 3.21 s), `npm run lint` pass, `npm run check` pass (0 errors, 0 warnings).

Unapplied minors (for the next build or loop):
1. `src/engine/serialize.test.ts` '§2 checkRecord rejects %s with its code' (row "longestWord 'tan' 4", ~line 1380) — `history.longest-word-letter-count-mismatch` is only tested with letterCount > spelling length; a one-sided `>` check would pass. Proposed: add a reject row `{ spelling: 'tans', letterCount: 3 }`.
2. `src/engine/serialize.test.ts:1137` '§2 a replay code wins over the headroom …' — the name claims an ordering (headroom after replay in `parseSession`, `serialize.ts:222-224`) that the assertions cannot observe, since both stages map to `replay-failed`. Proposed: rename to what it checks; the post-replay order is proven by the 'parse' harness branch.
3. `src/engine/view.ts:155` (`viewFrom` doc comment) — "(AD-3)" is cited for "every flag from the predicates `apply` shares", which AD-3 does not state. Proposed: drop the parenthetical or cite AD-2.
4. `src/engine/serialize.ts` `checkRecord` — records no game can produce still parse (longestWord > 23 letters per R-37, a `q` spelling without `u`, a won record without longestWord). Built checks match SPEC E5 exactly; proposed: no change in 3.2, add a SPEC row later if wider hardening is wanted.
