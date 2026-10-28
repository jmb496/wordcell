# Review log — story-wordcell-row-place-preview.md (ticket 11.2)

State: pass 1: done

Mode: docs, thorough, max 7, budget 1500 words (as ticket 11.1). Pre-loop: HEAD 30dc371caccb1ed95c869a749ef06e0f81a1701f, copy `story-wordcell-row-place-preview.review-log.passes/pass0.md`, 356 words.
Intent carried from tickets.toml entry 2 and not copied into the ticket: `plan_checkpoint = true` (the fixer adds it to the Description in pass 1).
Refs: epic-place-preview.md, tickets.toml, docs/game-flow-spec.md (Q-49, R-33, R-41, R-50, R-65, R-70, R-71, R-73), DESIGN.md (Components → WordCell, place preview), EXPERIENCE.md (Place, message catalogue), ARCHITECTURE-SPINE.md, AGENTS.md, story-engine-place-preview-on-cellview-plan.md (ticket 11.1 plan, done).

## Pass 1 — 2026-10-28 16:55
Reviewers: builder's reading, edge-case hunter, adversarial, ref alignment  |  Findings: major 6, minor 11, decision-needed 0  |  Dropped in triage: 1 (duplicates merged: fly-to-cell hold ×4, not-legal fixture ×4, ★ source ×3, card-level name ×4, `, used` test ×4, fixture name/registrations ×4, preview.top ×2, baselines ×2, references ×3)
Words (docs): 775 (2.18 x pass 0)  |  Snapshot: story-wordcell-row-place-preview.review-log.passes/pass1.md
Fixer: all 17 items applied, no conflicts; no commands touched. Fixer note: tickets.toml entry 2 still holds the pre-loop text (out of scope for this loop).
### Applied
- [major] Description, fly-to-cell clause — with no used mirror in Place and the capture skipping the `preview` mirror, `inFlight.used` stays empty, so the redo-tail F28 in-flight `m28` checks (fly-to-cell.spec.ts:196-204, the reduced-motion test) and the Undo-back-to-Place mirror count (:249) fail; "keeps green" vs "the hold is entry 3's" is a guess → fixer item 1
- [major] AC, 35 % dim on a not-legal changed cell — no existing or required fixture has a used cell above L (every used cell is 3 or 4 ≤ L) → fixer item 2
- [major] Description, ★ pill — where it lives is unspecified; a used non-target cell's shown top is a live card, entry 4's scene draws static `Card`s → fixer item 3
- [major] Description/AC, names — card-level `{L}, WordCell {c}, top` button in a changed cell unspecified (card beneath, hidden current top, unnamed mirror) → fixer item 4
- [major] AC, "updated, not deleted" — the only e2e `, used` name test (screen-reader.spec.ts:294) runs in Place; rewriting it drops Composing `, used` coverage → fixer item 5
- [major] AC — no test for the stated AD-14 constraints (preview mirror `data-mirror-of`, no card id/testid, no FLIP; 52 live elements; no used card drawn) → fixer item 6
- [minor] Description — `plan_checkpoint = true` from tickets.toml entry 2 not in the ticket → fixer item 7
- [minor] Description — fixture name placeholder (entry 5 hands it to device-preview) and its registrations (AD-17 list, serialize.test.ts VALID/PROPERTIES/REBUILDS, view.test.ts Q-49 property loop) → fixer item 8
- [minor] Description — "the strip's last card" invites `placementOrder.at(-1)`; read `cell.preview.top`/`count` (AD-3) → fixer item 9
- [minor] Description — in Place a changed cell's empty outline and badge come from `preview` (`top === null`, `count >= 2`), not `cards.length` → fixer item 10
- [minor] AC — baseline scope: board.screens.spec.ts (`place`, `place-compact`) and every theme-*.screens.spec.ts; no other baseline changes → fixer item 11
- [minor] References — add flip.ts, flip.test.ts, wordcell-view.spec.ts, place.spec.ts/flip.spec.ts mirror checks, serialize.test.ts, architecture-ad2-ad12-ad17.test.ts, view.test.ts → fixer item 12
- [minor] AC — R-65 press boundaries stay on current `cards`: long-press on an empty target showing a preview opens no view; on a used single-card cell drawn empty it lists its one card → fixer item 13
- [minor] AC — retarget onto and away from a used cell (session-place-compact cell 4) → fixer item 14
- [minor] AC — Undo of a commit (Idle → Place) shows the preview → fixer item 15
- [minor] AC — new screen-reader tests named `A-E9 Q-49 …` → fixer item 16
- [minor] AC — ★ pill vs a two-digit badge at the narrowest card width (session-place-long, 15 cards) checked in the plan → fixer item 17
### Default applied (technical)
- fly-to-cell interim → the capture skips the `preview` mirror; until entry 3 a used target's in-flight hold shows no used mirror (the card beneath, per the current `lowest − 1` rule); entry 2 updates the redo-tail in-flight assertions, the :249 count (excluding `preview` mirrors) and flip.test.ts's fake selector to that interim; entry 3 rewrites them (branch-only, never shipped)
- not-legal fixture → `fixtures/session-place-used-cells.json` holds a used non-target cell numbered above the word's letter count
- ★ pill → a `Card.svelte` prop drawn inside the card rect, set by WordCellRow on the shown top of a non-empty preview (live card beneath or `preview` mirror), reused by entry 4 on a `static` card
- card-level name → in Place a changed cell exposes no named card button (as a used cell today); its group's `, after this word` name carries it
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- desktop hover-peek check on a changed cell — same `cell.cards` source as the long-press view; the android view check covers E5
