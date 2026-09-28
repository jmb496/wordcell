# Review log — story-deploy-to-cloudflare-workers-static-assets.md

Mode: docs, thorough, max 7. Pre-loop copy: /tmp/rl19/pass0.md.

## Pass 1 — 2026-09-28
Reviewers: builder, edge-case, adversarial, ref-alignment  |  Findings (after merge): major 7, minor 8, decision-needed 0  |  Dropped in triage: 1
### Applied
- [major] deploy.yml — build-notes CAP-9 permissions, `npm ci`, secrets env missing → added.
- [major] deploy.yml — checkout ref/Node unspecified → checkout@v7 at `workflow_run.head_sha`, setup-node@v7 Node 24.
- [major] deploy.yml — artifact download path → download-artifact@v8, `name/path: dist`, run-id, token, existence check.
- [major] deploy.yml — `workflows:` matches name `CI`, not file → `workflows: [CI]`.
- [major] deploy.yml — post-deploy check underspecified → URL extraction, real asset probe, exact values, 404s, 6×5 s retry, fail job, no auto-rollback.
- [major] `/index.html` 307 under default html_handling → `curl -sIL`, final 200, html_handling unchanged (deploy check and owner checks).
- [major] actionlint claimed as coverage but manual → Verify step with Docker command; Tests line reworded.
- [minor] origin halt, build-before-dry-run, compatibility_date, cancel-in-progress false + re-run note, --save-exact + lockfile, "entry 8" wording, `.wrangler/` ignore, workbox note → applied.
### Default applied (technical)
- download-artifact major → @v8 (current per gh release view; v8 reads v7 uploads).
- `/index.html` check → follow redirect, keep default html_handling.
- retry policy → 6 × 5 s.
- compatibility_date → build date.
- concurrency → `cancel-in-progress: false`.
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- Local `wrangler dev` header proof (adversarial) — not required by SPEC D6 (dry-run + actionlint are the named local proofs); live checks cover it.

## Pass 2 — 2026-09-28
Reviewers: builder, edge-case, adversarial, ref-alignment  |  Findings (after merge): major 4, minor 11, decision-needed 0  |  Dropped in triage: 1
### Applied
- [major] Local — "dry-run lists no `.vite/`" uncheckable (default output lists no files, verified on 4.141.0) → `WRANGLER_LOG=debug` dry-run must print `Ignoring asset: .vite/manifest.json`.
- [major] Post-deploy — `wrangler deploy | tee` without pipefail hides a failed deploy → `shell: bash` on deploy and check steps.
- [major] Post-deploy — retry semantics ambiguous; curl transport errors abort under `bash -e` → 12 attempts × 5 s, any curl error/mismatch retried, `--max-time 10`, tagged [ASSUMPTION].
- [major] Owner checks — silent assumption of workers.dev subdomain and token scope → owner pre-merge dashboard check; re-run deploy.yml on failure.
- [minor] compatibility_date fallback; `.assetsignore` pre-check; `.wrangler/` gitignore unconditional (verified created); re-run sentence corrected; job shape (ubuntu-latest, timeout 10); CR/whitespace and last-header-block parsing, inline bash; worker-host URL regex; Verify points at Local list; `/index.html` redirect-target rationale; origin halt cites AD-18; D8 script recording marked a suggestion.
### Default applied (technical)
- retry budget → 12 × 5 s; curl `--max-time 10`; job `timeout-minutes: 10`.
- local `.vite` exclusion proof → debug log line.
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- `preview_urls: false` in wrangler.jsonc (adversarial) — adds a key beyond the build-notes key list (rule 7); no player-visible effect; URL regex tightened instead.

## Pass 3 — 2026-09-28
Reviewers: builder, edge-case, adversarial, ref-alignment  |  Findings (after merge): major 3, minor 9, decision-needed 0  |  Dropped in triage: 1
### Applied
- [major] Post-deploy — per-check retry budget (~21 min) exceeded `timeout-minutes: 10` → shared wait on `/` (≤ 24 × 5 s) then 3 attempts per check, every failed attempt logged, fail at first exhausted check; timeout 20 with arithmetic.
- [major] "plan records the observed 307" unsatisfiable in an unattended pre-push build → plan records the expected 307; deploy.yml logs it; owner sees it at gate 4.
- [major] curl form unspecified for most checks → `-sI` without `-L` + 200 for header checks, `-sIL` final block for `/index.html`, single-response status for 404s.
- [minor] wider pre-deploy presence check; `_headers` content equals AD-18 and `test:screens` still passes (workerd in container `npm ci`); workflow_run runs deploy.yml from main HEAD; older-CI re-run marked a side effect, not a rollback path; recovery after artifact expiry and first-deploy DNS errors; owner checks cite AD-18 values by id; version preview URLs not preview deploys (A-A6), key list unchanged; Notes open question → epic owner decision 2026-09-27.
### Default applied (technical)
- propagation wait → shared 24 × 5 s on `/`, 3 attempts per check, `timeout-minutes: 20`.
- `preview_urls` → leave unset; key list unchanged.
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- Origin-halt deviation from SPEC "only if" (adversarial, ref-alignment) — already cites AD-18 prerequisites since pass 2.

## Pass 4 — 2026-09-28
Reviewers: builder, edge-case, adversarial, ref-alignment  |  Findings (after merge): major 2, minor 10, decision-needed 0  |  Dropped in triage: 2
### Applied
- [major] Trigger — a workflow-level `deploy` concurrency group let skipped non-main runs replace a pending main deploy → `branches: [main]`; `if:` and concurrency on the `deploy` job.
- [major] Post-deploy — the shared wait on `/` 200 passed against the previous deployment → wait until `/` body is byte-identical to downloaded `dist/index.html`.
- [minor] one ordered list of 7 checks; exact wrangler.jsonc key set; `dist/.vite/manifest.json` in presence check; exact accepted origin values; `2>&1 | tee "$RUNNER_TEMP/…"`; local pin/key-set proofs; secrets step-level env + `persist-credentials: false`; re-runs use main-HEAD check logic; token from "Edit Cloudflare Workers" template; where `wrangler rollback` runs.
### Default applied (technical)
- new-version detection → byte-compare `/` with `dist/index.html`.
- concurrency placement → job level with `branches: [main]` filter.
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- Exact `_headers` text in the ticket (adversarial) — the plan already quotes the file against AD-18; restating AD-18 in the ticket goes against the cite-by-id policy.
- Assert the 307's own `cache-control` (adversarial) — Cloudflare's header application to redirects is unverified; the ticket logs it for the owner at gate 4, and the final-200 check covers SPEC's line.

## Pass 5 — 2026-09-28
Reviewers: builder, edge-case, adversarial, ref-alignment  |  Findings (after merge): major 1, minor 11, decision-needed 0  |  Dropped in triage: 1
### Applied
- [major] Checks 1–5 — no rule for zero or several `cache-control` lines → exactly one line equal to the AD-18 value; replace-not-merge tagged [ASSUMPTION], verified by the first live deploy.
- [minor] wait wording (proves the new version only when `index.html` changed); re-run reason corrected (re-runs reuse the original commit; older re-run = silent rollback); check 5 no longer claims SPEC compliance, plan records a SPEC CAP-9 erratum for D8/retro, 307 logged or `(none)`; 404 checks for `/_headers` and `/.assetsignore`; lexically first asset; setup time in arithmetic; `preview_urls: false` allowed (A-A6 literal); dry-run `2>&1` and `.wrangler/` ignore proof; owner recovery wording; origin halt labelled as a tightening of SPEC; `hitl` meaning.
### Default applied (technical)
- `preview_urls: false` added to wrangler.jsonc (verified: wrangler 4.141.0 dry-run accepts it without warning); plan records it beyond the build-notes key list.
- cache-control rule → exactly one line.
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- Adding a second identity probe for `_headers`-only changes (adversarial alternative) — accepted the known limit instead, as the reviewer's primary fix.

## Pass 6 — 2026-09-28
Reviewers: builder, edge-case, adversarial, ref-alignment  |  Findings (after merge): major 1, minor 10, decision-needed 0  |  Dropped in triage: 2
### Applied
- [major] Propagation wait — curl-error handling specified only for the checks; under `-eo pipefail` a first-deploy DNS/TLS error would abort on attempt 1 → the wait follows the same capture rule; `curl -s -o` + `cmp -s`, no compression; failed attempts log exit/status, length, hash.
- [minor] owner action if replace-not-merge fails; workflow-level `permissions:`; glob wording; step names in ci.yml style; re-run reuses its own workflow file; cache-miss timing (~17 min); lockfile, key-set and `_headers`/`.assetsignore` upload proofs; check logic first exercised at gate 4; owner checks split Before merge / After push.
### Default applied (technical)
- wait fetch → `curl -s --max-time 10 -o` + `cmp -s`.
- step names → `checkout`, `setup-node`, `npm ci`, `download dist`, `verify dist`, `deploy`, `post-deploy check`.
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- Exact `_headers` text in the ticket (again) — cite-by-id policy; plan quotes the file.
- Local run of the check script against `wrangler dev` — beyond SPEC D6's named local proofs; ticket now states the logic is first exercised at gate 4.

## Pass 7 — 2026-09-28
Reviewers: builder, edge-case, adversarial, ref-alignment  |  Findings (after merge): major 1, minor 10, decision-needed 0  |  Dropped in triage: 2
### Applied
- [major] Local — "ignored or uploaded" halt was undecidable (the debug output only prints `Ignoring asset:` lines) → the output must contain `Ignoring asset:` lines for `.vite/manifest.json`, `_headers` and `.assetsignore` (orchestrator verified all three on wrangler 4.141.0); stop and report if any is missing.
- [minor] permissions wording (ci.yml has only `contents: read`; the source is build-notes); wait curl `-w '%{http_code}'`; `npx --no-install wrangler deploy`; `name: Deploy`; `cmp` byte-identity and job-level concurrency tagged [ASSUMPTION], observed at gate 4; `ssh://` origin forms and origin tightening listed with the errata; lockfile diff-stat check; gate-4 `/index.html` 307 by design, erratum named.
### Default applied (technical)
- `npx --no-install`; workflow `name: Deploy`.
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- dictionary/font presence in `verify dist` — the reviewer notes the postbuild size budget already fails CI without them; no change.
- local manual run of the check snippet — optional, not required by any ref; already documented as first exercised at gate 4.

## Result — capped at 7 passes
Majors per pass: 7, 4, 3, 2, 1, 1, 1. None persisted: every pass surfaced new, narrower majors in the deploy workflow's post-deploy check (a clean-slate spec of a production CI script), and pass 7's only major was fixed with a behaviour verified against wrangler 4.141.0. The pass-7 fix was not re-reviewed. Decision-needed: none.
