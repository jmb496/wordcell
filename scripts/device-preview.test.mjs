// @ts-check
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { seedPage, tailnetUrl } from './device-preview.mjs';

describe('AD-17 device preview helpers', () => {
  it('AD-17 seedPage stores the fixture as wordcell:session and opens the app', () => {
    const json = readFileSync('fixtures/session-won-words.json', 'utf8');
    const page = seedPage(json);
    const stored = /localStorage\.setItem\("wordcell:session", (".*?(?<!\\)")\);/.exec(page);
    expect(stored).not.toBeNull();
    expect(JSON.parse(JSON.parse(/** @type {string[]} */ (stored)[1]))).toEqual(JSON.parse(json));
    expect(page).toContain('unregister()');
    expect(page).toContain("location.replace('/')");
  });

  it('AD-17 seedPage throws on a fixture that is not JSON', () => {
    expect(() => seedPage('{not json')).toThrow();
  });

  it('AD-17 tailnetUrl drops the trailing dot of Self.DNSName', () => {
    const status = JSON.stringify({ Self: { DNSName: 'desk.tail0.ts.net.' } });
    expect(tailnetUrl(status)).toBe('https://desk.tail0.ts.net');
  });

  it('AD-17 tailnetUrl throws without Self.DNSName', () => {
    expect(() => tailnetUrl('{}')).toThrow(/DNSName/);
  });
});
