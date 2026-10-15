import { afterEach, describe, expect, it, vi } from 'vitest';

// Epic 6 CAP-3 (6.3) AD-13 for the two accept paths only (6.1 covers the entries): the real nav and
// overlays on a simulated session history, the game store stubbed. After an accept the overlays
// are at depth 0 and `history.state.wc` is 0 once the nav queue settles.

vi.mock('../shell/game.svelte', () => ({
  game: { state: { kind: 'active' }, newGame: () => undefined, replay: () => undefined },
}));

async function setup() {
  const win = new EventTarget();
  vi.stubGlobal('window', win);
  const entries: unknown[] = [null];
  let at = 0;
  const traversals: number[] = [];
  vi.stubGlobal('history', {
    get state() {
      return entries[at] ?? null;
    },
    pushState(state: unknown) {
      entries.splice(at + 1, entries.length, state);
      at += 1;
    },
    replaceState(state: unknown) {
      entries[at] = state;
    },
    go(delta: number) {
      traversals.push(delta);
    },
    back() {
      traversals.push(-1);
    },
  });
  const popstates: ((event: { state: unknown }) => void)[] = [];
  vi.spyOn(win, 'addEventListener').mockImplementation(((type: string, fn: never) => {
    if (type === 'popstate') popstates.push(fn);
  }) as never);
  vi.resetModules();
  const { nav } = await import('../shell/nav');
  const { overlays } = await import('./overlays.svelte');
  const { newGame, replayDeal, requestNewGame, requestReplay } = await import('./new-game');
  await nav.launch();
  nav.register({
    closedByBack: (depth) => overlays.closedByBack(depth),
    depth: () => overlays.depth,
  });
  const settle = () => {
    for (let delta = traversals.shift(); delta !== undefined; delta = traversals.shift()) {
      at += delta;
      for (const fn of popstates) fn({ state: entries[at] });
    }
  };
  const wc = () => (history.state as { wc: number }).wc;
  return { overlays, newGame, replayDeal, requestNewGame, requestReplay, settle, wc };
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('AD-13 confirm accept paths', () => {
  for (const [name, id] of [
    ['New game', 'newGameConfirm'],
    ['Replay', 'replayConfirm'],
  ] as const) {
    it(`AD-13 accepting the ${name} confirm leaves overlays at depth 0 and history.state.wc 0`, async () => {
      const t = await setup();
      const inProgress = { inProgress: true } as never;
      if (id === 'newGameConfirm') t.requestNewGame(inProgress, 'menu');
      else t.requestReplay(inProgress, 'menu');
      expect(t.overlays.top).toBe(id);
      expect(t.wc()).toBe(1);
      if (id === 'newGameConfirm') t.newGame();
      else t.replayDeal();
      t.settle();
      expect(t.overlays.depth).toBe(0);
      expect(t.wc()).toBe(0);
    });
  }

  it('AD-13 the gates act at once, opening nothing, when no game is in progress', async () => {
    const t = await setup();
    const idle = { inProgress: false } as never;
    expect(t.requestNewGame(idle)).toBe(false);
    expect(t.requestReplay(idle)).toBe(false);
    expect(t.overlays.depth).toBe(0);
    expect(t.wc()).toBe(0);
  });
});
