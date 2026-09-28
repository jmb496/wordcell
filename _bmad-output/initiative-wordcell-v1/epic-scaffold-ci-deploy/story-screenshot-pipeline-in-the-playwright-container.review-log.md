# Review log — story-screenshot-pipeline-in-the-playwright-container (ticket 1.7)

Mode: docs, thorough, max 7. Pre-loop copy: /tmp/wordcell-autopilot/20260928-0053/review-loop/1.7.pass0.md.

## Pass 1 — 2026-09-28
Reviewers: builder, edge-case, adversarial, ref-alignment  |  Findings: major 6, minor 3, decision-needed 0  |  Dropped in triage: 5
### Applied
- [major] Verify/Tests — first-run baseline generation undefined (`updateSnapshots: 'missing'` fails the first run; wrapper could not forward `--update-snapshots`) → args forwarded via `sh -c '…' screens`; Verify uses `-- --update-snapshots` then a plain run; CI uses `updateSnapshots: 'none'`.
- [major] Tests — docker command not concrete → exact command pinned, image tag tied to locked `@playwright/test`.
- [major] Tests — `playwright.screens.config.ts` contents unspecified → mirrors default config with listed exceptions.
- [major] Tests — spec capture and readiness wait unspecified → goto, 52 cards visible, `document.fonts.ready`, viewport `placeholder-board.png`.
- [major] Tests — host ban unenforced (rule 6) → config throws unless `WORDCELL_SCREENS_CONTAINER=1`; verify line for host failure; note for ticket 8.
- [major] AGENTS.md TODO — resulting text not given, conflicted with the line's own instruction vs D8 → exact after-text per D8.
- [minor] Notes/First step — stale Docker open question → resolved.
- [minor] Verify — no proof a comparison happened → negative check as plan evidence.
- [minor] Tests — root-owned files on /mnt/d, `npm ci` over volume mount point → plan evidence, halt on failure.
### Default applied (technical)
- Baseline generation → forward args, `-- --update-snapshots`.
- Docker flags → `--init --ipc=host`, `/work`, volume `wordcell-screens-node-modules`, bridge network.
- Screens config → mirror default config; `retries: 0`, `reuseExistingServer: false`, CI `updateSnapshots: 'none'`.
- Capture → viewport after 52 cards and fonts ready.
- Host guard → `WORDCELL_SCREENS_CONTAINER` env var, fail fast.
- AGENTS.md TODO → keep a one-sentence shell for the D8 audit.
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- Set `hitl: false` — the orchestrator/board (tickets.toml) owns the hitl flag; the run is already authorised past it; out of the ticket's scope.
- Pin `@playwright/test` exactly in package.json — covered by the image-tag/lock note.
- Vite dep-optimisation reload flake — covered by the readiness wait and toHaveScreenshot stable-frame retry.
- `maxDiffPixels: 0` tolerance — the default config's 0.01 ratio kept for consistency.
- Duplicates across lenses merged.

## Pass 2 — 2026-09-28
Reviewers: builder, edge-case, adversarial, ref-alignment  |  Findings: major 1, minor 7, decision-needed 0  |  Dropped in triage: 6
### Applied
- [major] Tests — `document.fonts.ready` resolves on a failed woff2, so a fallback-font baseline would pass silently (rule 6) → assert the WordCell Serif face `loaded` as in `e2e/pwa/font.spec.ts`.
- [minor] Verify/config — host-guard error text unspecified → exact message; Verify matches it.
- [minor] Verify/Plan evidence — `git status` reference point; "committed baseline" → `--porcelain` equality after the update run; "generated baseline".
- [minor] Plan evidence — CSS tweak may stay under 1% → overwrite desktop PNG with android PNG, restore saved copy.
- [minor] Plan evidence — `test-results/` ownership → added; proof via host `test` and `test:e2e`.
- [minor] Config — testIgnore ambiguity, unlisted fields → no testIgnore; unlisted fields copied unchanged.
- [minor] Tests — desktop viewport crop → stated as intended.
- [minor] AGENTS.md TODO — managed-block hand edit → D8 cited as authority.
### Default applied (technical)
- Font precondition, guard message, negative-check method, porcelain comparison.
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- Exact pin of `@playwright/test` (twice raised) — lock + prose coupling suffices for this ticket; no rule requires the pin.
- Epic "Unknown: Docker" note stale — epic file outside the ticket; the orchestrator/mark-done step owns it.
- JSON escaping of the command in package.json — obvious to the builder.
- Concurrent runs sharing the named volume; npm cache volume; webServer timeout — unlikely, obvious handling.
- Technical-claims confirmation (builder lens) — not a defect.

## Pass 3 — 2026-09-28
Reviewers: builder, edge-case, adversarial, ref-alignment  |  Findings: major 1, minor 10, decision-needed 0  |  Dropped in triage: 5
### Applied
- [major] `test:screens` — container file ownership unspecified: npm 7+ as root runs lifecycle scripts as the `/work` owner, so a root-owned named volume / npm cache can EACCES → chown the volume to the `/work` owner, cache writable by every uid (or run as the owner via `setpriv`); plan records the uids.
- [minor] Negative check → desktop PNG copied to `/tmp`, size or pixel mismatch counts, plain run green after restore.
- [minor] Ownership evidence → snapshot directory added.
- [minor] Verify → exact `env -u WORDCELL_SCREENS_CONTAINER …` command.
- [minor] Verify → first porcelain output lists only the snapshot dir plus the ticket's own files.
- [minor] Delta checks → host `WORDCELL_SCREENS_CONTAINER=1` only for `--list`.
- [minor] Tests → font assertions copied exactly; wording covers the card-visibility wait.
- [minor] Config → `predev` staleness-gated wording; local missing-baseline outcome.
- [minor] `test:screens` → POSIX shell, network, one run at a time.
- [minor] AGENTS.md TODO → D8 wins over the line's own removal instruction.
### Default applied (technical)
- Container ownership: chown volume to `/work` owner + shared npm cache (or setpriv), builder's simplest working form.
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- `hitl: false` / relabel first step (raised again) — board and orchestrator own the flag; unchanged.
- Playwright version check in config — prose coupling kept.
- Cold Vite cache / raising webServer timeout — halt rule already covers it; no pre-authorised workaround.
- `"$PWD"` JSON escaping — folded into item 10.
- Duplicates across lenses.

## Pass 4 — 2026-09-28
Reviewers: builder, edge-case, adversarial, ref-alignment  |  Findings: major 1, minor 7, decision-needed 0  |  Dropped in triage: 8
### Applied
- [major] `test:screens` — pass 3's ownership prelude rested on a false premise (npm 9+, here npm 11.12.1, no longer runs scripts as the cwd owner; its docs have no such rule) and made the "exact" command inexact → prelude removed; everything runs as root, plan records `/work` owner, the host-write check proves writability, failure halts. (Corrects the pass 3 log entry.)
- [minor] Negative check → stated as a size-mismatch smoke check.
- [minor] Font precondition → copy font.spec.ts's `page.evaluate` block and two `expect`s verbatim, no separate `load`.
- [minor] Concurrency → no host Playwright run during a screens run (shared `test-results/`).
- [minor] Verify/Plan evidence → all run before the build's local commit.
- [minor] Desktop crop → "may crop", accepted until epic 4.
- [minor] Plan evidence → record container node/npm versions.
- [minor] References → SPEC.md and delta-checks.md added.
### Default applied (technical)
- Container runs as root, no uid switching; rely on drvfs ownership mapping, verified by the host-write check.
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- setpriv form / recursive chown / HOME for non-root uid — moot after the prelude was removed.
- `git diff --stat` before/after container runs — porcelain + host checks suffice.
- `"$(pwd)"` over `"$PWD"` — sh resets PWD to the real cwd; npm sets cwd to the package root.
- `hitl: false` and epic "Unknown: Docker" note (raised again) — owned by the board/orchestrator, outside this ticket.
- Duplicates across lenses.

## Pass 5 — 2026-09-28
Reviewers: builder, edge-case, adversarial, ref-alignment  |  Findings: major 3, minor 5, decision-needed 0  |  Dropped in triage: 9
### Applied
- [major] Plan evidence — container node/npm/`/work` owner required but no command gives them → separate probe `docker run` after the first update run.
- [major] Verify porcelain — "ticket's own files" unlisted; build writes under `_bmad-output/` → captures scoped `-- . ':!_bmad-output'`, exact expected set, edits finished first.
- [major] Ticket 8 hand-off — env var note only in ticket 7 would break CI's screens job → this ticket's diff adds the line to story-ci-workflow.md and build-notes CAP-8.
- [minor] Host `test:all` after container runs (AGENTS.md).
- [minor] `--update-snapshots` mode `changed` wording; `=all` to force.
- [minor] "second run's `npm ci`" → every run after the first.
- [minor] Guard check for a non-`1` value.
- [minor] webServer timeout / Vite reload → halt; record start time.
### Default applied (technical)
- Probe run; porcelain scope and expected set; ticket 8/CAP-8 one-line hand-off.
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- Pin `@playwright/test` exactly; `"$PWD"` alternatives; host `node_modules` mount point on fresh clone; same-size pixel tamper — previously triaged or unlikely.
- Clean-tree precondition vs uncommitted hardened ticket — the autopilot commits the review-loop output before the build.
- `hitl: false`; epic Docker note — board/orchestrator scope.
- Duplicates.

## Pass 6 — 2026-09-28
Reviewers: builder, edge-case, adversarial, ref-alignment  |  Findings: major 3, minor 4, decision-needed 0  |  Dropped in triage: 7
### Applied
- [major] Halt rule contradicted the deliberately failing tamper run → halts scoped to unexpected failures; tamper run must fail only `desktop` on size.
- [major] webServer start time / Vite reload unobservable (`stdout: 'ignore'`) → `webServer.stdout: 'pipe'` added to the screens-config exceptions.
- [major] Host lint/check first ran after baselines were captured → lint+check before the update run; later edits restart the sequence.
- [minor] Order made explicit → 12-step Verify and Plan-evidence sequence.
- [minor] Porcelain → `--untracked-files=all`, nothing staged, exact XY lines in a code block.
- [minor] Host-write check → concrete touch/create/delete commands.
- [minor] `_bmad-output/` hand-off edits → append-only, recorded as an additive spec note.
### Default applied (technical)
- Sequence, halt scoping, `stdout: 'pipe'`, porcelain form, host-write commands.
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- `stat` of container-written files from the host — covered by the host-write checks.
- Guard message wording for CI — fixed text, harmless.
- Cold Vite cache on every run — covered by the halt rule.
- sha256 of baselines across runs — porcelain equality + `-uall` suffices.
- Duplicates.

## Pass 7 — 2026-09-28
Reviewers: builder, edge-case, adversarial, ref-alignment  |  Findings: major 3, minor 8, decision-needed 0  |  Dropped in triage: 6
### Applied
- [major] Steps 5/8 — porcelain cannot show untracked PNGs were not rewritten → `sha256sum` of both baselines in captures; capture 3 before the commit equals capture 1.
- [major] Step 3 restart vs step 4 "writes both baselines" → restart deletes the snapshot directory first.
- [major] Step 9 — a halted tamper run would leave the android PNG as the desktop baseline → restore immediately, before anything else; hash checked.
- [minor] Step 9 quotes the size-mismatch failure line and android's pass line.
- [minor] Step 2 names the four edited files.
- [minor] Probe record-only for ownership; container Node outside `engines` is a halt.
- [minor] Step 10 no longer claims `en.txt` is container-written.
- [minor] Ports 5173/4173 free before host `--list` and host `test:all`.
- [minor] Named volume gives no cache reuse; every run cold.
- [minor] Ticket 8 hand-off anchored to the exact story-ci-workflow.md bullet; CAP-8 append listed as a spec amendment in the plan result for gate 4.
- [minor] Copied font block carries a source comment.
### Default applied (technical)
- Hash checks and capture 3; restart deletes baselines; restore-first tamper step; port checks.
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- Version drift between `^1.63.0` and the image tag (raised in several passes) — lock + prose coupling kept; candidate for the D8 audit or retrospective.
- Env-var guard is convention, not isolation — accepted.
- CI reporter / CAP-8 "upload reports" — ticket 8 scope.
- npm cache volume — stated as accepted cost.
- `hitl` / epic Docker note — orchestrator scope.
- Duplicates.

## Result — capped at 7 passes
Majors per pass: 6, 1, 1, 1, 3, 3, 3 (all fixed; pass 7 fixes applied, not re-reviewed). No decision-needed items: every finding was a technical choice with a default. The late majors were all in the plan-evidence procedure (Verify sequence, captures, halts), not in the product; the persistent churn source is the review-loop-added evidence procedure itself. build-notes CAP-7 (`[ASSUMPTION]`) is the ref to firm up if this recurs.
