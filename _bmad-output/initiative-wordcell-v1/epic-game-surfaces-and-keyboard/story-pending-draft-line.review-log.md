# Review log — ticket 6.8

State: pass 1: done

Pre-loop: HEAD 09623a6ebf8ab3a67adc228c1f9420e711ad793f, 143 words (story-pending-draft-line.review-log.passes/pass0.md); budget 1500 words.

## Pass 1 — 2026-10-15
Reviewers: builder's reading, edge-case hunter, adversarial, ref alignment  |  Findings: major 6 (merged), minor 6, decision-needed 0  |  Dropped in triage: 0 (many duplicates merged)
### Majors (triaged, merged)
1. Input and owner unnamed: `view.pendingDraftWord` (lowercase R-37 spelling, view.ts:118/272) and `text.ts pendingDraft(word)` uppercasing; no engine or GameView change.
2. Placement unspecified: DESIGN.md Tray band: Idle line in the word-line slot, ui-label, ink-secondary, left-aligned, never wraps, word ellipsizes first; tile and control rows empty; band height unchanged.
3. Presence rule: rendered iff `pendingDraftWord !== undefined`, no phase re-derivation; absent cases (Composing, Place, game over, no draft) need assertions.
4. Verify mis-scoped: Flow 3 has no drop step; per-step assertions (Undo 1 absent, Undo 2 shown, Redo 1 and 2 absent) and an explicit discard case (new draft then Undo to Idle shows the NEW word).
5. Test mapping: Playwright `R-72 …` and Vitest `AD-3 …` names, concrete cases (QU word, absent cases).
6. Screens: SPEC requires the ticket to list its screens specs; add an Idle pending-draft baseline at 360 px with a long word.
### Minors
plain text, no live region; redo tail longer than 1 shows only the pending word; reload restores the line; refs to EXPERIENCE.md Flow 3 / phase row / A-E13 and DESIGN.md Tray band; A-E13 is an assumption; colour via token.
### Default applied (technical)
- all six majors: reviewers' proposed defaults.
### Decision needed
- none
### Applied
- [major] 1–6 and the reference minors applied by the fixer (also mirrored into tickets.toml id 8, left uncommitted by the checkpoint rule)
Words: see pass copy (budget 1500)  |  Snapshot: story-pending-draft-line.review-log.passes/pass1.md
