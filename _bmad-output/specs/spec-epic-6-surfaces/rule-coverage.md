# Epic 6 rule coverage

P6 = Playwright (`android`; `desktop` where noted). U = UI Vitest (`AD-n`, never R-id coverage).
Filled in by the tickets; each row needs a passing test whose name carries the id.

| Rule / behaviour | Capability | Test kind |
| --- | --- | --- |
| R-62 end sheet on win | CAP-4 | P6 |
| R-70, R-75 Undo closes the sheet (also collapsed, no pop); Give up | CAP-2, CAP-4 | P6 |
| R-72 pending-draft line (A-E13 is the EXPERIENCE.md assumption behind R-72; the tests carry R-72) | CAP-9 | P6 |
| R-73 relaunch into Game over, sheet expanded | CAP-4 | P6 |
| R-74 confirm dialogs (in progress = playing and moves > 0), Replay (Q-29), I-68 proofs | CAP-3 | P6 |
| I-68 Esc closes the topmost surface, never reopens or inverts | CAP-10 | P6 `desktop` |
| Win, New game, back (AD-13; seeded won fixture, no end-sheet assertion) | CAP-3 | P6 |
| R-76 timer, Show timer, formatter | CAP-7 | U, P6 |
| R-81, R-83 penalty line, score, band | CAP-4 | P6 |
| R-82 top-bar score beside the timer and Undo/Redo at 360 px, negative score with U+2212 | CAP-7 | P6 |
| R-84, Q-35, Q-44 statistics, longest word | CAP-6 | P6 |
| §2 version and history messages, Q-33 (includes the statistics notice P4–6) | CAP-4, CAP-6 | P6 |
| Q-24, A-E7 keyboard table | CAP-10 | P6 `desktop` |
| F39 key commands close an open view | CAP-10 | P6 `desktop`, U |
| AD-14 winning guard, end-sheet half, Undo aliases, Redo-win guard | CAP-5 | P6 android + desktop (Undo key aliases desktop) |
| AD-13 overlay stack, confirm dismissal (closes only the confirm) | CAP-1 | U |
| Confirm dismissed from a menu row: focus on ☰, menu not reopened | CAP-3 | P6 |
| AD-13 two-overlay reload (Statistics panel plus Reset history confirm) | CAP-6 | P6 |
| AD-13 Game-over reload with unreadable history (sheet, notice, Reset confirm; back sequence) | CAP-4 | P6 |
| Discriminating win smoke test (win title, final score = pre-win score plus committed delta) | CAP-4 | P6 |
| Spec §7.10 Preferences | CAP-7 | P6 |
| A-E9 labels, live region (winning Confirm: commit text, then outcome) | CAP-11 | U, P6 |
| How to play outline | CAP-8 | P6 |
| A8 wheel during a mouse drag (AD-12 F3) | CAP-12 | U, P6 `desktop` |
| A8 hover-peek re-anchor (AD-12) | CAP-12 | P6 `desktop` (the layout anchor write it relies on is U, AD-11) |
| A8 bfcache hide flush | CAP-12 | accepted non-reproduction, build-notes Carry-ins bfcache (epic 4 retro F7; SPEC CAP-12 "not a bug"); no test |
| WordCell view sheet and peek open/close transition | CAP-1 | P6 |
| Version footer `__APP_VERSION__` | CAP-2 | U, P6 |
| Stale tile selection cleared at the source (separate from `tileTap`'s throw) | CAP-10 | U |
| Esc fallback (topmost overlay, selection, collapse sheet) | CAP-10 | P6 `desktop` |
| Space/Enter tile activation | CAP-10 | P6 `desktop` |
