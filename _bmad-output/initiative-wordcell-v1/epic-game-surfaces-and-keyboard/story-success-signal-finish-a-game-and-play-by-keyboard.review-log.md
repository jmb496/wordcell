# Review log — ticket 6.15 Success signal

State: pass 1: done
Pre-loop: HEAD bc81b42b5ad90657220fdef2aeb75c85e0685866, 178 words (copy: .passes/pass0.md)

## Pass 1 — 2026-10-16
Reviewers: builder, edge-case, adversarial, ref alignment  |  Findings: major 8 (merged from ~30 raw), minor 4, decision-needed 0  |  Dropped in triage: duplicates merged
Words (docs): 534 (3.0 x pass 0; over the 2.5x budget, so later minors apply only if word-neutral)  |  Snapshot: .passes/pass1.md
### Applied
- [major] Description — no ordered steps / expected results → step list, fixer item 1
- [major] win vs Give up ordering and reload ordering → two android tests, reload before New game (item 2)
- [major] fixtures unnamed → named, `SESSIONS.flow6` builder check (item 3)
- [major] relation to e2e/success-signal.spec.ts → separate file (item 4)
- [major] "after every step" Session equality untestable → restated (item 5)
- [major] Flow 6 keys, keyboard-only, `?` table, project gating → (item 6)
- [major] test:screens no new baselines; P6 rows audit → (item 7)
- [major] Show timer assertion → (item 8)
### Default applied (technical)
- Test A/B structure, fixture choice, timer assertion method, project gating — reviewers' defaults taken.
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- covers→step map (minor, over budget); `after` transitive closure check (minor); How-to-play heading assertion (minor)
