---
type: epic
title: "App shell services"
parent: initiative-wordcell-v1
covers: []
after: [epic-rules-engine]
assignee: ""
risk: medium
---

# App shell services

## Description

Builds the shell around the engine on a minimal board: the game store with its states, dispatch and feedback (AD-4), stateless storage (AD-7), seed (AD-5), the passive clock and the store-owned lifecycle (AD-9), the score-history store (AD-6), dictionary load and retry (AD-8), prefs and motion (AD-10), the nav adapter with an overlays core (AD-13), the fatal surface (AD-15), boot order minus the service worker (AD-16), and the test-hook accessors with the restore-boundary Playwright suite (AD-17). It also absorbs the epic 2 retrospective carry-ins B6–B11 and removes the transitional `deal`/`Card` export. The epic spec `spec-epic-3-app-shell` owns the capabilities (CAP-1…CAP-11), constraints, non-goals and decisions E1–E11; `rule-coverage.md` maps every app-shell sentence to its test kind, `build-notes.md` holds the how, and `SPEC.review-log.md` lists eight open review majors that the entries below carry.

## Outcome

A player's game survives every hide, reload and Android kill at the exact phase, a save the build cannot read is kept until New game, and epics 4–6 add only presentation and input; the SPEC's Success signal is the measure.

## Requirements

The spec's capabilities replace this section: `_bmad-output/specs/spec-epic-3-app-shell/SPEC.md`, CAP-1…CAP-11. The epic has no parent ids; the source is spine Proposed epics row 3 and the epic 2 retrospective action items B6–B11.

## Done when

1. `npm run test:all` is green, and every `rule-coverage.md` row whose Kind includes P3 has a passing `android` Playwright test named with its id.
2. On the minimal board a seeded Place Session with a free letter, a non-default order and a redo tail survives a hide-and-reload, a plain reload and a renderer crash with every Session field equal and `activeMs` not smaller.
3. A Session saved in format version 3 shows the Session-rejected message, is byte-identical in storage after a reload, and is replaced only by New game.
4. Redo onto a winning commit appends its record with the history written before the Session, Undo removes it, and a failed Session write restores the previous history (Q-39).
5. `src/engine/index.ts` exports exactly AD-2's names (a compiler-API test), and the `R-02 golden deal` literals are byte-identical.
6. Once the owner merges and deploys, the live site boots a fresh deal, keeps it across a reload, and shows no fatal surface.

## Boundaries

The shell (`src/shell/`), `src/main.ts`, the minimal board and its surfaces in `src/ui/` (E1–E3), engine carry-ins (CAP-1, CAP-2), `fixtures/` and `e2e/`. Not gestures, layout, tray, menu, end sheet, panels, keyboard or timer display (epics 4–6), not the service worker or `requestPersistence()` (epic 7); SPEC.md Non-goals.

## References

- spec — _bmad-output/specs/spec-epic-3-app-shell/SPEC.md, Capabilities, Constraints, Decisions
- spec — _bmad-output/specs/spec-epic-3-app-shell/rule-coverage.md, every table
- spec — _bmad-output/specs/spec-epic-3-app-shell/build-notes.md, per-CAP notes, Fixtures and Spine notes
- spec — _bmad-output/specs/spec-epic-3-app-shell/SPEC.review-log.md, Pass 3 open majors and minors (carried by the entries)
- rules — docs/game-flow-spec.md, §2, R-38, R-73, R-74, R-76, R-84, §7.10, §9 Q-29, Q-33, Q-36–Q-43
- architecture — _bmad-output/planning-artifacts/architecture/architecture-wordcell-2026-09-27/ARCHITECTURE-SPINE.md, AD-1, AD-2, AD-4–AD-10, AD-13, AD-15–AD-17, Proposed epics row 3
- design — _bmad-output/planning-artifacts/ux-designs/ux-wordcell-2026-09-27/EXPERIENCE.md, Message catalogue, State Patterns, Information Architecture, Flow 5, Flow 7
- design — _bmad-output/planning-artifacts/ux-designs/ux-wordcell-2026-09-27/DESIGN.md, Components (Buttons, Dialog, History notice, Blocking message, Dictionary-failed banner)
- retro — _bmad-output/initiative-wordcell-v1/epic-rules-engine/epic-rules-engine-retrospective.md, Action items B6–B11
- constraint — AGENTS.md, Architecture rules 1–7, Policy, Conventions, Known pitfalls
- methodology — docs/development-methodology.md, Per-ticket loop, Autopilot, Definition of done

## Notes

- Decision: epic branch `epic-3-shell`, created from `main` at 8e5462f; every ticket's build precondition is a clean tree on it (owner prompt, 2026-09-30).
- Decision: the tracer bullet is entry 1: removing the D1 export forces the first store cut, so engine → `game.svelte.ts` → `view` → `App.svelte` connects in the first ticket (owner prompt put B6, B7 and the D1 removal first, 2026-09-30).
- Decision: CAP-3 is split into entries 3 (store load, dispatch, storage, test hooks, Undo/Redo) and 4 (primary action, New game/Replay, feedback, the rest of R-73/R-74 and the kill variant), each one session (technical default, 2026-09-30).
- Decision: entries 3–11 form one lane because each edits `src/shell/game.svelte.ts`, `src/main.ts` or `src/ui/App.svelte`; entry 2 (engine only) may run beside entry 3. The autopilot runs table order (technical default, 2026-09-30).
- Decision: each entry carries `interface` (export and signature delta), `tests` (sentence → test ids) and `owns` (rules or shared setup it owns for the epic), per retro B10, applied as the recommended default subject to the owner's B10 decision (2026-09-30).
- Decision: the refactor sweep (entry 12) is kept and also lands the shared Playwright config base (B11, E9) (technical default, 2026-09-30).
- Decision: no entry is `hitl`; gates 3 and 4 run under the epic autopilot (owner, 2026-09-28, standing).
- Decision: the spec review loop diverged at pass 3 (majors 11, 7, 8); its eight open majors are assigned to entries 1, 2, 5, 7, 9 and 11 below, and each entry's own review loop hardens them (technical default, 2026-09-30).
- Assumption: screenshot baselines are regenerated in the Playwright container by entry 3 when the placeholder board moves onto a seeded fixture (Docker in WSL2 is available, AGENTS.md).
- Waits on epic-rules-engine because: the engine surface, command table, fixtures and golden test are its output; that container is done, so it does not gate the entries.
- Decision: the draft check (2026-09-30) found 7 fixes and 9 suggestions (the Done when 2 crash mode, Q-29 history untouched, halt API owned by entry 5, test-id naming, dispatch measurement at 4× throttling, and other coverage gaps); all applied as technical defaults; no entry added, removed or reordered.
- Decision: when a Blocking message (fatal error, another window, rejected save) replaces the board, keyboard focus moves to its button (Reload / New game) when it appears and when its cause changes (owner, 2026-09-30, from ticket 3.5's code review).
- Decision: owner, 2026-10-01: the History notice is not dismissed by a tap outside it (scrim); the player must press Not now or Reset history (back still acts as Not now, per EXPERIENCE.md). Keyboard focus starts on its Not now button (the non-destructive button). Supersedes this ticket's open question on scrim tap and initial focus.
- Decision: owner, 2026-10-01 (Q-42 under a controlling service worker): after a 404 on the word list, the banner's Reload retries the download in place while the banner stays visible; the page is never reloaded; if the word list loads, Validate works again. Supersedes this ticket's open question.
