---
title: 'Deploy to Cloudflare Workers static assets (deploy.yml)'
type: 'feature'
ticket: '9'
created: '2026-09-28'
status: 'built'
route: 'full'
route_source: 'auto'
baseline_revision: 'eb8e4f9336168f335094dc1a87798cb699dda771'
review: 'thorough'
review_source: 'auto'
lenses_ran: [blind-hunter, edge-case-hunter, verification-gap, intent-alignment]
review_loop_iteration: 0
followup_review_recommended: false
context:
  - '{project-root}/_bmad-output/initiative-wordcell-v1/epic-scaffold-ci-deploy/story-deploy-to-cloudflare-workers-static-assets.md'
warnings: []
deferred:
  - summary: >-
      _headers and .assetsignore rules are first observed by the post-deploy checks, after the deploy is already live; no pre-deploy check reads their contents.
    evidence: |-
      verify dist only checks presence; dist-smoke serves dist via vite preview, which ignores _headers; the wrangler --dry-run proof is a one-off local run. A wrong rule (e.g. immutable on /sw.js) publishes before check 3 fails, with no automatic rollback. The ticket prescribes post-deploy checks only and forbids ci.yml changes; a pre-deploy wrangler dev check is a follow-up decision.
    location: >-
      .github/workflows/deploy.yml verify dist / post-deploy check
    severity: medium
  - summary: >-
      The inline verify dist / post-deploy check bash has no repeatable automated test; only the one-off local exercise recorded in Implementation Notes covers it.
    evidence: |-
      No test in test:all runs the extracted scripts; the ticket forbids a new script file. Same shape as ticket 1.8's deferred flaky-report item.
    location: >-
      .github/workflows/deploy.yml post-deploy check
    severity: medium
  - summary: >-
      npm 11.19 warns that workerd/esbuild install scripts are not covered by allowScripts; a future npm that blocks them could break npm ci in CI and deploy.
    evidence: |-
      Warning seen in the Playwright container's npm ci during test:screens; the dry-run still works today. Future-npm risk, not a current failure.
    location: >-
      package.json devDependencies.wrangler
    severity: low
---

<intent-contract>

## Intent

**Problem:** CI (ticket 1.8) uploads a tested `dist` artifact but nothing deploys it; there is no wrangler config, no `_headers` cache policy and no `.assetsignore`, so AD-18's deploy and cache headers do not exist.

**Approach:** Add wrangler pinned at exactly 4.141.0, `wrangler.jsonc`, `public/_headers`, `public/.assetsignore`, `.wrangler/` in `.gitignore`, and `.github/workflows/deploy.yml` (workflow_run of CI on `main` → download that run's `dist` unrebuilt → `wrangler deploy` → bounded post-deploy header/404 checks), exactly as the ticket's Delta checks fix them; prove locally with the ticket's Local bullet and actionlint.

## Boundaries & Constraints

**Always:** The ticket file (`context`) is the authority for every value: `wrangler.jsonc` key set, `deploy.yml` trigger, `if:`, `concurrency:`, `permissions:`, `timeout-minutes`, step names and order, the propagation wait and checks 1–9 with their attempts, logging and failure semantics. Actions by major tag: `actions/checkout@v7`, `actions/setup-node@v7`, `actions/download-artifact@v8` (current major per `gh release view` on 2026-09-28: v8.0.1). `shell: bash` on `deploy` and `post-deploy check`; post-deploy logic inline (no new script file) and shellcheck-clean under actionlint; no `${{ }}` inside `run:` bodies (pass values via `env:`). Secrets only in the `deploy` step's `env:`. `_headers` exactly AD-18's rule set.

**Never:** No real (non `--dry-run`) `wrangler deploy`, no push, no merge (gate 4 is the owner's). No `main`, `not_found_handling`, `html_handling`, `$schema` or other extra keys in `wrangler.jsonc`. No rebuild in `deploy.yml`. No automatic rollback. Never add `.vite/manifest.json`, `_headers` or `.assetsignore` to `.assetsignore` beyond `.vite`; if the dry-run lacks an `Ignoring asset:` line, stop and report. No change to `ci.yml`, Playwright configs, `vite.config.ts` or other devDependency versions.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Green push to main | CI `conclusion: success`, `event: push`, `head_branch: main` | job runs, deploys artifact, checks 1–9 pass | — |
| CI on other branch / PR / failed | any condition false | job skipped, never joins `deploy` concurrency group | — |
| Artifact incomplete | a required `dist/` file missing or no `dist/assets/*.js` | `verify dist` fails naming the file | exit 1 |
| No workers.dev URL in log | wrangler output lacks `https://wordcell.<x>.workers.dev` | `post-deploy check` fails | exit 1, message |
| Header/status mismatch | check still wrong after 3 attempts (wait: 24) | step fails at first exhausted check, printing URL, expected, last response | exit 1 |

</intent-contract>

## Code Map

- `package.json` / `package-lock.json` -- `npm install --save-dev --save-exact wrangler@4.141.0`; no other change. Scripts unchanged.
- `wrangler.jsonc` -- new, repo root; exactly `name`, `compatibility_date`, `workers_dev`, `preview_urls`, `assets.directory`.
- `public/_headers`, `public/.assetsignore` -- new; Vite copies `public/` (dotfiles included) into `dist/`. Workbox `globPatterns` (`vite.config.ts`) do not match either, so the precache is unchanged.
- `.gitignore` -- add `.wrangler/`.
- `.github/workflows/deploy.yml` -- new. Style reference: `.github/workflows/ci.yml` (`name: CI`, workflow-level `permissions`, lower-case step names, `actions/*@v7`, setup-node `node-version: 24`, `cache: npm`, flaky-report bash style: `shell: bash`, env-passed values, `>&2` messages).
- `biome.json` -- `files.includes` covers `*.json` at root only; `wrangler.jsonc` is not linted by biome (no change).
- Continuity (ticket 1.8 plan): artifact `dist` uploaded with `include-hidden-files: true`, `retention-days: 7`; actionlint via `docker run --rm -v "$PWD":/repo -w /repo rhysd/actionlint:1.7.12`.

## Tasks & Acceptance

**Execution:**
- [x] `package.json`, `package-lock.json` -- install wrangler 4.141.0 exact -- AD-18 pinned devDependency.
- [x] `wrangler.jsonc` -- write; `compatibility_date` the build date `2026-09-28` unless 4.141.0 warns, then the latest it accepts without warning; record the choice -- CAP-9.
- [x] `public/_headers` -- AD-18 rules: `/assets/*` → `Cache-Control: public, max-age=31536000, immutable`; `/`, `/index.html`, `/sw.js`, `/manifest.webmanifest` → `Cache-Control: no-cache` -- AD-18.
- [x] `public/.assetsignore` -- `.vite` -- AD-18.
- [x] `.gitignore` -- `.wrangler/` -- dry-run output stays untracked.
- [x] `.github/workflows/deploy.yml` -- write per the ticket's deploy.yml bullets (trigger, job `if`/`concurrency`/`timeout-minutes: 20`, steps `checkout`, `setup-node`, `npm ci`, `download dist`, `verify dist`, `deploy`, `post-deploy check`) -- CAP-9.
- [x] Local exercise of the inline scripts (matrix rows 3–5), as ticket 1.8 did for its flaky report: extract the `verify dist` and `post-deploy check` `run:` bodies (e.g. `mikefarah/yq:4.53.6`), run them with `bash --noprofile --norc -eo pipefail` against a temp `dist/` and a local static server (e.g. `python3 -m http.server` or a tiny node server on a free port other than 5173/4173 that can be made to return the AD-18 headers, a wrong header, a duplicate `cache-control`, and a 404) with a fake `$RUNNER_TEMP/wrangler-deploy.log`; to reach the local server, a test-only override is not allowed in the workflow, so rewrite only the extracted copy's URL regex/host for the proof and record that. Cases: missing required dist file → fail naming it; log without a workers.dev URL → fail; all-correct server → pass; a persistent header mismatch → fail at that check after 3 attempts printing URL/expected/last response. Rows 1–2 (the job `if:` and concurrency) are proven by quoting plus actionlint and observed at gate 4. Record commands and results.
- [x] Local proofs of the ticket's Local bullet plus actionlint, recorded in Implementation Notes.

**Acceptance Criteria:**
- Given `npm run build`, when `WRANGLER_LOG=debug npx wrangler deploy --dry-run 2>&1` runs, then it exits 0 and prints `Ignoring asset: .vite/manifest.json`, `Ignoring asset: _headers`, `Ignoring asset: .assetsignore`.
- Given the tree with `deploy.yml`, when actionlint 1.7.12 runs, then exit 0 with empty output.
- Given the host tree, when `npm run test:all` and `npm run test:screens` run, then both pass.
- Given `package.json`/`package-lock.json`, when inspected, then `wrangler` is exactly `4.141.0` and no pre-existing top-level devDependency changed its resolved version.
- Given the dry-run, when `git check-ignore -q .wrangler/` and `git status --porcelain` run, then ignored and no `.wrangler/` entry.
- Given the plan, then it quotes `wrangler.jsonc` verbatim, `dist/_headers`, and deploy.yml's `on:`, job `if:`, `concurrency:`, `permissions:`.

## Implementation Notes

Implemented 2026-09-28 on `epic-1-scaffold` from baseline `eb8e4f9`; nothing committed, pushed or deployed.

**First step (ticket).** `git remote get-url origin` = `git@github.com:jmb496/wordcell.git` (in the allowed list). `gh secret list` shows `CLOUDFLARE_ACCOUNT_ID` (2026-09-27T18:33:26Z) and `CLOUDFLARE_API_TOKEN` (2026-09-27T18:33:01Z). No halt.

**Action majors.** `gh release view --repo actions/download-artifact` on 2026-09-28: `v8.0.1` (published 2026-03-11) → `actions/download-artifact@v8`. `actions/checkout@v7`, `actions/setup-node@v7` as in `ci.yml`.

**Files changed.** `package.json`, `package-lock.json` (wrangler), new `wrangler.jsonc`, `public/_headers`, `public/.assetsignore`, `.github/workflows/deploy.yml`, `.gitignore` (+`.wrangler/`, recorded technical addition beyond the Scaffold deltas' `.gitignore` list). No change to `ci.yml`, Playwright configs, `vite.config.ts`, `biome.json` or other devDependencies.

**wrangler devDependency.** `npm install --save-dev --save-exact wrangler@4.141.0`: `package.json` `devDependencies.wrangler` = `"4.141.0"`; `package-lock.json` `node_modules/wrangler` = `4.141.0`. `git diff --stat package-lock.json`: `1 file changed, 1579 insertions(+), 40 deletions(-)`. A jq comparison of every `packages` key/version between `HEAD` and the working lockfile shows 87 entries added and none removed or changed (the `-` lines in the diff are JSON reflow around inserted entries). Top-level devDependencies resolved before/after (unchanged): @biomejs/biome 2.5.14, @playwright/test 1.63.0, @sveltejs/vite-plugin-svelte 7.3.1, @tsconfig/svelte 5.0.8, @types/node 24.19.0, svelte 5.57.1, svelte-check 4.7.6, typescript 6.0.3, vite 8.3.1, vite-plugin-pwa 1.3.0, vitest 5.0.2. `npm ls --depth=0` now also lists `@emnapi/runtime`, `@img/sharp-wasm32`, `tslib` as "extraneous" on the host; they are in the lockfile as `dev: true, optional: true` (wrangler → sharp's optional wasm fallback), so this is an npm-ls display quirk of the host install, not a lockfile change to an existing package.

**compatibility_date.** `2026-09-28` (build date). wrangler 4.141.0's dry-run printed no compatibility-date warning (full non-metrics output below), so the build date stands.

**`wrangler.jsonc` (verbatim, exact key set):**

```jsonc
{
  "name": "wordcell",
  "compatibility_date": "2026-09-28",
  "workers_dev": true,
  "preview_urls": false,
  "assets": {
    "directory": "./dist"
  }
}
```

**`dist/_headers`** (after `npm run build`; `diff public/_headers dist/_headers` empty; AD-18's rule set exactly):

```
/assets/*
  Cache-Control: public, max-age=31536000, immutable

/
  Cache-Control: no-cache

/index.html
  Cache-Control: no-cache

/sw.js
  Cache-Control: no-cache

/manifest.webmanifest
  Cache-Control: no-cache
```

`public/.assetsignore` is the single line `.vite`. `ls -a dist/_headers dist/.assetsignore` lists both.

**deploy.yml quotes.**

```yaml
on:
  workflow_run:
    workflows: [CI]
    types: [completed]
    branches: [main]

permissions:
  actions: read
  contents: read
```

Job `deploy` (`runs-on: ubuntu-latest`, `timeout-minutes: 20`):

```yaml
    if: ${{ github.event.workflow_run.conclusion == 'success' && github.event.workflow_run.event == 'push' && github.event.workflow_run.head_branch == 'main' }}
```

```yaml
    concurrency:
      group: deploy
      cancel-in-progress: false
```

Steps in order: `checkout` (`ref: ${{ github.event.workflow_run.head_sha }}`, `persist-credentials: false`), `setup-node` (24, `cache: npm`), `npm ci`, `download dist` (`name: dist`, `path: dist`, `run-id`, `github-token`), `verify dist` (`shell: bash`; also set here because it uses `[[ ]]`/`compgen`), `deploy` (`shell: bash`, secrets in this step's `env:` only, `npx --no-install wrangler deploy 2>&1 | tee "$RUNNER_TEMP/wrangler-deploy.log"`), `post-deploy check` (`shell: bash`, inline; no `${{ }}` in any `run:` body). The check follows the Design Notes shape: `probe` (one curl, exit code captured with `|| rc=$?`, `\r` stripped, final block after the last `^HTTP/` line, case-insensitive `cache-control` lines trimmed), `check_index` (wait), `check_cache` (checks 1–5; for `-sIL` logs the first response's status and `cache-control` or `(none)`), `check_status` (checks 6–9), `attempt_loop <max> <fn> <args>` (5 s between failed attempts, logs every failure with URL/expected/got, on exhaustion prints URL, expected, last response and `exit 1`). Check 1's asset is the first `dist/assets/*.js` by the bash glob, logged by basename.

**Dry-run.** `npm run build` exit 0 (size budget total 473036 / 600000). `WRANGLER_LOG=debug npx wrangler deploy --dry-run 2>&1` exit 0. Output without the debug `Metrics dispatcher` lines (ANSI stripped):

```
🪵  Writing logs to "/home/jared/.config/.wrangler/logs/wrangler-2026-09-28_16-23-04_676.log"
.env file not found at "/mnt/d/CodeProjects/wordcell/.env". Continuing... [...]
.env file not found at "/mnt/d/CodeProjects/wordcell/.env.local". Continuing... [...]
 ⛅️ wrangler 4.141.0 (update available 4.143.0)
Running autoconfig detection in /mnt/d/CodeProjects/wordcell...
✨ Read 18 files from the assets directory /mnt/d/CodeProjects/wordcell/dist
[18 paths listed]
Ignoring asset: .assetsignore
Ignoring asset: .vite
Ignoring asset: _headers
Ignoring asset: .vite/manifest.json
Total Upload: 0.31 KiB / gzip: 0.22 KiB
No bindings found.
--dry-run: exiting now.
```

All three required `Ignoring asset:` lines present; `.assetsignore` not extended. Note: with `WRANGLER_LOG=debug` wrangler's telemetry ("Metrics dispatcher: Posting data", event names and versions only) is logged even on `--dry-run`; nothing is deployed. After the dry-run `.wrangler/` exists, `git check-ignore -q .wrangler/` exits 0 and `git status --porcelain` has no `.wrangler/` entry.

The dry-run was repeated inside `mcr.microsoft.com/playwright:v1.63.0-noble` with the container's `npm ci` install (npm 11.19.0): `npx --no-install wrangler deploy --dry-run` exit 0.

**actionlint.** `docker run --rm -v "$PWD":/repo -w /repo rhysd/actionlint:1.7.12` → exit 0, empty output (tree including `deploy.yml`).

**Local exercise of the inline scripts (matrix rows 3–5).** Bodies extracted with `docker run --rm -v "$PWD":/w -w /w mikefarah/yq:4.53.6 '.jobs.deploy.steps[] | select(.name == "verify dist" / "post-deploy check") | .run' .github/workflows/deploy.yml`, run with `bash --noprofile --norc -eo pipefail` in a temp dir holding a copy of `dist/`. For the post-deploy proof only the extracted copy's URL regex was rewritten (`https://wordcell\.[^/ ]+\.workers\.dev` → `http://127\.0\.0\.1:8791`; `diff` shows that single line changed); the workflow has no test override. Local server: a tiny node `http` server on 127.0.0.1:8791 serving the temp `dist/` with the AD-18 headers, `/index.html` → 307 `/`, 404 for `.vite/*`, `_headers`, `.assetsignore` and unknown paths, plus fault modes. `$RUNNER_TEMP/wrangler-deploy.log` faked per case. Results:

- `verify dist`, full copy → exit 0; `dist/.vite/manifest.json` removed → `verify dist: dist/.vite/manifest.json is missing`, exit 1; `dist/_headers` removed → `verify dist: dist/_headers is missing`, exit 1; `dist/assets/*.js` removed → `verify dist: dist/assets/ has no *.js file`, exit 1.
- Log without a matching URL (both the rewritten and the original unmodified script) → `post-deploy check: no https://wordcell.<subdomain>.workers.dev URL in …/wrangler-deploy.log`, exit 1. The original regex extracts `https://wordcell.jmb496.workers.dev` from a wrangler-style sample log (`  https://wordcell.jmb496.workers.dev` line).
- All-correct server → wait passes at attempt 1, checks 1–9 `ok`, check 5 logs `info: …/index.html first response status 307, (none)`, `post-deploy check: all checks passed`, exit 0.
- Persistent wrong header (`/sw.js` `public, max-age=0, must-revalidate`) → checks 1–2 ok, check 3 fails 3 attempts (~10.6 s), prints URL, `expected: 200 with exactly one cache-control: no-cache`, `last response: curl exit 0, status 200, 1 cache-control line(s): public, max-age=0, must-revalidate`, exit 1.
- Duplicate `cache-control` on `/` (`no-cache` + `public, max-age=14400`) → check 2 fails after 3 attempts, `2 cache-control line(s): no-cache|public, max-age=14400`, exit 1.
- `/_headers` answering 200 → check 8 fails after 3 attempts, `expected: status 404`, exit 1.
- `/` serving a different body (stale) → wait fails 24/24 attempts, each logging `curl exit 0, status 200, body 16 bytes, sha256 …` (no HTML), exit 1.
- No server (connection refused, port 8792) → wait fails 24/24 with `curl exit 7, status 000, body 0 bytes, no body`, exit 1 (curl error captured, step not aborted early).

Matrix rows 1–2 (job `if:` and job-level `concurrency:`) are proven by the quotes above plus actionlint and are observed at gate 4.

**Test suites.** `ss -ltnH '( sport = :5173 or sport = :4173 )'` empty before the run. `npm run test:all` exit 0 (lint, check, Vitest 309 tests in 6 files, e2e 33 passed, pwa 12 passed, including the precache-equals-globPatterns test, so `_headers`/`.assetsignore` do not enter the precache). `npm run test:e2e:dist` exit 0 (2 passed). `npm run test:screens` exit 0 (2 passed); the container's `npm ci` installed wrangler/workerd ("added 416 packages"), with npm 11.19.0 warning `install-scripts … not yet covered by allowScripts: esbuild@0.28.1, workerd@1.20260925.1` (warning only; wrangler dry-run works in that install, see above).

**Errata for the D8 audit / retrospective (ticket-mandated).** (1) The origin check tightens SPEC CAP-9's "halts only if one is missing" (backed by AD-18's "a GitHub remote"). (2) SPEC CAP-9: default `html_handling` never serves `/index.html` with 200 (307 to `/`); `/index.html` stays in `_headers` per AD-18 and check 5 follows the redirect. (3) `preview_urls: false` and `.wrangler/` in `.gitignore` are recorded technical additions.

**Open for gate 4 (owner).** Unverifiable locally: the workers.dev subdomain and the token template; the `[ASSUMPTION]`s that static assets serves `index.html` byte-identical and that `_headers` replaces (not merges with) the platform `cache-control`; job-level `concurrency` behaviour for skipped runs. If the first live deploy fails only on one of those, report rather than loosen the check (ticket). Minor risk: a future npm that blocks unapproved install scripts (the `allowScripts` warning above) could affect `workerd`/`esbuild`; `wrangler deploy` of a static-assets-only project worked in the container under that warning.

## Plan Change Log

## Review Triage Log

### 2026-09-28 — Review pass
- verdicts: 14 findings — high 0, medium 2, low 7, false 3, maybe-false 2
- findings:
  - `[maybe-false]` `[reject]` Checks use HEAD (`curl -sI`), not GET — the ticket prescribes `curl -sI`; `_headers` rules are path-based, not method-based; the first live deploy would settle it, and if true only low.
  - `[false]` `[reject]` Check 1 covers one JS asset, not the dictionary/CSS/font — `/assets/*` is a single glob rule, so one file under it proves the rule; the ticket fixes the first `dist/assets/*.js`.
  - `[low]` `[reject]` `.env`/`.dev.vars` not git-ignored — pre-existing (Vite reads `.env` too); unlikely in everyday use; `.gitignore` additions beyond the ticket's recorded one widen the Scaffold deltas list.
  - `[low]` `[reject]` Deploy not labelled with commit (`--tag`/`--message`) — the ticket fixes the exact command; the Cloudflare dashboard shows version timestamps and the rollback default is a revert on `main`.
  - `[low]` `[reject]` No step summary / `environment: url` — the deployed URL is echoed in the log; convenience only, not in the ticket.
  - `[low]` `[reject]` Secrets repository-wide, no GitHub environment — owner-configured secrets per AD-18 prerequisites; step-scoped `env:` as the ticket prescribes; a change is an owner decision, not this build's.
  - `[low]` `[reject]` Full `npm ci` runs every install script before the token step — the ticket prescribes `npm ci`; the token is step-scoped; `--ignore-scripts` is unverified with wrangler and adds risk.
  - `[low]` `[reject]` Wrangler telemetry not disabled — no named harm to users or developers; not in the ticket.
  - `[false]` `[reject]` Plan misstates lockfile (root entry gained `engines`) — no pre-existing package version changed (verified: 0 changed, 0 removed); the root `engines` sync from `package.json` is benign; fix would edit this build's plan (noted in Auto Run Result).
  - `[low]` `[defer]` CI install cost of wrangler and the npm 11 allowScripts warning — AD-18 mandates the devDependency; allowScripts is a future-npm risk; deferred (low).
  - `[maybe-false]` `[reject]` Re-running an older CI/Deploy run silently rolls production back (edge-case) — the ticket explicitly documents this behaviour and assigns the owner to re-run only the latest run; the proposed `ls-remote` guard is excluded by the intent.
  - `[medium]` `[defer]` No pre-deploy verification of `_headers`/`.assetsignore` contents (verification-gap, pre-verified, filed defer) — ticket prescribes post-deploy checks only and forbids `ci.yml` changes; deferred.
  - `[medium]` `[defer]` Inline deploy bash has no repeatable test (verification-gap, pre-verified, filed defer) — ticket forbids a script file; same as 1.8's deferral; deferred.
  - `[false]` `[reject]` Intent-alignment: live-surface expectations (trigger, `if:`, concurrency, edge headers, ASSUMPTIONs) unproven locally — by design; the ticket assigns them to gate 4 (owner merge and push).

## Design Notes

Post-deploy check shape (bash, `-eo pipefail` via `shell: bash`): a helper that runs one curl with `set +e` capture (`rc=$?`), then evaluates; `attempt_loop <max> <check-fn>` sleeps 5 s between failed attempts; on exhaustion print URL, expected, last response and `exit 1`. Header parsing: strip `\r`, for `-L` take the block after the last `^HTTP/` line, `grep -i '^[[:space:]]*cache-control[[:space:]]*:'`, trim value, require exactly one line equal to the expected value. Check 5 additionally logs the first response's status and its `cache-control` (or `(none)`), informational. Asset for check 1: `for f in dist/assets/*.js; do …; break; done`, logged by basename. Worst case ≈ 17 min < 20.

Errata to record for the D8 audit / retrospective (ticket-mandated): (1) the origin check tightens SPEC CAP-9's "halts only if one is missing"; (2) SPEC CAP-9: default `html_handling` never serves `/index.html` with 200 (307 to `/`); (3) `preview_urls: false` and `.wrangler/` in `.gitignore` are recorded technical additions.

## Verification

**Commands:**
- `npm run build && ls -a dist/_headers dist/.assetsignore` -- both exist.
- `WRANGLER_LOG=debug npx wrangler deploy --dry-run 2>&1` -- exit 0, the three `Ignoring asset:` lines.
- `docker run --rm -v "$PWD":/repo -w /repo rhysd/actionlint:1.7.12` -- exit 0, empty output.
- `ss -ltnH '( sport = :5173 or sport = :4173 )'` empty, then `npm run test:all` -- exit 0.
- `npm run test:screens` -- pass.
- `git diff --stat package-lock.json`; `npm ls --depth=0` -- wrangler 4.141.0, other versions unchanged.

## Auto Run Result

- **Summary:** added the AD-18 deploy: `wrangler` 4.141.0 (exact devDependency), `wrangler.jsonc` (5 keys, `compatibility_date` 2026-09-28), `public/_headers` (AD-18 rules), `public/.assetsignore` (`.vite`), `.wrangler/` in `.gitignore`, and `.github/workflows/deploy.yml` (`name: Deploy`; `workflow_run` of `CI` on `main`; job-level `if`/`concurrency`; download that run's `dist` unrebuilt; `verify dist`; `npx --no-install wrangler deploy | tee`; bounded post-deploy wait and checks 1–9).
- **Files:** `.github/workflows/deploy.yml` (new, deploy workflow); `wrangler.jsonc` (new, static-assets config); `public/_headers` (new, cache headers); `public/.assetsignore` (new, excludes `.vite`); `.gitignore` (+`.wrangler/`); `package.json`, `package-lock.json` (wrangler 4.141.0; lockfile root also picked up the existing `engines` field, no pre-existing package version changed); this plan.
- **Review:** thorough, 14 findings; patches 0; deferred 3 (no pre-deploy header check, no repeatable test of the inline bash, npm allowScripts future risk); rejected 11 with reasons in the triage log.
- **Follow-up review recommended:** false (no patches; patched counts high 0, medium 0, low 0).
- **Verification:** implementer ran every Local proof (Implementation Notes); orchestrating session re-ran: actionlint 1.7.12 exit 0, empty output; lockfile comparison 0 changed / 0 removed, wrangler 4.141.0; `npm run build` exit 0; `WRANGLER_LOG=debug npx wrangler deploy --dry-run` exit 0 with `Ignoring asset: .assetsignore`, `_headers`, `.vite/manifest.json`; `git check-ignore -q .wrangler/` ok, no `.wrangler/` in status; ports 5173/4173 free, `npm run test:all` exit 0 (309 unit, 33 e2e, 12 pwa). `npm run test:screens` passed in the implementer's run.
- **Residual risks:** everything live is proven only at gate 4: the `workflow_run` trigger by name, job `if:`/concurrency on skipped runs, cross-run artifact download, the workers.dev URL in real wrangler output, and the ticket's ASSUMPTIONs (`_headers` replaces the default `cache-control`; `index.html` served byte-identical; propagation within the bounded waits). No real deploy was run.
