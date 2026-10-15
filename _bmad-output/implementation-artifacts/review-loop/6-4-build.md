# Review loop log — ticket 6.4 build (b5b3798..HEAD)
State: pass 2: done
Pre-loop: HEAD 4170f9497a3b81785707431763434bf2dc6b9dd3, tree snapshot 0 816dd75250828738f583929bb466a47922ce34f2
Target diff: 6-4-build.passes/pass0.diff (PNG baselines excluded)

## Pass 1 — 2026-10-15
Reviewers: correctness, edge cases, verification gap, intent alignment  |  Findings: major 1, minor 9 (after dedupe), decision-needed 0  |  Dropped in triage: 3
State: pass 2: done
### Applied (planned)
- [major] e2e/preferences.spec.ts:244-270 — Fast vs Normal glide compared two different moves (undo vs redo); AC says same move → measure the same move under each speed
- [minor] e2e/preferences.spec.ts:357-376 — assert frozen value is '0:03' via DOM wait before reading
- [minor] game.svelte.test.ts — elapsedMs with paused/never-resumed clock returns activeMs only; win-dispatch elapsedMs identical before/after
- [minor] text.test.ts — panel strings table; e2e Esc with panel closed / Menu open is a no-op
- [minor] plan file — tick completed Execution checkboxes
### Dropped
- free-running 1 s interval phase lag (2 reviewers) — accepted design, e2e asserts within one tick
- PreferencesPanel focus via querySelector — mirrors ConfirmDialogs.svelte:34, the agreed pattern
- 100 h overflow, halted-throw speculation, panel-string wording (owner confirms at done), live-win e2e (plan Residual risks accept; Vitest covers)
Pass 1 snapshot: tree 99bbb12a73337db99fddc27324d93910eaec51fe; test/lint/check pass.

## Pass 2 — 2026-10-15
Reviewers: fix diff, edge cases, verification gap, intent alignment  |  Findings: major 0, minor 0, decision-needed 0  |  Dropped: 0

## Result — converged after 2 passes

Unapplied minors / accepted: free-running 1 s timer interval phase lag; focus return via querySelector (mirrors ConfirmDialogs); no live-win e2e (covered by Vitest/relaunch/Undo); panel strings (e.g. "Close preferences") are builder wording the owner confirms at done-marking. Final test/lint/check: pass (run after pass 1 fixes; no code changed since).
