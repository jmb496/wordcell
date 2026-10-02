import { beforeEach, describe, expect, it, vi } from 'vitest';

// AD-12 the drop-target registry (fresh module per test).
let mod: typeof import('./drop-target');

beforeEach(async () => {
  vi.resetModules();
  mod = await import('./drop-target');
});

// Each fake carries a distinct `n` so `toEqual` tells them apart.
let n = 0;
const el = () => ({ n: ++n }) as unknown as Element;

describe('AD-12 dropTarget', () => {
  it('AD-12 registers in insertion order; update replaces; destroy removes', () => {
    const [a, b] = [el(), el()];
    const ha = mod.dropTarget(a, { kind: 'column', id: 2 });
    mod.dropTarget(b, { kind: 'column', id: 1 });
    expect(mod.columnTargets()).toEqual([
      { id: 2, el: a },
      { id: 1, el: b },
    ]);
    ha.update({ kind: 'column', id: 3 });
    expect(mod.columnTargets()).toEqual([
      { id: 3, el: a },
      { id: 1, el: b },
    ]);
    ha.destroy();
    expect(mod.columnTargets()).toEqual([{ id: 1, el: b }]);
  });

  it('AD-12 a duplicate element or column id throws', () => {
    const a = el();
    const h = mod.dropTarget(a, { kind: 'column', id: 1 });
    expect(() => mod.dropTarget(a, { kind: 'column', id: 2 })).toThrow(/^AD-12 dropTarget/);
    expect(() => mod.dropTarget(el(), { kind: 'column', id: 1 })).toThrow(/^AD-12 dropTarget/);
    const h2 = mod.dropTarget(el(), { kind: 'column', id: 2 });
    expect(() => h2.update({ kind: 'column', id: 1 })).toThrow(/^AD-12 dropTarget/);
    h.update({ kind: 'column', id: 1 });
    expect(mod.columnTargets().map((t) => t.id)).toEqual([1, 2]);
  });
});
