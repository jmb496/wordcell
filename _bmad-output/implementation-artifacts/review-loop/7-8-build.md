# Review loop — ticket 7.8 build (code, 0a61fc2..HEAD)

State: pass 1: done

Mode: code, depth quick, max 7. Target: `0a61fc2..HEAD` (build commit c7cd412). Intent:
`_bmad-output/initiative-wordcell-v1/epic-pwa-release/story-packaging-and-size-budget-with-a-real-worker-module-plan.md`.
Pre-loop: HEAD c7cd412816695e198a53e7cb2b0ab091662761e8, tree snapshot 0 3a92d39f90c5b190d15d337f44b75531952f0d0a,
diff `7-8-build.passes/pass0.diff`.

## Pass 1 — 2026-10-31
Reviewers: correctness, verification gap  |  Findings: major 1, minor 1, decision-needed 0  |  Dropped in triage: 1
### Applied
- [major] `scripts/size-budget.test.mjs` computeBudget describe — no case puts the sw.ts dynamic edge on a non-entry reached chunk (static import of the entry, or a lazily loaded chunk), so a gate checking only the entry's `dynamicImports` would pass the suite → fixer item 1 (default applied: add a passing case with both shapes)
- [minor] `e2e/pwa/build-output.spec.ts` AD-18 content case — nothing asserts the entry chunk is in the counted rows, so an undercount would let markers sit in `uncounted` unnoticed → fixer item 2 (default applied: assert the `isEntry` key's file is counted)
### Default applied (technical)
- size-budget.test.mjs — reached-chunk sw.ts edge proof → new `AD-18 …` case with two manifests
- build-output.spec.ts — counted-set lower bound → `expect(counted).toContain(manifest[entryKey].file)`
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- Gate message `… from the entry` differs from the ticket's "exactly" string — already recorded as a deliberate technical default in the plan's Implementation Notes (review-log item 7), with entry 11 syncing AD-18; nothing to fix in code.
### Fixer outcome
- 1: added `AD-18 sw.ts dynamically imported by a chunk the entry reaches passes` (static-import importer `_a.js`, lazy importer `src/lazy.ts`; `errors` `[]`, importer counted, sw chunk not).
- 2: content case finds the single `isEntry` key and asserts its file is counted, before the marker loop; ran on real builds under `dist-smoke` and `pwa` (10 passed each).
- Orchestrator re-run: `npm test` 91 files / 3738 tests passed; lint clean; check 0 errors.
Snapshot: tree cdb31eb10ab8cad79551ecaaa8cbe7897931cf49, fix diff `7-8-build.passes/pass1.fix.diff`, full diff `7-8-build.passes/pass1.diff`.
