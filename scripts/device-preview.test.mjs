// @ts-check
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { hintLines, parseArgs, seedPage, tailnetUrl } from './device-preview.mjs';

/**
 * The value the seed page stores under `key`, parsed, or null when it stores nothing there.
 * @param {string} page
 * @param {string} key
 */
function stored(page, key) {
  const match = new RegExp(
    `localStorage\\.setItem\\(${JSON.stringify(key)}, (".*?(?<!\\\\)")\\);`,
  ).exec(page);
  return match === null ? null : { value: JSON.parse(/** @type {string} */ (match[1])) };
}

describe('AD-17 device preview helpers', () => {
  it('AD-17 seedPage stores the fixture as wordcell:session and opens the app', () => {
    const json = readFileSync('fixtures/session-won-words.json', 'utf8');
    const page = seedPage({ sessionJson: json });
    const session = /localStorage\.setItem\("wordcell:session", (".*?(?<!\\)")\);/.exec(page);
    expect(session).not.toBeNull();
    expect(JSON.parse(JSON.parse(/** @type {string[]} */ (session)[1]))).toEqual(JSON.parse(json));
    expect(page).toContain('unregister()');
    expect(page).toContain("location.replace('/')");
    expect(page).not.toContain('wordcell:history');
  });

  it('AD-17 seedPage throws on a fixture that is not JSON', () => {
    expect(() => seedPage({ sessionJson: '{not json' })).toThrow();
  });

  it('AD-17 seedPage history-only stores wordcell:history as "null" and no wordcell:session', () => {
    const json = readFileSync('fixtures/history-invalid-null.json', 'utf8');
    const page = seedPage({ historyJson: json });
    expect(stored(page, 'wordcell:history')).toEqual({ value: 'null' });
    expect(stored(page, 'wordcell:session')).toBeNull();
    expect(page).not.toContain('wordcell:session');
    expect(page).toContain('unregister()');
    expect(page).toContain("location.replace('/')");
    expect(page.indexOf('unregister()')).toBeLessThan(page.indexOf('localStorage.setItem'));
    expect(page.lastIndexOf('localStorage.setItem')).toBeLessThan(
      page.indexOf("location.replace('/')"),
    );
  });

  it('AD-17 seedPage with session and history stores both', () => {
    const sessionJson = readFileSync('fixtures/session-won-words.json', 'utf8');
    const historyJson = readFileSync('fixtures/history-three-records.json', 'utf8');
    const page = seedPage({ sessionJson, historyJson });
    expect(
      JSON.parse(/** @type {{ value: string }} */ (stored(page, 'wordcell:session')).value),
    ).toEqual(JSON.parse(sessionJson));
    expect(
      JSON.parse(/** @type {{ value: string }} */ (stored(page, 'wordcell:history')).value),
    ).toEqual(JSON.parse(historyJson));
    expect(page.indexOf('unregister()')).toBeLessThan(page.indexOf('localStorage.setItem'));
    expect(page.lastIndexOf('localStorage.setItem')).toBeLessThan(
      page.indexOf("location.replace('/')"),
    );
  });

  it('AD-17 seedPage throws without any fixture', () => {
    expect(() => seedPage({})).toThrow();
  });

  it('AD-17 seedPage throws on an empty historyJson (an empty file is not absent)', () => {
    expect(() => seedPage({ historyJson: '' })).toThrow();
    const sessionJson = readFileSync('fixtures/session-won-words.json', 'utf8');
    expect(() => seedPage({ sessionJson, historyJson: '' })).toThrow();
  });

  it('AD-17 seedPage rejects a bare string (no string overload)', () => {
    const json = readFileSync('fixtures/session-won-words.json', 'utf8');
    expect(() => seedPage(/** @type {any} */ (json))).toThrow();
  });

  it('AD-17 tailnetUrl drops the trailing dot of Self.DNSName', () => {
    const status = JSON.stringify({ Self: { DNSName: 'desk.tail0.ts.net.' } });
    expect(tailnetUrl(status)).toBe('https://desk.tail0.ts.net');
  });

  it('AD-17 tailnetUrl throws without Self.DNSName', () => {
    expect(() => tailnetUrl('{}')).toThrow(/DNSName/);
  });
});

describe('AD-17 device preview parseArgs', () => {
  it('AD-17 parseArgs with no args builds with no fixture', () => {
    expect(parseArgs([])).toEqual({ session: undefined, history: undefined, build: true });
  });

  it('AD-17 parseArgs with a session positional alone gives no history', () => {
    expect(parseArgs(['session-x'])).toEqual({
      session: 'session-x',
      history: undefined,
      build: true,
    });
  });

  it('AD-17 parseArgs with --history alone gives no session', () => {
    expect(parseArgs(['--history', 'history-x'])).toEqual({
      session: undefined,
      history: 'history-x',
      build: true,
    });
  });

  it('AD-17 parseArgs takes session and history in either order', () => {
    const both = { session: 'session-x', history: 'history-y', build: true };
    expect(parseArgs(['session-x', '--history', 'history-y'])).toEqual(both);
    expect(parseArgs(['--history', 'history-y', 'session-x'])).toEqual(both);
  });

  it('AD-17 parseArgs --no-build in any position, repeated or not, gives build false', () => {
    const args = ['session-x', '--history', 'history-y'];
    const expected = { session: 'session-x', history: 'history-y', build: false };
    expect(parseArgs(['--no-build', ...args])).toEqual(expected);
    expect(parseArgs(['session-x', '--no-build', '--history', 'history-y'])).toEqual(expected);
    expect(parseArgs([...args, '--no-build'])).toEqual(expected);
    expect(parseArgs(['--no-build', '--no-build'])).toEqual({
      session: undefined,
      history: undefined,
      build: false,
    });
  });

  it.each([
    ['--history without a value', ['--history']],
    ['--history with a --no-build value', ['--history', '--no-build']],
    ['--history with a --prefixed value', ['--history', '--other']],
    ['a repeated --history', ['--history', 'history-x', '--history', 'history-y']],
    ['a second positional', ['session-x', 'session-y']],
    ['an unknown flag', ['--seed']],
    ['a positional not starting session-', ['won-words']],
    ['a history- positional', ['history-x']],
    ['a --history value not starting history-', ['--history', 'invalid-null']],
    ['a session- --history value', ['--history', 'session-x']],
  ])('AD-17 parseArgs throws a usage error on %s', (_, argv) => {
    expect(() => parseArgs(argv)).toThrow(/usage/);
  });
});

describe('AD-17 device preview hintLines', () => {
  const url = 'https://desk.tail0.ts.net';

  it('AD-17 hintLines for a seed run points at /seed.html and says clear site data', () => {
    expect(hintLines(url, parseArgs(['--history', 'history-x']))).toEqual([
      'On the phone (Tailscale connected): https://desk.tail0.ts.net/seed.html',
      "Seed, re-seed or fresh install: clear this origin's site data on the phone first.",
      'Ctrl+C stops.',
    ]);
    expect(hintLines(url, parseArgs(['session-x']))[0]).toBe(
      'On the phone (Tailscale connected): https://desk.tail0.ts.net/seed.html',
    );
  });

  it('AD-17 hintLines for a no-fixture run points at / with the fresh-install and update lines', () => {
    expect(hintLines(url, parseArgs([]))).toEqual([
      'On the phone (Tailscale connected): https://desk.tail0.ts.net/',
      'Fresh install: clear site data first.',
      'Update read (G3): keep site data.',
      'Ctrl+C stops.',
    ]);
  });
});
