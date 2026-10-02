# Review log — story-tap-select-foot-pads-and-tap-drop.md (ticket 4.7)

State: pass 1: done

Mode: docs, thorough, max 7, budget default (2.5x pass 0). Pass 0: HEAD cfe9343, copy story-tap-select-foot-pads-and-tap-drop.passes/pass0.md, 373 words. Intent includes tickets.toml entry 7 fields unknown, interface, tests, owns, risk, references (not copied at pull; fixer adds them to the Description in pass 1).

## Pass 1 — 2026-10-02
Reviewers: builder's reading, edge-case hunter, adversarial, ref alignment  |  Findings: major 7, minor 7, decision-needed 0  |  Dropped in triage: 1
Words (docs): 1199 (3.21 x pass 0)  |  Snapshot: story-tap-select-foot-pads-and-tap-drop.passes/pass1.md (fix diff pass1.fix.diff)
### Applied
- [major] Description — nothing-selected taps on a column's empty space, placeholder or foot pad, and presses on a card of a column with canPickUp false, unspecified (SPEC CAP-6, rule-coverage R-14 transient row) → fixer item 1
- [major] Acceptance Criteria — Verify omits most R-14 tap rows, AD-13 pops (drop, deselect, Undo, Redo), the blocking.spec.ts case and fixtures → fixer item 2
- [major] Description/AC — desktop hover outlines named but not their conditions (source column only over empty space/placeholder/Here, nothing on selected top, grab only Idle playing nothing selected, media gate, pointerover DOM classes) → fixer item 3
- [major] Description — F25 path lacks its exclusions (column hit rects, [data-wordcell], view sheet and scrim, enabled controls) and the trailing-click rule; a scrim tap with a view above a selection would make deselect() throw → fixer item 4
- [major] References — terms and literals (wash, Here, F25, F26, four fixture renders) defined only in unreferenced docs → fixer item 5
- [major] Notes/Description — disabled-control fallback undefined and untested → fixer item 6 (default applied)
- [major] Description/AC — selected-state visuals (lift, outline, Here, wash) unverified; baseline clause → fixer item 7 (default applied)
- [minor] canDropOn wording → item 8; deselect location for Undo/Redo/Reload → item 9; foot touch-action AC literal viewport-dependent → item 10; F26 expected outcomes → item 11; Here non-button + text.ts → item 12; WordCell tap with nothing selected → item 13; held press on column card is a tap → item 14
### Default applied (technical)
- disabled controls — probe first; if Chromium does not deliver pointer events to a disabled button, `button:disabled { pointer-events: none }` so the press resolves to the enclosing background; result recorded in the plan
- selected visuals — computed-style P4 asserts, existing four baselines expected unchanged, no new screenshot
- Redo-with-selection fixture — session-idle-pending-draft; Undo — session-idle-empty-column; scrolling-viewport pan — entry 4's scrolling viewport
- Undo/Redo/Reload deselect — in each control's handler after `cancel()`
- Here pad — non-button label in the existing data-foot element, string in text.ts
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- source column empty space keeps --wc-pan while selected (adversarial stretch) — AD-11 row assigns none only to the foot row; spec scope
