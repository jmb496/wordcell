// @ts-check
// Renders the committed app-icon SVG sources in scripts/icons/ to the manifest PNGs in
// public/icons/ and copies the favicon source to public/favicon.svg (AD-16, DESIGN.md App icon).
// Host-only [ASSUMPTION A-A7]: run `node scripts/build-icons.mjs` by hand; CI never renders icons.
// Chromium comes from the existing @playwright/test 1.63.0; the script prints the Chromium
// `browser.version()` it rendered with. Editing an SVG requires a rerun and a commit of the PNGs
// and public/favicon.svg: no v1 guard checks the committed PNGs against later SVG edits (A-A7).
import { existsSync, mkdirSync, readFileSync, realpathSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

/** @typedef {{ source: string, output: string, size: number }} Icon */

/** Sources resolve against scripts/icons/, outputs against public/icons/. @type {readonly Icon[]} */
export const ICONS = [
  { source: 'icon.svg', output: 'icon-192.png', size: 192 },
  { source: 'icon.svg', output: 'icon-512.png', size: 512 },
  { source: 'icon-maskable.svg', output: 'icon-512-maskable.png', size: 512 },
];

/** Source resolves against scripts/icons/, output against public/. */
export const FAVICON = { source: 'favicon.svg', output: 'favicon.svg' };

const SOURCE_DIR = resolve(import.meta.dirname, 'icons');
const FONT_PATH = resolve(import.meta.dirname, '../src/ui/assets/wordcell-serif.woff2');
const PUBLIC_DIR = resolve(import.meta.dirname, '../public');
const ICON_DIR = join(PUBLIC_DIR, 'icons');

/**
 * Reads every unique source SVG, in ICONS order then FAVICON (rule 6: the first missing throws).
 * @param {string} sourceDir
 * @returns {Map<string, string>} source file name → SVG text
 */
export function readSources(sourceDir) {
  /** @type {Map<string, string>} */
  const sources = new Map();
  for (const name of [...ICONS.map((icon) => icon.source), FAVICON.source]) {
    if (sources.has(name)) continue;
    const path = join(sourceDir, name);
    if (!existsSync(path)) throw new Error(`build-icons: missing source ${name} (${path})`);
    sources.set(name, readFileSync(path, 'utf8'));
  }
  return sources;
}

/**
 * @param {string} fontPath
 * @returns {Buffer} the woff2 bytes
 */
export function readFont(fontPath) {
  if (!existsSync(fontPath)) throw new Error(`build-icons: missing font ${fontPath}`);
  return readFileSync(fontPath);
}

/**
 * @param {string} svg
 * @param {Buffer} font
 */
function wrapper(svg, font) {
  return `<!doctype html>
<html>
<head>
<style>
@font-face {
  font-family: 'WordCell Serif';
  src: url(data:font/woff2;base64,${font.toString('base64')}) format('woff2');
  font-weight: 600;
  font-style: normal;
  font-display: block;
}
html, body { margin: 0; width: 100%; height: 100%; overflow: hidden; background: #15171B; }
svg { display: block; width: 100%; height: 100%; }
</style>
</head>
<body>${svg}</body>
</html>`;
}

// In-page (lib ES2023 here, no DOM types): the checks of e2e/pwa/font.spec.ts; rule 6, so no
// host font is ever used. document.fonts.ready resolves on a failed load and document.fonts.check
// is true when no face matches, so neither is enough.
const FONT_CHECK = `(async () => {
  const faces = await document.fonts.load('600 1em "WordCell Serif"', 'W');
  if (faces.length !== 1 || faces[0].status !== 'loaded') {
    throw new Error('build-icons: WordCell Serif did not load: ' +
      JSON.stringify(faces.map((face) => face.status)));
  }
})()`;

async function main() {
  const sources = readSources(SOURCE_DIR);
  const font = readFont(FONT_PATH);
  mkdirSync(ICON_DIR, { recursive: true });
  const { chromium } = await import('@playwright/test');
  const browser = await chromium.launch();
  try {
    console.log(`build-icons: Chromium ${browser.version()}`);
    for (const icon of ICONS) {
      const page = await browser.newPage({
        viewport: { width: icon.size, height: icon.size },
        deviceScaleFactor: 1,
      });
      await page.setContent(wrapper(/** @type {string} */ (sources.get(icon.source)), font));
      await page.evaluate(FONT_CHECK);
      const output = join(ICON_DIR, icon.output);
      await page.screenshot({ path: output, omitBackground: false });
      await page.close();
      console.log(`build-icons: wrote ${output}`);
    }
    const favicon = join(PUBLIC_DIR, FAVICON.output);
    writeFileSync(favicon, /** @type {string} */ (sources.get(FAVICON.source)));
    console.log(`build-icons: wrote ${favicon}`);
  } finally {
    await browser.close();
  }
}

if (
  process.argv[1] !== undefined &&
  realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  await main();
}
