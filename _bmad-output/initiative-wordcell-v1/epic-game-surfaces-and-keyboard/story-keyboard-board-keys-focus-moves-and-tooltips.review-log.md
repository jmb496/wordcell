# Review log — story-keyboard-board-keys-focus-moves-and-tooltips.md

State: pass 6: done

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

## Pass 5 — 2026-10-15
Reviewers: fix diff, edge-case hunter, adversarial, ref alignment  |  Findings: major 2 (merged), minor ~5, decision-needed 0 new  |  Dropped in triage: 0
### To apply (triaged)
See story-keyboard-board-keys-focus-moves-and-tooltips.review-log.passes/p5-findings.md.
### Default applied (technical)
- Peek closes only when the tap changes phase or word data; every board row is single (held key acts once); Tab-order test with default band order
### Decision needed (functionality / UX / gameplay)
- none new (the column-focus reachability item above stands)

Words (docs): 1492 (6.6 x pass 0)  |  Snapshot: story-keyboard-board-keys-focus-moves-and-tooltips.review-log.passes/pass5.md
### Applied
- [major] 1-2 of p5-findings.md (peek closes only when the tap changes phase/word data; empty-WordCell no-op only with nothing selected, Place Enter via canSetTarget); [minor] 3-4 applied; 5 left (technical defaults noted here: every board row is single; focus-loss fallback; Tab-order test with default band order).
- Fixer unverified: controller.ts/intent.ts peek claim; canSetTarget flag name

## Pass 6 — 2026-10-15
Reviewers: fix diff, edge-case hunter, adversarial, ref alignment  |  Findings: major 1 (merged), minor ~9, decision-needed 0 new  |  Dropped in triage: 0
### To apply (triaged)
See story-keyboard-board-keys-focus-moves-and-tooltips.review-log.passes/p6-findings.md. Minors left unapplied: text.ts importing keys.ts label table (use a small pure module), disabled-while-focused button fallback, pointer tap does not change roving current item, Tab-order band param.
### Default applied (technical)
- Key-activation entry always closes a sticky view first; peeks conditional
### Decision needed (functionality / UX / gameplay)
- none new

Words (docs): 1486 (6.6 x pass 0)  |  Snapshot: story-keyboard-board-keys-focus-moves-and-tooltips.review-log.passes/pass6.md
### Applied
- [major] 1 of p6-findings.md (key-activation entry always closes a sticky view first; peeks conditional); [minor] 2-4 applied. Fixer deleted the standalone Tests paragraph (content kept in AC "Sentence to test"; the "P6 desktop" label dropped). Fixer unverified: EXPERIENCE.md/CAP-10 sticky-view wording (reviewers cited it).
