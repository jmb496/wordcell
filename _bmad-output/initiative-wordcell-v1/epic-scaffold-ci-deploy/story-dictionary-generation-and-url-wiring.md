---
id: 2
type: story
title: "Dictionary generation and ?url wiring"
parent: epic-scaffold-ci-deploy
covers: [CAP-2]
after: [1]
risk: medium
---

# Dictionary generation and ?url wiring

## Description

Rewrites scripts/build-dictionary.mjs to the checksum-verified 3–23-letter filter into generated/dictionary/en.txt, updates data/README.md, adds the staleness-gated predev, pretest, pretest:watch, pretest:e2e and prebuild hooks (build becomes vite build only), ignores generated/ and deletes public/dictionary/, adds the scripts/**/*.test.mjs Vitest include (D3), adds `.gitattributes`, and emits the list as one hashed asset through a stub src/shell/dictionary.svelte.ts imported by main.ts.

CLI: `node scripts/build-dictionary.mjs` (no flag) is the staleness-gated mode every `pre*` hook calls (`predev`, `pretest`, `pretest:watch`, `pretest:e2e`, `prebuild`; entry 3's `prebuild:test` reuses it): it writes only when the output is stale against its inputs, the chosen source path and `scripts/build-dictionary.mjs`. `--force` always regenerates; `--source <path>` selects the input (resolved against cwd; the default `data/enable1.txt` resolves relative to the script via `import.meta.url`). Every mode (no flag, `--force`, any `--source`) runs parse arguments → verify checksum → staleness check → write, so the checksum check precedes any stat or write of the output, and a mismatch exits non-zero without touching it. Pure exported `parseArgs(argv)` accepts only the exact tokens `--force` and `--source <value>` and throws (rule 6) on an unknown token (`--source=path` included), a repeated flag, a missing `--source` value or a value starting with `--`; one `AD-8` unit case per throw. The existing `build:dictionary` script becomes `node scripts/build-dictionary.mjs --force`.

## Acceptance Criteria

Verify (`AD-8` = unit test in `scripts/build-dictionary.test.mjs`; *evidence* = command output recorded in the plan): AD-8 script tests pass under npm run test, a real run writes 172,713 lines, a one-byte-changed source fails the script, the hooks regenerate only when the output is missing or stale, and npm run build emits exactly one dist/assets/en-<hash>.txt byte-equal to the generated file and no dictionary/en.txt.

**Build precondition:** clean tree on `epic-1-scaffold`.

**Delta checks (delta-checks.md rows for CAP 2):**

- `build-dictionary.mjs` 3–10 → 3–23, writes `generated/`: `AD-8` script tests on inline fixtures (2- and 24-letter words dropped, 3 and 23 kept, non-`a–z` dropped, uppercase, space-padded, CR-bearing and empty lines dropped, order kept, LF and trailing newline, `'cat\ndog'` (no final LF) → `'cat\ndog\n'`, a source with no matches gives `""`); *evidence*: a real run writes 172,713 lines to `generated/dictionary/en.txt`.
- `data/README.md` text and checksum: README keeps the source URL, replaces the 3–10 sentence with 3–23, 172,713 words and SHA-256 `3f16130220645692ed49c7134e24a18504c2ca55b3c012f7290e3e77c63b1a89`, and rewords the BGA sentence: the BGA `english.txt` (172,724 words) had 99 fewer words than this list, which has 96 two-letter words; the hash sits on an indented continuation line of the `enable1.txt` bullet, literally `  SHA-256: <64 lowercase hex>` (no backticks; CAP-4 reuses this format for the font bullet); `AD-8` tests: the span from the line starting ``- `enable1.txt` `` to the next `^- ` line or EOF holds exactly one match of `^\s+SHA-256: ([0-9a-f]{64})$`, whose capture equals `EXPECTED_SHA256` (no whole-file containment or first-64-hex extraction), `AD-8 committed source matches the expected SHA-256`, and `verifySource` throws on an inline buffer with one byte flipped; *evidence*: after a fresh generate with its mtime and hash recorded, the CLI with `--source <copy>` (a temp copy with one byte changed) exits non-zero, and so does `--force --source <copy>`; the output's mtime and hash are unchanged and no `en.txt.*.tmp` remains (never mutate `data/enable1.txt`).
- `.gitignore` (CAP 2 part): add `generated/`, drop `public/dictionary/`; `git check-ignore generated/dictionary/en.txt` succeeds; `public/dictionary/` is deleted from disk and absent from `dist/` (*evidence*).
- `.gitattributes` (new): `data/enable1.txt -text`, so a `core.autocrlf=true` clone keeps the checksum; *evidence*: `git check-attr text data/enable1.txt` prints `unset`. An existing CRLF checkout needs `rm data/enable1.txt && git checkout -- data/enable1.txt` (a plain checkout may skip a stat-clean file).
- `package.json` `predev`/`pretest`/`pretest:watch`/`pretest:e2e`: *evidence* on /mnt/d, one sequence per hook, recorded separately: `rm -rf generated && <command>; test -f generated/dictionary/en.txt` for `npm test`, `npm run pretest:e2e`, `npm run pretest:watch` and `timeout --foreground -s INT 15 npm run dev` (then confirm port 5173 is free before any `test:e2e` run, since its webServer `npm run dev` would let `predev` mask a missing `pretest:e2e`); the npm hook banner of an `npm run test:e2e` run shows `pretest:e2e`, and that of `timeout --foreground -s INT 10 npm run test:watch` shows `pretest:watch`; this per-hook sequence replaces delta-checks.md's literal fresh-clone `npm run test:e2e` check, whose webServer `predev` would hide a missing `pretest:e2e`; a second run with an up-to-date file leaves its mtime unchanged; touching `data/enable1.txt` or the script makes the next hook regenerate; `AD-8` unit cases cover `isStale` for missing, older, equal and newer output, with two inputs an output between them stale in both input orders and one equal to the larger fresh, plus the empty-inputs throw, checked first whatever `outMtime` (`isStale(null, [])` included); *evidence*: `--source` pointing at a nonexistent path exits non-zero.
- Dictionary generation `build` → `prebuild`: the `build` script is `vite build` only; *evidence*: `rm -rf generated dist && npm run build` succeeds.
- `?url` wiring (CAP 2 part): *evidence* on that build: exactly one `dist/assets/en-*.txt`, 172,713 lines, byte-equal to `generated/dictionary/en.txt`; no `dictionary/en.txt` in `dist/`. The precache half of this row (`revision: null`) is entry 3's `pwa` check. After this ticket, CAP-6's size-budget gate (fails if the dictionary is absent from the counted set) and entry 3's `pwa` precache check keep guarding the emitted asset.

**Build choices (technical defaults):**

- Filter: split on `\n` only; keep a line iff it matches `^[a-z]{3,23}$` exactly (no trim, no lowercasing); `""` when nothing matches, else the kept words joined with `\n` plus one trailing `\n`. The checksum pins the input, so the real output stays 172,713.
- Exports (build-notes CAP-2, SPEC D3): `EXPECTED_SHA256`; pure `filterWords(text) → string` (the Filter rule above; the inline-fixture tests call it); `parseArgs(argv)` (CLI above); `sha256(buffer)` → lowercase hex (`digest('hex')`); `verifySource(buffer, expectedHash)`, built on `sha256`, compares exactly with the lowercase `EXPECTED_SHA256` and throws on a mismatch; `isStale(outMtime, inputMtimes)`: an empty `inputMtimes` throws first, whatever `outMtime`; else `null` (missing output) is stale, else stale iff `outMtime < max(inputMtimes)` (a tie is fresh). The CLI reads the output alone with `statSync(out, { throwIfNoEntry: false })?.mtimeMs ?? null` (a missing output is an AD-8 state, not an error) and each input with a plain `statSync` (no try/catch), so a missing input throws before `isStale` runs (rule 6). The CLI body runs only under `realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)` (so a symlinked path does not silently skip it) (build-notes CAP-2; no `import.meta.main` on the 22.12 floor), so importing the module from the test has no side effects.
- Output: `generated/dictionary/` resolves relative to the script (`new URL('../generated/dictionary/', import.meta.url)`), whatever the cwd; the CLI runs `mkdirSync(dir, { recursive: true })`, writes the per-process `en.txt.<pid>.tmp` in that directory, then `renameSync`s it over `en.txt`, so an interrupted run never leaves a truncated file that looks fresh and concurrent hooks on a fresh clone do not collide.
- Stub: `src/shell/dictionary.svelte.ts` exports `dictionaryUrl` from `../../generated/dictionary/en.txt?url` for epic 3; no fetch, no `state`, no `Set` in epic 1 (build-notes CAP-2; SPEC Non-goals). `main.ts` imports it side-effect only (`import './shell/dictionary.svelte';`), because Vite 8 tree-shakes an unused named import and emits no asset (verified with a scratch Vite 8.3.1 build, 2026-09-27). If the build emits no `en-*.txt`, halt and ask (rule 7); never add a fetch or a `public/` copy.

**Tests:** `AD-8 …` in `scripts/build-dictionary.test.mjs` (D3: Vitest `include` gains `scripts/**/*.test.mjs`, node environment; `tsconfig.node.json` gains `allowJs: true`, `checkJs: true` (the authority; per-file `// @ts-check` only for editor feedback) and `scripts/**/*.mjs` in `include`, which also covers `scripts/build-dictionary.test.mjs`, so `npm run check` type-checks the test; *evidence*: a scratch type error in the script fails `npm run check`, then is reverted). Inline fixtures only; the real-file reads are `data/README.md` and the hash of `data/enable1.txt`. Unit suite stays under 5 s (*evidence*: the Vitest duration line from `npm test`). This ticket claims no R-37 coverage: the 3–23 build-filter clause is proven by the `AD-8` script tests and the 172,713 evidence, and `AD-8` script tests are never R-id coverage (build-notes, Tests of scripts).

**Owner checks at gate 4:** none beyond reading the plan's result.

**AGENTS.md `TODO(epic 1)` items removed:** "the dictionary `pre*` hooks" and the clause "only `npm run build` generates the dictionary". `prebuild:test` belongs to entry 3, which adds `build:test`; the TODO line's remaining `build:test` item covers the still-missing `prebuild:test` hook. Only these two items are edited (D8); the now-stale Known pitfalls line ("The scaffold script still filters 3–10 into public/dictionary/") and rule 5's "(the scaffold differs, see Known pitfalls)" are left for the post-epic `bmad-project-context` audit (SPEC D8) and listed in the plan's handoff, which also names R-37's build-filter clause (no R-id test here) for an epic 2/3 dictionary repro case (an `R-37 …` test loading `generated/dictionary/en.txt?raw`).

## References

- parent — _bmad-output/initiative-wordcell-v1/epic-scaffold-ci-deploy/epic-scaffold-ci-deploy.md
- architecture — _bmad-output/planning-artifacts/architecture/architecture-wordcell-2026-09-27/ARCHITECTURE-SPINE.md, AD-8
- spec — _bmad-output/specs/spec-epic-1-scaffold-ci-deploy/build-notes.md, CAP-2 Dictionary, Tests of scripts/*.mjs

## Notes

- mtime on the /mnt/d drvfs mount: default is `isStale` above; the plan's hook *evidence* runs on /mnt/d. If drvfs misbehaves, halt and report; replacing mtime would deviate from AD-8 (rule 7).
