// AD-17 test hook: installed only under `vite dev` and the `build:test` build; read-only accessors
// delegate to the stores (update `e2e/globals.d.ts` in the same change); `history` comes from
// the score-history store through the game store (AD-6); `dictionaryState` from the AD-8 store;
// `swState` from the AD-16 worker-state module (epic 7 F1); `precacheComplete` (epic 7 CAP-2) returns
// the last value `recomputePrecacheComplete` wrote and starts a new recompute on every call, so
// tests poll it; it reads `/sw.js`'s own precache array, never a hand or build-time list.
// Celebration seam (AD-17, AD-19, epic 10 entry 5): `celebration` is the one writable part. The run
// controller lives in `src/ui/`, which shell never imports (AD-1), so main.ts passes it in through
// `registerCelebrationSeam` (hook builds only); until then every method throws (rule 6).
import { type DictionaryState, dictionary } from './dictionary.svelte';
import { type Current, game, type Loaded } from './game.svelte';
import { type SwState, swState } from './sw-state';

/** What main.ts hands over: the controller's `running`, `advance`, `setManual` and the flag setter. */
export type CelebrationSeam = {
  running(): boolean;
  advance(ms: number): void;
  setManual(on: boolean): void;
  setEnabled(on: boolean): void;
};

type CelebrationHook = Readonly<{
  advance(ms: number): void;
  running(): boolean;
  setEnabled(on: boolean): void;
}>;

declare global {
  interface Window {
    __wordcell?: Readonly<{
      loaded(): Loaded;
      current(): Current;
      dictionaryState(): DictionaryState;
      swState(): SwState;
      precacheComplete(): boolean;
      celebration: CelebrationHook;
    }>;
  }
}

let seam: CelebrationSeam | null = null;

const CALL = 'precacheAndRoute(';
// Workbox's precache cache names start with this while vite.config.ts sets no `cacheId`.
const PRECACHE_PREFIX = 'workbox-precache';
const REVISION = '__WB_REVISION__';

// AD-17 precacheComplete: the last written value, the recompute start counter, the number of the
// last written recompute, and the one shared URL promise per page load (kept even when rejected).
let complete = false;
let started = 0;
let written = 0;
let urls: Promise<string[]> | null = null;

// The source slice of the array literal starting at `start` (a `[`): a string-aware bracket-depth
// scan, as `arraySlice` in e2e/helpers/precache.ts (Node-only, not importable here).
function arraySlice(source: string, start: number): string {
  let depth = 0;
  let i = start;
  while (i < source.length) {
    const ch = source[i];
    if (ch === "'" || ch === '"' || ch === '`') {
      i++;
      while (i < source.length && source[i] !== ch) i += source[i] === '\\' ? 2 : 1;
      if (i >= source.length) throw new Error('AD-17 sw.js: unterminated string in precache array');
    } else if (ch === '[') {
      depth++;
    } else if (ch === ']') {
      depth--;
      if (depth === 0) return source.slice(start, i + 1);
    }
    i++;
  }
  throw new Error('AD-17 sw.js: unterminated precache array');
}

/** AD-17: every `url:"…"` of the single `precacheAndRoute([…])` array in the generated `sw.js`. */
export function precacheUrls(source: string): string[] {
  const at = source.indexOf(CALL);
  if (at === -1 || source.indexOf(CALL, at + 1) !== -1) {
    throw new Error(`AD-17 sw.js: expected exactly one ${CALL}`);
  }
  let start = at + CALL.length;
  while (start < source.length && /\s/.test(source[start] ?? '')) start++;
  if (source[start] !== '[') throw new Error(`AD-17 sw.js: ${CALL} argument is not an array`);
  const slice = arraySlice(source, start);
  const found = [...slice.matchAll(/url:"([^"\\]*)"/g)].map((match) => match[1] as string);
  if (found.length === 0) throw new Error('AD-17 sw.js: precache array holds no url:"…" entry');
  // A single-quoted or escaped entry is a `url:` key the match above skipped.
  const keys = slice.match(/url:/g)?.length ?? 0;
  if (keys !== found.length) {
    throw new Error(`AD-17 sw.js: ${keys} url: keys but ${found.length} url:"…" entries`);
  }
  return found;
}

async function fetchUrls(sw: URL): Promise<string[]> {
  const response = await fetch(sw.href);
  if (!response.ok) throw new Error(`AD-17 sw.js: GET ${sw.href} returned ${response.status}`);
  return precacheUrls(await response.text());
}

async function computePrecacheComplete(): Promise<boolean> {
  // F5: no container (insecure context); no worker in dev.
  if (navigator.serviceWorker === undefined) return false;
  const registration = await navigator.serviceWorker.getRegistration();
  if (registration?.active?.state !== 'activated') return false;
  const sw = new URL('/sw.js', location.href);
  urls ??= fetchUrls(sw);
  const list = await urls;
  const cached = new Set<string>();
  for (const name of await caches.keys()) {
    if (!name.startsWith(PRECACHE_PREFIX)) continue;
    for (const request of await (await caches.open(name)).keys()) {
      const url = new URL(request.url);
      url.searchParams.delete(REVISION);
      cached.add(url.href);
    }
  }
  return list.every((url) => cached.has(new URL(url, sw).href));
}

/**
 * AD-17: recomputes `precacheComplete()`; a result writes only if no later-started recompute has
 * written, then it resolves with the stored value. Every failure rejects, never caught (rule 6).
 */
export async function recomputePrecacheComplete(): Promise<boolean> {
  started++;
  const number = started;
  const result = await computePrecacheComplete();
  if (number > written) {
    written = number;
    complete = result;
  }
  return complete;
}

/** AD-17: main.ts, once, in hook builds; a second call throws. */
export function registerCelebrationSeam(next: CelebrationSeam): void {
  if (seam !== null) throw new Error('AD-17 registerCelebrationSeam() called twice');
  seam = next;
}

function registered(op: string): CelebrationSeam {
  if (seam === null) throw new Error(`AD-17 celebration.${op}() before the seam is registered`);
  return seam;
}

// `setEnabled` always sets the manual clock with the flag, so a run the hook can see runs on the
// manual clock; the controller's silent `advance` on a real-rAF run is unreachable here (AD-17
// Celebration seam).
if (import.meta.env.DEV || import.meta.env.VITE_TEST_HOOKS === '1') {
  window.__wordcell = Object.freeze({
    loaded: () => game.loaded(),
    current: () => game.current(),
    dictionaryState: () => dictionary.state,
    swState: () => swState(),
    precacheComplete: () => {
      void recomputePrecacheComplete();
      return complete;
    },
    celebration: Object.freeze({
      advance: (ms: number) => {
        const current = registered('advance');
        if (!current.running()) throw new Error('AD-17 celebration.advance() while not running');
        current.advance(ms);
      },
      running: () => registered('running').running(),
      setEnabled: (on: boolean) => {
        const current = registered('setEnabled');
        if (current.running()) throw new Error('AD-17 celebration.setEnabled() while running');
        current.setEnabled(on);
        current.setManual(on);
      },
    }),
  });
}
