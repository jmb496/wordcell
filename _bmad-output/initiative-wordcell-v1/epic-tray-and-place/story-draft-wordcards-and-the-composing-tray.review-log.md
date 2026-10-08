# Review log — story-draft-wordcards-and-the-composing-tray.md (ticket 5.1)
State: pass 6: done (converged)

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

## Pass 3 — 2026-10-08
Reviewers: fix diff, edge-case hunter, adversarial, ref alignment  |  Findings: major 5, minor 12, decision-needed 0  |  Dropped in triage: 2 (duplicates merged; ×2 badge procedure demoted to minor: pass 2 gave a criterion, procedure detail belongs in the plan, over budget)
Words (docs): 1041 (2.81 x pass 0, over budget; growth from majors)  |  Snapshot: .passes/pass3.md, fix diff .passes/pass3.fix.diff
Fixer: all 5 majors and minors 6–14 applied (minors net word-neutral); `--update-snapshots` command marked unverified in the ticket
### Applied
- [major] Notes hand-off — R-36/R-37/R-30 `QU` P5 supp. (entry 2) and R-30 side-left word line after Flip (entry 3) have no owner in tickets.toml → fixer item 1
- [major] Invalid line measure — as-built word span clips, so a natural scrollWidth reads "fits" and the line never shrinks to 14 px → fixer item 2
- [major] Tag lookup throw — stated rule with no test; entry 4 must keep the string unchanged → fixer item 3
- [major] R-32 (UI) P5 — session-composing k = 1 passes trivially; board-phases already reaches a k = 2 Composing block → fixer item 4
- [major] Invalid line split — a leading space in a nowrap flex item collapses ("TANisn't…") while textContent still matches; baselines would bake it in → fixer item 5
- [minor] ×2 badge: box = face's tile-width span; state reached by a seed or scratch Session named in the plan → item 6
- [minor] lock located by `.lock` class (mirrors are aria-hidden) → item 7
- [minor] fit helper path `src/ui/tray/fit.ts`; fitSize S cases named AD-11 → item 8
- [minor] Tray switch on `view.place`, then `view.draft`, else empty → item 9
- [minor] invalidWord composed from the exported suffix (one literal); split invariant word + suffix === invalidWord(w) → item 10
- [minor] `--update-snapshots` command marked unverified in the ticket → item 11
- [minor] Consumers: e2e/board-phases.spec.ts (tray mirrors, svg.lock, F2 static-tray tests) → item 12
- [minor] word line details cite DESIGN.md Typography (letter-spaced, `QU` underlined as one unit) → item 13
- [minor] Notes open question states an answer; reword as a note → item 14
- [minor] view.test.ts AD-3 toStrictEqual literals gain wordCards — plan detail, not applied (adds words)
### Default applied (technical)
- Hand-off → this ticket's build appends the lines to tickets.toml entries 2 and 3 tests, named in the plan
- Invalid-line measure → unclipped natural width of the whole line content (probe), box = line width minus ✕ glyph and gap; fits means ≤
- R-32 P5 → k = 2 Composing (session-place-free-letter-redo-tail after Undo, as board-phases reaches it)
- Split gap → CSS gap, never a leading space in the suffix
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- clip-at-end stretch (no fixture or likely draft exceeds the box at 14 px)

## Pass 4 — 2026-10-08
Reviewers: fix diff, edge-case hunter, adversarial, ref alignment  |  Findings: major 2, minor 10, decision-needed 0  |  Dropped in triage: 3 (duplicates of the space contradiction; two stretch minors)
Words (docs): 1072 (2.89 x pass 0, over budget; growth from majors)  |  Snapshot: .passes/pass4.md, fix diff .passes/pass4.fix.diff
Fixer: both majors and minors 4, 7, 8 applied (net word-neutral); 3, 5, 6, 9 skipped (budget)
### Applied
- [major] Invalid line — pass 3's "gap is CSS, never a leading space" contradicts word + suffix === invalidWord(w) and the R-38 exact-text locator (textContent loses the space) → fixer item 1
- [major] Fit probe — an unnamed "max-content probe" invites a cloned text node, a second exact-text match that breaks the R-38 strict locator and doubles screen-reader text → fixer item 2
- [minor] invalid-line measure includes the word–suffix spacing; ✕ glyph fixed 16 px → folded into item 2
- [minor] R-33 (UI) P5 also asserts cell 3 is a `used` mirror, or the plan marks the tag check supplementary → item 3
- [minor] outline observable: one `.block.start` and one `.block.end` among tray-band mirrors → item 4
- [minor] Consumers: drag-interruptions, layout specs and e2e/helpers/board.ts → item 5
- [minor] Notes keep the intent's unknown, resolved by the plan's container run → item 6
- [minor] ×2 badge: right edge at the grid cell's x + tileWidth → item 7
- [minor] R-30 P5: tray DOM ids in order equal `draft.wordCards` → item 8
- [minor] Interface: Card.svelte gains the origin-tag prop → item 9
### Default applied (technical)
- Space → suffix without a leading space, `invalidWord` = `${W} ${suffix}`, a space text node between word and suffix spans inside one non-flex text element (✕ outside); S test word + ' ' + suffix === invalidWord(w)
- Probe → measure the line's own element under a temporary measuring class, never clone the text into the DOM
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- compact-mode tag gap until entry 2 (intermediate build not shipped); "computed size" vs F11 (range is text-independent); unverified parenthetical wording

## Pass 5 — 2026-10-08
Reviewers: fix diff, edge-case hunter, adversarial, ref alignment  |  Findings: major 1, minor 14, decision-needed 0  |  Dropped in triage: 5 (major duplicated across three lenses; plan-detail minors left to the plan)
Words (docs): 1082 (2.92 x pass 0, over budget)  |  Snapshot: .passes/pass5.md, fix diff .passes/pass5.fix.diff
Fixer: major and all minors 2–10 applied (minors net −2 words)
### Applied
- [major] Invalid line — pass 4's "one non-flex element" leaves no way for only the word span to ellipsize while the suffix stays whole (DESIGN.md Invalid-word message) → fixer item 1
- [minor] Fit: for the invalid line, measure the text element (✕ outside) → folded into item 1
- [minor] R-37 V case named for the `qu` spelling; uppercase stays in the P5 supp. hand-off → item 2
- [minor] split check token `W` (w uppercased) matches the Description → item 3
- [minor] tag sits on the tray tile whose id is the cell's top card, not the WordCell row → item 4
- [minor] fit helper path `src/ui/layout/fit.ts` (AD-11's mapped path) → item 5
- [minor] AC ×2 badge in the Description's frame (right edge at grid cell x + tileWidth) → item 6
- [minor] Idle checks use session-idle-pending-draft (draft in Session, empty tray) → item 7
- [minor] R-33 (UI) P5 names cell 3 as a used mirror plus tag 3 → item 8
- [minor] Consumers: every e2e spec and helper reading data-card-id/data-mirror-of, listed in the plan → item 9
- [minor] References add SPEC.md CAP-1/Constraints and rule-coverage.md → item 10
### Default applied (technical)
- Invalid line → flex text element: word span (min-width 0, ellipsis), a `white-space: pre` span holding one space, suffix span flex: none; textContent stays the full sentence
### Decision needed (functionality / UX / gameplay)
- none
### Dropped (left to the plan)
- tray ids read from data-card-id or data-mirror-of in DOM order, as literal id sequences (test hook exposes no GameView)
- dictionary.spec.ts `.word-line` scope, ✕ preceding sibling, error colour
- 52-element count also in the two-Redo k = 2 state
- tag locator scoped to the free-letter tile
- clip past 14 px (unreachable on a 360 px board)

## Pass 6 — 2026-10-08
Reviewers: fix diff, edge-case hunter, adversarial, ref alignment  |  Findings: major 1, minor 12, decision-needed 0  |  Dropped in triage: 2 (×2 badge end-tile check demoted to minor: verify precision under the pass-4 bar; 4.3-m3 remount test demoted to minor: A9 minor carried by the plan)
Words (docs): 1082 (2.92 x pass 0), unchanged  |  Snapshot: .passes/pass5.md (no fix pass)
### Open (not fixed; stopping rule)
- [major] Invalid line — Svelte 5 trims the literal space inside the `white-space: pre` span (verified by compiling with the repo's svelte), so the flex line renders "TANisn't in the word list." while the whitespace-normalising R-38 locator still passes; fix: the span holds `{' '}` with no markup whitespace between the three spans, so textContent equals `invalidWord(w)` exactly
### Decision needed (functionality / UX / gameplay)
- none

## Result — converged after 6 passes
open major: Invalid line — the space span must hold `{' '}` (Svelte 5 trims a literal space at tag edges) with no markup whitespace between word, space and suffix spans; otherwise the visible gap vanishes and textContent gets two spaces.

Majors per pass: 10, 7, 5, 2, 1, 1. Words 371 → 1082 (2.92 x, over budget from pass 2; growth from majors).

### Unapplied minors (for the build's plan or a later loop)
- ×2 badge check: require `QU` on a non-end tile of a k ≥ 2 block (the as-built end tile already passes)
- A9 4.3-m3: an AD-14 Playwright case that a live ↔ mirror switch remounts (e.g. handle to column 3's `[data-mirror-of="0"]` detached after Undo)
- src/ui/layout/fit.ts added to the AD-11 purity scan list in src/architecture-ad1.test.ts
- R-32 outline: assert the border colour `--wc-destination` on start and end mirrors, not only the classes
- text.ts exports the word formatter too (e.g. `invalidWordParts(w)` → `[W, suffix]`), so uppercasing stays in text.ts
- ×2 badge browser check also records the `QU` D-card underline as one unit
- R-30 wordCards V case for k = 0
- Interface: Card.svelte (tag prop, badge fix), Column/WordCellRow keys listed as changed modules
- fit measure restores the element's class and inline font size (finally)
- Notes' 20 px claim recorded for both android and desktop screenshot projects
- Consumers: plan lists the e2e specs and helpers reading data-card-id/data-mirror-of (intent's consumers field)
- From earlier passes: tray ids read from data-card-id or data-mirror-of in DOM order as literal sequences; dictionary.spec `.word-line` scope, ✕ preceding sibling, error colour kept; 52-element count in the two-Redo k = 2 state; tag locator scoped to the free-letter tile; view.test.ts AD-3 toStrictEqual literals gain `wordCards`; trayOrder ids = `draft.wordCards` check
