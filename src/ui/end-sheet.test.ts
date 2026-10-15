import { describe, expect, it, vi } from 'vitest';

// Ticket 6.6 AD-13 end-sheet entry: the wiring of DispatchResult to the real overlays store, with
// nav and the game store stubbed.
const calls: string[] = [];
const store: { view: { status: string } | undefined } = { view: undefined };

vi.mock('../shell/nav', () => ({
  nav: { push: () => calls.push('push'), pop: () => calls.push('pop') },
}));
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
