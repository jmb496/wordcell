// @ts-check
import { describe, expect, it } from 'vitest';
import { resolveAppVersion } from './app-version.mjs';

const never = () => {
  throw new Error('git must not be consulted');
};

describe('AD-18 app version resolver', () => {
  it('AD-18 unset override gives "<version> (<7-char sha>)" from git', () => {
    expect(resolveAppVersion({ env: {}, packageVersion: '0.0.0', git: () => 'abc1234\n' })).toBe(
      '0.0.0 (abc1234)',
    );
  });

  it('AD-18 a non-empty override is used trimmed and git is never consulted', () => {
    expect(
      resolveAppVersion({
        env: { WORDCELL_APP_VERSION: ' 9.9.9 (fixed) ' },
        packageVersion: '0.0.0',
        git: never,
      }),
    ).toBe('9.9.9 (fixed)');
  });

  it('AD-18 a blank or whitespace override throws', () => {
    for (const value of ['', '   ']) {
      expect(() =>
        resolveAppVersion({
          env: { WORDCELL_APP_VERSION: value },
          packageVersion: '0.0.0',
          git: never,
        }),
      ).toThrow('WORDCELL_APP_VERSION');
    }
  });

  it('AD-18 a failing git throws with no override', () => {
    expect(() => resolveAppVersion({ env: {}, packageVersion: '0.0.0', git: never })).toThrow(
      'git must not be consulted',
    );
  });

  it('AD-18 git output that is not a 7-char SHA throws', () => {
    expect(() => resolveAppVersion({ env: {}, packageVersion: '0.0.0', git: () => '' })).toThrow(
      '7-character',
    );
  });
});
