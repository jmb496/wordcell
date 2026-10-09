# Review log — story-d-block-controls-validate-and-confirm-states.md (ticket 5.3)
State: pass 1: done

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
