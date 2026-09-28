---
id: 7
type: story
title: "Screenshot pipeline in the Playwright container"
parent: epic-scaffold-ci-deploy
covers: [CAP-7]
after: [6]
hitl: true
risk: medium
---

# Screenshot pipeline in the Playwright container

## Description

Adds playwright.screens.config.ts, test:screens (docker run of the pinned image, node_modules in a named volume) and test:screens:run, and one placeholder-board screenshot spec on android and desktop with committed baselines (D4).

## Acceptance Criteria

Verify: `npm run test:screens -- --update-snapshots` writes both baselines (android, desktop) inside mcr.microsoft.com/playwright:v1.63.0-noble and exits 0; then a plain `npm run test:screens` exits 0 and its porcelain capture equals the one taken right after the `--update-snapshots` run (the plan quotes both); npx playwright test --list under the default config shows no screens spec; on the host, `env -u WORDCELL_SCREENS_CONTAINER npx playwright test -c playwright.screens.config.ts --list` and `WORDCELL_SCREENS_CONTAINER=0 npx playwright test -c playwright.screens.config.ts --list` each exit non-zero and their output contains the config's container error message (default, review loop).

**Verify and Plan-evidence sequence (default, review loop):** the steps run in this order, one at a time (no step overlaps another; this is also the "one screens run at a time" rule of `test:screens` below). All of them run before the build's local commit, which includes the baselines.

1. **First step (hitl):** `docker version` (see below).
2. **Edits:** every ticket file edit outside `_bmad-output/` (`AGENTS.md`, `package.json`, `playwright.screens.config.ts`, `e2e/placeholder.screens.spec.ts`) is complete.
3. **Host lint and check:** on the host, `npm run lint && npm run check` pass (Biome; `tsconfig.e2e.json` covers `playwright*.config.ts` and `e2e/**`), together with the host `--list` checks of Verify and the Delta checks; before the `--list` checks, ports 5173 and 4173 are free on the host (e.g. `ss -ltn`), and a busy port is a halt (`reuseExistingServer` would otherwise silently reuse a stale host server) (default, review loop). Any later edit outside `_bmad-output/` (e.g. one forced by `test:all`) restarts the sequence at this step, then the update run onward; on a restart, delete both baseline PNGs (the `e2e/placeholder.screens.spec.ts-snapshots/` directory) before step 4, so every update run starts from the first-run state (default, review loop).
4. **Update run:** `npm run test:screens -- --update-snapshots` exits 0 and writes both baselines. The plan quotes Vite's `ready in` line from this run's `[WebServer]` output as the webServer start time.
5. **Capture 1:** `git status --porcelain --untracked-files=all -- . ':!_bmad-output'`, with nothing staged. It is exactly these lines, in git's order (default, review loop):

   ```text
    M AGENTS.md
    M package.json
   ?? e2e/placeholder.screens.spec.ts
   ?? e2e/placeholder.screens.spec.ts-snapshots/placeholder-board-android-linux.png
   ?? e2e/placeholder.screens.spec.ts-snapshots/placeholder-board-desktop-linux.png
   ?? playwright.screens.config.ts
   ```

   Any other line (e.g. a container-rewritten `package-lock.json`) fails the check (default, review loop). Capture 1 also records `sha256sum` of both baseline PNGs (default, review loop).
6. **Probe run:** one probe run (`test:screens` stays exactly as written) records the container's `node --version`, `npm --version` and `/work` ownership, and the plan quotes its output: `docker run --rm -v "$PWD":/work -v wordcell-screens-node-modules:/work/node_modules -w /work mcr.microsoft.com/playwright:v1.63.0-noble sh -c 'node --version && npm --version && stat -c %u:%g /work'` (default, review loop). The probe is record-only for `/work` ownership (writability is judged by step 10), but a container `node --version` that does not satisfy `package.json` `engines.node` (`>=22.12`) is a halt (default, review loop).
7. **Plain run:** `npm run test:screens` exits 0. `npm ci` succeeds over the populated volume in every run after the first; the plan quotes this run's `npm ci` summary (default, review loop).
8. **Capture 2:** the step 5 command again plus `sha256sum` of both baseline PNGs; the porcelain lines and both hashes equal capture 1's (so the plain run left the baselines untouched) (default, review loop).
9. **Tamper, restore, plain re-run:** copy `placeholder-board-desktop-linux.png` aside to `/tmp` (outside the repo), overwrite it with the android PNG and run `npm run test:screens`: it exits non-zero with exactly one failing test, `desktop`'s `toHaveScreenshot` comparison failing on the size mismatch, while `android` passes (a smoke check that proves the committed baseline is read and compared); any other failure in this run is a halt. The plan quotes Playwright's `desktop` failure line (the image-size mismatch message, `Expected an image …px by …px, received …px by …px`) and `android`'s passing line (default, review loop). Immediately after the tamper run, whatever its outcome and before anything else (including recording a halt), restore the desktop baseline from the `/tmp` copy; the restored file's `sha256sum` equals capture 1's (default, review loop). Then confirm a plain `npm run test:screens` exits 0 again (default, review loop).
10. **Host-write checks:** from the host, `touch` both baseline PNGs and `generated/dictionary/en.txt`, and create and delete one file in each of `generated/dictionary/`, `test-results/` and `e2e/placeholder.screens.spec.ts-snapshots/`; the plan quotes the exit statuses (all 0) (default, review loop). `generated/dictionary/en.txt` may have been written by the host (`predev` is staleness-gated), so the plan does not claim it was container-written; the create/delete in the three directories and the PNG touches are the proof (default, review loop).
11. **Host `npm run test:all`** passes, run only after ports 5173 and 4173 are confirmed free on the host (e.g. `ss -ltn`); a busy port is a halt (default, review loop).
12. **Local commit** (the build's commit, baselines included). Immediately before it, **capture 3**: the step 5 porcelain command plus `sha256sum` of both baseline PNGs; it equals capture 1, so the committed baselines are exactly the update run's (default, review loop).

**Halts (default, review loop):** apart from step 9's expected tamper failure, any failure in a container run is a halt recorded in the plan, not worked around (no retries, no raised timeout): a non-zero exit, a webServer timeout, or a Vite dependency-optimisation reload, i.e. a Vite `reloading` line in any run's `[WebServer]` output. A failure in steps 3, 5, 8, 10, 11 or capture 3 (step 12) is likewise a halt unless it is fixed by an edit that restarts the sequence per step 3.

**Build precondition:** clean tree on `epic-1-scaffold`.

**First step (hitl, sequence step 1):** run `docker version`; halt the build if the server is unreachable. The plan records the server version.

**Delta checks (delta-checks.md rows for CAP 7):**

- `test:screens`: runs the container; `-- --update-snapshots` generates, then a plain second run compares, the baseline.
- `playwright.screens.config.ts` (CAP 7 part): exists; `WORDCELL_SCREENS_CONTAINER=1 npx playwright test --list -c playwright.screens.config.ts` (listing renders nothing) shows only the screens spec under `android` and `desktop` (setting `WORDCELL_SCREENS_CONTAINER=1` on the host is sanctioned only for `--list`, which starts no webServer and takes no screenshot, never for a run (default, review loop)).
- Screenshot container (SPEC CAP-7 success): `npm run test:screens -- --update-snapshots` generates and a plain `npm run test:screens` then compares the first baseline inside `mcr.microsoft.com/playwright:v1.63.0-noble`; the default config never collects `*.screens.spec.ts` (`npx playwright test --list`).

**Tests:** `AD-17 placeholder board screenshot` in `e2e/placeholder.screens.spec.ts` (D4), `android` and `desktop`, baselines committed. The spec does `page.goto('/')`, waits until `card-0`…`card-51` are visible, copies (under a one-line comment naming `e2e/pwa/font.spec.ts` as the source) the `page.evaluate` block of `e2e/pwa/font.spec.ts` (its `document.fonts.load('600 1em "WordCell Serif"', 'W')` call and face scan) and its two `expect`s verbatim, with no separate `load` call (the `load()` result has length 1; the `WordCell Serif` faces equal `[{ weight: '600', status: 'loaded' }]`; `document.fonts.ready` resolves even when the woff2 fails, AGENTS.md rule 6) (default, review loop), then `await expect(page).toHaveScreenshot('placeholder-board.png')` (viewport, Playwright's default animation disabling; the viewport screenshot may crop the board on desktop; accepted until epic 4 replaces the baseline (default, review loop)); nothing else asserted besides the card-visibility wait and the font precondition (default, review loop).

`test:screens` = `docker run --rm --init --ipc=host -e WORDCELL_SCREENS_CONTAINER=1 -v "$PWD":/work -v wordcell-screens-node-modules:/work/node_modules -w /work mcr.microsoft.com/playwright:v1.63.0-noble sh -c 'npm ci && npm run test:screens:run -- "$@"' screens` [ASSUMPTION per build-notes; exact flags (default, review loop)]: default bridge network, no port publishing (a host server on 5173 is neither reused nor clashes); extra args reach Playwright (`npm run test:screens -- --update-snapshots`); run it from a WSL2/POSIX shell (it relies on `"$PWD"` and `sh -c` quoting; in `package.json` the inner double quotes are JSON-escaped), with network for `npm ci`, one screens run at a time per machine (the sequence above runs its steps one at a time) and no host Playwright run while it runs (the named volume and `test-results/` are shared) (default, review loop). The named volume only keeps container binaries apart from host binaries (build-notes CAP-7); `npm ci` wipes it each run, so there is no install or `node_modules/.vite` reuse (every run starts Vite cold) and every run downloads packages (default, review loop). File ownership (default, review loop): everything in the container runs as root (npm 9+ does not switch uid for lifecycle scripts); the plan records `stat -c %u:%g /work` from the probe run (sequence step 6), and the host-write checks (sequence step 10) prove the host can still write what the container wrote; a failure is a halt. The image tag equals the locked `@playwright/test` version (1.63.0); bumping one bumps the other and regenerates baselines. `test:screens:run` = `playwright test -c playwright.screens.config.ts`.

`playwright.screens.config.ts` (default, review loop) mirrors `playwright.config.ts` (testDir `./e2e`, the same `android` Pixel 7 and `desktop` Desktop Chrome projects, same `use`, webServer `npm run dev -- --port 5173 --strictPort` on 5173 so the dev server inside the container creates `generated/dictionary/en.txt` through `predev` when it is missing or stale (the staleness gate), same `toHaveScreenshot: { maxDiffPixelRatio: 0.01 }`, same forbidOnly/reporter/trace), and copies every field not listed under "except" unchanged, including `fullyParallel: true` and `webServer.timeout: 60_000` (default, review loop), except: `testMatch: '**/*.screens.spec.ts'` and no `testIgnore` at all (`testMatch` alone limits collection), `retries: 0`, `reuseExistingServer: false`, `webServer.stdout: 'pipe'` (Playwright's default is `'ignore'`; piping makes Vite's `ready in` and `reloading` lines visible for the sequence's start time and halt check) (default, review loop), `updateSnapshots: process.env.CI ? 'none' : 'missing'` (a missing baseline fails in CI; ticket 8 calls `test:screens:run`; locally a plain run with a missing baseline writes it and exits non-zero; `-- --update-snapshots` creates missing baselines and rewrites ones that fail the comparison, `-- --update-snapshots=all` forces a rewrite), and Playwright's default snapshotPathTemplate (baselines at `e2e/placeholder.screens.spec.ts-snapshots/placeholder-board-{android,desktop}-linux.png`). It throws at load unless `process.env.WORDCELL_SCREENS_CONTAINER === '1'` (any other value or unset throws) with exactly `playwright.screens.config.ts runs only in the Playwright container (npm run test:screens); WORDCELL_SCREENS_CONTAINER must be 1` (default, review loop) (AGENTS.md rule 6), so baselines are never generated or compared on the host. So ticket 8's CI screenshot job does not throw at config load, this ticket's diff adds one line each to `story-ci-workflow.md` (appended directly after its Acceptance Criteria bullet beginning "SPEC CAP-8 success:", the one ending "screenshot job in `container: mcr.microsoft.com/playwright:v1.63.0-noble` calling `npm run test:screens:run`.") and to build-notes CAP-8's screenshot-job bullet saying the job sets `env: WORDCELL_SCREENS_CONTAINER: '1'` (default, review loop); both edits are append-only (a line added, existing text unchanged), and the plan records the build-notes line as an additive spec note for the retrospective and its result lists that build-notes CAP-8 append as a spec amendment, so the owner sees it at gate 4 (default, review loop); these `_bmad-output/` edits sit outside the Verify porcelain captures.

**Owner checks at gate 4:** none beyond reading the plan's result; the baseline image is replaced by epic 4.

**AGENTS.md `TODO(epic 1)` items removed:** `test:screens`, `playwright.screens.config.ts`, and the sentence "Until `playwright.screens.config.ts` exists, add no `*.screens.spec.ts`". This hand edit of the managed block is authorised by SPEC D8 ("each ticket drops its own items in its diff"), not routed through `bmad-project-context`. The remaining shell of the line waits for the D8 audit (SPEC D8 wins over the line's own "remove the line when none remain"): in "Running and verifying", the sentence group `TODO(epic 1): … remove the line when none remain.` becomes exactly `` TODO(epic 1): no items remain; the D8 `bmad-project-context` audit removes this line. `` and nothing else in that bullet changes.

## References

- parent — _bmad-output/initiative-wordcell-v1/epic-scaffold-ci-deploy/epic-scaffold-ci-deploy.md
- architecture — _bmad-output/planning-artifacts/architecture/architecture-wordcell-2026-09-27/ARCHITECTURE-SPINE.md, AD-17 Projects, Screenshots
- spec — _bmad-output/specs/spec-epic-1-scaffold-ci-deploy/build-notes.md, CAP-7 Screenshots
- spec — _bmad-output/specs/spec-epic-1-scaffold-ci-deploy/SPEC.md, CAP-7, D4, D8
- delta checks — _bmad-output/specs/spec-epic-1-scaffold-ci-deploy/delta-checks.md, CAP 7 rows

## Notes

- Resolved: Docker Desktop's WSL integration enabled; `docker version` reports server 29.8.0 (2026-09-28).
