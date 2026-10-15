# Review log — story-keyboard-overlay-keys-f39-and-stale-tile-selection.md

State: pass 2: done

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

## Pass 2 — 2026-10-15
Reviewers: fix diff, edge-case hunter, adversarial, ref alignment  |  Findings: major 4, minor 5, decision-needed 0  |  Dropped in triage: 0 (duplicates merged)
Words (docs): pending  |  Snapshot: pending
### To apply (triaged)
1. [major] Description — N is both overlay-opening (tail selection only) and phase-changing (clearTile): state per context (opens a confirm: tail selection only; acts at once in the rejected root / Game over / nothing to lose: clearTile).
2. [major] Description — "key arriving while a pop is pending is dropped" contradicts openSurface/Undo/Redo waiting for the pop: acting keys (Undo, Redo, M, N, ?) wait for the pop then act; all other keys incl. Esc are dropped without side effects.
3. [major] Description — removing the interim main tabindex while the board focus target stays with entry 11: keep the main tabindex until entry 11; replace only the per-component Esc handlers.
4. [major] Description — Esc order omits menu, panels, confirms: topmost overlay-stack entry first (per overlays.svelte.ts: confirm / History notice, menu / panel, sticky view, expanded sheet collapses, tail selection pops), else tile selection, else nothing.
5. [minor] repeat list: name it this ticket's default, "single-shot keys"; Z/Y repeat act (not ignored).
6. [minor] AC: name tests for key-event filtering (repeat, chords, preventDefault, Shift+Z alias) and pop ordering/two-press Esc.
7. [minor] Split the Description into short bullets without adding words.
### Default applied (technical)
- Pop-pending rule → acting keys wait, others dropped
- Interim main tabindex → kept until entry 11
- Z/Y held → repeat acts
### Decision needed (functionality / UX / gameplay)
- none
