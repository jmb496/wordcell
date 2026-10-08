import { describe, expect, it } from 'vitest';
import { fitSize } from './fit';

/** A fake measure: `chars` glyphs of 0.6 em each. */
const width = (chars: number) => (px: number) => chars * px * 0.6;

describe('AD-11 fitSize', () => {
  it('AD-11 fitSize keeps max when the text fits at max', () => {
    expect(fitSize(width(10), 400, 20)).toBe(20);
    // Exactly the box fits.
    expect(fitSize(width(10), 120, 20)).toBe(20);
  });

  it('AD-11 fitSize shrinks to the largest integer size that fits', () => {
    // 20 glyphs: 12 px per px of size; 200 / 12 = 16.67 → 16.
    expect(fitSize(width(20), 200, 20)).toBe(16);
  });

  it('AD-11 fitSize floors at min when nothing fits', () => {
    expect(fitSize(width(40), 200, 20)).toBe(14);
    expect(fitSize(width(40), 200, 20, 12)).toBe(12);
  });

  it('AD-11 fitSize with max 16 (invalid line) never exceeds 16 and shrinks to 15', () => {
    expect(fitSize(width(5), 400, 16)).toBe(16);
    // 30 glyphs: 18 px per px of size; 270 / 18 = 15.
    expect(fitSize(width(30), 270, 16)).toBe(15);
    expect(fitSize(width(60), 270, 16)).toBe(14);
  });
});
