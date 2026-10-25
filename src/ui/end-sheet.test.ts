import { afterEach, describe, expect, it, vi } from 'vitest';

// Ticket 6.6 AD-13 end-sheet entry: the wiring of DispatchResult to the real overlays store, with
// nav and the game store stubbed. Epic 10 entry 5 (AD-19 Start): the celebration controller, the
// pointer controller's cancel and the reduced-motion pref are stubbed too; `load()` turns the
// celebration flag off (as main.ts does in hook builds), so the earlier win cases run today's open.
const calls: string[] = [];
const outcomes: string[] = [];
/** The view each `focusByPhase` call received. */
const focused: unknown[] = [];
const store: { view: { status: string } | undefined } = { view: undefined };
/** The test-controlled celebration flag and reduced-motion pref. */
const flags = { enabled: true, reduced: false };
/** Each stub `celebration.start` call: the view and the `done` it received. */
const starts: { view: unknown; done: () => void }[] = [];
/** The pending `game.whenVisible()` resolvers. */
const visibleWaiters: (() => void)[] = [];

vi.mock('./celebration/celebration.svelte.ts', () => ({
  celebration: {
    start: (view: unknown, done: () => void) => {
      calls.push('start');
      starts.push({ view, done });
    },
  },
  celebrationEnabled: () => flags.enabled,
  setCelebrationEnabled: (on: boolean) => {
    flags.enabled = on;
  },
}));
vi.mock('./act', async (importOriginal) => ({
  ...(await importOriginal<typeof import('./act')>()),
  cancelGesture: () => calls.push('cancel'),
}));
vi.mock('../shell/prefs.svelte', async (importOriginal) => {
  const original = await importOriginal<typeof import('../shell/prefs.svelte')>();
  return {
    ...original,
    prefs: Object.create(original.prefs, {
      motion: { get: () => ({ baseMs: 180, reduced: flags.reduced }) },
    }),
  };
});

vi.mock('../shell/nav', () => ({
  nav: { push: () => calls.push('push'), pop: () => calls.push('pop') },
}));
vi.mock('./announce', () => ({ announceOutcome: () => outcomes.push('outcome') }));
vi.mock('./focus-board', () => ({
  focusByPhase: (view: unknown) => {
    calls.push('focusByPhase');
    focused.push(view);
  },
}));
vi.mock('../shell/game.svelte', () => ({
  game: {
    get view() {
      return store.view;
    },
    whenVisible: () =>
      new Promise<void>((resolve) => {
        visibleWaiters.push(resolve);
      }),
  },
}));

async function load(status?: string) {
  vi.resetModules();
  flags.enabled = false;
  flags.reduced = false;
  calls.length = 0;
  outcomes.length = 0;
  focused.length = 0;
  starts.length = 0;
  visibleWaiters.length = 0;
  store.view = status === undefined ? undefined : { status };
  const { overlays } = await import('./overlays.svelte');
  const sheet = await import('./end-sheet');
  return { overlays, ...sheet };
}

afterEach(() => vi.unstubAllGlobals());

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

  // Epic 10 entry 4 (AD-13 celebration bullet): Undo mid-run cancels the run and refocuses as from
  // the shown sheet (EXPERIENCE.md Focus; focus-follow yielded under the celebration).
  it('AD-13 an unfinished onDispatched with the celebration open closes it (one pop), kills the token and calls focusByPhase after a tick', async () => {
    const { overlays, onDispatched } = await load('won');
    const reasons: string[] = [];
    overlays.onCelebrationRemoved((reason) => reasons.push(reason));
    const pending: (() => void)[] = [];
    onDispatched({ changed: true, finished: 'won' }, (cb) => pending.push(cb));
    overlays.startCelebration();
    calls.length = 0;
    const afterUndo = { status: 'playing' };
    store.view = afterUndo;
    onDispatched({ changed: true, unfinished: true }, settleNow);
    expect(overlays.depth).toBe(0);
    expect(reasons).toEqual(['cancelled']);
    expect(calls).toEqual(['pop']);
    await new Promise<void>((resolve) => setTimeout(resolve, 0));
    expect(calls).toEqual(['pop', 'focusByPhase']);
    expect(focused).toHaveLength(1);
    expect(focused[0]).toBe(afterUndo);
    store.view = { status: 'won' };
    pending[0]?.();
    expect(overlays.endSheet).toBe('hidden');
  });

  it('AD-13 an unfinished onDispatched with nothing shown moves no focus', async () => {
    const { onDispatched } = await load('playing');
    onDispatched({ changed: true, unfinished: true }, settleNow);
    await new Promise<void>((resolve) => setTimeout(resolve, 0));
    expect(calls).toEqual([]);
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

// Epic 10 entry 5 (AD-19 Start, AD-13 celebration bullet): the winning settle starts the run when
// enabled, not reduced and visible; `done` runs the token-guarded open.
describe('AD-19 win trigger', () => {
  /** Loads `won` with the celebration on and the page `visibility`; registers a removal stub. */
  async function enabled(visibility: 'visible' | 'hidden' = 'visible') {
    const loaded = await load('won');
    flags.enabled = true;
    vi.stubGlobal('document', { visibilityState: visibility });
    loaded.overlays.onCelebrationRemoved(() => undefined);
    return loaded;
  }
  const flush = () => new Promise<void>((resolve) => setTimeout(resolve, 0));

  it('AD-19 enabled, visible and not reduced: the press is cancelled, the entry pushed and the run started after settle; the sheet opens only on done, once, announced', async () => {
    const { overlays, onDispatched } = await enabled();
    const pending: (() => void)[] = [];
    onDispatched({ changed: true, finished: 'won' }, (cb) => pending.push(cb));
    expect(calls).toEqual([]);
    pending[0]?.();
    expect(calls).toEqual(['cancel', 'push', 'start']);
    expect(overlays.top).toBe('celebration');
    expect(starts).toHaveLength(1);
    expect(starts[0]?.view).toBe(store.view);
    expect(overlays.endSheet).toBe('hidden');
    expect(outcomes).toEqual([]);
    overlays.close('celebration');
    starts[0]?.done();
    expect(calls).toEqual(['cancel', 'push', 'start', 'pop', 'push']);
    expect(overlays.endSheet).toBe('expanded');
    expect(outcomes).toEqual(['outcome']);
    starts[0]?.done();
    expect(calls).toEqual(['cancel', 'push', 'start', 'pop', 'push']);
    expect(outcomes).toEqual(['outcome']);
  });

  it("AD-19 reduced motion, the flag off or a hidden page at settle run today's open only", async () => {
    for (const no of ['reduced', 'disabled', 'hidden'] as const) {
      const { overlays, onDispatched } = await enabled(no === 'hidden' ? 'hidden' : 'visible');
      if (no === 'reduced') flags.reduced = true;
      if (no === 'disabled') flags.enabled = false;
      onDispatched({ changed: true, finished: 'won' }, settleNow);
      expect([no, calls]).toEqual([no, ['push']]);
      expect(overlays.endSheet).toBe('expanded');
      expect(starts).toEqual([]);
      if (no !== 'hidden') expect(outcomes).toEqual(['outcome']);
    }
  });

  it('AD-19 not won or a dead token at settle does nothing: no cancel, no push, no start', async () => {
    const notWon = await enabled();
    const pending: (() => void)[] = [];
    notWon.onDispatched({ changed: true, finished: 'won' }, (cb) => pending.push(cb));
    store.view = { status: 'playing' };
    pending[0]?.();
    expect(calls).toEqual([]);
    expect(starts).toEqual([]);

    const dead = await enabled();
    const later: (() => void)[] = [];
    dead.onDispatched({ changed: true, finished: 'won' }, (cb) => later.push(cb));
    dead.overlays.cancelEndSheetOpen();
    later[0]?.();
    expect(calls).toEqual([]);
    expect(starts).toEqual([]);
    expect(dead.overlays.endSheet).toBe('hidden');
  });

  it('AD-19 Give up and openAtBoot never start the celebration (the relaunch guard)', async () => {
    const gave = await enabled();
    store.view = { status: 'gaveUp' };
    gave.onDispatched({ changed: true, finished: 'gaveUp' }, settleNow);
    expect(calls).toEqual(['push']);
    expect(starts).toEqual([]);

    const boot = await enabled();
    boot.openAtBoot();
    expect(calls).toEqual(['push']);
    expect(boot.overlays.endSheet).toBe('expanded');
    expect(starts).toEqual([]);
  });

  it('AD-19 done on a hidden page opens nothing until whenVisible resolves, then expanded with no announce', async () => {
    const { overlays, onDispatched } = await enabled();
    onDispatched({ changed: true, finished: 'won' }, settleNow);
    expect(calls).toEqual(['cancel', 'push', 'start']);
    overlays.close('celebration');
    vi.stubGlobal('document', { visibilityState: 'hidden' });
    starts[0]?.done();
    await flush();
    expect(overlays.endSheet).toBe('hidden');
    expect(calls).toEqual(['cancel', 'push', 'start', 'pop']);
    expect(visibleWaiters).toHaveLength(1);
    vi.stubGlobal('document', { visibilityState: 'visible' });
    visibleWaiters[0]?.();
    await flush();
    expect(overlays.endSheet).toBe('expanded');
    expect(calls).toEqual(['cancel', 'push', 'start', 'pop', 'push']);
    expect(outcomes).toEqual([]);
  });

  type Sheet = Awaited<ReturnType<typeof enabled>>;
  const UNWON: readonly [string, (t: Sheet) => void][] = [
    ['the game is playing again', () => (store.view = { status: 'playing' })],
    ['there is no GameView', () => (store.view = undefined)],
    ['the token is cancelled', (t) => t.overlays.resetForNewSession()],
  ];
  for (const [name, change] of UNWON) {
    it(`AD-19 done on a hidden page opens nothing when ${name} before whenVisible resolves`, async () => {
      const t = await enabled();
      t.onDispatched({ changed: true, finished: 'won' }, settleNow);
      t.overlays.close('celebration');
      vi.stubGlobal('document', { visibilityState: 'hidden' });
      starts[0]?.done();
      await flush();
      expect(visibleWaiters).toHaveLength(1);
      change(t);
      vi.stubGlobal('document', { visibilityState: 'visible' });
      visibleWaiters[0]?.();
      await flush();
      expect(t.overlays.endSheet).toBe('hidden');
      expect(t.overlays.depth).toBe(0);
      expect(outcomes).toEqual([]);
    });
  }
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

// R-88 / ticket 10.2: the Words section by server render (the unit environment has no DOM).
describe('AD-3 end sheet Words section', () => {
  async function sheetHtml(view: object): Promise<string> {
    vi.resetModules();
    store.view = { status: (view as { status: string }).status };
    const { render } = await import('svelte/server');
    const { overlays } = await import('./overlays.svelte');
    overlays.resetForNewSession();
    const sheet = await import('./end-sheet');
    sheet.openAtBoot();
    const { default: EndSheet } = await import('./EndSheet.svelte');
    return render(EndSheet, { props: { view: view as never } }).body;
  }
  const base = { status: 'won', finalScore: 100, band: 3, wordCount: 1, longestWord: undefined };

  it('AD-3 the rows equal the stubbed view.wordList, in its order (no UI re-sort)', async () => {
    // Not in the engine's order (letter count descending): the sheet keeps the stub's order.
    const html = await sheetHtml({
      ...base,
      wordList: [
        { spelling: 'cat', letterCount: 1, cards: [], cell: 3 },
        { spelling: 'baked', letterCount: 5, cards: [], cell: 5 },
      ],
    });
    expect(html).toContain('aria-label="BAKED, 5 letters"');
    expect(html).toContain('aria-label="CAT, 1 letter"');
    // The visible spans: the word in capitals and `n letters`, singular for one.
    expect(html).toMatch(/class="word[^"]*" aria-hidden="true">BAKED</);
    expect(html).toMatch(/class="count[^"]*" aria-hidden="true">5 letters</);
    expect(html).toMatch(/class="word[^"]*" aria-hidden="true">CAT</);
    expect(html).toMatch(/class="count[^"]*" aria-hidden="true">1 letter</);
    expect(html).toContain('aria-labelledby="end-words"');
    expect(html.indexOf('CAT')).toBeLessThan(html.indexOf('BAKED'));
  });

  it('AD-3 an empty wordList renders the heading and the empty line, no list', async () => {
    const html = await sheetHtml({ ...base, wordList: [] });
    expect(html).toContain('>Words</h3>');
    expect(html).toContain('No words were played.');
    expect(html).not.toContain('<ul');
  });

  it('AD-3 an undefined wordList on a finished view throws', async () => {
    await expect(sheetHtml({ ...base })).rejects.toThrow('AD-3');
    await expect(
      sheetHtml({ ...base, status: 'gaveUp', lettersLeft: 1, penalty: 1 }),
    ).rejects.toThrow('AD-3');
  });
});
