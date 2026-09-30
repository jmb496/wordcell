# Review log — story-game-store-load-dispatch-and-storage.md (ticket 3.3)
State: pass 1: done

Mode: docs, thorough, max 7, budget 1500 words. Pass 0: 219 words, copy at story-game-store-load-dispatch-and-storage.passes/pass0.md (HEAD 676e286).
Carried intent from tickets.toml entry 3 (not copied by the pull): interface, tests, owns — added to Description in pass 1.

## Pass 1 — 2026-09-30
Reviewers: builder's reading, edge-case, adversarial, ref alignment  |  Findings: major 6, minor 11, decision-needed 0  |  Dropped in triage: 0 (duplicates merged: 33 raw → 17)
Words (docs): 810 (3.70 x pass 0; budget 1500)  |  Snapshot: story-game-store-load-dispatch-and-storage.passes/pass1.md
Fixer: all 17 applied; no commands touched.
### Applied
- [major] Description — add Interface/Tests/Owns lines from tickets.toml entry 3 (caller instruction) → fixer 1
- [major] Description clock — nothing resumes the clock in entry 3 (AD-16 resume lands with entry 6 listeners); take returns 0 so accrue is same-ref in Playwright; Vitest resumes the clock itself under stubbed performance.now → fixer 2
- [major] Description dispatch — which DispatchResult fields entry 3 fills (finished/unfinished need reconcile's status comparison; reconcile is entry 7) → fixer 3
- [major] References/Verify — rule-coverage §5 R-73/R-74 rows missing: stored Session deep-equals current().session (after load and each Undo/Redo), two fresh contexts differ, no off-origin/non-GET request; cite rule-coverage.md and SPEC CAP-3/E1 → fixer 4
- [major] Tests — rule-coverage AD-9 clock row (peek non-consuming, resume/pause idempotence) owned by no entry → fixer 5
- [major] Description spec moves — e2e/pwa/font.spec.ts:99 locates `placeholder board` text; replacing the meta line breaks test:e2e:dist → fixer 6
- [minor] E1 fidelity vs disposable board → fixer 7
- [minor] load: E7 removal, main.ts load() before mount, re-entry throws, parse ok → active nothing written → fixer 8
- [minor] booting/rejected render before entry 5; four-kind union → fixer 9
- [minor] write-then-assign order → fixer 10
- [minor] primary-action is entry 4; Undo/Redo enablement → fixer 11
- [minor] loaded() source is the store's launch parse → fixer 12
- [minor] kill variant: unseeded new page, same context, comparison value → fixer 13
- [minor] kill variant owner: epic Notes split line stale (tickets.toml gives it to entry 3) → fixer 14
- [minor] Vitest isolation of module-level store → fixer 15
- [minor] globals.d.ts Session type; test-hook specs key assertions → fixer 16
- [minor] later board changes regenerate the baseline → fixer 17
### Default applied (technical)
- dispatch — full AD-4 type now: changed, rejectedWord passed through from apply, finished/unfinished from view(accrued).status vs view(result.session).status; write before state assignment
- clock — no resume in entry 3
- board — DESIGN.md colour/type tokens and button component; WordCells 3–10 as simple labelled stacks, no AD-11 geometry
- booting/rejected — WordCell heading only; union carries all four kinds (halted unreachable until entry 5)
- Vitest — vi.resetModules + stubGlobal + dynamic import per test
- globals.d.ts — `import type { Session } from '../src/engine/index'`
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- none
