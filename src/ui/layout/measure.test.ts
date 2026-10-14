import { describe, expect, it } from 'vitest';
import { measureWidth } from './measure';

// The unit environment is `node` (vite.config.ts), so a hand-built element stands in for the DOM.
function fakeEl(read: (el: ReturnType<typeof fakeEl>) => number) {
  const classes = new Set<string>();
  const el = {
    style: { fontSize: '16px' },
    classList: {
      add: (c: string) => classes.add(c),
      remove: (c: string) => classes.delete(c),
    },
    classes,
    getBoundingClientRect: () => ({ width: read(el) }),
  };
  return el;
}

describe('AD-11 measureWidth', () => {
  it('AD-11 measureWidth restores the inline font size and the measuring class after the read, also when the read throws', () => {
    const seen: [string, boolean][] = [];
    const ok = fakeEl((el) => {
      seen.push([el.style.fontSize, el.classes.has('measuring')]);
      return 42.5;
    });
    expect(measureWidth(ok as unknown as HTMLElement, 14, 'measuring')).toBe(42.5);
    expect(seen).toEqual([['14px', true]]);
    expect(ok.style.fontSize).toBe('16px');
    expect(ok.classes.has('measuring')).toBe(false);

    const bad = fakeEl(() => {
      throw new Error('read failed');
    });
    expect(() => measureWidth(bad as unknown as HTMLElement, 15, 'measuring')).toThrow(
      'read failed',
    );
    expect(bad.style.fontSize).toBe('16px');
    expect(bad.classes.has('measuring')).toBe(false);

    const plain = fakeEl(() => 1);
    measureWidth(plain as unknown as HTMLElement, 15);
    expect(plain.style.fontSize).toBe('16px');
  });
});
