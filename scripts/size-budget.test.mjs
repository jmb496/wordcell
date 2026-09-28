// @ts-check
import { execFile } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { computeBudget, PRECACHE_GLOB, PRECACHE_MAX_BYTES } from './size-budget.mjs';

const FONT_KEY = 'src/ui/assets/wordcell-serif.woff2';
const DICT_KEY = 'generated/dictionary/en.txt';
const SW_KEY = 'src/shell/sw.ts';
const ENTRY_JS = 'assets/index-a.js';
const ENTRY_CSS = 'assets/index-b.css';
const FONT = 'assets/wordcell-serif-c.woff2';
const DICT = 'assets/en-d.txt';

const OVER_BUDGET = (/** @type {number} */ total) =>
  `size-budget: total ${total} gzip bytes is over the 600000 budget`;
const MISSING_FONT = `size-budget: missing font ${FONT_KEY} in the manifest`;
const MISSING_DICT = `size-budget: missing dictionary ${DICT_KEY} in the manifest`;
const OVER_4MB = (/** @type {string} */ path, /** @type {number} */ raw) =>
  `size-budget: ${path} is ${raw} bytes, over the 4000000 precache limit`;

/**
 * Copies the real manifest shape: the dictionary key is not linked from the entry.
 * @returns {Record<string, any>}
 */
function baseManifest() {
  return {
    [DICT_KEY]: { file: DICT, src: DICT_KEY },
    'index.html': {
      file: ENTRY_JS,
      name: 'index',
      src: 'index.html',
      isEntry: true,
      css: [ENTRY_CSS],
      assets: [FONT],
    },
    [FONT_KEY]: { file: FONT, src: FONT_KEY },
  };
}

/**
 * @param {Record<string, number | { raw: number, gzip: number }>} extra gzip (raw = gzip) or both
 * @param {Record<string, number>} [base]
 */
function sizesOf(extra = {}, base = baseGzip()) {
  /** @type {Map<string, { raw: number, gzip: number }>} */
  const sizes = new Map();
  for (const [path, value] of Object.entries({ ...base, ...extra })) {
    sizes.set(path, typeof value === 'number' ? { raw: value, gzip: value } : value);
  }
  return sizes;
}

/** @returns {Record<string, number>} total 421,300 */
function baseGzip() {
  return {
    'index.html': 100,
    [ENTRY_JS]: 1000,
    [ENTRY_CSS]: 200,
    [FONT]: 20_000,
    [DICT]: 400_000,
    'sw.js': 50,
    'manifest.webmanifest': 30,
    'icons/icon-192.png': 900,
  };
}

/** @param {{ rows: { file: string }[] }} result */
const filesOf = (result) => result.rows.map((row) => row.file);

describe('computeBudget', () => {
  it('AD-18 counts index.html, entry JS and CSS, font and dictionary, sorted', () => {
    const result = computeBudget(baseManifest(), sizesOf());
    expect(result.rows).toEqual([
      { file: DICT, gzip: 400_000 },
      { file: ENTRY_JS, gzip: 1000 },
      { file: ENTRY_CSS, gzip: 200 },
      { file: FONT, gzip: 20_000 },
      { file: 'index.html', gzip: 100 },
    ]);
    expect(result.total).toBe(421_300);
    expect(result.errors).toEqual([]);
  });

  it('AD-18 total 600,000 passes and 600,001 fails', () => {
    const at = computeBudget(baseManifest(), sizesOf({ [DICT]: 578_700 }));
    expect(at.total).toBe(600_000);
    expect(at.errors).toEqual([]);
    const over = computeBudget(baseManifest(), sizesOf({ [DICT]: 578_701 }));
    expect(over.total).toBe(600_001);
    expect(over.errors).toEqual([OVER_BUDGET(600_001)]);
  });

  it('AD-18 missing font key is an error', () => {
    const manifest = baseManifest();
    delete manifest[FONT_KEY];
    const result = computeBudget(manifest, sizesOf());
    expect(result.errors).toEqual([MISSING_FONT]);
    expect(filesOf(result)).toEqual([DICT, ENTRY_JS, ENTRY_CSS, 'index.html']);
    expect(result.total).toBe(401_300);
  });

  it('AD-18 missing dictionary key is an error', () => {
    const manifest = baseManifest();
    delete manifest[DICT_KEY];
    const result = computeBudget(manifest, sizesOf());
    expect(result.errors).toEqual([MISSING_DICT]);
    expect(filesOf(result)).toEqual([ENTRY_JS, ENTRY_CSS, FONT, 'index.html']);
    expect(result.total).toBe(21_300);
  });

  it('AD-18 dictionary key without file is the missing-dictionary error', () => {
    const manifest = baseManifest();
    manifest[DICT_KEY] = { src: DICT_KEY };
    const result = computeBudget(manifest, sizesOf());
    expect(result.errors).toEqual([MISSING_DICT]);
    expect(filesOf(result)).toEqual([ENTRY_JS, ENTRY_CSS, FONT, 'index.html']);
    expect(result.total).toBe(21_300);
  });

  it('AD-18 a counted file absent from dist throws naming it', () => {
    const sizes = sizesOf();
    sizes.delete(DICT);
    expect(() => computeBudget(baseManifest(), sizes)).toThrow(DICT);
  });

  it('AD-18 a visited chunk key without file throws naming it', () => {
    const manifest = baseManifest();
    manifest['index.html'].imports = ['_chunk.js'];
    manifest['_chunk.js'] = { name: 'chunk' };
    expect(() => computeBudget(manifest, sizesOf())).toThrow('_chunk.js');
  });

  it('AD-18 no isEntry key throws', () => {
    const manifest = baseManifest();
    delete manifest['index.html'].isEntry;
    expect(() => computeBudget(manifest, sizesOf())).toThrow('isEntry');
  });

  it('AD-18 two isEntry keys throw', () => {
    const manifest = baseManifest();
    manifest['other.html'] = { file: 'assets/other.js', isEntry: true };
    expect(() => computeBudget(manifest, sizesOf({ 'assets/other.js': 1 }))).toThrow('other.html');
  });

  it('AD-18 empty manifest throws', () => {
    expect(() => computeBudget({}, sizesOf())).toThrow('isEntry');
  });

  it('AD-18 a dangling import key throws naming it', () => {
    const manifest = baseManifest();
    manifest['index.html'].imports = ['_gone.js'];
    expect(() => computeBudget(manifest, sizesOf())).toThrow('_gone.js');
  });

  it('AD-18 index.html (the dist file) is counted', () => {
    const sizes = sizesOf();
    const result = computeBudget(baseManifest(), sizes);
    expect(filesOf(result)).toContain('index.html');
    expect(result.errors).toEqual([]);
    sizes.delete('index.html');
    expect(() => computeBudget(baseManifest(), sizes)).toThrow('index.html');
  });

  it('AD-18 a lazily loaded chunk with CSS is counted', () => {
    const manifest = baseManifest();
    manifest['index.html'].dynamicImports = ['src/lazy.ts'];
    manifest['src/lazy.ts'] = { file: 'assets/lazy.js', css: ['assets/lazy.css'] };
    const result = computeBudget(manifest, sizesOf({ 'assets/lazy.js': 10, 'assets/lazy.css': 5 }));
    expect(filesOf(result)).toEqual(expect.arrayContaining(['assets/lazy.js', 'assets/lazy.css']));
    expect(result.total).toBe(421_315);
    expect(result.errors).toEqual([]);
  });

  it('AD-18 a shared chunk imported by two chunks counts once', () => {
    const manifest = baseManifest();
    manifest['index.html'].imports = ['_a.js', '_b.js'];
    manifest['_a.js'] = { file: 'assets/a.js', imports: ['_shared.js'] };
    manifest['_b.js'] = { file: 'assets/b.js', imports: ['_shared.js'] };
    manifest['_shared.js'] = { file: 'assets/shared.js' };
    const result = computeBudget(
      manifest,
      sizesOf({ 'assets/a.js': 1, 'assets/b.js': 2, 'assets/shared.js': 7 }),
    );
    expect(filesOf(result).filter((f) => f === 'assets/shared.js')).toHaveLength(1);
    expect(result.total).toBe(421_310);
    expect(result.errors).toEqual([]);
  });

  it('AD-18 a CSS file listed by two visited chunks appears once', () => {
    const manifest = baseManifest();
    manifest['index.html'].imports = ['_a.js'];
    manifest['_a.js'] = { file: 'assets/a.js', css: [ENTRY_CSS] };
    const result = computeBudget(manifest, sizesOf({ 'assets/a.js': 3 }));
    expect(filesOf(result).filter((f) => f === ENTRY_CSS)).toHaveLength(1);
    expect(result.total).toBe(421_303);
    expect(result.errors).toEqual([]);
  });

  it('AD-18 a two-chunk import cycle terminates and each counts once', () => {
    const manifest = baseManifest();
    manifest['index.html'].imports = ['_a.js'];
    manifest['_a.js'] = { file: 'assets/a.js', imports: ['_b.js'] };
    manifest['_b.js'] = { file: 'assets/b.js', imports: ['_a.js'] };
    const result = computeBudget(manifest, sizesOf({ 'assets/a.js': 1, 'assets/b.js': 2 }));
    expect(filesOf(result).filter((f) => f === 'assets/a.js')).toHaveLength(1);
    expect(filesOf(result).filter((f) => f === 'assets/b.js')).toHaveLength(1);
    expect(result.total).toBe(421_303);
    expect(result.errors).toEqual([]);
  });

  it('AD-18 an unrelated image asset is not counted', () => {
    const manifest = baseManifest();
    manifest['src/ui/assets/logo.png'] = { file: 'assets/logo.png', src: 'src/ui/assets/logo.png' };
    manifest['index.html'].assets.push('assets/logo.png');
    const result = computeBudget(manifest, sizesOf({ 'assets/logo.png': 5000 }));
    expect(filesOf(result)).not.toContain('assets/logo.png');
    expect(result.total).toBe(421_300);
    expect(result.errors).toEqual([]);
  });

  it('AD-18 over-budget, missing font, missing dictionary and 4 MB files are reported in order', () => {
    const manifest = baseManifest();
    delete manifest[FONT_KEY];
    delete manifest[DICT_KEY];
    const result = computeBudget(
      manifest,
      sizesOf({
        [ENTRY_JS]: 600_000,
        'icons/z.png': { raw: 4_000_002, gzip: 1 },
        'icons/a.png': { raw: 4_000_001, gzip: 1 },
      }),
    );
    expect(result.errors).toEqual([
      OVER_BUDGET(600_300),
      MISSING_FONT,
      MISSING_DICT,
      OVER_4MB('icons/a.png', 4_000_001),
      OVER_4MB('icons/z.png', 4_000_002),
    ]);
  });

  it('AD-18 sw.ts dynamic import: its file, own css and sw-only imports are excluded', () => {
    const manifest = baseManifest();
    manifest['index.html'].imports = ['_shared.js'];
    manifest['index.html'].dynamicImports = [SW_KEY];
    manifest['index.html'].css = [ENTRY_CSS, 'assets/both.css'];
    manifest[SW_KEY] = {
      file: 'assets/sw-chunk.js',
      css: ['assets/sw.css', 'assets/both.css'],
      imports: ['_only-sw.js', '_shared.js'],
    };
    manifest['_only-sw.js'] = { file: 'assets/only-sw.js' };
    manifest['_shared.js'] = { file: 'assets/shared.js' };
    const result = computeBudget(
      manifest,
      sizesOf({
        'assets/both.css': 1,
        'assets/sw-chunk.js': 1,
        'assets/sw.css': 1,
        'assets/only-sw.js': 1,
        'assets/shared.js': 1,
      }),
    );
    const files = filesOf(result);
    expect(files).toContain('assets/shared.js');
    expect(files).not.toContain('assets/only-sw.js');
    expect(files).not.toContain('assets/sw-chunk.js');
    expect(files).not.toContain('assets/sw.css');
    expect(files.filter((f) => f === 'assets/both.css')).toHaveLength(1);
    expect(result.total).toBe(421_302);
    expect(result.errors).toEqual([]);
  });

  it('AD-18 a dynamic import made by a sw.ts-only static import is counted', () => {
    const manifest = baseManifest();
    manifest['index.html'].dynamicImports = [SW_KEY];
    manifest[SW_KEY] = { file: 'assets/sw-chunk.js', imports: ['_only-sw.js'] };
    manifest['_only-sw.js'] = { file: 'assets/only-sw.js', dynamicImports: ['src/lazy.ts'] };
    manifest['src/lazy.ts'] = { file: 'assets/lazy.js' };
    const result = computeBudget(
      manifest,
      sizesOf({ 'assets/sw-chunk.js': 1, 'assets/only-sw.js': 1, 'assets/lazy.js': 1 }),
    );
    expect(result.errors).toEqual([]);
    const files = filesOf(result);
    expect(files).toContain('assets/lazy.js');
    expect(files).not.toContain('assets/only-sw.js');
    expect(files).not.toContain('assets/sw-chunk.js');
  });

  it('AD-18 order independence: a chunk sw.ts imports statically and D (its dynamic import) also imports is counted', () => {
    const manifest = baseManifest();
    manifest['index.html'].dynamicImports = [SW_KEY];
    manifest[SW_KEY] = {
      file: 'assets/sw-chunk.js',
      imports: ['_S.js'],
      dynamicImports: ['_D.js'],
    };
    manifest['_S.js'] = { file: 'assets/s.js' };
    manifest['_D.js'] = { file: 'assets/d.js', imports: ['_S.js'] };
    const result = computeBudget(
      manifest,
      sizesOf({ 'assets/sw-chunk.js': 1, 'assets/s.js': 1, 'assets/d.js': 1 }),
    );
    expect(result.errors).toEqual([]);
    const files = filesOf(result);
    expect(files).toEqual(expect.arrayContaining(['assets/s.js', 'assets/d.js']));
    expect(files).not.toContain('assets/sw-chunk.js');
  });

  it('AD-18 sw.ts statically imported by a counted chunk is counted with its css and imports', () => {
    const manifest = baseManifest();
    manifest['index.html'].imports = ['_a.js'];
    manifest['_a.js'] = { file: 'assets/a.js', imports: [SW_KEY] };
    manifest[SW_KEY] = { file: 'assets/sw-chunk.js', css: ['assets/sw.css'], imports: ['_x.js'] };
    manifest['_x.js'] = { file: 'assets/x.js' };
    const result = computeBudget(
      manifest,
      sizesOf({
        'assets/a.js': 1,
        'assets/sw-chunk.js': 1,
        'assets/sw.css': 1,
        'assets/x.js': 1,
      }),
    );
    expect(result.errors).toEqual([]);
    const files = filesOf(result);
    expect(files).toEqual(
      expect.arrayContaining(['assets/sw-chunk.js', 'assets/sw.css', 'assets/x.js']),
    );
  });

  it('AD-18 a dangling src/shell/sw.ts key throws', () => {
    const manifest = baseManifest();
    manifest['index.html'].dynamicImports = [SW_KEY];
    expect(() => computeBudget(manifest, sizesOf())).toThrow(SW_KEY);
  });

  it('AD-18 a dangling chunk imported only by sw.ts throws', () => {
    const manifest = baseManifest();
    manifest['index.html'].dynamicImports = [SW_KEY];
    manifest[SW_KEY] = { file: 'assets/sw-chunk.js', imports: ['_gone.js'] };
    expect(() => computeBudget(manifest, sizesOf({ 'assets/sw-chunk.js': 1 }))).toThrow('_gone.js');
  });
});

describe('AD-16 precache file limit', () => {
  it('AD-16 raw 4,000,000 passes and 4,000,001 fails', () => {
    const at = computeBudget(
      baseManifest(),
      sizesOf({ 'icons/x.png': { raw: 4_000_000, gzip: 1 } }),
    );
    expect(at.errors).toEqual([]);
    const over = computeBudget(
      baseManifest(),
      sizesOf({ 'icons/x.png': { raw: 4_000_001, gzip: 1 } }),
    );
    expect(over.errors).toEqual([OVER_4MB('icons/x.png', 4_000_001)]);
  });

  it('AD-16 a precache-glob file outside the manifest over 4 MB fails', () => {
    const result = computeBudget(
      baseManifest(),
      sizesOf({ 'icons/big.png': { raw: 5_000_000, gzip: 1 } }),
    );
    expect(result.errors).toEqual([OVER_4MB('icons/big.png', 5_000_000)]);
    expect(filesOf(result)).not.toContain('icons/big.png');
  });

  it('AD-16 root and nested files match the glob; .map and dot-directory files do not', () => {
    const big = { raw: 4_000_001, gzip: 1 };
    const result = computeBudget(
      baseManifest(),
      sizesOf({
        'x.js': big,
        'icons/x.png': big,
        'assets/index-a.js.map': big,
        '.well-known/x.js': big,
        'assets/.cache/x.js': big,
        'icons/X.PNG': big,
        LICENSE: big,
      }),
    );
    expect(result.errors).toEqual([
      OVER_4MB('icons/x.png', 4_000_001),
      OVER_4MB('x.js', 4_000_001),
    ]);
  });

  it('AD-16 PRECACHE_GLOB and PRECACHE_MAX_BYTES match vite.config.ts', () => {
    expect(PRECACHE_GLOB).toBe('**/*.{js,css,html,txt,woff2,png,svg,webmanifest}');
    expect(PRECACHE_MAX_BYTES).toBe(4_000_000);
    const source = readFileSync(new URL('../vite.config.ts', import.meta.url), 'utf8');
    expect(source).toContain(`globPatterns: ['${PRECACHE_GLOB}']`);
    expect(source).toContain('maximumFileSizeToCacheInBytes: 4_000_000');
  });
});

/**
 * A deterministic word list (32-bit LCG, high bits) built from a few syllables: repetitive enough
 * that gzip level 9 and the default level give different sizes (asserted in the test).
 */
function lcgWords() {
  const syllables = ['qu', 'ab', 'er', 'in', 'on', 'at', 'st', 're', 'ly', 'ing', 'ed', 'es'];
  let state = 1;
  const next = () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state >>> 16;
  };
  const words = [];
  for (let i = 0; i < 5000; i++) {
    let word = '';
    const count = 1 + (next() % 4);
    for (let j = 0; j < count; j++) word += syllables[next() % syllables.length];
    words.push(word);
  }
  return `${words.join('\n')}\n`;
}

describe('size-budget CLI', () => {
  const script = fileURLToPath(new URL('./size-budget.mjs', import.meta.url));
  /** @type {string} */
  let root;

  /**
   * @param {string} dist
   * @param {Record<string, string>} files dist-relative path → content
   */
  function writeDist(dist, files) {
    for (const [path, content] of Object.entries(files)) {
      const full = join(dist, path);
      mkdirSync(dirname(full), { recursive: true });
      writeFileSync(full, content);
    }
  }

  /**
   * @param {Record<string, any>} manifest
   * @returns {Record<string, string>}
   */
  function distFiles(manifest) {
    return {
      '.vite/manifest.json': JSON.stringify(manifest),
      'index.html': '<!doctype html>',
      [ENTRY_JS]: 'export {};',
      [ENTRY_CSS]: 'a{}',
      [FONT]: 'font',
      [DICT]: 'cat\ndog\n',
      'icons/x.png': 'png',
    };
  }

  beforeAll(() => {
    root = mkdtempSync(join(tmpdir(), 'size-budget-'));
    writeDist(join(root, 'pass'), distFiles(baseManifest()));
    const noDict = baseManifest();
    delete noDict[DICT_KEY];
    writeDist(join(root, 'no-dict-key'), distFiles(noDict));
    const noFile = distFiles(baseManifest());
    delete noFile[DICT];
    writeDist(join(root, 'no-dict-file'), noFile);
    const noManifest = distFiles(baseManifest());
    delete noManifest['.vite/manifest.json'];
    writeDist(join(root, 'no-manifest'), noManifest);
    const noIndex = distFiles(baseManifest());
    delete noIndex['index.html'];
    writeDist(join(root, 'no-index'), noIndex);
    writeDist(join(root, 'gzip-level'), { ...distFiles(baseManifest()), [DICT]: lcgWords() });
  });

  afterAll(() => {
    rmSync(root, { recursive: true, force: true });
  });

  /**
   * @param {string[]} args
   * @returns {Promise<{ code: number, stdout: string, stderr: string }>}
   */
  function run(args) {
    return new Promise((done) => {
      execFile(process.execPath, [script, ...args], (error, stdout, stderr) => {
        const code = error === null ? 0 : typeof error.code === 'number' ? error.code : -1;
        done({ code, stdout, stderr });
      });
    });
  }

  it('AD-18 CLI passes, fails and throws per the fixture dist', async () => {
    const [pass, noDictKey, noDictFile, noManifest, noIndex, twoArgs, flag, empty] =
      await Promise.all([
        run([join(root, 'pass')]),
        run([join(root, 'no-dict-key')]),
        run([join(root, 'no-dict-file')]),
        run([join(root, 'no-manifest')]),
        run([join(root, 'no-index')]),
        run([join(root, 'pass'), join(root, 'pass')]),
        run(['--x']),
        run(['']),
      ]);

    expect(pass.code).toBe(0);
    const passFiles = distFiles(baseManifest());
    const counted = [DICT, ENTRY_JS, ENTRY_CSS, FONT, 'index.html'];
    const gzips = counted.map((file) => gzipSync(passFiles[file], { level: 9 }).length);
    const total = gzips.reduce((sum, n) => sum + n, 0);
    expect(pass.stdout).toBe(
      `${counted.map((file, i) => `${file} ${gzips[i]}`).join('\n')}\ntotal ${total} / 600000\n`,
    );
    expect(pass.stdout).not.toContain('icons/x.png');
    expect(pass.stderr).toBe('');

    expect(noDictKey.code).not.toBe(0);
    expect(noDictKey.stdout).toMatch(/^total \d+ \/ 600000$/m);
    expect(noDictKey.stderr).toContain(MISSING_DICT);
    expect(noDictKey.stdout).not.toContain(MISSING_DICT);

    expect(noDictFile.code).not.toBe(0);
    expect(noDictFile.stderr).toContain(DICT);
    expect(noDictFile.stdout).not.toContain('total');

    expect(noManifest.code).not.toBe(0);
    expect(noManifest.stderr).toContain(join(root, 'no-manifest', '.vite', 'manifest.json'));
    expect(noManifest.stdout).not.toContain('total');

    expect(noIndex.code).not.toBe(0);
    expect(noIndex.stderr).toContain(join(root, 'no-index', 'index.html'));
    expect(noIndex.stdout).not.toContain('total');

    for (const bad of [twoArgs, flag, empty]) {
      expect(bad.code).not.toBe(0);
      expect(bad.stderr).toContain('usage');
      expect(bad.stdout).not.toContain('total');
    }
  });

  it('AD-18 CLI sizes the counted files at gzip level 9', async () => {
    const dictionary = lcgWords();
    const level9 = gzipSync(dictionary, { level: 9 }).length;
    expect(gzipSync(dictionary).length).not.toBe(level9);

    const result = await run([join(root, 'gzip-level')]);
    expect(result.code).toBe(0);
    expect(result.stdout.split('\n')).toContain(`${DICT} ${level9}`);
  });
});
