# Review log — story-screen-reader-labels-and-live-region

State: pass 3: done

Pre-loop: HEAD c4b130d, pass0.md 241 words, budget 1500 words.

## Pass 1 — 2026-10-15 21:55
Reviewers: builder's reading, edge-case hunter, adversarial, ref alignment  |  Findings: major 8 (merged), minor 4, decision-needed 0  |  Dropped in triage: 0 (many duplicates merged)
Words (docs): 890 (3.7x pass 0, within the 1500 budget)  |  Snapshot: story-screen-reader-labels-and-live-region.review-log.passes/pass1.md
### Majors (triaged, merged)
1. String list owned by nobody: ticket says build-notes.md holds it, build-notes says the ticket lists every string; undefined text for phase, Undo, Redo, New game, outcome (and boot/restore/Replay).
2. Label grammar by example only: per-place card forms (column, tray, WordCell, foot), state vocabulary tied to GameView flags, empty/1-card/singular forms; QU wording on card name, WordCell top card and words (counts 2).
3. Delta wording: `plus N` / `minus N` (word, not U+2212) / `no change`; plural forms; all strings in text.ts.
4. Dedupe open question unresolved and repeat-identical text not re-announced: precedence rule, clear-then-set mechanism, always-mounted region outside inert overlays; winning Confirm commit-then-outcome.
5. Commit trigger: source fields `cells`/`scoreDelta`, how a committing Redo is detected, no text when dispatch changes nothing.
6. AC does not cover invalid word repeat, Undo, Redo, New game, win sequence, plural/zero delta, QU top card.
7. CAP-11 `−`, `+`, `Flip` names (epic 5 F9) dropped.
8. WordCellRow aria-label move untested (key in text.ts + test); test:screens needs "region visually hidden, no baseline change".
### Minors
announce only on transition, boot/restore silent; mirrors aria-hidden; cite EXPERIENCE Accessibility Floor / A-E9; name fields in stop clause.
### Default applied (technical)
- all eight majors: reviewers' proposed defaults, wording derived from the SPEC CAP-11 examples (the spec delegates the string list to the ticket).
### Decision needed
- none (announcement wording follows the spec's examples and style; spec delegates it to the ticket).
### Dropped
- none

## Pass 2 — 2026-10-15 22:10
Reviewers: fix diff, edge-case hunter, adversarial, ref alignment  |  Findings: major 8 (merged), minor 7, decision-needed 0  |  Dropped in triage: 0 (many duplicates merged)
Words (docs): 1219 (5.1x pass 0, within the 1500 budget)  |  Snapshot: story-screen-reader-labels-and-live-region.review-log.passes/pass2.md
### Majors (triaged, merged)
A. Commit fields unreadable as written: post-dispatch view has no `place` (PlaceView only in Place phase); Confirm must read word/target/scoreDelta from the pre-dispatch view; a Redo that commits needs a named source (or stop and report).
B. Winning Confirm: "one announcement per action, last wins" contradicts "commit text then outcome"; outcome is a separate, later trigger when the sheet opens.
C. Mechanism unnamed: one UI announcer computes a single string around every dispatch call site (buttons, CAP-10 keys, gestures); New game / Replay / Give up call sites (not dispatch); invalid-word signal (`rejectedWord`/dictionary result) exempt from the unchanged-dispatch rule.
D. Outcome string cannot derive from `text.endBar` ("Show result: ..."); needs a new text.ts entry and a literal example; minus read as "minus".
E. Replay (menu action) has no rule: default `Replay. Idle.`; Replay-load wording; Give up outcome untested.
F. `selected` on a multi-card tail (default: every picked card) and tray-tile selected state; `destination` joins and order.
G. Re-announce oracle untestable: name an observation method (empty between sets / MutationObserver or counter).
H. Test gaps: tray tile, foot/source foot, destination, phase strings, unchanged dispatch announces nothing, Give up, Redo-commit.
### Minors
`src/ui/tray/ControlRow.svelte` path; Idle row / word edits in Composing silent; only the first sheet open announces (re-expand, hidden-return silent); scan Tray files; fold 1-card row; visually-hidden mechanism clipped 1px not display:none; list default strings in Notes.
### Default applied (technical)
- all eight majors: reviewers' proposed defaults.
### Decision needed
- none
### Dropped
- none

## Pass 3 — 2026-10-15 22:35
Reviewers: fix diff, edge-case hunter, adversarial, ref alignment  |  Findings: major 7 (merged), minor 9, decision-needed 0  |  Dropped in triage: 0 (duplicates merged)
Words (docs): 1511 (6.3x pass 0, at the 1500 budget)  |  Snapshot: story-screen-reader-labels-and-live-region.review-log.passes/pass3.md
### Majors (triaged, merged)
1. Undo/Redo rows contradict the "unchanged wordCount and phase announces nothing" rule when the undo only reverts a Composing/Place edit: default, Undo/Redo always announce when the session reference changed; the unchanged rule applies to the other triggers.
2. Pending-rAF behaviour undefined: a new announce cancels a pending set (latest wins); outcome is set in a later frame than the commit text; fake-rAF test for two announces in one frame.
3. Give up (and any finished dispatch) through `dispatchAnnounced`: announcer sets nothing, only the outcome announces; exactly one set.
4. `announceOutcome` at `openDeferred` fires even when the token is dead (Undo between settle and open, CAP-5): announce only when the sheet really opens; test it.
5. Tray tile `i`/`n` undefined: left to right in the strip; n counts only live (named) tiles; example with free letters.
6. AC gaps: mirrors/role/aria-hidden, region visually hidden and not inert, visibilitychange silence, Undo-cancelled win.
7. "Replay-load" undefined in AC: replace with concrete cases (relaunch into stored session, relaunch into Game over, pageshow/visible return).
### Minors
Mount point (not Tray.svelte: pending-draft.test.ts forbids aria-live there; root sibling outside inert wrappers) + test; letters 0/1 edge; non-top WordCell cards aria-hidden; destination-only example; roles (WordCell group); source foot only during tap selection; selected phrasing; throw from dispatchAnnounced like `field()`; negative-delta Vitest example.
### Default applied (technical)
- all seven majors: reviewers' proposed defaults.
### Decision needed
- none
### Dropped
- none
