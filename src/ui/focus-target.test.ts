import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { readFocus } from './focus-target';

// Ticket 6.11 (EXPERIENCE.md Keyboard): `readFocus` over a fake document (the unit environment is
// node). keys.test.ts mocks this module, so the DOM reading is covered here.
class FakeEl {
  constructor(
    readonly dataset: Record<string, string> = {},
    private readonly native = false,
    private readonly column: FakeEl | null = null,
  ) {}
  matches(): boolean {
    return this.native;
  }
  closest(): FakeEl | null {
    return this.column;
  }
}

const doc = {
  body: new FakeEl(),
  activeElement: null as FakeEl | null,
  tiles: [] as FakeEl[],
  querySelectorAll(): FakeEl[] {
    return this.tiles;
  },
};

beforeEach(() => {
  vi.stubGlobal('HTMLElement', FakeEl);
  vi.stubGlobal('document', doc);
  doc.tiles = [];
});
afterEach(() => vi.unstubAllGlobals());

describe('AD-14 readFocus', () => {
  it('AD-14 a button is a control', () => {
    doc.activeElement = new FakeEl({}, true);
    expect(readFocus()).toEqual({ kind: 'control' });
  });

  it('AD-14 a column card is a column target with its column number', () => {
    const column = new FakeEl({ column: '4' });
    doc.activeElement = new FakeEl({ cardId: '17', place: 'column' }, false, column);
    expect(readFocus()).toEqual({ kind: 'column', column: 4, card: 17 });
  });

  it('AD-14 a tray tile is a tile target with its neighbours; the ends have none', () => {
    const tile = (id: number) => new FakeEl({ cardId: String(id), place: 'tray' });
    doc.tiles = [tile(5), tile(6), tile(7)];
    doc.activeElement = doc.tiles[1] as FakeEl;
    expect(readFocus()).toEqual({ kind: 'tile', place: 'tray', card: 6, left: 5, right: 7 });
    doc.activeElement = doc.tiles[0] as FakeEl;
    expect(readFocus()).toEqual({ kind: 'tile', place: 'tray', card: 5, left: null, right: 6 });
  });

  it('AD-14 a WordCell is a cell target', () => {
    doc.activeElement = new FakeEl({ wordcell: '7' });
    expect(readFocus()).toEqual({ kind: 'cell', cell: 7 });
  });

  it('AD-14 the body, a null focus and a non-card element are the board', () => {
    doc.activeElement = doc.body;
    expect(readFocus()).toEqual({ kind: 'board' });
    doc.activeElement = null;
    expect(readFocus()).toEqual({ kind: 'board' });
    doc.activeElement = new FakeEl();
    expect(readFocus()).toEqual({ kind: 'board' });
  });
});
