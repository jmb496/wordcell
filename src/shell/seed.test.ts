import { afterEach, expect, it, vi } from 'vitest';
import { newSeed } from './seed';

afterEach(() => {
  vi.unstubAllGlobals();
});

for (const value of [0, 4294967295]) {
  it(`AD-5 newSeed returns the uint32 crypto.getRandomValues fills (${value})`, () => {
    vi.stubGlobal('crypto', {
      getRandomValues: (array: Uint32Array) => {
        array[0] = value;
        return array;
      },
    });
    expect(newSeed()).toBe(value);
  });
}

it('AD-5 newSeed returns an integer in 0…4294967295 from the real crypto', () => {
  const seed = newSeed();
  expect(Number.isInteger(seed)).toBe(true);
  expect(seed).toBeGreaterThanOrEqual(0);
  expect(seed).toBeLessThanOrEqual(4294967295);
});
