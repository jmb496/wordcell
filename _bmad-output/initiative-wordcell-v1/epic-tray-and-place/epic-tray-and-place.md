---
type: epic
title: "Tray and Place"
parent: initiative-wordcell-v1
covers: []
after: [epic-board-and-gestures]
assignee: ""
risk: high
---

# Tray and Place

## Description

Turns the epic 4 static tray (epic 4 SPEC F2) into the working tray and Place screen, so a whole move can be played on a phone from pick-up to commit: the tray's word line, tiles, destination block and control row with the D-block controls (`−`/`+`, `⇄ Flip`, the empty-destination caption); tile tap-select, tap-swap and free-letter removal; tile drags with the pure `insertionIndex` (AD-12); free letters by tap and by drag from a WordCell top; Validate's states and the invalid-word line; the Place screen's target selection, placement strip with its `bottom`/`top` tags and meta line, and Confirm; FLIP and fly-to-cell for every card that changes place (AD-14, AD-10); tray growth wired into the layout (AD-11, DESIGN.md A-D4); and the winning-animation input guard (AD-14). It ends with the refactor sweep the epic 4 retrospective routed here (A5, A6, A9, C-UI1, C-E56). The epic spec `spec-epic-5-tray` (written next by `bmad-spec`) owns the capabilities, constraints, non-goals, decisions and open owner questions; its `rule-coverage.md` maps every (UI) sentence and spine behaviour to a capability and test kind, and `build-notes.md` holds the how.

## Outcome

On a phone a player can drop a tail, arrange the tray, add and remove free letters, set k and the side, validate, choose the target and order, and confirm a word that flies into its cell, with no drag ever required; the SPEC's Success signal is the measure.

## Requirements

The spec's capabilities replace this section: `_bmad-output/specs/spec-epic-5-tray/SPEC.md`, CAP-n. The epic has no parent ids; the source is spine Proposed epics row 5 (as amended at the epic 4 close-out, C19), epic 4 SPEC Non-goals (first bullet) and the epic 4 retrospective's epic 5 action items (A5, A6, A9, L1–L3, F40) plus the epic 3 carry-ins C-UI1 and C-E56.

## Done when

1. `npm run test:all` and `npm run test:screens` are green, and every `rule-coverage.md` row whose Kind includes P5 has a passing `android` Playwright test named with its id (`desktop` too where the row says so).
2. On `android` from `session-idle-empty-column` (cell 7 holds a top card), a whole move is played with taps only: tap-select a tail, tap-drop it, tap-add a free letter or tap-swap tiles into a dictionary word, Validate, tap a legal target, tap-swap the strip, Confirm; the word lands in the chosen cell in the chosen order, the score changes by the previewed delta, and the stored Session equals `current().session` after every step.
3. The same move by drag (tile reorder and free-letter drag into the tray at an insertion gap) gives the same Session; a tile released with under 25 % of its area over the tray band, and a free-letter drag released outside it, leave the stored Session byte-identical.
4. Idle, Composing, Place and Game over still render exactly 52 `data-card-id` elements (AD-14), mirrors take no part in the FLIP glide (the D-block parting shift excepted, AD-14), and the WordCell row's bounding box is unchanged after a tray growth to three compact rows.
5. During the winning fly-to-cell, a WordCell tap opens no view and a second tap on the primary action starts no new game (same seed, no new Session written), while Undo completes the animation and then undoes.
6. Once the owner gives the go-ahead (SPEC open question on merge and deploy), epic 5 is merged and deployed like epics 1–4, and the live site plays a word from drop to commit on a phone with no fatal surface.

## Boundaries

`src/ui/` (Tray and its parts, Card tile states, WordCellRow phase actions, ActionBar, gestures, layout tray wiring, motion and a FLIP module, overlays tile-selection state, text), `src/main.ts` (the controller wiring if it needs it, and the winning-guard and open-gesture tracker hide-clear registration, SPEC F8), the AD-3 `draft.wordCards` view field (`src/engine/view.ts` and its `R-30` tests, SPEC CAP-1), the test-only files `src/shell/game.svelte.test.ts` and `src/engine/serialize.test.ts`'s fixture list, `fixtures/` (scripted valid Sessions the spec names), `e2e/` and its helpers. Not the menu, dialogs, end sheet and its `finished`/`unfinished` wiring, panels, pending-draft line, keyboard map, focus moves or screen-reader labels, F39 (close the view before Undo/Redo/menu/keys), R4, I-68 or the retrospective A8 items (epic 6); not the service worker, device checks, Q-42's service-worker proof or the B9 dispatch replay cost (epic 7); SPEC.md Non-goals. No engine or shell source change other than `draft.wordCards` (AD-3, amended 2026-10-08); the R-02 golden deal literals stay byte-identical.

## References

- spec — _bmad-output/specs/spec-epic-5-tray/SPEC.md, Capabilities, Constraints, Non-goals, Decisions F1–F24, Open Questions (all answered), Upstream amendments
- spec — _bmad-output/specs/spec-epic-5-tray/rule-coverage.md, every table
- spec — _bmad-output/specs/spec-epic-5-tray/build-notes.md, close-out edit lists, As-built facts that bite, Component tree and modules, per-CAP notes, Sweep inventory
- spec — _bmad-output/specs/spec-epic-4-board/SPEC.md, Non-goals (first bullet: the epic 5 scope list), F1, F2, F13, F17, F23, F25, F26, F34, F39, F40
- retro — _bmad-output/initiative-wordcell-v1/epic-board-and-gestures/epic-board-and-gestures-retrospective.md, Action items A5, A6, A8, A9; Process L1–L3; Open questions 4 (F40)
- retro — _bmad-output/initiative-wordcell-v1/epic-app-shell/epic-app-shell-retrospective.md, C-UI1, C-E56
- rules — docs/game-flow-spec.md, R-30–R-42, R-50–R-52, R-60–R-62, R-65, R-70–R-73, §9 Q-02, Q-03, Q-06, Q-22, Q-23, Q-31
- architecture — _bmad-output/planning-artifacts/architecture/architecture-wordcell-2026-09-27/ARCHITECTURE-SPINE.md, AD-2, AD-3, AD-4, AD-10–AD-15, AD-17, AD-18, Proposed epics row 5
- design — _bmad-output/planning-artifacts/ux-designs/ux-wordcell-2026-09-27/DESIGN.md, Layout & Spacing (Tray band, A-D4), Components (Card states, WordCell, Tray band, Tile, D-block controls, Placement strip, Invalid-word message, Buttons)
- design — _bmad-output/planning-artifacts/ux-designs/ux-wordcell-2026-09-27/EXPERIENCE.md, Component Patterns (Tray band, Word line, Movable tile, Destination block, D-block controls, Validate, Placement strip, Confirm), Phase matrix, Composing the word, Place, Motion, Flows 1–3, Message catalogue
- constraint — AGENTS.md, Architecture rules 1–7, Policy, Conventions, Known pitfalls
- methodology — docs/development-methodology.md, Per-ticket loop, Autopilot, Definition of done

## Notes

- Decision: epic branch `epic-5-tray`, created from `main` after the epic 4 merge; every ticket's build precondition is a clean tree on it (owner prompt, 2026-10-08).
- Decision: the envelope is written before the spec; inception (the breakdown in `tickets.toml` beside this file) follows the spec and its owner answers (technical default, 2026-10-08).
- Decision: the refactor sweep carries more than ten inventory rows, so per retrospective L2 it is planned as two tickets at inception, code then paperwork (SPEC CAP for each) (technical default, 2026-10-08).
- Decision: every ticket keeps `npm run test:screens` (Docker in WSL2) in its checks (retrospective L3), and a ticket that changes an input to a shared rule lists the rule's other consumers in its ticket review (retrospective L1) (owner/process, 2026-10-08).
- Resolved 2026-10-08: the spec's owner questions OQ-1…OQ-7 are answered (SPEC F17–F23; F24 the owner's AD-11 amendment), so inception went ahead.
- Decision: the epic file edits build-notes lists as due before ticketing are applied at inception: Boundaries carry the AD-3 `draft.wordCards` engine change, the test-only `game.svelte.test.ts` and `serialize.test.ts` fixture-list edits and the `main.ts` winning-guard hide registration; Done when 4 reads "mirrors take no part in the FLIP glide (the D-block parting shift excepted, AD-14)" (owner-authorised AD-3/AD-14 amendments, 2026-10-08).
- Open item: the AGENTS.md Known pitfalls "Mirrors … never animate" edit (build-notes, due before CAP-5 is ticketed) goes through `bmad-project-context` and is not made by inception; SPEC Constraints AD-14 supersedes the old wording until it lands. Run it before entry 8 (the D-block mirror parting shift) builds (technical default, 2026-10-08).
- Decision: the tracer bullet is entry 1: engine `draft.wordCards` (AD-3) → `GameView` → `Tray.svelte` word line and Composing tiles, replacing the F2 static tray (technical default, 2026-10-08).
- Decision: CAP-1 is split into entries 1 (engine field and Composing tray, card mode) and 2 (Place strip, compact marks, `session-place-compact`); CAP-5 into entries 6 (pure `insertionIndex`, gap rects and parting offsets, also CAP-6's offset Vitest) and 7 (tile drag); CAP-8 into entries 10 (`flip.ts`, the kind table, the `act()`-button glides and the controller's glide finish in `pointerdown`/`cancel()`), 16 (the controller's release FLIP wiring and the press-path P5) and 11 (fly-to-cell); CAP-7's Success-signal moves into entry 17; CAP-3 (entry 4) lands before any tile gesture code (F14); the sweep is entries 14 (code, S1–S7, S18) and 15 (paperwork, S8–S13, S16) per L2; S14 rides entry 2, S15 entry 9, S17 entry 4 (technical default, 2026-10-08).
- Decision: 17 entries, past the typical 8–12, because they are one lane through `Tray.svelte`, `src/ui/gestures/`, `flip.ts` and `motion.ts` with one owner; entry 6 (pure functions only) may run beside entry 5; the autopilot runs table order (technical default, 2026-10-08).
- Decision: the Success signal (epic Done when 2 and 3: the tap-only move and its drag twin) is entry 17's, right after entry 9, the first point where every gesture it needs exists; Done when 1's P5 audit is entry 15's; Done when 4 is entries 1, 8, 10 and 12; Done when 5 entry 13 (technical default, 2026-10-08).
- Decision: each entry carries `interface`, `tests` and `owns` as in epics 3 and 4, plus `consumers` for retrospective L1 (the shared rule inputs it changes and their other consumers, listed in its ticket review); every UI entry's `verify` names `npm run test:screens` (L3) (technical default, 2026-10-08).
- Decision: new fixtures are owned by their first user: `session-place-compact` entry 2, the scripted free-letter Place fixture entry 9, a Success-signal start fixture (only if no tap-playable word exists) entry 17, the two long-word fixtures entry 12 (entry 8 scripts the Composing one early if its caret case needs it), `prefs-fast.json` entry 13; each session fixture joins `serialize.test.ts` VALID/REBUILDS and the AD-17 list in `src/architecture-ad2-ad12-ad17.test.ts` (technical default, 2026-10-08).
- Decision: Done when 6 (merge and deploy) has no entry: the owner said yes (F20); it is the close-out after entry 15 and the retrospective (owner, 2026-10-08).
- Decision: the draft check (2026-10-08) found 9 fixes and 12 suggestions: verify gaps on entries 3, 5, 7, 8, 9 and 10 (R-31 `+` bound, R-38 clearing, R-71 Place half, R-72, AD-13 back, F4 clip, free-letter cancel paths, ghost and mirror parting, the R-73 Place reload fixture, R-70 and F22), `test:screens` on entry 6, the S1 `tapAt` handoff (entries 3 and 14), the long-fixture handoff (entries 8 and 12), entry 13 after entry 12 (both touch the `flip.play` path), entry 10 split into 10 and 16, the Success signal moved to entry 17, the Done when 1 audit on entry 15, R-65 Place peek on entry 9, L1 `consumers` on entries 2, 11 and 14, the fixture count worded per fixture; all applied as technical defaults. Not applied: splitting entry 5 (kept whole, one clear-rules function). Spec typo for the retrospective: SPEC CAP-3's heading cites F9 where F14 is meant.
- Decision: no entry is `hitl`; gates 3 and 4 run under the epic autopilot (owner, 2026-09-28, standing).
- Waits on epic-board-and-gestures because: the layout definition, geometry and gate, the pointer controller with targeting and `act()`, the slot-wrapper card and AD-14 identity, the Board in every `GameView` state with the static tray, the overlays store, motion and text modules, the touch helpers and fixtures are its output; that container is done, so it does not gate the entries.
