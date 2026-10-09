# Review log — story-insertionindex-gap-rects-and-parting-offsets.md (ticket 5.6)

State: pass 4: done

Mode: docs, thorough, max 7. Pass 0: HEAD 88f7549, .passes/pass0.md, 376 words (budget 2.5x ≈ 940).
Intent extras (tickets.toml entry 6, not copied into the ticket; fixer adds them to Description in pass 1): interface, tests, owns, consumers.

## Pass 1 — 2026-10-09
Reviewers: builder's reading, edge-case hunter, adversarial, ref alignment  |  Findings: major 9, minor 9, decision-needed 0  |  Dropped in triage: 0 (+ ~20 duplicates merged)
Words (docs): 938 (2.49 x pass 0)  |  Snapshot: .passes/pass1.md  |  Fixer: all 15 items applied, no commands added
### Applied
- [instr] Description — add tickets.toml entry 6 interface, tests, owns, consumers (tests' R-32 S case renamed AD-12, consumers corrected to the code) → fixer item 1
- [major] Description insertionIndex — "nearest rect" vs F3 "nearest gap-rect centre" → 2
- [major] Description gap rects — inputs undefined; M-index translation around the D block (block left offset k, M meeting the block at a row break) → 3 (default applied)
- [major] Description free-letter parting — slot n (no tile at rest) has no resting rect → 4 (default applied: slot rects computed from trayLayout geometry + tile-area origin)
- [major] Description/AC — segment ends and locks live in TileRows.svelte `segment()`, untestable; partingOffsets return shape undefined → 5 (default applied: extract pure segment helper, partingOffsets returns parted slot + dx/dy)
- [major] Description reorder rule — helper signature, domain and no-change result unspecified → 6 (default applied)
- [major] Description reorder parting — "shift in reading order" reads two ways; tiles move toward the collapsed origin → 7
- [major] Description free-letter — behaviour when full / gap moves no tile undefined → 8 (default applied: caller decides room, no-room call throws, no-move gap returns zero offsets)
- [major] AC — free-letter offsets with the block on the left (build-notes CAP-5 "either side") untested → 9
- [major] intent tests — R-32-named UI Vitest violates AGENTS.md naming → folded into 1
- [minor] F3 row-break rect pair and no second rect after the last row → 10
- [minor] AC expected index for "drag right by one past the neighbour's centre" and "drag right by two" → 11
- [minor] insertionIndex throws on empty gapRects / zero-area dragged rect, like pickTarget → 12
- [minor] gap-rect width (4 px gap, centred) → 13
- [minor] rows clipped past the second until CAP-9: gapRects covers every rendered row → 14
- [minor] Notes open question → settle with build-notes [ASSUMPTION] default + tie rule → 15
- [minor] consumers inaccurate (layout.svelte.ts; visible-band.ts Rect) → folded into 1
### Default applied (technical)
- gap-rect inputs, slot geometry, partingOffsets/segment return shapes, reorder signature and no-change reference, no-room throw → items 3–6, 8
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- none (duplicates merged)

## Pass 2 — 2026-10-09
Reviewers: fix diff, edge-case hunter, adversarial, ref alignment  |  Findings: major 5, minor 4, decision-needed 0  |  Dropped in triage: 4 (+ duplicates merged)
Words (docs): 960 (2.55 x pass 0)  |  Snapshot: .passes/pass2.md  |  Fixer: all 8 applied; to stay in budget it trimmed Consumers (call-site detail), Owns ("all six") and Notes wording
### Applied
- [major] partingOffsets — index space of `gap`/`origin` (run vs tray position) and the origin position's own entry unspecified → fixer item 1 (default applied: run indices, function adds `first`; origin position zero)
- [major] Interface — `slots` overloaded (count vs rect array), untyped `origin`/`mirrorBySlot`; no-room throw not expressible in the function's inputs → 2 (default applied: `slotCount`, typed params, throw when tileCount + 1 > slots.length)
- [major] Slot rects — tile height not in `TrayLayout` (card mode H vs compact 44) → 3 (default applied: TrayLayout gains `tileHeight`)
- [major] Slot rects — measuring `.tiles` box puts every rect 6 px high (TileRows padding-top 6 / margin-top −6) → 4 (default applied: origin = slot 0's resting rect)
- [major] AC — gapRects rules (row-break pair, none after last row, M meeting the block at a row break) and the named `AD-12 destination cards never reordered or interleaved` test have no case → 5 (Tests (S) names folded into the AC lines to stay in budget)
- [minor] "end gap of M with the block on the left, or k = 0" misreads as any gap at k = 0 → 6
- [minor] cut "even with |M| = 0" (M never empty: R-30, R-35) → 7
- [minor] cut misplaced free-letter sentence from the reorder bullet → 8
### Default applied (technical)
- items 1–4 as above
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- fix-diff major "gap 0 rect with count = 0": M is never empty in Composing (R-30, R-35); Place strip never empty — clause cut instead (item 7)
- fix-diff minor cut ", supplementary": AGENTS.md makes UI Vitest never R-id coverage; the ticket wording follows AGENTS.md (rule-coverage's "V" column naming `insertionIndex` S cases is the spec's own tension, not the ticket's)
- adversarial minor reorder out-of-range i/j throws: over budget and adds words; left to the plan (unapplied minor)
- adversarial stretch: origin stale on mid-drag scroll — epic 4 hit rects make the same fixed-at-drag-start assumption (AD-12)

## Pass 3 — 2026-10-09
Reviewers: fix diff, edge-case hunter, adversarial, ref alignment  |  Findings: major 3, minor 6 accepted (+6 to plan), decision-needed 0  |  Dropped in triage: 0 (+ duplicates merged)
Words (docs): 1023 (2.72 x pass 0)  |  Snapshot: .passes/pass3.md  |  Fixer: all 8 applied; majors added the words, minors net zero; trimmed Consumers, two "each", "entry 7"
### Applied
- [major] Slot rects — origin "tile 0's rect" ambiguous: pitch-wide live wrapper vs face (2 px inset, face may be lifted 4 px / dragged) → fixer item 1 (default applied: wrapper top-left + 2 px x; slot rect is tileWidth × tileHeight, unlifted face)
- [major] AC — reorder's two main branches (i ≤ j insert at i; i > j + 1 at i − 1) and drag-left reorder parting (tiles i…j−1 one forward) untested → 2
- [major] AC — segmentEnds extraction's "no visible change" unchecked for a multi-tile block and a block split by a row break (screens fixture has k 1) → 3
- [minor] partingOffsets — "M tiles" excludes the Place strip → "run tiles" → 4
- [minor] partingOffsets — origin's parted slot index unstated → "keeps its own slot, zero offsets" → 5
- [minor] gapRects — "sit a half-gap outside" → "centre a half-gap outside" → 6
- [minor] AC destination-cards line — scope to Composing (D cards move in Place) → 7
- [minor] AC — "a gap that moves no tile" → "a free-letter gap that moves no tile" → 8
### Default applied (technical)
- item 1 slot-rect frame as above
### Decision needed (functionality / UX / gameplay)
- none
### Unapplied minors (over budget; for the plan)
- gapRects signature gains `perRow` (row breaks otherwise inferred from slot y)
- trayLayout tests extend toEqual cases with `tileHeight` (tray.test.ts)
- gapRects/partingOffsets parameter and return types (`readonly Rect[]`, `{ index; rect }[]`, `{ slot; dx; dy }[]`)
- "rendered rows" = `trayLayout(tileCount).rows` TileRows renders (pre-CAP-9)
- parted segment ends/locks mid-drag applied by entry 8 without Svelte state (rule 3), e.g. controller-toggled classes
- reorder out-of-range i/j throws (from pass 2)
### Dropped
- none

## Pass 4 — 2026-10-09
Reviewers: fix diff, edge-case hunter, adversarial, ref alignment  |  Findings: major 3, minor 6 accepted (+5 to plan), decision-needed 0  |  Dropped in triage: 0 (+ duplicates merged; 1 major reclassified minor)
Words (docs): 1035 (2.75 x pass 0)  |  Snapshot: .passes/pass4.md  |  Fixer: all 8 applied; minors net zero (cut redundant Slot-rects sentence and the Notes tie clause, restated in insertionIndex and AC)
### Applied
- [major] Slot rects — "tile 0's live wrapper" does not exist with the block on the left (position 0 is a D mirror, AD-14) → fixer item 1 (default applied: the wrapper at tray position 0, live or mirror)
- [major] gapRects — "boundary gap gets rects only on M's side" / "row-break pair only between two movable tiles" contradicts F3 (a row-break index gets both rects; the start-of-row rect beside the first mirror is neither inside nor beyond the block) and drops the visible opening of a free-letter insert with the block on the right → 2
- [major] insertionIndex returns only `number`, but CAP-6's caret draws at the winning rect and a row-break index has two; entry 8 would re-derive (Owns) → 3 (default applied: return the winning `{ index, rect }`)
- [minor] AC — slotRects has no case (reclassified from major: verify precision, pass-4 bar) → 4
- [minor] AC — prefix the gapRects and reorder lines with AD-12 (AGENTS.md test names) → 5
- [minor] AC — "matching TileRows `segment(i)`" is circular after extraction → literals from today's `segment(i)` → 6
- [minor] Slot rects — "(a free-letter insert's slot n included)" false when full → "slot n only with room" → 7
- [minor] partingOffsets `origin` (run index) clashes with slotRects `origin` (point) → rename `from` → 8
### Default applied (technical)
- items 1, 3 as above; item 2 follows F3
### Decision needed (functionality / UX / gameplay)
- none
### Unapplied minors (over budget; for the plan)
- "a drag to the far end" expectation (gap |M| / n, dragged tile last)
- reorder-mode partingOffsets at gaps j and j + 1: all zero
- the origin's slot entry coincides with a neighbour's parted slot in a reorder (only free-letter results feed `mirrorBySlot`)
- throws for an inconsistent run (first + count > tileCount) or out-of-range gap/from
- the segmentEnds at-rest case could be named AD-11 (layout/tray.ts)
### Dropped
- none
