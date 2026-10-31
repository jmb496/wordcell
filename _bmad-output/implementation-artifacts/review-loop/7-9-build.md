# Code review loop — ticket 7.9 build (device-read tooling for a registered worker)

State: pass 1: done

Mode: code, thorough, max 7. Target: commit range `6785917..HEAD` (820dd04), diff at
`7-9-build.passes/pass0.diff`. Intent: `_bmad-output/initiative-wordcell-v1/epic-pwa-release/story-device-read-tooling-for-a-registered-worker-plan.md`.
Pre-loop: HEAD 820dd0491f0d90e3bf93c966abc1e9bb94b1b53b, tree snapshot 0 e5da6cfecf79ad7210f96eff045dd4bed667eb0b.

## Pass 1 — 2026-10-31 14:17
Reviewers: correctness, edge cases, verification gap, intent alignment  |  Findings: major 1, minor 11, decision-needed 0  |  Dropped in triage: 1 (duplicate)
Snapshot: tree 30a45547ff25a8cd2aefb2e3bb91d0d7ab453289 (fix diff 7-9-build.passes/pass1.fix.diff)
### Applied
- [major] docs/device-testing.md Seeded reads (G4 row, re-seed sentence) + scripts/device-preview.mjs main() — G4 runs two seeds back to back without saying to stop the first run; a second run while the first is up rebuilds `dist/` under the live server, `waitForPort` connects to the first run's listener, so it runs `serve --bg`, prints the hint and then `stop(1)` turns the first run's share off; the script header's "fails fast when port 4173 is taken" does not hold before the build → fixer item 1
- [minor] scripts/device-preview.test.mjs empty-history test — add a case with a valid session plus `historyJson: ''` so the empty-is-not-absent rule is separated from the no-fixture guard → item 2
- [minor] scripts/device-preview.test.mjs seedPage cases — assert order unregister < setItem < location.replace → item 3
- [minor] scripts/device-preview.test.mjs — no test pins the no-string-overload rule → item 4
- [minor] scripts/device-preview.test.mjs session-only case — assert no `wordcell:history` stored → item 5
- [minor] plan deferred[0] — name the three unverified main() wiring claims (non-JSON fixture before Tailscale/build, early SIGINT, WORDCELL_APP_VERSION through the script's own build) → item 6
- [minor] plan Plan Change Log — record that early SIGINT/SIGTERM registration goes beyond the story → item 7
- [minor] docs/device-testing.md Clearing site data first sentence — scope to CAP-7 (seed, re-seed, fresh install; never G3; Desktop per new build) → item 8 (reported by two lenses)
- [minor] docs/device-testing.md Install and offline readiness (G1, G2) — name the no-fixture run as the entry point → item 9
- [minor] docs/device-testing.md Update read spoiled-read paragraph — "fresh install" reads as uninstall; say cleared site data as in step 2 → item 10
### Default applied (technical)
- scripts/device-preview.mjs main() — busy port 4173 → probe the port before the build and throw (rule 6), matching the header's fail-fast claim (part of item 1)
### Decision needed (functionality / UX / gameplay)
- none
### Fixer outcome
- All 10 items applied. Port probe (`portOpen`) runs right after fixture parsing, before the stale seed removal, Tailscale and build; manual run with 4173 held: exit 1, no build/Tailscale output. Non-JSON fixture manual run recorded (exit 1, SyntaxError, no Tailscale/build output), so deferred[0] now names only early SIGINT and WORDCELL_APP_VERSION through the script's build. Orchestrator re-run: npm test 3760 passed, lint clean, check 0 errors.
### Dropped
- edge-case lens re-seed/Ctrl+C finding — duplicate of the intent lens finding, merged into item 1
