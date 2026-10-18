# Review log — story-token-plumbing-and-contrast-harness.md
State: pass 2: done
Mode: docs, thorough, max 7. Pre-loop: HEAD 5438993ba12759a9f9d89ccede9e911753dbc47f, 180 words (growth budget ~1500 words, stub being fleshed out).

## Pass 1 — 2026-10-18
Reviewers: builder's reading, edge-case hunter, adversarial, ref alignment  |  Findings: major 10 (merged), minor 5, decision-needed 0  |  Dropped in triage: 0 (duplicates merged; literal inventory re-verified by grep)
Words (docs): 753 (4.2 x pass 0; stub fleshed out, growth budget ~1500)  |  Snapshot: story-token-plumbing-and-contrast-harness.passes/pass1.md
### Applied
- [major] Notes — unknowns settled: 7 literals in 5 files beyond app.css, all become tokens with exact values → fixer 1
- [major] scan scope/forms, pure function, testability, placement outside architecture-* and SELF → 2, 3, 4
- [major] contrast test parser, pairs and thresholds, negative case → 5
- [major] default block `:root, [data-theme="default"]` → 6
- [minor] out-of-src files, TH-5 ratio half, references, color-scheme → 7–10
### Default applied (technical)
- Tokenise Scene colours (pixel-identical exact values) rather than fixed art; scan placement; selector choice.
### Decision needed
- none

## Pass 2 — 2026-10-18
Reviewers: fix diff, edge-case hunter, adversarial, ref alignment  |  Findings: major 10 raw (9 after merge), minor 6, decision-needed 0  |  Dropped in triage: 0
Words (docs): 1223 (6.8 x pass 0; stub fleshed out, budget ~1500)  |  Snapshot: story-token-plumbing-and-contrast-harness.passes/pass2.md
### Applied
- [major] Placement: root-level src/*.test.ts fails AD-1 stray-file (confirmed in architecture-scan.ts layerOf/check) → moved under src/ui/theme/ → fixer 1
- [major] parser grammar vs #0008 / rgb() / scrim; threshold rule (floor unrounded + round1 pin); explicit pairs table; token set/extraction → 2, 3, 4
- [major] scan: allow list (none etc.), hex/name colour context, per-region comment stripping, exemption shape, var() definedness → 5–8
- [major] pixel identity not proven by screenshots for drag-layer/ghost sites → token-value + CSS-reads-token assertions → 9; Scene scoped rule → 10
- [minor] selector note, AD-10 wording, pin assertion deleted, git diff on baselines, covers note → 11–15
### Default applied (technical)
- UI-layer placement; floor + round1 threshold rule; deterministic unit checks for uncovered pixel sites.
### Decision needed
- none
