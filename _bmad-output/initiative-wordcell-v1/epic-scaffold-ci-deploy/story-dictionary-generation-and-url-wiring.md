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

Rewrites scripts/build-dictionary.mjs to the checksum-verified 3–23-letter filter into generated/dictionary/en.txt, updates data/README.md, adds the staleness-gated predev, pretest, pretest:watch, pretest:e2e and prebuild hooks (build becomes vite build only), ignores generated/ and deletes public/dictionary/, adds the scripts/**/*.test.mjs Vitest include (D3), and emits the list as one hashed asset through a stub src/shell/dictionary.svelte.ts imported by main.ts.

## Acceptance Criteria

Verify: AD-8 script tests pass under npm run test, a real run writes 172,713 lines, a one-byte-changed source fails the script, the hooks regenerate only when the output is missing or stale, and npm run build emits exactly one dist/assets/en-<hash>.txt byte-equal to the generated file and no dictionary/en.txt.

**Build precondition:** clean tree on `epic-1-scaffold`.

**Delta checks (delta-checks.md rows for CAP 2):**

- `build-dictionary.mjs` 3–10 → 3–23, writes `generated/`: `AD-8` script tests on inline fixtures (2- and 24-letter words dropped, 3 and 23 kept, non-`a–z` dropped, order kept, LF and trailing newline); a real run writes 172,713 lines to `generated/dictionary/en.txt`.
- `data/README.md` text and checksum: README states 3–23, 172,713 words and SHA-256 `3f16130220645692ed49c7134e24a18504c2ca55b3c012f7290e3e77c63b1a89`; an `AD-8` test asserts the script's expected hash equals the README's; a one-byte-changed copy makes the script exit non-zero.
- `.gitignore` (CAP 2 part): add `generated/`, drop `public/dictionary/`; `git check-ignore generated/dictionary/en.txt` succeeds; `public/dictionary/` is deleted from disk and absent from `dist/`.
- `package.json` `predev`/`pretest`/`pretest:watch`/`pretest:e2e`: after `rm -rf generated`, each of `npm test`, `npm run test:e2e`, `npm run dev` creates the file; a second run with an up-to-date file leaves its mtime unchanged; touching `data/enable1.txt` or the script makes the next hook regenerate; an `AD-8` script test covers the staleness function.
- Dictionary generation `build` → `prebuild`: the `build` script is `vite build` only; `npm run build` on a fresh clone succeeds.
- `?url` wiring (CAP 2 part): exactly one `dist/assets/en-*.txt`, byte-equal to `generated/dictionary/en.txt`; no `dictionary/en.txt` in `dist/`. The precache half of this row (`revision: null`) is entry 3's `pwa` check.

**Tests:** `AD-8 …` in `scripts/build-dictionary.test.mjs` (D3: Vitest `include` gains `scripts/**/*.test.mjs`, node environment; `// @ts-check` and `tsconfig.node.json` covering `scripts/**/*.mjs`). Inline fixtures only; the real-file reads are `data/README.md` and the hash of `data/enable1.txt`. Unit suite stays under 5 s.

**Owner checks at gate 4:** none beyond reading the plan's result.

**AGENTS.md `TODO(epic 1)` items removed:** "the dictionary `pre*` hooks" and the clause "only `npm run build` generates the dictionary". `prebuild:test` belongs to entry 3, which adds `build:test`.

## References

- parent — _bmad-output/initiative-wordcell-v1/epic-scaffold-ci-deploy/epic-scaffold-ci-deploy.md
- architecture — _bmad-output/planning-artifacts/architecture/architecture-wordcell-2026-09-27/ARCHITECTURE-SPINE.md, AD-8
- spec — _bmad-output/specs/spec-epic-1-scaffold-ci-deploy/build-notes.md, CAP-2 Dictionary, Tests of scripts/*.mjs

## Notes

- Open question: Whether mtime-based staleness is reliable on the /mnt/d drvfs mount the repo lives on.
