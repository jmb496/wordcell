---
title: 'CI and deploy checks as tested scripts'
type: 'chore'
ticket: '11'
created: '2026-09-28'
status: done
route: 'full'
route_source: 'auto'
baseline_revision: 'db27f588514a446f83218956d5f31e511938a0c5'
review: 'thorough'
review_source: 'auto'
lenses_ran: [blind-hunter, edge-case-hunter, verification-gap, intent-alignment]
review_loop_iteration: 0
followup_review_recommended: false
context:
  - '{project-root}/_bmad-output/initiative-wordcell-v1/epic-scaffold-ci-deploy/story-ci-and-deploy-checks-as-tested-scripts.md'
  - '{project-root}/_bmad-output/initiative-wordcell-v1/epic-scaffold-ci-deploy/story-ci-and-deploy-checks-as-tested-scripts.review-log.md'
warnings: [oversized]
deferred:
  - summary: >-
      AGENTS.md does not tell agents to run the pinned actionlint command locally when a ticket edits .github/workflows/.
    evidence: |-
      The duty lives in spine AD-17/AD-18, SPEC D6 and the methodology DoD; build agents work from AGENTS.md "Running and verifying", so a workflow edit could reach built without actionlint and fail only in CI. Fix edits an agent-context file.
    location: >-
      AGENTS.md Running and verifying
    severity: low
---

<intent-contract>

## Intent

**Problem:** The CI flaky report and the deploy verify/post-deploy checks are untested inline bash; `_headers`, `.assetsignore` and `wrangler.jsonc` are checked by nothing before a deploy; the post-deploy immutable check covers only one JS asset; actionlint never runs in CI (retro R3, R6, P3, A4, A6).

**Approach:** Build exactly what the ticket's Description bullets specify (the ticket file is the contract and must be read in full), plus the review log's open major (the `deploy-check.mjs` spawn test also runs `verify`) and the minors resolved in Design Notes. Every new check gets a named `AD-18 …` test.

## Boundaries & Constraints

**Always:** Node ESM, `// @ts-check`, no new dependencies; `flaky-report.mjs` imports only `node:` built-ins; pure exported functions + guarded CLI entry (same `realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)` guard as `scripts/size-budget.mjs:207-209`); behaviour ported 1:1 from ci.yml `flaky report` and deploy.yml `verify dist` / `post-deploy check` (unchanged since 564d2c2) except the ticket's listed changes; fail fast naming the thing (rule 6); values into scripts only via step `env:` or args; secrets only in the `deploy` step env; test names start `AD-18 `; unit suite stays < 5 s; `npm run test:all` green at the end; revert every scratch edit.

**Never:** no `${{ }}` inside `run:` bodies; the `deploy` step stays as is; no npm `lint:actions` script, `test:all` never runs actionlint; no fixture under root `fixtures/`; no external network in tests; no push; no ticket-file edits; do not run `bmad-project-context` (AGENTS.md managed block unchanged).

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Flaky none | three `success` outcomes, reports without flaky | summary `## Flaky tests` + `- No flaky tests.`; exit 0 | — |
| Flaky entry | real 1.63 fixture, nested describe, retry pass | summary line ``- `` <project> > <file> > <describe…> > <title> `` `` in report order; `::warning::Flaky: …` with `%`→`%25`; CR/LF → space; exit 0 even when that step's outcome is `failure` | — |
| Outcomes | `skipped` / `failure` no file / `success` no file / other | "not run" / "failed before reporting" / exit≠0 naming id / exit≠0 naming id | actionlint fail → all three "not run" |
| Bad report | malformed JSON, no `suites`, spec without `tests`, non-string `file`/`title`/suite `title`, test without string `status`/`projectName` | exit≠0 naming step id | — |
| Env | `PW_JSON_DIR` or `GITHUB_STEP_SUMMARY` unset/empty | exit≠0 naming the var | — |
| `_headers` | committed file; lowercase `cache-control` + extra blank lines | pass | missing `/sw.js`, wrong immutable value, extra path, duplicate path/header, `#` line, unindented `!` line, indented `  ! Cache-Control` line, indented line without `:`, header before any path → fail naming line/path |
| `.assetsignore` | `.vite` (trailing CR/space trimmed) | pass | missing, extra line → fail |
| `wrangler.jsonc` | committed + cli.js text | pass | extra key (`assets.not_found_handling`, top-level), missing key, `preview_urls: true`, comment, trailing comma, malformed / non-calendar date, date later than constant, cli.js without or with two distinct `DEFAULT_COMPAT_DATE` → fail |
| verify | temp dist | pass with 2 `*.js` | zero/two `en-*.txt`, zero/two `*.woff2`, missing required file, zero `*.js` → all failures reported, exit≠0 |
| post-deploy | local server, zero delay, short timeout | every check `ok:` incl. dictionary then woff2 | wrong/duplicate cache-control (woff2, dictionary), 3xx on a no-cache HEAD (not followed), `/index.html` 307 → final without no-cache, 6 redirects (5 pass), 3xx without `Location`, 200 where 404, index body mismatch, never-responding server, refused connection, non-http(s) redirect target → failed attempts then non-zero |
| URL | wrangler log | first `https://wordcell.<x>.workers.dev` | none → exit≠0; `DEPLOY_CHECK_BASE_URL` not an http(s) origin (path, trailing slash, other scheme) → exit≠0; set → logs a line, replaces URL only after extraction |
| CLI | unknown/no subcommand; `post-deploy` without or with unreadable log | exit≠0 naming it | — |

</intent-contract>

## Code Map

- `.github/workflows/ci.yml` -- `flaky report` step (lines 83–157): jq filter walks `.suites[]` recursively, the path holds the titles of nested suites only (each root `.suites[]` entry, the file suite, contributes no title); entry = `[projectName, spec.file] + path + [spec.title] join " > "`. Replace the body with `node scripts/flaky-report.mjs` (`GITHUB_STEP_SUMMARY` is runner-provided, not in `env:`); keep `if: ${{ !cancelled() }}` and the four env lines; drop `shell: bash` only if nothing needs it. New step `actionlint` after `setup-node`, before `npm ci`: `run: docker run --rm -v "$PWD":/repo -w /repo rhysd/actionlint:1.7.12`.
- `.github/workflows/deploy.yml` -- `verify dist` → `run: node scripts/deploy-check.mjs verify`; `post-deploy check` → `run: node scripts/deploy-check.mjs post-deploy "$RUNNER_TEMP/wrangler-deploy.log"`. The bash functions `probe`/`check_index`/`check_cache`/`check_status`/`attempt_loop` (lines 83–183) are the behaviour spec: log lines `deployed URL:`, `asset for check 1:`, `info: <url> first response status …`, `ok: <url> (<expected>)`, `attempt i/max failed: …`, `post-deploy check failed after N attempts`, `post-deploy check: all checks passed`; replace `curl exit $rc` with the Node error text. Check order: index wait (24) → JS immutable → dictionary immutable → woff2 immutable → `/`, `/sw.js`, `/manifest.webmanifest` no-cache (HEAD) → `/index.html` (HEAD, following up to 5 redirects, logging the first response) → 404s on `/.vite/manifest.json`, `/assets/does-not-exist.js`, `/_headers`, `/.assetsignore`.
- `scripts/size-budget.mjs` -- pattern for `// @ts-check`, JSDoc types, guarded CLI, `process.exitCode`. Its default dist uses `import.meta.url`; `deploy-check.mjs` resolves `dist/` against `process.cwd()` instead (spawn tests use a temp cwd).
- `scripts/size-budget.test.mjs` -- pattern for temp dirs and CLI spawning.
- `vite.config.ts:54` -- Vitest already includes `scripts/**/*.test.mjs`, `environment: 'node'`. `tsconfig.node.json` type-checks `scripts/**/*.mjs` (`checkJs`), so tests must type-check under `npm run check`.
- `public/_headers`, `public/.assetsignore`, `wrangler.jsonc` -- committed inputs, unchanged.
- `node_modules/wrangler/wrangler-dist/cli.js` -- `DEFAULT_COMPAT_DATE = "2026-09-25";` at line ~27324 (wrangler 4.141.0); read as text.
- Docs (tag each edit "(ticket 1.11, 2026-09-28)"): spine `ARCHITECTURE-SPINE.md` AD-18 `Binds:` (~705), AD-18 CI (~724) and Deploy (~734), AD-17 Scripts (~691), Scaffold deltas Docker line (~849); `_bmad-output/specs/spec-epic-1-scaffold-ci-deploy/SPEC.md` CAP-8 (~100), CAP-9 (~108), D6 (~193), Assumptions curl line (~179); `build-notes.md` CAP-8 (~121), CAP-9 (~137); `delta-checks.md` rows 48–49; epic `epic-scaffold-ci-deploy.md` Notes line 53 (Docker Unknown superseded) and line 48 (CAP-9 last: 1.10 and 1.11 follow); `docs/development-methodology.md` DoD line (local actionlint for workflow edits).

## Tasks & Acceptance

**Execution:**
- [x] `scripts/flaky-report.mjs` (new) -- exports `validateReport(json, id)`, `flakyEntries(report)`, `buildReport({outcomes, readReport})` → `{summary, warnings}` or throws naming the step id, `escapeWarning`; CLI reads env, appends summary, prints warnings.
- [x] `scripts/flaky-report.test.mjs` (new) -- every flaky row of the matrix; real fixture captured as below; two-level ordering test; spawn test with temp `PW_JSON_DIR`/`GITHUB_STEP_SUMMARY`, flaky entry, exit 0.
- [x] `scripts/deploy-check.mjs` (new) -- exports `validateHeaders(text)`, `validateAssetsignore(text)`, `validateWrangler(text, cliText)`, `readDefaultCompatDate(cliText)`, `verifyDist(distDir)` (returns all errors; also runs the two validators on `dist/_headers` and `dist/.assetsignore`), `extractBaseUrl(log)`, `baseUrlOverride(value)`, `clientFor(protocol)` (`http:`→`node:http`, `https:`→`node:https`, else throw), `request(url, {method, timeoutMs, followRedirects})`, `postDeploy({distDir, baseUrl, attempts, delayMs, timeoutMs, log})`; CLI `verify` | `post-deploy <log>`; fixed `User-Agent: wordcell-deploy-check`; no `Accept-Encoding`.
- [x] `scripts/deploy-check.test.mjs` (new) -- verify and post-deploy rows of the matrix against an in-process `node:http` server on 127.0.0.1:0 (teardown with `closeAllConnections()`), zero delay, short timeouts; `clientFor` both mappings + reject `ftp:`; CLI unknown subcommand; spawn test (cwd temp dir with `dist/` and log): runs `verify` and `post-deploy` with `DEPLOY_CHECK_BASE_URL`, asserts exit 0 and the `ok:` lines for dictionary and woff2; a test that no workflow sets `DEPLOY_CHECK_BASE_URL` and no `run:` body contains `${{`.
- [x] `scripts/deploy-config.test.mjs` (new) -- validators on committed files and every mutated copy in the matrix; `DEFAULT_COMPAT_DATE` read from the real cli.js once.
- [x] `.github/workflows/ci.yml`, `.github/workflows/deploy.yml` -- per Code Map.
- [x] Docs per Code Map; build-notes records the SPEC D3 naming deviation (`deploy-config.test.mjs` tests validators living in `deploy-check.mjs`).

**Acceptance Criteria:**
- Given a clean tree, when `npm run test:all` runs, then it is green and Vitest reports < 5 s.
- Given each ticket-AC mutation (e.g. `/sw.js` rule dropped from a copy), when the unit suite runs, then a named `AD-18` test fails on it (asserted inside the tests; plus one scratch proof: drop `/sw.js` from `public/_headers`, test fails, revert).
- Given the repo, when `docker run --rm -v "$PWD":/repo -w /repo rhysd/actionlint:1.7.12` runs, then it exits 0.
- Given `npx --no-install wrangler deploy --dry-run` locally after `npm run build`, then it succeeds or the reason it cannot run is recorded.

## Design Notes

Review-log minors resolved: code-point sort for check-1 JS and `DEPLOY_CHECK_BASE_URL` are recorded as intended changes (plan, build-notes); local-actionlint duty added to AD-17 Scripts, AD-18 CI and the methodology DoD, AD-17 names the ci.yml step as the tag's single source; `deploy-config.test.mjs` kept (ticket) with the D3 deviation noted; spawn tests per Tasks; workflow-scan test added; override must be `^https?://[^/]+$`; dist resolves against cwd; post-deploy without/unreadable log fails naming it and runs verify's glob counts before any request; `_headers` path and `.assetsignore` lines trimmed of trailing whitespace/CR, indented lines need `Name: value` with an RFC 7230 token name; date regex `DEFAULT_COMPAT_DATE = "(\d{4}-\d{2}-\d{2})"`, exactly one distinct value, calendar-valid `compatibility_date`; per-hop protocol re-pick, non-http(s) scheme fails the attempt; `verify` also validates the dist copies; https path proven at gate 4 (no https test server); fixed User-Agent. Not applied: `lint:actions` npm script (ticket fixes the literal step). Deploy job worst case: index wait 24×(10+5) s ≈ 6 min + 12 checks × 3 × 15 s ≈ 9 min + setup < 20 min timeout.

Flaky fixture capture: a throwaway `.tmp-flaky/` dir in the repo (outside `e2e/`, deleted after) with a config and a spec whose test inside `describe > describe` fails on the first try (file marker) and passes on retry; `npx playwright test -c .tmp-flaky/playwright.config.ts --retries=1 --reporter=json`; trim to the fields the shape uses; comment records command and Playwright 1.63.0.

## Verification

**Commands:**
- `npm run test` -- new AD-18 tests pass, suite < 5 s.
- `npm run test:all` -- exit 0.
- `docker run --rm -v "$PWD":/repo -w /repo rhysd/actionlint:1.7.12` -- exit 0.
- `git status --short` after scratch proofs -- only intended changes.

## Implementation Notes

- Flaky fixture captured from a real run (`npx playwright test -c .tmp-flaky/playwright.config.ts --retries=1 --reporter=json`, Playwright 1.63.0); `.tmp-flaky/` deleted. The jq filter and `flakyEntries` give identical output on the two-level ordering report.
- `deploy-check.mjs` validators return error lists (empty = pass); `readDefaultCompatDate` throws on zero or several distinct values. `request` returns `{first, final, error}` so a timeout, connection error, redirect cap, 3xx without `Location` or non-http(s) target is a failed attempt; `agent: false` (fresh connection per request, like curl). Asset names are logged just before each immutable check (`asset for check 1:`, `asset for dictionary check:`, `asset for woff2 check:`). `verify` prints `verify dist: ok` on success.
- The wrangler test reads the real cli.js once and feeds its constant to `validateWrangler` via a one-line stand-in, so the 14.7 MB file is scanned once per run.
- Scratch proofs (reverted): `/sw.js` dropped from `public/_headers` fails 14 `AD-18` tests in `deploy-config.test.mjs`; `${{ runner.temp }}` in deploy.yml's post-deploy `run:` fails the workflow-scan test.
- Verification 2026-09-28: `npm run test:all` exit 0 (Vitest 410 tests, 1.7–1.8 s); actionlint 1.7.12 exit 0; `node scripts/deploy-check.mjs verify` on the built `dist/` passes; `npx --no-install wrangler deploy --dry-run` succeeds (wrangler 4.141.0). Gate 4 (push, CI, merge to `main`, Deploy log) is the owner's.

## Plan Change Log

## Review Triage Log

### 2026-09-28 — Review pass
- verdicts: 25 findings — high 0, medium 0, low 24, false 1, maybe-false 0
- findings:
  - `[low]` `[reject]` blind: spine Scaffold deltas bullet says CLAUDE.md names "the actionlint proof", AGENTS.md does not — wording is the ticket's prescribed doc update and the ticket keeps the managed block unchanged; the bullet lists the spine's accepted Docker uses.
  - `[low]` `[defer]` blind: local-actionlint duty for workflow edits not in AGENTS.md — fix edits an agent-context file; deferred to the next `bmad-project-context` audit.
  - `[low]` `[patch]` blind: deploy-job worst-case figures miscount checks and sleeps — build-notes corrected (355 s index wait, 11 × 40 s checks); plan Design Notes figure left (plan edits rejected).
  - `[low]` `[reject]` blind: actionlint image tag-only (no digest), tag copies unchecked — the ticket fixes the literal command (`rhysd/actionlint:1.7.12`, 1.8's tag); a digest pin or drift test changes the prescribed step.
  - `[low]` `[patch]` blind: "secrets only in the deploy step env" has no test — workflow-scan test extended.
  - `[low]` `[patch]` blind + edge (grouped): `DEPLOY_CHECK_BASE_URL` regex accepts query, fragment, userinfo — now `new URL(value).origin === value` with http(s) protocol; three rejection cases added.
  - `[low]` `[reject]` blind + edge (grouped): `postDeploy` attempts/delay/timeout not validated — only callers are `main()` constants and tests; guards add branches for an unreachable state.
  - `[low]` `[reject]` blind: post-deploy spawn test would hit the Vitest timeout on regression — it still fails red; a timing seam in the CLI adds test-only surface beyond `DEPLOY_CHECK_BASE_URL`.
  - `[low]` `[reject]` blind: flaky step under `!cancelled()` fails with "Cannot find module" if checkout failed — the job is already red at checkout; the old step would also have run; no silent pass.
  - `[low]` `[reject]` blind + edge (grouped): report path or required dist file that is a directory → raw EISDIR / passes existence — unreachable (Playwright writes files; dist is Vite output); fails loudly either way except the verify existence case, which then fails on deploy.
  - `[false]` `[reject]` blind: plan lacks sentence → test mapping and logs empty — the mapping rule applies to R-ids (ticket has none; I/O matrix covers AC); logs are filled by this step; fix edits the plan.
  - `[low]` `[patch]` blind: wrangler test name claims "real cli.js" but uses a stub carrying the real constant — renamed; tab-indented header added to the passing `_headers` case.
  - `[low]` `[reject]` blind: `  !Cache-Control: x` fails as "extra header" rather than naming the `!` line — it still fails (rule 6 met); the indented `  ! Name` detach form fails naming the line.
  - `[low]` `[reject]` blind: SPEC D6 / delta-checks `ci.yml` row "every step's npm script" stale — those rows record ticket 1.8's proof; the dated 1.11 amendment beside each names the new tests.
  - `[low]` `[reject]` edge: dotfiles in `dist/assets` picked by the globs — Vite never emits dot-named assets; guard adds a branch for an unmet case.
  - `[low]` `[patch]` edge: `/index.html` follow treats only 301/302/303/307/308 as redirects, curl -L followed any 3xx with Location — any 300–399 now a redirect when following; 300 test added.
  - `[low]` `[patch]` edge: override claim (low confidence) — grouped with the override patch above.
  - `[low]` `[patch]` verification-gap: index wait and 404 checks' no-follow untested — two tests added (302 on `/`, 301 on `/_headers`).
  - `[low]` `[reject]` verification-gap: no request over https — the ticket places the real https path at gate 4 (intent excludes it); `clientFor` mapping tested.
  - `[low]` `[reject]` intent: live surfaces (wrangler log format, real dist, workflow wiring, Cloudflare behaviour) exercised only at gate 4 — the ticket assigns them to gate 4; local proofs (actionlint, `verify` on the real `dist/`, `wrangler deploy --dry-run`) recorded.
  - `[low]` `[reject]` intent: behaviour beyond the ticket's closed change list (verify validates dist copies, early glob counts, origin check, User-Agent, token names, calendar date, `verify dist: ok`) — each an applied review-log minor under the owner's addendum, recorded in build-notes and Design Notes.
  - `[low]` `[patch]` intent: "(ticket 1.11)" tags in AD-18 Deploy lack the date — dated.
  - `[low]` `[reject]` intent: methodology DoD line outside the ticket's doc list — review-log minor applied per the addendum.
  - `[low]` `[reject]` intent: spawn-test shape (failures in a separate test/cwd) — the open major (spawn test runs `verify` and `post-deploy` in one cwd) is met; extra failure spawns add coverage.
  - `[low]` `[reject]` intent: flaky fixture origin not checkable from the diff — capture command and version recorded in the test comment and Implementation Notes as the ticket asks.

## Auto Run Result

**Summary:** The CI flaky report and the deploy `verify dist` / `post-deploy check` moved from inline bash into `scripts/flaky-report.mjs` and `scripts/deploy-check.mjs` (pure exports + guarded CLI, Node built-ins only); each workflow step is one `node scripts/… ` call. The post-deploy check now also asserts immutable on the dictionary and the woff2; `verify` requires exactly one `en-*.txt` and one `*.woff2` and validates the dist copies of `_headers`/`.assetsignore`. Pre-deploy config tests pin `public/_headers`, `public/.assetsignore` and `wrangler.jsonc` (incl. `compatibility_date` ≤ the pinned wrangler's `DEFAULT_COMPAT_DATE`). ci.yml gains a gating `actionlint` step (`rhysd/actionlint:1.7.12`). The review log's open major is built: the deploy-check spawn test runs `verify` and `post-deploy` in one temp cwd.

**Files changed:**
- `scripts/flaky-report.mjs`, `scripts/flaky-report.test.mjs` (new) — flaky report + AD-18 tests incl. a real Playwright 1.63 fixture and CLI spawn.
- `scripts/deploy-check.mjs`, `scripts/deploy-check.test.mjs` (new) — verify, post-deploy, validators, URL/override, http client; local-server and spawn tests, workflow scan (no override, no `${{` in `run:`, secrets only in the deploy step env).
- `scripts/deploy-config.test.mjs` (new) — `_headers`, `.assetsignore`, `wrangler.jsonc` validators on committed and mutated copies.
- `.github/workflows/ci.yml` — actionlint step; flaky report is one `node` call.
- `.github/workflows/deploy.yml` — verify dist and post-deploy check are one `node` call each.
- Docs (tagged "(ticket 1.11, 2026-09-28)"): spine AD-17 Scripts, AD-18 Binds/CI/Deploy, Scaffold deltas; SPEC CAP-8, CAP-9, D6, Assumptions; build-notes CAP-8/CAP-9 (intended changes incl. code-point sort and `DEPLOY_CHECK_BASE_URL`, D3 naming deviation, worst-case timing); delta-checks rows; epic Notes; methodology DoD (local actionlint for workflow edits).

**Review:** 25 findings (high 0, medium 0, low 24, false 1). Patched 7 low entries: override origin check, any-3xx redirect following on `/index.html`, no-follow tests for the index wait and 404 checks, secrets-scope test, wrangler test rename + tab-indented header case, build-notes timing figures, dated spine tags. Deferred 1 (low): AGENTS.md lacks the local-actionlint duty (agent-context file). Rejected with reasons in the Review Triage Log: Scaffold-deltas wording, digest pin, seam validation, spawn-test timing seam, checkout-failure noise, EISDIR/directory cases, plan-records (false), `!Name:` message, stale 1.8 rows, dotfiles, https test (gate 4), gate-4 surfaces, addendum-applied behaviour and docs, spawn-test shape, fixture origin.

**Follow-up review recommended:** false — patched: 0 high, 0 medium, 7 low.

**Verification:** `npm run test:all` exit 0 after patches (Vitest 414 passed, 1.77 s; size budget 473036/600000; dist-smoke 13, e2e 34, pwa 12 passed); `docker run --rm -v "$PWD":/repo -w /repo rhysd/actionlint:1.7.12` exit 0; `node scripts/deploy-check.mjs verify` on the built `dist/` passes; `npx --no-install wrangler deploy --dry-run` succeeds; scratch proofs (reverted): `/sw.js` dropped from `public/_headers` fails 14 AD-18 tests, `${{ }}` in a deploy.yml `run:` fails the workflow scan.

**Residual risks:** the real https path, the real wrangler log format and Cloudflare's responses are first exercised at gate 4 (owner: push `epic-1-scaffold`, confirm CI green incl. actionlint and the flaky-report summary, merge to `main`, push, confirm the Deploy log shows every `ok:` incl. the dictionary and woff2). The actionlint image is pulled anonymously from Docker Hub in CI (tag pin, as the ticket prescribes).
