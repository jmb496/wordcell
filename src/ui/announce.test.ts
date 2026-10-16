import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Command, GameView } from '../engine/index';
import type { DispatchResult } from '../shell/game.svelte';

// Epic 6 CAP-11 (6.13): the announcer with the game store stubbed (a settable `view`, a scripted
// `dispatch`), a fake live-region element that records every write, and a fake rAF queue.
const store: { view: GameView | undefined; next: { result: DispatchResult; after: GameView } } = {
  view: undefined,
  next: { result: { changed: false }, after: undefined as never },
};
vi.mock('../shell/game.svelte', () => ({
  game: {
    get view() {
      return store.view;
    },
    dispatch: () => {
      store.view = store.next.after;
      return store.next.result;
    },
  },
}));

const view = (over: Record<string, unknown> = {}): GameView =>
  ({ status: 'playing', phase: 'idle', wordCount: 0, ...over }) as unknown as GameView;
const composing = (word: string, letterCount: number, over: Record<string, unknown> = {}) =>
  view({ phase: 'composing', draft: { word, letterCount }, ...over });
const placing = (word: string, letterCount: number, target = 6, scoreDelta = 30, wordCount = 2) =>
  view({
    phase: 'place',
    wordCount,
    draft: { word, letterCount },
    place: { target, scoreDelta },
  });

let writes: string[];
let frames: (() => void)[];
let hidden: boolean;
let mod: typeof import('./announce');

beforeEach(async () => {
  writes = [];
  frames = [];
  hidden = false;
  vi.stubGlobal('document', {
    get hidden() {
      return hidden;
    },
  });
  vi.stubGlobal('requestAnimationFrame', (cb: () => void) => frames.push(cb));
  vi.stubGlobal('cancelAnimationFrame', (id: number) => {
    frames[id - 1] = () => {};
  });
  vi.resetModules();
  mod = await import('./announce');
  mod.region({
    set textContent(value: string) {
      writes.push(value);
    },
  } as unknown as HTMLElement);
});

afterEach(() => vi.unstubAllGlobals());

const runFrame = () => {
  const cb = frames.shift();
  cb?.();
};
/** Non-empty writes: what a screen reader is given. */
const spoken = () => writes.filter((w) => w !== '');

function dispatch(
  command: Command,
  before: GameView,
  after: GameView,
  result: DispatchResult = { changed: true },
) {
  store.view = before;
  store.next = { result, after };
  mod.dispatchAnnounced(command);
  runFrame();
}

describe('AD-3 announcer', () => {
  it('AD-3 a commit reads the word, cell and delta from the PRE-dispatch view', () => {
    dispatch({ type: 'confirm' }, placing('balked', 6), view({ wordCount: 3 }));
    expect(spoken()).toEqual(['BALKED placed on cell 6, plus 30']);
  });

  it('AD-3 a committing Redo from Place uses the pre-view place.target', () => {
    dispatch({ type: 'redo' }, placing('baked', 5, 4, 0), view({ wordCount: 3 }));
    expect(spoken()).toEqual(['BAKED placed on cell 4, no change']);
  });

  it('AD-3 a negative delta reads minus N, never U+2212', () => {
    dispatch({ type: 'confirm' }, placing('cat', 3, 3, -4), view({ wordCount: 3 }));
    expect(spoken()).toEqual(['CAT placed on cell 3, minus 4']);
  });

  it('AD-3 a commit with a missing draft.word, draft.letterCount, place.target or place.scoreDelta throws', () => {
    const base = placing('cat', 3);
    for (const broken of [
      { ...base, draft: { letterCount: 3 } },
      { ...base, place: { scoreDelta: 3 } },
      { ...base, place: { target: 3 } },
      { ...base, place: undefined },
    ]) {
      store.view = broken as unknown as GameView;
      store.next = { result: { changed: true }, after: view({ wordCount: 3 }) };
      expect(() => mod.dispatchAnnounced({ type: 'confirm' })).toThrow(/AD-3/);
    }
  });

  it('AD-3 Place to Composing and Composing to Idle phase strings (Undo)', () => {
    dispatch({ type: 'undo' }, placing('baked', 5), composing('baked', 5));
    dispatch({ type: 'undo' }, composing('baked', 5), view());
    dispatch({ type: 'redo' }, view(), composing('quake', 5));
    expect(spoken()).toEqual([
      'Undo. Composing. BAKED, 5 letters.',
      'Undo. Idle.',
      'Redo. Composing. QUAKE, 5 letters.',
    ]);
  });

  it('AD-3 Undo staying in Composing announces; Undo of Give up reads Idle', () => {
    dispatch({ type: 'undo' }, composing('baked', 5), composing('bake', 4));
    dispatch({ type: 'undo' }, view({ status: 'gaveUp' }), view(), {
      changed: true,
      unfinished: true,
    });
    expect(spoken()).toEqual(['Undo. Composing. BAKE, 4 letters.', 'Undo. Idle.']);
  });

  it('AD-3 a phase change announces Composing and Place; a word edit inside Composing is silent', () => {
    dispatch({ type: 'validate' }, composing('baked', 5), placing('baked', 5, 5, 10, 2));
    dispatch({ type: 'dropOnColumn' } as unknown as Command, view(), composing('quake', 1));
    dispatch({ type: 'flip' }, composing('quake', 1), composing('kaque', 1));
    expect(spoken()).toEqual(['Place. BAKED, 5 letters.', 'Composing. QUAKE, 1 letter.']);
  });

  it('AD-3 a no-op dispatch (changed false) after time has elapsed announces nothing, even when the views differ', () => {
    const noop = { changed: false } as const;
    dispatch({ type: 'flip' }, composing('baked', 5), composing('baked', 5), noop);
    // Each of these would announce if `changed` were ignored: a phase change, a commit, Undo, Redo.
    dispatch({ type: 'validate' }, composing('baked', 5), placing('baked', 5, 5, 10, 2), noop);
    dispatch({ type: 'confirm' }, placing('baked', 5, 5, 10, 2), view({ wordCount: 3 }), noop);
    dispatch({ type: 'undo' }, composing('baked', 5), view(), noop);
    dispatch({ type: 'redo' }, view(), composing('baked', 5), noop);
    expect(writes).toEqual([]);
  });

  it('AD-3 Validate rejection twice announces twice, each set separately', () => {
    const rejected = { changed: false, rejectedWord: 'zzz' } as const;
    dispatch({ type: 'validate' }, composing('zzz', 3), composing('zzz', 3), rejected);
    dispatch({ type: 'validate' }, composing('zzz', 3), composing('zzz', 3), rejected);
    expect(spoken()).toEqual(["ZZZ isn't in the word list.", "ZZZ isn't in the word list."]);
    expect(writes).toEqual(['', "ZZZ isn't in the word list.", '', "ZZZ isn't in the word list."]);
  });

  it('AD-3 Give up sets no announcer string; only the outcome announces, a penalty is not read', () => {
    dispatch({ type: 'giveUp' }, view(), view({ status: 'gaveUp' }), {
      changed: true,
      finished: 'gaveUp',
    });
    expect(writes).toEqual([]);
    store.view = view({ status: 'gaveUp', finalScore: -12, band: 3, penalty: 12 });
    mod.announceOutcome();
    runFrame();
    expect(spoken()).toEqual(['Game given up. Score minus 12, Wordsmith.']);
  });

  it('AD-3 srOutcome for a win and a positive score', () => {
    store.view = view({ status: 'won', finalScore: 118, band: 3 });
    mod.announceOutcome();
    runFrame();
    expect(spoken()).toEqual(['Every column cleared. Score 118, Wordsmith.']);
  });

  it('AD-3 an outcome with a missing finalScore or band throws', () => {
    store.view = view({ status: 'won', band: 3 });
    expect(() => mod.announceOutcome()).toThrow(/finalScore/);
    store.view = view({ status: 'won', finalScore: 3 });
    expect(() => mod.announceOutcome()).toThrow(/band/);
  });

  it('AD-3 two announces within one frame: the latest wins', () => {
    mod.announceReset('New game');
    mod.announceReset('Replay');
    runFrame();
    runFrame();
    expect(spoken()).toEqual(['Replay. Idle.']);
  });

  it('AD-3 announceReset reads the prefix then Idle', () => {
    mod.announceReset('New game');
    runFrame();
    expect(spoken()).toEqual(['New game. Idle.']);
  });

  it('AD-3 commit then outcome are separate frames, outcome queued behind the commit', () => {
    store.view = placing('baked', 5, 5, 10);
    store.next = {
      result: { changed: true, finished: 'won' },
      after: view({ status: 'won', wordCount: 3, finalScore: 118, band: 3 }),
    };
    mod.dispatchAnnounced({ type: 'confirm' });
    mod.announceOutcome();
    runFrame();
    expect(spoken()).toEqual(['BAKED placed on cell 5, plus 10']);
    runFrame();
    expect(spoken()).toEqual([
      'BAKED placed on cell 5, plus 10',
      'Every column cleared. Score 118, Wordsmith.',
    ]);
  });

  it('AD-3 a hidden page drops the pending set', () => {
    mod.announceReset('New game');
    hidden = true;
    runFrame();
    expect(spoken()).toEqual([]);
  });

  it('AD-3 the announcer throws when the region is not mounted', async () => {
    vi.resetModules();
    const fresh = await import('./announce');
    expect(() => fresh.announceReset('New game')).toThrow(/live region/);
  });

  it('AD-3 a queued outcome behind a pending commit is dropped when an Undo set lands first', () => {
    store.view = placing('baked', 5, 5, 10);
    store.next = {
      result: { changed: true, finished: 'won' },
      after: view({ status: 'won', wordCount: 3, finalScore: 118, band: 3 }),
    };
    mod.dispatchAnnounced({ type: 'confirm' });
    mod.announceOutcome();
    // Undo before the commit frame runs: say() cancels the pending commit and the queued outcome.
    store.view = view({ status: 'won', wordCount: 3, finalScore: 118, band: 3 });
    store.next = { result: { changed: true, unfinished: true }, after: placing('baked', 5) };
    mod.dispatchAnnounced({ type: 'undo' });
    runFrame();
    runFrame();
    expect(spoken()).toEqual(['Undo. Place. BAKED, 5 letters.']);
  });

  it('AD-3 region.destroy cancels a pending frame', () => {
    const node = {
      set textContent(value: string) {
        writes.push(value);
      },
    } as unknown as HTMLElement;
    const handle = mod.region(node);
    mod.announceReset('New game');
    handle.destroy();
    runFrame();
    runFrame();
    expect(spoken()).toEqual([]);
    expect(() => mod.announceReset('New game')).toThrow(/live region/);
  });
});
