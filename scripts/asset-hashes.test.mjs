// @ts-check
import { createHash } from 'node:crypto';
import { globSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

// AD-16 / AD-18: the committed generated assets and their committed generator inputs match the
// SHA-256s recorded in data/README.md (Font sources → Build hashes, Icon sources). Regeneration
// itself stays a manual check (retro A9): a failure says whether to regenerate or re-record.

const ROOT = new URL('../', import.meta.url);
const readme = readFileSync(new URL('data/README.md', ROOT), 'utf8').split(/\r?\n/);

/**
 * The `- \`<path>\` SHA-256: <hex>` bullets between `heading` and the next heading.
 * @param {string} heading exact heading line
 * @returns {Map<string, string>} path → hex
 */
function recorded(heading) {
  const starts = readme.flatMap((line, i) => (line === heading ? [i] : []));
  expect(starts, heading).toHaveLength(1);
  const start = starts[0];
  const next = readme.findIndex((line, i) => i > start && line.startsWith('#'));
  /** @type {Map<string, string>} */
  const hashes = new Map();
  for (const line of readme.slice(start + 1, next === -1 ? readme.length : next)) {
    const m = /^- `([^`]+)` SHA-256: ([0-9a-f]{64})$/.exec(line);
    if (m === null) continue;
    expect(hashes.has(m[1]), `${m[1]} recorded twice under ${heading}`).toBe(false);
    hashes.set(m[1], m[2]);
  }
  return hashes;
}

/** @param {string} path repo-relative */
function sha256(path) {
  return createHash('sha256')
    .update(readFileSync(new URL(path, ROOT)))
    .digest('hex');
}

/** @param {string[]} patterns repo-relative globs */
function files(patterns) {
  return patterns.flatMap((pattern) => globSync(pattern, { cwd: fileURLToPath(ROOT) })).sort();
}

/**
 * @param {Map<string, string>} hashes
 * @param {{ inputs: string[], outputs: string[] }} globs
 */
function check(hashes, globs) {
  const inputs = files(globs.inputs);
  const outputs = files(globs.outputs);
  expect(
    [...hashes.keys()].sort(),
    'recorded set differs from the files the globs match: regenerate or re-record',
  ).toEqual([...inputs, ...outputs].sort());
  for (const path of inputs) {
    expect(sha256(path), `${path}: input changed: regenerate, then re-record`).toBe(
      hashes.get(path),
    );
  }
  for (const path of outputs) {
    expect(sha256(path), `${path}: output differs: regenerate or re-record`).toBe(hashes.get(path));
  }
}

const FONT = { inputs: ['scripts/build-font.py'], outputs: ['src/ui/assets/*.woff2'] };
const ICONS = {
  inputs: ['scripts/icons/*.svg', 'scripts/build-icons.mjs'],
  outputs: ['public/icons/*.png', 'public/favicon.svg'],
};
const FONT_OUTPUT = 'src/ui/assets/wordcell-serif.woff2';

describe('generated asset hashes', () => {
  it('AD-18 the woff2 and build-font.py match their data/README.md Build hashes', () => {
    check(recorded('### Build hashes'), FONT);
  });

  it('AD-16 the icons, favicon and their inputs match their data/README.md Icon sources hashes', () => {
    check(recorded('## Icon sources'), ICONS);
    // The card font is an icon input too; its hash is recorded once, under Font sources.
    expect(sha256(FONT_OUTPUT), `${FONT_OUTPUT}: input changed: regenerate, then re-record`).toBe(
      recorded('### Build hashes').get(FONT_OUTPUT),
    );
  });
});
