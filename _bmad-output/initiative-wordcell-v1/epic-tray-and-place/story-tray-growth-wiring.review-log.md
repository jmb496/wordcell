# Review log — story-tray-growth-wiring (ticket 5.12)
State: pass 2: review
Pre-loop: HEAD ab81a9c1e4b72d6ec01d0e7a6d47a6c8b6a29b92, words 366, copy story-tray-growth-wiring.review-log.passes/pass0.md

## Pass 1 — 2026-10-14
Reviewers: builder's reading, edge-case hunter, adversarial, ref alignment  |  Findings: major 8, minor 6, decision-needed 0  |  Dropped in triage: 0 (duplicates merged across lenses: fixture names ×4, every-dispatch ×3, missing tests ×3, shrink/scroll ×3, numbers ×3)
### Findings (triaged)
- [major] Description fixtures — names unresolved, existence of entry-8 file unchecked, no fallback → default: session-composing-long.json and session-place-long.json (ASSUMPTION names), reuse if present, else script under the epic 3 regeneration rule, hand-built and validated by parseSession/replay if session-won's moves cannot yield them
- [major] Verify — no tests for never-mid-drag, busy-gate throw, each listed edit kind, restore/New game/Replay (rows set, no capture/FLIP), serialize.test.ts + AD-17 list registration
- [major] F24 — scroll-busy clear applies on every dispatch (no-ops, failed Validates included); no test
- [major] Shrink/scroll — 48 px growth, 42 px leftover, 6 px scroll at 780 unstated; shrink (−) scrollTop behaviour and clamp unstated → default: symmetric, per DESIGN A-D4
- [major] Place fixture — rows per step (Place, Confirm, Undo, Redo) and which tile count drives them unstated
- [major] "No running animation on any column face" — mechanism making a band shift not a FLIP displacement unstated (cite spec CAP-8/9)
- [major] trayLayout inputs — ticket says (tile count) but the function takes w and innerWidth; 0-row and card-mode (rows 1) handling, mode/row thresholds unstated
- [major] 150 ms test — determinism (synthetic scroll, fake timers/rAF; busy asserted true before capture, false after)
- [minor] define tile count (S + F + D mirrors) and completed edit; consumers list output and one test; screens baselines; epic 7 fling record; perRow numbers at 412
### Default applied (technical)
- all of the above (no functionality/UX/gameplay choice left open)
### Decision needed (functionality / UX / gameplay)
- none

Words: 891 (2.43 x pass 0)  |  Snapshot: story-tray-growth-wiring.review-log.passes/pass1.md
### Applied
- all 8 majors and the minors → fixer items 1-9 (entry-12 fields added to Description; shrink behaviour = symmetric default, A-D4 silent; fling item recorded in SPEC CAP-9 / plan hand-over by fixer choice; numbers 48/42/6 and perRow 7 verified against geometry.test.ts and tray.ts)

## Pass 2 — 2026-10-14
Reviewers: fix diff, edge-case hunter, adversarial, ref alignment  |  Findings: major 1, minor 8, decision-needed 0  |  Dropped in triage: 5
Words: 904 (2.47 x pass 0)  |  Snapshot: story-tray-growth-wiring.review-log.passes/pass2.md
### Applied
- [major] Description para 1 / Verify bullet 2 — release → gate.leave() → dispatch → rows order ambiguous → fixer item 1
- [minor] bullet 1 reword, screens baseline wording, viewport coordinates, gesture-busy forced, New game/Replay in definition → fixer items 2-6 (word-neutral)
### Default applied (technical)
- all of the above
### Decision needed
- none
### Dropped
- edge "card mode with 15 tiles gives 1 row" — wrong: card mode is tiles <= perRow (tray.ts), 15 tiles is compact
- adversarial Place strip may not reach three rows — SPEC Assumptions assert reachability and Notes carry the unknown with the hand-build fallback
- clamp with scrollTop < delta, cancelled-drop rows, 150 ms constant source (AD-11 A-A9 names it), w with classic scrollbars, "block on the left", card-mode wording, 0-row band test — minor, over budget (would add words)
