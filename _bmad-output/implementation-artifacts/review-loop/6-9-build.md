# Review loop log: ticket 6.9 build (code mode)
State: pass 1: done
Target: commit range 4005750..HEAD (a8c7a07), diff at 6-9-build.passes/pass0.diff
Intent: _bmad-output/initiative-wordcell-v1/epic-game-surfaces-and-keyboard/story-how-to-play-panel-plan.md
Pre-loop: HEAD a8c7a07bc78419b673307857af434682f1eba5c6, tree snapshot 0 e2b023ad950f9a4c76cad85eab897a244e67969c

## Pass 1 — 2026-10-15
Reviewers: correctness, edge cases, verification gap, intent alignment  |  Findings: major 3, minor 9 (after merge), decision-needed 0  |  Dropped in triage: 0 (duplicates of the e2e/menu.spec.ts:58 tolerance merged: 4 reports)
### To apply
- [major] src/ui/how-to-play.test.ts:83 — keyboard coverage uses substring checks on one joined string; passes on a wrong table
- [major] e2e/how-to-play.spec.ts:~58 — band names and scores asserted independently, pairing/order not pinned
- [major] src/ui/text.test.ts:752 — R-83 band test circular; band 5 only `toContain('530')`
- [minor] e2e/menu.spec.ts:58 — row height loosened to toBeCloseTo; keep exact for the 5 old rows, tolerance only where needed
- [minor] how-to-play.test.ts tag regex `<p[^>]*>` matches `<path`/`<pre` — anchor tag name
- [minor] e2e touch-action only `not none` — assert pan-y on all example cards
- [minor] text.test.ts:746 bandNames test mixes heading assertion — split
- [minor] Q-12 / no-hints content pin
### Default applied (technical)
- all of the above are test-strength choices → reviewer defaults
### Decision needed
- none
### Not applied (minor, left)
- keys documented before entry 10 wires them (plan scope, by design); Esc-guard and tile-selection tests; skipFocus reset check; band-threshold deviation note
### Applied (fixer: all 7 items; test 2537 pass, lint 0 errors, check 0 errors, 30 e2e pass on android)
Snapshot: tree 82b4ef17c172d9ebe33088ac9060d99e0de67020
