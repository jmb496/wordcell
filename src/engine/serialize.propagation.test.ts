import { describe, expect, it, vi } from 'vitest';
import validIdleFresh from '../../fixtures/session-idle-fresh.json' with { type: 'json' };
import { EN } from './lang/en';
import { parseHistory, parseSession } from './serialize';

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

describe('parseHistory propagation', () => {
  it('AD-15 parseHistory rethrows a non-EngineError from the container or record stage (CLAUDE.md rule 6)', () => {
    const spy = vi.spyOn(JSON, 'parse').mockReturnValueOnce({
      version: 1,
      get records() {
        throw new TypeError('x');
      },
    });
    let thrown: unknown;
    try {
      parseHistory('{}');
    } catch (error) {
      thrown = error;
    } finally {
      spy.mockRestore();
    }
    expect(thrown).toBeInstanceOf(TypeError);
    expect((thrown as TypeError).message).toBe('x');
  });

  it('AD-15 parseHistory rethrows a non-SyntaxError from JSON.parse (CLAUDE.md rule 6)', () => {
    const spy = vi.spyOn(JSON, 'parse').mockImplementationOnce(() => {
      throw new TypeError('not a SyntaxError');
    });
    let thrown: unknown;
    try {
      parseHistory('{}');
    } catch (error) {
      thrown = error;
    } finally {
      spy.mockRestore();
    }
    expect(thrown).toBeInstanceOf(TypeError);
    expect((thrown as TypeError).message).toBe('not a SyntaxError');
  });
});
