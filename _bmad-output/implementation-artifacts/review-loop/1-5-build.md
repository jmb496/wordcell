# Review log — ticket 1.5 build (code mode)

Target: diff `7efec94..89af221` of ticket 1.5 (build commit `89af221`). Intent: the ticket
plan `story-pwa-packaging-manifest-service-worker-settings-head-icons-an-plan.md` and its ticket.
Refs: ARCHITECTURE-SPINE.md (AD-8, AD-10, AD-15, AD-16, AD-17, Q-40, Scaffold deltas), DESIGN.md,
epic file, AGENTS.md, CLAUDE.md, game-flow-spec.md, requirements-carryover.md. Rules: thorough,
cap 7; technical choices take defaults; icon art is out of scope (owner judges it at gate 4).

## Pass 1 — 2026-09-28 06:28
Reviewers: correctness, edge cases, verification gap, intent alignment  |  Findings: major 0, minor 7, decision-needed 0  |  Dropped in triage: 0
### Applied
- none (zero majors; the stopping rule ends the loop before a fixer runs)
### Minor (recorded, not applied)
- `scripts/build-icons.test.mjs` `parse()`/`property()` — attribute names are matched case-sensitively, but the icons render through the HTML parser (`page.setContent`), which lowercases them; an upper-case `FILL=`/`Transform=` would skip rules (b), (c), (e) and still paint. Suggested: reject non-lowercase attribute names other than SVG camelCase ones such as `viewBox`.
- `scripts/build-icons.test.mjs` rule (a) — no check that the root carries `xmlns="http://www.w3.org/2000/svg"`; the favicon is served standalone and would go blank without it (the committed sources have it).
- `scripts/build-icons.test.mjs` — the SVG rule checker is only run against the three committed (passing) sources; no negative cases prove it rejects a violation of each rule (a)–(f).
- `scripts/build-icons.test.mjs` — `readFont` returning the woff2 bytes is untested; only the missing-path throw is covered.
- `scripts/build-icons.test.mjs` 'readSources returns each unique source once' — asserts Map keys only, so "once" is not really checked; rename or drop the claim.
- `scripts/build-icons.mjs` — nothing tests that Playwright is loaded only via the dynamic `await import('@playwright/test')` (code reading confirms it is, line 94).
- `e2e/pwa/build-output.spec.ts:58` — the clientsClaim comment does not state that the check guards only against automatic registration and does not prove `registerType: 'prompt'`, as the ticket's Delta checks ask.
### Default applied (technical)
- none
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- none

Verification: `npm test` 280 passed, `npm run lint` clean, `npm run check` 0 errors on the unchanged tree. No Playwright run needed (no code changed); ports 5173/4173 were free.

## Result — converged after 1 pass
