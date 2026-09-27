---
id: 5
type: story
title: "PWA packaging: manifest, service-worker settings, head, icons and palette"
parent: epic-scaffold-ci-deploy
covers: [CAP-5]
after: [4]
risk: medium
---

# PWA packaging: manifest, service-worker settings, head, icons and palette

## Description

Sets vite.config.ts to AD-16 (registerType prompt, injectRegister false, A-D5 manifest, globPatterns, 4 MB limit, build.manifest true), the index.html head, scripts/build-icons.mjs with committed SVG sources and PNGs, and the DESIGN.md palette and overflow rules in src/ui/app.css, extending entry 3's pwa spec with the build-output checks.

## Acceptance Criteria

Verify: pwa build-output tests deep-equal the manifest to A-D5, find the AD-16 precache list, no registerSW.js and .vite/manifest.json, e2e AD-16 and AD-11 cases read the head metas and body styles, and node scripts/build-icons.mjs regenerates the three committed PNGs.

**Build precondition:** clean tree on `epic-1-scaffold`.

**Delta checks (delta-checks.md rows for CAP 5):**

- `vite.config.ts` `registerType` → `'prompt'`, `injectRegister: false`: no `registerSW.js` in the build; the built `index.html` has no SW registration script; config diff.
- Manifest per A-D5: a build-output test reads `manifest.webmanifest` and deep-equals A-D5 (name, short_name, description, `#15171B` ×2, `standalone`, `portrait`, icons 192 `any`, 512 `any`, 512 `maskable`); no `display_override`.
- `globPatterns`, size limit (AD-16): the `sw.js` precache list holds `index.html`, JS, CSS, the dictionary, the font, the icons and `manifest.webmanifest`; config has `maximumFileSizeToCacheInBytes: 4_000_000` and no `dontCacheBustURLsMatching`.
- `build.manifest: true`: `.vite/manifest.json` exists after the build (read from the file system; `vite preview` may not serve it).
- `App.svelte`, `app.css` styles (CAP 5 part): e2e `AD-11` case reads computed `overflow` ≠ `hidden` on `html`/`body`, `overscroll-behavior` `none`, `body` background `rgb(21, 23, 27)`; DESIGN.md `colors` exist as `--wc-<token>` custom properties in `src/ui/app.css` [ASSUMPTION per build-notes].
- `index.html` head (CAP 5 part): e2e `AD-16` case reads `document.title` `WordCell`, the viewport meta with `viewport-fit=cover`, `theme-color` `#15171B`.
- `public/icons/` generated: `node scripts/build-icons.mjs` writes `icon-192.png`, `icon-512.png`, `icon-512-maskable.png` at those pixel sizes from committed SVGs (`scripts/icons/*.svg` [ASSUMPTION]); all three committed; `includeAssets: ['favicon.svg']` kept.

**Tests:** `AD-16 …` build-output cases in `e2e/pwa/` against `dist-test/` (epic Decision, 2026-09-27); `AD-16 …` head case and `AD-11 …` style case in the default config (`android`). Icons are rendered on the host, not in CI (A-A7).

**Owner checks at gate 4:** the icon art (a tilted `W` card per DESIGN.md App icon) and the maskable art inside the central 80 %, judged visually.

**AGENTS.md `TODO(epic 1)` items removed:** none.

## References

- parent — _bmad-output/initiative-wordcell-v1/epic-scaffold-ci-deploy/epic-scaffold-ci-deploy.md
- architecture — _bmad-output/planning-artifacts/architecture/architecture-wordcell-2026-09-27/ARCHITECTURE-SPINE.md, AD-16, AD-11
- design — _bmad-output/planning-artifacts/ux-designs/ux-wordcell-2026-09-27/DESIGN.md, colors, A-D5, App icon
- spec — _bmad-output/specs/spec-epic-1-scaffold-ci-deploy/build-notes.md, CAP-5 Packaging

## Notes

- Open question: Icon art is drawn by the builder from DESIGN.md's App icon description; the owner judges it at gate 4.
