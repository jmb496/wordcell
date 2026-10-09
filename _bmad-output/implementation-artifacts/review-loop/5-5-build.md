# Review loop — ticket 5.5 build (code mode, d2adfce..7866052)
State: pass 3: done

Target: `_bmad-output/implementation-artifacts/review-loop/5-5-build.passes/pass0.diff` (git diff d2adfce..7866052)
Intent: `_bmad-output/initiative-wordcell-v1/epic-tray-and-place/story-tile-tap-selection-swap-and-removal-plan.md`
Depth: thorough (correctness, edge cases, verification gap, intent alignment; fix diff from pass 2) | max 7
Pre-loop: HEAD 7866052b1d26b97661b78ab1185af679c52a8aa3, tree snapshot 0 484a106ddd4a9a975056cb19ce96bc4344c39726

## Pass 1 — 2026-10-09
Reviewers: correctness, edge cases, verification gap, intent alignment  |  Findings: major 2, minor 4, decision-needed 0  |  Dropped in triage: 2 (duplicates merged)
Snapshot: tree c0baa8f634eb00e9fbf5632d8a01452f7b5e32aa (fix diff 5-5-build.passes/pass1.fix.diff)
Fixer: all 5 applied; item 1 uses freeLetters [7, 4] (cell 7 top 13) and was shown to fail a `freeLetters[0]` mutant; item 3 row-2 swap skipped (no live tile in row 2 of session-place-compact + one Undo); orchestrator re-run: `npm test` 54 files, 2125 passed; lint clean (196 files); check 0 errors; fixer ran e2e/tile-tap.spec.ts android 20 passed.
### Applied
- [major] src/ui/gestures/tile.test.ts, controller.test.ts tileView — every free-letter removal test runs on a draft with one free letter, so a `freeLetterCell` returning `freeLetters[0]` would pass; add a second free letter listed first and assert both removals pick their own cell → fixer item 1
- [major] e2e/tile-tap.spec.ts:295, :316, :306, :418, :431, :449, :159 — P5 names claim ids they do not cover (R-41 is ticket 7's; hide/show, full pitch, back led by R-33; `R-35 (UI)` though R-35 has no (UI) tag); rename to the owning id (R-40/F13, AD-9 F1, AD-12 F2, AD-13), merged with intent-alignment minor on :306 → fixer item 2
- [minor] controller.test.ts F2 pitch case / e2e/tile-tap.spec.ts:431 — the ticket's "press in the selected tile's own half-gap resolving to it" is only true by stub construction; add a P5 tap in the selected row-1 tile's half-gap (deselects, Session unchanged) and a selected row-2 tile tapped in row 1's lower half-gap (swaps) (merged with edge-case minor) → fixer item 3
- [minor] controller.test.ts 'AD-12 epic 5 tile tap' — sticky view continuation, scrim tap and back closing a view keep the selection with no controller test → fixer item 4
- [minor] e2e/tile-tap.spec.ts:198 non-word swap step — no `expectSelected(page, null)` after the swap → fixer item 5
### Default applied (technical)
- e2e/tile-tap.spec.ts names — lead each test with the id that owns the behaviour (AD-n or SPEC F-id), never an id another ticket covers
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- edge-case half-gap finding — duplicate of verification-gap minor 3 (merged)
- intent-alignment hide/show rename — duplicate of verification-gap major 2 (merged)

## Pass 2 — 2026-10-09
Reviewers: fix diff, edge cases, verification gap, intent alignment  |  Findings: major 2, minor 1, decision-needed 0  |  Dropped in triage: 0
Snapshot: tree dc2209c430d831ce24ba9d7bbce604b50e036a6f (fix diff 5-5-build.passes/pass2.fix.diff)
Fixer: all 3 applied; plan gained a Sentence → test section after Acceptance Criteria (table + exempt list by owning ticket); name scan also dropped R-33 from the session-composing swap test, R-34 → R-51 on the two strip tests, and (UI) from AD-led names; new controller case 'AD-12 F1 Place: a legal non-current cell dragged ≥ 8 px …'. Orchestrator re-run: `npm test` 54 files, 2126 passed; lint clean (196 files); check 0 errors; fixer ran e2e/tile-tap.spec.ts android 20 passed.
### Applied
- [major] story-tile-tap-selection-swap-and-removal-plan.md — no sentence → test mapping or exempt-sentence list (AGENTS.md Conventions); add a table of the rule-coverage.md rows this ticket owns with the exact test per sentence and the exempt (other-ticket) sentences → fixer item 1
- [major] e2e/tile-tap.spec.ts:283, :328 — names still claim ids the tests do not cover (`R-33 (UI)` for the untagged used/empty no-op sentence; `R-33 R-31 (UI)` on outside-tap clears with no WordCell tap and R-31 has no (UI) tag) → fixer item 2
- [minor] controller.test.ts 'AD-12 epic 5 tile tap' — SPEC CAP-4's drag from a legal non-current Place cell (dispatches nothing, clears) has no controller case → fixer item 3
### Default applied (technical)
- plan mapping — table form like story-controller-seams-plan.md's sentence → test section
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- none

## Pass 3 — 2026-10-09
Reviewers: fix diff, edge cases, verification gap, intent alignment  |  Findings: major 2, minor 6, decision-needed 0  |  Dropped in triage: 0
Snapshot: tree 45648dc7810e93fe9b38e4821c4bb08560b9967d (fix diff 5-5-build.passes/pass3.fix.diff)
Fixer: all 8 applied; item 1 test 'AD-12 CAP-8 a crossed mouse tile press released over a Composing destination card repaints the k hover at pointerup' fails without the fix; item 3 test renamed 'AD-12 CAP-4 a selected strip free-letter tile …'; item 8 via Card `tile.gapAbove/gapBelow` from TileRows `gaps(i)` (pseudo-element only). Orchestrator re-run: `npm test` 54 files, 2127 passed; lint clean; check 0 errors; fixer ran tile-tap, board-phases, tray specs android 72 passed.
### Applied
- [major] src/ui/gestures/controller.ts pointerup `if (outcome !== 'drag' || tray) return;` — a tile/block press that crossed the threshold and ends in pointerup returns before `refreshHover()`, breaking epic 4 SPEC CAP-8's "repaints at every end of one" (verified: `end()` skips `up`, and before this diff the path reached `refreshHover()`); call it in the tray branch and add a controller test → fixer item 1
- [major] e2e/tile-tap.spec.ts:128-131, :179-180 — no test asserts that an unselected Composing free letter shows no `↩`, so `returnSlot={tags.has(id)}` would pass → fixer item 2
- [minor] plan Sentence → test R-35 row — strip free-letter test cited as R-35 (source tiles) → fixer item 3
- [minor] plan Exempt R-65 entry — "V here" names no test; cite the two controller peek cases → fixer item 4
- [minor] plan R-71 row — no-change swap clause unaddressed; note it is unreachable (second tap deselects) → fixer item 5
- [minor] controller.test.ts F25 detail-0 click — no block-mirror click with a tail selected (carve-out unproven for block) → fixer item 6
- [minor] plan AD-12 row — drag-as-tap/pointercancel clauses mapped to P5 tests that do not drag; map them to the V cases → fixer item 7
- [minor] Card.svelte `.card.tile.compact::before { inset: -2px 0 }` — extends 2 px on the outer edges too (row 1 into the word line, last row into the tray background), while the ticket splits only the row gaps → fixer item 8
### Default applied (technical)
- Card.svelte compact half-gap — restrict the 2 px extension to sides that face a row gap
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- none
