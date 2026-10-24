---
id: 9
type: story
title: "Close-out: documents, AGENTS pitfall and device check"
parent: epic-end-of-game-words
covers: [CAP-5]
after: [2, 7, 8]
hitl: true
risk: low
---

# Close-out: documents, AGENTS pitfall and device check

## Description

Brings EXPERIENCE.md, DESIGN.md, the spine and rule-coverage.md in line with the build (the Opus review close-out edits to AD-19, SPEC CAP-2/F3, Scaffold deltas and the rule-coverage Exempt list are already applied, 2026-10-23), runs `bmad-project-context` to add the celebration-copy pitfall (`data-celebration`, neither live nor mirror) to AGENTS.md, and hands Jared the build for the final Android read (a long word list, the hide path, the Words section on the sheet).

## Acceptance Criteria

Verify: No document contradicts the build, every row of rule-coverage.md names a passing test (the tickets record the test names; this entry checks each row), AGENTS.md carries the pitfall, `npm run test:all` and `npm run test:screens` are green, and Jared records his Android read in the epic Notes.

## References

- parent — _bmad-output/initiative-wordcell-v1/epic-end-of-game-words/epic-end-of-game-words.md
- constraint — AGENTS.md (managed block edits go through bmad-project-context)

## Notes

- Decision (owner, 2026-10-23 run prompt; recorded 2026-10-24): the autopilot is authorised to run this ticket's non-device parts (the doc syncs, the AGENTS.md pitfall through `bmad-project-context`, the rule-coverage check, `test:all`, `test:screens`). Its only hitl part is the owner's final Android read: build and verify it, leave it `built`, and stop (epic-autopilot stop rule 4).
- Doc syncs to apply: every Close-out docs line in the autopilot digest's 10.5–10.7 entries (`_bmad-output/implementation-artifacts/autopilot/epic-end-of-game-words-20261020-0925.md`) and the SPEC Decisions F16–F29 (F24 superseded by F25; F25 reworded to "one constant speed per word along its path, the run as long as the path's"). Owner docs edited here: ARCHITECTURE-SPINE.md (AD-19 Start, Skip, Hide, Rule bullet 1; AD-13/AD-19 naming `src/ui/open-menu.ts`), EXPERIENCE.md (Win celebration rows, "Never plays"), DESIGN.md (Win celebration: 35 % overlap, no launch row, per-card motion), the epic SPEC (CAP-2, F25), rule-coverage.md.
- Decision (owner standing rule, 2026-10-24): `docs/game-flow-spec.md` R-87 adds the dictionary banner to the press-skip exemption ("outside the top and action bars and the dictionary banner"), as built since 10.6; no other rule text changes.
- Device read handoff: `node scripts/device-preview.mjs <fixture>` (docs/device-testing.md), not chrome://inspect. The read needs a long-word-list won fixture (A-D12's 40 % floor, a 23-letter row, many copies, per-word tempo when the F22 pace fit engages; epic Notes): add one under `fixtures/` (a valid Session, named `session-won-long-words.json` or similar, with its fixture test as the other won fixtures) if none exists, and hand the owner its seed URL. Checklist: long list frame rate and readability, hide-to-background mid-run (end sheet waiting on return, F28), the Words section on the sheet.
