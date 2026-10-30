import { runInNewContext } from 'node:vm';
import type { APIRequestContext, Page } from '@playwright/test';

export type PrecacheEntry = { url: string; revision: string | null };

const CALL = 'precacheAndRoute(';

// Returns the source slice of the array literal starting at `start` (which must be `[`).
function arraySlice(source: string, start: number): string {
  let depth = 0;
  let i = start;
  while (i < source.length) {
    const ch = source[i];
    if (ch === "'" || ch === '"' || ch === '`') {
      i++;
      while (i < source.length && source[i] !== ch) i += source[i] === '\\' ? 2 : 1;
      if (i >= source.length) throw new Error('sw.js: unterminated string in precache manifest');
    } else if (ch === '[') {
      depth++;
    } else if (ch === ']') {
      depth--;
      if (depth === 0) return source.slice(start, i + 1);
    }
    i++;
  }
  throw new Error('sw.js: unterminated precache manifest array');
}

// AD-8: reads the Workbox precache manifest from vite-plugin-pwa `generateSW` output.
export async function readPrecacheManifest(request: APIRequestContext): Promise<PrecacheEntry[]> {
  const response = await request.get('/sw.js');
  if (!response.ok()) {
    throw new Error(`sw.js: GET ${response.url()} returned ${response.status()}`);
  }
  const source = await response.text();
  const at = source.indexOf(CALL);
  if (at === -1 || source.indexOf(CALL, at + 1) !== -1) {
    throw new Error(`sw.js: expected exactly one ${CALL}`);
  }
  let start = at + CALL.length;
  while (start < source.length && /\s/.test(source[start] ?? '')) start++;
  if (source[start] !== '[') throw new Error(`sw.js: ${CALL} argument is not an array literal`);
  const value: unknown = runInNewContext(`(${arraySlice(source, start)})`);
  if (!Array.isArray(value) || value.length === 0) {
    throw new Error('sw.js: precache manifest is not a non-empty array');
  }
  return value.map((entry: unknown) => {
    const { url, revision } = (entry ?? {}) as { url?: unknown; revision?: unknown };
    if (typeof url !== 'string' || (typeof revision !== 'string' && revision !== null)) {
      throw new Error(`sw.js: malformed precache entry ${JSON.stringify(entry)}`);
    }
    return { url, revision };
  });
}

// Epic 7 CAP-2: the page-side check, with `precacheComplete()`'s comparison (src/shell/test-hook.ts):
// the entries of `urls` that, resolved against the absolute `/sw.js` URL, equal no request key of a
// `workbox-precache*` cache once `__WB_REVISION__` is stripped (union over those caches).
export function precacheMissing(page: Page, urls: readonly string[]): Promise<string[]> {
  return page.evaluate(
    async (list) => {
      const sw = new URL('/sw.js', location.href);
      const cached = new Set<string>();
      for (const name of await caches.keys()) {
        if (!name.startsWith('workbox-precache')) continue;
        for (const request of await (await caches.open(name)).keys()) {
          const url = new URL(request.url);
          url.searchParams.delete('__WB_REVISION__');
          cached.add(url.href);
        }
      }
      return list.filter((url) => !cached.has(new URL(url, sw).href));
    },
    [...urls],
  );
}
