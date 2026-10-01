---
id: 12
type: story
title: "Refactor sweep and shared Playwright config"
parent: epic-app-shell
covers: [CAP-11]
after: [2, 11]
risk: low
---

# Refactor sweep and shared Playwright config

## Description

Closing cleanup of epic 3: applies (or records with a reason) every Unapplied minor in _bmad-output/implementation-artifacts/review-loop/3-1-build.md through 3-11-build.md and the deferred items in the epic's plans and autopilot digest; adds playwright.base.ts holding the settings the three Playwright configs share (B11, E9), each config importing it and tsconfig.e2e.json covering it; brings the unit suite back under AD-17's 5 s budget (it is 6-7.7 s, was 4.7 s at 3.4) without dropping coverage, recording before/after; and records in its plan the AGENTS.md pitfall update (type exports are now checked by src/architecture.test.ts since 3.1) for a later bmad-project-context refresh.

## Acceptance Criteria

Verify: npm run test:all and npm run test:screens are green, the three configs import playwright.base.ts, the unit suite Duration is under 5 s on the dev machine, and every change maps to a deferred finding named in the plan.

## References

- parent — _bmad-output/initiative-wordcell-v1/epic-app-shell/epic-app-shell.md

## Notes

- Open question: Scope is unknown until the earlier builds finish.
