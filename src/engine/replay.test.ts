import { describe, expect, it } from 'vitest';
import { dealIds } from './deal';
import { EngineError } from './errors';
import { EN } from './lang/en';
import { checkSession, replay, replayFrom, type Start, status } from './replay';
import { createSession, type Move, SESSION_VERSION, type Session } from './session';
import type { CardId, WordCellNumber } from './types';

// --- helpers --------------------------------------------------------------------------------

function deepFreeze<T>(value: T, seen = new WeakSet<object>()): T {
  if ((typeof value === 'object' && value !== null) || typeof value === 'function') {
    const object = value as object;
    if (seen.has(object)) return value;
    seen.add(object);
    for (const key of Reflect.ownKeys(object))
      deepFreeze((object as Record<PropertyKey, unknown>)[key], seen);
    Object.freeze(object);
  }
  return value;
}

function expectEngineError(fn: () => unknown, check: string): void {
  let thrown: unknown;
  try {
    fn();
  } catch (e) {
    thrown = e;
  }
  expect(thrown).toBeInstanceOf(EngineError);
  expect((thrown as EngineError).check).toBe(check);
}

type Eight<T> = [T, T, T, T, T, T, T, T];

/**
 * A D2 Start from letter strings: columns top → bottom (column 1 first), cells bottom → top.
 * Each letter takes the lowest free CardId for it; `'Q'` is the QU card.
 */
function startOf(
  columns: readonly string[],
  cells: Partial<Record<WordCellNumber, string>> = {},
): Start {
  const used = new Set<CardId>();
  const take = (ch: string): CardId => {
    const letter = ch === 'Q' ? 'QU' : ch;
    const id = EN.letters.findIndex((l, i) => l === letter && !used.has(i));
    if (id < 0) throw new Error(`no free card for ${letter}`);
    used.add(id);
    return id;
  };
  const cols = Array.from({ length: 8 }, (_, i) => [...(columns[i] ?? '')].map(take));
  const cellStacks = Array.from({ length: 8 }, (_, i) =>
    [...(cells[(i + 3) as WordCellNumber] ?? '')].map(take),
  );
  return deepFreeze({
    columns: cols as Eight<CardId[]>,
    cells: cellStacks as Eight<CardId[]>,
  });
}

function sessionOf(
  moves: readonly Move[],
  cursor: Session['cursor'] = { index: moves.length, phase: 'idle' },
  fields: Record<string, unknown> = {},
): Session {
  return deepFreeze({
    version: SESSION_VERSION,
    seed: 1,
    moves,
    cursor,
    gaveUp: false,
    activeMs: 0,
    ...fields,
  } as Session);
}

function omit(move: Move, key: keyof Move): Move {
  const copy: Record<string, unknown> = { ...move };
  delete copy[key];
  return copy as unknown as Move;
}

const LANG = deepFreeze(EN);
const run = (start: Start, session: Session) =>
  replayFrom(deepFreeze(start), deepFreeze(session), LANG);

// --- base (Start, Session) pair -------------------------------------------------------------

const S0 = startOf(['XYZAB', 'EDCT'], { 3: 'LM', 4: 'N' });
const [X, Y, Z, A, B] = S0.columns[0];
const [E, D, C, T] = S0.columns[1];
const [L, M] = S0.cells[0];
const [N] = S0.cells[1];

/** Committed: S = A B (column 1), D = T (column 2), free letter M (cell 3), target 4. */
const BASE: Move = {
  sourceColumn: 1,
  sourceCount: 2,
  destinationColumn: 2,
  destinationCount: 1,
  destinationSide: 'left',
  freeLetters: [3],
  arrangement: [A, B, M],
  reached: 'committed',
  targetCell: 4,
  placementOrder: [T, A, B, M],
};
const VALID = sessionOf([BASE]);

/** R-20: A B onto its own column with k = n = 3 (X Y Z), target 5. */
const SELF_DROP: Move = {
  sourceColumn: 1,
  sourceCount: 2,
  destinationColumn: 1,
  destinationCount: 3,
  destinationSide: 'left',
  freeLetters: [],
  arrangement: [A, B],
  reached: 'committed',
  targetCell: 5,
  placementOrder: [X, Y, Z, A, B],
};

/** After BASE: column 1 X Y Z, column 2 E D C, cell 3 L, cell 4 T A B M. */
const PLACE_DRAFT: Move = {
  sourceColumn: 1,
  sourceCount: 1,
  destinationColumn: 2,
  destinationCount: 1,
  destinationSide: 'left',
  freeLetters: [3],
  arrangement: [Z, L],
  reached: 'place',
  targetCell: 3,
  placementOrder: [C, Z, L],
};

/** After BASE: a Composing-reached 2-letter draft (Z onto C). */
const TWO_LETTERS: Move = {
  sourceColumn: 1,
  sourceCount: 1,
  destinationColumn: 2,
  destinationCount: 1,
  destinationSide: 'left',
  freeLetters: [],
  arrangement: [Z],
  reached: 'composing',
};

/** Redo tail (Q-41): BASE, committed draft at cursor 1 (Place), committed tail move, Composing last. */
const REDO_DRAFT: Move = {
  ...PLACE_DRAFT,
  freeLetters: [4],
  arrangement: [Z, M],
  reached: 'committed',
  placementOrder: [M, C, Z],
};
/** Uses cell 3's top Z, which only REDO_DRAFT exposes (on the prefix cell 3's top is L). */
const REDO_T1: Move = {
  sourceColumn: 1,
  sourceCount: 1,
  destinationColumn: 2,
  destinationCount: 1,
  destinationSide: 'left',
  freeLetters: [3],
  arrangement: [Y, Z],
  reached: 'committed',
  targetCell: 3,
  placementOrder: [D, Y, Z],
};
/** Below committed and last; breaks R-36, which Composing does not check. */
const REDO_T2: Move = {
  sourceColumn: 1,
  sourceCount: 1,
  destinationColumn: 2,
  destinationCount: 1,
  destinationSide: 'left',
  freeLetters: [],
  arrangement: [X],
  reached: 'composing',
};
const REDO_TAIL = sessionOf([BASE, REDO_DRAFT, REDO_T1, REDO_T2], { index: 1, phase: 'place' });

/** R-41 / R-52 / R-60: target 3 is free letter M's cell; N from cell 4; D = C T, side right. */
const TARGET_FREE_CELL: Move = {
  sourceColumn: 1,
  sourceCount: 2,
  destinationColumn: 2,
  destinationCount: 2,
  destinationSide: 'right',
  freeLetters: [3, 4],
  arrangement: [A, M, B, N],
  reached: 'committed',
  targetCell: 3,
  placementOrder: [C, A, M, B, N, T],
};
const TARGET_FREE_CELL_SESSION = sessionOf([TARGET_FREE_CELL]);

/** R-62: every column cleared by whole-column k = 0 self-drops of non-words. */
const WON_START = startOf(['ZXJ', 'VWK']);
const clearColumn = (column: number): Move => ({
  sourceColumn: column,
  sourceCount: 3,
  destinationColumn: column,
  destinationCount: 0,
  destinationSide: 'left',
  freeLetters: [],
  arrangement: WON_START.columns[column - 1],
  reached: 'committed',
  targetCell: 3,
  placementOrder: WON_START.columns[column - 1],
});
const WON = sessionOf([clearColumn(1), clearColumn(2)]);

function eight(fill: Partial<Record<number, CardId[]>>): Eight<CardId[]> {
  return Array.from({ length: 8 }, (_, i) => fill[i] ?? []) as Eight<CardId[]>;
}

// --- AD-7 pre-replay ------------------------------------------------------------------------

describe('checkSession (AD-7 pre-replay)', () => {
  const composingBase = { ...BASE, reached: 'composing' } as Move;
  const cases: [string, Session, string][] = [
    ['seed -1', sessionOf([BASE], undefined, { seed: -1 }), 'seed-uint32'],
    ['seed 4294967296', sessionOf([BASE], undefined, { seed: 4294967296 }), 'seed-uint32'],
    ['seed 1.5', sessionOf([BASE], undefined, { seed: 1.5 }), 'seed-uint32'],
    ['seed NaN', sessionOf([BASE], undefined, { seed: Number.NaN }), 'seed-uint32'],
    ['seed Infinity', sessionOf([BASE], undefined, { seed: Infinity }), 'seed-uint32'],
    ['activeMs -1', sessionOf([BASE], undefined, { activeMs: -1 }), 'ad7-active-ms'],
    ['activeMs 1.5', sessionOf([BASE], undefined, { activeMs: 1.5 }), 'ad7-active-ms'],
    ['activeMs 2^53', sessionOf([BASE], undefined, { activeMs: 2 ** 53 }), 'ad7-active-ms'],
    ['gaveUp not boolean', sessionOf([BASE], undefined, { gaveUp: 'no' }), 'ad7-gave-up-type'],
    [
      'cursor.index above moves.length',
      sessionOf([BASE], { index: 2, phase: 'idle' }),
      'ad7-cursor-index',
    ],
    ['cursor.index -1', sessionOf([BASE], { index: -1, phase: 'idle' }), 'ad7-cursor-index'],
    [
      'phase composing with no draft',
      sessionOf([BASE], { index: 1, phase: 'composing' }),
      'ad7-cursor-phase',
    ],
    [
      'phase place above the draft reached',
      sessionOf([composingBase], { index: 0, phase: 'place' }),
      'ad7-cursor-phase',
    ],
    [
      'gaveUp outside idle',
      sessionOf([BASE], { index: 0, phase: 'place' }, { gaveUp: true }),
      'ad7-gave-up-idle',
    ],
    [
      'committed move missing only placementOrder',
      sessionOf([omit(BASE, 'placementOrder')]),
      'ad7-place-fields',
    ],
    [
      'committed move missing targetCell',
      sessionOf([omit(BASE, 'targetCell')]),
      'ad7-place-fields',
    ],
    ['composing move with Place fields', sessionOf([composingBase]), 'ad7-place-fields'],
    [
      'k = 0 with side right',
      sessionOf([{ ...BASE, destinationCount: 0, destinationSide: 'right' }]),
      'ad7-k0-side',
    ],
    [
      'a non-committed move before cursor.index',
      sessionOf([{ ...BASE, reached: 'place' }]),
      's2-committed-prefix',
    ],
    [
      'a non-last move below committed',
      sessionOf([{ ...BASE, reached: 'place' }, BASE], { index: 0, phase: 'place' }),
      's2-last-only',
    ],
    [
      'an unknown Session field',
      sessionOf([BASE], undefined, { extra: 1 }),
      'ad7-unknown-session-field',
    ],
    [
      'an unknown cursor field',
      sessionOf([BASE], { index: 1, phase: 'idle', extra: 1 } as Session['cursor']),
      'ad7-unknown-cursor-field',
    ],
    ['an unknown Move field', sessionOf([{ ...BASE, extra: 1 } as Move]), 'ad7-unknown-move-field'],
  ];
  for (const [name, session, code] of cases)
    it(`§2 rejects ${name} (${code})`, () => {
      expectEngineError(() => checkSession(session), code);
      expectEngineError(() => run(S0, session), code);
    });

  it('§2 the dealt replay rejects a non-uint32 seed', () => {
    for (const seed of [-1, 4294967296, 1.5, Number.NaN, Infinity])
      expectEngineError(() => replay(sessionOf([], undefined, { seed }), LANG), 'seed-uint32');
  });

  it('§2 accepts a -0 seed and a -0 activeMs', () => {
    const session = deepFreeze({ ...createSession(-0), activeMs: -0 });
    expect(() => checkSession(session)).not.toThrow();
    expect(replay(session, LANG).columns).toStrictEqual(dealIds(0));
  });
});

// --- per move -------------------------------------------------------------------------------

describe('replay per-move checks (§2)', () => {
  const cases: [string, Move, string][] = [
    ['sourceCount 0 (R-13)', { ...BASE, sourceCount: 0 }, 'r13-source-count'],
    ['sourceCount above the column size', { ...BASE, sourceCount: 6 }, 'r13-source-count'],
    [
      'a self-drop with k = the column size before S is removed (R-31, R-21)',
      { ...BASE, destinationColumn: 1, destinationCount: 5 },
      'r31-destination-count',
    ],
    [
      'k = 1 on an empty destination (R-31, R-22)',
      { ...BASE, destinationColumn: 3, destinationCount: 1 },
      'r31-destination-count',
    ],
    [
      'k = 0 on a non-empty destination (R-31, Q-12)',
      { ...BASE, destinationCount: 0 },
      'r31-destination-count',
    ],
    [
      'a free-letter cell listed twice (R-33)',
      { ...BASE, freeLetters: [3, 3] },
      'r33-free-letter-duplicate',
    ],
    [
      'an empty cell listed twice: duplicate before empty (R-33)',
      { ...BASE, freeLetters: [5, 5] },
      'r33-free-letter-duplicate',
    ],
    ['an empty free-letter cell (R-33)', { ...BASE, freeLetters: [3, 5] }, 'r33-free-letter-empty'],
    [
      'freeLetters tops unequal to the non-S arrangement cards',
      { ...BASE, freeLetters: [4] },
      's2-free-letters-set',
    ],
    [
      'an arrangement missing an S card (R-35)',
      { ...BASE, arrangement: [A, M] },
      'r35-arrangement',
    ],
    [
      'a committed word of 2 letters (R-36)',
      {
        ...BASE,
        sourceCount: 1,
        freeLetters: [],
        arrangement: [B],
        targetCell: 3,
        placementOrder: [T, B],
      },
      'r36-letter-count',
    ],
    ['a target above the letter count (R-40)', { ...BASE, targetCell: 5 }, 'r40-target-cell'],
    [
      'a placementOrder missing a word card (R-50)',
      { ...BASE, placementOrder: [T, A, B] },
      'r50-placement-order',
    ],
  ];
  for (const [name, move, code] of cases)
    it(`§2 rejects ${name}`, () => {
      expectEngineError(() => run(S0, sessionOf([move])), code);
    });

  it('§2 the base pair replays', () => {
    expect(run(S0, VALID)).toStrictEqual({
      columns: [[X, Y, Z], [E, D, C], [], [], [], [], [], []],
      cells: [[L], [N, T, A, B, M], [], [], [], [], [], []],
    });
  });

  it('§2 accepts a whole-column source tail (R-11)', () => {
    const move: Move = {
      ...BASE,
      sourceColumn: 2,
      sourceCount: 4,
      destinationColumn: 1,
      freeLetters: [],
      arrangement: [E, D, C, T],
      targetCell: 5,
      placementOrder: [B, E, D, C, T],
    };
    expect(run(S0, sessionOf([move])).columns[1]).toStrictEqual([]);
  });

  it('§2 accepts a committed self-drop with k = n (R-20)', () => {
    expect(() => run(S0, sessionOf([SELF_DROP]))).not.toThrow();
  });

  it('§2 accepts an empty destination with k = 0 (R-22)', () => {
    const move: Move = {
      ...BASE,
      sourceCount: 1,
      destinationColumn: 3,
      destinationCount: 0,
      freeLetters: [3, 4],
      arrangement: [B, M, N],
      targetCell: 3,
      placementOrder: [B, M, N],
    };
    expect(() => run(S0, sessionOf([move]))).not.toThrow();
  });

  it("§2 accepts a committed destinationSide 'right' word (R-30)", () => {
    expect(() => run(S0, sessionOf([{ ...BASE, destinationSide: 'right' }]))).not.toThrow();
  });

  it('§2 accepts S and F interleaved, freeLetters reversed from arrangement (R-34, D8)', () => {
    const move: Move = {
      ...BASE,
      freeLetters: [4, 3],
      arrangement: [A, M, B, N],
      targetCell: 5,
      placementOrder: [T, A, M, B, N],
    };
    expect(() => run(S0, sessionOf([move]))).not.toThrow();
  });

  it("§2 accepts a target equal to a free letter's source cell (R-41)", () => {
    expect(() => run(S0, TARGET_FREE_CELL_SESSION)).not.toThrow();
  });

  it('§2 QU as D gives a 3-letter word: target 3 replays, 4 throws (R-40)', () => {
    const start = startOf(['Q', 'A']);
    const [qu] = start.columns[0];
    const [a] = start.columns[1];
    const move: Move = {
      sourceColumn: 2,
      sourceCount: 1,
      destinationColumn: 1,
      destinationCount: 1,
      destinationSide: 'left',
      freeLetters: [],
      arrangement: [a],
      reached: 'committed',
      targetCell: 3,
      placementOrder: [qu, a],
    };
    expect(run(start, sessionOf([move])).cells[0]).toStrictEqual([qu, a]);
    expectEngineError(() => run(start, sessionOf([{ ...move, targetCell: 4 }])), 'r40-target-cell');
  });

  it('§2 a 9-card word with QU reaches WordCell 10; without QU it throws (R-40)', () => {
    const nineCards = (start: Start): Move => ({
      sourceColumn: 1,
      sourceCount: 9,
      destinationColumn: 1,
      destinationCount: 0,
      destinationSide: 'left',
      freeLetters: [],
      arrangement: start.columns[0],
      reached: 'committed',
      targetCell: 10,
      placementOrder: start.columns[0],
    });
    const withQu = startOf(['QABCDEFGH']);
    expect(run(withQu, sessionOf([nineCards(withQu)])).cells[7]).toStrictEqual(withQu.columns[0]);
    const plain = startOf(['IABCDEFGH']);
    expectEngineError(() => run(plain, sessionOf([nineCards(plain)])), 'r40-target-cell');
  });

  it('§2 an 11-letter word without QU reaches WordCell 10 (R-40)', () => {
    const start = startOf(['IABCDEFGHJK']);
    const move: Move = {
      sourceColumn: 1,
      sourceCount: 11,
      destinationColumn: 1,
      destinationCount: 0,
      destinationSide: 'left',
      freeLetters: [],
      arrangement: start.columns[0],
      reached: 'committed',
      targetCell: 10,
      placementOrder: start.columns[0],
    };
    expect(run(start, sessionOf([move])).cells[7]).toStrictEqual(start.columns[0]);
  });

  it('§2 rejects an Idle pending draft that breaks a rule of its reached', () => {
    const session = sessionOf([BASE, { ...PLACE_DRAFT, sourceCount: 4 }], {
      index: 1,
      phase: 'idle',
    });
    expectEngineError(() => run(S0, session), 'r13-source-count');
  });

  it('§2 rejects a broken redo-tail move behind an Idle cursor (Q-41)', () => {
    const t1 = { ...REDO_T1, sourceCount: 3 };
    const session = sessionOf([BASE, REDO_DRAFT, t1, REDO_T2], { index: 1, phase: 'idle' });
    expectEngineError(() => run(S0, session), 'r13-source-count');
  });

  it('§2 checks a Composing-reached draft against the Composing rules', () => {
    const cursor = { index: 1, phase: 'composing' } as const;
    expectEngineError(
      () => run(S0, sessionOf([BASE, { ...TWO_LETTERS, arrangement: [Z, L] }], cursor)),
      's2-free-letters-set',
    );
    expectEngineError(
      () => run(S0, sessionOf([BASE, { ...TWO_LETTERS, sourceCount: 0 }], cursor)),
      'r13-source-count',
    );
  });

  it('§2 an Idle pending Composing-reached 2-letter draft replays (R-36 unchecked)', () => {
    expect(() =>
      run(S0, sessionOf([BASE, TWO_LETTERS], { index: 1, phase: 'idle' })),
    ).not.toThrow();
  });

  it('§2 checks follow reached, not cursor.phase: a Place-reached 2-letter draft throws', () => {
    const draft: Move = { ...TWO_LETTERS, reached: 'place', targetCell: 3, placementOrder: [C, Z] };
    expectEngineError(
      () => run(S0, sessionOf([BASE, draft], { index: 1, phase: 'composing' })),
      'r36-letter-count',
    );
  });

  it('§2 accepts a Place cursor with a committed draft and a redo tail (Q-41)', () => {
    expect(run(S0, REDO_TAIL)).toStrictEqual(run(S0, VALID));
  });

  it('§2 rejects a redo-tail sourceCount legal on the prefix but not after the draft commits', () => {
    const t1 = { ...REDO_T1, sourceCount: 3 };
    const session = sessionOf([BASE, REDO_DRAFT, t1, REDO_T2], { index: 1, phase: 'place' });
    expectEngineError(() => run(S0, session), 'r13-source-count');
  });

  it('§2 replay returns the committed prefix (§4 preamble)', () => {
    const sessions = [
      sessionOf([BASE, PLACE_DRAFT], { index: 1, phase: 'place' }),
      sessionOf([BASE, { ...PLACE_DRAFT, reached: 'committed' }], { index: 1, phase: 'idle' }),
      REDO_TAIL,
    ];
    for (const session of sessions) {
      const { index } = session.cursor;
      const prefix = sessionOf(session.moves.slice(0, index), { index, phase: 'idle' });
      expect(run(S0, session)).toStrictEqual(run(S0, prefix));
    }
  });

  it('§2 replay never consults the dictionary', () => {
    expect(replay.length).toBe(2);
    expect(replayFrom.length).toBe(3);
    expect(() => run(WON_START, WON)).not.toThrow();
  });

  it('§2 rejects gaveUp on a won position (AD-7 post-replay)', () => {
    expectEngineError(
      () => run(WON_START, sessionOf(WON.moves, undefined, { gaveUp: true })),
      'ad7-gave-up-won',
    );
  });
});

// --- D2 seam --------------------------------------------------------------------------------

describe('Start seam (D2)', () => {
  const session = sessionOf([]);
  it('AD-2 a CardId twice anywhere in the Start throws', () => {
    expectEngineError(
      () => run({ columns: eight({ 0: [0, 1], 1: [1] }), cells: eight({}) }, session),
      'start-duplicate-card',
    );
    expectEngineError(
      () => run({ columns: eight({ 0: [0] }), cells: eight({ 0: [0] }) }, session),
      'start-duplicate-card',
    );
  });

  it('AD-2 a card outside CardId 0–51 throws', () => {
    for (const card of [-1, 52, 1.5])
      expectEngineError(
        () => run({ columns: eight({ 0: [card] }), cells: eight({}) }, session),
        'card-id-domain',
      );
  });

  it('AD-2 a Start with no column card throws', () => {
    expectEngineError(
      () => run({ columns: eight({}), cells: eight({ 0: [0] }) }, session),
      'start-no-column-card',
    );
  });
});

// --- R-id sentences -------------------------------------------------------------------------

describe('commit through replay', () => {
  it('R-52 the new top of the target WordCell is the last placed card', () => {
    const position = run(S0, TARGET_FREE_CELL_SESSION);
    const cell3 = position.cells[0];
    // The old top M left (it travels with the word, R-41); the placement order sits on L.
    expect(cell3).toStrictEqual([L, ...(TARGET_FREE_CELL.placementOrder ?? [])]);
    expect(cell3[cell3.length - 1]).toBe(T);
  });

  it('R-60 the commit removes S, D and used free letters and pushes the placement order', () => {
    expect(run(S0, TARGET_FREE_CELL_SESSION)).toStrictEqual({
      columns: [[X, Y, Z], [E, D], [], [], [], [], [], []],
      cells: [[L, C, A, M, B, N, T], [], [], [], [], [], [], []],
    });
  });

  it('R-60 a self-drop removes S, then D from the remainder (R-21)', () => {
    expect(run(S0, sessionOf([SELF_DROP]))).toStrictEqual({
      columns: [[], [E, D, C, T], [], [], [], [], [], []],
      cells: [[L, M], [N], [X, Y, Z, A, B], [], [], [], [], []],
    });
  });

  it('R-60 the commit never touches later moves; the redo tail is still checked', () => {
    const before = structuredClone(REDO_TAIL.moves);
    run(S0, REDO_TAIL);
    expect(REDO_TAIL.moves).toStrictEqual(before);
    const bad = sessionOf([BASE, REDO_DRAFT, { ...REDO_T1, sourceCount: 3 }, REDO_T2], {
      index: 1,
      phase: 'place',
    });
    expectEngineError(() => run(S0, bad), 'r13-source-count');
  });

  it('R-61 a free letter cell exposes its next card for the next word; a single card empties', () => {
    const first: Move = {
      ...BASE,
      freeLetters: [3, 4],
      arrangement: [A, B, M, N],
      targetCell: 5,
      placementOrder: [T, A, B, M, N],
    };
    const afterFirst = run(S0, sessionOf([first]));
    expect(afterFirst.cells.slice(0, 3)).toStrictEqual([[L], [], [T, A, B, M, N]]);
    const second: Move = {
      ...BASE,
      sourceCount: 1,
      freeLetters: [3],
      arrangement: [Z, L],
      targetCell: 3,
      placementOrder: [C, Z, L],
    };
    const afterSecond = run(S0, sessionOf([first, second]));
    expect(afterSecond.cells[0]).toStrictEqual([C, Z, L]);
  });

  it("R-61 a cell's next card cannot join the same word (duplicate cell)", () => {
    const move: Move = {
      ...BASE,
      sourceCount: 1,
      freeLetters: [3, 3],
      arrangement: [B, M, L],
      placementOrder: [T, B, M, L],
    };
    expectEngineError(() => run(S0, sessionOf([move])), 'r33-free-letter-duplicate');
  });

  it('R-62 clearing every column wins the game', () => {
    const position = run(WON_START, WON);
    expect(position.columns.every((column) => column.length === 0)).toBe(true);
    expect(status(WON, position)).toBe('won');
  });
});

describe('status (§2)', () => {
  it('§2 status is gaveUp, playing or won', () => {
    const gaveUp = sessionOf([BASE], undefined, { gaveUp: true });
    expect(status(gaveUp, run(S0, gaveUp))).toBe('gaveUp');
    expect(status(TARGET_FREE_CELL_SESSION, run(S0, TARGET_FREE_CELL_SESSION))).toBe('playing');
    expect(status(WON, run(WON_START, WON))).toBe('won');
  });
});
