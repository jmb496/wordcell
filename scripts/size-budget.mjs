// @ts-check
// Postbuild gate: gzip-9 sum of the AD-18 counted set from dist/.vite/manifest.json against
// 600,000 bytes, failing on a missing font or dictionary, plus the AD-16 per-file precache limit.
// Usage: node scripts/size-budget.mjs [distDir] (distDir resolved against cwd; default: repo dist/).
import { existsSync, readdirSync, readFileSync, realpathSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';

/** AD-16 Workbox `globPatterns` entry (asserted against vite.config.ts by the tests). */
export const PRECACHE_GLOB = '**/*.{js,css,html,txt,woff2,png,svg,webmanifest}';
/** AD-16 Workbox `maximumFileSizeToCacheInBytes`. */
export const PRECACHE_MAX_BYTES = 4_000_000;

const BUDGET_BYTES = 600_000; // AD-18
const FONT_KEY = 'src/ui/assets/wordcell-serif.woff2';
const DICTIONARY_KEY = 'generated/dictionary/en.txt';
const SW_KEY = 'src/shell/sw.ts';

const braceMatch = /\{([^}]*)\}$/.exec(PRECACHE_GLOB);
if (braceMatch === null) throw new Error(`size-budget: no brace set in ${PRECACHE_GLOB}`);
const PRECACHE_EXTENSIONS = new Set(braceMatch[1].split(','));

/**
 * @typedef {{ file?: string, isEntry?: boolean, imports?: string[], dynamicImports?: string[], css?: string[], assets?: string[] }} ManifestChunk
 * @typedef {Record<string, ManifestChunk>} Manifest
 * @typedef {{ raw: number, gzip: number }} FileSize
 */

/**
 * Hand-rolled match of PRECACHE_GLOB (Workbox `dot: false`, AD-16).
 * @param {string} path dist-relative POSIX path
 */
function matchesPrecacheGlob(path) {
  const segments = path.split('/');
  if (segments.some((segment) => segment.startsWith('.'))) return false;
  const base = segments[segments.length - 1];
  const dot = base.lastIndexOf('.');
  if (dot === -1) return false;
  return PRECACHE_EXTENSIONS.has(base.slice(dot + 1));
}

/**
 * Looks up a walked key; throws (rule 6) when it is absent or has no `file`.
 * @param {Manifest} manifest
 * @param {string} key
 */
function chunkOf(manifest, key) {
  if (!Object.hasOwn(manifest, key)) throw new Error(`size-budget: manifest has no key ${key}`);
  const chunk = manifest[key];
  if (typeof chunk.file !== 'string')
    throw new Error(`size-budget: manifest key ${key} has no file`);
  return chunk;
}

/**
 * Closure from `start`, never following a dynamic import edge to SW_KEY (AD-18).
 * @param {Manifest} manifest
 * @param {string} start
 * @param {boolean} followDynamic
 * @returns {{ keys: Set<string>, swDynamic: boolean }}
 */
function closure(manifest, start, followDynamic) {
  /** @type {Set<string>} */
  const keys = new Set();
  let swDynamic = false;
  const stack = [start];
  while (stack.length > 0) {
    const key = /** @type {string} */ (stack.pop());
    if (keys.has(key)) continue;
    const chunk = chunkOf(manifest, key);
    keys.add(key);
    stack.push(...(chunk.imports ?? []));
    if (followDynamic) {
      for (const target of chunk.dynamicImports ?? []) {
        if (target === SW_KEY) swDynamic = true;
        else stack.push(target);
      }
    }
  }
  return { keys, swDynamic };
}

/**
 * AD-18 size budget and AD-16 precache file limit.
 * @param {Manifest} manifest parsed dist/.vite/manifest.json
 * @param {Map<string, FileSize>} sizes every dist file except `.vite/`, by dist-relative path
 * @returns {{ rows: { file: string, gzip: number }[], total: number, errors: string[] }}
 */
export function computeBudget(manifest, sizes) {
  const entries = Object.keys(manifest).filter((key) => manifest[key].isEntry === true);
  if (entries.length !== 1) {
    throw new Error(
      `size-budget: expected exactly one isEntry key, found ${entries.length}: ${JSON.stringify(entries)}`,
    );
  }

  const main = closure(manifest, entries[0], true);
  const counted = new Set(main.keys);
  if (main.swDynamic) {
    // X: the sw.ts static-import closure, not counted itself; its dynamic targets are (AD-18).
    const excluded = closure(manifest, SW_KEY, false).keys;
    for (const key of excluded) {
      for (const target of manifest[key].dynamicImports ?? []) {
        if (target === SW_KEY) continue;
        for (const k of closure(manifest, target, true).keys) counted.add(k);
      }
    }
  }

  /** @type {Set<string>} */
  const files = new Set(['index.html']);
  for (const key of counted) {
    const chunk = chunkOf(manifest, key);
    files.add(/** @type {string} */ (chunk.file));
    for (const css of chunk.css ?? []) files.add(css);
  }

  const fontFile = Object.hasOwn(manifest, FONT_KEY) ? manifest[FONT_KEY].file : undefined;
  const dictionaryFile = Object.hasOwn(manifest, DICTIONARY_KEY)
    ? manifest[DICTIONARY_KEY].file
    : undefined;
  if (typeof fontFile === 'string') files.add(fontFile);
  if (typeof dictionaryFile === 'string') files.add(dictionaryFile);

  const rows = [...files]
    .sort((a, b) => (a < b ? -1 : a > b ? 1 : 0))
    .map((file) => {
      const size = sizes.get(file);
      if (size === undefined) throw new Error(`size-budget: counted file ${file} is not in dist`);
      return { file, gzip: size.gzip };
    });
  const total = rows.reduce((sum, row) => sum + row.gzip, 0);

  /** @type {string[]} */
  const errors = [];
  if (total > BUDGET_BYTES) {
    errors.push(`size-budget: total ${total} gzip bytes is over the ${BUDGET_BYTES} budget`);
  }
  if (typeof fontFile !== 'string') {
    errors.push(`size-budget: missing font ${FONT_KEY} in the manifest`);
  }
  if (typeof dictionaryFile !== 'string') {
    errors.push(`size-budget: missing dictionary ${DICTIONARY_KEY} in the manifest`);
  }
  const oversized = [...sizes]
    .filter(([path, size]) => size.raw > PRECACHE_MAX_BYTES && matchesPrecacheGlob(path))
    .map(([path]) => path)
    .sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
  for (const path of oversized) {
    const raw = /** @type {FileSize} */ (sizes.get(path)).raw;
    errors.push(
      `size-budget: ${path} is ${raw} bytes, over the ${PRECACHE_MAX_BYTES} precache limit`,
    );
  }

  return { rows, total, errors };
}

/**
 * Every file under `dir` except the top-level `.vite/`, by dist-relative POSIX path.
 * @param {string} dir
 * @param {string} prefix
 * @param {Map<string, FileSize>} sizes
 */
function collectSizes(dir, prefix, sizes) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const rel = `${prefix}${entry.name}`;
    if (rel === '.vite') continue;
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      collectSizes(path, `${rel}/`, sizes);
    } else {
      const bytes = readFileSync(path);
      sizes.set(rel, { raw: bytes.length, gzip: gzipSync(bytes, { level: 9 }).length });
    }
  }
}

function main() {
  const args = process.argv.slice(2);
  if (args.length > 1 || (args.length === 1 && (args[0] === '' || args[0].startsWith('-')))) {
    throw new Error(
      `size-budget: usage: node scripts/size-budget.mjs [distDir], got ${JSON.stringify(args)}`,
    );
  }
  const dist =
    args.length === 1 ? resolve(args[0]) : fileURLToPath(new URL('../dist/', import.meta.url));
  const manifestPath = join(dist, '.vite', 'manifest.json');
  const indexPath = join(dist, 'index.html');
  if (!existsSync(manifestPath)) throw new Error(`size-budget: missing ${manifestPath}`);
  if (!existsSync(indexPath)) throw new Error(`size-budget: missing ${indexPath}`);

  /** @type {Manifest} */
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
  /** @type {Map<string, FileSize>} */
  const sizes = new Map();
  collectSizes(dist, '', sizes);

  const { rows, total, errors } = computeBudget(manifest, sizes);
  for (const row of rows) console.log(`${row.file} ${row.gzip}`);
  console.log(`total ${total} / ${BUDGET_BYTES}`);
  for (const error of errors) console.error(error);
  if (errors.length > 0) process.exitCode = 1;
}

if (
  process.argv[1] !== undefined &&
  realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  main();
}
