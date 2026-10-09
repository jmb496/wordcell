# Review log — story-insertionindex-gap-rects-and-parting-offsets.md (ticket 5.6)

State: pass 1: done

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
