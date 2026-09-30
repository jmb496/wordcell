---
id: 1
type: story
title: "Engine carry-ins and D1 export removal"
parent: epic-app-shell
covers: [CAP-1]
after: [2.13]
risk: medium
---

# Engine carry-ins and D1 export removal

## Description

Tracer bullet: fixes B6 (addFreeLetter with index: undefined appends like an absent index, proved by a named test right after the AD-2 TABLE since the TABLE holds only no-op and throw rows; review-log open major 2), lands the B7 test gaps (an R-38-named structural-throw case, the four review-loop/2-12-build.md test minors, accrue between a finish and its un-finish, a regeneration test rebuilding the nine valid session fixtures from scripted accrue/apply, and a compiler-API AD-2 export-exactness test in src/architecture.test.ts), removes deal and Card from src/engine/index.ts, and feeds main.ts and App.svelte from a first game.svelte.ts cut that boots active with createSession(1) (E7, transitional, keeps the Seed line) and derives view.

## Acceptance Criteria

Verify: npm run test:all is green, the R-02 golden deal literals are byte-identical, the export-exactness test fails when a scratch `export type { Start }` is added to index.ts, and the smoke spec still finds 52 live cards on the seed-1 board rendered from view.

## References

- parent — _bmad-output/initiative-wordcell-v1/epic-app-shell/epic-app-shell.md
- spec — _bmad-output/specs/spec-epic-3-app-shell/build-notes.md, CAP-1
- review — _bmad-output/implementation-artifacts/review-loop/2-12-build.md, Result

## Notes

- Open question: Whether ts.createProgram over src/engine/index.ts keeps the unit suite under 5 s (reviewer estimate ~0.75 s, unverified); fallback noLib/skipLibCheck.
