# Review log — story-ci-and-deploy-checks-as-tested-scripts.md (ticket 1.11)

State: pass 2: done

Mode: docs, depth thorough (builder, edge-case, adversarial, ref-alignment), cap 7. Pre-loop: HEAD 564d2c2, copy at story-ci-and-deploy-checks-as-tested-scripts.review-log.passes/pass0.md, 167 words. Growth budget: the pass-0 ticket is a stub the owner asked the loop to flesh out, so 2.5x pass 0 (~420 words) is not applied; budget taken as ~1500 words (the epic's other tickets run 560–3600).

## Pass 1 — 2026-09-28
Reviewers: builder, edge-case, adversarial, ref-alignment  |  Findings (after merge): major 10, minor 6, decision-needed 0  |  Dropped in triage: 0 (many duplicates merged)
### Applied
- [major] Description — script language, paths and interface unstated (`.mjs` or `.sh`; Vitest only collects `scripts/**/*.test.mjs`)
- [major] Description — the move does not say it preserves the 1.8/1.9 behaviour (flaky-report outcome matrix and exit semantics vs "non-gating", deploy checks, attempts, redirect and one-cache-control rules, messages)
- [major] Description — Node HTTP semantics would silently differ from curl (redirects, merged duplicate headers, GET vs HEAD)
- [major] Description/AC — no test seam: real 5 s sleeps and live network break the AD-17 unit budget
- [major] Description — dictionary/woff2 selection and zero/several matches unstated; verify dist does not require them
- [major] Description — whether `verify dist` and the wrangler-log URL extraction move too is unstated
- [major] Description — actionlint tag, invocation, position, gating, local proof and the test:all/CI mismatch unstated
- [major] Whole ticket — no doc-update list (AD-18 CI/Deploy, AD-17 Scripts, SPEC CAP-8/CAP-9/D6, build-notes, delta-checks 48–49); 1.8/1.9 "no script file" constraints not lifted; rule-7 authorisation not cited
- [major] Description/AC — `_headers`/`.assetsignore` test: exact vs contains, parsing rules, mutation cases unstated ("exact" dropped from A4)
- [major] AC — only one negative case; others tautological
- [minor] R3 `wrangler.jsonc` scope unstated
- [minor] test ids/files unnamed
- [minor] gate 4 steps (branch push, then main deploy) unstated; post-push checklist
- [minor] carried constraints (values via `env:`, secrets only in deploy step, flaky report `if: !cancelled()`)
- [minor] References omit SPEC CAP-8/CAP-9/D3/D6, build-notes, tickets 1.8/1.9
Words: 884 (5.3x pass 0; 0.6x the ~1500 budget)  |  Snapshot: story-ci-and-deploy-checks-as-tested-scripts.review-log.passes/pass1.md
Fixer: all 15 applied; ran actionlint 1.7.12 (exit 0, empty), listed dist/assets (one en-*.txt, one *.woff2, one *.js), confirmed Vitest include; node:http rawHeaders and wrangler.jsonc key-set claims marked unverified (build confirms).
### Default applied (technical)
- scripts — Node ESM, no dependencies: `scripts/flaky-report.mjs`, `scripts/deploy-check.mjs` (verify-dist, URL extraction, post-deploy checks), exported functions plus thin CLI; tests `scripts/*.test.mjs`, AD-18 ids
- behaviour — 1:1 port of ci.yml flaky report and deploy.yml verify/post-deploy at 564d2c2; flaky tests never fail the job, missing/malformed report after a successful step still fails (rule 6)
- HTTP — `node:http`/`node:https` HEAD, `rawHeaders` to count cache-control, redirects followed only for `/index.html`
- test seam — injectable attempts/delay/base URL; tests use a local `node:http` server on 127.0.0.1 port 0 with zero delay
- assets — exactly one `assets/en-*.txt` and one `assets/*.woff2` (fail otherwise), plus the first JS asset as today; verify dist requires both
- actionlint — `docker run --rm -v "$PWD":/repo -w /repo rhysd/actionlint:1.7.12` as a gating `test`-job step after checkout; CI-only like screenshots, recorded in AD-17 Scripts; build runs it locally (Docker reachable 2026-09-28)
- `_headers` — exact equality with AD-18's five rules; `.assetsignore` exactly `.vite`; `wrangler.jsonc` exact key set added to the same test
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- none (duplicates merged across the four lenses)

## Pass 2 — 2026-09-28
Reviewers: fix-diff, edge-case, adversarial, ref-alignment  |  Findings (after merge): major 6, minor 9, decision-needed 0  |  Dropped in triage: 0 (duplicates merged)
### Applied
- [major] AC vs Description 1:1 — "`/index.html` without the redirect" fails in the AC but passes today (not an intended change)
- [major] Config test — `wrangler.jsonc` "exactly AD-18's values": `compatibility_date` has only a bound; JSONC parser unstated
- [major] AC — stated rules without a failing case: `wrangler.jsonc` mutations, extra `.assetsignore` line, verify dist zero/two `*.woff2`, missing required file, zero `*.js`, flaky entry in a failed step's report
- [major] Flaky report — "wrong shape" undefined outside jq; AC tests only malformed JSON
- [major] Test seam — per-request timeout and dist root not parameters; no hang/refused-connection case
- [major] CLIs — env/argument contract unnamed and never executed before gate 4 (retro P3); fixtures not tied to real Playwright JSON
- [minor] first `*.js` needs a sort order
- [minor] redirect hop cap / relative `Location`
- [minor] `_headers` grammar (`#`, `!`, header before path)
- [minor] http vs https client choice untested
- [minor] AD-18 Binds lacks the new scripts
- [minor] AGENTS.md managed-block condition left to the builder
- [minor] "HEAD requests" vs GET for the index wait
- [minor] `deploy-check.mjs` CLI subcommands unnamed (folded into the CLI major)
- [minor] flaky report runs on the runner's default Node when actionlint fails before setup-node
Words: 1344 (8.0x pass 0; 0.9x the ~1500 budget)  |  Snapshot: story-ci-and-deploy-checks-as-tested-scripts.review-log.passes/pass2.md
Fixer: all 14 applied; ran the DEFAULT_COMPAT_DATE grep (2026-09-25, wrangler 4.141.0), a Playwright 1.63 `--list --reporter=json` run plus testReporter.d.ts (JSONReportTest has `status`, `projectName`), checked env names against ci.yml/deploy.yml; 5-hop cap and runner-default-Node claims marked unverified (design statements).
### Default applied (technical)
- `/index.html` — 1:1: final response must be 200 with one `no-cache`; first response logged only; AC case becomes "final response after a 307 lacks `no-cache`"
- `wrangler.jsonc` — `JSON.parse` (comments fail); keys exactly {name, compatibility_date, workers_dev, preview_urls, assets}; `wordcell`, true, false, `assets` deep-equal `{directory: "./dist"}`; `compatibility_date` `YYYY-MM-DD` and not later than `DEFAULT_COMPAT_DATE` read from the pinned wrangler's `wrangler-dist/cli.js` (currently 2026-09-25; test fails if not found) — the P3 late catch
- flaky shape — root object with `suites` array; nested `suites`/`specs` arrays when present; each spec a `tests` array of entries with string `status` and `projectName`
- seam — request timeout and dist dir join the parameters
- CLIs — `node scripts/flaky-report.mjs` (env `OUTCOME_DIST_SMOKE`/`OUTCOME_E2E`/`OUTCOME_PWA`/`PW_JSON_DIR`/`GITHUB_STEP_SUMMARY`), `node scripts/deploy-check.mjs verify` and `… post-deploy <log>`; one spawned-CLI test per script; one fixture from a real `--reporter=json` run with nested describes
- AGENTS.md managed block unchanged (actionlint is a lint, not a suite)
- flaky-report uses only `node:` built-ins (runs on the runner's default Node when setup-node was skipped)
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- none
