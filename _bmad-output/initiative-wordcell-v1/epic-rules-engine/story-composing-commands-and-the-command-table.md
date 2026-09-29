---
id: 4
type: story
title: "Composing commands and the command table"
parent: epic-rules-engine
covers: [CAP-4]
after: [3]
risk: medium
---

# Composing commands and the command table

## Description

Creates src/engine/commands.test.ts opening with the executable AD-2 command table and implements apply with the status/phase/domain/rule check order for drop, tapDestinationCard, setDestinationCount, flip, addFreeLetter, removeFreeLetter and arrange: R-71 edit and advance semantics, no-op by value, D8 freeLetters order, applyFrom on the D2 seam, and their table rows with check codes, every row deep-freezing its input Session and LangData; validate and the Place commands are entry 5; the R-12, R-31 and R-33 flag and kIfTapped tests are entry 8's.

## Acceptance Criteria

Verify: npm run test:all is green with every row for these seven commands passing (no-op → same reference, throw → EngineError with the named check code) the R-31 bound and self-drop throw and no-op rows included, and R-10–R-13, R-20–R-23, R-30–R-35 tests and the R-39 @ts-expect-error no-Cancel test passing.

## References

- parent — _bmad-output/initiative-wordcell-v1/epic-rules-engine/epic-rules-engine.md
- spec — _bmad-output/specs/spec-epic-2-rules-engine/build-notes.md, CAP-4 Commands

## Notes

- Open question: Whether the table's typed row shape stays readable once entries 5 and 6 add their rows.
