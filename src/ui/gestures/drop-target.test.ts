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

  it('AD-12 F4 the tray registers apart from the columns: trayTarget() reads it, columnTargets() excludes it, destroy removes it', () => {
    const [column, band] = [el(), el()];
    mod.dropTarget(column, { kind: 'column', id: 1 });
    const h = mod.dropTarget(band, { kind: 'tray' });
    expect(mod.trayTarget()).toBe(band);
    expect(mod.columnTargets()).toEqual([{ id: 1, el: column }]);
    h.update({ kind: 'tray' });
    expect(mod.trayTarget()).toBe(band);
    h.destroy();
    expect(() => mod.trayTarget()).toThrow(/^AD-12 no tray dropTarget registered/);
    expect(mod.columnTargets()).toEqual([{ id: 1, el: column }]);
    // Registrable again once destroyed.
    mod.dropTarget(el(), { kind: 'tray' });
  });

  it('AD-12 with no tray registered trayTarget() throws; a second tray registration throws', () => {
    expect(() => mod.trayTarget()).toThrow(/^AD-12 no tray dropTarget registered/);
    const band = el();
    mod.dropTarget(band, { kind: 'tray' });
    expect(() => mod.dropTarget(el(), { kind: 'tray' })).toThrow(
      /^AD-12 dropTarget tray registered twice/,
    );
    expect(mod.trayTarget()).toBe(band);
  });

  it('AD-12 a kind change on update, or the tray element registered as a column, throws', () => {
    const band = el();
    const h = mod.dropTarget(band, { kind: 'tray' });
    expect(() => h.update({ kind: 'column', id: 1 })).toThrow(/^AD-12 dropTarget kind changed/);
    expect(() => mod.dropTarget(band, { kind: 'column', id: 1 })).toThrow(
      /^AD-12 dropTarget element registered twice/,
    );
    const c = mod.dropTarget(el(), { kind: 'column', id: 2 });
    expect(() => c.update({ kind: 'tray' })).toThrow(/^AD-12 dropTarget kind changed/);
  });

  it('AD-12 an element registered as a column cannot register as the tray', () => {
    const a = el();
    mod.dropTarget(a, { kind: 'column', id: 1 });
    expect(() => mod.dropTarget(a, { kind: 'tray' })).toThrow(
      /^AD-12 dropTarget element registered twice/,
    );
    expect(() => mod.trayTarget()).toThrow(/^AD-12 no tray dropTarget registered/);
  });

  it('AD-12 the tray handle used after destroy throws, also once another tray registered', () => {
    const h = mod.dropTarget(el(), { kind: 'tray' });
    h.destroy();
    expect(() => h.update({ kind: 'tray' })).toThrow(/^AD-12 dropTarget used after destroy/);
    expect(() => h.destroy()).toThrow(/^AD-12 dropTarget used after destroy/);
    const next = el();
    mod.dropTarget(next, { kind: 'tray' });
    expect(() => h.destroy()).toThrow(/^AD-12 dropTarget used after destroy/);
    expect(mod.trayTarget()).toBe(next);
  });
});
