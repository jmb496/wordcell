# Review log — story-ci-and-deploy-checks-as-tested-scripts.md (ticket 1.11)

State: pass 1: done

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
