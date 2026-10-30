# Review loop — ticket 7.1 build (code, 96cca7c..HEAD)
State: pass 1: done

Target: commit range `96cca7c..HEAD` (staged as `7-1-build.passes/pass0.diff`); intent `_bmad-output/initiative-wordcell-v1/epic-pwa-release/story-worker-registration-state-module-and-swstate-plan.md`. Depth thorough, max 7.
Pre-loop: HEAD 4938cf9880de58da1082091ef2a0bec1fad7c456, tree snapshot 0 be8aebf146803fea2cdfa4b73274264985f0d400.
Refs: docs/game-flow-spec.md, docs/requirements-carryover.md, CLAUDE.md, AGENTS.md, ARCHITECTURE-SPINE.md, _bmad-output/specs/spec-epic-7-pwa-release/SPEC.md, epic-pwa-release.md, story-worker-registration-state-module-and-swstate.md, story-worker-registration-state-module-and-swstate-plan.md.

## Pass 1 — 2026-10-30
Reviewers: correctness, edge cases, verification gap, intent alignment  |  Findings: major 0, minor 4, decision-needed 0  |  Dropped in triage: 0
Snapshot: tree be8aebf146803fea2cdfa4b73274264985f0d400 (no fix pass; unchanged since HEAD 4938cf9). Orchestrator at the final state: `npm test` 3650 passed, `npm run lint` pass (346 files), `npm run check` 0 errors.
### Applied
- none (converged: zero majors)
### Default applied (technical)
- none applied (minors at convergence are not applied; the proposed technical defaults are listed under Unapplied minors)
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- none

## Result — converged after 1 pass

### Unapplied minors
1. `src/main.ts:273` F17 catch — the hook-build report is gated `&& !halted()`; SPEC F17 says "reported in hook builds as CAP-1's failures are" and AD-15 says a later fatal replaces an earlier one's surface text, and the ticket itself names no guard (it came from an optional ticket-review minor, "or accept as hook-build residual risk"). Hook builds only; no production effect. Proposed default: drop `&& !halted()` and the plan's mentions of the guard, so F17 and entry 2's sw.ts reports follow one rule; if kept, record it as a plan deviation and give entry 2's reports the same guard.
2. Plan Deferred coverage (F17 catch → entry 7) — entry 7's chunk-404 cases never halt the page, so no planned test runs the `!halted()` branch. Moot if minor 1 drops the guard; otherwise add a `deferred` row asking entry 7 for a held-chunk + Q-38 halt + 404 variant.
3. `src/shell/sw.test.ts:138-142` "an update found later through the module's own updatefound gives installing" — counts the found worker's `statechange` listeners but never fires `statechange` on it. Proposed default: move `update` to `waiting`, call `update.move('installed')`, assert `waiting`.
4. `src/shell/sw.test.ts:121-127` multi-slot precedence `it.each` — `worker(slot)` gives the workers the states `'waiting'` / `'active'`, which are not `ServiceWorkerState` values (the single-slot cases use `'installed'` / `'activated'`). Proposed default: one shared slot → state table (`installing` → `installing`, `waiting` → `installed`, `active` → `activated`) used by both `it.each` blocks, before entry 2 adds redundant-before-`activated` cases that read `worker.state`.
