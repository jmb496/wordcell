# Review log — ticket 1.4 build (code mode)

Target: diff `e061d92..d46bc89` of ticket 1.4 (build commit `d46bc89`). Intent: the ticket
plan `story-wordcell-serif-card-letter-font-plan.md` and its ticket. Refs: ARCHITECTURE-SPINE.md
(AD-16, AD-18, Scaffold deltas), DESIGN.md, epic file, AGENTS.md, CLAUDE.md, game-flow-spec.md,
requirements-carryover.md. Rules: thorough, cap 7; technical choices take defaults.

## Pass 1 — 2026-09-28 02:15
Reviewers: correctness, edge cases, verification gap, intent alignment  |  Findings: major 0, minor 6, decision-needed 0  |  Dropped in triage: 0
### Applied
- none (zero majors; the stopping rule ends the loop before a fixer runs)
### Minor (recorded, not applied)
- `index.html:6` — the preload `<link>` is not self-closed like the `<link>`/`<meta>` tags next to it (style only).
- `e2e/pwa/font.spec.ts` AD-16 preload test — the `font-family` regex does not anchor the end of the name, so `WordCell Serif Display` would also match; suggested anchor `\s*(;|\})`.
- `scripts/build-font.test.mjs` `bullet()` — does not assert that the `SHA-256:` line is the bullet's last line, which the story's README shape requires.
- `scripts/build-font.py` `fail()` — annotated `-> None` but always raises; `NoReturn` is more accurate.
- `scripts/build-font.test.mjs` constant regexes — the `"$` match fails on a CRLF checkout of `build-font.py`; normalise line endings or pin `eol=lf` in `.gitattributes`.
- `scripts/build-font.py` `main` — a stale output `.part` left by a killed save survives later runs that fail before `write_outputs`; unlink both at the start of `main`.
### Default applied (technical)
- none
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- none

Verification: `npm test` 268 passed, `npm run lint` clean, `npm run check` 0 errors on the unchanged tree. No Playwright run needed (no code changed); ports 5173/4173 were free.

## Result — converged after 1 pass
