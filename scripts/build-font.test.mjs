// @ts-check
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

// AD-18 Font: build-font.py's pinned source constants stay in step with data/README.md and the
// committed licence copy. The script itself is never run here (A-A5).

const script = readFileSync(new URL('./build-font.py', import.meta.url), 'utf8');
const readme = readFileSync(new URL('../data/README.md', import.meta.url), 'utf8').split(/\r?\n/);

/** @param {string} name */
function shaConstant(name) {
  const matches = [...script.matchAll(new RegExp(`^${name} = "([0-9a-f]{64})"$`, 'gm'))];
  expect(matches).toHaveLength(1);
  return matches[0][1];
}

/** @param {string} name */
function urlConstant(name) {
  const matches = [
    ...script.matchAll(
      new RegExp(`^${name} = "(https://raw\\.githubusercontent\\.com/[^"\\s]+)"$`, 'gm'),
    ),
  ];
  expect(matches).toHaveLength(1);
  return matches[0][1];
}

/** @param {string} prefix */
function bullet(prefix) {
  const starts = readme.flatMap((line, i) => (line.startsWith(prefix) ? [i] : []));
  expect(starts).toHaveLength(1);
  const start = starts[0];
  const next = readme.findIndex((line, i) => i > start && /^(- |#)/.test(line));
  const span = readme.slice(start, next === -1 ? readme.length : next);
  const shas = span.flatMap((line) => {
    const m = /^[ \t]+SHA-256: ([0-9a-f]{64})$/.exec(line);
    return m ? [m[1]] : [];
  });
  const urls = span.flatMap((line) => {
    const m = /^[ \t]+(https:\/\/raw\.githubusercontent\.com\/\S+)$/.exec(line);
    return m ? [m[1]] : [];
  });
  expect(shas).toHaveLength(1);
  expect(urls).toHaveLength(1);
  return { sha: shas[0], url: urls[0] };
}

describe('build-font sources', () => {
  it('AD-18 build-font.py source SHA-256s and URLs match their data/README.md bullets', () => {
    expect(bullet('- `Fraunces[SOFT,WONK,opsz,wght].ttf` ')).toEqual({
      sha: shaConstant('TTF_SHA256'),
      url: urlConstant('TTF_URL'),
    });
    expect(bullet('- `OFL.txt` ')).toEqual({
      sha: shaConstant('OFL_SHA256'),
      url: urlConstant('OFL_URL'),
    });
  });

  it('AD-18 committed src/ui/assets/OFL.txt matches OFL_SHA256', () => {
    const buffer = readFileSync(new URL('../src/ui/assets/OFL.txt', import.meta.url));
    expect(createHash('sha256').update(buffer).digest('hex')).toBe(shaConstant('OFL_SHA256'));
  });
});
