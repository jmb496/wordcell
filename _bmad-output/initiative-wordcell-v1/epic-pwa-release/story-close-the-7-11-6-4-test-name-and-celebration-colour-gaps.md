---
id: 15
type: story
title: "Close the 7.11 §6.4 test-name and celebration-colour gaps"
parent: epic-pwa-release
covers: [CAP-9]
after: [10]
risk: low
---

# Close the 7.11 §6.4 test-name and celebration-colour gaps

## Description

Fix ticket from ticket 7.11's §6.4 audit (plan `story-close-out-documents-audits-and-device-read-plan.md`, fix-ticket proposals 1 and 2; owner decision 2026-11-07 in the epic Notes). Test-only. (1) Q-17 (portrait on the phone, responsive in a browser) has no passing test whose title carries Q-17, though the behaviour is tested (`e2e/pwa/build-output.spec.ts` asserts the manifest's portrait orientation; G1 passed): add `Q-17` to that test's title and to one existing desktop layout test's title that proves the responsive half, without changing what either asserts. (2) R-87's "no colour change" clause (spec Q-48) has no automated assertion: add one Playwright assertion (e.g. in `e2e/celebration.spec.ts`) that, mid-run, each `data-celebration` copy's computed `color`, `background-color` and `filter` match its live card face's, titled with R-87. No `src/` change; a failing new assertion that shows a real `src/` defect stops for the owner.

## Acceptance Criteria

Verify: `grep` finds a passing test titled with Q-17 for each half of Q-17 and a passing R-87 test asserting the celebration copies' colours match the live faces; no `src/` file changed; `npm run test:all` is green (and `npm run test:screens` if a screenshot spec changed).

## References

- parent — _bmad-output/initiative-wordcell-v1/epic-pwa-release/epic-pwa-release.md
- plan — _bmad-output/initiative-wordcell-v1/epic-pwa-release/story-close-out-documents-audits-and-device-read-plan.md (§6.4 audit, fix-ticket proposals 1 and 2)
- code — e2e/pwa/build-output.spec.ts, e2e/celebration.spec.ts
- spec — docs/game-flow-spec.md Q-17, Q-48, R-87
