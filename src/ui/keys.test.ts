import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { GameView } from '../engine/index';
import type { Controller } from './gestures/controller';

// Epic 6 CAP-10 (6.10): the one key handler. The unit environment is `node`, so the handler is
// driven with plain event objects over the real overlays store, open-surface and act(); the nav
// adapter (a pending pop that `settle()` completes), the game store, the dictionary and the
// dispatching commands are mocks that record. Validate, Confirm and Flip have rows but no key yet
// (ticket 6.11), so their rows are driven through `ROWS` directly.
const mocks = vi.hoisted(() => {
  const state = {
    pending: false,
    waiters: [] as (() => void)[],
    log: [] as string[],
    game: { state: { kind: 'active' }, view: undefined as unknown } as {
      state: { kind: string };
      view: unknown;
    },
    dictionary: { state: 'ready' },
  };
  return state;
});

vi.mock('../shell/nav', () => ({
  nav: {
    push: () => {},
    pop: () => {
      mocks.pending = true;
    },
    settled: () => !mocks.pending,
    whenSettled: (fn: () => void) => {
      if (mocks.pending) mocks.waiters.push(fn);
      else fn();
    },
  },
}));
vi.mock('../shell/game.svelte', () => ({ game: mocks.game }));
vi.mock('../shell/dictionary.svelte', () => ({ dictionary: mocks.dictionary }));
vi.mock('./commands', () => ({
  undo: () => mocks.log.push('undo'),
  redo: () => mocks.log.push('redo'),
  validate: () => mocks.log.push('validate'),
  confirm: () => mocks.log.push('confirm'),
  flip: () => mocks.log.push('flip'),
}));
vi.mock('./new-game', () => ({
  newGame: () => mocks.log.push('newGame'),
  requestNewGame: (view: { inProgress: boolean }) => {
    mocks.log.push(view.inProgress ? 'newGameConfirm' : 'newGame');
    return view.inProgress;
  },
}));

type Overlays = typeof import('./overlays.svelte').overlays;
type Keys = typeof import('./keys');

let overlays: Overlays;
let keys: Keys;

const VIEW = {
  canUndo: true,
  canRedo: true,
  canValidate: true,
  canConfirm: true,
  canFlip: true,
  inProgress: true,
};

function setView(patch: Partial<typeof VIEW> = {}): void {
  mocks.game.view = { ...VIEW, ...patch } as unknown as GameView;
}

function settle(): void {
  mocks.pending = false;
  for (const waiter of mocks.waiters.splice(0)) waiter();
}

type Mods = { ctrl?: boolean; meta?: boolean; alt?: boolean; shift?: boolean; repeat?: boolean };

/** Presses a key; returns whether the handler called preventDefault. */
function press(key: string, mods: Mods = {}): boolean {
  let prevented = false;
  keys.onKeyDown({
    key,
    ctrlKey: mods.ctrl ?? false,
    metaKey: mods.meta ?? false,
    altKey: mods.alt ?? false,
    shiftKey: mods.shift ?? false,
    repeat: mods.repeat ?? false,
    defaultPrevented: false,
    preventDefault: () => {
      prevented = true;
    },
  } as KeyboardEvent);
  return prevented;
}

beforeEach(async () => {
  vi.resetModules();
  mocks.pending = false;
  mocks.waiters.length = 0;
  mocks.log.length = 0;
  mocks.game.state = { kind: 'active' };
  mocks.dictionary.state = 'ready';
  setView();
  const act = await import('./act');
  act.setController({
    cancel: () => mocks.log.push('cancel'),
    attach: () => () => {},
    refreshHover: () => {},
  } as Controller);
  ({ overlays } = await import('./overlays.svelte'));
  keys = await import('./keys');
});

const ACTED = (log: string[]) => log.filter((entry) => entry !== 'cancel');

describe('AD-12 key-event filtering', () => {
  it('AD-12 letters match case-insensitively on event.key; Z and Shift+Z undo, Y and Ctrl/Cmd+Y redo, Ctrl/Cmd+Shift+Z redoes before Z', () => {
    expect(press('z')).toBe(true);
    expect(press('Z', { shift: true })).toBe(true);
    expect(press('z', { ctrl: true })).toBe(true);
    expect(press('z', { meta: true })).toBe(true);
    expect(mocks.log.filter((entry) => entry === 'undo')).toHaveLength(4);
    mocks.log.length = 0;
    press('y');
    press('Y', { shift: true });
    press('y', { ctrl: true });
    press('z', { ctrl: true, shift: true });
    press('Z', { meta: true, shift: true });
    expect(mocks.log.filter((entry) => entry === 'redo')).toHaveLength(5);
    expect(mocks.log).not.toContain('undo');
  });

  it('AD-12 any other Ctrl/Cmd/Alt chord is ignored and not default-prevented', () => {
    for (const key of ['m', 'n', '?', 'Escape']) {
      expect(press(key, { ctrl: true })).toBe(false);
      expect(press(key, { meta: true })).toBe(false);
      expect(press(key, { alt: true })).toBe(false);
    }
    expect(press('z', { alt: true })).toBe(false);
    expect(press('y', { alt: true })).toBe(false);
    expect(press('x')).toBe(false);
    expect(mocks.log).toEqual([]);
    expect(overlays.depth).toBe(0);
  });

  it('AD-12 M, N, ? and Esc ignore a repeat; held Z and Y repeat and act', () => {
    expect(press('m', { repeat: true })).toBe(false);
    expect(press('n', { repeat: true })).toBe(false);
    expect(press('?', { repeat: true })).toBe(false);
    expect(overlays.depth).toBe(0);
    overlays.open('menu');
    expect(press('Escape', { repeat: true })).toBe(false);
    expect(overlays.isOpen('menu')).toBe(true);
    expect(press('z', { repeat: true })).toBe(false);
    overlays.close('menu');
    settle();
    expect(press('z', { repeat: true })).toBe(true);
    expect(press('y', { repeat: true })).toBe(true);
    expect(ACTED(mocks.log)).toEqual(['undo', 'redo']);
  });

  it('AD-12 an already default-prevented event is ignored', () => {
    keys.onKeyDown({
      key: 'z',
      ctrlKey: false,
      metaKey: false,
      altKey: false,
      shiftKey: false,
      repeat: false,
      defaultPrevented: true,
      preventDefault: () => {
        throw new Error('prevented again');
      },
    } as unknown as KeyboardEvent);
    expect(mocks.log).toEqual([]);
  });
});

describe('AD-12 key gate', () => {
  it('AD-12 Undo, Redo (Y, Ctrl/Cmd+Y, Ctrl/Cmd+Shift+Z) act only when the control is enabled; a key that does not act does nothing at all', () => {
    setView({ canUndo: false, canRedo: false });
    overlays.openView(3);
    for (const [key, mods] of [
      ['z', {}],
      ['z', { ctrl: true }],
      ['y', {}],
      ['y', { ctrl: true }],
      ['z', { ctrl: true, shift: true }],
    ] as [string, Mods][]) {
      expect(press(key, mods)).toBe(false);
    }
    expect(mocks.log).toEqual([]);
    expect(overlays.viewCell).toBe(3);
    overlays.clearTile();
    overlays.close('wordcellView');
    overlays.selectTile(5);
    press('z');
    expect(overlays.tileSelection).toBe(5);
  });

  it('AD-12 the Validate, Confirm and Flip rows gate on their GameView flags (Validate also on the dictionary) and act through the row', () => {
    const view = (patch: Partial<typeof VIEW>) => ({ ...VIEW, ...patch }) as unknown as GameView;
    expect(keys.ROWS.validate.gate(view({}))).toBe(true);
    expect(keys.ROWS.validate.gate(view({ canValidate: false }))).toBe(false);
    mocks.dictionary.state = 'loading';
    expect(keys.ROWS.validate.gate(view({}))).toBe(false);
    expect(keys.ROWS.confirm.gate(view({ canConfirm: false }))).toBe(false);
    expect(keys.ROWS.confirm.gate(view({}))).toBe(true);
    expect(keys.ROWS.flip.gate(view({ canFlip: false }))).toBe(false);
    expect(keys.ROWS.flip.gate(view({}))).toBe(true);
    for (const id of ['validate', 'confirm', 'flip'] as const) {
      expect(keys.ROWS[id].single).toBe(true);
      keys.ROWS[id].run(view({}));
    }
    expect(keys.ROWS.undo.single).toBe(false);
    expect(keys.ROWS.redo.single).toBe(false);
    expect(mocks.log).toEqual(['validate', 'confirm', 'flip']);
  });

  it('AD-12 an acting key runs act() first (cancel, tile clear) and then its row; Undo, Redo and N at once clear a tile selection', () => {
    overlays.selectTile(7);
    press('z');
    expect(mocks.log).toEqual(['cancel', 'undo']);
    expect(overlays.tileSelection).toBeNull();
    overlays.selectTile(7);
    press('y');
    expect(overlays.tileSelection).toBeNull();
    setView({ inProgress: false });
    overlays.selectTile(7);
    mocks.log.length = 0;
    press('n');
    expect(mocks.log).toEqual(['cancel', 'newGame']);
    expect(overlays.tileSelection).toBeNull();
  });

  it('AD-12 M opens the menu, ? How to play, N the New game confirm while a game is in progress', () => {
    press('m');
    expect(overlays.top).toBe('menu');
    overlays.close('menu');
    settle();
    press('?');
    expect(overlays.top).toBe('howToPlay');
    overlays.close('howToPlay');
    settle();
    press('N');
    expect(mocks.log).toContain('newGameConfirm');
  });

  it('AD-12 F39: Y with a sticky view, a peek or a tail selection open acts (the close is the command, commands.test.ts)', () => {
    overlays.openView(5);
    expect(press('y')).toBe(true);
    overlays.close('wordcellView');
    settle();
    overlays.openPeek(4);
    expect(press('y')).toBe(true);
    overlays.closePeek();
    settle();
    overlays.select(2, 3);
    expect(press('y')).toBe(true);
    expect(ACTED(mocks.log)).toEqual(['redo', 'redo', 'redo']);
  });

  it('AD-12 M, ? and a confirm-opening N clear a tail selection and pop its entry before opening; M closes a long-press peek and a sticky view', () => {
    overlays.select(2, 3);
    press('m');
    expect(overlays.selection).toBeNull();
    expect(overlays.top).toBe('menu');
    overlays.close('menu');
    settle();
    overlays.openPeek(4);
    press('?');
    expect(overlays.peek).toBeNull();
    expect(overlays.top).toBe('howToPlay');
    overlays.close('howToPlay');
    settle();
    overlays.openView(5);
    press('m');
    expect(overlays.viewCell).toBeNull();
    expect(overlays.top).toBe('menu');
  });
});

const SURFACES = [
  'menu',
  'statistics',
  'preferences',
  'howToPlay',
  'newGameConfirm',
  'replayConfirm',
  'historyNotice',
] as const;

describe('AD-12 key table per surface', () => {
  for (const id of SURFACES) {
    it(`AD-12 ${id} open: M, N, ?, Z and Y do nothing and Esc closes it`, () => {
      overlays.open(id);
      for (const key of ['m', 'n', '?', 'z', 'y', 'Y', 'Z']) expect(press(key)).toBe(false);
      expect(mocks.log).toEqual([]);
      expect(overlays.top).toBe(id);
      expect(overlays.depth).toBe(1);
      expect(press('Escape')).toBe(true);
      expect(overlays.depth).toBe(0);
    });
  }

  it('AD-12 the Reset confirm over the History notice: game keys do nothing, Esc closes the confirm only, the next Esc the notice', () => {
    overlays.open('historyNotice');
    overlays.open('resetConfirm');
    for (const key of ['m', 'n', '?', 'z', 'y']) press(key);
    expect(mocks.log).toEqual([]);
    press('Escape');
    expect(overlays.top).toBe('historyNotice');
    settle();
    press('Escape');
    expect(overlays.depth).toBe(0);
  });

  it('AD-12 the expanded end sheet: M, N, ?, Z and Y act (Z and Y still follow the gate) and Esc collapses it', () => {
    overlays.openDeferred(overlays.deferEndSheetOpen());
    press('z');
    press('y');
    expect(ACTED(mocks.log)).toEqual(['undo', 'redo']);
    setView({ canRedo: false });
    press('y');
    expect(ACTED(mocks.log)).toEqual(['undo', 'redo']);
    press('Escape');
    expect(overlays.endSheet).toBe('collapsed');
    settle();
    expect(overlays.depth).toBe(0);
  });

  it('AD-12 the expanded end sheet: M opens the menu, ? How to play, N the confirm over it', () => {
    setView({ inProgress: false });
    for (const [key, id] of [
      ['m', 'menu'],
      ['?', 'howToPlay'],
    ] as const) {
      const token = overlays.deferEndSheetOpen();
      overlays.openDeferred(token);
      press(key);
      expect(overlays.top).toBe(id);
      overlays.close(id);
      overlays.collapseEndSheet();
      overlays.onUnfinished();
      settle();
    }
    // N is not suspended by the end sheet: with no game in progress it acts at once.
    overlays.openDeferred(overlays.deferEndSheetOpen());
    expect(press('n')).toBe(true);
    expect(ACTED(mocks.log)).toEqual(['newGame']);
  });

  it('AD-12 a sticky WordCell view: M, N, ?, Z and Y act and close the view first; Esc closes it', () => {
    overlays.openView(6);
    press('z');
    expect(ACTED(mocks.log)).toEqual(['undo']);
    press('Escape');
    expect(overlays.viewCell).toBeNull();
    settle();
    overlays.openView(6);
    press('n');
    expect(ACTED(mocks.log)).toContain('newGameConfirm');
  });

  it('AD-12 the rejected root: only N acts (at once); M, ?, Z, Y and Esc with nothing open do nothing', () => {
    mocks.game.state = { kind: 'rejected' };
    mocks.game.view = undefined;
    for (const key of ['m', '?', 'z', 'y', 'Escape']) expect(press(key)).toBe(false);
    expect(mocks.log).toEqual([]);
    expect(press('n')).toBe(true);
    expect(mocks.log).toEqual(['cancel', 'newGame']);
  });

  it('AD-12 the rejected root with an overlay open: Esc closes it and N does nothing', () => {
    mocks.game.state = { kind: 'rejected' };
    mocks.game.view = undefined;
    overlays.open('historyNotice');
    expect(press('n')).toBe(false);
    expect(mocks.log).toEqual([]);
    expect(overlays.top).toBe('historyNotice');
    expect(press('Escape')).toBe(true);
    expect(overlays.depth).toBe(0);
  });

  it('AD-12 Halted: no key acts', () => {
    mocks.game.state = { kind: 'halted' };
    mocks.game.view = undefined;
    for (const key of ['m', 'n', '?', 'z', 'y', 'Escape']) expect(press(key)).toBe(false);
    expect(mocks.log).toEqual([]);
  });
});

describe('AD-12 Esc order', () => {
  it('AD-12 Esc: the topmost entry first, else a tail selection pops, else a tile selection clears, else nothing', () => {
    expect(press('Escape')).toBe(false);
    expect(mocks.log).toEqual([]);
    overlays.selectTile(9);
    expect(press('Escape')).toBe(true);
    expect(overlays.tileSelection).toBeNull();
    overlays.select(1, 2);
    expect(press('Escape')).toBe(true);
    expect(overlays.selection).toBeNull();
    expect(overlays.depth).toBe(0);
  });

  it('AD-12 Esc on an open overlay closes it and, through act(), also clears a live tile selection', () => {
    overlays.open('menu');
    overlays.selectTile(9);
    expect(press('Escape')).toBe(true);
    expect(overlays.isOpen('menu')).toBe(false);
    expect(overlays.tileSelection).toBeNull();
  });

  it('AD-12 two Escs: the second, pressed while the first pop is pending, is dropped; after the pop completes Esc acts on the next topmost entry', () => {
    overlays.open('howToPlay');
    overlays.open('newGameConfirm');
    press('Escape');
    expect(overlays.top).toBe('howToPlay');
    expect(press('Escape')).toBe(false);
    expect(overlays.top).toBe('howToPlay');
    settle();
    expect(press('Escape')).toBe(true);
    expect(overlays.depth).toBe(0);
  });

  it('AD-12 I-68: Esc on a confirm opened from the menu closes only the confirm; the menu is not reopened', async () => {
    overlays.open('menu');
    overlays.close('menu');
    settle();
    (await import('./open-surface')).openSurface('newGameConfirm');
    expect(overlays.top).toBe('newGameConfirm');
    press('Escape');
    expect(overlays.depth).toBe(0);
    expect(overlays.isOpen('menu')).toBe(false);
  });

  it('AD-12 I-68: Esc on the History notice over the expanded end sheet leaves the sheet expanded', () => {
    overlays.openDeferred(overlays.deferEndSheetOpen());
    overlays.open('historyNotice');
    press('Escape');
    expect(overlays.top).toBe('endSheet');
    expect(overlays.endSheet).toBe('expanded');
  });
});

describe('AD-12 pending pop', () => {
  it('AD-12 an acting key waits for the pending pop and is evaluated then, on the then-current GameView and overlays', () => {
    mocks.pending = true;
    expect(press('z')).toBe(false);
    expect(mocks.log).toEqual([]);
    setView({ canUndo: false });
    settle();
    expect(mocks.log).toEqual([]);
    setView();
    mocks.pending = true;
    press('m');
    overlays.open('statistics');
    settle();
    expect(overlays.top).toBe('statistics');
    expect(overlays.isOpen('menu')).toBe(false);
  });

  it('AD-12 a waiting key acts once the pop completes when the state still allows it', () => {
    mocks.pending = true;
    press('y');
    press('?');
    expect(mocks.log).toEqual([]);
    settle();
    expect(ACTED(mocks.log)).toEqual(['redo']);
    expect(overlays.top).toBe('howToPlay');
  });

  it('AD-12 Esc is dropped while a pop is pending and queues nothing', () => {
    overlays.open('menu');
    mocks.pending = true;
    expect(press('Escape')).toBe(false);
    expect(overlays.top).toBe('menu');
    expect(mocks.waiters).toHaveLength(0);
  });

  it('AD-12 a held Z during a pending pop queues no repeat: one undo at settle, not a burst', () => {
    mocks.pending = true;
    press('z');
    press('z', { repeat: true });
    press('z', { repeat: true });
    expect(mocks.waiters).toHaveLength(1);
    settle();
    expect(ACTED(mocks.log)).toEqual(['undo']);
  });

  it('AD-12 a key that gates false after the pop did nothing and was never default-prevented', () => {
    mocks.pending = true;
    expect(press('y')).toBe(false);
    setView({ canRedo: false });
    settle();
    expect(mocks.log).toEqual([]);
  });
});

describe('AD-12 clearTile and tileTap stale selection', () => {
  it('AD-12 a phase-changing key clears the tile selection at the source before its row runs', () => {
    overlays.selectTile(3);
    const order: string[] = [];
    const original = overlays.clearTile;
    overlays.clearTile = () => {
      order.push('clearTile');
      original();
    };
    press('z');
    overlays.clearTile = original;
    expect(order[0]).toBe('clearTile');
    expect(mocks.log).toEqual(['cancel', 'undo']);
  });
});
