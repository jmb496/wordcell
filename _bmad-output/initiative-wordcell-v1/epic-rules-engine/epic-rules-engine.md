---
type: epic
title: "Rules engine"
parent: initiative-wordcell-v1
covers: []
after: []
assignee: ""
risk: medium
---

# Rules engine

## Description

Turns every untagged engine sentence of `docs/game-flow-spec.md` §2–§6 into tested code in `src/engine/`: the golden deal test and deal freeze, `LangData`, the Session with replay and validation, the move commands and the AD-2 command table, undo/redo/give up/active time, scoring and bands, `GameView`, score-history semantics, and serialise/parse with the AD-7 rejection reasons. The epic spec `spec-epic-2-rules-engine` owns the capabilities (CAP-1…CAP-9), constraints, non-goals and decisions D1–D8; `rule-coverage.md` maps every rule to its CAP and test kind, and `build-notes.md` holds the how. No UI changes beyond the type the placeholder needs (D1).

## Outcome

Every later epic renders and stores only what the engine derives; the SPEC's Success signal is the measure.

## Requirements

The spec's capabilities replace this section: `_bmad-output/specs/spec-epic-2-rules-engine/SPEC.md`, CAP-1…CAP-9. The epic has no parent ids; the source is spine Proposed epics row 2 and the Scaffold delta epic 1 deferred to it (`LangData`, R-81 penalty).

## Done when

1. `npm run test:all` is green with every untagged engine sentence of spec §2–§6 mapped in `rule-coverage.md` to a passing Vitest test named with its id.
2. The `R-02 golden deal` test's expected literals (CardIds per column for seeds 1 and 4294967295, and the 52-letter sequence) are byte-identical to its first commit.
3. A scripted game on seed 1 (drop, compose, validate, place, confirm, then undo to the start and redo to the end) round-trips through `serializeSession` → `parseSession` to an equal `view` after every step.
4. `src/engine/commands.test.ts` opens with the complete AD-2 command table and every row passes; `src/engine/index.ts` exports exactly AD-2's list plus its types and the D1 transitional `deal`/`Card`.
5. The e2e smoke spec still finds 52 `card-<CardId>` elements for seed 1 under `npm run test:all`, and once the owner merges and deploys, the live board shows the same deal.

## Boundaries

The pure core only (`src/engine/`, root `fixtures/`, and the D1 type change in `main.ts`/`src/ui/App.svelte`). Not the game store, storage, dictionary load, clock or test-hook accessors (epic 3), not any `(UI)` sentence or Playwright R-id test (epics 4–6); SPEC.md Non-goals.

## References

- spec — _bmad-output/specs/spec-epic-2-rules-engine/SPEC.md, Capabilities, Constraints, Decisions
- spec — _bmad-output/specs/spec-epic-2-rules-engine/rule-coverage.md, every table
- spec — _bmad-output/specs/spec-epic-2-rules-engine/build-notes.md, per-CAP notes and Spine notes
- spec — _bmad-output/specs/spec-epic-2-rules-engine/SPEC.review-log.md, Result (two minors left for the build)
- rules — docs/game-flow-spec.md, §2–§6, §8, §9
- architecture — _bmad-output/planning-artifacts/architecture/architecture-wordcell-2026-09-27/ARCHITECTURE-SPINE.md, AD-1, AD-2, AD-3, AD-5, AD-6, AD-7, AD-15, AD-17, Scaffold deltas, Proposed epics row 2
- design — _bmad-output/planning-artifacts/ux-designs/ux-wordcell-2026-09-27/EXPERIENCE.md, A-E3, A-E14
- constraint — AGENTS.md, Architecture rules 1–7, Policy, Conventions, Known pitfalls
- methodology — docs/development-methodology.md, Per-ticket loop, Autopilot, Definition of done

## Notes

- Decision: epic branch `epic-2-engine`, created from `epic-1-scaffold` (holds the spec commits); every ticket's build precondition is a clean tree on it (owner, 2026-09-28).
- Decision: entry 1 is CAP-1 alone (golden deal test plus the R-id renames), entry 2 is CAP-2, the rest follow the SPEC's build order (owner, 2026-09-28).
- Decision: CAP-4 is split into entries 4 (Composing commands, table opened) and 5 (validate and Place commands, §8 example), and CAP-9 into entries 10 (Session) and 11 (history plus the Success-signal scripted game), each half one session (technical default, 2026-09-28).
- Decision: the autopilot runs entries in table order; entries 2–6 and 8–11 chain because they share `src/engine/index.ts` and the modules each extends, and entry 7 (scoring) needs only entry 2. The tracer bullet is entry 3 (Session → replay → position), the first slice through every engine module a later entry extends (technical default, 2026-09-28).
- Decision: a closing refactor sweep (entry 12) is kept per the ticketing default; epic 1 declined one for its own reasons, not recorded as applying here (technical default, 2026-09-28).
- Decision: no entry is `hitl`; gates 3 and 4 run under the epic autopilot (owner, 2026-09-28).
- Assumption: no entry is high risk; the R-02 golden deal test guards the only irreversible change (the deal), and pre-v1 no stored Session exists to break.
- Waits on epic 1 because: the AD-1 layer checks, the `test:all` gate and the D1 placeholder feed are its output.
