# Review log — story-wordcell-row-place-preview.md (ticket 11.2)

State: pass 3: done

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

## Pass 2 — 2026-10-28 17:20
Reviewers: fix diff, edge-case hunter, adversarial, ref alignment  |  Findings: major 3, minor 7, decision-needed 0  |  Dropped in triage: 0 (duplicates merged: mirror marker / redo-tail own-free-letter preview ×3, pill–badge viewport ×3, `cell.cards` wording ×2, cell above L ×2)
Words (docs): 1001 (2.81 x pass 0, under the 1500 budget)  |  Snapshot: story-wordcell-row-place-preview.review-log.passes/pass2.md
Fixer: all 9 items applied, no conflicts; no commands touched (selectors are prose).
### Applied
- [major] Description/AC — no DOM marker tells a `preview` mirror from a `used` one, yet the flip.ts capture skip, the flip.test.ts fake, the :249 count and "no used card drawn" depend on it; on session-place-free-letter-redo-tail the target's correct `preview.top` is its own used card 28, so "no WordCell child is a used card" contradicts E2 and id-only checks pass for the wrong reason → fixer item 1
- [major] Description — "narrowest `android` viewport" is ambiguous (the project is Pixel 7, 412 px; the A-D3 minimum is 360 px, where the ★ pill and a two-digit badge meet) and no outcome is given if they overlap → fixer item 2
- [major] AC — E2 "its current top is not shown" has no R-50/Q-49-named test on a non-empty target that is not used (session-place-onto-committed cell 3, preview 26, count 6) → fixer item 3
- [minor] Description — "nothing about a changed cell is drawn from … `cell.cards`" and "the target hides its current top" misread against AD-14 (hidden live elements stay; a used card gets no element in its cell) → fixer item 4
- [minor] Description — the used cell above L should be the one with cards beneath (≥ 3 cards) so the 35 % dim covers a preview card, ★ and badge → fixer item 5
- [minor] References — add AD-17 (seeding, valid-fixture list, baselines) → fixer item 6
- [minor] References/AC — e2e/tray.spec.ts (:416 `wordcell-4 [data-mirror-of="35"]` `.used` on compact) and e2e/board.spec.ts (F11 cell 3 `28m`) also pin the used look in Place → fixer item 7
- [minor] Description — the ★ pill draws over the card flourish without suppressing it, as the count badge does → fixer item 8
- [minor] AC — the orange ★ on `surface-raised` gets a 3:1 row in src/ui/theme/contrast.test.ts; a failing theme goes to Jared at the plan checkpoint, tokens unchanged → fixer item 9
### Default applied (technical)
- mirror marker → the `preview` kind sets a `preview` class on the Card wrapper (as `used` does); capture, fake and e2e exclusions use `[data-mirror-of]:not(.preview)`; "no used card drawn" = no `.used` mirror in any WordCell in Place
- pill–badge check → a Playwright geometry assertion (rects do not intersect) on session-place-long at 360 px width (A-D3) on the `android` project; an intersection stops the build at the plan checkpoint for Jared (moving a mark changes the DESIGN.md look)
- flourish → not suppressed by the pill
### Decision needed (functionality / UX / gameplay)
- none (watch: if the ★ pill and a two-digit badge intersect at 360 px, which mark moves is the owner's call; the ticket routes it to the plan checkpoint)
### Dropped
- none

## Pass 3 — 2026-10-28 17:45
Reviewers: fix diff, edge-case hunter, adversarial, ref alignment  |  Findings: major 2, minor 13, decision-needed 1  |  Dropped in triage: 0 (duplicates merged: pill/badge checkpoint timing ×4, theme-art TH-9 ×2, contrast figure ×2); reclassed major → minor: ★ absence checks (edge), retarget onto a non-empty unused cell (adversarial) — the ticket already says where the pill is set and renders from `preview` presence, so these are test precision
Words (docs): 1223 (3.44 x pass 0, under the 1500 budget)  |  Snapshot: story-wordcell-row-place-preview.review-log.passes/pass3.md
Fixer: all 15 items applied, no conflicts; contrast figure re-checked (5.01); Description split into five bullets; no commands touched.
### Applied
- [major] AC, session-place-long pill/badge clause — the failure goes to "the plan checkpoint", which precedes the code the Playwright rect check needs; nothing says what an unattended build does if it fails after approval; the pill box width is unfixed → fixer item 1
- [major] AC/References — e2e/theme-art.spec.ts:113-127 `AD-14 TH-9 … a used face keeps its hatch and no texture` opens redo-tail in Place and counts `.card.used .face`; unlisted, and rewriting it to the preview loses the TH-9 used-hatch coverage → fixer item 2
- [minor] AC — ★ absence: none on an unchanged cell in Place, none after Undo to Composing, none after Confirm's last landing → fixer item 3
- [minor] AC/fixture — retarget onto and away from a non-empty unused legal cell (no fixture has one) → fixer item 4
- [minor] Description — "a used card gets no element in its cell" contradicts redo-tail's `preview` mirror of 28 → fixer item 5
- [minor] Description — flip.ts/flip.test.ts selector is `:scope > [data-mirror-of]:not(.preview)`; the e2e count keeps `[data-wordcell] [data-mirror-of]:not(.preview)` → fixer item 6
- [minor] AC — contrast row pins Charcoal 5.0 (computed: #ef7a3d on #282c34 = 5.01; other themes 5.1–8.2, all pass); the DESIGN.md contrast-figure addition goes to entry 5 (E8) → fixer item 7
- [minor] AC — e2e/board-phases.spec.ts AD-14 state table: every Place row's `mirrors` gains its target's `preview.top`, and the table records mirror kind → fixer item 8
- [minor] AC — compact retarget onto cell 4: no `.used` mirror and no element for 35, its card beneath 28 hidden → fixer item 9
- [minor] Description — the fly-to-cell Undo-back-to-Place check keeps the `:not(.preview)` count 0 and asserts one `.preview[data-mirror-of="28"]` in wordcell-3 → fixer item 10
- [minor] AC — Undo of a commit shows the preview from the first frame while the live face glides to the strip (mirrors never animate, AD-14); no hold added → fixer item 11
- [minor] Description — interim: until entry 3 every target's Confirm hold is the existing one (a non-used target's previous top shows under the flying cards); only the Place start checks change → fixer item 12
- [minor] AC — E5 main case: long-press on session-place-onto-committed target 3 lists 42, 0, 28 with `top` on 28 → fixer item 13
- [minor] Description — "numbered above it" → "above the word's letter count L" → fixer item 14
- [minor] Description — split the one ~600-word sentence into bullets, no new content → fixer item 15
### Default applied (technical)
- pill/badge check → the plan computes both rects at 360 px from src/ui/layout/geometry.ts and the planned CSS (pill box 16 × 16 px, ★ centred) and states the result for the checkpoint; the Playwright rect assertion stays; if it fails after approval the build stops and reports to Jared, moving no mark and loosening no assertion
- TH-9 → moves to Composing (same fixture, one Undo), assertions kept
- contrast figure → 5.0 for Charcoal
### Decision needed (functionality / UX / gameplay)
- Description/AC, ★ pill — at the 360 px minimum width (40 px card) a WordCell that will hold 10 or more cards after the word shows a two-digit count badge at bottom-right that likely touches or overlaps the ★ pill at bottom-left (computed overlap about 0–4.5 px, font-dependent); DESIGN.md places both at fixed corners and says nothing about a collision — which mark gives way? — proposed default: keep both at their DESIGN.md corners and draw the count badge above the ★ pill where they meet; Jared judges it at the entry 5 device read
### Dropped
- none
