import { describe, expect, it } from 'vitest';
import { type ApplyContext, type ApplyResult, apply, applyFrom, type Command } from './commands';
import { dealIds } from './deal';
import { EngineError } from './errors';
import { EN } from './lang/en';
import { replay, replayFrom, type Start } from './replay';
import { word } from './rules';
import { type Move, SESSION_VERSION, type Session } from './session';
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

const CTX: ApplyContext = deepFreeze({ lang: EN });

function sessionOf(moves: readonly Move[], cursor: Session['cursor'], gaveUp = false): Session {
  return deepFreeze({ version: SESSION_VERSION, seed: 1, moves, cursor, gaveUp, activeMs: 0 });
}

/** Public `apply` on frozen inputs; a successful result must replay (§2). */
function run(session: Session, command: Command): ApplyResult {
  const result = apply(deepFreeze(session), deepFreeze(command), CTX);
  replay(result.session, EN);
  return result;
}

/** The draft of a Composing Session. */
const draftOf = (session: Session): Move => session.moves[session.cursor.index];

// --- seed-1 literals ------------------------------------------------------------------------

/** `dealIds(1)`, columns top → bottom. */
const COLS = dealIds(1);
const COL1 = COLS[0];
const COL2 = COLS[1];
const [, , , , , I, W] = COL1; // S of the base draft: the bottom 2 of column 1
const [, , , P7, , , M2] = COL2; // M2: bottom of column 2 (D at k = 1); P7: 4th from the top

/** A committed whole-column self-drop (R-11, R-22): k = 0, the column onto `targetCell`. */
function selfDrop(column: number, targetCell: WordCellNumber): Move {
  return {
    sourceColumn: column,
    sourceCount: COLS[column - 1].length,
    destinationColumn: column,
    destinationCount: 0,
    destinationSide: 'left',
    freeLetters: [],
    arrangement: COLS[column - 1],
    reached: 'committed',
    targetCell,
    placementOrder: COLS[column - 1],
  };
}

/** Columns 5 and 6 emptied; WordCell 3 tops with Z, WordCell 4 with N; cells 5–10 empty. */
const PREFIX: readonly Move[] = [selfDrop(5, 3), selfDrop(6, 4)];
const Z = COLS[4][COLS[4].length - 1];
const N = COLS[5][COLS[5].length - 1];

/** I W from column 1 onto column 2, k = 1 (M2), free letter Z (cell 3). */
const DRAFT_DATA = {
  sourceColumn: 1,
  sourceCount: 2,
  destinationColumn: 2,
  destinationCount: 1,
  destinationSide: 'left',
  freeLetters: [3],
  arrangement: [I, W, Z],
} as const satisfies Omit<Move, 'reached'>;

/** DRAFT_DATA reached Place: 4 letters, target 4 (R-36, R-40). */
const PLACE_DRAFT: Move = {
  ...DRAFT_DATA,
  reached: 'place',
  targetCell: 4,
  placementOrder: [M2, I, W, Z],
};
const COMMITTED_DRAFT: Move = { ...PLACE_DRAFT, reached: 'committed' };
/** Redo-tail move after COMMITTED_DRAFT. */
const TAIL = selfDrop(7, 5);

const IDLE = sessionOf(PREFIX, { index: 2, phase: 'idle' });
/** Place-reached Composing draft (redo data (a)). */
const COMPOSING = sessionOf([...PREFIX, PLACE_DRAFT], { index: 2, phase: 'composing' });
const PLACE = sessionOf([...PREFIX, PLACE_DRAFT], { index: 2, phase: 'place' });
/** Idle with a pending draft. */
const PENDING = sessionOf([...PREFIX, PLACE_DRAFT], { index: 2, phase: 'idle' });
/** Committed Composing draft with a redo tail (redo data (a) and (b)). */
const WITH_TAIL = sessionOf([...PREFIX, COMMITTED_DRAFT, TAIL], { index: 2, phase: 'composing' });
/** Idle over a committed pending draft and a redo tail. */
const PENDING_TAIL = sessionOf([...PREFIX, COMMITTED_DRAFT, TAIL], { index: 2, phase: 'idle' });
const GAVE_UP = sessionOf(PREFIX, { index: 2, phase: 'idle' }, true);

/** Partial self-drop: I W onto column 1, remainder L D X O M (n = 5), k = 1. */
const SELF = sessionOf(
  [
    ...PREFIX,
    {
      sourceColumn: 1,
      sourceCount: 2,
      destinationColumn: 1,
      destinationCount: 1,
      destinationSide: 'left',
      freeLetters: [],
      arrangement: [I, W],
      reached: 'composing',
    },
  ],
  { index: 2, phase: 'composing' },
);

/** Place-reached drop of M I W onto empty column 5 (k = 0). */
const EMPTY_DEST = sessionOf(
  [
    ...PREFIX,
    {
      sourceColumn: 1,
      sourceCount: 3,
      destinationColumn: 5,
      destinationCount: 0,
      destinationSide: 'left',
      freeLetters: [],
      arrangement: COL1.slice(4),
      reached: 'place',
      targetCell: 3,
      placementOrder: COL1.slice(4),
    },
  ],
  { index: 2, phase: 'composing' },
);

/** Place-reached whole-column self-drop of column 1 (k = 0). */
const WHOLE_SELF = sessionOf([...PREFIX, { ...selfDrop(1, 3), reached: 'place' }], {
  index: 2,
  phase: 'composing',
});

// --- the AD-2 command table (source of truth; entries 5 and 6 extend it) ---------------------

type Row = {
  readonly id: string;
  readonly command: string;
  readonly precondition: string;
  readonly build: () => readonly [Session, Command, ApplyContext];
} & ({ readonly outcome: 'noop' } | { readonly outcome: 'throw'; readonly check: string });

const on = (session: Session, command: Command) => () => [session, command, CTX] as const;

const drop = (sourceColumn: number, sourceCount: number, destinationColumn: number): Command => ({
  type: 'drop',
  sourceColumn,
  sourceCount,
  destinationColumn,
});

/** One valid-shaped command per type, for the phase and status rows. */
const SAMPLE: Readonly<Record<Command['type'], Command>> = {
  drop: drop(1, 1, 3),
  tapDestinationCard: { type: 'tapDestinationCard', card: M2 },
  setDestinationCount: { type: 'setDestinationCount', k: 2 },
  flip: { type: 'flip' },
  addFreeLetter: { type: 'addFreeLetter', cell: 4 },
  removeFreeLetter: { type: 'removeFreeLetter', cell: 3 },
  arrange: { type: 'arrange', arrangement: [W, I, Z] },
};
const COMPOSING_TYPES = [
  'tapDestinationCard',
  'setDestinationCount',
  'flip',
  'addFreeLetter',
  'removeFreeLetter',
  'arrange',
] as const;

const asCommand = (value: object): Command => value as unknown as Command;

const TABLE: readonly Row[] = [
  // drop
  {
    id: 'R-13',
    command: 'drop',
    precondition: 'sourceCount 0',
    outcome: 'throw',
    check: 'r13-source-count',
    build: on(IDLE, drop(1, 0, 2)),
  },
  {
    id: 'R-13',
    command: 'drop',
    precondition: 'sourceCount larger than the column',
    outcome: 'throw',
    check: 'r13-source-count',
    build: on(IDLE, drop(1, 8, 2)),
  },
  {
    id: 'R-13',
    command: 'drop',
    precondition: 'from an empty source column',
    outcome: 'throw',
    check: 'r13-source-count',
    build: on(IDLE, drop(5, 1, 2)),
  },
  // setDestinationCount
  {
    id: 'R-71',
    command: 'setDestinationCount',
    precondition: 'equal to k',
    outcome: 'noop',
    build: on(COMPOSING, { type: 'setDestinationCount', k: 1 }),
  },
  {
    id: 'R-31',
    command: 'setDestinationCount',
    precondition: 'k = 0 (partial self-drop)',
    outcome: 'throw',
    check: 'r31-destination-count',
    build: on(SELF, { type: 'setDestinationCount', k: 0 }),
  },
  {
    id: 'R-31',
    command: 'setDestinationCount',
    precondition: 'k = n + 1 (partial self-drop, n = column size after R-21)',
    outcome: 'throw',
    check: 'r31-destination-count',
    build: on(SELF, { type: 'setDestinationCount', k: 6 }),
  },
  {
    id: 'R-31',
    command: 'setDestinationCount',
    precondition: 'k = 0 on an empty destination column',
    outcome: 'throw',
    check: 'r31-set-count-empty-destination',
    build: on(EMPTY_DEST, { type: 'setDestinationCount', k: 0 }),
  },
  {
    id: 'R-31',
    command: 'setDestinationCount',
    precondition: 'k = 1 on an empty destination column',
    outcome: 'throw',
    check: 'r31-set-count-empty-destination',
    build: on(EMPTY_DEST, { type: 'setDestinationCount', k: 1 }),
  },
  // tapDestinationCard
  {
    id: 'R-31',
    command: 'tapDestinationCard',
    precondition: 'on the top of D at k = 1',
    outcome: 'noop',
    build: on(COMPOSING, { type: 'tapDestinationCard', card: M2 }),
  },
  {
    id: 'R-31',
    command: 'tapDestinationCard',
    precondition: 'on a card that is not in the destination column after R-21',
    outcome: 'throw',
    check: 'r31-tap-not-in-destination',
    build: on(COMPOSING, { type: 'tapDestinationCard', card: COL1[0] }),
  },
  {
    id: 'R-31',
    command: 'tapDestinationCard',
    precondition: 'on an S card of a self-drop',
    outcome: 'throw',
    check: 'r31-tap-not-in-destination',
    build: on(SELF, { type: 'tapDestinationCard', card: W }),
  },
  // flip
  {
    id: 'R-31',
    command: 'flip',
    precondition: 'with k = 0 (drop onto another, empty column)',
    outcome: 'noop',
    build: on(EMPTY_DEST, { type: 'flip' }),
  },
  {
    id: 'R-31',
    command: 'flip',
    precondition: 'with k = 0 (whole-column self-drop)',
    outcome: 'noop',
    build: on(WHOLE_SELF, { type: 'flip' }),
  },
  // addFreeLetter
  {
    id: 'R-33',
    command: 'addFreeLetter',
    precondition: 'on a used cell',
    outcome: 'throw',
    check: 'r33-free-letter-duplicate',
    build: on(COMPOSING, { type: 'addFreeLetter', cell: 3 }),
  },
  {
    id: 'R-33',
    command: 'addFreeLetter',
    precondition: 'on an empty cell',
    outcome: 'throw',
    check: 'r33-free-letter-empty',
    build: on(COMPOSING, { type: 'addFreeLetter', cell: 5 }),
  },
  {
    id: 'R-33',
    command: 'addFreeLetter',
    precondition: 'with index −1',
    outcome: 'throw',
    check: 'r33-free-letter-index',
    build: on(COMPOSING, { type: 'addFreeLetter', cell: 4, index: -1 }),
  },
  {
    id: 'R-33',
    command: 'addFreeLetter',
    precondition: 'with index |M| + 1',
    outcome: 'throw',
    check: 'r33-free-letter-index',
    build: on(COMPOSING, { type: 'addFreeLetter', cell: 4, index: 4 }),
  },
  // removeFreeLetter
  {
    id: 'R-33',
    command: 'removeFreeLetter',
    precondition: 'on a cell not in freeLetters',
    outcome: 'throw',
    check: 'r33-free-letter-absent',
    build: on(COMPOSING, { type: 'removeFreeLetter', cell: 4 }),
  },
  // arrange
  {
    id: 'R-71',
    command: 'arrange',
    precondition: 'equal in value',
    outcome: 'noop',
    build: on(COMPOSING, { type: 'arrange', arrangement: [I, W, Z] }),
  },
  {
    id: 'R-35',
    command: 'arrange',
    precondition: 'not a permutation of S ∪ F (a missing S card)',
    outcome: 'throw',
    check: 'r35-arrangement',
    build: on(COMPOSING, { type: 'arrange', arrangement: [W, Z] }),
  },
  {
    id: 'R-33',
    command: 'arrange',
    precondition: 'not a permutation of S ∪ F (a missing free letter)',
    outcome: 'throw',
    check: 'r35-arrangement',
    build: on(COMPOSING, { type: 'arrange', arrangement: [I, W] }),
  },
  {
    id: 'R-32',
    command: 'arrange',
    precondition: 'not a permutation of S ∪ F (a D card included)',
    outcome: 'throw',
    check: 'r35-arrangement',
    build: on(COMPOSING, { type: 'arrange', arrangement: [I, W, Z, M2] }),
  },
  {
    id: 'R-35',
    command: 'arrange',
    precondition: 'not a permutation of S ∪ F (a duplicated card)',
    outcome: 'throw',
    check: 'r35-arrangement',
    build: on(COMPOSING, { type: 'arrange', arrangement: [I, I, W, Z] }),
  },
  {
    id: 'R-35',
    command: 'arrange',
    precondition: 'not a permutation of S ∪ F (a foreign card)',
    outcome: 'throw',
    check: 'r35-arrangement',
    build: on(COMPOSING, { type: 'arrange', arrangement: [I, W, Z, COL1[0]] }),
  },
  // wrong phase (§4 preamble): drop valid in Idle, the six others in Composing
  ...(['composing', 'place'] as const).map(
    (phase): Row => ({
      id: '§4',
      command: 'drop',
      precondition: `a command in the wrong phase (${phase})`,
      outcome: 'throw',
      check: 'command-phase',
      build: on(phase === 'composing' ? COMPOSING : PLACE, SAMPLE.drop),
    }),
  ),
  ...COMPOSING_TYPES.flatMap((type) =>
    (['idle', 'place'] as const).map(
      (phase): Row => ({
        id: '§4',
        command: type,
        precondition: `a command in the wrong phase (${phase})`,
        outcome: 'throw',
        check: 'command-phase',
        build: on(phase === 'idle' ? PENDING : PLACE, SAMPLE[type]),
      }),
    ),
  ),
  // status ≠ playing (won rows are entry 6's)
  ...(Object.keys(SAMPLE) as Command['type'][]).map(
    (type): Row => ({
      id: 'R-75',
      command: type,
      precondition: 'a command while status ≠ playing (gaveUp)',
      outcome: 'throw',
      check: 'command-status',
      build: on(GAVE_UP, SAMPLE[type]),
    }),
  ),
  {
    id: 'AD-2',
    command: 'x',
    precondition: 'an unknown type (gaveUp)',
    outcome: 'throw',
    check: 'command-type',
    build: on(GAVE_UP, asCommand({ type: 'x' })),
  },
  // status and phase precede domain (build-notes CAP-4)
  {
    id: 'R-75',
    command: 'drop',
    precondition: 'a command while status ≠ playing, sourceColumn 9 outside its domain (gaveUp)',
    outcome: 'throw',
    check: 'command-status',
    build: on(GAVE_UP, drop(9, 1, 2)),
  },
  {
    id: '§4',
    command: 'setDestinationCount',
    precondition: 'a command in the wrong phase, k 1.5 outside its domain (idle)',
    outcome: 'throw',
    check: 'command-phase',
    build: on(PENDING, asCommand({ type: 'setDestinationCount', k: 1.5 })),
  },
  // domain
  {
    id: 'R-12',
    command: 'drop',
    precondition: 'sourceColumn 0 outside its documented domain',
    outcome: 'throw',
    check: 'command-domain',
    build: on(IDLE, drop(0, 1, 2)),
  },
  {
    id: 'R-12',
    command: 'drop',
    precondition: 'sourceColumn 9 outside its documented domain',
    outcome: 'throw',
    check: 'command-domain',
    build: on(IDLE, drop(9, 1, 2)),
  },
  {
    id: 'AD-2',
    command: 'drop',
    precondition: 'sourceColumn 1.5 outside its documented domain',
    outcome: 'throw',
    check: 'command-domain',
    build: on(IDLE, drop(1.5, 1, 2)),
  },
  {
    id: 'AD-2',
    command: 'drop',
    precondition: 'destinationColumn 9 outside its documented domain',
    outcome: 'throw',
    check: 'command-domain',
    build: on(IDLE, drop(1, 1, 9)),
  },
  {
    id: 'AD-2',
    command: 'drop',
    precondition: 'destinationColumn 1.5 outside its documented domain',
    outcome: 'throw',
    check: 'command-domain',
    build: on(IDLE, drop(1, 1, 1.5)),
  },
  {
    id: 'AD-2',
    command: 'drop',
    precondition: 'sourceCount 1.5 outside its documented domain',
    outcome: 'throw',
    check: 'command-domain',
    build: on(IDLE, drop(1, 1.5, 2)),
  },
  {
    id: 'AD-2',
    command: 'tapDestinationCard',
    precondition: 'card 52 outside its documented domain',
    outcome: 'throw',
    check: 'card-id-domain',
    build: on(COMPOSING, { type: 'tapDestinationCard', card: 52 }),
  },
  {
    id: 'AD-2',
    command: 'tapDestinationCard',
    precondition: 'card 1.5 outside its documented domain',
    outcome: 'throw',
    check: 'card-id-domain',
    build: on(COMPOSING, { type: 'tapDestinationCard', card: 1.5 }),
  },
  {
    id: 'AD-2',
    command: 'setDestinationCount',
    precondition: 'k 1.5 outside its documented domain',
    outcome: 'throw',
    check: 'command-domain',
    build: on(COMPOSING, { type: 'setDestinationCount', k: 1.5 }),
  },
  {
    id: 'AD-2',
    command: 'addFreeLetter',
    precondition: 'cell 11 outside its documented domain',
    outcome: 'throw',
    check: 'command-domain',
    build: on(COMPOSING, asCommand({ type: 'addFreeLetter', cell: 11 })),
  },
  {
    id: 'AD-2',
    command: 'addFreeLetter',
    precondition: 'cell 3.5 outside its documented domain',
    outcome: 'throw',
    check: 'command-domain',
    build: on(COMPOSING, asCommand({ type: 'addFreeLetter', cell: 3.5 })),
  },
  {
    id: 'AD-2',
    command: 'addFreeLetter',
    precondition: 'index 0.5 outside its documented domain',
    outcome: 'throw',
    check: 'command-domain',
    build: on(COMPOSING, { type: 'addFreeLetter', cell: 4, index: 0.5 }),
  },
  {
    id: 'AD-2',
    command: 'addFreeLetter',
    precondition: 'index undefined (present key) outside its documented domain',
    outcome: 'throw',
    check: 'command-domain',
    build: on(COMPOSING, asCommand({ type: 'addFreeLetter', cell: 4, index: undefined })),
  },
  {
    id: 'AD-2',
    command: 'removeFreeLetter',
    precondition: 'cell 11 outside its documented domain',
    outcome: 'throw',
    check: 'command-domain',
    build: on(COMPOSING, asCommand({ type: 'removeFreeLetter', cell: 11 })),
  },
  {
    id: 'AD-2',
    command: 'removeFreeLetter',
    precondition: 'cell 3.5 outside its documented domain',
    outcome: 'throw',
    check: 'command-domain',
    build: on(COMPOSING, asCommand({ type: 'removeFreeLetter', cell: 3.5 })),
  },
  {
    id: 'AD-2',
    command: 'arrange',
    precondition: 'an arrangement element 52 outside its documented domain',
    outcome: 'throw',
    check: 'card-id-domain',
    build: on(COMPOSING, { type: 'arrange', arrangement: [I, W, 52] }),
  },
  {
    id: 'AD-2',
    command: 'arrange',
    precondition: 'an arrangement element 1.5 outside its documented domain',
    outcome: 'throw',
    check: 'card-id-domain',
    build: on(COMPOSING, asCommand({ type: 'arrange', arrangement: [I, W, 1.5] })),
  },
  {
    id: 'AD-2',
    command: 'arrange',
    precondition: 'a non-array arrangement outside its documented domain',
    outcome: 'throw',
    check: 'command-domain',
    build: on(COMPOSING, asCommand({ type: 'arrange', arrangement: 'IWZ' })),
  },
];

describe('AD-2 command table', () => {
  // Names built here, not by `$field` interpolation, which truncates long values.
  const named = TABLE.map(
    (row) => [`${row.id} ${row.command} ${row.precondition} → ${row.outcome}`, row] as const,
  );
  it.each(named)('%s', (_name, row) => {
    const [session, command, ctx] = row.build().map((x) => deepFreeze(x)) as [
      Session,
      Command,
      ApplyContext,
    ];
    if (row.outcome === 'throw') {
      expectEngineError(() => apply(session, command, ctx), row.check);
    } else {
      const result = apply(session, command, ctx);
      expect(result.session).toBe(session);
      expect(Object.hasOwn(result, 'rejectedWord')).toBe(false);
    }
  });
});

// --- named tests ----------------------------------------------------------------------------

/** A lowered Composing draft (R-71): DRAFT_DATA with `changes`, no Place fields. */
const lowered = (changes: Partial<Move>): Move => ({
  ...DRAFT_DATA,
  ...changes,
  reached: 'composing',
});

describe('drop', () => {
  it('R-10 a drop takes the bottom sourceCount cards as S, top to bottom', () => {
    const result = run(IDLE, drop(1, 3, 2));
    expect(draftOf(result.session).arrangement).toStrictEqual(COL1.slice(4));
  });

  it('R-11 a drop may take the whole column', () => {
    const result = run(IDLE, drop(1, COL1.length, 2));
    expect(draftOf(result.session).arrangement).toStrictEqual(COL1);
  });

  it('R-12 drop has no WordCell source', () => {
    const _c: Command = {
      type: 'drop',
      sourceColumn: 1,
      sourceCount: 1,
      destinationColumn: 2,
      // @ts-expect-error R-12: a WordCell is never a source
      sourceCell: 3,
    };
    expect(_c.type).toBe('drop');
  });

  it('R-13 a destination-plus-free-letter word is played by dropping the cards on an empty column', () => {
    const dropped = run(IDLE, drop(2, 3, 5));
    const result = run(dropped.session, { type: 'addFreeLetter', cell: 3 });
    const draft = draftOf(result.session);
    expect(draft.destinationCount).toBe(0);
    expect(word(replay(result.session, EN), draft, EN).cards).toStrictEqual([...COL2.slice(4), Z]);
  });

  it('R-20 R-21 a self-drop draws D from the cards left after S is removed', () => {
    const result = run(IDLE, drop(1, 2, 1));
    const draft = draftOf(result.session);
    expect(draft.destinationCount).toBe(1);
    expect(word(replay(result.session, EN), draft, EN).cards).toStrictEqual([COL1[4], I, W]);
  });

  it('R-22 an empty column is a legal destination, the source column included, with k = 0', () => {
    expect(draftOf(run(IDLE, drop(1, 2, 5)).session).destinationCount).toBe(0);
    expect(draftOf(run(IDLE, drop(1, COL1.length, 1)).session).destinationCount).toBe(0);
  });

  it('R-23 a drop starts k = 1 (0 on an empty column), side left, no free letters, S top to bottom', () => {
    const cases: readonly [Command, number][] = [
      [drop(1, 2, 2), 1], // column 2, 7 cards
      [drop(1, 1, 7), 1], // column 7, 6 cards
      [drop(2, 1, 1), 1], // column 1, 7 cards
      [drop(1, 2, 5), 0], // empty column 5
    ];
    for (const [command, k] of cases) {
      const c = command as Extract<Command, { type: 'drop' }>;
      const source = COLS[c.sourceColumn - 1];
      expect(run(IDLE, command)).toStrictEqual({
        session: {
          ...IDLE,
          moves: [
            ...PREFIX,
            {
              sourceColumn: c.sourceColumn,
              sourceCount: c.sourceCount,
              destinationColumn: c.destinationColumn,
              destinationCount: k,
              destinationSide: 'left',
              freeLetters: [],
              arrangement: source.slice(source.length - c.sourceCount),
              reached: 'composing',
            },
          ],
          cursor: { index: 2, phase: 'composing' },
        },
      });
    }
  });

  it('§2 a drop in Idle writes the new draft at moves[cursor.index] and truncates the tail', () => {
    expect(run(PENDING_TAIL, drop(1, 1, 3))).toStrictEqual({
      session: {
        ...PENDING_TAIL,
        moves: [
          ...PREFIX,
          {
            sourceColumn: 1,
            sourceCount: 1,
            destinationColumn: 3,
            destinationCount: 1,
            destinationSide: 'left',
            freeLetters: [],
            arrangement: [W],
            reached: 'composing',
          },
        ],
        cursor: { index: 2, phase: 'composing' },
      },
    });
  });
});

describe('composing edits', () => {
  it('R-31 a tap sets k so the card is the top of D; a tap on the top of D at k > 1 sets k − 1', () => {
    const tapped = run(COMPOSING, { type: 'tapDestinationCard', card: P7 });
    expect(draftOf(tapped.session).destinationCount).toBe(4);
    const again = run(tapped.session, { type: 'tapDestinationCard', card: P7 });
    expect(draftOf(again.session).destinationCount).toBe(3);
  });

  it('R-21 R-31 a tap on a self-drop counts k within the cards left after S', () => {
    const result = run(SELF, { type: 'tapDestinationCard', card: COL1[2] });
    expect(draftOf(result.session).destinationCount).toBe(3);
  });

  it('R-31 flip toggles destinationSide on a non-empty destination', () => {
    const right = run(COMPOSING, { type: 'flip' });
    expect(draftOf(right.session).destinationSide).toBe('right');
    const left = run(right.session, { type: 'flip' });
    expect(draftOf(left.session).destinationSide).toBe('left');
  });

  it('R-33 addFreeLetter with index |M| equals the default append', () => {
    expect(run(COMPOSING, { type: 'addFreeLetter', cell: 4, index: 3 })).toStrictEqual(
      run(COMPOSING, { type: 'addFreeLetter', cell: 4 }),
    );
  });

  it('R-33 freeLetters keep add order, index places the card in M, removal keeps the rest in order (D8)', () => {
    const bare = sessionOf(
      [...PREFIX, { ...DRAFT_DATA, freeLetters: [], arrangement: [I, W], reached: 'composing' }],
      { index: 2, phase: 'composing' },
    );
    const one = run(bare, { type: 'addFreeLetter', cell: 3 });
    const two = run(one.session, { type: 'addFreeLetter', cell: 4, index: 0 });
    expect(draftOf(two.session)).toStrictEqual(
      lowered({ freeLetters: [3, 4], arrangement: [N, I, W, Z] }),
    );
    const removed = run(two.session, { type: 'removeFreeLetter', cell: 3 });
    expect(draftOf(removed.session)).toStrictEqual(
      lowered({ freeLetters: [4], arrangement: [N, I, W] }),
    );
  });

  it('R-34 free letters may interleave with S in M', () => {
    const result = run(COMPOSING, { type: 'arrange', arrangement: [I, Z, W] });
    expect(draftOf(result.session).arrangement).toStrictEqual([I, Z, W]);
  });

  it('R-39 there is no Cancel command', () => {
    // @ts-expect-error R-39: there is no Cancel
    const _c: Command = { type: 'cancel' };
    expect(_c.type).toBe('cancel');
  });

  const EDITS: readonly [Command, Partial<Move>][] = [
    [{ type: 'tapDestinationCard', card: COL2[5] }, { destinationCount: 2 }],
    [{ type: 'setDestinationCount', k: 3 }, { destinationCount: 3 }],
    [{ type: 'flip' }, { destinationSide: 'right' }],
    [
      { type: 'addFreeLetter', cell: 4 },
      { freeLetters: [3, 4], arrangement: [I, W, Z, N] },
    ],
    [
      { type: 'removeFreeLetter', cell: 3 },
      { freeLetters: [], arrangement: [I, W] },
    ],
    [{ type: 'arrange', arrangement: [W, I, Z] }, { arrangement: [W, I, Z] }],
  ];

  it.each(EDITS.map(([command, changes]) => [command.type, command, changes] as const))(
    'R-71 %s on a Place-reached draft deletes the Place fields and lowers reached to composing',
    (_type, command, changes) => {
      expect(run(COMPOSING, command)).toStrictEqual({
        session: { ...COMPOSING, moves: [...PREFIX, lowered(changes)] },
      });
    },
  );

  it('R-71 an edit on a committed draft with a redo tail also drops the later moves', () => {
    expect(run(WITH_TAIL, { type: 'flip' })).toStrictEqual({
      session: { ...WITH_TAIL, moves: [...PREFIX, lowered({ destinationSide: 'right' })] },
    });
  });
});

describe('R-30 word helper', () => {
  const fresh = sessionOf([], { index: 0, phase: 'idle' });
  const seam = (start: Start, commands: readonly Command[]) => {
    let session = fresh;
    for (const command of commands)
      session = applyFrom(start, deepFreeze(session), deepFreeze(command), CTX).session;
    return word(replayFrom(start, session, EN), draftOf(session), EN);
  };

  it('R-30 with k = 0 the word is M alone', () => {
    const start = startOf(['ESTA', 'BD']);
    expect(seam(start, [drop(2, 2, 3)]).spelling).toBe('bd');
  });

  it('R-30 k = 3 under S T A gives STA… on the left and …ATS on the right', () => {
    const start = startOf(['ESTA', 'BD']);
    const k3 = [drop(2, 2, 1), { type: 'setDestinationCount', k: 3 } as const];
    expect(seam(start, k3).spelling).toBe('stabd');
    expect(seam(start, [...k3, { type: 'flip' }]).spelling).toBe('bdats');
  });

  it('R-30 on the right D is reversed by card, so QU still spells qu', () => {
    const start = startOf(['EQ', 'NI']);
    const [e, qu] = start.columns[0];
    const [n, i] = start.columns[1];
    const result = seam(start, [
      drop(2, 2, 1),
      { type: 'setDestinationCount', k: 2 },
      { type: 'flip' },
    ]);
    expect(result).toStrictEqual({ cards: [n, i, qu, e], spelling: 'nique' });
  });
});
