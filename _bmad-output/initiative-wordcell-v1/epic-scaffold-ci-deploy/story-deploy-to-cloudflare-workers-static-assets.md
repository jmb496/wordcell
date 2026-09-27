---
id: 9
type: story
title: "Deploy to Cloudflare Workers static assets"
parent: epic-scaffold-ci-deploy
covers: [CAP-9]
after: [8]
hitl: true
risk: medium
---

# Deploy to Cloudflare Workers static assets

## Description

First confirms origin and the CLOUDFLARE_API_TOKEN and CLOUDFLARE_ACCOUNT_ID secrets and halts only if one is missing, then adds wrangler pinned at exactly 4.141.0, wrangler.jsonc, public/_headers, public/.assetsignore and deploy.yml, which deploys the dist artifact of entry 8's ci.yml run unrebuilt after a green push to main.

## Acceptance Criteria

Verify: npx wrangler deploy --dry-run succeeds locally; after the owner merges and pushes to main, the live site returns the AD-18 cache headers and 404s (gate 4).

**Build precondition:** clean tree on `epic-1-scaffold`.

**First step:** `git remote get-url origin` is `github.com/jmb496/wordcell` (SSH or HTTPS form), and `gh secret list` shows `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` (both present 2026-09-27). Halt only if one is missing.

**Delta checks (delta-checks.md rows for CAP 9):**

- `wrangler` devDependency: `package.json` pins `wrangler` `4.141.0` exactly.
- `deploy.yml`, `wrangler.jsonc`, `_headers`, `.assetsignore`: SPEC CAP-9 success. `wrangler.jsonc` has `name: "wordcell"`, a pinned `compatibility_date`, `workers_dev: true`, `assets: { directory: "./dist" }`, no `main`, no `not_found_handling`. `public/_headers` per AD-18; `public/.assetsignore` lists `.vite`; both are in `dist/` after `npm run build`. `deploy.yml` runs on `workflow_run` of `ci.yml` (`completed`), only when `conclusion == 'success'`, `event == 'push'`, `head_branch == 'main'`; downloads the `dist` artifact of that run (entry 8) with `run-id` and `github-token`; no rebuild; `concurrency: deploy` [ASSUMPTION]; then `curl -sI` checks the AD-18 headers against the URL `wrangler deploy` prints.
- Local: `npx wrangler deploy --dry-run` succeeds.

**Tests:** no new test ids; `deploy.yml`'s header checks run after each deploy. actionlint covers `deploy.yml` as it does `ci.yml`.

**Owner checks at gate 4 (post-push, D6):** merge `epic-1-scaffold` to `main` and push; the `ci.yml` run is green and `deploy.yml` deploys its artifact; the live site returns `Cache-Control: public, max-age=31536000, immutable` on `/assets/*`, `no-cache` on `/`, `/index.html`, `/sw.js`, `/manifest.webmanifest`, and 404 on `/.vite/manifest.json` and on an unknown `/assets/` path. Rollback per AD-18: revert on `main` or `wrangler rollback`.

**AGENTS.md `TODO(epic 1)` items removed:** none.

**After this ticket (D8):** run one `bmad-project-context` audit. It removes the `TODO(epic 1)` line and the resolved scaffold pitfalls from AGENTS.md, and records the new scripts (`test:e2e:dist`, `test:screens:run`) under Running and verifying. Then `bmad-retrospective` for the epic.

## References

- parent — _bmad-output/initiative-wordcell-v1/epic-scaffold-ci-deploy/epic-scaffold-ci-deploy.md
- architecture — _bmad-output/planning-artifacts/architecture/architecture-wordcell-2026-09-27/ARCHITECTURE-SPINE.md, AD-18 Deploy, Rollback
- spec — _bmad-output/specs/spec-epic-1-scaffold-ci-deploy/build-notes.md, CAP-9 Deploy

## Notes

- Open question: The account's workers.dev subdomain is not known locally; deploy.yml takes the deployed URL from wrangler deploy's output for its header checks.
