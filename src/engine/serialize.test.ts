import { describe, expect, expectTypeOf, it } from 'vitest';
import validBelowCommittedLast from '../../fixtures/session-below-committed-last.json' with {
  type: 'json',
};
import validComposing from '../../fixtures/session-composing.json' with { type: 'json' };
import validComposingDraft2Letters from '../../fixtures/session-composing-draft-2-letters.json' with {
  type: 'json',
};
import validGaveUp from '../../fixtures/session-gave-up.json' with { type: 'json' };
import validIdleFresh from '../../fixtures/session-idle-fresh.json' with { type: 'json' };
import validIdlePendingDraft from '../../fixtures/session-idle-pending-draft.json' with {
  type: 'json',
};
import invalidAd7ActiveMs from '../../fixtures/session-invalid-ad7-active-ms.json' with {
  type: 'json',
};
import invalidAd7CursorIndex from '../../fixtures/session-invalid-ad7-cursor-index.json' with {
  type: 'json',
};
import invalidAd7CursorPhase from '../../fixtures/session-invalid-ad7-cursor-phase.json' with {
  type: 'json',
};
import invalidAd7GaveUpIdle from '../../fixtures/session-invalid-ad7-gave-up-idle.json' with {
  type: 'json',
};
import invalidAd7GaveUpType from '../../fixtures/session-invalid-ad7-gave-up-type.json' with {
  type: 'json',
};
import invalidAd7GaveUpWon from '../../fixtures/session-invalid-ad7-gave-up-won.json' with {
  type: 'json',
};
import invalidAd7K0Side from '../../fixtures/session-invalid-ad7-k0-side.json' with {
  type: 'json',
};
import invalidAd7PlaceFields from '../../fixtures/session-invalid-ad7-place-fields.json' with {
  type: 'json',
};
import invalidAd7UnknownCursorField from '../../fixtures/session-invalid-ad7-unknown-cursor-field.json' with {
  type: 'json',
};
import invalidAd7UnknownMoveField from '../../fixtures/session-invalid-ad7-unknown-move-field.json' with {
  type: 'json',
};
import invalidAd7UnknownSessionField from '../../fixtures/session-invalid-ad7-unknown-session-field.json' with {
  type: 'json',
};
import invalidArray from '../../fixtures/session-invalid-array.json' with { type: 'json' };
import invalidCellDomain from '../../fixtures/session-invalid-cell-domain.json' with {
  type: 'json',
};
import invalidColumnDomain from '../../fixtures/session-invalid-column-domain.json' with {
  type: 'json',
};
import invalidCursorIndexType from '../../fixtures/session-invalid-cursor-index-type.json' with {
  type: 'json',
};
import invalidCursorNull from '../../fixtures/session-invalid-cursor-null.json' with {
  type: 'json',
};
import invalidDomainCard from '../../fixtures/session-invalid-domain-card.json' with {
  type: 'json',
};
import invalidDomainCount from '../../fixtures/session-invalid-domain-count.json' with {
  type: 'json',
};
import invalidEnumCursorPhase from '../../fixtures/session-invalid-enum-cursor-phase.json' with {
  type: 'json',
};
import invalidEnumDestinationSide from '../../fixtures/session-invalid-enum-destination-side.json' with {
  type: 'json',
};
import invalidEnumReached from '../../fixtures/session-invalid-enum-reached.json' with {
  type: 'json',
};
import invalidMoveNotObject from '../../fixtures/session-invalid-move-not-object.json' with {
  type: 'json',
};
import invalidNull from '../../fixtures/session-invalid-null.json' with { type: 'json' };
import invalidR13SourceCount from '../../fixtures/session-invalid-r13-source-count.json' with {
  type: 'json',
};
import invalidR31DestinationCount from '../../fixtures/session-invalid-r31-destination-count.json' with {
  type: 'json',
};
import invalidR33FreeLetterDuplicate from '../../fixtures/session-invalid-r33-free-letter-duplicate.json' with {
  type: 'json',
};
import invalidR33FreeLetterEmpty from '../../fixtures/session-invalid-r33-free-letter-empty.json' with {
  type: 'json',
};
import invalidR35Arrangement from '../../fixtures/session-invalid-r35-arrangement.json' with {
  type: 'json',
};
import invalidR36LetterCount from '../../fixtures/session-invalid-r36-letter-count.json' with {
  type: 'json',
};
import invalidR40TargetCell from '../../fixtures/session-invalid-r40-target-cell.json' with {
  type: 'json',
};
import invalidR50PlacementOrder from '../../fixtures/session-invalid-r50-placement-order.json' with {
  type: 'json',
};
import invalidRequiredCursor from '../../fixtures/session-invalid-required-cursor.json' with {
  type: 'json',
};
import invalidRequiredMove from '../../fixtures/session-invalid-required-move.json' with {
  type: 'json',
};
import invalidRequiredSession from '../../fixtures/session-invalid-required-session.json' with {
  type: 'json',
};
import invalidS2CommittedPrefix from '../../fixtures/session-invalid-s2-committed-prefix.json' with {
  type: 'json',
};
import invalidS2FreeLettersSet from '../../fixtures/session-invalid-s2-free-letters-set.json' with {
  type: 'json',
};
import invalidS2LastOnly from '../../fixtures/session-invalid-s2-last-only.json' with {
  type: 'json',
};
import invalidSeedUint32 from '../../fixtures/session-invalid-seed-uint32.json' with {
  type: 'json',
};
import invalidTypeArrangement from '../../fixtures/session-invalid-type-arrangement.json' with {
  type: 'json',
};
import invalidTypeDestinationColumn from '../../fixtures/session-invalid-type-destination-column.json' with {
  type: 'json',
};
import invalidTypeDestinationCount from '../../fixtures/session-invalid-type-destination-count.json' with {
  type: 'json',
};
import invalidTypeFreeLetters from '../../fixtures/session-invalid-type-free-letters.json' with {
  type: 'json',
};
import invalidTypeMoves from '../../fixtures/session-invalid-type-moves.json' with { type: 'json' };
import invalidTypePlacementOrder from '../../fixtures/session-invalid-type-placement-order.json' with {
  type: 'json',
};
import invalidTypeSourceColumn from '../../fixtures/session-invalid-type-source-column.json' with {
  type: 'json',
};
import invalidTypeSourceCount from '../../fixtures/session-invalid-type-source-count.json' with {
  type: 'json',
};
import invalidTypeTargetCell from '../../fixtures/session-invalid-type-target-cell.json' with {
  type: 'json',
};
import validPlace from '../../fixtures/session-place.json' with { type: 'json' };
import validPlaceFreeLetterRedoTail from '../../fixtures/session-place-free-letter-redo-tail.json' with {
  type: 'json',
};
import validWon from '../../fixtures/session-won.json' with { type: 'json' };
import { EngineError } from './errors';
import {
  apply,
  EN,
  type ParseSessionResult,
  parseSession,
  type Session,
  serializeSession,
  view,
} from './index';
import { replay } from './replay';
import { checkSchema } from './serialize';

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

deepFreeze(EN);

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

/** A parsed valid fixture (fixtures are imported loosely typed, ticket Notes). */
function parsed(fixture: unknown): Session {
  const result = parseSession(JSON.stringify(fixture), EN);
  if (!result.ok) throw new Error(`fixture does not parse: ${result.reason}`);
  return result.session;
}

const SESSION_KEYS = ['version', 'seed', 'moves', 'cursor', 'gaveUp', 'activeMs'];
const CURSOR_KEYS = ['index', 'phase'];
const MOVE_KEYS = [
  'sourceColumn',
  'sourceCount',
  'destinationColumn',
  'destinationCount',
  'destinationSide',
  'freeLetters',
  'arrangement',
  'reached',
  'targetCell',
  'placementOrder',
];
const OPTIONAL_MOVE_KEYS = ['targetCell', 'placementOrder'];

type ValidName =
  | 'idle-fresh'
  | 'composing'
  | 'composing-draft-2-letters'
  | 'place'
  | 'idle-pending-draft'
  | 'place-free-letter-redo-tail'
  | 'below-committed-last'
  | 'won'
  | 'gave-up';

/** The nine CAP-9 round-trip fixtures (generator record: the plan's Implementation Notes). */
const VALID: readonly (readonly [ValidName, unknown])[] = [
  ['idle-fresh', validIdleFresh],
  ['composing', validComposing],
  ['composing-draft-2-letters', validComposingDraft2Letters],
  ['place', validPlace],
  ['idle-pending-draft', validIdlePendingDraft],
  ['place-free-letter-redo-tail', validPlaceFreeLetterRedoTail],
  ['below-committed-last', validBelowCommittedLast],
  ['won', validWon],
  ['gave-up', validGaveUp],
];

// --- rejection table ------------------------------------------------------------------------

interface Row {
  readonly file: string;
  readonly value: unknown;
  readonly base: ValidName;
  readonly stage: 'schema' | 'replay';
  readonly code: string;
}

const row = (
  file: string,
  value: unknown,
  base: ValidName,
  stage: Row['stage'],
  code: string,
): Row => ({ file, value, base, stage, code });

/** One rejecting fixture per schema code, AD-7 check and violable replay check (CAP-9). */
const REJECTIONS: readonly Row[] = [
  row(
    'session-invalid-required-session.json',
    invalidRequiredSession,
    'idle-fresh',
    'schema',
    'schema.required-session',
  ),
  row(
    'session-invalid-required-cursor.json',
    invalidRequiredCursor,
    'idle-fresh',
    'schema',
    'schema.required-cursor',
  ),
  row(
    'session-invalid-required-move.json',
    invalidRequiredMove,
    'composing',
    'schema',
    'schema.required-move',
  ),
  row(
    'session-invalid-cursor-null.json',
    invalidCursorNull,
    'idle-fresh',
    'schema',
    'schema.object-cursor',
  ),
  row(
    'session-invalid-move-not-object.json',
    invalidMoveNotObject,
    'composing',
    'schema',
    'schema.object-move',
  ),
  row(
    'session-invalid-type-moves.json',
    invalidTypeMoves,
    'idle-fresh',
    'schema',
    'schema.type-moves',
  ),
  row(
    'session-invalid-cursor-index-type.json',
    invalidCursorIndexType,
    'idle-fresh',
    'schema',
    'schema.type-cursor-index',
  ),
  row(
    'session-invalid-enum-cursor-phase.json',
    invalidEnumCursorPhase,
    'idle-fresh',
    'schema',
    'schema.enum-cursor-phase',
  ),
  row(
    'session-invalid-type-source-column.json',
    invalidTypeSourceColumn,
    'composing',
    'schema',
    'schema.type-source-column',
  ),
  row(
    'session-invalid-type-source-count.json',
    invalidTypeSourceCount,
    'composing',
    'schema',
    'schema.type-source-count',
  ),
  row(
    'session-invalid-type-destination-column.json',
    invalidTypeDestinationColumn,
    'composing',
    'schema',
    'schema.type-destination-column',
  ),
  row(
    'session-invalid-type-destination-count.json',
    invalidTypeDestinationCount,
    'composing',
    'schema',
    'schema.type-destination-count',
  ),
  row(
    'session-invalid-type-free-letters.json',
    invalidTypeFreeLetters,
    'composing',
    'schema',
    'schema.type-free-letters',
  ),
  row(
    'session-invalid-type-arrangement.json',
    invalidTypeArrangement,
    'composing',
    'schema',
    'schema.type-arrangement',
  ),
  row(
    'session-invalid-type-target-cell.json',
    invalidTypeTargetCell,
    'place',
    'schema',
    'schema.type-target-cell',
  ),
  row(
    'session-invalid-type-placement-order.json',
    invalidTypePlacementOrder,
    'place',
    'schema',
    'schema.type-placement-order',
  ),
  row(
    'session-invalid-enum-destination-side.json',
    invalidEnumDestinationSide,
    'composing',
    'schema',
    'schema.enum-destination-side',
  ),
  row(
    'session-invalid-enum-reached.json',
    invalidEnumReached,
    'composing',
    'schema',
    'schema.enum-reached',
  ),
  row(
    'session-invalid-column-domain.json',
    invalidColumnDomain,
    'composing',
    'schema',
    'schema.domain-column',
  ),
  row(
    'session-invalid-domain-count.json',
    invalidDomainCount,
    'composing',
    'schema',
    'schema.domain-count',
  ),
  row(
    'session-invalid-cell-domain.json',
    invalidCellDomain,
    'place',
    'schema',
    'schema.domain-cell',
  ),
  row(
    'session-invalid-domain-card.json',
    invalidDomainCard,
    'composing',
    'schema',
    'schema.domain-card',
  ),
  row('session-invalid-seed-uint32.json', invalidSeedUint32, 'idle-fresh', 'replay', 'seed-uint32'),
  row(
    'session-invalid-ad7-active-ms.json',
    invalidAd7ActiveMs,
    'idle-fresh',
    'replay',
    'ad7-active-ms',
  ),
  row(
    'session-invalid-ad7-gave-up-type.json',
    invalidAd7GaveUpType,
    'idle-fresh',
    'replay',
    'ad7-gave-up-type',
  ),
  row(
    'session-invalid-ad7-cursor-index.json',
    invalidAd7CursorIndex,
    'idle-fresh',
    'replay',
    'ad7-cursor-index',
  ),
  row(
    'session-invalid-ad7-cursor-phase.json',
    invalidAd7CursorPhase,
    'composing',
    'replay',
    'ad7-cursor-phase',
  ),
  row(
    'session-invalid-ad7-gave-up-idle.json',
    invalidAd7GaveUpIdle,
    'composing',
    'replay',
    'ad7-gave-up-idle',
  ),
  row(
    'session-invalid-ad7-place-fields.json',
    invalidAd7PlaceFields,
    'place',
    'replay',
    'ad7-place-fields',
  ),
  row('session-invalid-ad7-k0-side.json', invalidAd7K0Side, 'composing', 'replay', 'ad7-k0-side'),
  row(
    'session-invalid-s2-committed-prefix.json',
    invalidS2CommittedPrefix,
    'place-free-letter-redo-tail',
    'replay',
    's2-committed-prefix',
  ),
  row(
    'session-invalid-s2-last-only.json',
    invalidS2LastOnly,
    'place-free-letter-redo-tail',
    'replay',
    's2-last-only',
  ),
  row(
    'session-invalid-ad7-unknown-session-field.json',
    invalidAd7UnknownSessionField,
    'idle-fresh',
    'replay',
    'ad7-unknown-session-field',
  ),
  row(
    'session-invalid-ad7-unknown-cursor-field.json',
    invalidAd7UnknownCursorField,
    'idle-fresh',
    'replay',
    'ad7-unknown-cursor-field',
  ),
  row(
    'session-invalid-ad7-unknown-move-field.json',
    invalidAd7UnknownMoveField,
    'composing',
    'replay',
    'ad7-unknown-move-field',
  ),
  row(
    'session-invalid-r13-source-count.json',
    invalidR13SourceCount,
    'composing',
    'replay',
    'r13-source-count',
  ),
  row(
    'session-invalid-r31-destination-count.json',
    invalidR31DestinationCount,
    'composing',
    'replay',
    'r31-destination-count',
  ),
  row(
    'session-invalid-r33-free-letter-duplicate.json',
    invalidR33FreeLetterDuplicate,
    'place-free-letter-redo-tail',
    'replay',
    'r33-free-letter-duplicate',
  ),
  row(
    'session-invalid-r33-free-letter-empty.json',
    invalidR33FreeLetterEmpty,
    'composing',
    'replay',
    'r33-free-letter-empty',
  ),
  row(
    'session-invalid-s2-free-letters-set.json',
    invalidS2FreeLettersSet,
    'place-free-letter-redo-tail',
    'replay',
    's2-free-letters-set',
  ),
  row(
    'session-invalid-r35-arrangement.json',
    invalidR35Arrangement,
    'composing',
    'replay',
    'r35-arrangement',
  ),
  row(
    'session-invalid-r36-letter-count.json',
    invalidR36LetterCount,
    'place',
    'replay',
    'r36-letter-count',
  ),
  row(
    'session-invalid-r40-target-cell.json',
    invalidR40TargetCell,
    'place',
    'replay',
    'r40-target-cell',
  ),
  row(
    'session-invalid-r50-placement-order.json',
    invalidR50PlacementOrder,
    'place',
    'replay',
    'r50-placement-order',
  ),
  row(
    'session-invalid-ad7-gave-up-won.json',
    invalidAd7GaveUpWon,
    'won',
    'replay',
    'ad7-gave-up-won',
  ),
];

/** The schema-stage codes (src/engine/errors.ts doc comment). */
const SCHEMA_CODES = [
  'schema.required-session',
  'schema.required-cursor',
  'schema.required-move',
  'schema.object-cursor',
  'schema.object-move',
  'schema.type-moves',
  'schema.type-cursor-index',
  'schema.enum-cursor-phase',
  'schema.type-source-column',
  'schema.type-source-count',
  'schema.type-destination-column',
  'schema.type-destination-count',
  'schema.type-free-letters',
  'schema.type-arrangement',
  'schema.type-target-cell',
  'schema.type-placement-order',
  'schema.enum-destination-side',
  'schema.enum-reached',
  'schema.domain-column',
  'schema.domain-count',
  'schema.domain-cell',
  'schema.domain-card',
];

/** build-notes CAP-9 minimum schema cases. */
const SCHEMA_MINIMUM = [
  'schema.type-moves',
  'schema.required-session',
  'schema.type-source-column',
  'schema.type-destination-count',
  'schema.enum-reached',
  'schema.domain-column',
  'schema.domain-cell',
  'schema.type-cursor-index',
  'schema.object-move',
  'schema.object-cursor',
];

/**
 * AD-7 pre-replay, per-move and post-replay codes, copied from the src/engine/errors.ts doc
 * comment; each is violable once the schema stage has run (build-notes CAP-9).
 */
const REPLAY_CODES = [
  'seed-uint32',
  'ad7-active-ms',
  'ad7-gave-up-type',
  'ad7-cursor-index',
  'ad7-cursor-phase',
  'ad7-gave-up-idle',
  'ad7-place-fields',
  'ad7-k0-side',
  's2-committed-prefix',
  's2-last-only',
  'ad7-unknown-session-field',
  'ad7-unknown-cursor-field',
  'ad7-unknown-move-field',
  'r13-source-count',
  'r31-destination-count',
  'r33-free-letter-duplicate',
  'r33-free-letter-empty',
  's2-free-letters-set',
  'r35-arrangement',
  'r36-letter-count',
  'r40-target-cell',
  'r50-placement-order',
  'ad7-gave-up-won',
];

const SCHEMA_ROWS = REJECTIONS.filter((r) => r.stage === 'schema');
const REPLAY_ROWS = REJECTIONS.filter((r) => r.stage === 'replay');

// --- tests ----------------------------------------------------------------------------------

describe('ParseSessionResult (AD-7)', () => {
  it('§2 ParseSessionResult has the AD-7 shape (checked by npm run check)', () => {
    expectTypeOf<ParseSessionResult>().toEqualTypeOf<
      | { readonly ok: true; readonly session: Session }
      | { readonly ok: false; readonly reason: 'version-unreadable' }
      | {
          readonly ok: false;
          readonly reason: 'version-unknown' | 'replay-failed';
          readonly version: number;
        }
    >();
  });
});

describe('round trip (§2, CAP-9)', () => {
  it.each(VALID)('§2 %s parses, equals the fixture and re-serializes byte-equal', (_, fixture) => {
    const text = JSON.stringify(fixture);
    const result = parseSession(text, EN);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.session).toStrictEqual(fixture);
    const out = serializeSession(deepFreeze(result.session));
    expect(out).toBe(text);
    const json = JSON.parse(out);
    expect(Object.keys(json)).toStrictEqual(SESSION_KEYS);
    expect(Object.keys(json.cursor)).toStrictEqual(CURSOR_KEYS);
    for (const move of json.moves) {
      expect(Object.keys(move)).toStrictEqual(
        MOVE_KEYS.filter((k) => !OPTIONAL_MOVE_KEYS.includes(k) || Object.hasOwn(move, k)),
      );
      if (move.reached === 'composing') {
        expect(Object.hasOwn(move, 'targetCell')).toBe(false);
        expect(Object.hasOwn(move, 'placementOrder')).toBe(false);
      }
    }
  });

  it('§2 the round-trip fixtures include a Composing-reached move', () => {
    const moves = VALID.flatMap(([, fixture]) => parsed(fixture).moves);
    expect(moves.some((m) => m.reached === 'composing')).toBe(true);
  });

  it('§2 serializeSession writes §2 key order whatever the insertion order', () => {
    const reverse = <T extends object>(o: T): T =>
      Object.fromEntries(Object.entries(o).reverse()) as T;
    const fixture = parsed(validPlaceFreeLetterRedoTail);
    const reversed = deepFreeze(
      reverse({
        ...fixture,
        cursor: reverse(fixture.cursor),
        moves: fixture.moves.map(reverse),
      }),
    );
    expect(Object.keys(reversed)[0]).toBe('activeMs');
    expect(serializeSession(reversed)).toBe(JSON.stringify(validPlaceFreeLetterRedoTail));
  });
});

describe('defining properties (§2, CAP-9)', () => {
  const PROPERTIES: Record<ValidName, (s: Session) => void> = {
    'idle-fresh': (s) => {
      expect(s.moves).toStrictEqual([]);
      expect(s.cursor.phase).toBe('idle');
    },
    composing: (s) => {
      expect(s.cursor.phase).toBe('composing');
      expect(view(s, EN).draft?.letterCount).toBeGreaterThanOrEqual(3);
    },
    'composing-draft-2-letters': (s) => {
      expect(s.cursor.phase).toBe('composing');
      expect(s.moves[s.cursor.index].reached).toBe('composing');
      expect(view(s, EN).draft?.letterCount).toBe(2);
    },
    place: (s) => {
      expect(s.cursor.phase).toBe('place');
      expect(s.moves.length).toBe(s.cursor.index + 1);
    },
    'idle-pending-draft': (s) => {
      expect(s.cursor.phase).toBe('idle');
      expect(s.moves.length).toBe(s.cursor.index + 1);
      expect(s.moves[s.cursor.index].reached).not.toBe('committed');
    },
    'place-free-letter-redo-tail': (s) => {
      expect(s.cursor.phase).toBe('place');
      expect(s.moves.length).toBeGreaterThan(s.cursor.index + 1);
      expect(s.moves.at(-1)?.reached).toBe('committed');
      const draft = s.moves[s.cursor.index];
      expect(draft.freeLetters.length).toBeGreaterThan(0);
      // R-51 word order is [32, 28, 9] ("one"); generator-recorded (plan Implementation Notes).
      expect(draft.placementOrder).toStrictEqual([9, 32, 28]);
      expect(draft.placementOrder).not.toStrictEqual([32, 28, 9]);
      expect(view(s, EN).draft?.word).toBe('one');
    },
    'below-committed-last': (s) => {
      expect(s.cursor.phase).toBe('place');
      expect(s.moves.length).toBe(s.cursor.index + 2);
      expect(s.moves.at(-1)?.reached).not.toBe('committed');
    },
    won: (s) => {
      expect(view(s, EN).status).toBe('won');
    },
    'gave-up': (s) => {
      expect(s.gaveUp).toBe(true);
      expect(s.activeMs).toBeGreaterThan(0);
    },
  };

  it.each(VALID)('§2 %s has its defining property', (name, fixture) => {
    PROPERTIES[name](parsed(fixture));
  });
});

describe('rejecting fixtures (§2, CAP-9)', () => {
  it('§2 rejection codes are distinct and cover every schema and replay code', () => {
    const codes = REJECTIONS.map((r) => r.code);
    expect(new Set(codes).size).toBe(codes.length);
    expect(new Set(SCHEMA_ROWS.map((r) => r.code))).toStrictEqual(new Set(SCHEMA_CODES));
    expect(new Set(REPLAY_ROWS.map((r) => r.code))).toStrictEqual(new Set(REPLAY_CODES));
    expect(SCHEMA_CODES).toHaveLength(22);
    expect(REPLAY_CODES).toHaveLength(23);
    for (const code of SCHEMA_MINIMUM) expect(codes).toContain(code);
  });

  it.each(REJECTIONS.map((r) => [r.file, r] as const))(
    '§2 %s is replay-failed with its version and the stage throws its code',
    (_, { value, stage, code }) => {
      const { version } = value as { version: number };
      expect(parseSession(JSON.stringify(value), EN)).toStrictEqual({
        ok: false,
        reason: 'replay-failed',
        version,
      });
      if (stage === 'schema') {
        expectEngineError(() => checkSchema(value as object), code);
      } else {
        expect(() => checkSchema(value as object)).not.toThrow();
        expectEngineError(() => replay(value as unknown as Session, EN), code);
      }
    },
  );

  it.each(REPLAY_ROWS.map((r) => [r.file, r] as const))(
    '§2 %s: view and apply throw the replay code',
    (_, { value, code }) => {
      const session = deepFreeze(value) as unknown as Session;
      expectEngineError(() => view(session, EN), code);
      expectEngineError(() => apply(session, { type: 'undo' }, { lang: EN }), code);
    },
  );

  it('§2 schema checks run session → cursor → move, then object → required → type → enum → domain', () => {
    const fresh = validIdleFresh as unknown as Session;
    const move = (validComposing as unknown as Session).moves[0];
    const withMove = (m: object): object => ({
      ...(validComposing as object),
      moves: [m],
    });
    const cases: [object, string][] = [
      [{ version: 1, moves: {}, gaveUp: false, activeMs: 0 }, 'schema.required-session'],
      [{ ...fresh, moves: {}, cursor: null }, 'schema.type-moves'],
      [{ ...fresh, cursor: null, moves: [null] }, 'schema.object-cursor'],
      [{ ...fresh, cursor: { index: 0.5, phase: 'x' } }, 'schema.type-cursor-index'],
      [withMove({ ...move, sourceColumn: 9, reached: 'x' }), 'schema.enum-reached'],
      [withMove({ ...move, destinationSide: 'up', sourceCount: '1' }), 'schema.type-source-count'],
      [withMove({ ...move, arrangement: [52], sourceCount: -1 }), 'schema.domain-count'],
      [{ ...fresh, cursor: { index: 0.5 } }, 'schema.required-cursor'],
      [withMove({ sourceCount: '1' }), 'schema.required-move'],
      [withMove({ ...move, destinationSide: 'up', reached: 'x' }), 'schema.enum-destination-side'],
      [withMove({ ...move, arrangement: [52], targetCell: 11 }), 'schema.domain-card'],
      [
        {
          ...(validComposing as object),
          moves: [move, { ...move, sourceColumn: '1' }, null],
        },
        'schema.type-source-column',
      ],
    ];
    for (const [value, code] of cases) expectEngineError(() => checkSchema(value), code);
  });

  const redoTail = validPlaceFreeLetterRedoTail as unknown as Session;
  const withDraft = (patch: object): object => ({
    ...redoTail,
    moves: redoTail.moves.map((m, i) => (i === redoTail.cursor.index ? { ...m, ...patch } : m)),
  });
  it.each([
    ['cursor []', { ...redoTail, cursor: [] }, 'schema.object-cursor'],
    ['move []', { ...redoTail, moves: [[]] }, 'schema.object-move'],
    ['sourceColumn 0', withDraft({ sourceColumn: 0 }), 'schema.domain-column'],
    ['destinationColumn 9', withDraft({ destinationColumn: 9 }), 'schema.domain-column'],
    ['destinationColumn 0', withDraft({ destinationColumn: 0 }), 'schema.domain-column'],
    ['freeLetters [11]', withDraft({ freeLetters: [11] }), 'schema.domain-cell'],
    ['freeLetters [2]', withDraft({ freeLetters: [2] }), 'schema.domain-cell'],
    ['freeLetters [3.5]', withDraft({ freeLetters: [3.5] }), 'schema.type-free-letters'],
    ['arrangement {}', withDraft({ arrangement: {} }), 'schema.type-arrangement'],
    ['placementOrder 9', withDraft({ placementOrder: 9 }), 'schema.type-placement-order'],
  ] as const)(
    '§2 schema stage rejects %s and parseSession gives replay-failed',
    (_, value, code) => {
      expectEngineError(() => checkSchema(value), code);
      expect(parseSession(JSON.stringify(value), EN)).toStrictEqual({
        ok: false,
        reason: 'replay-failed',
        version: 1,
      });
    },
  );
});

describe('version stage (§2, AD-7)', () => {
  const withVersion = (version: unknown): string =>
    JSON.stringify({ ...(validIdleFresh as object), version });
  const { version: _omitted, ...noVersion } = validIdleFresh;

  it.each([
    ['no version', JSON.stringify(noVersion)],
    ['version "1"', withVersion('1')],
    ['version -1', withVersion(-1)],
    ['version 1.5', withVersion(1.5)],
    ['version 2**53', withVersion(2 ** 53)],
    ['version null', withVersion(null)],
    ['unparseable text', '{"version":1,'],
    ['empty text', ''],
    ['root 42', '42'],
    ['root "x"', '"x"'],
    ['root true', 'true'],
    ['session-invalid-null.json', JSON.stringify(invalidNull)],
    ['session-invalid-array.json', JSON.stringify(invalidArray)],
  ])('§2 %s is version-unreadable', (_, text) => {
    expect(parseSession(text, EN)).toStrictEqual({ ok: false, reason: 'version-unreadable' });
  });

  it.each([0, 2, Number.MAX_SAFE_INTEGER])(
    '§2 version %i is version-unknown with the version',
    (version) => {
      expect(parseSession(withVersion(version), EN)).toStrictEqual({
        ok: false,
        reason: 'version-unknown',
        version,
      });
    },
  );
});
