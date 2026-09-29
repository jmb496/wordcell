import { describe, expect, it } from 'vitest';
import { EN } from './lang/en';
import { replay, status } from './replay';
import { winSeed } from './win-seed';

describe('winSeed', () => {
  it('R-62 winSeed wins seeds 1 and 4294967295 at cursor {8, idle}', () => {
    for (const seed of [1, 4294967295]) {
      const s = winSeed(seed);
      expect(s.cursor).toStrictEqual({ index: 8, phase: 'idle' });
      expect(s.moves).toHaveLength(8);
      expect(status(s, replay(s, EN))).toBe('won');
    }
  });
});
