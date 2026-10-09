# Review log — story-d-block-controls-validate-and-confirm-states.md (ticket 5.3)
State: pass 4: done

Mode: docs, thorough, max 7. Pass 0: 409 words (`.passes/pass0.md`), HEAD 019f2fa. Intent fields from tickets.toml entry 3 (interface, tests, owns, consumers): `.passes/intent.md`.

## Pass 1 — 2026-10-08
Reviewers: builder's reading, edge-case hunter, adversarial, ref alignment  |  Findings: major 8, minor 15, decision-needed 0  |  Dropped in triage: 2
Words (docs): 922 (2.25 x pass 0)  |  Snapshot: .passes/pass1.md
Fixer: all 23 items applied (AD-12 scan already covers every non-exempt .svelte file, so worded "covers"); no commands added.
### Applied
- [major] Description — tickets.toml entry 3 interface/tests/owns/consumers missing → fixer item 1
- [major] AC "UI Vitest AD-12 cancel-first spies" — Vitest runs `environment: 'node'`, no component mount; rule-coverage row is S → fixer item 2 (default applied)
- [major] AC — R-30 Flip effect (stored destinationSide, word line/tile order side-left) and k shown between −/+ untested → fixer item 3
- [major] AC — R-73 Validate saved before the next action missing (intent tests, rule-coverage R-73) → fixer item 4
- [major] Description/AC invalid-word line — no setup for a failed Validate or for Redo enabled with the line shown; "draft and Redo unchanged" ambiguous; no check that a non-edit keeps the line; successful-Validate clear unreachable in P5 → fixer item 5 (default applied)
- [major] AC "one click = one validate" — no observable → fixer item 6 (default applied)
- [major] Description/AC label shrink — no mechanism, no test, no label overflows at supported widths → fixer item 7 (default applied)
- [major] AC test:screens — baseline change not stated (board-composing changes) → fixer item 8 (default applied)
- [minor] fixer items 9–23 (refs, Composing-only, U+2212, as-built ActionBar, canConfirm wording, Notes unknown follow-up, text.ts keys, + bound and k = 0 routes, caption ellipsis check, tapAt location and case, flushSync location, out-of-scope glides and tile clear, sentence structure, Need 3+ letters scope, no private tapAt left)
### Default applied (technical)
- AD-12 coverage → act() scan includes ControlRow.svelte + act.test.ts cancel-first; no component-mount harness
- invalid-line setups → word-list stub without TAN on session-composing; session-place + one Undo + stub for Redo
- one-click proxy → one wordcell:session write, phase place, no halt
- label shrink → fitSize (src/ui/layout/fit.ts) 16 → 14 px, Playwright with forced overflow
- screenshots → board-composing android/desktop regenerate in the container, others unchanged
- tapAt → e2e/helpers/board.ts
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- "Close the Notes open question" — it is the tickets.toml `unknown`, kept; only a stop-and-report line added (minor 14)
- plain-.ts handler module for per-button spies — superseded by item 2's default

## Pass 2 — 2026-10-08
Reviewers: fix diff, edge-case hunter, adversarial, ref alignment  |  Findings: major 7, minor 10, decision-needed 0  |  Dropped in triage: 0
Words (docs): 1027 (2.51 x pass 0)  |  Snapshot: .passes/pass2.md
Fixer: all 17 items applied; Tests and Consumers lines shortened to make room; no commands added.
### Applied
- [major] Description ¶2, AC stub bullet — a failed Validate is a dispatch that accrues `activeMs` and writes (game.svelte.ts:139-154), so "byte-identical" fails → fixer item 1 (default applied: equal apart from `activeMs`, masked like column-phases.spec.ts)
- [major] AC stub bullet — Undo (→ Idle) and Redo (→ Place) clears pass vacuously since the line renders only in Composing → fixer item 2 (default applied: return to Composing and assert no invalid line)
- [major] AC bullet 1 — Flip then Validate validates the side-left non-word NTA, so "Validate saved" cannot be met → fixer item 3 (sequence stated)
- [major] Notes/AC F21 — two awaited Playwright taps flush between them, so the double tap cannot catch a missing flushSync → fixer item 4 (default applied: add a two-synchronous-click case)
- [major] AC label shrink — widths for the [14,16) and ellipsis cases undefined while px literals are forbidden → fixer item 5 (default applied: measure the label's natural widths)
- [major] Description ¶2 — "re-measured as the word line does" copies the open S19 integer-clientWidth defect → fixer item 6 (default applied: fractional content width)
- [major] Tests line/AC — intent's R-38 "Validate only on tap" dropped → fixer item 7
- [minor] fixer items 8–17 (R-40→R-42 cite, label span, F21 no halt + key filter, ControlRow props, k locator, dictionary `ready`, act.test.ts in Verify, single-click fixture, k = 0 one path, caption ellipsis forcing)
### Default applied (technical)
- see the majors above
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- none

## Pass 3 — 2026-10-08
Reviewers: fix diff, edge-case hunter, adversarial, ref alignment  |  Findings: major 3, minor 13, decision-needed 0  |  Dropped in triage: 1
Words (docs): 1020 (2.49 x pass 0)  |  Snapshot: .passes/pass3.md
Fixer: all 10 items applied, stub bullet trimmed to stay in budget; no commands added.
### Applied
- [major] AC stub bullet — pass-2 item 2 unresolved: each Undo/Redo round trip ends in a second changed dispatch, so neither clear is tested alone (the hook exposes no feedback) → fixer item 1 (default applied: Undo/Redo clear through the same changed-dispatch reset the `+` case proves; round trips only check no stale line)
- [major] AC bullet 1 — R-73 Validate save never checked ("before the next" with Validate last) → fixer item 2
- [major] AC bullet 1 — the R-38/Q-07 "phase stays composing" check is vacuous unless the list is ready during the edits → fixer item 3
- [minor] fixer items 4–10 (stub body cat/dog, Confirm cite EXPERIENCE.md, button as the shrink-check element, + bound as column 6's card count, cut "(Place) and", successful-Validate unreachable reason, Need 3+ letters / Confirm labels already in e2e/game-store.spec.ts LABELS)
### Default applied (technical)
- Undo/Redo clear coverage → shell changed-dispatch reset, proven by the `+` case
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- helpers.spec.ts android-only — no change needed (desktop branch exercised by importing desktop specs)
### Unapplied minors (over budget, adding words; for the build plan)
- caption / k count typography (ui-label, ink-secondary) and Flip size (44 px secondary pill); label span inline, inheriting line-height so other baselines stay identical; one button node across Validate → Confirm (no keyed block); ≤ 0.5 px rect tolerance for the shrink checks; act() scan matches only onclick-style attributes; invalid-line text already covered by e2e/tray.spec.ts:446

## Pass 4 — 2026-10-08
Reviewers: fix diff, edge-case hunter, adversarial, ref alignment (late-pass bar)  |  Findings: major 1, minor 9 applied + 6 for the plan, decision-needed 0  |  Dropped in triage: 0
Words (docs): 1029 (2.52 x pass 0)  |  Snapshot: .passes/pass4.md
Fixer: all 9 items applied; redundant parentheticals cut to pay; no commands added.
### Applied
- [major] AC stub bullet — the pass-3 trim dropped "each from a fresh failure", so the Undo/Redo round trip runs after `+` already cleared the line and passes trivially (undoes pass-2 item 2); current() exposes no feedback (merged with ref-alignment's "Undo clear of a visible line untested") → fixer item 1 (default applied: each round trip starts from a fresh failure; the per-dispatch clear is the shell Vitest `AD-4 feedback.rejectedWord is cleared on a changed dispatch (Undo)` plus a Redo sibling)
- [minor] fixer items 2–9 (reordered Flip at k = 2 so D reversal shows, masked storage check on the redo-tail case, 14 px size only (weight 600 kept), exact-name −/+ locators, R-36 in the LABELS row name, writes counted after the click, button width vs content width, ellipsis as scrollWidth > clientWidth with an inline span)
### Default applied (technical)
- adversarial "ellipsis check passes trivially" classed minor (assertion precision, late-pass bar), applied as a reword
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- none
### Unapplied minors (for the build plan)
- k = 0 source column fixed and the letter count read from text.letters (QU = 2); Flip `disabled={!canFlip}` never true while rendered (drop or keep the binding); a failing Validate dispatched twice per click is unobservable (one shared handler); caption narrowing width measured in-page; k rendered as its own element read by textContent; Flip as a 44 px secondary pill (DESIGN.md ref)
