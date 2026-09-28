# Review loop — ticket 1.9 build (code mode)

Target: `eb8e4f9..HEAD` (5183644) plus working tree, excluding `package-lock.json`.
Intent: `_bmad-output/initiative-wordcell-v1/epic-scaffold-ci-deploy/story-deploy-to-cloudflare-workers-static-assets-plan.md`.
Depth: thorough, max 7. Pre-loop state: HEAD `5183644`, clean tree. actionlint (Docker `rhysd/actionlint`) clean before pass 1.

## Pass 1 — 2026-09-28 12:38
Reviewers: correctness, edge cases, verification gap, intent alignment  |  Findings: major 1, minor 2, decision-needed 0  |  Dropped in triage: 0
### Applied
- [major] `wrangler.jsonc` `compatibility_date` / plan Implementation Notes — build date 2026-09-28 was "verified" only by `deploy --dry-run`, which never runs the compat-date check; wrangler 4.141.0 caps at `DEFAULT_COMPAT_DATE = "2026-09-25"` (cli.js:27324) → set to `2026-09-25` (ticket's fallback rule) and recorded why in the plan (checklist, notes, snippet, summary).
- [minor] plan Local exercise — sample deploy log was hand-written → cited wrangler cli.js:159977-159985 as the real output format.
- [minor] `deploy.yml` job `if:` — forks with Actions enabled get a red Deploy run on their `main` → `deploy.yml` unchanged (ticket fixes the three `if:` clauses); limitation recorded in the plan's gate-4 notes.
### Default applied (technical)
- `wrangler.jsonc` — which compat date → `2026-09-25`, latest wrangler 4.141.0 supports.
- fork noise — repo guard vs note → note only (keeps ticket's exact `if:`).
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- none
Checks after fix: `npm test` 309 passed; `npm run lint` clean; `npm run check` 0 errors; `wrangler deploy --dry-run` exit 0.

## Pass 2 — 2026-09-28 12:50
Reviewers: correctness, edge cases, verification gap, intent alignment  |  Findings: major 0, minor 4, decision-needed 0  |  Dropped in triage: 0
Stopping rule met (zero major); the minors below are recorded, not applied.
### Open minors (not applied)
- plan Implementation Notes > compatibility_date — say the 2026-09-25 choice rests on reading wrangler's source (`DEFAULT_COMPAT_DATE`, bundled workerd 1.20260925.1), not on an observed warning; live acceptance of the date is proven only at gate 4.
- plan Plan Change Log — no entry for the post-build change 2026-09-28 → 2026-09-25 (pass 1 of this loop); add one, noting actionlint and the dry-run were re-run on the new tree (both exit 0).
- `deploy.yml` check 5 (`/index.html`, `-sIL`) — follows the 307 and asserts on `/`, so it cannot prove the `/index.html` `_headers` line (the ticket fixes this behaviour); the plan errata could say so for the retrospective.
- gate-4 owner checks — production answers `/index.html` with a 307 while `vite preview` answers 200; Workbox strips redirects from precached responses, so this is expected to work, but a gate-4 step could confirm the live service worker activates with no precache error and a reload works offline.
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- none

## Result — converged after 2 passes
Files changed by the loop (uncommitted): `wrangler.jsonc`, `story-deploy-to-cloudflare-workers-static-assets-plan.md`. Final checks: `npm test` 309 passed, `npm run lint` clean, `npm run check` 0 errors, actionlint clean, `wrangler deploy --dry-run` exit 0. No real deploy, no Playwright run, no commit, no push.
