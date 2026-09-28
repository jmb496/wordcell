# Review log — story-ci-workflow.md (ticket 1.8)

Mode: docs, depth thorough (builder, edge-case, adversarial, ref-alignment), cap 7. Pre-loop copy: /tmp/wordcell-autopilot/20260928-0053/rl/pass0.md.

## Pass 1 — 2026-09-28
Reviewers: builder, edge-case, adversarial, ref-alignment  |  Findings (after merge): major 8, minor 6, decision-needed 0  |  Dropped in triage: 1 (plus duplicates)
### Applied
- [major] Description / CAP-8 — job split undefined → two jobs `test` and `screens` (`needs: test`)
- [major] Build notes — runner setup (setup-node 24 + npm cache, `npx playwright install --with-deps chromium`) dropped from build-notes CAP-8 → added
- [major] Build notes — screenshot job setup unspecified → checkout, `npm ci`, `test:screens:run`, `options: --init --ipc=host`, image Node, no browser install
- [major] Build notes — bare `playwright test` fails in a `run:` step (no `.bin` on PATH) → `npx` with `env: PW_PREVIEW`
- [major] Build notes — "Playwright reports upload on failure" named no path; CI reporter `github` writes no report → upload `test-results/` per job on failure
- [major] Whole ticket — 1.3 handoff "report flaky retries" dropped → JSON reporter + step-summary/warning flaky list, non-failing; owner gate-4 check
- [major] Whole ticket — 1.3 handoff "checkout path has no `pwa` segment" dropped → default checkout path rule
- [major] Verify — "each step's npm script passes locally" not executable (pwa step is no script; screens throws on host) → explicit ordered local proof list
### Default applied (technical)
- actionlint — command/tag → pinned `rhysd/actionlint:<tag>` docker command, tag recorded in plan
- dist upload — `upload-artifact@v4`, `path: dist/`, `if-no-files-found: error`; actions pinned @v4; handoff artifact layout
- triggers — `push: branches ['**']` (no tags)
- permissions/timeouts — `contents: read`, `timeout-minutes: 30`
- concurrency — `ci-${{ github.ref }}`, cancel-in-progress (no stale deploy on main)
- `.assetsignore` wording — present only once entry 9 adds it
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- Add `! grep -r __wordcell dist/` step — `e2e/pwa/dist-smoke.spec.ts` already has `AD-18 no file in dist/ contains __wordcell`, run by dist-smoke.

## Pass 2 — 2026-09-28
Reviewers: builder, edge-case, adversarial, ref-alignment  |  Findings (after merge): major 7, minor 6, decision-needed 0  |  Dropped in triage: 0 (duplicates merged)
### Applied
- [major] Flaky report — JSON path could fall under `test-results/` (wiped each run) → `${{ runner.temp }}/pw-json/<step>.json`
- [major] Flaky report — reporter flags would not reach npm-script steps without `--` → exact three step commands with ids
- [major] Flaky report — missing/unparseable JSON and parser location unspecified (rule 6, SPEC D3) → inline `jq`, outcome-gated reads, "not run", loud failure on a ran step's missing file, always a heading or `No flaky tests.`, escaped warnings
- [major] Verify — flaky logic unproven → local proof against a real report and a hand-made flaky report
- [major] Handoff — workflow `name:` unfixed while entry 9 matches `workflow_run` by name → `name: CI`
- [major] Uploads — re-run fails on name conflict → `overwrite: true`
- [major] Verify — ran in a pre-populated tree → fresh `git worktree` at `/tmp/wordcell-ci-proof`
### Default applied (technical)
- Actions — current majors at build time, recorded; entry 9 matches
- Verify — plan quotes ci.yml step order and `screens` lines against the delta row
- actionlint — no `-color`; exit 0 and empty output
- Gate 4 — `gh run download` layout check (`index.html`, `.vite/manifest.json`)
- Flaky report is names only (no traces), stated
- Push + PR double runs are intended, stated
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- none

## Pass 3 — 2026-09-28
Reviewers: builder, edge-case, adversarial, ref-alignment  |  Findings (after merge): major 4, minor 10, decision-needed 0  |  Dropped in triage: 0 (duplicates merged)
### Applied
- [major] Flaky report — script used `${{ }}` so the "exact" local proof could not run → all inputs via step `env:`, no expressions in `run:`
- [major] Flaky report — summary format and proof expectations inexact → exact summary format; cases (a), (b), (c) with exact outcomes
- [major] Flaky report — flat fixture would pass a non-recursive filter → recursive walk; nested-describe fixture from real JSON, `%` in title; `mktemp -d`
- [major] Verify — `reuseExistingServer` could test another tree → ports 5173/4173 free first
### Default applied (technical)
- Worktree method (prefer local commit; `git add -N` + apply; confirm ci.yml present)
- Root-owned cleanup after the Docker wrapper; `git worktree remove --force`
- `.only` grep and no new snapshot files after `test:screens`
- `test` and `screens` step names/order; timeout gives no report (accepted)
- Plan quotes top-level keys, timeouts, uploads
- Concurrency claim narrowed; Handoff recommends entry 9 guard `head_sha == main` tip
- Gate 4: both jobs ran (not skipped) and succeeded
- Spec amendment line: "every push" reading and `test-results/` as "Playwright reports"
- `npm run test:all` added to Verify (AGENTS.md)
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- none

## Pass 4 — 2026-09-28
Reviewers: builder, edge-case, adversarial, ref-alignment  |  Findings (after merge): major 3, minor 13, decision-needed 0  |  Dropped in triage: 1 (plus duplicates)
### Applied
- [major] Flaky report — `..` walk loses describe titles, file suite would repeat → path-carrying recursive jq function; per spec × project; exact expected line in 7(b)
- [major] Report step shell unstated (errexit/pipefail differ) → `shell: bash`; proof runs the body with `bash --noprofile --norc -eo pipefail`; explicit `exit 1`
- [major] Unproven branches → proof cases (d) failure without JSON, (e) failure with JSON; (c) fully stated
### Default applied (technical)
- Unparseable JSON always fails the report step (rule 6)
- Summary text fixed (`## Flaky tests`, list items, warning format)
- `PW_JSON_DIR` not pre-created in proof (a)
- `retention-days: 7` on uploads
- `screens` Node version recorded
- Host index restored after `git add -N`
- `.only` grep covers `e2e src`; snapshot check path-limited
- Step names are exactly the listed names
- Spine "every push" reading recorded as rule-7 deviation under the technical-defaults delegation, confirmed at gate 4
- `head_sha` guard reworded as a proposal for entry 9's review loop
- pwa step cites the epic owner decision
- 1.3 deferral closure line under Delta checks
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- `::warning::` duplicates `github` reporter annotations (stretch; the warnings are the only flaky-marked annotation)

## Pass 5 — 2026-09-28
Reviewers: builder, edge-case, adversarial, ref-alignment  |  Findings (after merge): major 3, minor 14, decision-needed 0  |  Dropped in triage: 0 (duplicates merged; 1 orchestrator-triage finding added: wrong epic decision cited)
### Applied
- [major] Flaky report — warning text vs summary text ambiguous → one join rule, warning = item text escaped; exact expected lines in 7(b), incl. a file-level test
- [major] Unparseable-JSON rule unproven → proof case 7(f)
- [major] actionlint shellcheck SC2016 on the single-quoted jq filter would break "empty output" → `# shellcheck disable=SC2016` directive
### Default applied (technical)
- pwa step cites the right epic decision (line 59); jq function renamed `specs_with_path`
- Item order; validate-before-write (empty summary on exit 1); unknown outcome exits 1; errors to stderr
- Double-backtick code spans; CR/LF → space
- `.only` grep covers `scripts`; fallback `git apply --index`
- Port check with exit code; snapshot check with `--untracked-files=all`
- Fixture sources explicit; nested fixture construction
- Step 4 test commands in CI mode with the exact reporter args
- Worktree cleanup before retry; whole-index reset stated
- Image Node compared with 22.12, halt if lower
- Rule-7 wording: delegation satisfies the ask; gate 4 notes it
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- none

## Pass 6 — 2026-09-28
(Resumed session: pass 5's Applied list checked against the ticket; all items present, no re-fix needed.)
Reviewers: builder, edge-case, adversarial, ref-alignment  |  Findings (after merge): major 2, minor 10, decision-needed 0  |  Dropped in triage: 0 (duplicates merged; 1 minor rejected in favour of the alternative default, see Default applied)
### Applied
- [major] Verify 5 → 7(a) — `test:screens` runs as root in the /tmp worktree, leaving a root-owned `test-results/`; the host Playwright run in 7(a) would fail with EACCES clearing outputDir → the docker `rm -rf /work/test-results` now runs straight after step 5; step 8 keeps it for retries
- [major] Flaky report order — the filter emits a suite's own specs before its child suites, so 7(b)'s expected order was reversed and "JSON document order" was ambiguous → order defined as the filter's emission order (own specs first, then child suites, depth-first); 7(b) lines and warnings swapped
### Default applied (technical)
- Verify 7 — run body extracted mechanically with pinned `mikefarah/yq` docker, plan records command and tag
- Verify 7 — a not-yet-existing `PW_JSON_DIR` applies to (a) only; (b)–(g) each get a fresh `mktemp -d` directory
- 7(e) expects exactly (b)'s lines and warnings
- New case 7(g): all steps skipped, `PW_JSON_DIR` absent → three not-run lines, `No flaky tests.`, exit 0; `No flaky tests.` still written when no report was read (kept over "omit it", the not-run lines explain)
- One text pipeline (join, CR/LF → space) for summary and warning; warning escapes `%`
- Summary and warnings buffered; written only after every jq call succeeds (shape errors leave the summary empty)
- 7(a) rerun if a genuine flake appears; (b) built from a clean (a)
- Code-span claim narrowed to single backticks
- Step 5: CI-mode screens path proven by snapshot check plus gate 4
- "Actions pinned" → referenced by major tag (`@vN`, not SHA)
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- none

## Pass 7 — 2026-09-28
Reviewers: builder, edge-case, adversarial, ref-alignment  |  Findings (after merge): major 3, minor 9, decision-needed 0  |  Dropped in triage: 2 (plus duplicates)
### Applied
- [major] Flaky report — unknown-outcome and wrong-shape-JSON (`{}`) rules had no proof case; shape-error exit semantics half specified → shape error handled like a parse error (explicit `exit 1`, stderr names the step id); cases 7(h) (`OUTCOME_E2E=cancelled`) and 7(i) (`e2e.json` = `{}`)
- [major] Verify 7 — normal green path (real multi-project `e2e.json`, real `pwa.json`, all `success`) never exercised → cases 7(j) (step 4's three real reports) and 7(k) (one spec flaky on android and desktop, `tests[]` order)
- [major] Verify 7(f) — "write nothing when a later report fails" untested (clean dist-smoke) → (f) uses (b)'s flaky fixture and asserts no `::warning::` on stdout
### Default applied (technical)
- Verify 7 — variables exported (or `VAR=value` prefixes) for the child bash; fresh dirs for (b)–(k)
- (a), (d), (g) assert no `::warning::`; (d) full summary spelled out
- SC2016 directive on one `filter='…'` assignment; every jq call uses `"$filter"`
- Order within a spec: `tests[]` order as written
- Step 3 reason corrected (guards step 5's non-CI screens run)
- Step 2 retry: remove registered worktree, else `rm -rf`, then prune
- 7(a) reruns capped at 3, then halt (rule 6)
- Plan records `jq --version`
- Step 1: `CI=1` (`reuseExistingServer` off) is the real guard; `ss` is a pre-check
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- Step 5: add a local CI-mode screens container run — settled in pass 6 (snapshot check plus gate 4 default); re-litigation
- Double-backtick titles break the code span — settled in pass 6 (claim narrowed to single backticks)

## Result — capped at 7 passes
Majors per pass: 8, 7, 4, 3, 3, 2, 3 (all fixed; pass 7's fixes were applied but not re-reviewed). Every late major sat in the Verify proof harness for the non-gating flaky-report step (proof-case coverage, local ordering), not in the CI workflow's shape; no functionality, UX or gameplay decisions arose.
