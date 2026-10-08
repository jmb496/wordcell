# Review log — story-draft-wordcards-and-the-composing-tray.md (ticket 5.1)
State: pass 2: done

Mode: docs, thorough, max 7. Pass 0: 371 words (`.passes/pass0.md`). Intent fields from tickets.toml entry 1 (unknown, interface, tests, owns, consumers): `.passes/intent.md`.

## Pass 1 — 2026-10-08
Reviewers: builder's reading, edge-case hunter, adversarial, ref alignment  |  Findings: major 10, minor 8, decision-needed 0  |  Dropped in triage: 0 (duplicates merged across the four lenses)
Words (docs): 880 (2.37 x pass 0)  |  Snapshot: .passes/pass1.md, fix diff .passes/pass1.fix.diff
Fixer: all 18 applied; `npm run test:screens` checked against package.json, not run (design statement)
### Applied
- [major] Description — tickets.toml intent fields interface, tests, owns, consumers missing → fixer item 1
- [major] Description — Place render until entry 2 unspecified (F2 live strip; switch tests `place` before `draft`); 52-element check misses Place → fixer item 2
- [major] Verify vs tests — R-36 QU = 2 / R-37 QU P5 supp. unreachable (no fixture drafts card 35) → fixer item 3
- [major] Verify — R-32 (UI) outline and lock per row segment has no P5 → fixer item 4
- [major] Description — word-line shrink mechanism and test unspecified; fixtures never shrink → fixer item 5
- [major] Description — invalid line: ui-body 16 → 14 shrink, word-part ellipsis needs a text.ts split; dictionary.spec.ts R-38 consumer → fixer item 6
- [major] Description — `{#each}` key expression undefined in Column/WordCellRow (no `mirror` field); Tray already keyed; consumers unlisted → fixer item 7
- [major] Verify — screenshot baselines regeneration not sanctioned (SPEC CAP-1) → fixer item 8
- [major] Verify — free-letter tag asserted on session-composing, which has no free letter → fixer item 9
- [major] Description — ×2 badge 4.3-m4 has no test or reachable fixture → fixer item 10
- [minor] Verify — failed-Validate fixture/stub unnamed → item 11
- [minor] Verify — "52 … in each" ambiguous → item 12 (folded into 2)
- [minor] R-30 Place case must reorder the strip to tell wordCards from placementOrder → item 13
- [minor] Tag lookup miss: both a missing entry and an empty cell throw, fixed message; tag text is the cell number, top card → item 14
- [minor] Tag placement: card mode only here (compact marks entry 2) → item 15
- [minor] Game over: board.screens uses session-gave-up; add it to the empty-tray check → item 16
- [minor] Shrink at 14 px: clip, never wrap; band height stays `heights.tray` → item 17 (folded into 5)
- [minor] Cell-other-than-3 pin is entry 2's; add a UI Vitest on the lookup with a non-3 cell → item 18
### Default applied (technical)
- R-36/R-37 QU P5 supp. → engine V here; P5 supp. deferred to entry 2's session-place-compact Composing after one Undo
- Shrink → pure fit helper with UI Vitest `AD-3`; e2e asserts no overflow and size within 14…20 only
- Invalid line → text.ts word part + suffix, full sentence kept as one accessible text
- ×2 badge → positioned against the tile width; P5 bounding box where a `QU` block tile is reachable, else a browser check recorded in the plan
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- none

## Pass 2 — 2026-10-08
Reviewers: fix diff, edge-case hunter, adversarial, ref alignment  |  Findings: major 7, minor 10, decision-needed 0  |  Dropped in triage: 3 (duplicates merged; R-32 k = 1 demoted: entry 2 owns two segments across the row break)
Words (docs): 977 (2.63 x pass 0, over budget)  |  Snapshot: .passes/pass2.md, fix diff .passes/pass2.fix.diff
Fixer: all 7 majors applied; minors 8, 10, 12, 13, 15, 16 applied word-neutral; 9, 11, 14, 17 skipped (budget); `npm run test:screens -- --update-snapshots` checked against package.json and playwright.screens.config.ts, unverified (container not run)
### Applied
- [major] Tests — R-36/R-37 `QU` P5 supp. handed to entry 2, whose tickets.toml tests lack them → fixer item 1
- [major] Description Place clause — "compact tiles over one row" contradicts as-built `trayLayout` (card while one row fits) → fixer item 2
- [major] Verify — plain `npm run test:screens` never rewrites a changed baseline (`updateSnapshots: 'missing'`) → fixer item 3
- [major] Invalid line — "the suffix never shrinks" contradicts DESIGN.md (whole line shrinks, then word ellipsizes) → fixer item 4
- [major] Fit — helper range fixed 14…20 but the invalid line starts at 16; "pure" yet measuring under Vitest `environment: 'node'`; signature unspecified → fixer item 5
- [major] letters(n) — singular `1 letter` and the n = 1 case (SPEC CAP-1) dropped by pass 1 → fixer item 6
- [major] Verify ×2 badge — "where reachable" branch never applies; browser check has no criterion → fixer item 7
- [minor] lock count unscoped (live D card in column 6 also draws a lock) → item 8
- [minor] R-32 k = 1 fixtures pass trivially; multi-tile and row-break segments are entry 2's → item 9
- [minor] tag lookup has no named module → item 10
- [minor] trayOrder vs wordCards drift test → item 11
- [minor] R-30 side-left word line after Flip is entry 3's → item 12
- [minor] re-measure triggers miss mount / rejectedWord change → item 13
- [minor] Consumers: dictionary.spec ✕-glyph preceding-sibling and `.word-line` scope → item 14
- [minor] "fixed message naming the cell" self-contradictory → item 15
- [minor] shrink path never browser-exercised; open question moot → item 16
- [minor] `QU` D card underlined as one unit (DESIGN.md Typography) → item 17
### Default applied (technical)
- Fit helper → `fitSize(measure, box, max, min = 14)` integer px, measure injected; word line 20, invalid line 16; S with fake measure
- QU hand-off → Notes line naming the tests entry 2 must add (tickets.toml not edited by this loop)
- Baselines → `npm run test:screens -- --update-snapshots` in the container, then a plain green run
- ×2 badge → browser check recorded in the plan with a defined criterion
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- k = 0 no block drawn: trayOrder emits no mirrors, obvious handling
- duplicates of items 1, 2, 4, 5, 7 across lenses
