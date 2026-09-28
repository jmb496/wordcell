---
title: 'Size budget postbuild gate'
type: 'feature'
ticket: '6'
created: '2026-09-28'
baseline_revision: '9bd182e1079fc14ac99ca26fa7841227763a6bcb'
status: done
route: 'full'
route_source: 'auto'
review: 'thorough'
review_source: 'auto'
lenses_ran: ['blind-hunter', 'edge-case-hunter', 'verification-gap', 'intent-alignment']
review_loop_iteration: 0
followup_review_recommended: true
context:
  - '{project-root}/_bmad-output/initiative-wordcell-v1/epic-scaffold-ci-deploy/story-size-budget-postbuild-gate.md'
warnings: []
deferred: []
---

<intent-contract>

## Intent

**Problem:** Nothing measures the AD-18 600,000-byte gzip budget or AD-16's 4,000,000-byte precache file limit, so a `?url` dictionary over budget still builds green (epic Done-when 2) and ticket 1.2's deferred dist-asset guard is still open.

**Approach:** Add `scripts/size-budget.mjs` (pure `computeBudget(manifest, sizes)` plus a guarded CLI `main()`) as the `postbuild` hook of `build`, with `AD-18`/`AD-16` tests in `scripts/size-budget.test.mjs`. The ticket's **Build choices** and **Tests** sections are the full contract (counted set C/X closures, error strings and order, throws, CLI output/exit rules, test list); this plan does not restate them.

## Boundaries & Constraints

**Always:** Follow the ticket's Build choices verbatim (exports `computeBudget`, `PRECACHE_GLOB`, `PRECACHE_MAX_BYTES`; `// @ts-check`; `main()` guard like `scripts/build-dictionary.mjs`; `process.exitCode = 1`, never `process.exit()`); fail fast (rule 6): structural manifest problems and absent counted files throw; missing font/dictionary key and over-limits are `errors` entries. Test names start with `AD-18` or `AD-16`. Temp dist fixtures are a few bytes; 4 MB cases use `computeBudget` sizes only. Cite ids, not restated rules, in comments.

**Never:** a new npm dependency; any change to `vite.config.ts`; an edit to `data/enable1.txt`; `postbuild` on `build:test`; `process.exit()`; a push.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Real tree | `npm run build` | table (`<file> <gzip>` rows, `total <n> / 600000`), exit 0 | none |
| Over budget | total 600,001 (or forced dictionary) | table on stdout, error naming total and 600000 on stderr | exit 1 |
| Missing font / dictionary key, or key without `file` | manifest | table printed, named error on stderr | exit 1 |
| Glob file > 4,000,000 raw | e.g. `icons/big.png` | error naming path and size | exit 1 |
| Counted file absent from dist, dangling key, 0 or 2 entries, `{}` | manifest/sizes | throw naming key/path, no table | uncaught, non-zero |
| No `.vite/manifest.json` / no `index.html` / bad args | CLI | throw naming path / usage | uncaught, non-zero |
| sw.ts dynamic import | fixture manifest | sw.ts file/css and its only-through-it imports excluded; shared ones counted; its dynamic-import targets counted | none |

</intent-contract>

## Code Map

- `scripts/build-dictionary.mjs` -- conventions to mirror: `// @ts-check` header comment, JSDoc types, `main()` + `realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)` guard, repo-root paths via `new URL('../…', import.meta.url)`.
- `scripts/build-dictionary.test.mjs` -- test style (`describe`/`it('AD-8 …')`, `// @ts-check`, imports from `./x.mjs`).
- `package.json` -- add `"postbuild": "node scripts/size-budget.mjs"` right after `build`; nothing else.
- `vite.config.ts` -- READ ONLY; contains `globPatterns: ['**/*.{js,css,html,txt,woff2,png,svg,webmanifest}']` and `maximumFileSizeToCacheInBytes: 4_000_000` (tests assert these literals).
- `tsconfig.node.json` -- already type-checks `scripts/**/*.mjs` with `checkJs`, `noUnusedLocals/Parameters`; `npm run check` must stay clean.
- Real `dist/.vite/manifest.json` shape today: `index.html` (isEntry, `file` JS, `css` [..], `assets` [font]); `src/ui/assets/wordcell-serif.woff2` and `generated/dictionary/en.txt` keys with `file` only (dictionary not linked from the entry). Dist also has `sw.js`, `workbox-*.js`, `manifest.webmanifest`, `favicon.svg`, `icons/*.png`.
- `vite.config.ts` `test.include` already covers `scripts/**/*.test.mjs`.

## Tasks & Acceptance

**Execution:**
- [x] `scripts/size-budget.mjs` -- create per ticket Build choices (computeBudget, glob matcher, closures, CLI) -- AD-18, AD-16.
- [x] `scripts/size-budget.test.mjs` -- create every case in the ticket's Tests section (computeBudget, CLI via async `execFile` concurrently against `mkdtempSync` temp dists built in `beforeAll`, removed in `afterAll`, AD-16 literal checks against `vite.config.ts` read via `import.meta.url`) -- AD-18, AD-16.
- [x] `package.json` -- add `postbuild` -- AD-18.
- [x] Evidence (Implementation Notes): `npm run build` table + exit 0 with dictionary row; forced over-budget (append ~300 KB base64 random lines to `generated/dictionary/en.txt`, build red, record row/total/exit; restore with `npm run build:dictionary`, rebuild green, record row); warm `npm run test` Duration < 5 s; watch re-run after editing `scripts/size-budget.test.mjs` < 1 s (scratch polling config as ticket 1.2 did, deleted after); ticket 1.2 deferred guard closed (CLI missing-key and missing-file cases); inline-fixture exception to build-notes § Tests of `scripts/*.mjs` (the `vite.config.ts` literal read and `mkdtempSync` temp dists from inline data); spine wording bug for the retrospective (AD-18 "chunks listed" → "chunks in C: reachable from the entry over static and dynamic imports without following a dynamic import of `src/shell/sw.ts`, plus everything reachable from a dynamic import made by the sw.ts static-import closure").

**Acceptance Criteria:**
- Given the current tree, when `npm run build` runs, then postbuild prints one row per counted file (index.html, entry JS, entry CSS, font, dictionary) and `total <n> / 600000`, and exits 0.
- Given a dictionary grown past 600,000 gzip bytes, when `npm run build` runs, then it exits non-zero with the over-budget error; after `npm run build:dictionary` a rebuild exits 0.
- Given the new tests, when `npm run test:all` runs, then it passes, `vite.config.ts` is unchanged, and no dependency is added.

## Implementation Notes

**Files:** `scripts/size-budget.mjs` (new), `scripts/size-budget.test.mjs` (new, 29 tests: 24 `computeBudget`/AD-16 cases + 1 concurrent CLI case running 7 child processes), `package.json` (`postbuild` only). `vite.config.ts`, `data/`, `package-lock.json` unchanged (`git diff --stat 9bd182e -- vite.config.ts data/ package-lock.json` empty).

**Error strings** (asserted by the tests): `size-budget: total <n> gzip bytes is over the 600000 budget`; `size-budget: missing font src/ui/assets/wordcell-serif.woff2 in the manifest`; `size-budget: missing dictionary generated/dictionary/en.txt in the manifest`; `size-budget: <path> is <raw> bytes, over the 4000000 precache limit`. Throws: `size-budget: expected exactly one isEntry key, found <n>: [...]`, `size-budget: manifest has no key <key>`, `size-budget: manifest key <key> has no file`, `size-budget: counted file <path> is not in dist`, `size-budget: missing <path>` (CLI), `size-budget: usage: node scripts/size-budget.mjs [distDir], got [...]`.

**`npm run build` on the tree** (exit 0):

```
assets/en-n6QSuDF0.txt 454262
assets/index-CA-PyMch.js 13354
assets/index-DyhLeQTv.css 720
assets/wordcell-serif-C6H6CwWY.woff2 4307
index.html 393
total 473036 / 600000
```

**Forced over-budget:** appended `crypto.randomBytes(225000).toString('base64')` in 76-char lines to `generated/dictionary/en.txt`; `npm run build` exit 1 with `assets/en-CwXkMhnT.txt 685535`, `total 704309 / 600000`, stderr `size-budget: total 704309 gzip bytes is over the 600000 budget`. Restored with `npm run build:dictionary` (172713 words); rebuild exit 0, `assets/en-n6QSuDF0.txt 454262` (same hash and size as before), `total 473036 / 600000`.

**Warm `npm run test`:** 309 tests, Duration 1.51 s (1.49 s inside `test:all`) — under 5 s.

**Watch re-run (AD-17):** scratch config `vitest.scratch-poll.config.ts` (mergeConfig of `vite.config.ts` with `server.watch.usePolling: true`, deleted after), `vitest watch` (explicit; plain `vitest` without a TTY runs once). Editing `scripts/size-budget.test.mjs` re-ran it in 965 ms, 1.25 s, then 1.11/1.20/1.30/1.15/1.29/1.22/1.09/1.18/1.24/1.24/1.16/1.13 s, and in an interleaved session 1.07 s/979 ms/1.10/1.14/1.08/1.14 s. **Over the 1 s target.** Same session, editing the unchanged `scripts/build-dictionary.test.mjs` (889/905 ms when ticket 1.2 measured) re-ran in 1.30/1.12/1.16/1.12/1.22/1.28 s, i.e. no faster than size-budget. The file's own test time is ~50 ms (the CLI case 47 ms; `npx vitest run scripts/size-budget.test.mjs` Duration 648 ms), so the excess is watch/re-run overhead on drvfs that has grown since ticket 1.2, not this file's tests. Needs an owner/gate decision: the ticket says either over fails the ticket.

**Watch re-run, orchestrator re-measure (supersedes the above; machine otherwise idle):** same scratch polling config (`server.watch.usePolling: true, interval: 100`, deleted after), `npx vitest watch -c vitest.scratch-poll.config.ts scripts/size-budget.test.mjs`, five appended-comment edits of `scripts/size-budget.test.mjs` (reverted): initial run 2.69 s, re-runs `Duration 703ms`, `700ms`, `866ms`, `827ms`, `862ms`, all `Tests 29 passed (29)`, all under 1 s (AD-17). The earlier >1 s readings coincided with the implementer's concurrent build/test activity; the target is met.

**Ticket 1.2 deferred guard closed:** CLI case `no-dict-key` (manifest without `generated/dictionary/en.txt`) exits non-zero with the missing-dictionary error on stderr and the table on stdout; CLI case `no-dict-file` (key present, file not on disk) exits non-zero with the path on stderr and no `total` line. Postbuild is the same CLI, so both fail `npm run build`/CI.

**Inline-fixture exception to build-notes § Tests of `scripts/*.mjs`:** `scripts/size-budget.test.mjs` reads `vite.config.ts` source (via `import.meta.url`) to assert the AD-16 `globPatterns` and `maximumFileSizeToCacheInBytes` literals, and builds temp dists under `mkdtempSync(join(tmpdir(), 'size-budget-'))` from inline data in `beforeAll` (removed in `afterAll`); no shared `fixtures/*.json`.

**Spine wording bug (for the epic retrospective's spine update; spec wins):** AD-18 "chunks listed" → "chunks in C: reachable from the entry over static and dynamic imports without following a dynamic import of `src/shell/sw.ts`, plus everything reachable from a dynamic import made by the sw.ts static-import closure".

**Verification:** `npx vitest run scripts/size-budget.test.mjs` 29 passed; `npm run lint` and `npm run check` clean; `npm run test:all` exit 0 (ports 5173/4173 free first).

## Plan Change Log

## Review Triage Log

### 2026-09-28 — Review pass
- verdicts: 21 findings — high 0, medium 3, low 13, false 5, maybe-false 0
- findings:
  - `[medium]` `[patch]` (blind) nine computeBudget tests never assert `errors`, against the ticket's "each test asserts `errors` equals exactly the expected list" — added `expect(errors).toEqual([])` to each.
  - `[low]` `[reject]` (blind) Implementation Notes test count "24 + 1" does not add up — fix is a plan edit.
  - `[low]` `[reject]` (blind) stale over-1 s watch paragraph beside the re-measure; re-measure used a single-file filter and 100 ms polling — fix is a plan edit; watch mode re-runs only the edited file anyway and 100 ms is chokidar's default polling interval.
  - `[medium]` `[patch]` (blind) CLI never checks printed gzip numbers, so a `collectSizes` bug passes — grouped with the verification-gap row; exact stdout now asserted.
  - `[low]` `[reject]` (blind) seven CLI scenarios share one `it` — the ticket allows one `Promise.all`; restructuring is more than a direct fix for a diagnostics-only harm.
  - `[low]` `[patch]` (blind) glob case-sensitivity and nested dot segment untested — added `icons/X.PNG` and `assets/.cache/x.js` over 4 MB, no error.
  - `[low]` `[patch]` (blind) missing-font/-dictionary/keyless-dictionary tests assert rows and total unevenly — all three now assert exact rows and total.
  - `[low]` `[reject]` (blind) null manifest values / invalid JSON throw without naming a path — Vite writes the manifest; still a loud non-zero failure (rule 6); guards would add complexity for an unshown state.
  - `[low]` `[patch]` (blind) `""` argument resolves to cwd — `main()` now treats `''` as a usage error; CLI case added.
  - `[false]` `[reject]` (blind) `lenses_ran` set but triage log empty — the lenses were mid-run; this entry is that triage.
  - `[low]` `[reject]` (blind) top-level-only `.vite` skip untested — harmless: `.vite/*` is excluded from the glob by the dot rule and never counted; only saves gzip work.
  - `[low]` `[reject]` (edge) invalid JSON SyntaxError does not name the manifest path — same as the blind row; loud failure, unshown state.
  - `[low]` `[reject]` (edge) null or non-object manifest values give a raw TypeError — Vite never emits these; loud failure.
  - `[low]` `[reject]` (edge) `imports` as a string spreads into characters — Vite never emits it; still throws (naming a bogus key).
  - `[low]` `[reject]` (edge) symlinked directory in dist gives EISDIR — Vite copies `public/` files, no symlinks; loud failure.
  - `[low]` `[patch]` (edge) empty-string argument — grouped with the blind `""` row; fixed there.
  - `[medium]` `[patch]` (verification-gap) CLI gzip/raw measurement unchecked — passing CLI case now asserts exact rows and total from `gzipSync(content, { level: 9 })` of the inline fixture contents (catches a raw/gzip swap; a dropped `level: 9` may still match on tiny strings, see residual risks). Counted once with the blind row (2 medium entries total).
  - `[false]` `[reject]` (intent) counted set follows reachability, not the spine's literal "chunks listed" — the ticket's Build choices select this reading; spine wording bug recorded for the retrospective.
  - `[false]` `[reject]` (intent) real-build pass and forced over-budget failure are evidenced only in the plan — the intent says "shown in the plan, reverted".
  - `[false]` `[reject]` (intent) no CLI over-budget, missing-font or 4 MB case — the ticket's Tests section scopes CLI cases and states the shared stderr path covers them.
  - `[false]` `[reject]` (intent) 4 MB check uses a glob superset, not Workbox's actual precache list — the ticket specifies the superset as harmless.

## Verification

**Commands:**
- `npx vitest run scripts/size-budget.test.mjs` -- expected: all pass.
- `npm run lint && npm run check` -- expected: clean.
- `npm run build` -- expected: table printed, exit 0.
- `npm run test` (warm) -- expected: Duration < 5 s.
- `npm run test:all` (ports 5173 and 4173 free first) -- expected: pass.
- `git diff --stat 9bd182e1079fc14ac99ca26fa7841227763a6bcb -- vite.config.ts data/ package-lock.json` -- expected: empty.

## Auto Run Result

**Summary:** `scripts/size-budget.mjs` now runs as `postbuild` of `build` (not `build:test`): it prints the AD-18 per-file gzip-9 table and total, fails above 600,000 bytes or on a missing font/dictionary key, fails on any precache-glob file over 4,000,000 raw bytes (AD-16), and throws on structural manifest problems or counted files absent from dist (rule 6). Ticket 1.2's deferred dist-asset guard is closed (CLI missing-key and missing-file cases).

**Files changed:**
- `scripts/size-budget.mjs` — new: `computeBudget`, `PRECACHE_GLOB`, `PRECACHE_MAX_BYTES`, guarded CLI `main()`.
- `scripts/size-budget.test.mjs` — new: 29 tests (24 `AD-18` computeBudget, 4 `AD-16`, 1 concurrent `AD-18` CLI case with 8 child processes).
- `package.json` — `postbuild` added.
- this plan.

**Review findings:** 21 findings (high 0, medium 3, low 13, false 5). Patched 5 entries: 2 medium (errors asserted in every computeBudget test; exact CLI stdout sizes from gzip level 9), 3 low (case/dot-segment glob cases; exact rows and totals in the missing-key tests; `""` argument is a usage error). Deferred: none. Rejected: 16, each with its reason in the Review Triage Log (plan-text edits; loud failures on manifest shapes Vite never emits; ticket-selected readings flagged by the intent audit; one-`it` CLI structure allowed by the ticket; harmless `.vite` skip).

**Follow-up review recommended:** true — 2 medium entries patched (0 high). Named unverified risk: the exact-stdout CLI assertion would not catch a dropped `{ level: 9 }` in `collectSizes`, because the tiny fixture strings compress to the same size at the default level; only the real `npm run build` table (dictionary 454,262 B, matching ticket 1.2's measured value) evidences level 9.

**Verification (after patches):** `npx vitest run scripts/size-budget.test.mjs` 29 passed (636 ms); `npm run lint` and `npm run check` clean; `npm run build` exit 0 with `total 473036 / 600000` (dictionary 454,262); warm `npm run test` 309 passed, Duration 1.45 s (< 5 s); watch re-run 700–866 ms (< 1 s, see Implementation Notes); forced over-budget build exit 1 at total 704,309, restored and green (Implementation Notes); `npm run test:all` exit 0 (ports 5173/4173 free first); `vite.config.ts`, `data/`, `package-lock.json` unchanged.

**Residual risks:** gzip level not pinned by tests (above); the sw.ts exclusion runs only on fixture manifests until epic 7 adds `src/shell/sw.ts`; spine AD-18 "chunks listed" wording bug awaits the epic retrospective's spine update.
