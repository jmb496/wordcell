---
title: 'Dictionary generation and ?url wiring'
type: 'chore'
ticket: '2'
created: '2026-09-27'
status: done
route: 'full'
route_source: 'auto'
baseline_revision: '8d5080063720620cf9ba02096bc511ca729a4413'
review: 'thorough'
review_source: 'pinned'
lenses_ran: ['blind-hunter', 'edge-case-hunter', 'verification-gap', 'intent-alignment']
review_loop_iteration: 0
followup_review_recommended: false
context:
  - '{project-root}/_bmad-output/initiative-wordcell-v1/epic-scaffold-ci-deploy/story-dictionary-generation-and-url-wiring.md'
  - '{project-root}/_bmad-output/initiative-wordcell-v1/epic-scaffold-ci-deploy/story-dictionary-generation-and-url-wiring.review-log.md'
  - '{project-root}/AGENTS.md'
warnings: ['oversized']
deferred:
  - summary: >-
      No automated check that npm run build emits dist/assets/en-*.txt; deleting the main.ts side-effect import would pass test:all.
    evidence: |-
      Only plan evidence proves the emitted asset; the story assigns the permanent guard to CAP-6's postbuild size gate and entry 3's pwa precache check.
    location: >-
      src/main.ts:3
    severity: low
---

<intent-contract>

## Intent

**Problem:** The scaffold's `scripts/build-dictionary.mjs` filters 3–10 letters into `public/dictionary/`, has no checksum, no staleness gating and no tests; nothing emits the dictionary as a hashed `?url` asset (AD-8).

**Approach:** Rewrite the script per the story file (pure exports + guarded CLI, checksum → staleness → atomic write into `generated/dictionary/en.txt`), wire the `pre*` hooks, `.gitignore`/`.gitattributes`, Vitest/tsconfig includes, README, and a `?url` stub imported by `main.ts`. The story file's Description, Delta checks, Build choices and Tests are the contract; read it in full. The review log's "Pass 4 — Open minors" are adopted defaults (listed in Design Notes).

## Boundaries & Constraints

**Always:** Every `AD-8` unit case the story lists, in `scripts/build-dictionary.test.mjs`, names starting `AD-8 `. Inline fixtures only; real reads limited to `data/README.md` and hashing `data/enable1.txt`. Rule 6: no try/catch, fail fast. Every *evidence* item in the story is run on /mnt/d and recorded (command + output) in Implementation Notes.

**Never:** Mutate `data/enable1.txt` (use temp copies for mismatch evidence). No fetch, `state`, `Set` or `public/` copy for the dictionary. No PWA/`vite.config.ts` plugin changes (CAP-5), no `build:test`/`prebuild:test` (entry 3), no `postbuild` (CAP-6). Do not touch AGENTS.md beyond the two D8 edits; leave Known pitfalls and rule 5 text. No new npm dependencies. **Halt (rule 7), never work around:** if `npm run build` emits no `dist/assets/en-*.txt`, or mtime staleness misbehaves on the /mnt/d drvfs mount (second run rewrites, or touch does not trigger regen).

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Fresh clone hook | no `generated/` | writes 172,713-line `en.txt` | — |
| Up to date | output newer than source and script | no write, mtime unchanged | — |
| Stale | source or script touched | regenerates | — |
| Checksum mismatch | `--source <1-byte-changed copy>` (± `--force`) | exit ≠ 0, output mtime/hash unchanged, no `en.txt.*.tmp` | throws |
| Missing source | `--source /nonexistent` | exit ≠ 0 | `readFileSync` throws |
| Bad args | unknown token, `--source=x`, repeat, missing/`--`/empty value | `parseArgs` throws | throws |

</intent-contract>

## Code Map

- `scripts/build-dictionary.mjs` -- scaffold: reads `../data/enable1.txt` via `import.meta.url`, 3–10, writes `public/dictionary/en.txt`. Rewrite entirely.
- `data/README.md` -- one `enable1.txt` bullet; replace 3–10 sentence and BGA sentence; add `  SHA-256: 3f16…1a89` continuation line. Verified: `sha256sum data/enable1.txt` = `3f16130220645692ed49c7134e24a18504c2ca55b3c012f7290e3e77c63b1a89`; `awk` filter gives 172,713; `enable1.txt` is LF ASCII; BGA `/mnt/d/CodeProjects/bga-wordcell/english.txt` has 172,724 lines and lacks exactly 99 enable1 words: 96 two-letter + knickknack, razzmatazz, razzmatazzes (read-only; never modify that repo).
- `package.json` -- `build` = `npm run build:dictionary && vite build`; `build:dictionary` = plain node call; `check` chain includes `tsc -p tsconfig.node.json`.
- `vite.config.ts` -- `test.include: ['src/**/*.test.ts']`, `environment: 'node'`; only `include` changes.
- `tsconfig.node.json` -- `module nodenext`, `types ["node"]`, non-strict, `noUnusedLocals`, include `["vite.config.ts"]`.
- `.gitignore` -- has `public/dictionary/`; no `generated/`. No `.gitattributes` yet.
- `public/dictionary/en.txt` -- untracked 3–10 leftover on disk; delete the folder.
- `src/main.ts` -- mounts App; add side-effect import. `src/shell/` does not exist yet.
- `src/architecture.test.ts` -- AD-1 scan; its fixture already passes a shell import of `../../generated/dictionary/en.txt?url`; `src/shell/dictionary.svelte.ts` must pass the tree scan.
- `biome.json` -- `files.includes` already covers `scripts/**`.
- `AGENTS.md:55` -- `TODO(epic 1)` line: remove "the dictionary `pre*` hooks" and "; only `npm run build` generates the dictionary".
- `playwright.config.ts` -- webServer `npm run dev -- --port 5173 --strictPort`, `reuseExistingServer` locally.

## Tasks & Acceptance

**Execution:**
- [x] `scripts/build-dictionary.mjs` -- rewrite: `// @ts-check`, exports `EXPECTED_SHA256`, `filterWords`, `parseArgs`, `sha256`, `verifySource`, `isStale` (JSDoc types on exports); guarded CLI parse → verify → (unless `--force`) stale → mkdir + `en.txt.<pid>.tmp` + rename; one log line -- story Build choices.
- [x] `scripts/build-dictionary.test.mjs` -- `// @ts-check`; every `AD-8` case from the story + Design Notes -- D3.
- [x] `vite.config.ts` -- `test.include` adds `'scripts/**/*.test.mjs'` -- D3.
- [x] `tsconfig.node.json` -- `allowJs: true`, `checkJs: true`, include adds `scripts/**/*.mjs` -- D3.
- [x] `package.json` -- `build` → `vite build`; `build:dictionary` → `node scripts/build-dictionary.mjs --force`; add `predev`, `pretest`, `pretest:watch`, `pretest:e2e`, `prebuild` = `node scripts/build-dictionary.mjs` -- AD-8.
- [x] `.gitignore` -- add `generated/`, drop `public/dictionary/`. `.gitattributes` (new) -- `data/enable1.txt -text`. `rm -rf public/dictionary`.
- [x] `data/README.md` -- per story + Design Notes.
- [x] `src/shell/dictionary.svelte.ts` (new) -- `import url from '../../generated/dictionary/en.txt?url'; export const dictionaryUrl = url;` with a one-line comment (epic 3 adds load states). `src/main.ts` -- `import './shell/dictionary.svelte';`.
- [x] `AGENTS.md` -- the two D8 edits only.
- [x] Evidence -- run every story *evidence* item and the Design Notes extras; record in Implementation Notes.

**Acceptance Criteria:**
- Given the finished tree, when `npm run test:all` runs, then lint, check, unit (incl. all `AD-8` cases, suite < 5 s) and both Playwright projects pass.
- Given `rm -rf generated dist && npm run build`, when listing `dist/`, then exactly one `dist/assets/en-*.txt` exists, `cmp` equal to `generated/dictionary/en.txt`, 172,713 lines, and no `dist/dictionary/`.
- Given a fresh generate, when the CLI runs with a one-byte-changed temp copy via `--source` (and `--force --source`), then it exits non-zero, `en.txt` mtime and hash unchanged, no `en.txt.*.tmp`.
- Given each hook command after `rm -rf generated`, when it runs, then `generated/dictionary/en.txt` exists; a second run leaves its mtime unchanged; touching `data/enable1.txt` or the script makes the next hook regenerate.

## Implementation Notes

All evidence run on /mnt/d (drvfs), Node 24, 2026-09-27.

**Unit tests (`AD-8`):** 29 cases in `scripts/build-dictionary.test.mjs` (filter 7, `parseArgs` 11, checksum/README 4, `isStale` 7). `npx vitest run scripts` → `Tests 29 passed (29)`, `Duration 675ms`. Full `npm test` → `Test Files 3 passed (3)`, `Tests 265 passed (265)`, `Duration 1.52s` (< 5 s).

**Real run:** `rm -rf generated && npm test` → hook banner `pretest`, `dictionary: 172713 words (3–23 letters) → generated/dictionary/en.txt`; `wc -l generated/dictionary/en.txt` → `172713`.

**Per-hook fresh generate** (`rm -rf generated && <cmd>; test -f generated/dictionary/en.txt`), each printed the `> wordcell@0.0.0 <hook>` banner, `dictionary: 172713 words …` and `EXISTS`:
- `npm test` (banner `pretest`), `npm run pretest:e2e`, `npm run pretest:watch`, `timeout --foreground -s INT 15 npm run dev` (banner `predev`, then `Local: http://localhost:5173/`).
- Note: under the agent's non-TTY pipe, `timeout -s INT` did not stop the vite child; it was killed with `kill -INT <vite pid>`, then `! ss -ltn 'sport = :5173' | grep -q 5173` → `PORT 5173 FREE` before any `test:e2e` run.
- `npm run test:e2e` (inside `test:all`) banner: `> wordcell@0.0.0 pretest:e2e` / `dictionary: generated/dictionary/en.txt is up to date`.
- `timeout -k 3 -s INT 20 npm run test:watch` banner: `> wordcell@0.0.0 pretest:watch` / `dictionary: generated/dictionary/en.txt is up to date`.

**Staleness on drvfs:** second `npm test` → `is up to date`, mtime `1790559802.538596300 -> 1790559802.538596300`; `touch data/enable1.txt; npm run pretest` → regenerated (mtime `1790559837.483326900`); `touch scripts/build-dictionary.mjs; npm run pretest` → regenerated (`1790559838.673926900`); next run → `is up to date`, mtime unchanged. drvfs mtimes behave; no halt.

**Checksum mismatch:** after `npm run build:dictionary` (`--force`), before = `1790560121.462167300 16ef12b6…c6cd`; temp copy with byte 1 changed (`cmp` → `differ: byte 1, line 1`); `node scripts/build-dictionary.mjs --source <copy>` → `Error: build-dictionary: source SHA-256 334a6ca0… != expected 3f161302…`, `exit=1`; same with `--force --source <copy>`, `exit=1`; after = identical (`UNCHANGED`); `ls generated/dictionary/` → `en.txt` only (no `en.txt.*.tmp`, also none after the normal `--force` run). `data/enable1.txt` untouched: `sha256sum` → `3f16130220645692ed49c7134e24a18504c2ca55b3c012f7290e3e77c63b1a89`.

**Missing source / bad args:** `--source /nonexistent` → `Error: ENOENT … open '/nonexistent'`, `exit=1`. `--bogus`, `--source=x`, `--force --force`, `--source`, `--source --force`, `--source ""` → each throws, `exit=1`.

**Ignore / attributes:** `git check-ignore generated/dictionary/en.txt` → `generated/dictionary/en.txt`; `git check-attr text data/enable1.txt` → `data/enable1.txt: text: unset`; `public/` holds only `favicon.svg`, `icons`.

**Build:** `rm -rf generated dist && npm run build` → banners `prebuild`, `build`; `dist/assets/en-n6QSuDF0.txt 1,742.71 kB`; `exit=0`. `ls dist/assets/en-*.txt` → one file; `wc -l` → `172713`; `cmp` with `generated/dictionary/en.txt` → byte-equal; `find dist -path '*dictionary*'` → nothing. (The asset also appears in `dist/sw.js`'s precache list; entry 3 owns that check.)

**Type-check:** `npm run check` clean with the `./shell/dictionary.svelte` specifier and `?url` stub (`0 ERRORS`, tsc passes silent). Scratch `/** @type {number} */ const scratchTypeError = 'x';` appended to the script → `scripts/build-dictionary.mjs(129,29): error TS2322`, `exit=2`; reverted, `npm run check` → `exit=0`.

**Watch re-run (AD-17):** on /mnt/d, default `vitest watch` got no file events (drvfs inotify), so no re-run fired; with a scratch config (deleted) merging `server.watch.usePolling: true`, editing `scripts/build-dictionary.test.mjs` re-ran it in `889ms` and `905ms` (< 1 s). The missing drvfs file events are a pre-existing environment limit, not introduced here.

**`npm run test:all`:** `exit=0` — lint `Checked 23 files … No fixes applied`, check `0 ERRORS`, unit `265 passed`, `1.38s`, Playwright `2 passed (9.7s)`.

### Handoff

- The `en-*.txt` asset is emitted but unreferenced at runtime until epic 3 adds the fetch/load states; CAP-6's size-budget gate is the permanent guard, with entry 3's `pwa` precache check.
- Stale AGENTS.md lines for the D8 `bmad-project-context` audit: Known pitfalls "The scaffold script still filters 3–10 into `public/dictionary/`; follow AD-8."; rule 5 "(target per AD-8; the scaffold differs, see Known pitfalls)".
- R-37's build-filter clause has no R-id test here; epic 2/3 adds an `R-37 …` dictionary repro case loading `generated/dictionary/en.txt?raw`.
- The AGENTS.md TODO line's remaining `build:test` item covers the still-missing `prebuild:test` hook (entry 3).
- Vitest watch on /mnt/d needs polling to see edits (see Watch re-run above).

**Review patches (2026-09-27):** new `AD-8 a checksum mismatch exits non-zero and leaves the output untouched, with and without --force` (child-process CLI test; mutation-checked: deleting `verifySource` from `main()` fails it only); `src/main.ts` comment on the side-effect import (AD-8); README BGA sentence reworded ("lacked 99 of the words in `enable1.txt` … the 96 two-letter words of `enable1.txt` plus …"). Unit `AD-8` cases now 30; `npm test` 266 passed.

## Plan Change Log

## Review Triage Log

### 2026-09-27 — Review pass
- verdicts: 21 findings — high 0, medium 3, low 7, false 10, maybe-false 1
- findings:
  - `[medium]` `patch` (verification-gap) CLI `main()` wiring (checksum before stat/write, `--force`, script mtime) untested — added child-process `AD-8` mismatch test (with/without `--force`; output mtime+hash unchanged, no tmp); mutation-checked by removing `verifySource`.
  - `[low]` `defer` (verification-gap) No automated check that `npm run build` emits `dist/assets/en-*.txt` — the story assigns the permanent guard to CAP-6's size gate and entry 3's `pwa` check; deferred to them.
  - `[medium]` `patch` (intent-alignment) Surface mismatch: process-level CLI guarantees exercised only by evidence — same root cause as verification-gap #1; shared fix.
  - `[false]` `reject` (intent-alignment) Extra `parseArgs` throw on `--source ""` — adopted Pass 4 default (review log); a missing value by another spelling, not a defect.
  - `[low]` `patch` (intent-alignment) README "its" misattributes the three words to BGA's list — reworded; facts verified with `comm` (96 two-letter + knickknack, razzmatazz, razzmatazzes).
  - `[false]` `reject` (intent-alignment) README test uses `[ \t]+` not `\s+` and asserts one bullet — adopted Pass 4 default; after a per-line split the two are equivalent.
  - `[low]` `reject` (edge-case) Orphan `en.txt.<pid>.tmp` if write/rename throws — rare (disk full/EPERM), git-ignored, and the plan's default leaves it; fix adds a try/catch.
  - `[false]` `reject` (edge-case) Output path is a directory → reported fresh — not reachable by any flow; Vite then fails loudly on the import.
  - `[low]` `reject` (edge-case) `realpathSync(argv[1])` throws on import when argv[1] is a nonexistent path — only under `node -e … arg`, which nothing does; the failure is loud, not silent; fix adds a branch.
  - `[false]` `reject` (edge-case) Tie treated fresh on coarse mtime — the story specifies a tie is fresh; drvfs mtimes are ns-resolution (evidence).
  - `[false]` `reject` (edge-case) Direct `npx vitest`/`test:e2e:ui` skip generation — no Vitest test imports the stub or the generated file; AD-8 names the hook set, which is complete.
  - `[low]` `patch` (blind-hunter) `main.ts` side-effect import has no why-comment — added one-line AD-8 comment.
  - `[low]` `patch` (blind-hunter) README pronoun — shared fix with intent-alignment #3.
  - `[false]` `reject` (blind-hunter) `.gitignore` `generated/` unanchored — the story specifies `generated/`; no other `generated/` dir exists or is planned.
  - `[medium]` `patch` (blind-hunter) CLI `main()` untested — shared fix with verification-gap #1.
  - `[false]` `reject` (blind-hunter) Fresh output contents not pinned — AD-8 defines staleness by mtime; a hand-edited output is user-caused and outside the rule.
  - `[low]` `reject` (blind-hunter) Orphan tmp cleanup — same as edge-case #1; rejected on the same reason.
  - `[maybe-false]` `reject` (blind-hunter) CLI guard skips on Windows drive-letter case — Node realpaths the main module, so both sides are canonical; would need a Windows-host run to settle; if true only low (no Windows workflow).
  - `[false]` `reject` (blind-hunter) Word count recomputed in `main()` — logging only; changing `filterWords`' return would break the story's pinned signature.
  - `[false]` `reject` (blind-hunter) AGENTS.md stale lines — story (D8) excludes them; listed in the handoff.
  - `[false]` `reject` (blind-hunter) Stub could re-export / `.svelte.ts` naming — the stub form is a pinned Pass 4 default; the name is the AD-8 path epic 3 fills.

## Design Notes

Adopted Pass 4 minors (technical defaults):
- `--force` skips only the staleness check; checksum always first.
- `parseArgs(process.argv.slice(2))` → `{ force: boolean, source: string | null }`, no path resolution inside; success cases `[]`, `['--force']`, `['--source','x']`, `['--force','--source','x']`; throws: unknown, `--source=x`, `--force --force`, `--source a --source b`, missing value, value starting `--`, `--source ""`.
- `verifySource(buffer, expectedHash)` compares with its argument; CLI passes `EXPECTED_SHA256`.
- CLI guard: `process.argv[1] !== undefined && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)`.
- README test: split on `/\r?\n/`; exactly one line starting ``- `enable1.txt` ``; span to next `^- ` or EOF; exactly one match of `^[ \t]+SHA-256: ([0-9a-f]{64})$`; capture === `EXPECTED_SHA256`.
- README BGA sentence names `enable1.txt` (172,823) and the 99 = 96 two-letter + knickknack, razzmatazz, razzmatazzes.
- Evidence extras: watch re-run < 1 s (AD-17) from a `test:watch` re-run; port free via `! ss -ltn 'sport = :5173' | grep -q 5173`; no `en.txt.*.tmp` after a normal `--force`; `npm run check` clean with the stub specifier; scratch type error in the script fails `npm run check`, reverted.
- Orphan tmp from a killed run is left alone (git-ignored).
- Handoff (Auto Run Result): asset emitted but unreferenced until epic 3; CAP-6 is the permanent guard; stale AGENTS.md lines (Known pitfalls "scaffold script still filters 3–10…", rule 5 "(the scaffold differs…)") under a heading for the D8 audit; R-37 build-filter clause needs an epic 2/3 `R-37` repro case loading `generated/dictionary/en.txt?raw`; `build:test` TODO covers `prebuild:test` (entry 3).

## Verification

**Commands:**
- `npm run lint` -- expected: clean.
- `npm run check` -- expected: 0 errors (svelte-check, node incl. scripts, engine, arch).
- `npm test` -- expected: all `AD-8` and existing tests pass; duration < 5 s.
- `rm -rf generated dist && npm run build` -- expected: success, one `dist/assets/en-*.txt`.
- `npm run test:all` -- expected: green.

## Auto Run Result

**Status:** built.

**Summary:** `scripts/build-dictionary.mjs` is now the checksum-verified 3–23 filter with pure exports (`EXPECTED_SHA256`, `filterWords`, `parseArgs`, `sha256`, `verifySource`, `isStale`) and a guarded CLI (parse → verify → stale unless `--force` → tmp+rename into `generated/dictionary/en.txt`). The five `pre*` hooks run it staleness-gated; `build` is `vite build`; a `?url` stub in `src/shell/dictionary.svelte.ts`, side-effect-imported by `main.ts`, emits one hashed `dist/assets/en-<hash>.txt`.

**Files changed:**
- `scripts/build-dictionary.mjs` — rewrite per AD-8 / story Build choices.
- `scripts/build-dictionary.test.mjs` — new, 30 `AD-8` cases incl. a child-process checksum-mismatch test.
- `package.json` — `predev`/`pretest`/`pretest:watch`/`pretest:e2e`/`prebuild`; `build` = `vite build`; `build:dictionary` = `--force`.
- `vite.config.ts` — Vitest include adds `scripts/**/*.test.mjs`. `tsconfig.node.json` — `allowJs`, `checkJs`, `scripts/**/*.mjs`.
- `.gitignore` — `generated/` in, `public/dictionary/` out (folder deleted from disk). `.gitattributes` — new, `data/enable1.txt -text`.
- `data/README.md` — 3–23, 172,713 words, reworded BGA sentence, `  SHA-256:` line.
- `src/shell/dictionary.svelte.ts` — new `dictionaryUrl` stub. `src/main.ts` — commented side-effect import.
- `AGENTS.md` — the two D8 TODO edits only.

**Review (thorough: blind-hunter, edge-case-hunter, verification-gap, intent-alignment):** 21 findings. Patched: 3 entries (medium: CLI `main()` untested → child-process test; low: `main.ts` import comment; low: README pronoun). Deferred: 1 (build-asset guard → CAP-6 / entry 3). Rejected: 10 false, 3 low (orphan tmp ×2, argv realpath on nonexistent path), 1 maybe-false (Windows guard) — reasons in the triage log.

**Follow-up review recommended:** false — one medium and two low entries patched, no high.

**Verification:** after patches, `rm -rf generated dist && npm run build` → one `dist/assets/en-n6QSuDF0.txt`, 172,713 lines, byte-equal to `generated/dictionary/en.txt`, no `dist/dictionary`; `npm run test:all` green — Biome 23 files clean, check 0 errors, Vitest 266 passed in 1.43 s, Playwright 2 passed (android, desktop). Orchestrator spot-check of drvfs staleness: second run left mtime unchanged; touching source and script each regenerated. All story evidence items are in Implementation Notes; neither halt condition triggered.

**Residual risks:**
- Vitest watch on /mnt/d gets no inotify events, so watch re-runs never fire without polling (pre-existing; polling re-run measured 889/905 ms).
- `timeout -s INT npm run dev` did not stop Vite under a non-TTY pipe; the port was freed manually before e2e.
- The dist asset is guarded only by evidence until CAP-6 / entry 3 land (deferred).
