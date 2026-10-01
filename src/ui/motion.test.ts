import { beforeEach, describe, expect, it, vi } from 'vitest';
import { duration, type MotionKind, stagger } from './motion';

const mocked = vi.hoisted(() => ({ motion: { baseMs: 180, reduced: false } }));

vi.mock('../shell/prefs.svelte', () => ({
  prefs: {
    get motion() {
      return mocked.motion;
    },
  },
}));

const FACTORS: [MotionKind, number][] = [
  ['snap', 1],
  ['flyBack', 1],
  ['parting', 0.5],
  ['undoRedo', 1],
  ['flyToCell', 2],
  ['overlay', 1],
];

beforeEach(() => {
  mocked.motion = { baseMs: 180, reduced: false };
});

describe('motion', () => {
  for (const baseMs of [90, 180, 320]) {
    it(`AD-10 motion durations at baseMs ${baseMs}: each kind is its factor × baseMs`, () => {
      mocked.motion = { baseMs, reduced: false };
      for (const [kind, factor] of FACTORS) expect(duration(kind), kind).toBe(baseMs * factor);
    });
  }

  for (const baseMs of [90, 180, 320]) {
    it(`AD-10 motion durations under reduced motion at baseMs ${baseMs}: 120 ms fade, parting 0`, () => {
      mocked.motion = { baseMs, reduced: true };
      for (const [kind] of FACTORS) {
        expect(duration(kind), kind).toBe(kind === 'parting' ? 0 : 120);
      }
    });
  }

  it('AD-10 motion durations follow a live change of prefs.motion', () => {
    expect(duration('flyToCell')).toBe(360);
    mocked.motion = { baseMs: 90, reduced: false };
    expect(duration('flyToCell')).toBe(180);
    mocked.motion = { baseMs: 90, reduced: true };
    expect(duration('flyToCell')).toBe(120);
  });

  it('AD-10 stagger() is 30 ms, 0 under reduced motion', () => {
    for (const baseMs of [90, 180, 320]) {
      mocked.motion = { baseMs, reduced: false };
      expect(stagger()).toBe(30);
      mocked.motion = { baseMs, reduced: true };
      expect(stagger()).toBe(0);
    }
  });
});
