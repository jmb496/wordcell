// @ts-check
// Epic 6 CAP-2 (ticket 6.2): the `__APP_VERSION__` string, `<package.json version> (<7-char git
// SHA>)`. A non-empty `WORDCELL_APP_VERSION` is used trimmed and git is never consulted; unset runs
// `git rev-parse --short=7 HEAD`. A blank override, or a git failure, throws in every Vite mode
// (rule 6); there is no dirty-tree suffix. vite.config.ts calls `resolveAppVersion` with the real
// environment, package.json and git.
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

/**
 * @param {{ env: Record<string, string | undefined>, packageVersion: string, git: () => string }} deps
 * @returns {string}
 */
export function resolveAppVersion({ env, packageVersion, git }) {
  const override = env.WORDCELL_APP_VERSION;
  if (override !== undefined) {
    if (override.trim() === '') {
      throw new Error('app-version: WORDCELL_APP_VERSION is set but blank');
    }
    return override.trim();
  }
  const sha = git().trim();
  if (!/^[0-9a-f]{7}$/.test(sha)) {
    throw new Error(`app-version: git returned "${sha}", not a 7-character SHA`);
  }
  return `${packageVersion} (${sha})`;
}

/** The real `git rev-parse --short=7 HEAD`; throws when git fails. */
export function gitShortSha() {
  return execFileSync('git', ['rev-parse', '--short=7', 'HEAD'], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
}

/** The version for this checkout (vite.config.ts). */
export function appVersion() {
  const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
  return resolveAppVersion({
    env: process.env,
    packageVersion: pkg.version,
    git: gitShortSha,
  });
}
