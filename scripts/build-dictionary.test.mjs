// @ts-check
import { execFileSync } from 'node:child_process';
import { readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
  EXPECTED_SHA256,
  filterWords,
  isStale,
  parseArgs,
  sha256,
  verifySource,
} from './build-dictionary.mjs';

describe('filterWords', () => {
  it('AD-8 drops 2- and 24-letter words, keeps 3 and 23', () => {
    const w23 = 'a'.repeat(23);
    const w24 = 'b'.repeat(24);
    expect(filterWords(`ab\ncat\n${w23}\n${w24}\n`)).toBe(`cat\n${w23}\n`);
  });

  it('AD-8 drops words with non a–z characters', () => {
    expect(filterWords("cat\ndo-g\nit's\ncafé\nab1c\nfox\n")).toBe('cat\nfox\n');
  });

  it('AD-8 drops uppercase, space-padded, CR-bearing and empty lines', () => {
    expect(filterWords('Cat\nDOG\n cow\npig \nhen\r\n\n\nowl\n')).toBe('owl\n');
  });

  it('AD-8 keeps source order', () => {
    expect(filterWords('zoo\napple\nmid\n')).toBe('zoo\napple\nmid\n');
  });

  it('AD-8 joins with LF and ends with one trailing newline', () => {
    expect(filterWords('cat\ndog\n')).toBe('cat\ndog\n');
  });

  it('AD-8 adds the trailing newline when the source lacks a final LF', () => {
    expect(filterWords('cat\ndog')).toBe('cat\ndog\n');
  });

  it('AD-8 a source with no matches gives an empty string', () => {
    expect(filterWords('ab\nX\n\n')).toBe('');
    expect(filterWords('')).toBe('');
  });
});

describe('parseArgs', () => {
  it('AD-8 accepts no arguments', () => {
    expect(parseArgs([])).toEqual({ force: false, source: null });
  });

  it('AD-8 accepts --force', () => {
    expect(parseArgs(['--force'])).toEqual({ force: true, source: null });
  });

  it('AD-8 accepts --source <value> without resolving it', () => {
    expect(parseArgs(['--source', 'x'])).toEqual({ force: false, source: 'x' });
  });

  it('AD-8 accepts --force with --source <value>', () => {
    expect(parseArgs(['--force', '--source', 'x'])).toEqual({ force: true, source: 'x' });
  });

  it('AD-8 throws on an unknown token', () => {
    expect(() => parseArgs(['--verbose'])).toThrow();
  });

  it('AD-8 throws on --source=x', () => {
    expect(() => parseArgs(['--source=x'])).toThrow();
  });

  it('AD-8 throws on a repeated --force', () => {
    expect(() => parseArgs(['--force', '--force'])).toThrow();
  });

  it('AD-8 throws on a repeated --source', () => {
    expect(() => parseArgs(['--source', 'a', '--source', 'b'])).toThrow();
  });

  it('AD-8 throws on a missing --source value', () => {
    expect(() => parseArgs(['--source'])).toThrow();
  });

  it('AD-8 throws on a --source value starting with --', () => {
    expect(() => parseArgs(['--source', '--force'])).toThrow();
  });

  it('AD-8 throws on an empty --source value', () => {
    expect(() => parseArgs(['--source', ''])).toThrow();
  });
});

describe('checksum', () => {
  it('AD-8 sha256 returns lowercase hex', () => {
    expect(sha256(Buffer.from('abc'))).toBe(
      'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad',
    );
  });

  it('AD-8 committed source matches the expected SHA-256', () => {
    const buffer = readFileSync(new URL('../data/enable1.txt', import.meta.url));
    expect(sha256(buffer)).toBe(EXPECTED_SHA256);
    expect(() => verifySource(buffer, EXPECTED_SHA256)).not.toThrow();
  });

  it('AD-8 verifySource throws on a buffer with one byte flipped', () => {
    const good = Buffer.from('cat\ndog\n');
    const hash = sha256(good);
    expect(() => verifySource(good, hash)).not.toThrow();
    const bad = Buffer.from(good);
    bad[0] ^= 0x01;
    expect(() => verifySource(bad, hash)).toThrow();
  });

  it('AD-8 data/README.md enable1.txt bullet carries the expected SHA-256', () => {
    const lines = readFileSync(new URL('../data/README.md', import.meta.url), 'utf8').split(
      /\r?\n/,
    );
    const starts = lines.flatMap((line, i) => (line.startsWith('- `enable1.txt` ') ? [i] : []));
    expect(starts).toHaveLength(1);
    const start = starts[0];
    const next = lines.findIndex((line, i) => i > start && /^- /.test(line));
    const span = lines.slice(start, next === -1 ? lines.length : next);
    const matches = span.flatMap((line) => {
      const m = /^[ \t]+SHA-256: ([0-9a-f]{64})$/.exec(line);
      return m ? [m[1]] : [];
    });
    expect(matches).toEqual([EXPECTED_SHA256]);
  });
});

describe('isStale', () => {
  it('AD-8 a missing output is stale', () => {
    expect(isStale(null, [100])).toBe(true);
  });

  it('AD-8 an output older than its input is stale', () => {
    expect(isStale(99, [100])).toBe(true);
  });

  it('AD-8 an output equal to its input is fresh', () => {
    expect(isStale(100, [100])).toBe(false);
  });

  it('AD-8 an output newer than its input is fresh', () => {
    expect(isStale(101, [100])).toBe(false);
  });

  it('AD-8 an output between two inputs is stale in both input orders', () => {
    expect(isStale(150, [100, 200])).toBe(true);
    expect(isStale(150, [200, 100])).toBe(true);
  });

  it('AD-8 an output equal to the larger of two inputs is fresh', () => {
    expect(isStale(200, [100, 200])).toBe(false);
    expect(isStale(200, [200, 100])).toBe(false);
  });

  it('AD-8 empty inputs throw whatever the output mtime', () => {
    expect(() => isStale(null, [])).toThrow();
    expect(() => isStale(0, [])).toThrow();
    expect(() => isStale(100, [])).toThrow();
  });
});

describe('CLI', () => {
  it('AD-8 a checksum mismatch exits non-zero and leaves the output untouched, with and without --force', () => {
    const script = fileURLToPath(new URL('./build-dictionary.mjs', import.meta.url));
    const dir = fileURLToPath(new URL('../generated/dictionary/', import.meta.url));
    const out = join(dir, 'en.txt');
    const before = { mtime: statSync(out).mtimeMs, hash: sha256(readFileSync(out)) };
    const source = join(tmpdir(), `wordcell-bad-source-${process.pid}.txt`);
    writeFileSync(source, 'cat\ndog\n');
    try {
      for (const args of [
        ['--source', source],
        ['--force', '--source', source],
      ]) {
        expect(() =>
          execFileSync(process.execPath, [script, ...args], { stdio: 'pipe' }),
        ).toThrow();
      }
    } finally {
      rmSync(source);
    }
    expect({ mtime: statSync(out).mtimeMs, hash: sha256(readFileSync(out)) }).toEqual(before);
    expect(readdirSync(dir).filter((name) => /^en\.txt\..*\.tmp$/.test(name))).toEqual([]);
  });
});
