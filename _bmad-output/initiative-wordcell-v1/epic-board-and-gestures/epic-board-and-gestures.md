---
type: epic
title: "Board and gestures"
parent: initiative-wordcell-v1
covers: []
after: [epic-app-shell]
status: done
assignee: ""
risk: high
---

# Board and gestures

## Description

Replaces the epic 3 minimal board with the first playable surface: the real Board laid out by the DESIGN.md height rule from one band-order definition (AD-11), cards, columns, WordCells, the top bar, banner and action bar, and a static tray (F2); the live layout with its gesture gate and WordCell-row anchoring; the hand-rolled pointer controller with overlap targeting and cancel-first wiring (AD-12, AD-9, AD-16); tail selection, the end-sheet states and the view/peek state in the overlays store (AD-13); tap-select, foot pads, tap-drop and drag-drop into Composing; the Composing/Place/Game-over column behaviour; and the WordCell view (long-press peek, sticky view, desktop hover peek). It also closes the epic 3 retrospective's epic 4 carry-ins R1, R2/C-E4b, C-E4a, R6, R7 and the AD-17 unit-suite re-measure. The epic spec `spec-epic-4-board` owns the capabilities (CAP-1…CAP-10), constraints, non-goals and decisions F1–F41; `rule-coverage.md` maps every (UI) sentence and spine behaviour to its capability and test kind, and `build-notes.md` holds the how, the component tree and the close-out edits.

## Outcome

On a phone a player can pick up a stack tail by drag or tap, drop it on any column by card overlap and land in Composing, set k from the destination column, and view every card of any WordCell, with hit rects that never move under a finger and every button, hide and back cancelling a gesture first; the SPEC's Success signal is the measure.

## Requirements

The spec's capabilities replace this section: `_bmad-output/specs/spec-epic-4-board/SPEC.md`, CAP-1…CAP-10. The epic has no parent ids; the source is spine Proposed epics row 4 (plus F1/F2/F17 taken from row 5) and the epic 3 retrospective's epic 4 carry-ins.

## Done when

1. `npm run test:all` and `npm run test:screens` are green, and every `rule-coverage.md` row whose Kind includes P4 has a passing `android` Playwright test named with its id (`desktop` too for hover and mouse; the `?bands=` production half in `dist-smoke`).
2. On `android` from `session-idle-fresh`, a held drag of column 1's bottom card onto column 3 lights column 3 while over it and its release lands in Composing with the static tray showing column 3's bottom card (A) as the locked mirror on the left, then the dragged tile (W), saved before the next action; the same drag held over column 1 alone, or released over the WordCell row, leaves the stored Session byte-identical; a long-press on cell 7 of `session-idle-empty-column` shows its cards and closes on release.
3. Idle, Composing, Place and Game over each render exactly 52 `data-card-id` elements (AD-14), and the WordCell row's bounding box is unchanged when the dictionary banner shows at a viewport with leftover under 44 px.
4. A `hidePage` mid-drag writes `wordcell:session` exactly once and dispatches nothing, and Undo pressed during a held drag returns the tail before it undoes (R1, R2/C-E4b).
5. The unit suite's warm-cache median after the refactor sweep is recorded and under 5 s, or the sweep's plan records per-file timings and stops for the owner.
6. Once the owner gives the go-ahead, epic 4 is merged and deployed on its own like epics 1–3, and the live site boots a fresh deal on a phone, lets a tail be dropped into Composing, and shows no fatal surface.

## Boundaries

`src/ui/` (Board, bars, layout, gestures, overlays, text), `src/main.ts` (controller and gate creation), `src/shell/nav.ts` (`registerBeforeBack`), the shell stores' shared helper (CAP-10), `fixtures/` (two scripted valid Sessions), `e2e/` and its helpers. Not tray interaction, free letters, arrange, target selection, the placement strip, FLIP or tray growth wiring (epic 5); not the menu, dialogs, end-sheet UI or its `finished`/`unfinished` wiring, panels, keyboard, timer display or the two-overlay reload case (epic 6); not the service worker or device checks (epic 7); SPEC.md Non-goals. No engine change; the R-02 golden deal literals stay byte-identical.

## References

- spec — _bmad-output/specs/spec-epic-4-board/SPEC.md, Capabilities, Constraints, Non-goals, Decisions F1–F41
- spec — _bmad-output/specs/spec-epic-4-board/rule-coverage.md, every table
- spec — _bmad-output/specs/spec-epic-4-board/build-notes.md, Spine and EXPERIENCE.md close-out edits, As-built facts, Component tree, per-CAP notes
- spec — _bmad-output/specs/spec-epic-4-board/SPEC.review-log.md, Pass 7 and Result (unapplied minor carried by entry 4)
- rules — docs/game-flow-spec.md, R-03, R-10–R-14, R-20–R-23, R-31–R-33, R-39, R-42, R-65, R-70–R-75, R-82, §9 Q-18, Q-21, Q-26, Q-30, Q-34, Q-42
- architecture — _bmad-output/planning-artifacts/architecture/architecture-wordcell-2026-09-27/ARCHITECTURE-SPINE.md, AD-3, AD-4, AD-9–AD-14, AD-15–AD-18, Proposed epics rows 4 and 5
- design — _bmad-output/planning-artifacts/ux-designs/ux-wordcell-2026-09-27/DESIGN.md, Layout (height rule, bands, Hit rects), Components (Card, Column, WordCell, Top bar, Action bar, Tray, View sheet, Hover peek)
- design — _bmad-output/planning-artifacts/ux-designs/ux-wordcell-2026-09-27/EXPERIENCE.md, Interaction Primitives, Pointer thresholds, Drop targeting by overlap, Information Architecture, Flow 1, Message catalogue
- retro — _bmad-output/initiative-wordcell-v1/epic-app-shell/epic-app-shell-retrospective.md, Action items R1, R2, R6, R7, C-E4a, C-E4b
- constraint — AGENTS.md, Architecture rules 1–7, Policy, Conventions, Known pitfalls
- methodology — docs/development-methodology.md, Per-ticket loop, Autopilot, Definition of done

## Notes

- Decision: epic branch `epic-4-board`, created from `main`; every ticket's build precondition is a clean tree on it (owner prompt, 2026-10-01).
- Decision: epic 4 is merged and deployed on its own like epics 1–3, after the owner's go-ahead (owner, 2026-10-01, SPEC F29).
- Decision: the tracer bullet is entry 2: `GameView` → layout geometry (entry 1) → `Board.svelte` over `BAND_ORDER` → DOM, replacing the minimal board with the real Idle board, bars and C-E4a letters (technical default, 2026-10-01).
- Decision: CAP-2 is split into entries 2 (Board in Idle and Game over, bars) and 3 (Composing/Place states, static tray, AD-14 identity in four phases, screenshots); CAP-4's drag-dependent Playwright cases (hide, back, cancel-first and fly-back during a drag) move to entry 9 after drag exists, since a slice's check may not need later work; CAP-9 is split into entries 11 (peek and sticky view) and 12 (desktop hover peek) (technical default, 2026-10-01).
- Decision: entry 5 (overlays store, UI Vitest plus one Playwright case) touches only `src/ui/overlays.svelte.ts` and its test and may run beside entries 2–4; entries 2–4 and 6–12 form one lane through `Board.svelte`, `src/ui/gestures/` and `main.ts`. The autopilot runs table order (technical default, 2026-10-01).
- Decision: the stepwise held-touch helper `touchHold` (F10) is owned by entry 4, its first user (the banner-during-scroll test); `session-idle-empty-column.json` by entry 3 and `session-gave-up-after-commit.json` by entry 11, each scripted under the epic 3 regeneration rule (technical default, 2026-10-01).
- Decision: each entry carries `interface` (export and signature delta), `tests` (sentence → test ids) and `owns` (rules or shared setup it owns for the epic), as in epic 3 (B10) (technical default, 2026-10-01).
- Decision: an entry that changes the rendered Idle, Composing, Place or Game-over board regenerates the `board.screens.spec.ts` baselines in the Playwright container; entry 3 creates them (technical default, 2026-10-01).
- Decision: the refactor sweep (entry 13) is kept and carries R6, R7 and the AD-17 re-measure with the `architecture.test.ts` split if the median exceeds 5 s (spec CAP-10, 2026-10-01).
- Decision: Done when 6 (merge and deploy) has no entry: it is the owner-gated close-out after entry 13 and the retrospective; the epic is not finished when entry 13 is built (owner, 2026-10-01, F29).
- Decision: no entry is `hitl`; gates 3 and 4 run under the epic autopilot (owner, 2026-09-28, standing).
- Decision: owner answers 2026-10-01 recorded in the spec: F27 view/peek title and older-cards copy, F28 a platform-interrupted drag restores the earlier selection, F29 deploy alone; the AD-11 `bannerShown` spine report keeps its F20 default (Q-42 wins). Close-out doc edits (spine AD-11, AD-12, AD-13, AD-17, Proposed epics; EXPERIENCE.md message catalogue, Drop targeting step 6, Pointer thresholds) are listed in build-notes.md and folded at the retrospective, not by any entry.
- Decision: the draft check (2026-10-01) found 6 fixes and 6 suggestions (test names on entry 2, the placeholder screenshot spec deleted with the minimal board, entry 4 checks that need selection or the view sheet moved to entries 7 and 11, the new fixtures named in serialize.test.ts and architecture.test.ts, entry 12's fixture answered by session-won, F24 drag paths moved from entry 6 to entries 8 and 9, the Success-signal drag in entry 8's verify, the entry 5 handoff, screenshots in the verify of rendering entries, Done when 6 owner-gated); all applied as technical defaults; no entry added, removed or reordered.
- Assumption: CDP touch pans from a `pan-y` foot pad scroll the document and fire no `scrollend` before release (`unverified`, entry 4 checks; fallbacks in build-notes CAP-3); Chromium's pointer events on a disabled `<button>` (`unverified`, entry 7 checks; fallback wraps the hit area); the touch `pointerup` → `click` order (`unverified`, gated by entry 11's scrim-over-Undo case).
- Retrospective 2026-10-08: accepted-with-open-items; owner answers F36–F41; close-out docs C1–C38 and AGENTS.md G1–G4 (`bmad-project-context` refresh, owner-approved) applied; F37 fixed before the merge (90de645, 54dabda).
- Waits on epic-app-shell because: the game store, overlays core, nav adapter, `registerBeforeHide`, motion, text and the fixtures are its output; that container is done, so it does not gate the entries.
