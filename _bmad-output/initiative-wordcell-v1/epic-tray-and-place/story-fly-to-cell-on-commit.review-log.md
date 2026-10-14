# Review log — story-fly-to-cell-on-commit (ticket 5.11)

State: pass 2: done

Pre-loop: HEAD d42b29d5603d7e94c1b654ef430a3285fe40733b; copy /mnt/d/CodeProjects/wordcell/_bmad-output/initiative-wordcell-v1/epic-tray-and-place/story-fly-to-cell-on-commit.review-log.passes/pass0.md; 301 words (wc -w of whole file).
Mode: docs, thorough, max 7. Budget default 2.5x (~750 words).

## Pass 1 — 2026-10-14
Reviewers: builder, edge-case, adversarial, ref-alignment  |  Findings: major 9, minor 9, decision-needed 0  |  Dropped in triage: 0 (duplicates merged)
Words (docs): 832 (2.76x pass 0, over the 2.5x budget)  |  Snapshot: story-fly-to-cell-on-commit.review-log.passes/pass1.md
### Applied
- [major] Description/Notes — landing mechanism unresolved; must be synchronous (settle/finishAll), not a promise; hold also released on every settle path and on a play() that creates no animation (Undo, press, New game) → item 1
- [major] Description — how WordCellRow learns in-flight/held state and keeps the used mirror and previous cards drawn; reconcile "no new exports" → item 2
- [major] Description — origin/keyframes and flying set (planGlides returns [] for flyToCell): each face glides captured rect → settled rect, set = cards tray → wordcells, order bottom first; Redo included → item 3
- [major] Description — stagger as delay i*stagger() with fill backwards (no early parking in the cell), stagger into FlipDeps; reduced motion: settled rect, no translation → item 4
- [major] Description — per-card hide at its own landing; look between first and last landing → item 5
- [major] Description — gate-count and finishAll registration (CAP-8), AD-14 gate-idle test → item 6
- [major] Description — rewrite flip.test.ts pins ("starts no animation", "plans nothing") and stale comments (flip.ts, ActionBar.svelte) → item 7
- [major] Description/AC — winning Confirm/Redo flies the same, guard is CAP-10's → item 8
- [major] AC — timing-stable Playwright (pause animations), R-60 order, hidden after landing, Redo setup, faces-only animations, 52 elements → item 9
- [minor] stale :59 → :63; fixture paths; source cell beneath card at commit; empty cell; badge at post-commit count; z-order; cite F7 instead of restating numbers → item 10
### Default applied (technical)
- landing hook: synchronous settle path, no promise (resolves Notes open question); in-flight state flip-owned reactive state
### Decision needed (functionality / UX / gameplay)
- none
Fixer flagged (unverified, builder to confirm): reactive in-flight set via svelte/reactivity as a member of the existing Flip object passed to WordCellRow as a prop.

## Pass 2 — 2026-10-14
Reviewers: fix-diff, edge-case, adversarial, ref-alignment  |  Findings: major 5, minor 6, decision-needed 0  |  Dropped in triage: 0 (duplicates merged)
Words (docs): 829 (2.75x pass 0, over budget; net -3 this pass)  |  Snapshot: story-fly-to-cell-on-commit.review-log.passes/pass2.md
### Applied
- [major] In-flight state — how WordCellRow reaches flip state; prop route contradicts "no new exports" (flip.ts `installed` private, no getter) → item 1
- [major] In-flight state/Landing — set the committed set and hold before play()'s first flushSync (motionKind computed from command/result/phase first), else the mirror and previous cards are already gone → item 2
- [major] Held used mirror — what supplies its id, DOM position (lowest in the cell), no duplicate of the flying live card → item 3
- [major] Playback — planGlides 0.5 px skip must not apply to flyToCell; i indexes the flying set → item 4
- [major] Tests/AC — missing: hold released by finishAll / play with no animation / empty target; source-cell mirror + beneath card for a free letter from another cell (session-place-free-letter-two-cards); winning commit; badge → item 5
- [minor, zero- or negative-word] mark svelte/reactivity `unverified`; drop "decided, ..." suffix; "final cell order (bottom of the committed run first)"; reduced `duration('flyToCell')` instead of 120 ms where possible; Redo AC "let it settle"; AC "just after the first landing" = seek first face to its end; presentation only (AD-14) → item 6
### Default applied (technical)
- flip.ts exports its in-flight state (read-only) rather than a prop; set before the first flushSync; no 0.5 px skip for flyToCell
### Decision needed (functionality / UX / gameplay)
- none
