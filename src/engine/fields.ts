/**
 * AD-7, §2 field lists and value predicates shared by the schema stage (serialize.ts), the AD-7
 * pre-replay checks (replay.ts), `assertSeed`, `accrue` and the history record check. Each list
 * holds an object's keys in §2 order, each entry marked required or optional. Internal: never
 * exported from `index.ts`.
 */

/** One key of an object's field list, marked required or optional. */
export type FieldEntry = readonly [name: string, presence: 'required' | 'optional'];
export type FieldList = readonly FieldEntry[];

/** §2 Session keys; `version` is checked by the AD-7 version stage, so optional here. */
export const SESSION_FIELDS: FieldList = [
  ['version', 'optional'],
  ['seed', 'required'],
  ['moves', 'required'],
  ['cursor', 'required'],
  ['gaveUp', 'required'],
  ['activeMs', 'required'],
];

/** §2 cursor keys. */
export const CURSOR_FIELDS: FieldList = [
  ['index', 'required'],
  ['phase', 'required'],
];

/** §2 Move keys; `targetCell` and `placementOrder` present iff reached ≥ place (AD-7). */
export const MOVE_FIELDS: FieldList = [
  ['sourceColumn', 'required'],
  ['sourceCount', 'required'],
  ['destinationColumn', 'required'],
  ['destinationCount', 'required'],
  ['destinationSide', 'required'],
  ['freeLetters', 'required'],
  ['arrangement', 'required'],
  ['reached', 'required'],
  ['targetCell', 'optional'],
  ['placementOrder', 'optional'],
];

/**
 * The first field-set violation of `object` against `fields`, or `undefined`. 'missing': the first
 * absent required key in list order; 'unknown': the first own key not in the list; 'exact':
 * 'missing', then 'unknown'.
 */
export function fieldSetViolation(
  object: object,
  fields: FieldList,
  mode: 'missing' | 'unknown' | 'exact',
): string | undefined {
  if (mode !== 'unknown') {
    const missing = fields.find(
      ([name, presence]) => presence === 'required' && !Object.hasOwn(object, name),
    );
    if (missing !== undefined) return missing[0];
    if (mode === 'missing') return undefined;
  }
  return Object.keys(object).find((key) => !fields.some(([name]) => name === key));
}

/** AD-2 / AD-7 seed domain: an integer 0 … 2^32 − 1. */
export const isUint32 = (value: unknown): value is number =>
  Number.isSafeInteger(value) && (value as number) >= 0 && (value as number) <= 0xffff_ffff;

/** A non-negative safe integer (AD-7 `activeMs` and version, R-76 `elapsedMs`). */
export const isSafeNonNegative = (value: unknown): value is number =>
  Number.isSafeInteger(value) && (value as number) >= 0;
