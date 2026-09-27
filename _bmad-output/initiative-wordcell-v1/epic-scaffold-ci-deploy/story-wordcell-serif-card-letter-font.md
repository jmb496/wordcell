---
id: 4
type: story
title: "WordCell Serif card-letter font"
parent: epic-scaffold-ci-deploy
covers: [CAP-4]
after: [3]
risk: medium
---

# WordCell Serif card-letter font

## Description

Adds scripts/build-font.py, commits the Fraunces-instance subset src/ui/assets/wordcell-serif.woff2 and OFL.txt, records source URL and SHA-256 in data/README.md, wires @font-face (font-display: block) in src/ui/app.css and the index.html preload, and extends entry 3's pwa precache spec to the font.

## Acceptance Criteria

Verify: uv run scripts/build-font.py reproduces the committed woff2 byte-for-byte, the woff2 covers A–Z and u only, the build holds the font once with the preload href equal to the @font-face URL, and the pwa precache check finds the font with revision null.

**Build precondition:** clean tree on `epic-1-scaffold`.

**Delta checks (delta-checks.md rows for CAP 4):**

- `index.html` font preload (CAP 4 part): the preload `href` in the built `index.html` equals the hashed font URL in the CSS.
- Font subset (SPEC CAP-4 success): `uv run scripts/build-font.py` reproduces the committed `src/ui/assets/wordcell-serif.woff2` byte-for-byte from the checksum-pinned source; the woff2 covers A–Z and `u` only (cmap shown in the plan); `OFL.txt` is committed; the build holds the font once; the `pwa` precache check also finds the font with `revision: null`.
- `@font-face` `'WordCell Serif'`, `font-display: block`, in `src/ui/app.css` (build-notes CAP-4); source URL and SHA-256 in `data/README.md` (AD-18 Font).

**Tests:** the preload-equals-`@font-face` check and the font precache check live in `e2e/pwa/` against `dist-test/`, named `AD-16 …`, so `npm run test:all` runs them (epic Decision, 2026-09-27). `build-font.py` has no tests (A-A5: not run in CI).

**Owner checks at gate 4:** none beyond reading the plan's result.

**AGENTS.md `TODO(epic 1)` items removed:** none.

## References

- parent — _bmad-output/initiative-wordcell-v1/epic-scaffold-ci-deploy/epic-scaffold-ci-deploy.md
- architecture — _bmad-output/planning-artifacts/architecture/architecture-wordcell-2026-09-27/ARCHITECTURE-SPINE.md, AD-16, AD-18 Font
- design — _bmad-output/planning-artifacts/ux-designs/ux-wordcell-2026-09-27/DESIGN.md, A-D2
- spec — _bmad-output/specs/spec-epic-1-scaffold-ci-deploy/build-notes.md, CAP-4 Font

## Notes

- Open question: [ASSUMPTION] The builder picks the pinned google/fonts commit and records its SHA-256; the run needs network access and uv.
