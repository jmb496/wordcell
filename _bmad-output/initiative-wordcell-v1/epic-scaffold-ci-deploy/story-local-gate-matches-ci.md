---
id: 10
type: story
title: "Local gate matches CI"
parent: epic-scaffold-ci-deploy
covers: [CAP-3, CAP-4, CAP-5, CAP-6, CAP-7]
after: [9]
risk: low
---

# Local gate matches CI

## Description

Closes retro A2, A3, A5, A9 and the A7 follow-ups: npm run test:all also builds dist/ (so the postbuild size budget runs) and runs test:e2e:dist; the disk-only packaging checks (precache, build output, font) run against dist/ as well as dist-test/; the precache holds exactly one entry per URL (the includeAssets and manifest-icon duplicates go); @playwright/test is pinned exactly and a unit test keeps the lockfile version equal to the screenshot image tag in package.json and ci.yml; a unit test pins the committed woff2 and icon PNGs to hashes recorded beside their generator inputs; the size-budget tests pin the gzip level; the 1.1 markup history-binding regex gets the follow-up fixture review its plan recommended.

## Acceptance Criteria

Verify: npm run test:all is green and now runs the size budget and dist-smoke; a scratch over-budget asset, a duplicated precache URL, a mismatched Playwright version, a one-byte-changed woff2 or icon, and a changed gzip level each fail a named test.

## References

- parent — _bmad-output/initiative-wordcell-v1/epic-scaffold-ci-deploy/epic-scaffold-ci-deploy.md
- retrospective — _bmad-output/initiative-wordcell-v1/epic-scaffold-ci-deploy/epic-scaffold-ci-deploy-retrospective.md, R1, R2, R4, R5, R7, R11, S7, S8, A2, A3, A5, A7, A9
- architecture — _bmad-output/planning-artifacts/architecture/architecture-wordcell-2026-09-27/ARCHITECTURE-SPINE.md, AD-16, AD-17, AD-18
