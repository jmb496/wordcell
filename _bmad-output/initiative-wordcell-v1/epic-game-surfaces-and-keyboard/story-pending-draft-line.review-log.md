# Review log — ticket 6.8

State: pass 3: done

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

## Pass 2 — 2026-10-15
Reviewers: fix diff, edge-case hunter, adversarial, ref alignment  |  Findings: major 2 (merged), minor 6, decision-needed 0  |  Dropped in triage: 0
### Majors (triaged, merged)
1. Reload sentence ("A reload restoring the session shows it") has no test (ref alignment major, adversarial minor).
2. "Word part ellipsizes first, suffix stays" has no test and no structure; the 10-letter 360 px baseline likely does not overflow (raised by all four).
### Minors
discard sequence spelled out (Validate, Undo, Undo) and absence after commit; Tray Vitest positive case plus no aria-live; screens fixture via seedStorage; duplicate design refs merged (and Keyboard/Component Patterns dropped); CAP-9 fling device check out of this ticket's Verify.
### Default applied (technical)
- both majors: reviewers' defaults (reload step in Playwright; two-span structure with computed-style assertions).
### Decision needed
- none
### Applied
- [major] reload test, ellipsis structure and test; minors 3–7 applied (fixer items 1–7); new fixture `session-idle-pending-draft-long.json` named but unverified (does not exist yet; build creates it)
Snapshot: story-pending-draft-line.review-log.passes/pass2.md

## Pass 3 — 2026-10-15
Reviewers: fix diff, edge-case hunter, adversarial, ref alignment  |  Findings: major 3, minor 5, decision-needed 0  |  Dropped in triage: 0
Words: 559 (3.9 x pass 0, within the 1500 budget)
### Majors (verified against src/ui/Tray.svelte:47-56 and the ticket)
1. Two-span structure vs "built only by text.ts pendingDraft(word)" returning one string: the ticket does not say how prefix/word/suffix reach the DOM (default: text.ts returns parts, Tray renders them).
2. "10-letter word ... may not overflow" reads two ways and no test forces the ellipsis path (default: say the line must not overflow, add a narrow-width check on the long fixture).
3. "Tray.svelte's Idle branch, in the word-line slot": no such branch; `.word-line` holds WordLine under `{#if draft !== undefined}`; the ticket must say the new element is a sibling branch inside `.word-line`, not a WordLine change.
### Minors
Flow 3 setup/start state unnamed; discard sequence fixture/word; no aria-live check in Playwright if Vitest fallback is used; new fixture must pass the fixture tests; the DESIGN.md "word line renders only the card letters" exception unstated; ellipsis is only a guard (10 letters is the maximum).
### Decision needed
- none

### Resumed 2026-10-15
The earlier 'diverging' stop is withdrawn: the owner answered the design question (ticket Notes), so it is settled, not decision-needed. Pass 3 fixes are applied now with the owner answer and the defaults above.
### Applied (pass 3, after resume)
- [major] 1 parts `{prefix, word, suffix}` from text.ts pendingDraft; 2 owner answer made AC (360 px narrow-width check: one row, no overflow, full suffix; `…` only if the word truly cannot fit); 3 Placement now names the sibling branch inside `.word-line` → fixer items 1–3
- [minor] Flow 3 start state, discard words, no aria-live in Playwright, fixture tests, DESIGN.md exception → fixer items 4–8
### Default applied (technical)
- parts shape and sibling branch, as proposed.
Words: 841 (5.9 x pass 0, within 1500)  |  Snapshot: story-pending-draft-line.review-log.passes/pass3.md
