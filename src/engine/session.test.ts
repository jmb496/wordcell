import { describe, expect, it } from 'vitest';
import { dealIds } from './deal';
import { EngineError } from './errors';
import { EN } from './lang/en';
import { replay, status } from './replay';
import { createSession, SESSION_VERSION } from './session';

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

function deepFreeze<T>(value: T): T {
  if (typeof value === 'object' && value !== null) {
    for (const child of Object.values(value)) deepFreeze(child);
    Object.freeze(value);
  }
  return value;
}

const fresh = (seed: number) => ({
  version: SESSION_VERSION,
  seed,
  moves: [],
  cursor: { index: 0, phase: 'idle' },
  gaveUp: false,
  activeMs: 0,
});

describe('createSession', () => {
  it('R-04 all eight WordCells start empty, moves = [], cursor = {0, idle}, status playing', () => {
    expect(SESSION_VERSION).toBe(1);
    const session = deepFreeze(createSession(7));
    expect(session).toStrictEqual(fresh(7));
    const position = replay(session, deepFreeze(EN));
    expect(position.cells).toStrictEqual([[], [], [], [], [], [], [], []]);
    expect(position.columns).toStrictEqual(dealIds(7));
    expect(status(session, position)).toBe('playing');
  });

  it('R-74 a fresh Session for any uint32 seed; other seeds throw', () => {
    for (const seed of [0, 4294967295]) expect(createSession(seed)).toStrictEqual(fresh(seed));
    for (const seed of [-1, 4294967296, 1.5, Number.NaN, Number.POSITIVE_INFINITY])
      expectEngineError(() => createSession(seed), 'seed-uint32');
  });
});
