---
id: 11
type: story
title: "CI and deploy checks as tested scripts"
parent: epic-scaffold-ci-deploy
covers: [CAP-8, CAP-9]
after: [10]
hitl: true
risk: medium
---

# CI and deploy checks as tested scripts

## Description

Closes retro A4 and A6: the CI flaky-report and the post-deploy header checks move out of inline workflow bash into scripts with unit tests; a unit test checks public/_headers and public/.assetsignore against the AD-18 rule set before anything deploys; the post-deploy immutable check covers the dictionary and the woff2, not only the first JS asset; CI runs actionlint from a pinned image.

## Acceptance Criteria

Verify: The new script tests and the _headers test pass under npm run test, and a dropped /sw.js no-cache rule fails one; actionlint runs in CI; after the owner pushes, the CI run and the main deploy are green with the extended checks (gate 4).

## References

- parent — _bmad-output/initiative-wordcell-v1/epic-scaffold-ci-deploy/epic-scaffold-ci-deploy.md
- retrospective — _bmad-output/initiative-wordcell-v1/epic-scaffold-ci-deploy/epic-scaffold-ci-deploy-retrospective.md, R3, R6, P3, A4, A6
- architecture — _bmad-output/planning-artifacts/architecture/architecture-wordcell-2026-09-27/ARCHITECTURE-SPINE.md, AD-18 CI, Deploy
