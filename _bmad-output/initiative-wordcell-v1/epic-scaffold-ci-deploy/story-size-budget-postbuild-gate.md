---
id: 6
type: story
title: "Size budget postbuild gate"
parent: epic-scaffold-ci-deploy
covers: [CAP-6]
after: [5]
risk: low
---

# Size budget postbuild gate

## Description

Adds scripts/size-budget.mjs as postbuild: gzip-9 sum of the AD-18 counted set from dist/.vite/manifest.json against 600,000 bytes, failing on a missing font or dictionary, plus a 4,000,000-byte per-file limit on precache-glob files.

## Acceptance Criteria

Verify: npm run build prints the per-file table and passes on the tree, a forced over-budget build fails (shown in the plan, reverted), and AD-18 tests in scripts/size-budget.test.mjs cover over-budget, missing font, missing dictionary, the sw.ts chunk exclusion and the 4 MB limit.

**Build precondition:** clean tree on `epic-1-scaffold`.

**Delta checks (delta-checks.md rows for CAP 6):**

- `postbuild`: `npm run build` prints the per-file table; `AD-18` script tests.
- SPEC CAP-6 success: `postbuild` passes on the tree (dictionary ≈ 454,262 B gzip, measured 2026-09-27); `scripts/size-budget.test.mjs` covers over-budget, missing font, missing dictionary, the `src/shell/sw.ts` chunk exclusion (fixture manifest; no such chunk exists until epic 7) and the 4 MB file limit.
- SPEC Success signal: a `?url` dictionary over 600,000 gzip bytes turns `npm run build` red (forced once, shown in the plan, reverted).

**Tests:** `AD-18 …` in `scripts/size-budget.test.mjs` on a pure `computeBudget(manifest, sizes)` with inline fixtures. `postbuild` runs only after `build`, not `build:test`.

**Owner checks at gate 4:** none beyond reading the plan's result.

**AGENTS.md `TODO(epic 1)` items removed:** none.

## References

- parent — _bmad-output/initiative-wordcell-v1/epic-scaffold-ci-deploy/epic-scaffold-ci-deploy.md
- architecture — _bmad-output/planning-artifacts/architecture/architecture-wordcell-2026-09-27/ARCHITECTURE-SPINE.md, AD-18 Size, AD-16
- spec — _bmad-output/specs/spec-epic-1-scaffold-ci-deploy/build-notes.md, CAP-6 Size budget
