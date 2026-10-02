# Review log — story-composing-place-and-static-tray-rendering.md (ticket 4.3)

State: pass 5: done (converged)

Mode: docs, thorough, max 7, budget 1120 words (2.5 x (339 pass-0 words + 109 carried toml words)). Pass 0: HEAD c01b011, copy story-composing-place-and-static-tray-rendering.passes/pass0.md, 339 words.

Intent carried from tickets.toml entry 3 (not copied by the pull): unknown, interface, tests, owns; pass-1 fixer adds interface, tests, owns to Description as 'Interface:', 'Tests:', 'Owns:' (unknown is already in Notes as the open question).

## Pass 1 — 2026-10-02
Reviewers: builder, edge-case, adversarial, ref-alignment  |  Findings: major 13, minor 2, decision-needed 0  |  Dropped in triage: ~14 (duplicates merged; 'card 9 free letter' wrong, it is 28)
Words (docs): 978 (2.9 x pass 0; 0.87 of budget)  |  Snapshot: story-composing-place-and-static-tray-rendering.passes/pass1.md
Fixer: all 15 items applied; engine probes via npx tsx (fixture views, Undo/Redo walk, rebuild byte-equal). Orchestrator note: fixer moved the valid-fixture list test from src/architecture.test.ts into serialize.test.ts in error (it is src/architecture.test.ts:1932) → carry to pass 2.
### Applied
- [major] Description — toml interface/tests/owns not carried → fixer item 1
- [major] AC — R-42 session-place, R-22 idle-empty-column, R-33 after Undo missing; AD-14 on Composing with a free letter → 2
- [major] AC — Redo-into-Composing path unnamed (Undo ×2, Redo) → 3
- [major] AC — AD-14/reload checks have no fixed expected values → 4
- [major] AC — reload clause lists used cell/target for session-composing → 5
- [major] Mirrors may carry data-place (F23 press targets) → 6
- [major] Open question answered by F2; compact/clipped branch untested → 7
- [major] D block reversal (R-30) and destination-block look dropped → 8
- [major] New fixture needs ValidName/PROPERTIES and a dictionary for its rebuild → 9
- [major] Whole-column placeholder rule has no test → 10
- [major] smoke.spec.ts 'live cell cards' test contradicts the used-cell mirror → 11
- [major] --pass-with-no-tests not dropped; screenshot fixtures unnamed → 12
- [major] Count-badge 1/2 boundary handed over by 4.2 dropped → 13
- [minor] Ghost membership via view.draft, not slicing → 14
- [minor] Static tile tags → 15
### Default applied (technical)
- Tray mode → pure UI helper with UI Vitest at 7/8/14/15 tiles, 412/360 px
- Expected mirror sets/orders → engine-computed literals in the plan
- Static tray tiles → plain face, no origin/position/star tags (epic 5 owns tags)
- Count badge → assert if reachable from fixture Undo/Redo states, else Notes deferral
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- Duplicates across the four lenses merged; edge-case 'free letter card 9' disproved (cell 3's top is 28).

## Pass 2 — 2026-10-02
Reviewers: fix-diff, edge-case, adversarial, ref-alignment  |  Findings: major 8, minor 8, decision-needed 0  |  Dropped in triage: 6 (duplicates merged; R-22 test-name finding dropped: the toml tests field names R-22)
Words (docs): 1118 (3.3 x pass 0; at the 1120 budget)  |  Snapshot: story-composing-place-and-static-tray-rendering.passes/pass2.md
Fixer: all 15 applied; engine/geometry probes via npx tsx (412: w 46 inner 384; 360 and 1280x720: w 40 inner 336; 7 per row; move-2 Composing D [27,1] k 2 right; idle-empty-column one Undo legal [3..7] target 7); legal non-target ring found reachable and added; cuts made to stay in budget.
### Applied
- [major] Fixture bullet — valid-fixture list test is in src/architecture.test.ts:1932, not serialize.test.ts (pass-1 regression) → fixer item 1
- [major] D block 'one outline, one lock' contradicts DESIGN.md per-row-segment rule → 2
- [major] R-30 D reversal untested (all asserted Composing states k ≤ 1); two Redos from redo-tail reach k = 2 → 3
- [major] Placeholder-under-ghosts phase unstated (DESIGN: Composing); Place of the self-drop untested → 4
- [major] Tray helper inputs insufficient (tile width max(w,44)); 15-tile output unstated; no browser check of clip/labels → 5
- [major] Compact tile face unspecified (DESIGN compact: no bottom band, glyph 22/Qu 18) → 6
- [major] Place not-legal 35 % state untested (CAP-2, handed over by 4.2) → 7
- [major] Screenshot capture state (dictionary ready, no banner) unspecified → flaky baselines → 8
- [minor] smoke.spec option → pick cell 7 of session-idle-empty-column → 9
- [minor] AD-14 list ambiguity (Idle, one Undo, two Undos) → 10
- [minor] Count-badge deferral owner → 11
- [minor] Interface: Card.svelte mirror/ghost/destination variants → 12
- [minor] Invalid-word line placement inside the word-line slot (4.2 hand-over) → 13
- [minor] Observable for used/target (class/element, not px text) → 14
- [minor] Tray tiles touch-action/user-select → 15
### Default applied (technical)
- Tray helper → (tileCount, inner width, w) → card | compact with uncapped rows; Tray clips beyond two rows; browser AC asserts overflow hidden, fixed max(H,92) area, bottom ≤ labels top
- smoke.spec → move bottom→top assertion to cell 7 of session-idle-empty-column
- Screens → wait for dictionaryState 'ready', no banner, viewport capture
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- R-22 test naming (toml tests field names R-22 explicitly); duplicates of items 1, 2, 3, 5, 11.

## Pass 3 — 2026-10-02
Reviewers: fix-diff, edge-case, adversarial, ref-alignment  |  Findings: major 5, minor 6 applied (word-neutral) + 9 left for the plan, decision-needed 0  |  Dropped in triage: 4 (duplicates)
Words (docs): 1151 (3.4 x pass 0; 1.03 of budget)  |  Snapshot: story-composing-place-and-static-tray-rendering.passes/pass3.md
Fixer: all 11 applied; checked DraftView fields, current().session.cursor, dictionary.spec.ts rejected-word flow, deleted placeholder spec waits, targetCellAllowed.
### Applied
- [major] Static tiles touch-action/user-select required but untested (rule-coverage AD-11 row, tickets 3, 4) → fixer item 1
- [major] Invalid-word line parenthetical claims an existing test asserts placement; none does (4.2 hand-over) → 2
- [major] D-block at the left end (draft.side left) untested; tray order derived in UI → 3
- [major] AD-14 AC never checks mirrors carry no data-testid (SPEC CAP-2) → 4
- [major] P4 tests must assert current() and stored wordcell:session (rule-coverage preamble) → 5
- [minor] Word-line slot / empty control row applies to Place too (F2) → 6
- [minor] R-42 one-Undo state: 7 selected, 8–10 not legal → 7
- [minor] Ghost bullet lost its comma → 8
- [minor] 'move n' → moves[n] → 9
- [minor] Screens wait: 'ready label' undefined per phase; placeholder spec waited for dictionary, cards, font → 10
- [minor] AD-11 (F2) AC on 412 and 360 px → 11
### Default applied (technical)
- Tray order (arrangement + D per side) → pure UI helper beside the sizing helper, Vitest both sides
- Screens wait → dictionaryState 'ready', 52 cards visible, font loaded (as the deleted placeholder spec)
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- Duplicates of items 1–2 and of the 'compact never rendered' minor.
### Left for the plan (minors, over budget)
- 22-tile helper case (compact 4); 0-tile Idle/Game over tray and helper module path; destination/ghost/used/legal/target DOM hooks (class + one computed style); R-73 reload after an action; R-22 test is render support only (R-22 P4 supp. stays with the gesture ticket); in-board mirrors touch-action/user-select; AD-11 (F2) labels-boundary assertion strength; deferred list records compact/clip DOM rendering unverified until epic 5.

## Pass 4 — 2026-10-02
Reviewers: fix-diff, edge-case, adversarial, ref-alignment (late-pass bar)  |  Findings: major 1, minor 9 applied (word-neutral or cuts) + 4 left for the plan, decision-needed 0  |  Dropped in triage: 3 (duplicates)
Words (docs): 1117 (3.3 x pass 0; within the 1120 budget)  |  Snapshot: story-composing-place-and-static-tray-rendering.passes/pass4.md
Fixer: all 9 applied; cuts in Interface/Tests and two Description parentheticals.
### Applied
- [major] Screens bullet — 'waits for 52 visible cards' times out on the Place capture (cell 3's non-top cards 42, 0 are live but visibility hidden, WordCellRow.svelte:57) → fixer item 1
- [minor] Over budget (1151/1120) — cut Interface/Tests repetition → 2
- [minor] AD-14 list — moves[2] Composing is reached by two Redos from the fixture as loaded → 3
- [minor] AD-14 — 'exact set' → 'sorted list' (catches duplicate mirrors) → 4
- [minor] Hand-over clause — 'inside the tray band's word-line slot' → 5
- [minor] Static tiles — 'card face (×2 badge kept)' → 6
- [minor] Tray sizing — tile width max(w, 44) in both modes → 7
- [minor] R-22 — placeholder at column 1's top slot under the ghosts → 8
- [minor] Count-badge deferral reason is scope, not impossibility → 9
### Default applied (technical)
- Screens wait → 52 attached [data-card-id] (toBeAttached), dictionary 'ready', font
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- Duplicates of item 1 and the budget finding.
### Left for the plan (minors)
- Order measured as DOM order matching ascending x (row-major); destination-style and check-chip observables (computed style, effective opacity, chip by class); QU tile render check deferred; 'Resolved (F2)' is browser-unverified until a drop ticket reaches 8+ tiles.

## Pass 5 — 2026-10-02
Reviewers: fix-diff, edge-case, adversarial, ref-alignment (late-pass bar)  |  Findings: major 0, minor 16, decision-needed 0  |  Dropped in triage: 0
Words (docs): 1117 (no fix pass)  |  Snapshot: story-composing-place-and-static-tray-rendering.passes/pass4.md
### Reclassified
- edge-case 'no Playwright test renders a compact tray' (major → minor): re-raises the pass-2/3 technical default (pure helper Vitest + structural overflow/height/labels check; compact DOM rendering recorded for the plan's deferred list); no defect in shipped behaviour or the ticket contract.
### Decision needed (functionality / UX / gameplay)
- none

## Result — converged after 5 passes
Majors per pass: 13, 8, 5, 1, 0. Words 339 → 1117 (budget 1120). Technical defaults applied: ~14. No decision-needed items.

### Unapplied minors (for the plan)
- Tests line: restore '(P4 parts)' on R-33/R-42/R-73 (rule-coverage P4 + P5).
- Screens bullet: '(as the deleted placeholder spec)' applies to dictionary/font waits only; that spec waited for visible card-<id>.
- Compact tray never rendered in a browser (≤ 7 tiles in all states); deferred-list entry naming the first drop ticket that reaches 8+ tiles.
- Used + selected target on cell 3 of session-place-free-letter-redo-tail (DESIGN.md: ring over the hatch at full opacity) — assert in R-33.
- 360 px AD-11 case: set the viewport before seedStorage/goto (geometry read once at mount) and assert w = 40.
- max(H, 92) only ever 92 at tested widths; one helper case at w ≥ 70.
- 'AD-n-named' UI Vitest → AD-11.
- Hand-over clause reads as fact; plan makes the dictionary.spec.ts assertion explicit.
- New fixture insertion order: same index in VALID/REBUILDS, alphabetical in the architecture.test.ts list.
- Placeholder negative case (whole column dropped on another column) → drop ticket deferred list.
- Tray-order helper returns { id, mirror } entries; Vitest left, right, k = 0.
- Screens baselines self-certify (updateSnapshots 'missing'): plan records the eight PNGs were checked against DESIGN.md.
- AD-14 loop may add session-composing-draft-2-letters, session-idle-pending-draft, session-below-committed-last.
- R-22 Idle clause duplicates 4.2's placeholder check (keep as baseline).
- AD-11 check: also tray band bottom = labels top and band height 176.
- References: 'build-notes.md, CAP-2' without the parenthetical (WordCell states bullet; used non-legal cell keeps hatch 40 %, cell 35 %).
- Earlier left-for-plan items in passes 3 and 4.
