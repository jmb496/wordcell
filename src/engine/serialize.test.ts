import { describe, expect, expectTypeOf, it } from 'vitest';
import historyInvalidActiveMs from '../../fixtures/history-invalid-active-ms.json' with {
  type: 'json',
};
import historyInvalidArray from '../../fixtures/history-invalid-array.json' with { type: 'json' };
import historyInvalidContainerFieldSet from '../../fixtures/history-invalid-container-field-set.json' with {
  type: 'json',
};
import historyInvalidFinalScore from '../../fixtures/history-invalid-final-score.json' with {
  type: 'json',
};
import historyInvalidLetterCountMismatch from '../../fixtures/history-invalid-letter-count-mismatch.json' with {
  type: 'json',
};
import historyInvalidLetterCountShort from '../../fixtures/history-invalid-letter-count-short.json' with {
  type: 'json',
};
import historyInvalidLongestWordLetterCount from '../../fixtures/history-invalid-longest-word-letter-count.json' with {
  type: 'json',
};
import historyInvalidLongestWordNotObject from '../../fixtures/history-invalid-longest-word-not-object.json' with {
  type: 'json',
};
import historyInvalidLongestWordSpellingCase from '../../fixtures/history-invalid-longest-word-spelling-case.json' with {
  type: 'json',
};
import historyInvalidLongestWordSpellingEmpty from '../../fixtures/history-invalid-longest-word-spelling-empty.json' with {
  type: 'json',
};
import historyInvalidNull from '../../fixtures/history-invalid-null.json' with { type: 'json' };
import historyInvalidOutcome from '../../fixtures/history-invalid-outcome.json' with {
  type: 'json',
};
import historyInvalidRecordFieldSet from '../../fixtures/history-invalid-record-field-set.json' with {
  type: 'json',
};
import historyInvalidRecordNotObject from '../../fixtures/history-invalid-record-not-object.json' with {
  type: 'json',
};
import historyInvalidRecordVersion from '../../fixtures/history-invalid-record-version.json' with {
  type: 'json',
};
import historyInvalidRecordsNotArray from '../../fixtures/history-invalid-records-not-array.json' with {
  type: 'json',
};
import historyInvalidSeedUint32 from '../../fixtures/history-invalid-seed-uint32.json' with {
  type: 'json',
};
import historyInvalidWonNegative from '../../fixtures/history-invalid-won-negative.json' with {
  type: 'json',
};
import historyThreeRecords from '../../fixtures/history-three-records.json' with { type: 'json' };
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
import invalidAd7ActiveMsHeadroom from '../../fixtures/session-invalid-ad7-active-ms-headroom.json' with {
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
  accrue,
  apply,
  type Command,
  createSession,
  EN,
  type GameRecord,
  HISTORY_VERSION,
  type ParseHistoryResult,
  type ParseSessionResult,
  parseHistory,
  parseSession,
  reconcileHistory,
  type ScoreHistory,
  type Session,
  serializeHistory,
  serializeSession,
  view,
} from './index';
import { replay } from './replay';
import { checkActiveMsHeadroom, checkContainer, checkRecord, checkSchema } from './serialize';
import { DICT, deepFreeze, drop, play } from './test-helpers';
import { winSeed } from './win-seed';

// --- helpers --------------------------------------------------------------------------------

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
  readonly stage: 'schema' | 'replay' | 'parse';
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
  row(
    'session-invalid-ad7-active-ms-headroom.json',
    invalidAd7ActiveMsHeadroom,
    'idle-fresh',
    'parse',
    'ad7-active-ms-headroom',
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

/** parseSession-only codes, thrown after `replay` returns (src/engine/errors.ts doc comment). */
const PARSE_CODES = ['ad7-active-ms-headroom'];

const SCHEMA_ROWS = REJECTIONS.filter((r) => r.stage === 'schema');
const REPLAY_ROWS = REJECTIONS.filter((r) => r.stage === 'replay');
const PARSE_ROWS = REJECTIONS.filter((r) => r.stage === 'parse');

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

  it('§2 serializeSession copies session.version: a version-2 copy writes version 2', () => {
    const version2 = deepFreeze({ ...parsed(validPlaceFreeLetterRedoTail), version: 2 });
    expect(serializeSession(version2)).toMatch(/^\{"version":2,/);
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
    expect(new Set(PARSE_ROWS.map((r) => r.code))).toStrictEqual(new Set(PARSE_CODES));
    expect(PARSE_CODES).toHaveLength(1);
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
      } else if (stage === 'parse') {
        expect(() => checkSchema(value as object)).not.toThrow();
        expect(() => replay(value as unknown as Session, EN)).not.toThrow();
        expectEngineError(() => checkActiveMsHeadroom(value as unknown as Session), code);
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
    ['placementOrder [9,32,52]', withDraft({ placementOrder: [9, 32, 52] }), 'schema.domain-card'],
    ['arrangement [32,-1]', withDraft({ arrangement: [32, -1] }), 'schema.domain-card'],
    ['destinationCount -1', withDraft({ destinationCount: -1 }), 'schema.domain-count'],
    ['targetCell 2', withDraft({ targetCell: 2 }), 'schema.domain-cell'],
    [
      'cursor.phase null',
      { ...redoTail, cursor: { ...redoTail.cursor, phase: null } },
      'schema.enum-cursor-phase',
    ],
    ['destinationSide 1', withDraft({ destinationSide: 1 }), 'schema.enum-destination-side'],
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

  it('§2 version -0 is version-unknown with version -0 (current behaviour, pinned)', () => {
    const result = parseSession('{"version":-0}', EN);
    expect(result).toStrictEqual({ ok: false, reason: 'version-unknown', version: -0 });
    expect(Object.is((result as { version: number }).version, -0)).toBe(true);
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

// --- score history (CAP-9) -------------------------------------------------------------------
// Helpers as in history.test.ts; shared ones in test-helpers.ts (tests never import a test file).

const reconcile = (records: readonly GameRecord[], before: Session, after: Session) =>
  reconcileHistory(deepFreeze(records), before, after, EN);

const FLIP: Command = { type: 'flip' };
const VALIDATE: Command = { type: 'validate' };
const CONFIRM: Command = { type: 'confirm' };
const UNDO: Command = { type: 'undo' };
const REDO: Command = { type: 'redo' };
const GIVE_UP: Command = { type: 'giveUp' };

/** The seed-1 tan sequence (plan Code Map): T42 A0 N28 placed as N A T, then committed. */
const TAN_SCRIPT: readonly Command[] = [
  drop(3, 2, 6),
  FLIP,
  VALIDATE,
  { type: 'setPlacementOrder', order: [28, 0, 42] },
  CONFIRM,
];

const WON1 = deepFreeze(winSeed(1));
const WON1_BEFORE = play(WON1, [UNDO]);
const TAN_DONE = play(createSession(1), TAN_SCRIPT, ['tan']);
const TAN_GAVE_UP = play(TAN_DONE, [GIVE_UP]);
const ACCRUED = deepFreeze(accrue(deepFreeze(createSession(1)), 1000, EN));
const ACCRUED_GAVE_UP = play(ACCRUED, [GIVE_UP]);

const EMPTY_HISTORY: ScoreHistory = deepFreeze({ version: HISTORY_VERSION, records: [] });
const RECONCILED: ScoreHistory = deepFreeze({
  version: HISTORY_VERSION,
  records: reconcile(
    reconcile(reconcile([], WON1_BEFORE, WON1), TAN_DONE, TAN_GAVE_UP),
    ACCRUED,
    ACCRUED_GAVE_UP,
  ),
});

const RECORD_KEYS = ['version', 'seed', 'outcome', 'finalScore', 'longestWord', 'activeMs'];

/** Direct run of the parseHistory checks: the first thrown code, or undefined when none throws. */
function firstHistoryCode(value: unknown): string | undefined {
  try {
    checkContainer(value as object);
    const { records, version } = value as { records: unknown[]; version: number };
    for (const record of records) checkRecord(record, version);
  } catch (error) {
    if (error instanceof EngineError) return error.check;
    throw error;
  }
  return undefined;
}

describe('ParseHistoryResult (AD-7)', () => {
  it('§2 ParseHistoryResult has the AD-7 shape (checked by npm run check)', () => {
    expectTypeOf<ParseHistoryResult>().toEqualTypeOf<
      | { readonly ok: true; readonly history: ScoreHistory }
      | { readonly ok: false; readonly reason: 'version-unreadable' }
      | {
          readonly ok: false;
          readonly reason: 'version-unknown' | 'contents-unreadable';
          readonly version: number;
        }
    >();
  });
});

describe('history round trip (§2, CAP-9)', () => {
  it.each([
    ['empty history', EMPTY_HISTORY],
    ['reconciled history', RECONCILED],
    ['history-three-records.json', historyThreeRecords as unknown as ScoreHistory],
  ] as const)('§2 %s parses to itself and re-serialises byte-equal', (_, h) => {
    const text = serializeHistory(deepFreeze(h));
    const result = parseHistory(text);
    expect(result).toStrictEqual({ ok: true, history: h });
    if (!result.ok) return;
    expect(serializeHistory(deepFreeze(result.history))).toBe(text);
    for (const record of JSON.parse(text).records)
      expect(Object.keys(record)).toStrictEqual(
        RECORD_KEYS.filter((k) => k !== 'longestWord' || Object.hasOwn(record, k)),
      );
  });

  it('§2 the reconciled records are won with a word, gaveUp negative with a word, gaveUp without one', () => {
    const [won, gaveUpWord, gaveUpNone] = RECONCILED.records;
    expect(RECONCILED.records).toHaveLength(3);
    expect(won.outcome).toBe('won');
    expect(Object.hasOwn(won, 'longestWord')).toBe(true);
    expect(gaveUpWord.outcome).toBe('gaveUp');
    expect(gaveUpWord.finalScore).toBeLessThan(0);
    expect(gaveUpWord.longestWord).toStrictEqual({ spelling: 'tan', letterCount: 3 });
    expect(gaveUpNone.outcome).toBe('gaveUp');
    expect(Object.hasOwn(gaveUpNone, 'longestWord')).toBe(false);
    expect(gaveUpNone.activeMs).toBe(1000);
  });

  it('§2 history-three-records.json equals the reconciled history and its serialisation', () => {
    // Equality with live reconcileHistory output is intended drift detection: a scoring or
    // record change fails here, and the fixture is then regenerated (not hand-edited).
    expect(historyThreeRecords).toStrictEqual(RECONCILED);
    expect(JSON.stringify(historyThreeRecords)).toBe(serializeHistory(RECONCILED));
  });

  it('§2 serializeHistory copies the container and record versions: a version-2 copy writes 2', () => {
    const version2: ScoreHistory = deepFreeze({
      version: 2,
      records: RECONCILED.records.map((r) => ({ ...r, version: 2 })),
    });
    const json = JSON.parse(serializeHistory(version2));
    expect(json.version).toBe(2);
    expect(json.records.map((r: GameRecord) => r.version)).toStrictEqual([2, 2, 2]);
  });

  it('§2 serializeHistory writes AD-6 key order whatever the insertion order', () => {
    const reverse = <T extends object>(o: T): T =>
      Object.fromEntries(Object.entries(o).reverse()) as T;
    const reversed = deepFreeze(
      reverse({
        ...RECONCILED,
        records: RECONCILED.records.map((r) =>
          reverse(r.longestWord === undefined ? r : { ...r, longestWord: reverse(r.longestWord) }),
        ),
      }),
    );
    expect(Object.keys(reversed)[0]).toBe('records');
    expect(Object.keys(reversed.records[0])[0]).toBe('activeMs');
    expect(Object.keys(reversed.records[0].longestWord ?? {})[0]).toBe('letterCount');
    expect(serializeHistory(reversed)).toBe(serializeHistory(RECONCILED));
  });
});

describe('activeMs headroom (§2, AD-7)', () => {
  it('§2 idle-fresh with activeMs 2^52 parses; accrue, view and giveUp work on the result', () => {
    const result = parseSession(JSON.stringify({ ...validIdleFresh, activeMs: 2 ** 52 }), EN);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const parsed = deepFreeze(result.session);
    const accrued = deepFreeze(accrue(parsed, 86_400_000, EN));
    expect(accrued.activeMs).toBe(2 ** 52 + 86_400_000);
    expect(() => view(accrued, EN)).not.toThrow();
    const gaveUp = apply(accrued, { type: 'giveUp' }, { lang: EN });
    expect(Object.keys(gaveUp)).toStrictEqual(['session']);
    // The accrued Session is above the headroom, so the next parse rejects it: the bound is
    // parse-only (AD-7) and accrue keeps the safe-integer domain.
    expect(parseSession(serializeSession(accrued), EN)).toStrictEqual({
      ok: false,
      reason: 'replay-failed',
      version: accrued.version,
    });
  });

  it('§2 the headroom bound is parse-only: view and giveUp accept the rejected fixture', () => {
    const frozen = deepFreeze(invalidAd7ActiveMsHeadroom) as unknown as Session;
    expect(() => view(frozen, EN)).not.toThrow();
    const gaveUp = apply(frozen, { type: 'giveUp' }, { lang: EN });
    expect(Object.keys(gaveUp)).toStrictEqual(['session']);
  });

  it('§2 seed -1 with activeMs 2^52 + 1 is replay-failed', () => {
    const value = deepFreeze({ ...validIdleFresh, seed: -1, activeMs: 2 ** 52 + 1 });
    expect(parseSession(JSON.stringify(value), EN)).toStrictEqual({
      ok: false,
      reason: 'replay-failed',
      version: value.version,
    });
    expectEngineError(() => replay(value as unknown as Session, EN), 'seed-uint32');
  });
});

interface HistoryRow {
  readonly file: string;
  readonly value: unknown;
  readonly reason: 'version-unreadable' | 'contents-unreadable';
  readonly code?: string;
}

const historyRow = (
  file: string,
  value: unknown,
  reason: HistoryRow['reason'],
  code?: string,
): HistoryRow => ({ file, value, reason, ...(code === undefined ? {} : { code }) });

/** One rejecting fixture per container and record check (CAP-9), plus null and array roots. */
const HISTORY_REJECTIONS: readonly HistoryRow[] = [
  historyRow('history-invalid-null.json', historyInvalidNull, 'version-unreadable'),
  historyRow('history-invalid-array.json', historyInvalidArray, 'version-unreadable'),
  historyRow(
    'history-invalid-container-field-set.json',
    historyInvalidContainerFieldSet,
    'contents-unreadable',
    'history.container-field-set',
  ),
  historyRow(
    'history-invalid-records-not-array.json',
    historyInvalidRecordsNotArray,
    'contents-unreadable',
    'history.records-not-array',
  ),
  historyRow(
    'history-invalid-record-not-object.json',
    historyInvalidRecordNotObject,
    'contents-unreadable',
    'history.record-not-object',
  ),
  historyRow(
    'history-invalid-record-field-set.json',
    historyInvalidRecordFieldSet,
    'contents-unreadable',
    'history.record-field-set',
  ),
  historyRow(
    'history-invalid-record-version.json',
    historyInvalidRecordVersion,
    'contents-unreadable',
    'history.record-version',
  ),
  historyRow(
    'history-invalid-seed-uint32.json',
    historyInvalidSeedUint32,
    'contents-unreadable',
    'history.seed-uint32',
  ),
  historyRow(
    'history-invalid-outcome.json',
    historyInvalidOutcome,
    'contents-unreadable',
    'history.outcome',
  ),
  historyRow(
    'history-invalid-final-score.json',
    historyInvalidFinalScore,
    'contents-unreadable',
    'history.final-score',
  ),
  historyRow(
    'history-invalid-active-ms.json',
    historyInvalidActiveMs,
    'contents-unreadable',
    'history.active-ms',
  ),
  historyRow(
    'history-invalid-longest-word-not-object.json',
    historyInvalidLongestWordNotObject,
    'contents-unreadable',
    'history.longest-word-not-object',
  ),
  historyRow(
    'history-invalid-longest-word-spelling-empty.json',
    historyInvalidLongestWordSpellingEmpty,
    'contents-unreadable',
    'history.longest-word-spelling',
  ),
  historyRow(
    'history-invalid-longest-word-spelling-case.json',
    historyInvalidLongestWordSpellingCase,
    'contents-unreadable',
    'history.longest-word-spelling',
  ),
  historyRow(
    'history-invalid-longest-word-letter-count.json',
    historyInvalidLongestWordLetterCount,
    'contents-unreadable',
    'history.longest-word-letter-count',
  ),
  historyRow(
    'history-invalid-letter-count-short.json',
    historyInvalidLetterCountShort,
    'contents-unreadable',
    'history.longest-word-letter-count-short',
  ),
  historyRow(
    'history-invalid-letter-count-mismatch.json',
    historyInvalidLetterCountMismatch,
    'contents-unreadable',
    'history.longest-word-letter-count-mismatch',
  ),
  historyRow(
    'history-invalid-won-negative.json',
    historyInvalidWonNegative,
    'contents-unreadable',
    'history.won-final-score',
  ),
];

/** The container and record codes (src/engine/errors.ts doc comment). */
const HISTORY_CODES = [
  'history.container-field-set',
  'history.records-not-array',
  'history.record-not-object',
  'history.record-field-set',
  'history.record-version',
  'history.seed-uint32',
  'history.outcome',
  'history.final-score',
  'history.active-ms',
  'history.longest-word-not-object',
  'history.longest-word-spelling',
  'history.longest-word-letter-count',
  'history.longest-word-letter-count-short',
  'history.longest-word-letter-count-mismatch',
  'history.won-final-score',
];

describe('history rejecting fixtures (§2, CAP-9)', () => {
  it('§2 history fixture codes cover HISTORY_CODES, unique except the two spelling fixtures', () => {
    expect(HISTORY_CODES).toHaveLength(15);
    const coded = HISTORY_REJECTIONS.filter((r) => r.code !== undefined);
    expect(new Set(coded.map((r) => r.code))).toStrictEqual(new Set(HISTORY_CODES));
    const shared = HISTORY_CODES.filter((code) => coded.filter((r) => r.code === code).length > 1);
    expect(shared).toStrictEqual(['history.longest-word-spelling']);
    expect(
      coded.filter((r) => r.code === 'history.longest-word-spelling').map((r) => r.file),
    ).toStrictEqual([
      'history-invalid-longest-word-spelling-empty.json',
      'history-invalid-longest-word-spelling-case.json',
    ]);
    expect(coded).toHaveLength(16);
  });

  it.each(HISTORY_REJECTIONS.map((r) => [r.file, r] as const))(
    '§2 %s gives its parseHistory reason and the checks throw its code first',
    (_, { value, reason, code }) => {
      const result = parseHistory(JSON.stringify(value));
      if (reason === 'version-unreadable') {
        expect(result).toStrictEqual({ ok: false, reason: 'version-unreadable' });
        return;
      }
      const { version } = value as { version: number };
      expect(result).toStrictEqual({ ok: false, reason: 'contents-unreadable', version });
      expect(firstHistoryCode(deepFreeze(value))).toBe(code);
    },
  );
});

describe('history inline boundaries (§2, CAP-9)', () => {
  const base = (historyThreeRecords as unknown as ScoreHistory).records[0];
  const word = base.longestWord as { spelling: string; letterCount: number };
  const container = (records: readonly unknown[]) => ({ version: HISTORY_VERSION, records });
  const noLongestWord = <T extends { longestWord?: unknown }>(
    record: T,
  ): Omit<T, 'longestWord'> => {
    const { longestWord: _omitted, ...rest } = record;
    return rest;
  };

  it.each([
    ['seed -1', { ...base, seed: -1 }, 'history.seed-uint32'],
    ['seed 4294967296', { ...base, seed: 4294967296 }, 'history.seed-uint32'],
    ['activeMs -1', { ...base, activeMs: -1 }, 'history.active-ms'],
    ['finalScore 1.5', { ...base, finalScore: 1.5 }, 'history.final-score'],
    [
      'letterCount 0',
      { ...base, longestWord: { ...word, letterCount: 0 } },
      'history.longest-word-letter-count',
    ],
    ['an extra record key', { ...base, extra: 0 }, 'history.record-field-set'],
    [
      'a longestWord extra key',
      { ...base, longestWord: { ...word, extra: 0 } },
      'history.longest-word-not-object',
    ],
    [
      'a longestWord missing key',
      { ...base, longestWord: { spelling: word.spelling } },
      'history.longest-word-not-object',
    ],
    ['a longestWord array', { ...base, longestWord: [] }, 'history.longest-word-not-object'],
    ['seed 1.5', { ...base, seed: 1.5 }, 'history.seed-uint32'],
    ['seed "1"', { ...base, seed: '1' }, 'history.seed-uint32'],
    ['activeMs 1.5', { ...base, activeMs: 1.5 }, 'history.active-ms'],
    ['finalScore "355"', { ...base, finalScore: '355' }, 'history.final-score'],
    [
      'letterCount 1.5',
      { ...base, longestWord: { ...word, letterCount: 1.5 } },
      'history.longest-word-letter-count',
    ],
    [
      'spelling 5',
      { ...base, longestWord: { ...word, spelling: 5 } },
      'history.longest-word-spelling',
    ],
    [
      'spelling lqueJata',
      { ...base, longestWord: { ...word, spelling: 'lqueJata' } },
      'history.longest-word-spelling',
    ],
    [
      'spelling tan1',
      { ...base, longestWord: { ...word, spelling: 'tan1' } },
      'history.longest-word-spelling',
    ],
    ['a record array', [], 'history.record-not-object'],
    ['outcome 5', { ...base, outcome: 5 }, 'history.outcome'],
    ['record version "1"', { ...base, version: '1' }, 'history.record-version'],
    [
      "longestWord 'ab' 2",
      { ...base, longestWord: { spelling: 'ab', letterCount: 2 } },
      'history.longest-word-letter-count-short',
    ],
    [
      "longestWord 'tan' 4",
      { ...base, longestWord: { spelling: 'tan', letterCount: 4 } },
      'history.longest-word-letter-count-mismatch',
    ],
    [
      "longestWord 'tans' 3",
      { ...base, longestWord: { spelling: 'tans', letterCount: 3 } },
      'history.longest-word-letter-count-mismatch',
    ],
    ['a won record at finalScore -1', { ...base, finalScore: -1 }, 'history.won-final-score'],
    [
      'a won record at finalScore -1 without longestWord',
      noLongestWord({ ...base, finalScore: -1 }),
      'history.won-final-score',
    ],
  ] as const)('§2 checkRecord rejects %s with its code', (_, record, code) => {
    const frozen = deepFreeze(record);
    expectEngineError(() => checkRecord(frozen, HISTORY_VERSION), code);
    expect(parseHistory(JSON.stringify(container([frozen])))).toStrictEqual({
      ok: false,
      reason: 'contents-unreadable',
      version: HISTORY_VERSION,
    });
  });

  /**
   * Adjacent pairs of the checkRecord order: the first record breaks both checks and the first
   * wins; the repaired record fixes the first check and still breaks the second.
   */
  it.each([
    ['history.record-not-object', 'history.record-field-set', [], {}],
    [
      'history.record-field-set',
      'history.record-version',
      { ...base, extra: 0, version: '1' },
      { ...base, version: '1' },
    ],
    [
      'history.record-version',
      'history.seed-uint32',
      { ...base, version: '1', seed: -1 },
      { ...base, seed: -1 },
    ],
    [
      'history.seed-uint32',
      'history.outcome',
      { ...base, seed: -1, outcome: 5 },
      { ...base, outcome: 5 },
    ],
    [
      'history.outcome',
      'history.final-score',
      { ...base, outcome: 5, finalScore: 1.5 },
      { ...base, finalScore: 1.5 },
    ],
    [
      'history.final-score',
      'history.active-ms',
      { ...base, finalScore: 1.5, activeMs: -1 },
      { ...base, activeMs: -1 },
    ],
    [
      'history.active-ms',
      'history.longest-word-not-object',
      { ...base, activeMs: -1, longestWord: [] },
      { ...base, longestWord: [] },
    ],
    [
      'history.longest-word-not-object',
      'history.longest-word-spelling',
      { ...base, longestWord: { spelling: 5 } },
      { ...base, longestWord: { spelling: 5, letterCount: 1 } },
    ],
    [
      'history.longest-word-spelling',
      'history.longest-word-letter-count',
      { ...base, longestWord: { spelling: 'Tan', letterCount: 0 } },
      { ...base, longestWord: { spelling: 'tan', letterCount: 0 } },
    ],
    [
      'history.longest-word-letter-count',
      'history.longest-word-letter-count-short',
      { ...base, longestWord: { spelling: 'ab', letterCount: 0 } },
      { ...base, longestWord: { spelling: 'ab', letterCount: 2 } },
    ],
    [
      'history.longest-word-letter-count-short',
      'history.longest-word-letter-count-mismatch',
      { ...base, longestWord: { spelling: 'tan', letterCount: 2 } },
      { ...base, longestWord: { spelling: 'tan', letterCount: 4 } },
    ],
    [
      'history.longest-word-letter-count-mismatch',
      'history.won-final-score',
      { ...base, finalScore: -1, longestWord: { spelling: 'tan', letterCount: 4 } },
      { ...base, finalScore: -1, longestWord: { spelling: 'tan', letterCount: 3 } },
    ],
    [
      'history.active-ms',
      'history.won-final-score',
      noLongestWord({ ...base, finalScore: -1, activeMs: -1 }),
      noLongestWord({ ...base, finalScore: -1 }),
    ],
  ] as const)('§2 checkRecord runs in order: %s before %s', (first, second, record, repaired) => {
    expectEngineError(() => checkRecord(deepFreeze(record), HISTORY_VERSION), first);
    expectEngineError(() => checkRecord(deepFreeze(repaired), HISTORY_VERSION), second);
  });

  it('§2 parseHistory checks every record: a bad record 1 after a valid record 0 is rejected', () => {
    const h = deepFreeze(container([base, { ...base, seed: -1 }]));
    expect(parseHistory(JSON.stringify(h))).toStrictEqual({
      ok: false,
      reason: 'contents-unreadable',
      version: HISTORY_VERSION,
    });
    expect(firstHistoryCode(h)).toBe('history.seed-uint32');
  });

  it('§2 checkContainer rejects a container with records dropped', () => {
    const dropped = deepFreeze({ version: HISTORY_VERSION });
    expectEngineError(() => checkContainer(dropped), 'history.container-field-set');
    expect(parseHistory(JSON.stringify(dropped))).toStrictEqual({
      ok: false,
      reason: 'contents-unreadable',
      version: HISTORY_VERSION,
    });
  });

  it.each([
    ['seed 0', { ...base, seed: 0 }],
    ['seed 4294967295', { ...base, seed: 4294967295 }],
    ['a negative finalScore', { ...base, outcome: 'gaveUp', finalScore: -5 }],
    ['a won record at finalScore 0', { ...base, finalScore: 0 }],
    [
      'a gaveUp record at a negative finalScore with a longestWord',
      {
        ...base,
        outcome: 'gaveUp',
        finalScore: -1,
        longestWord: { spelling: 'tan', letterCount: 3 },
      },
    ],
    [
      "longestWord 'tan' 3 (letterCount exactly 3)",
      { ...base, longestWord: { spelling: 'tan', letterCount: 3 } },
    ],
    ['record activeMs 2^52 + 1', { ...base, activeMs: 4503599627370497 }],
    ['record activeMs Number.MAX_SAFE_INTEGER', { ...base, activeMs: Number.MAX_SAFE_INTEGER }],
    [
      'longestWord quiz (QU counts 2)',
      { ...base, longestWord: { spelling: 'quiz', letterCount: 4 } },
    ],
  ] as const)('§2 parseHistory accepts %s', (_, record) => {
    const h = deepFreeze(container([record]));
    expect(parseHistory(JSON.stringify(h))).toStrictEqual({ ok: true, history: h });
  });
});

describe('history version stage (§2, AD-7)', () => {
  const withVersion = (version: unknown): string =>
    JSON.stringify({ ...(historyThreeRecords as object), version });
  const { version: _omitted, ...noVersion } = historyThreeRecords;

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
  ])('§2 history %s is version-unreadable', (_, text) => {
    expect(parseHistory(text)).toStrictEqual({ ok: false, reason: 'version-unreadable' });
  });

  it('§2 history version -0 is version-unknown with version -0 (current behaviour, pinned)', () => {
    const result = parseHistory('{"version":-0}');
    expect(result).toStrictEqual({ ok: false, reason: 'version-unknown', version: -0 });
    expect(Object.is((result as { version: number }).version, -0)).toBe(true);
  });

  it.each([0, 2, Number.MAX_SAFE_INTEGER])(
    '§2 history version %i is version-unknown with the version',
    (version) => {
      expect(parseHistory(withVersion(version))).toStrictEqual({
        ok: false,
        reason: 'version-unknown',
        version,
      });
    },
  );
});

// --- fixture regeneration (AD-17) -----------------------------------------------------------
// The epic 2 generator record (plan Code Map): seed 1, dictionary {tan, one, man}; built with
// engine createSession / accrue / apply via test-helpers `play`, plus `winSeed(1)`. A fixture no
// script reproduces is a bug to report.

const FIXTURE_WORDS = ['tan', 'one', 'man'];
const FIXTURE_TAN: readonly Command[] = [drop(3, 2, 6), FLIP];
const FIXTURE_TAN_PLACE: readonly Command[] = [...FIXTURE_TAN, VALIDATE];
const FIXTURE_TAN_DONE: readonly Command[] = [...FIXTURE_TAN_PLACE, CONFIRM];
const FIXTURE_ONE: readonly Command[] = [
  drop(4, 1, 6),
  { type: 'addFreeLetter', cell: 3 },
  FLIP,
  VALIDATE,
];
const FIXTURE_ONE_DONE: readonly Command[] = [
  ...FIXTURE_ONE,
  { type: 'setPlacementOrder', order: [9, 32, 28] },
  CONFIRM,
];
const FIXTURE_MAN: readonly Command[] = [
  drop(2, 1, 6),
  { type: 'setDestinationCount', k: 2 },
  FLIP,
  VALIDATE,
  CONFIRM,
];
const fromSeed1 = (commands: readonly Command[]): Session =>
  play(createSession(1), commands, FIXTURE_WORDS);

const REBUILDS: readonly (readonly [string, unknown, () => Session])[] = [
  ['session-idle-fresh', validIdleFresh, () => deepFreeze(createSession(1))],
  ['session-composing', validComposing, () => fromSeed1(FIXTURE_TAN)],
  [
    'session-composing-draft-2-letters',
    validComposingDraft2Letters,
    () => fromSeed1([drop(3, 1, 6), FLIP]),
  ],
  ['session-place', validPlace, () => fromSeed1(FIXTURE_TAN_PLACE)],
  [
    'session-idle-pending-draft',
    validIdlePendingDraft,
    () => fromSeed1([...FIXTURE_TAN_PLACE, UNDO, UNDO]),
  ],
  [
    'session-place-free-letter-redo-tail',
    validPlaceFreeLetterRedoTail,
    () =>
      fromSeed1([...FIXTURE_TAN_DONE, ...FIXTURE_ONE_DONE, ...FIXTURE_MAN, UNDO, UNDO, UNDO, UNDO]),
  ],
  [
    'session-below-committed-last',
    validBelowCommittedLast,
    () => fromSeed1([...FIXTURE_TAN_DONE, ...FIXTURE_ONE, UNDO, UNDO, UNDO]),
  ],
  ['session-won', validWon, () => deepFreeze(winSeed(1))],
  [
    'session-gave-up',
    validGaveUp,
    () => play(accrue(deepFreeze(createSession(1)), 1000, EN), [GIVE_UP]),
  ],
];

describe('AD-17 fixture regeneration', () => {
  it('AD-17 REBUILDS covers exactly the VALID fixtures, in order, as session-<name>', () => {
    expect(REBUILDS.map(([name]) => name)).toEqual(VALID.map(([name]) => `session-${name}`));
    REBUILDS.forEach(([, fixture], i) => {
      expect(fixture).toBe(VALID[i]?.[1]);
    });
  });

  it.each(REBUILDS)(
    'AD-17 %s.json equals its scripted accrue/apply rebuild',
    (_name, fixture, build) => {
      const built = build();
      expect(JSON.parse(serializeSession(built))).toStrictEqual(fixture);
      expect(JSON.stringify(fixture)).toBe(serializeSession(built));
    },
  );
});

describe('scripted game (§2, SPEC Success signal)', () => {
  function expectRoundTrip(session: Session): void {
    const result = parseSession(serializeSession(session), EN);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.session).toStrictEqual(session);
    expect(view(result.session, EN)).toStrictEqual(view(session, EN));
  }

  it('§2 a scripted seed-1 game round-trips to an equal view after every step, undo to the start and redo to the end', () => {
    const ctx = DICT('tan');
    const step = (session: Session, command: Command): Session => {
      const next = deepFreeze(apply(session, deepFreeze(command), ctx).session);
      expect(next).not.toBe(session);
      expectRoundTrip(next);
      return next;
    };
    const start = deepFreeze(createSession(1));
    expectRoundTrip(start);
    let session = start;
    for (const command of TAN_SCRIPT) session = step(session, command);
    expect(session.cursor).toStrictEqual({ index: 1, phase: 'idle' });
    const end = view(session, EN);

    for (let i = 0; i < 3; i++) {
      expect(view(session, EN).canUndo).toBe(true);
      session = step(session, UNDO);
    }
    const undone = view(session, EN);
    const fresh = view(start, EN);
    expect(session.cursor).toStrictEqual({ index: 0, phase: 'idle' });
    expect(undone.canUndo).toBe(false);
    expect(undone.canRedo).toBe(true);
    expect(undone.columns).toStrictEqual(fresh.columns);
    expect(undone.cells).toStrictEqual(fresh.cells);

    for (let i = 0; i < 3; i++) {
      expect(view(session, EN).canRedo).toBe(true);
      session = step(session, REDO);
    }
    const redone = view(session, EN);
    expect(redone.canRedo).toBe(false);
    expect(redone).toStrictEqual(end);
  });
});
