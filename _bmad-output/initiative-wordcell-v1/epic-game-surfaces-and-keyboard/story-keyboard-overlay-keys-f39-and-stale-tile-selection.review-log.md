# Review log — story-keyboard-overlay-keys-f39-and-stale-tile-selection.md

State: pass 1: done

Pre-loop: HEAD 631226a285aabd1754738d718fec41f3757da773; copy at story-keyboard-overlay-keys-f39-and-stale-tile-selection.review-log.passes/pass0.md; 369 words; budget default 2.5x (~922 words).

## Pass 1 — 2026-10-15
Reviewers: builder's reading, edge-case hunter, adversarial, ref alignment  |  Findings: major 9, minor 4, decision-needed 0  |  Dropped in triage: 0 (duplicates merged)
Words (docs): 808 (2.2 x pass 0)  |  Snapshot: story-keyboard-overlay-keys-f39-and-stale-tile-selection.review-log.passes/pass1.md
### To apply (triaged)
1. [major] Description — rejected-root (only N, Esc live) and Halted (no key) rules from SPEC CAP-10 are dropped.
2. [major] Description — "Y stays active" conflicts with the Redo-enabled gate and EXPERIENCE's Game over Redo "—": Y/Ctrl+Y/Ctrl+Shift+Z act only when Redo is enabled.
3. [major] Description — modifiers (only Z/Y aliases take Ctrl/Cmd; other Ctrl/Cmd/Alt chords ignored, not default-prevented), repeat ignored for toggles, Space/Enter/Tab native on focused button (build-notes Key handler details).
4. [major] Description — a key that does not act (disabled control, suspended by a surface, repeat) does nothing: no act(), no view/peek close, no selection change (CAP-10 "precondition steps run only when the shortcut acts").
5. [major] Description — Esc order undefined: topmost stack entry (modal notice, sticky view, expanded sheet collapse, tail selection pop), else tile selection, else nothing; collapsed sheet is not an overlay; I-68 Escape case as concrete sequences (confirm from menu leaves Board; History notice over sheet leaves sheet expanded).
6. [major] Description — which keys clear tile/tail selection: list the phase-changing keys and require clearTile before dispatch; tileTap throw tested with a seeded selection.
7. [major] Description — overlay-opening keys go through openSurface (closes peeks) since open() throws while a peek is open.
8. [major] Description/AC — scope against entry 11 (board keys, focus order, tooltips, Space/Enter tile activation stay with entry 11); AC lists rule-coverage rows owned (Q-24/A-E7 overlay+undo rows, F39, stale selection, Esc fallback), says no new screens specs, and key-table test covers every row of build-notes per-surface table (incl. History notice).
9. [major] Description — the one handler replaces the interim Esc handlers of menu, confirms, preferences, how-to-play, statistics so Esc has a single path.
10. [minor] a key arriving while a pop is pending is dropped (default applied).
### Default applied (technical)
- Y in Game over — Redo-enabled gate decides (no-op when no tail) → default taken
- Key during pending pop → dropped
- Interim Esc handlers → removed/routed via the single handler
### Decision needed (functionality / UX / gameplay)
- none
### Dropped (minor, unapplied)
- N behaviour with/without confirm (already CAP-3 / confirm ticket); `after:` list completeness; Ctrl/Cmd naming nits
