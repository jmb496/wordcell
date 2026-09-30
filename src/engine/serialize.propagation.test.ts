import { describe, expect, it, vi } from 'vitest';
import validIdleFresh from '../../fixtures/session-idle-fresh.json' with { type: 'json' };
import { EN } from './lang/en';
import { parseSession } from './serialize';

// serialize.ts calls `replay` from './replay'; only that export is overridden.
vi.mock('./replay', async (importOriginal) => ({
  ...(await importOriginal<typeof import('./replay')>()),
  replay: () => {
    throw new TypeError('not an EngineError');
  },
}));

describe('parseSession propagation', () => {
  it('AD-15 parseSession rethrows a non-EngineError from the replay stage (CLAUDE.md rule 6)', () => {
    const parse = () => parseSession(JSON.stringify(validIdleFresh), EN);
    expect(parse).toThrow(TypeError);
    expect(parse).toThrow('not an EngineError');
  });
});
