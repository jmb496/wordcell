// AD-8 dictionary store: the hashed word-list URL, the load states, the word Set, retry and the
// banner visibility. main.ts starts `load()` after first paint (AD-16); the game store passes
// `words` as `ctx.dictionary` only while `state` is 'ready'.
import url from '../../generated/dictionary/en.txt?url';

export const dictionaryUrl = url;

export type DictionaryState = 'loading' | 'ready' | 'failed';

const TIMEOUT_MS = 30_000;

let state = $state<DictionaryState>('loading');
// Q-42 (owner decision 2026-10-01): under a controlling service worker a retry after a 404 keeps
// the banner shown while it runs.
let keepBanner = $state(false);
let words: ReadonlySet<string> | undefined;
let started = false;
// AD-8: set by a 404 at any fetch; the next Reload reloads the page unless a service worker controls it.
let reloadOnNextRetry = false;

// One attempt: fetch plus body under one 30 s timeout (a `setTimeout` calling `abort()`, never
// `AbortSignal.timeout`). Both awaits race the abort, so a stalled stream still fails at 30 s;
// only these AD-8 outcomes are caught.
async function attempt(): Promise<void> {
  const controller = new AbortController();
  const { signal } = controller;
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  const aborted = new Promise<never>((_, reject) => {
    signal.addEventListener('abort', () => reject(new Error('AD-8 dictionary timed out')), {
      once: true,
    });
  });
  aborted.catch(() => {});
  try {
    let response: Response;
    try {
      response = await Promise.race([fetch(dictionaryUrl, { signal }), aborted]);
    } catch {
      state = 'failed';
      return;
    }
    if (!response.ok) {
      if (response.status === 404) reloadOnNextRetry = true;
      state = 'failed';
      return;
    }
    const body = response.text();
    body.catch(() => {});
    let content: string;
    try {
      content = await Promise.race([body, aborted]);
    } catch {
      state = 'failed';
      return;
    }
    const list = content.split('\n').filter((word) => word !== '');
    if (list.length === 0) {
      state = 'failed';
      return;
    }
    words = new Set(list);
    state = 'ready';
  } finally {
    clearTimeout(timer);
    keepBanner = false;
  }
}

function load(): Promise<void> {
  if (started) throw new Error('AD-8 load() called twice');
  started = true;
  return attempt();
}

function retry(): Promise<void> {
  if (state !== 'failed') throw new Error(`AD-8 retry() while ${state}`);
  if (reloadOnNextRetry && !navigator.serviceWorker?.controller) {
    location.reload();
    return Promise.resolve();
  }
  keepBanner = reloadOnNextRetry;
  state = 'loading';
  return attempt();
}

export const dictionary = {
  get state(): DictionaryState {
    return state;
  },
  get words(): ReadonlySet<string> | undefined {
    return words;
  },
  get showBanner(): boolean {
    return state === 'failed' || keepBanner;
  },
  load,
  retry,
};
