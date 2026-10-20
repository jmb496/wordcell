# Review loop: ticket 9.11 build (code mode, quick, max 7)
State: pass 1: done
Pre-loop: HEAD 312dea6, tree 9144eab39b1898cce551ed439fd9c04ab97baa86; target diff e701292..HEAD (pass0.diff)

## Pass 1 — 2026-10-19
Reviewers: correctness, verification gap  |  Findings: major 0, minor 6 (after merge), decision-needed 0  |  Dropped in triage: 0 (duplicate THEMES-coverage minor merged)
### Applied
- none (no majors; minors not applied at convergence)
### Default applied (technical)
- none
### Decision needed
- none
### Minors left unapplied
- registry.test.ts 'AD-10 ThemeId, prefs themes and registry ids agree': an extra id in prefs THEMES with no registry record is caught only if it is the probed 'neon'; probe more foreign ids or soften wording.
- contrast.test.ts 'main.ts registers the six theme records': static text order check only; does not tie imported names to ids.
- Plan item 2 allow-list: --wc-hairline has no production read (owner call); the token-pass script is not committed, add a grep recipe.
- e2e/theme.spec.ts Plum radio at 360 px: bottom bound is the body box only, top bound only the header; fragile if layout shifts (optionally toBeInViewport).

## Result — converged after 1 pass
Final: npm test pass, npm run lint pass, npm run check pass. No fix pass ran, so no checkpoint commit; log left uncommitted.
