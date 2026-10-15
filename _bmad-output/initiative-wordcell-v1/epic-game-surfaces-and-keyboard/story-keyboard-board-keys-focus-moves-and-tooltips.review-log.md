# Review log — story-keyboard-board-keys-focus-moves-and-tooltips.md

State: pass 4: done

Pre-loop: HEAD 14b4641; copy at story-keyboard-board-keys-focus-moves-and-tooltips.review-log.passes/pass0.md; 226 words; budget 1500 words (stub being fleshed out).

## Pass 1 — 2026-10-15
Reviewers: builder's reading, edge-case hunter, adversarial, ref alignment  |  Findings: major 10 (merged), minor 1, decision-needed 0  |  Dropped in triage: 0 (duplicates merged)
### To apply (triaged)
See story-keyboard-board-keys-focus-moves-and-tooltips.review-log.passes/p1-findings.md (11 items; all verified against the target/EXPERIENCE.md/Menu.svelte).
### Default applied (technical)
- Board container question → ticket adds it (EXPERIENCE.md already says so)
- Tooltip desktop gate → (hover: hover); strings in text.ts
- Roving tabindex model → one stop per region
### Decision needed (functionality / UX / gameplay)
- none

Words (docs): 1074 (4.8 x pass 0)  |  Snapshot: story-keyboard-board-keys-focus-moves-and-tooltips.review-log.passes/pass1.md
### Applied
- [major] items 1-10 and [minor] 11 of p1-findings.md applied by fixer (Description split into Keys/Activation/Focus/Tooltips, fields added, container resolved, test mapping, tooltip list)

## Pass 2 — 2026-10-15
Reviewers: fix diff, edge-case hunter, adversarial, ref alignment  |  Findings: major 10 (merged from ~40 raw), minor 1, decision-needed 0  |  Dropped in triage: 0 (duplicates merged; minor repeat/ring/fixture nits folded into majors)
### To apply (triaged)
See story-keyboard-board-keys-focus-moves-and-tooltips.review-log.passes/p2-findings.md (11 items; Enter/act()/main/focus-board facts verified in EXPERIENCE.md, act.ts, App.svelte).
### Default applied (technical)
- WordCell per-cell Tab stops; column current item = last focused/bottom card; main stays the container; focus fallback to sibling/first/board; WAITS extended for activation keys; title from layout.hoverFine; key labels on Rows
### Decision needed (functionality / UX / gameplay)
- none

Words (docs): 1497 (6.6 x pass 0; at the 1500 budget)  |  Snapshot: story-keyboard-board-keys-focus-moves-and-tooltips.review-log.passes/pass2.md
### Applied
- [major] items 1-10 and [minor] 11 of p2-findings.md applied (Enter vs Space activation, key-activation entry reusing tileTap/tapAction instead of act(), WAITS for activation keys, main/focusBoard container, per-cell Tab stops, extra no-ops with real GameView flags, same-column drop is a real drop, win focus on sheet open, focus loss fallback, key labels/hoverFine tooltips)
- Fixer unverified: commands.ts/open-surface.ts closing helper name; Board.svelte not read

## Pass 3 — 2026-10-15
Reviewers: fix diff, edge-case hunter, adversarial, ref alignment  |  Findings: major 3 (merged), minor 8, decision-needed 0  |  Dropped in triage: 0
### To apply (triaged)
See story-keyboard-board-keys-focus-moves-and-tooltips.review-log.passes/p3-findings.md (3 majors, 4 word-neutral minors; remaining minors left unapplied: ←/→ and Shift no-ops outside tray/strip, ↑/↓ limit source, Composing-entry fallback, waits decision from key context, verify button list).
### Default applied (technical)
- Tab stop per non-empty column; remembered item falls back to first live item; key activation cancels drag but never clearTile
### Decision needed (functionality / UX / gameplay)
- none

Words (docs): 1488 (6.6 x pass 0)  |  Snapshot: story-keyboard-board-keys-focus-moves-and-tooltips.review-log.passes/pass3.md
### Applied
- [major] 1-3 of p3-findings.md (empty-column digit qualifier, key-activation entry cancels drag/never clearTile, one Tab-stop model); [minor] 4-7 applied. Fixer cut the consumers list to "and the like" and dropped "table gap" from the ring bullet to pay words.
- Technical default: focus-loss fallback (sibling → first item → board) is a review-loop default, not from a ref.
- Fixer unverified: tap path peek closing; live column cards per phase

## Pass 4 — 2026-10-15
Reviewers: fix diff, edge-case hunter, adversarial, ref alignment  |  Findings: major 2 (merged), minor ~6, decision-needed 1  |  Dropped in triage: 0
### To apply (triaged)
See story-keyboard-board-keys-focus-moves-and-tooltips.review-log.passes/p4-findings.md (2 majors, minors 3-5 as budget allows).
### Default applied (technical)
- Enter on a column card is the tap (EXPERIENCE.md); global Enter only on tile/strip card/Board container; 1–8, ↑/↓ via the key-activation entry (no clearTile)
### Decision needed (functionality / UX / gameplay)
- Focus bullet, roving model — can a keyboard player focus any card in a fanned column (Tab/arrows), or only the bottom card / the tail's top card? The refs say only "cards are focusable"; play stays fully possible by 1–8 and ↑/↓ — proposed default: bottom card / last-focused card as the single stop per column (as the ticket reads now). Practical effect: a keyboard or screen-reader user cannot move focus onto a buried card directly. (Not applied by the loop.)

Words (docs): 1497 (6.6 x pass 0)  |  Snapshot: story-keyboard-board-keys-focus-moves-and-tooltips.review-log.passes/pass4.md
### Applied
- [major] 1-2 of p4-findings.md (Enter on column card is the tap; global Enter only on tile/strip card/Board container; key-activation entry also covers 1–8 and ↑/↓); [minor] 3-5 applied. Fixer unverified: ActionBar.svelte title wording.
