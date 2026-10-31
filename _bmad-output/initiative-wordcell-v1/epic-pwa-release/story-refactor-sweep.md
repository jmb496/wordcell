---
id: 10
type: story
title: "Refactor sweep"
parent: epic-pwa-release
covers: [CAP-8]
after: [1, 2, 3, 4, 5, 6, 7, 8, 9]
risk: low
---

# Refactor sweep

## Description

Closing cleanup of epic 7 before the owner's device read (CAP-8): one table row per deferred finding of entries 1–9 (plans' deferred items, residual risks, unapplied review minors), each fixed, closed by a cited commit, declined with a reason, a fix ticket under technical defaults (a finding needing a `src/` change) or an owner-call row (functionality or UX only); the 4.6 "main.ts controller-registration order has no test" item (`device-checks.md` G9) fixed by a test or declined with a reason; the unit suite's warm median, a watch re-run on a Linux-filesystem checkout and the AD-18 margin re-measured; the sweep itself changes only comments, tests, test helpers and tooling.

## Acceptance Criteria

Verify: Every deferred finding has its row with a disposition, G9 is resolved, the warm median under 5 s, the watch re-run under 1 s and the AD-18 margin are recorded with the commit, and `npm run test:all` and `npm run test:screens` are green.

## References

- parent — _bmad-output/initiative-wordcell-v1/epic-pwa-release/epic-pwa-release.md
- spec — SPEC.md CAP-8; device-checks.md G9
- constraint — docs/development-methodology.md, Definition of done; AGENTS.md Running and verifying (unit budget, Linux-filesystem checkout)
