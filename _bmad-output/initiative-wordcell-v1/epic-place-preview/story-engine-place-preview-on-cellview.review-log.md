# Review log — story-engine-place-preview-on-cellview.md (ticket 11.1)

State: pass 3: done (converged)

Mode: docs, thorough, max 7, budget 1500 words. Pre-loop: HEAD b441eccd3fc5a9670e6e82fc7e8ed8f61c63cdae, copy `story-engine-place-preview-on-cellview.review-log.passes/pass0.md`, 205 words.
Refs: epic-place-preview.md, tickets.toml, docs/game-flow-spec.md (R-41, R-60, R-61, §9 Q-49), ARCHITECTURE-SPINE.md (AD-2, AD-3), AGENTS.md.

## Pass 1 — 2026-10-28
Reviewers: builder's reading, edge-case hunter, adversarial, ref alignment  |  Findings: major 5, minor 7, decision-needed 0  |  Dropped in triage: 0 (duplicates merged: commit path ×4, absence ×4, count ×2, property ×3, fixture list ×3, R-50 ref ×2)
Words (docs): 393 (1.92 x pass 0)  |  Snapshot: story-engine-place-preview-on-cellview.review-log.passes/pass1.md
Fixer: all 12 items applied, no conflicts; no commands touched.
### Applied
- [major] Description — "the engine's commit path" unnamed and commands.ts `confirm` only rewrites the Session; builder guesses between `apply(confirm)` in `view()`, a copy, or `commitMove` → fixer item 1 (default: `commitMove(position, placed(draft))` from src/engine/rules.ts on `viewFrom`'s committed-prefix position; add rules.ts to References)
- [major] Description — `count` not defined as card count; view.ts `count` is the R-85 letter count (QU = 2) → fixer item 2
- [major] Description/AC — "absent" undefined; `preview: undefined` would pass and break AD-3's omitted-field convention → fixer item 3
- [major] AC — absence cases miss the real boundary: Composing reached by undo from Place (`reached` ≥ place) and Idle with a pending draft carrying a target → fixer item 4
- [major] AC — the property runs one way only (never checks unchanged cells have no `preview`) and only on stored fixtures, not after a retarget/reorder → fixer item 5
- [minor] AC — "each Place fixture" open-ended; name the six `fixtures/session-place*.json` → fixer item 6
- [minor] AC — test naming: every new test starts `Q-49 AD-3`, the used-target one also R-41 (R-50 is (UI)-tagged) → fixer item 7
- [minor] Description — say `used` and the other CellView fields are unchanged → fixer item 8
- [minor] References — add R-50 and R-52 → fixer item 9
- [minor] AC — target change: state the old target's expected preview (removed if unused, card-beneath if used) → fixer item 10
- [minor] AC — "Game over" → status won and gaveUp → fixer item 11
- [minor] AC — used target with and without cards beneath its used card → fixer item 12
### Default applied (technical)
- Description — commit path → `commitMove(position, placed(draft))` (rules.ts)
- AC — property inputs → the six `fixtures/session-place*.json`, as stored and after a `setTarget` to each other legal target and a reversed `setPlacementOrder`
- AC — absence assertion → `Object.hasOwn(cell, 'preview')` false
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- none (all duplicates merged above)

## Pass 2 — 2026-10-28
Reviewers: fix diff, edge-case hunter, adversarial, ref alignment  |  Findings: major 1, minor 9, decision-needed 0  |  Dropped in triage: 2 (+ duplicates merged: QU count ×2, setTarget ×2, toml sync ×2)
Words (docs): 506 (2.47 x pass 0)  |  Snapshot: story-engine-place-preview-on-cellview.review-log.passes/pass2.md
Fixer: all 9 items applied, no conflicts; no commands touched.
### Applied
- [major] AC absence bullet — no Composing absence case must hold a used cell, so `used || cell === target` without a phase check passes; require a free letter in plain Composing (view.test.ts `FREE`) and in Composing reached by undo from Place (`COMPOSING_FROM_PLACE`), asserting the used cell has no `preview` → fixer item 1
- [minor] AC — no case pins card count vs letter count; name the -compact fixture (QU, card 35) as the case that tells them apart → fixer item 2
- [minor] AC setTarget bullet — old used target whose only card is the used one gets `top` null; new target's `top` is the last card of `placementOrder`; test both old-target kinds (e.g. session-place-free-letter-two-cards) → fixer item 3
- [minor] AC absence bullet — the "keyed on `placed(draft)`" clause names the wrong reason for most cases; reword per case or cut → fixer item 4
- [minor] AC property — retarget and reversed order each applied separately to the stored fixture → fixer item 5
- [minor] AC — single-card used cells exist in no fixture; name the route (D2 start seam / test-helpers `startOf`, or a `play` chain with an inline dictionary) → fixer item 6
- [minor] References — add src/engine/replay.ts (`replayWords`) and src/engine/test-helpers.ts → fixer item 7
- [minor] AC — "two used cells": neither the target → fixer item 8
- [minor] AC — the used-target test also asserts `cards` is the current pre-commit list and `used` true (Q-49 R-65 view keeps current cards) → fixer item 9
### Default applied (technical)
- AC — single-card used positions → built through the D2 start seam (`startOf`) or an inline-dictionary `play` chain
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- tickets.toml entry 1 out of sync with the hardened ticket (×2) — outside the target; this run may commit only the ticket and its log, and an uncommitted toml edit would leave the tree dirty for bmad-build-auto; carried to the result for the caller
- Description "never a second copy … nor a re-entrant apply/view" not enforceable by a unit test — a code-review check by nature; adding procedure words buys nothing

## Pass 3 — 2026-10-28
Reviewers: fix diff, edge-case hunter, adversarial, ref alignment  |  Findings: major 0, minor 11, decision-needed 0  |  Dropped in triage: 0 (duplicates merged: only-card route ×3, R-65 ref ×3, R-41 name position ×2)
Words (docs): 506 (2.47 x pass 0)  |  Snapshot: story-engine-place-preview-on-cellview.review-log.passes/pass2.md (no fix this pass)
### Applied
- none (converged; minors listed below)
### Default applied (technical)
- none this pass
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- none

## Result — converged after 3 passes
Majors per pass: 5, 1, 0. Decision-needed: none. Technical defaults applied: 4 (commit path `commitMove`; property inputs and variants; `Object.hasOwn` absence; only-card positions via the D2 seam or an inline-dictionary `play` chain). Words 205 → 506.

Unapplied minors (for the build's plan or a later loop):
- AC bullet 1 — "each also asserting `used` true" reads as covering the unused target too; make it "each used target also asserting `used` true" (the `cards` pre-commit check applies to all three).
- AC bullet 3 — "the only-card cases above" misses bullet 5's old used target with only its used card (`top` null); read as "every only-card case in this list".
- AC bullet 3 — `startOf` only builds a `Start`; the visible route is `viewFrom(start, seam(start, …), LANG)` (view.test.ts `seam`), as the R-86 tests do.
- AC bullet 7 — the JSON fixtures reach a `Session` through `parseSession(JSON.stringify(fixture), EN)` asserted `ok` (serialize.test.ts pattern); a raw import types `phase`/`reached` as `string`.
- AC bullet 2 — pin `count` for used non-target cells too (0 for the one-card case, current length − 1 with cards beneath).
- AC bullet 6 — Idle with a pending draft at `reached` = place has no ready constant; e.g. `play(PLACE_R41, [UNDO, UNDO])`.
- AC bullets 1/7 — also cover Place reached by undo from Idle (`PLACE_FROM_IDLE`), `PLACE_L10` and Place reached by `redo` from `COMPOSING_FROM_PLACE` (engine half of E5).
- AC bullet 5 — after the reversed `setPlacementOrder`, assert the target's `top` is the original first card, `count` unchanged, used cells' `preview` unchanged.
- References — add R-65 to the rules line (cited in AC bullet 1).
- AC bullets 1–5 — assert literal `top`/`count` values; the property's `confirm` oracle runs through the same `commitMove`, so it proves wiring and the presence set, not the commit itself.
- AC bullet 6 — extend the existing AD-3 "GameView contract" no-`undefined` loop (view.test.ts:1000) to each `cells` entry.
- AC lead-in / bullet 1 — R-41 goes after the prefix: `Q-49 AD-3 R-41 …`.
- (pass 2, outside the target) tickets.toml entry 1 `description`/`verify`/`references` no longer match the hardened ticket (commitMove/rules.ts, R-50, R-52, the present-iff-changed property, won/gaveUp); sync it in the caller's next commit.
