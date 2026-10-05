# Review log — story-composing-place-and-game-over-column-behaviour.md (ticket 4.10)

State: pass 3: done

Mode: docs, thorough, max 7, budget 1500 words. Pass 0: HEAD 6621aa5, copy story-composing-place-and-game-over-column-behaviour.passes/pass0.md, 292 words. Intent includes tickets.toml entry 10 fields unknown, interface, tests, owns (not copied at pull; fixer adds them to the Description in pass 1).

## Pass 1 — 2026-10-05
Reviewers: builder's reading, edge-case hunter, adversarial, ref alignment  |  Findings: major 7, minor 12, decision-needed 0  |  Dropped in triage: 0 (duplicates merged)
Words (docs): 943 (3.23 x pass 0)  |  Snapshot: story-composing-place-and-game-over-column-behaviour.passes/pass1.md (fix diff pass1.fix.diff)
### Applied
- [major] AC — hidePage case omits the `end()` release and the past-threshold variant (build-notes AD-17 hide case) → fixer item 1
- [major] Description/AC — ghost mirrors in the destination column after a self-drop (SPEC CAP-8 "destination column included, self-drop") dropped and untested → fixer item 2
- [major] Description — k preview extent in a self-drop: "to the bottom" would wrap S ghosts; DESIGN says "the D" → fixer item 3 (default applied)
- [major] AC — desktop verify omits grab cursor in Place/Game over, no outline on other columns and ghosts in Composing, top-of-D k − 1, none at k = 1 → fixer item 4
- [major] AC — drag-as-tap verify omits "card does not move" and "exactly one dispatch" (rule-coverage R-39 row) → fixer item 5 (default applied: k ≥ 3 top-of-D drag)
- [major] AC — non-card parts of the destination column (empty space, foot pad, placeholder) untested in Composing → fixer item 6
- [major] AC — inert cases assert only the Session reference; SPEC CAP-8 also requires the stored Session; R-39/R-75 "no selection, no drag" needs no selection / no drag classes → fixer item 7 (default applied)
- [minor] intent fields into Description → item 8; k sequence order on session-composing (k = 1 start) → 9; preview mechanism (reuse wc-hover-tail / --wc-hover-from, remainder length) → 10; refreshHover repaint and default cursor on destination cards → 11; one ghost term → 12; empty destination (k = 0) case → 13; no drag/drop-target classes during drag-as-tap → 14; no baseline change expected → 15; References add SPEC CAP-8, rule-coverage rows, EXPERIENCE phase matrix and Mouse and hover, DESIGN Card states → 16; kIfTapped read at pointerup for the press card wherever released → 17; existing canPickUp gating already inert, new work is the destination branch → 18; Undo then drag onto a different column → 19; pointercancel/other cancel paths owned by CAP-4 → 20
### Default applied (technical)
- k preview — reuse the tail-outline mechanism with the start from kIfTapped and its end at the remainder's bottom card, never S ghosts
- drag-as-tap test — top of D at k ≥ 3 so a double dispatch is visible; mid-drag no transform / drag-layer class
- self-drop reach — in-test from session-idle-fresh (tap-select a partial tail, tap its own foot), no new fixture
- inert asserts — current().session reference, stored Session, nothing selected, no drag classes
- destination cards keep the default cursor; preview repaints via the existing refreshHover
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- none

## Pass 2 — 2026-10-05
Reviewers: fix diff, edge-case hunter, adversarial, ref alignment  |  Findings: major 6, minor 11, decision-needed 0  |  Dropped in triage: 0 (duplicates merged)
Words (docs): 1285 (4.40 x pass 0)  |  Snapshot: story-composing-place-and-game-over-column-behaviour.passes/pass2.md (fix diff pass2.fix.diff)
### Applied
- [major] AC hide case — asserts the current().session reference unchanged, but the AD-9 flush accrues activeMs into a new reference (game.svelte.ts flush) and writes once → fixer item 1 (default applied: compare with activeMs zeroed, one write)
- [major] Description/AC — "no … ghost class" collides with Card.svelte `.ghost` on S-ghost mirrors; name wc-drag-layer / wc-drag-ghost / wc-drag-target → fixer item 2
- [major] AC drag-as-tap — "k − 1, not k − 2" is wrong: a second tap on the same card restores k (R-31); prove one dispatch by one wordcell:session write → fixer item 3 (default applied)
- [major] Description drag-as-tap — "hover is suspended as for any press" is not existing behaviour (refreshHover only skips when press.drag !== null) → fixer item 4 (default applied: clear hover at threshold crossing, refreshHover at pointerup)
- [major] AC inert drags — "no drag class" has no moment; assert mid-gesture while held (dragResidue) before end() → fixer item 5
- [major] Description/AC — k = 0 empty destination rule stated with no test → fixer item 6 (default applied: from session-idle-empty-column)
- [minor] --wc-len counts S ghosts: state it, remainder-length variable → 7; hoverAction gains a Composing destination branch → 8; Interface line vs controller-toggled class → 9; self-drop remainder ≥ 2 and tap above top of D → 10; refreshHover repaint check at k 2 → 1 → 11; drag-as-tap null case at k = 1 → 12; Place/Game-over sweep includes non-card parts and ghosts → 13; desktop composing: cursor not grab and no preview on non-card parts → 14; Undo also new source → 15; baseline clause supersedes toml wording → 16; AD-12 intent.test.ts cases for the new branches → 17
### Default applied (technical)
- hide case — Session equality with activeMs zeroed (game()/storedGame() pattern of e2e/drag-interruptions.spec.ts) plus exactly one wordcell:session write
- one-dispatch proof — armStorageSpy: exactly one wordcell:session write during the gesture
- hover during drag-as-tap — cleared at the threshold-crossing move, repainted by refreshHover at pointerup
- k = 0 case — from session-idle-empty-column, drop a tail onto the empty column
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- none

## Pass 3 — 2026-10-05
Reviewers: fix diff, edge-case hunter, adversarial, ref alignment  |  Findings: major 6, minor 14, decision-needed 0  |  Dropped in triage: 0 (duplicates merged)
Words (docs): 1481 (5.07 x pass 0)  |  Snapshot: story-composing-place-and-game-over-column-behaviour.passes/pass3.md (fix diff pass3.fix.diff)
### Applied
- [major] AC session-composing tap sequence — "tap it again" names the card that has left D, so it dispatches k → 2; the no-op is the bottom card at k = 1 → fixer item 1
- [major] Description drag-as-tap — clearing hover once at the crossing does not stop later refreshHover repaints (pointerover, App reaction) while press.drag === null → fixer item 2 (default applied: refreshHover also skips while a press is past the threshold; unconditional refreshHover at drag-as-tap pointerup)
- [major] AC desktop — main preview case (hover a remainder card above D at k = 1) untested; "a lower D card" ambiguous → fixer item 3
- [major] AC — session-won has no column cards (8 whole-column moves), so its column-card hover/grab and inert checks are vacuous → fixer item 4 (default applied: also run on session-gave-up; per-fixture targets)
- [major] AC desktop "no ghost inside the preview" fails by geometry (stacked cards overlap) → fixer item 5 (default applied: assert by index / no data-mirror-of in the outline range)
- [major] Description — drag-as-tap needs a controller pointerup change (perform only on outcome 'tap', controller.ts:585); the obvious edit would make an Idle space drag with a selection drop → fixer item 6 (default applied: dispatch on a drag outcome only for a Composing destination-column card hit; AD-12 controller.test.ts cases)
- [minor] remainder length from column.kIfTapped.size (AD-3) → 7; release-over-another-column case given from k = 1 on the card above D → 8; "saved" checked as stored = current().session with literal destinationCount, tap and drag → 9; baselines captured after the in-test drop settles → 10; lostpointercapture/pointercancel/cancel() end a drag-as-tap with no dispatch → 11; dragResidue duplicated locally — move to e2e/helpers if reused → 12
### Default applied (technical)
- hover during drag-as-tap — refreshHover skips while the press is in the drag state; pointerup of every drag-as-tap press calls refreshHover
- drag-as-tap dispatch — only for phase composing and a live card of the destination column; Idle drags keep today's behaviour
- session-won vacuity — desktop and android Game-over checks also on session-gave-up
- self-drop preview check — by index (hover-from and remainder-length values), no data-mirror-of element in range
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- none (not sent to the fixer for budget, left as unapplied minors: whole-column self-drop case; long still press on a destination card is a tap; android tap on a lower D card at k ≥ 3)
