import { describe, expect, it, vi } from 'vitest';

// Ticket 6.6 AD-13 end-sheet entry: the wiring of DispatchResult to the real overlays store, with
// nav and the game store stubbed.
const calls: string[] = [];
const outcomes: string[] = [];
const store: { view: { status: string } | undefined } = { view: undefined };

vi.mock('../shell/nav', () => ({
  nav: { push: () => calls.push('push'), pop: () => calls.push('pop') },
}));
vi.mock('./announce', () => ({ announceOutcome: () => outcomes.push('outcome') }));
vi.mock('./focus-board', () => ({ focusBoard: () => calls.push('focusBoard') }));
vi.mock('../shell/game.svelte', () => ({
  game: {
    get view() {
      return store.view;
    },
  },
}));

async function load(status?: string) {
  vi.resetModules();
  calls.length = 0;
  outcomes.length = 0;
  store.view = status === undefined ? undefined : { status };
  const { overlays } = await import('./overlays.svelte');
  const sheet = await import('./end-sheet');
  return { overlays, ...sheet };
}

const settleNow = (callback: () => void) => callback();

describe('AD-13 end sheet entry', () => {
  it('AD-13 a win defers: nothing opens until the animation settles, then one push expanded', async () => {
    const { overlays, onDispatched } = await load('won');
    const pending: (() => void)[] = [];
    onDispatched({ changed: true, finished: 'won' }, (cb) => pending.push(cb));
    expect(overlays.endSheet).toBe('hidden');
    expect(calls).toEqual([]);
    pending[0]?.();
    expect(overlays.endSheet).toBe('expanded');
    expect(calls).toEqual(['push']);
  });

  it('AD-13 the token callback with the store no longer won pushes nothing', async () => {
    const { overlays, onDispatched } = await load('won');
    const pending: (() => void)[] = [];
    onDispatched({ changed: true, finished: 'won' }, (cb) => pending.push(cb));
    store.view = { status: 'playing' };
    pending[0]?.();
    expect(overlays.endSheet).toBe('hidden');
    expect(calls).toEqual([]);
  });

  it('AD-13 a killed token (resetForNewSession) pushes nothing when the callback runs', async () => {
    const { overlays, onDispatched } = await load('won');
    const pending: (() => void)[] = [];
    onDispatched({ changed: true, finished: 'won' }, (cb) => pending.push(cb));
    overlays.resetForNewSession();
    pending[0]?.();
    expect(overlays.endSheet).toBe('hidden');
    expect(calls).toEqual([]);
  });

  it('AD-13 a Give up opens at once, one push', async () => {
    const { overlays, onDispatched } = await load('gaveUp');
    onDispatched({ changed: true, finished: 'gaveUp' }, settleNow);
    expect(overlays.endSheet).toBe('expanded');
    expect(calls).toEqual(['push']);
  });

  it('AD-13 a win with a sticky WordCell view open closes the view first, then pushes once', async () => {
    const { overlays, onDispatched } = await load('won');
    overlays.openView(6);
    calls.length = 0;
    onDispatched({ changed: true, finished: 'won' }, settleNow);
    expect(overlays.viewCell).toBeNull();
    expect(calls).toEqual(['pop', 'push']);
    expect(overlays.top).toBe('endSheet');
  });

  it('AD-13 unfinished: expanded pops its entry then hides; collapsed hides with no pop', async () => {
    const { overlays, onDispatched } = await load('gaveUp');
    onDispatched({ changed: true, finished: 'gaveUp' }, settleNow);
    calls.length = 0;
    store.view = { status: 'playing' };
    onDispatched({ changed: true, unfinished: true }, settleNow);
    expect(overlays.endSheet).toBe('hidden');
    expect(calls).toEqual(['pop']);
    store.view = { status: 'gaveUp' };
    onDispatched({ changed: true, finished: 'gaveUp' }, settleNow);
    overlays.collapseEndSheet();
    calls.length = 0;
    onDispatched({ changed: true, unfinished: true }, settleNow);
    expect(overlays.endSheet).toBe('hidden');
    expect(calls).toEqual([]);
  });

  it('AD-3 the outcome is announced only when the sheet really opens: a win after settle, a Give up at once, never an Undo-cancelled win, boot or expand', async () => {
    const { onDispatched } = await load('won');
    const pending: (() => void)[] = [];
    onDispatched({ changed: true, finished: 'won' }, (cb) => pending.push(cb));
    expect(outcomes).toEqual([]);
    pending[0]?.();
    expect(outcomes).toEqual(['outcome']);

    const cancelled = await load('won');
    const later: (() => void)[] = [];
    cancelled.onDispatched({ changed: true, finished: 'won' }, (cb) => later.push(cb));
    cancelled.overlays.cancelEndSheetOpen();
    later[0]?.();
    expect(outcomes).toEqual([]);

    const gave = await load('gaveUp');
    gave.onDispatched({ changed: true, finished: 'gaveUp' }, settleNow);
    expect(outcomes).toEqual(['outcome']);
    gave.overlays.collapseEndSheet();
    gave.overlays.expandEndSheet();
    expect(outcomes).toEqual(['outcome']);

    const boot = await load('gaveUp');
    boot.openAtBoot();
    expect(outcomes).toEqual([]);
  });

  it('AD-13 unfinished with a win pending cancels the open', async () => {
    const { overlays, onDispatched } = await load('won');
    const pending: (() => void)[] = [];
    onDispatched({ changed: true, finished: 'won' }, (cb) => pending.push(cb));
    onDispatched({ changed: true, unfinished: true }, settleNow);
    pending[0]?.();
    expect(overlays.endSheet).toBe('hidden');
  });

  it('AD-13 a result with neither flag changes nothing', async () => {
    const { overlays, onDispatched } = await load('playing');
    onDispatched({ changed: true }, settleNow);
    expect(overlays.endSheet).toBe('hidden');
    expect(calls).toEqual([]);
  });

  it('AD-16 openAtBoot opens expanded for won and gaveUp, not for playing or no view', async () => {
    for (const status of ['won', 'gaveUp']) {
      const { overlays, openAtBoot } = await load(status);
      openAtBoot();
      expect(overlays.endSheet).toBe('expanded');
      expect(calls).toEqual(['push']);
    }
    for (const status of ['playing', undefined]) {
      const { overlays, openAtBoot } = await load(status);
      openAtBoot();
      expect(overlays.endSheet).toBe('hidden');
      expect(calls).toEqual([]);
    }
  });
});

describe('AD-3 end sheet result mapping', () => {
  const bands = [
    [0, -40, 'Just Getting Started', 'Every word has to start somewhere. Lovely first steps!'],
    [1, 60, 'Warming Up', 'The cells are waking up.'],
    [2, 120, 'Word Explorer', "You're finding your way around the deck."],
    [3, 160, 'Word Nerd', 'The words are flowing now.'],
    [4, 210, 'Wordsmith', 'Long words, high cells. Nicely forged.'],
    [5, 260, 'Word Wizard', 'That is some real word magic.'],
    [6, 310, 'Lexicon Pro', 'Impressive: the dictionary is taking notes.'],
    [7, 360, 'Lexicon Legend', 'The dictionary is a little afraid of you.'],
    [8, 450, 'Nearly Impossible', 'Scores like this are almost unheard of. Astonishing!'],
    [
      9,
      530,
      'You Cheated',
      'Every single card placed. We have no idea how, but we are very impressed.',
    ],
  ] as const;

  it.each(bands)(
    'AD-3 band %i (finalScore %i) maps to %s through resultOf',
    async (band, finalScore, name, message) => {
      const { resultOf } = await load('won');
      const view = { status: 'won', band, finalScore } as unknown as Parameters<typeof resultOf>[0];
      expect(resultOf(view)).toEqual({ score: finalScore, band: name, message });
    },
  );

  it('AD-3 resultOf throws on a finished view with no band or finalScore', async () => {
    const { resultOf } = await load('won');
    const view = (v: object) => v as Parameters<typeof resultOf>[0];
    expect(() => resultOf(view({ finalScore: 1 }))).toThrow('AD-3');
    expect(() => resultOf(view({ band: 1 }))).toThrow('AD-3');
  });
});
