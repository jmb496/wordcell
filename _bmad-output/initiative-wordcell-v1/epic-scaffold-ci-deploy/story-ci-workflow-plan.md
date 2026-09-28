---
title: 'CI workflow (ci.yml)'
type: 'feature'
ticket: '8'
created: '2026-09-28'
status: done
route: 'full'
route_source: 'auto'
baseline_revision: '21d7b807e7b49cb624e84f79f3fb9b6ed13d4a0b'
review: 'thorough'
review_source: 'auto'
lenses_ran: [blind-hunter, edge-case-hunter, verification-gap, intent-alignment]
review_loop_iteration: 0
followup_review_recommended: false
context:
  - '{project-root}/_bmad-output/initiative-wordcell-v1/epic-scaffold-ci-deploy/story-ci-workflow.md'
warnings: []
deferred:
  - summary: >-
      The screens container image tag (v1.63.0-noble) and the locked @playwright/test version are coupled only by convention.
    evidence: |-
      package.json test:screens (ticket 1.7) and ci.yml screens both pin mcr.microsoft.com/playwright:v1.63.0-noble while package.json has ^1.63.0 (locked 1.63.0); a lockfile bump without an image bump breaks screens with a missing-browser error. Pre-existing coupling from ticket 1.7, extended here.
    location: >-
      .github/workflows/ci.yml screens.container.image
    severity: low
  - summary: >-
      The flaky report's inline bash/jq has no repeatable automated test; only the one-off Verify step 7 (a)-(k) proof covers it.
    evidence: |-
      No test in test:all extracts or runs the report body; the ticket forbids a new scripts/ file and package.json changes, so a harness is a follow-up decision.
    location: >-
      .github/workflows/ci.yml flaky report
    severity: medium
  - summary: >-
      actionlint runs only by hand (Docker rhysd/actionlint:1.7.12); no local script or CI step lints workflows.
    evidence: |-
      npm run lint is biome only; the ticket excludes actionlint config/flag changes, so a gate is a separate decision.
    location: >-
      .github/workflows/
    severity: low
---

<intent-contract>

## Intent

**Problem:** There is no CI: nothing runs lint, check, unit, build (size budget), dist-smoke, e2e, pwa and screenshots on push, and entry 9's deploy has no tested `dist/` artifact to ship.

**Approach:** Add `.github/workflows/ci.yml` with two jobs, `test` (runner) and `screens` (`needs: test`, in the pinned Playwright container), exactly as the ticket's Build notes fix them, including an inline-`jq` flaky report; prove it locally per the ticket's Verify steps 1–9.

## Boundaries & Constraints

**Always:** The ticket file (`context`) is the authority for every value: step names/order, triggers, permissions, concurrency, timeouts, upload inputs, env, the flaky-report semantics and its Verify cases (a)–(k). Actions by major tag: `actions/checkout@v7`, `actions/setup-node@v7`, `actions/upload-artifact@v7` (current majors per `gh release view` on 2026-09-28: v7.0.1, v7.0.0, v7.0.1; upload-artifact v7 has `include-hidden-files`, `overwrite`). Report step `run:` body has no `${{ }}`; the jq filter is one single-quoted `filter='…'` preceded by `# shellcheck disable=SC2016`. Validate all inputs and run every `jq` before writing summary or warnings; errors `exit 1` with a `>&2` message naming the step id.

**Never:** No new file under `scripts/`, no change to `package.json`, Playwright configs, actionlint config or flags; no `path:` on checkout; no `setup-node`/`playwright install` in `screens`; no push (gate 4 is the owner's).

## I/O & Edge-Case Matrix

The flaky report's cases are the ticket's Verify step 7 (a)–(k); they are the matrix and are not restated here.

</intent-contract>

## Code Map

- `.github/workflows/ci.yml` -- new; the only source change.
- `package.json` -- read only: `test:e2e`, `test:e2e:dist` (`PW_PREVIEW=dist … --project dist-smoke`), `build:test`, `test:screens:run`; `pretest:e2e`/`prebuild` build the dictionary.
- `playwright.config.ts`, `playwright.pwa.config.ts` -- read only: CI → `retries: 2`, `forbidOnly`, `github` reporter (the CLI `--reporter=github,json` overrides it); `PW_PREVIEW` must be `dist` or `dist-test`.
- `playwright.screens.config.ts` -- read only: throws unless `WORDCELL_SCREENS_CONTAINER=1`; CI → `updateSnapshots: 'none'`.
- `e2e/pwa/dist-smoke.spec.ts` -- read only; its specs feed Verify 7(a)/(b).
- `story-screenshot-pipeline-in-the-playwright-container-plan.md` -- continuity: image Node `v24.20.0` (≥ 22.12); the container writes root-owned `test-results/` (hence Verify step 5's docker cleanup).

## Tasks & Acceptance

**Execution:**
- [x] `.github/workflows/ci.yml` -- write per the ticket Build notes (both jobs, all steps, the flaky report) -- CAP-8.
- [x] Verify steps 1–9 of the ticket in order from `/tmp/wordcell-ci-proof` (worktree of the local commit, or HEAD + applied diff), recording commands, tags (`rhysd/actionlint`, `mikefarah/yq`, `jq --version`) and results in Implementation Notes -- D6 local proof.

**Acceptance Criteria:**
- Given the worktree, when Verify steps 1–8 run, then each exits 0 as the ticket states and 7(a)–(k) produce exactly the ticket's summaries, warnings and exit codes.
- Given the host tree, when `npm run test:all` runs, then it exits 0.
- Given `ci.yml`, when its `name`, `on`, `permissions`, `concurrency`, `timeout-minutes`, step names, dist upload inputs, `if: failure()` uploads and `screens` `container`/`env`/`needs` are quoted in the plan, then they match the Build notes and SPEC CAP-8 delta row.

## Implementation Notes

Tool versions: actions majors per `gh release view` on 2026-09-28: checkout v7.0.1, setup-node v7.0.0, upload-artifact v7.0.1 → `@v7` (entry 9's `download-artifact` uses its matching current major). `rhysd/actionlint:1.7.12`, `mikefarah/yq:4.53.6`, `jq-1.7` (host). Container Node: `docker run --rm mcr.microsoft.com/playwright:v1.63.0-noble node --version` → `v24.20.0` (≥ 22.12, OK).

ci.yml quotes (checked against Build notes and the SPEC CAP-8 delta row):
- `name: CI`; `on: push: branches: ['**']` and `pull_request:`; `permissions: contents: read`; `concurrency: group: ci-${{ github.ref }}`, `cancel-in-progress: true`; `timeout-minutes: 30` on `test` and on `screens`.
- `test` steps: checkout, setup-node, npm ci, playwright install, lint, check, unit, build, dist-smoke, upload dist, build:test, e2e, pwa, flaky report (`if: ${{ !cancelled() }}`), upload test-results (`if: failure()`, name `test-results-test`, `path: test-results/`, `if-no-files-found: ignore`, `retention-days: 7`, `overwrite: true`).
- upload dist: `name: dist`, `path: dist/`, `include-hidden-files: true`, `if-no-files-found: error`, `retention-days: 7`, `overwrite: true`.
- `screens`: `needs: test`; `container: image: mcr.microsoft.com/playwright:v1.63.0-noble`, `options: --init --ipc=host`; `env: WORDCELL_SCREENS_CONTAINER: '1'`; steps checkout, npm ci, test:screens:run, upload test-results (`if: failure()`, name `test-results-screens`, same inputs as above). No setup-node, no playwright install, no `path:` on any checkout.
- Report step: `shell: bash`, body free of `${{ }}`; the line before `filter='…'` is `# shellcheck disable=SC2016`.

Local proof (D6), uncommitted route (no commit was asked): `git worktree add --detach /tmp/wordcell-ci-proof HEAD` (21d7b80; no prior path), then `git add -N . && git diff HEAD --binary | git -C /tmp/wordcell-ci-proof apply --index`, then `git reset -q` on the host (host index restored; `git status` shows only `?? .github/` and `?? …plan.md`). `/tmp/wordcell-ci-proof/.github/workflows/ci.yml` exists; no `generated/`, `dist/`, `dist-test/`, `test-results/` in the worktree.
1. `ss -ltnH '( sport = :5173 or sport = :4173 )'` → empty output; check exits 0.
2. As above.
3. `! git -C /tmp/wordcell-ci-proof grep -nE '\.only\(' -- e2e src scripts` → exit 0.
4. `PW_JSON_DIR=/tmp/tmp.x1BhmQqXPu` (own `mktemp -d`). `npm ci`, `lint` (50 files, clean), `check` (0 errors), `CI=1 npm test` (309 passed), `build` (size budget 473036 / 600000), dist-smoke (2 passed, incl. `AD-18 no file in dist/ contains __wordcell`), `build:test`, e2e (33 passed, 23 skipped), pwa (12 passed): all exit 0; JSON stats `unexpected: 0`, `flaky: 0` in all three.
5. `npm run test:screens` → 2 passed (android, desktop `AD-17 placeholder board screenshot`); `git status --porcelain --untracked-files=all -- e2e` → empty (no `-snapshots/` line); `docker run --rm -v /tmp/wordcell-ci-proof:/work mcr.microsoft.com/playwright:v1.63.0-noble rm -rf /work/test-results` → exit 0.
6. `docker run --rm -v "$PWD":/repo -w /repo rhysd/actionlint:1.7.12` → exit 0, empty output (host tree and worktree).
7. Extract: `docker run --rm -v "$PWD":/w -w /w mikefarah/yq:4.53.6 '.jobs.test.steps[] | select(.name == "flaky report") | .run' .github/workflows/ci.yml > "$tmp"`, run as `OUTCOME_…=… PW_JSON_DIR=… GITHUB_STEP_SUMMARY=<mktemp> bash --noprofile --norc -eo pipefail "$tmp"`; each case its own `mktemp -d`.
   - (a) `PW_JSON_DIR=/tmp/tmp.mqVTcETiz9/pw-json` (created by Playwright), success/skipped/skipped, 2 passed, no flaky entry → `## Flaky tests`, `- e2e: not run`, `- pwa: not run`, `- No flaky tests.`; exit 0; stdout empty.
   - (b) fixture from (a) (projectName `dist-smoke`, file `dist-smoke.spec.ts`), success/skipped/skipped → exit 0; summary `## Flaky tests`, `- e2e: not run`, `- pwa: not run`, ``- `` dist-smoke > dist-smoke.spec.ts > AD-18 no file in dist/ contains __wordcell `` ``, ``- `` dist-smoke > dist-smoke.spec.ts > outer > inner > AD-18 production build loads with 52 live cards, no errors and no test hook 100% `` ``; stdout `::warning::Flaky: dist-smoke > dist-smoke.spec.ts > AD-18 no file in dist/ contains __wordcell`, `::warning::Flaky: dist-smoke > dist-smoke.spec.ts > outer > inner > AD-18 production build loads with 52 live cards, no errors and no test hook 100%25`.
   - (c) success/success/skipped, no e2e.json → exit 1, stderr `flaky report: step e2e succeeded but …/e2e.json is missing`, summary 0 bytes.
   - (d) success/failure/skipped, no e2e.json → exit 0; `## Flaky tests`, `- e2e: failed before reporting`, `- pwa: not run`, `- No flaky tests.`; stdout empty.
   - (e) (b) fixture, failure/skipped/skipped → exit 0, summary and warnings identical to (b).
   - (f) (b) fixture + truncated `e2e.json`; e2e `failure` and `success` → both exit 1, stderr `flaky report: step e2e JSON …/e2e.json does not parse` (after jq's own parse error), summary 0 bytes, stdout empty.
   - (g) skipped×3, nonexistent dir → exit 0; `## Flaky tests`, `- dist-smoke: not run`, `- e2e: not run`, `- pwa: not run`, `- No flaky tests.`; stdout empty.
   - (h) e2e `cancelled` → exit 1, stderr `flaky report: step e2e has unexpected outcome 'cancelled'`, summary 0 bytes, stdout empty.
   - (i) e2e.json `{}` → exit 1, stderr `flaky report: step e2e JSON …/e2e.json has an unexpected shape (no .suites array)`, summary 0 bytes, stdout empty.
   - (j) step 4's three JSON files, success×3 → exit 0; `## Flaky tests`, `- No flaky tests.`; stdout empty. Deviation found: Playwright 1.63's JSON reporter does not merge android and desktop into one spec's `tests[]`; it writes one spec entry per project (same title, different `id`), each with one test. The report handles both shapes unchanged.
   - (k) because of (j)'s finding, the fixture merges `smoke.spec.ts`'s android and desktop spec entries into one spec whose two `tests[]` (android, desktop) are both `flaky`; skipped/success/skipped → exit 0; `- dist-smoke: not run`, `- pwa: not run`, ``- `` android > smoke.spec.ts > AD-17 placeholder board renders 52 live card elements with AD-14 attributes `` ``, ``- `` desktop > smoke.spec.ts > AD-17 placeholder board renders 52 live card elements with AD-14 attributes `` ``, matching warnings. Extra (k2), the real per-project shape (both separate spec entries flaky) → identical output.
8. docker `test-results` cleanup → exit 0; `git worktree remove --force /tmp/wordcell-ci-proof` → exit 0.
9. `npm run test:all` on the host tree → exit 0.

## Plan Change Log

## Review Triage Log

### 2026-09-28 — Review pass
- verdicts: 17 findings — high 0, medium 1, low 7, false 9, maybe-false 0
- findings:
  - `[false]` `[reject]` Same-repo PRs run CI twice and entry 9 may deploy a PR dist — intended by the ticket Build notes (PR run tests the merge result); entry 9 filters `event == 'push'` and `head_branch == 'main'` per build-notes CAP-9.
  - `[false]` `[reject]` (j) Playwright-shape deviation not in the Plan Change Log — fix edits this build's plan; deviation is recorded in Implementation Notes and raised as an owner note for the retrospective.
  - `[false]` `[reject]` Plan status stale at `in-progress` — the diff was staged mid-workflow; status advances to `built` at Finalize.
  - `[false]` `[reject]` First AC says "exits 0" though 7(c)/(f)/(h)/(i) exit 1 — AC reads "as the ticket states"; fix would edit this build's plan.
  - `[false]` `[reject]` Verification section keeps `<tag>` placeholder — fix edits this build's plan; the pinned tag 1.7.12 is in Implementation Notes.
  - `[low]` `[defer]` Container image tag not tied to the locked Playwright version — real but pre-existing coupling from ticket 1.7 (`package.json` `test:screens`); deferred.
  - `[low]` `[reject]` More than 10 flaky warnings would be truncated by GitHub annotation limits — unlikely (expected zero flakes) and the step summary remains the complete list.
  - `[low]` `[reject]` No Playwright browser or container npm cache — performance only, not in the ticket; runs fit well inside 30 min.
  - `[low]` `[reject]` screens Node (image v24.20.0) vs test `node-version: 24` not identical — both Node 24 ≥ engines 22.12; pinning adds maintenance for no named harm.
  - `[false]` `[reject]` Timeout loses flaky report and test-results upload — the ticket explicitly accepts "a job timeout counts as cancelled, so no report then" and fixes `if: failure()`.
  - `[low]` `[reject]` Double backtick inside a test title breaks the summary code span — ticket fixes the double-backtick span; titles are id-led prose, unlikely to contain ``` `` ```, and the fix adds branches.
  - `[medium]` `[defer]` Flaky report has no repeatable test (verification-gap, pre-verified, filed disposition defer) — ticket forbids the scripts/package.json changes a harness needs; deferred.
  - `[low]` `[defer]` actionlint not in any automated path (verification-gap, filed defer) — ticket excludes actionlint config/flags; deferred.
  - `[false]` `[reject]` GitHub-runtime behaviour (R2) is unproven locally — by design: the ticket assigns it to gate 4 (owner push).
  - `[low]` `[reject]` Real Playwright 1.63 JSON writes one spec entry per project, so (k) used a hand-merged fixture — report output verified identical for the real shape (k2); no code change; owner note for the retrospective/ticket wording.
  - `[low]` `[reject]` Deeper shape errors (spec without `tests`) print jq's own message before the named-step message; non-array `.specs` skipped by the ticket-prescribed `[]?` — the named message and exit 1 still occur; the `[]?` is the ticket's filter; Playwright never emits such shapes.
  - `[false]` `[reject]` `unit` runs plain `npm test` and `pwa` uses `npx` (no pre-hook) — GitHub sets `CI=true`; the ticket fixes these run lines and `build:test` already generated the dictionary.

## Design Notes

Filter shape (from the Build notes): `def specs_with_path($p): (.specs[]? | {p: $p, s: .}), (.suites[]? | specs_with_path($p + [.title])); .suites[] | specs_with_path([])`, then per `.s.tests[]` with `status == "flaky"` emit `[projectName, .s.file] + .p + [.s.title] | join(" > ")` with CR/LF → space. Shape checks (e.g. `.suites` must be an array) go through `jq -e` so `{}` fails with a named-step message rather than jq's own.

## Verification

**Commands:**
- `docker run --rm -v "$PWD":/repo -w /repo rhysd/actionlint:<tag>` -- expected: exit 0, empty output.
- Ticket Verify steps 1–9 -- expected: as stated in the ticket.

## Auto Run Result

- **Summary:** added `.github/workflows/ci.yml` (`name: CI`): `test` job (Node 24, npm ci, playwright install, lint → check → unit → build (size budget) → dist-smoke → upload `dist` (hidden files) → build:test → e2e → pwa → flaky report → failure upload) and `screens` job (`needs: test`, Playwright v1.63.0-noble container, `WORDCELL_SCREENS_CONTAINER: '1'`, `test:screens:run`, failure upload). Actions at `@v7`.
- **Files:** `.github/workflows/ci.yml` (new, the workflow); this plan (new).
- **Review:** thorough, 17 findings; patches 0; deferred 3 (image/lockfile coupling, no repeatable flaky-report test, actionlint not automated); rejected 14 with reasons in the triage log.
- **Follow-up review recommended:** false (no patches; 0 high, 0 medium patched).
- **Verification:** ticket Verify steps 1–9 all as specified (see Implementation Notes); actionlint 1.7.12 re-run by the orchestrating session on the host tree: exit 0, empty output; host `npm run test:all` exit 0 (pwa 12 passed).
- **Residual risks:** GitHub-runtime behaviour (container checkout, `steps.*.outcome`, artifact contents incl. `.vite/manifest.json`, real annotations) is proven only at gate 4 by the first pushed run. Playwright 1.63's JSON writes one spec entry per project, not merged `tests[]` as the ticket assumed; the report handles both.
