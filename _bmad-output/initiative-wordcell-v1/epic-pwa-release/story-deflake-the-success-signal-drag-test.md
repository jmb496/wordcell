---
id: 13
type: story
title: "Deflake the success-signal drag test"
parent: epic-pwa-release
covers: [CAP-8]
after: [10]
risk: low
---

# Deflake the success-signal drag test

## Description

Fix ticket from ticket 7.10's sweep (row D-65, B8): the test `R-73 (UI) Success signal (epic Done when 3): the same move by drag …` (`e2e/success-signal.spec.ts`, identified by title, not line) fails intermittently with no cause found (sightings: win-trigger plan :101, game-surfaces retro F-13, 7.9 plan :108 run 1; 0/3 in 7.10's item 6 counted runs). Find the cause and fix it test-side if the cause is in the test or its helpers (`e2e/success-signal.spec.ts`, `e2e/helpers/drag.ts`); a cause in `src/` stops for the owner. Reproduction: `npx playwright test e2e/success-signal.spec.ts -g "the same move by drag" --project=android --repeat-each=50`, failure count recorded before and after; failures may not reproduce at that count, in which case record the count and the evidence examined and close it with a reason.

## Acceptance Criteria

Verify: The cause is recorded with its evidence and fixed with a reproduction count of 0 failures in 50 repeats after the fix, or, if it never reproduces, the counts and evidence are recorded and the ticket closes with that reason; `npm run test:all` is green.

## References

- parent — _bmad-output/initiative-wordcell-v1/epic-pwa-release/epic-pwa-release.md
- plan — _bmad-output/initiative-wordcell-v1/epic-pwa-release/story-refactor-sweep-plan.md (D-65, Fix tickets)
- code — e2e/success-signal.spec.ts, e2e/helpers/drag.ts
