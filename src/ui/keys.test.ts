import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { GameView } from '../engine/index';
import type { Controller } from './gestures/controller';

// Epic 6 CAP-10 (6.10): the one key handler. The unit environment is `node`, so the handler is
// driven with plain event objects over the real overlays store, open-surface and act(); the nav
// adapter (a pending pop that `settle()` completes), the game store, the dictionary and the
// dispatching commands, the focus target and the focus helpers are mocks that record. The board
// keys (ticket 6.11) read `game.view` and the mocked focus target; the controller's key-activation
// entry is a recording mock (its tap path is in controller.test.ts).
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
    focus: { kind: 'board' } as unknown,
    tiles: [] as number[],
    onActivate: undefined as undefined | ((hit: unknown) => void),
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
  edit: (command: unknown) => mocks.log.push(`edit ${JSON.stringify(command)}`),
  setK: (k: number) => mocks.log.push(`setK ${k}`),
}));
vi.mock('./focus-target', () => ({
  readFocus: () => mocks.focus,
  liveTiles: () => mocks.tiles,
}));
vi.mock('./focus-board', async (importOriginal) => ({
  ...(await importOriginal<typeof import('./focus-board')>()),
  focusBoard: () => mocks.log.push('focusBoard'),
  focusCard: (id: number) => mocks.log.push(`focusCard ${id}`),
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

const CTX = { digit: 0, dir: 0, focus: { kind: 'board' } } as const;

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
  mocks.focus = { kind: 'board' };
  mocks.tiles = [];
  mocks.onActivate = undefined;
  setView();
  const act = await import('./act');
  act.setController({
    cancel: () => mocks.log.push('cancel'),
    attach: () => () => {},
    refreshHover: () => {},
    activate: (hit: unknown) => {
      mocks.log.push(`activate ${JSON.stringify(hit)}`);
      mocks.onActivate?.(hit);
    },
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
    expect(keys.ROWS.validate.gate(view({}), CTX)).toBe(true);
    expect(keys.ROWS.validate.gate(view({ canValidate: false }), CTX)).toBe(false);
    mocks.dictionary.state = 'loading';
    expect(keys.ROWS.validate.gate(view({}), CTX)).toBe(false);
    expect(keys.ROWS.confirm.gate(view({ canConfirm: false }), CTX)).toBe(false);
    expect(keys.ROWS.confirm.gate(view({}), CTX)).toBe(true);
    expect(keys.ROWS.flip.gate(view({ canFlip: false }), CTX)).toBe(false);
    expect(keys.ROWS.flip.gate(view({}), CTX)).toBe(true);
    for (const id of ['validate', 'confirm', 'flip'] as const) {
      expect(keys.ROWS[id].single).toBe(true);
      keys.ROWS[id].run(view({}), CTX);
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

// Epic 6 CAP-10 (6.11): the board keys. A GameView-shaped fixture, the mocked focus target and the
// recording controller; `tapAction` (intent.ts) is the real pure function behind the gates.
type BoardOpts = {
  phase?: 'idle' | 'composing' | 'place';
  status?: 'playing' | 'won' | 'gaveUp';
  cards?: Record<number, number[]>;
  pick?: Record<number, boolean>;
  drop?: Record<number, boolean>;
  kIfTapped?: Record<number, Map<number, number | null>>;
  cellCards?: Record<number, number[]>;
  add?: number[];
  target?: number[];
  arrangement?: number[];
  order?: number[];
  k?: number;
  flags?: Partial<typeof VIEW> & { canIncK?: boolean; canDecK?: boolean };
};

function board(o: BoardOpts = {}): GameView {
  const phase = o.phase ?? 'idle';
  const status = o.status ?? 'playing';
  const live = status === 'playing' && phase === 'idle';
  const view = {
    ...VIEW,
    canIncK: false,
    canDecK: false,
    ...o.flags,
    status,
    phase,
    columns: [1, 2, 3, 4, 5, 6, 7, 8].map((n) => ({
      column: n,
      cards: o.cards?.[n] ?? [n * 10, n * 10 + 1],
      canPickUp: o.pick?.[n] ?? live,
      canDropOn: o.drop?.[n] ?? live,
      canTapForK: false,
      kIfTapped: o.kIfTapped?.[n],
    })),
    cells: [3, 4, 5, 6, 7, 8, 9, 10].map((n) => ({
      cell: n,
      cards: o.cellCards?.[n] ?? [],
      used: false,
      canAddFreeLetter: o.add?.includes(n) ?? false,
      canSetTarget: o.target?.includes(n) ?? false,
      isLegalTarget: false,
    })),
    draft: phase === 'idle' ? undefined : { arrangement: o.arrangement ?? [1, 2, 3], k: o.k ?? 1 },
    place: phase === 'place' ? { placementOrder: o.order ?? [1, 2, 3], target: 3 } : undefined,
  } as unknown as GameView;
  mocks.game.view = view;
  return view;
}

const flush = () => new Promise<void>((resolve) => setTimeout(resolve, 0));
const hit = (value: object) => `activate ${JSON.stringify(value)}`;
const onColumn = (column: number, card: number) => {
  mocks.focus = { kind: 'column', column, card };
};
const onTile = (card: number, left: number | null, right: number | null, place = 'tray') => {
  mocks.focus = { kind: 'tile', place, card, left, right };
  if (!mocks.tiles.includes(card)) {
    mocks.tiles = [left, card, right].filter((id): id is number => id !== null);
  }
};
const onCell = (cell: number) => {
  mocks.focus = { kind: 'cell', cell };
};

describe('AD-12 board keys: 1-8 and the tail keys (Idle)', () => {
  it('AD-12 1-8 with no selection select the bottom card of the column, as a tap on it', () => {
    board();
    for (let n = 1; n <= 8; n++) {
      mocks.log.length = 0;
      expect(press(String(n))).toBe(true);
      expect(mocks.log).toEqual([hit({ kind: 'card', column: n, card: n * 10 + 1 })]);
    }
  });

  it('AD-12 1-8 with a tail selected drop on that column; the source number is a drop on the source column; an empty column takes the drop', () => {
    board({ cards: { 5: [] } });
    overlays.select(2, 1);
    expect(press('5')).toBe(true);
    expect(press('2')).toBe(true);
    expect(mocks.log).toEqual([
      hit({ kind: 'space', column: 5, foot: true }),
      hit({ kind: 'space', column: 2, foot: true }),
    ]);
  });

  it('AD-12 1-8 are no-ops (nothing dispatched, no preventDefault) on an empty column with no selection and on any false per-column gate', () => {
    board({ cards: { 5: [] }, pick: { 3: false }, drop: { 4: false } });
    expect(press('5')).toBe(false);
    expect(press('3')).toBe(false);
    overlays.select(2, 1);
    expect(press('4')).toBe(false);
    expect(mocks.log).toEqual([]);
  });

  it('AD-12 1 and 2 do nothing in Composing and Place; 9 and 0 do nothing in Idle; no key acts in Game over', () => {
    for (const phase of ['composing', 'place'] as const) {
      board({ phase });
      expect(press('1')).toBe(false);
      expect(press('2')).toBe(false);
    }
    board();
    expect(press('9')).toBe(false);
    expect(press('0')).toBe(false);
    board({ status: 'won' });
    for (const key of ['1', '5', '8']) expect(press(key)).toBe(false);
    expect(mocks.log).toEqual([]);
  });

  it('AD-12 1-8 keep a tile selection and cancel a drag through the activation entry, not act()', () => {
    board();
    overlays.selectTile(9);
    press('1');
    expect(mocks.log).toEqual([hit({ kind: 'card', column: 1, card: 11 })]);
    expect(overlays.tileSelection).toBe(9);
  });

  it('AD-12 after a key selection focus moves to the selected tail top card', async () => {
    board({ cards: { 2: [20, 21, 22] } });
    mocks.onActivate = () => overlays.select(2, 2);
    press('2');
    await flush();
    expect(mocks.log).toContain('focusCard 21');
  });

  it('AD-12 up re-selects from the card above the tail top, down from the card below it; the limits are no-ops', () => {
    board({ cards: { 2: [20, 21, 22] } });
    overlays.select(2, 1);
    expect(press('ArrowUp')).toBe(true);
    expect(press('ArrowDown')).toBe(false);
    expect(mocks.log).toEqual([hit({ kind: 'card', column: 2, card: 21 })]);
    overlays.select(2, 2);
    mocks.log.length = 0;
    expect(press('ArrowDown')).toBe(true);
    expect(mocks.log).toEqual([hit({ kind: 'card', column: 2, card: 22 })]);
    overlays.select(2, 3);
    mocks.log.length = 0;
    expect(press('ArrowUp')).toBe(false);
    expect(mocks.log).toEqual([]);
  });

  it('AD-12 up and down with no tail selected, outside Idle, or with Shift do nothing', () => {
    board();
    expect(press('ArrowUp')).toBe(false);
    expect(press('ArrowDown')).toBe(false);
    overlays.select(2, 1);
    expect(press('ArrowUp', { shift: true })).toBe(false);
    overlays.deselect();
    settle();
    board({ phase: 'composing' });
    expect(press('ArrowUp')).toBe(false);
    expect(mocks.log).toEqual([]);
  });

  it('AD-12 up is a no-op when the column cannot be picked up from that card (R-14 flag)', () => {
    board({ cards: { 2: [20, 21, 22] } });
    overlays.select(2, 1);
    board({ cards: { 2: [20, 21, 22] }, pick: { 2: false } });
    expect(press('ArrowUp')).toBe(false);
    expect(mocks.log).toEqual([]);
  });
});

describe('AD-12 board keys: WordCell digits (Composing, Place)', () => {
  it('AD-12 3-9 and 0 (= 10) add the cell top card as a free letter in Composing and focus the new tile', async () => {
    board({ phase: 'composing', add: [3, 6, 10], cellCards: { 3: [30], 6: [31, 32], 10: [33] } });
    expect(press('6')).toBe(true);
    await flush();
    expect(press('0')).toBe(true);
    await flush();
    expect(press('3')).toBe(true);
    await flush();
    expect(mocks.log.filter((e) => e !== 'cancel')).toEqual([
      'edit {"type":"addFreeLetter","cell":6}',
      'focusCard 32',
      'edit {"type":"addFreeLetter","cell":10}',
      'focusCard 33',
      'edit {"type":"addFreeLetter","cell":3}',
      'focusCard 30',
    ]);
  });

  it('AD-12 a used or empty cell, and 1 and 2, are no-ops in Composing', () => {
    board({ phase: 'composing', add: [4] });
    for (const key of ['3', '5', '7', '8', '9', '1', '2']) expect(press(key)).toBe(false);
    expect(mocks.log).toEqual([]);
  });

  it('AD-12 3-9 and 0 set the cell as the target in Place; an illegal cell and the current target (Flow 6: 6 keeps it) are no-ops', () => {
    board({ phase: 'place', target: [7, 10] });
    expect(press('7')).toBe(true);
    expect(press('0')).toBe(true);
    expect(press('6')).toBe(false);
    expect(press('3')).toBe(false);
    expect(mocks.log.filter((e) => e !== 'cancel')).toEqual([
      'edit {"type":"setTarget","cell":7}',
      'edit {"type":"setTarget","cell":10}',
    ]);
  });

  it('AD-12 a WordCell digit runs inside act(): it clears a tile selection and cancels a drag first', () => {
    board({ phase: 'composing', add: [6], cellCards: { 6: [31] } });
    overlays.selectTile(1);
    press('6');
    expect(mocks.log.slice(0, 2)).toEqual(['cancel', 'edit {"type":"addFreeLetter","cell":6}']);
    expect(overlays.tileSelection).toBeNull();
  });
});

describe('AD-12 board keys: focus moves along the tray and the strip', () => {
  it('AD-12 left and right move focus between tiles, no wrap, keeping the tile selection', () => {
    board({ phase: 'composing' });
    overlays.selectTile(2);
    onTile(2, 1, 3);
    expect(press('ArrowLeft')).toBe(true);
    expect(press('ArrowRight')).toBe(true);
    expect(mocks.log).toEqual(['cancel', 'focusCard 1', 'cancel', 'focusCard 3']);
    expect(overlays.tileSelection).toBe(2);
    mocks.log.length = 0;
    onTile(1, null, 2);
    expect(press('ArrowLeft')).toBe(false);
    onTile(3, 2, null, 'strip');
    expect(press('ArrowRight')).toBe(false);
    expect(mocks.log).toEqual([]);
  });

  it('AD-12 left and right do nothing with focus outside the tray and strip', () => {
    board({ phase: 'composing' });
    for (const focus of [
      { kind: 'column', column: 1, card: 10 },
      { kind: 'cell', cell: 3 },
      { kind: 'board' },
      { kind: 'control' },
    ]) {
      mocks.focus = focus;
      expect(press('ArrowLeft')).toBe(false);
      expect(press('ArrowRight')).toBe(false);
    }
    expect(mocks.log).toEqual([]);
  });

  it('AD-12 Shift+left and Shift+right move the focused tile one place in Composing and keep focus on it', async () => {
    board({ phase: 'composing', arrangement: [1, 2, 3] });
    onTile(2, 1, 3);
    expect(press('ArrowLeft', { shift: true })).toBe(true);
    await flush();
    expect(press('ArrowRight', { shift: true })).toBe(true);
    await flush();
    expect(mocks.log.filter((e) => e !== 'cancel')).toEqual([
      'edit {"type":"arrange","arrangement":[2,1,3]}',
      'focusCard 2',
      'edit {"type":"arrange","arrangement":[1,3,2]}',
      'focusCard 2',
    ]);
  });

  it('AD-12 Shift+arrow moves a strip card in Place; at either end it is a no-op, not an edit', () => {
    board({ phase: 'place', order: [1, 2, 3] });
    onTile(3, 2, null, 'strip');
    expect(press('ArrowLeft', { shift: true })).toBe(true);
    expect(press('ArrowRight', { shift: true })).toBe(false);
    onTile(1, null, 2, 'strip');
    expect(press('ArrowLeft', { shift: true })).toBe(false);
    expect(mocks.log.filter((e) => e !== 'cancel')).toEqual([
      'edit {"type":"setPlacementOrder","order":[1,3,2]}',
    ]);
  });

  it('AD-12 Shift+arrow with focus outside the tray and strip, or in Idle, is a no-op', () => {
    board({ phase: 'composing' });
    onColumn(1, 10);
    expect(press('ArrowLeft', { shift: true })).toBe(false);
    board();
    onTile(2, 1, 3);
    expect(press('ArrowRight', { shift: true })).toBe(false);
    expect(mocks.log).toEqual([]);
  });
});

describe('AD-12 board keys: Space and Enter', () => {
  it('AD-12 Space and Enter on a column card are the tap on it in Idle; Game over is inert', () => {
    board();
    onColumn(2, 21);
    expect(press(' ')).toBe(true);
    expect(press('Enter')).toBe(true);
    expect(mocks.log).toEqual([
      hit({ kind: 'card', column: 2, card: 21 }),
      hit({ kind: 'card', column: 2, card: 21 }),
    ]);
    mocks.log.length = 0;
    board({ status: 'gaveUp' });
    expect(press(' ')).toBe(false);
    expect(press('Enter')).toBe(false);
    expect(mocks.log).toEqual([]);
  });

  it('AD-12 Space and Enter on a column card tap it in Composing only for a destination card with a k; Place is inert', () => {
    board({
      phase: 'composing',
      kIfTapped: {
        2: new Map([
          [21, 2],
          [20, null],
        ]),
      },
    });
    onColumn(2, 21);
    expect(press(' ')).toBe(true);
    expect(press('Enter')).toBe(true);
    onColumn(2, 20);
    expect(press(' ')).toBe(false);
    onColumn(3, 31);
    expect(press('Enter')).toBe(false);
    board({ phase: 'place' });
    onColumn(2, 21);
    expect(press(' ')).toBe(false);
    expect(press('Enter')).toBe(false);
    expect(mocks.log).toEqual([
      hit({ kind: 'card', column: 2, card: 21 }),
      hit({ kind: 'card', column: 2, card: 21 }),
    ]);
  });

  it('AD-12 Enter on a column card never validates or confirms, whatever canValidate and canConfirm say; it taps only a destination card with a k', () => {
    for (const canValidate of [true, false]) {
      for (const canConfirm of [true, false]) {
        const flags = { canValidate, canConfirm };
        mocks.log.length = 0;
        board({
          phase: 'composing',
          flags,
          kIfTapped: {
            2: new Map([
              [21, 2],
              [20, null],
            ]),
          },
        });
        onColumn(2, 21);
        expect(press('Enter')).toBe(true);
        onColumn(2, 20);
        expect(press('Enter')).toBe(false);
        onTile(2, 1, 3);
        expect(press('Enter')).toBe(canValidate);
        expect(mocks.log).toEqual([
          hit({ kind: 'card', column: 2, card: 21 }),
          ...(canValidate ? ['cancel', 'validate'] : []),
        ]);
        mocks.log.length = 0;
        board({ phase: 'place', flags });
        onColumn(2, 21);
        expect(press('Enter')).toBe(false);
        onTile(5, 4, null, 'strip');
        expect(press('Enter')).toBe(canConfirm);
        expect(ACTED(mocks.log)).toEqual(canConfirm ? ['confirm'] : []);
      }
    }
  });

  it('AD-12 Space on a tile or strip card is the tap (select, swap, return) and keeps the tile selection for it', () => {
    board({ phase: 'composing', arrangement: [1, 2, 3] });
    onTile(2, 1, 3);
    overlays.selectTile(1);
    expect(press(' ')).toBe(true);
    board({ phase: 'place', order: [4, 5] });
    onTile(5, 4, null, 'strip');
    expect(press(' ')).toBe(true);
    expect(mocks.log).toEqual([hit({ kind: 'tile', card: 2 }), hit({ kind: 'tile', card: 5 })]);
    expect(overlays.tileSelection).toBe(1);
  });

  it('AD-12 Space on a tile in Idle, or a card that is not a live tile, does nothing', () => {
    board();
    onTile(2, 1, 3);
    expect(press(' ')).toBe(false);
    board({ phase: 'composing', arrangement: [7, 8] });
    expect(press(' ')).toBe(false);
    expect(mocks.log).toEqual([]);
  });

  it('AD-12 Enter on a tile or a strip card validates (Composing, canValidate, dictionary ready) or confirms (Place, canConfirm), never taps', () => {
    board({ phase: 'composing' });
    onTile(2, 1, 3);
    expect(press('Enter')).toBe(true);
    board({ phase: 'composing', flags: { canValidate: false } });
    expect(press('Enter')).toBe(false);
    board({ phase: 'composing' });
    mocks.dictionary.state = 'loading';
    expect(press('Enter')).toBe(false);
    mocks.dictionary.state = 'ready';
    board({ phase: 'place' });
    onTile(5, 4, null, 'strip');
    expect(press('Enter')).toBe(true);
    board({ phase: 'place', flags: { canConfirm: false } });
    expect(press('Enter')).toBe(false);
    expect(ACTED(mocks.log)).toEqual(['validate', 'confirm']);
  });

  it('AD-12 Enter on the Board container (or nothing focused) validates in Composing and confirms in Place; in Idle and Game over it does nothing', () => {
    board({ phase: 'composing' });
    expect(press('Enter')).toBe(true);
    board({ phase: 'place' });
    expect(press('Enter')).toBe(true);
    board();
    expect(press('Enter')).toBe(false);
    board({ status: 'won' });
    expect(press('Enter')).toBe(false);
    expect(ACTED(mocks.log)).toEqual(['validate', 'confirm']);
  });

  it('AD-12 Space and Enter leave a focused native control to it: nothing acts, nothing is default-prevented', () => {
    board({ phase: 'composing' });
    mocks.focus = { kind: 'control' };
    expect(press(' ')).toBe(false);
    expect(press('Enter')).toBe(false);
    expect(mocks.log).toEqual([]);
  });

  it('AD-12 Space on a tile removes a free letter and focus goes to the next tile, the previous if it was last, the board when none is left', async () => {
    board({ phase: 'composing', arrangement: [1, 2, 3] });
    mocks.tiles = [1, 2, 3];
    onTile(2, 1, 3);
    mocks.onActivate = () => {
      mocks.tiles = [1, 3];
    };
    press(' ');
    await flush();
    expect(mocks.log).toContain('focusCard 3');
    mocks.log.length = 0;
    mocks.tiles = [1, 2, 3];
    onTile(3, 2, null);
    mocks.onActivate = () => {
      mocks.tiles = [1, 2];
    };
    press(' ');
    await flush();
    expect(mocks.log).toContain('focusCard 2');
    mocks.log.length = 0;
    board({ phase: 'composing', arrangement: [1] });
    mocks.tiles = [1];
    onTile(1, null, null);
    mocks.onActivate = () => {
      mocks.tiles = [];
    };
    press(' ');
    await flush();
    expect(mocks.log).toContain('focusBoard');
  });

  it('AD-12 Space on the last movable tile while only destination-block tiles remain: liveTiles is empty and focus goes to the board', async () => {
    board({ phase: 'composing', arrangement: [1, 2] });
    mocks.tiles = [1];
    onTile(1, null, null);
    mocks.onActivate = () => {
      mocks.tiles = [];
    };
    press(' ');
    await flush();
    expect(mocks.log).toContain('focusBoard');
    expect(mocks.log.some((entry) => entry.startsWith('focusCard'))).toBe(false);
  });

  it('AD-12 Space on a tile that is only selected keeps focus on it', async () => {
    board({ phase: 'composing', arrangement: [1, 2] });
    mocks.tiles = [1, 2];
    onTile(1, null, 2);
    press(' ');
    await flush();
    expect(mocks.log).toContain('focusCard 1');
  });
});

describe('AD-12 board keys: WordCell Enter and Space', () => {
  it('AD-12 Enter on a non-empty WordCell is the tap: it opens the view in Idle and Game over; an empty cell does nothing', () => {
    board({ cellCards: { 4: [40] } });
    onCell(4);
    expect(press('Enter')).toBe(true);
    onCell(5);
    expect(press('Enter')).toBe(false);
    board({ status: 'won', cellCards: { 4: [40] } });
    onCell(4);
    expect(press('Enter')).toBe(true);
    expect(mocks.log).toEqual([
      hit({ kind: 'wordcell', cell: 4 }),
      hit({ kind: 'wordcell', cell: 4 }),
    ]);
  });

  it('AD-12 Enter on an empty WordCell with a tail selected deselects (no view)', () => {
    board();
    overlays.select(2, 1);
    onCell(5);
    expect(press('Enter')).toBe(true);
    expect(mocks.log).toEqual([hit({ kind: 'wordcell', cell: 5 })]);
  });

  it('AD-12 Enter on a WordCell adds the free letter in Composing (focus follows the new tile) and sets the target in Place; a used cell, an empty cell and the current target do nothing', async () => {
    board({ phase: 'composing', add: [6], cellCards: { 6: [61, 62], 7: [70] } });
    onCell(6);
    expect(press('Enter')).toBe(true);
    onCell(7);
    expect(press('Enter')).toBe(false);
    onCell(8);
    expect(press('Enter')).toBe(false);
    await flush();
    expect(mocks.log).toEqual([hit({ kind: 'wordcell', cell: 6 }), 'focusCard 62']);
    mocks.log.length = 0;
    board({ phase: 'place', target: [9] });
    onCell(9);
    expect(press('Enter')).toBe(true);
    onCell(10);
    expect(press('Enter')).toBe(false);
    expect(mocks.log).toEqual([hit({ kind: 'wordcell', cell: 9 })]);
  });

  it('AD-12 Space on a non-empty WordCell opens the sticky view in every phase and runs inside act()', () => {
    for (const phase of ['idle', 'composing', 'place'] as const) {
      board({ phase, cellCards: { 4: [40] } });
      onCell(4);
      mocks.log.length = 0;
      expect(press(' ')).toBe(true);
      expect(overlays.viewCell).toBe(4);
      expect(mocks.log).toEqual(['cancel']);
      overlays.close('wordcellView');
      settle();
    }
    board({ status: 'gaveUp', cellCards: { 4: [40] } });
    onCell(4);
    expect(press(' ')).toBe(true);
    expect(overlays.viewCell).toBe(4);
  });

  it('AD-12 Space on an empty WordCell with nothing selected does nothing; with a tail selected it only deselects, no view', () => {
    board();
    onCell(5);
    expect(press(' ')).toBe(false);
    overlays.select(2, 1);
    expect(press(' ')).toBe(true);
    expect(overlays.selection).toBeNull();
    expect(overlays.viewCell).toBeNull();
  });

  it('AD-12 Space on a non-empty WordCell with a tail selected clears the selection (popping its entry) first, then opens the view', () => {
    board({ cellCards: { 4: [40] } });
    overlays.select(2, 1);
    onCell(4);
    expect(press(' ')).toBe(true);
    expect(overlays.selection).toBeNull();
    expect(overlays.viewCell).toBe(4);
  });

  it('AD-12 Space with the sticky view open over a tail selection closes the view, clears the selection and does not throw (non-empty and empty cell)', () => {
    board({ cellCards: { 4: [40], 6: [60] } });
    overlays.select(2, 1);
    overlays.openView(6);
    expect(overlays.top).toBe('wordcellView');
    onCell(4);
    expect(() => press(' ')).not.toThrow();
    expect(overlays.selection).toBeNull();
    expect(overlays.viewCell).toBe(4);
    overlays.close('wordcellView');
    settle();
    overlays.select(2, 1);
    overlays.openView(6);
    onCell(5);
    expect(() => press(' ')).not.toThrow();
    expect(overlays.selection).toBeNull();
    expect(overlays.viewCell).toBeNull();
  });

  it('AD-12 there is no giveUp key row', () => {
    expect(Object.keys(keys.ROWS)).not.toContain('giveUp');
  });

  it('AD-12 there is no giveUp key label entry', async () => {
    const { KEY_LABELS } = await import('./key-labels');
    expect(Object.keys(KEY_LABELS)).not.toContain('giveUp');
  });

  it('AD-12 the view-opening keys do nothing under the expanded end sheet', () => {
    board({ status: 'won', cellCards: { 4: [40] } });
    overlays.openDeferred(overlays.deferEndSheetOpen());
    onCell(4);
    expect(press(' ')).toBe(false);
    expect(press('Enter')).toBe(false);
    expect(overlays.viewCell).toBeNull();
  });
});

describe('AD-12 board keys: k, Flip and Shift', () => {
  it('AD-12 + and = raise k, - lowers it, only while the control is enabled', () => {
    board({ phase: 'composing', k: 2, flags: { canIncK: true, canDecK: true } });
    expect(press('+')).toBe(true);
    expect(press('=')).toBe(true);
    expect(press('-')).toBe(true);
    expect(mocks.log.filter((e) => e !== 'cancel')).toEqual(['setK 3', 'setK 3', 'setK 1']);
    mocks.log.length = 0;
    board({ phase: 'composing', k: 0 });
    expect(press('+')).toBe(false);
    expect(press('-')).toBe(false);
    expect(mocks.log).toEqual([]);
  });

  it('AD-12 Shift is ignored for + and =, F flips only while Flip is enabled', () => {
    board({ phase: 'composing', k: 1, flags: { canIncK: true } });
    expect(press('+', { shift: true })).toBe(true);
    expect(press('f')).toBe(true);
    expect(press('F', { shift: true })).toBe(true);
    board({ phase: 'composing', flags: { canFlip: false } });
    expect(press('f')).toBe(false);
    expect(ACTED(mocks.log)).toEqual(['setK 2', 'flip', 'flip']);
  });

  it('AD-12 +, - and F in Idle and Place are no-ops (their controls are not enabled)', () => {
    board();
    expect(press('+')).toBe(false);
    expect(press('-')).toBe(false);
    board({ phase: 'place', flags: { canFlip: false } });
    expect(press('f')).toBe(false);
    expect(mocks.log).toEqual([]);
  });

  it('AD-12 a Shift chord with no row, and Ctrl/Cmd/Alt board chords, do nothing', () => {
    board({ phase: 'composing', flags: { canIncK: true } });
    onTile(2, 1, 3);
    expect(press('ArrowUp', { shift: true })).toBe(false);
    expect(press('ArrowDown', { shift: true })).toBe(false);
    expect(press(' ', { shift: true })).toBe(false);
    expect(press('Enter', { shift: true })).toBe(false);
    for (const mods of [{ ctrl: true }, { meta: true }, { alt: true }] as Mods[]) {
      expect(press('+', mods)).toBe(false);
      expect(press('f', mods)).toBe(false);
      expect(press('ArrowLeft', mods)).toBe(false);
      expect(press('Enter', mods)).toBe(false);
      expect(press(' ', mods)).toBe(false);
    }
    expect(mocks.log).toEqual([]);
  });

  it('AD-12 every board row is single: a held key does not repeat', () => {
    board({ phase: 'composing', flags: { canIncK: true, canFlip: true } });
    onTile(2, 1, 3);
    expect(press('+', { repeat: true })).toBe(false);
    expect(press('f', { repeat: true })).toBe(false);
    expect(press('ArrowLeft', { repeat: true })).toBe(false);
    expect(press('Enter', { repeat: true })).toBe(false);
    expect(press(' ', { repeat: true })).toBe(false);
    board();
    expect(press('1', { repeat: true })).toBe(false);
    expect(mocks.log).toEqual([]);
    for (const id of Object.keys(keys.ROWS) as (keyof typeof keys.ROWS)[]) {
      expect(keys.ROWS[id].single).toBe(id !== 'undo' && id !== 'redo');
    }
  });

  it('AD-12 the rows carry the key labels the tooltips read', () => {
    const labels = {
      undo: 'Z',
      redo: 'Y',
      validate: 'Enter',
      confirm: 'Enter',
      'k-': '-',
      'k+': '+',
      flip: 'F',
      menu: 'M',
      newGame: 'N',
      howToPlay: '?',
    } as const;
    for (const [id, label] of Object.entries(labels)) {
      expect(keys.ROWS[id as keyof typeof keys.ROWS].label).toBe(label);
    }
    for (const row of Object.values(keys.ROWS)) expect(row.label.length).toBeGreaterThan(0);
  });

  it('AD-12 the suspension gate holds for board keys: no board key acts under a menu, panel or dialog', () => {
    board({ phase: 'composing', flags: { canIncK: true } });
    overlays.open('menu');
    for (const key of ['+', 'f', 'Enter', '3', 'ArrowLeft']) expect(press(key)).toBe(false);
    expect(mocks.log).toEqual([]);
  });
});

describe('AD-12 board keys: a pending pop', () => {
  it('AD-12 1-8 and the tail keys wait for a pending pop, then act on the then-current state', () => {
    board({ cards: { 2: [20, 21, 22] } });
    overlays.select(2, 1);
    overlays.deselect();
    expect(press('3')).toBe(false);
    expect(mocks.log).toEqual([]);
    settle();
    expect(mocks.log).toEqual([hit({ kind: 'card', column: 3, card: 31 })]);
    mocks.log.length = 0;
    overlays.select(2, 2);
    overlays.deselect();
    overlays.select(2, 1);
    settle();
    expect(press('ArrowUp')).toBe(true);
  });

  it('AD-12 Idle Space and Enter on a column card wait for a pending pop; in Composing and Place they are dropped', () => {
    board();
    overlays.openView(3);
    overlays.close('wordcellView');
    onColumn(2, 21);
    press(' ');
    expect(mocks.log).toEqual([]);
    settle();
    expect(mocks.log).toEqual([hit({ kind: 'card', column: 2, card: 21 })]);
    mocks.log.length = 0;
    board({ phase: 'composing', kIfTapped: { 2: new Map([[21, 2]]) } });
    overlays.openView(3);
    overlays.close('wordcellView');
    press('Enter');
    settle();
    expect(mocks.log).toEqual([]);
  });

  it('AD-12 a WordCell key during a pending pop: Space waits in Idle and Game over, Enter waits there and is dropped in Composing and Place', () => {
    for (const status of ['playing', 'won'] as const) {
      board({ status, cellCards: { 4: [40] } });
      onCell(4);
      overlays.openView(5);
      overlays.close('wordcellView');
      press(' ');
      expect(overlays.viewCell).toBeNull();
      settle();
      expect(overlays.viewCell).toBe(4);
      overlays.close('wordcellView');
      settle();
      overlays.openView(5);
      overlays.close('wordcellView');
      mocks.log.length = 0;
      press('Enter');
      expect(mocks.log).toEqual([]);
      settle();
      expect(mocks.log).toEqual([hit({ kind: 'wordcell', cell: 4 })]);
    }
    for (const phase of ['composing', 'place'] as const) {
      board({ phase, add: [4], target: [4], cellCards: { 4: [40] } });
      onCell(4);
      overlays.openView(5);
      overlays.close('wordcellView');
      mocks.log.length = 0;
      press('Enter');
      settle();
      expect(mocks.log).toEqual([]);
    }
  });

  it('AD-12 up and down during a pending pop do nothing and are not default-prevented; at settle each acts on the then-current selection', () => {
    board({ cards: { 2: [20, 21, 22] } });
    overlays.select(2, 2);
    overlays.deselect();
    overlays.select(2, 2);
    mocks.log.length = 0;
    expect(press('ArrowUp')).toBe(false);
    expect(press('ArrowDown')).toBe(false);
    expect(mocks.log).toEqual([]);
    settle();
    expect(mocks.log).toEqual([
      hit({ kind: 'card', column: 2, card: 20 }),
      hit({ kind: 'card', column: 2, card: 22 }),
    ]);
  });

  it('AD-12 Space on a WordCell waits for a pending pop in Composing and Place too (the view row is in WAITS)', () => {
    for (const phase of ['composing', 'place'] as const) {
      board({ phase, cellCards: { 4: [40] } });
      onCell(4);
      overlays.openView(5);
      overlays.close('wordcellView');
      expect(press(' ')).toBe(false);
      expect(overlays.viewCell).toBeNull();
      settle();
      expect(overlays.viewCell).toBe(4);
      overlays.close('wordcellView');
      settle();
    }
  });

  it('AD-12 tile activation, focus moves, k, Flip and the WordCell digits are dropped during a pending pop', () => {
    board({ phase: 'composing', add: [6], cellCards: { 6: [61] }, flags: { canIncK: true } });
    overlays.openView(5);
    overlays.close('wordcellView');
    onTile(2, 1, 3);
    for (const key of [' ', 'ArrowLeft', '+', 'f', '6']) press(key);
    settle();
    expect(mocks.log).toEqual([]);
  });
});
