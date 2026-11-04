---
id: 14
type: story
title: "Deflake the helpers.spec.ts doubleTap test under load"
parent: epic-pwa-release
covers: [CAP-8]
after: [10]
risk: low
---

# Deflake the helpers.spec.ts doubleTap test under load

## Description

Fix ticket from ticket 7.10's sweep (row D-71, B8): the test `AD-17 doubleTap gives two touch taps whose clicks have detail 1 then 2, even 600 ms apart in real time` (`e2e/helpers.spec.ts`, identified by title, not line) failed once under full-suite load: click details `[1, 1]`, not `[1, 2]`; the page got the two taps at 740.1 and 2520.2 ms although the CDP stamps were 80 ms apart, so the second tap reached the page past Chromium's tap-count window (the D-64 double-tap mechanism, end-of-game-words epic :75). Sightings: the 7.10 review pass 1 tree's final `npm run test:all`; 30/30 alone afterwards; 0/3 counted runs at the review pass 2 and 3 trees. Find the cause and fix it test-side if the cause is in the test or its helpers (`e2e/helpers.spec.ts`, `e2e/helpers/touch.ts`); a cause in `src/` stops for the owner. Reproduction: `npx playwright test e2e/helpers.spec.ts -g "doubleTap gives two touch taps" --project=android --repeat-each=50`, failure count recorded before and after; failures may not reproduce at that count, in which case record the count and the evidence examined and close it with a reason.

## Acceptance Criteria

Verify: The cause is recorded with its evidence and fixed with a reproduction count of 0 failures in 50 repeats after the fix, or, if it never reproduces, the counts and evidence are recorded and the ticket closes with that reason; `npm run test:all` is green.

## References

- parent — _bmad-output/initiative-wordcell-v1/epic-pwa-release/epic-pwa-release.md
- plan — _bmad-output/initiative-wordcell-v1/epic-pwa-release/story-refactor-sweep-plan.md (D-71, Fix tickets)
- code — e2e/helpers.spec.ts, e2e/helpers/touch.ts
