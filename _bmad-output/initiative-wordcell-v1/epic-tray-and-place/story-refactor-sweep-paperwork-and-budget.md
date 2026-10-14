---
id: 15
type: story
title: "Refactor sweep: paperwork and budget"
parent: epic-tray-and-place
covers: [CAP-12]
after: [14]
risk: low
---

# Refactor sweep: paperwork and budget

## Description

Closing records (CAP-12, retrospective A9, AD-17, L2): the build-notes Sweep inventory rows marked paperwork (S8 4.13-OM banner-during-scroll failure and five green runs in story-refactor-sweep-plan.md, S9 4.13-m1 plan updates, S10 4.9f-m5 ticket 4.9 Notes wording, S11 4.11-OM final tree in the 4.11 plan's test:all line, S16 4.12-OM confirmed at HEAD and recorded, S21 the 5.1 plan screenshot-command Change Log entry, the epic Boundaries naming the AD-17 valid-fixture list in src/architecture-ad2-ad12-ad17.test.ts (5.2 plan `deferred`) and the stale b94b7b2 body recorded, S22 the unit suite's one failure beside 12 Playwright workers investigated or recorded), S12 the AD-17 warm-cache median of three npm test runs after a discarded warm-up on a Linux-filesystem checkout plus the slowest engine file's watch re-run (over 5 s or 1 s: per-file timings and a stop for the owner before built), S13 the build-notes close-out edit lists completed for the retrospective, including the AGENTS.md Where-things-are additions (flip.ts, tray/, the gestures/ modules) for a bmad-project-context refresh, and the epic Done when 1 audit mapping every P5 row of rule-coverage.md to its passing android (and desktop where named) test.

## Acceptance Criteria

Verify: npm run test:all and npm run test:screens are green, and the plan records the warm median and watch re-run (or the owner stop) and maps S8–S13, S16, S21 and S22 each to its applied edit and every rule-coverage.md P5 row to a passing test name.

## References

- parent — _bmad-output/initiative-wordcell-v1/epic-tray-and-place/epic-tray-and-place.md
- spec — _bmad-output/specs/spec-epic-5-tray/build-notes.md, Spine close-out edits, Epic file close-out edits, EXPERIENCE.md and DESIGN.md close-out edits, CAP-11 / CAP-12 Sweep inventory

## Notes

- Open question: Whether the unit median stays under 5 s after the epic's new UI Vitest cases (controller.test.ts is the critical path, F41).
