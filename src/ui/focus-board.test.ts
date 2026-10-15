import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  afterLoss,
  afterRemoval,
  focusBoard,
  focusCard,
  focusFirstStrip,
  focusFirstTile,
} from './focus-board';

// EXPERIENCE.md Focus: the board is the bottom card of the lowest-numbered non-empty column, else
// `main`. The unit environment is node (no jsdom installed), so `document` is a minimal fake that
// answers the selectors focusBoard uses. Cards are roving Tab stops (Card.svelte), so the resolver
// no longer touches `tabIndex`; programmatic focus never scrolls.
type Fake = {
  focused: boolean;
  options?: unknown;
  dataset: Record<string, string>;
  focus: (options?: unknown) => void;
};
const fake = (dataset: Record<string, string> = {}): Fake => {
  const el: Fake = {
    focused: false,
    dataset,
    focus: (options) => {
      el.focused = true;
      el.options = options;
    },
  };
  return el;
};

function setup(columns: { cards: Fake[]; onlyColumnPlace?: boolean }[]) {
  const main = fake();
  const queried: string[] = [];
  const doc = {
    querySelectorAll: (selector: string) => {
      expect(selector).toBe('[data-column]');
      return columns.map((column) => ({
        querySelectorAll: (inner: string) => {
          queried.push(inner);
          return {
            length: column.cards.length,
            item: (i: number) => column.cards[i] ?? null,
          };
        },
      }));
    },
    querySelector: (selector: string) => (selector === 'main' ? main : null),
  };
  vi.stubGlobal('document', doc);
  return { main, queried };
}

afterEach(() => vi.unstubAllGlobals());

describe('AD-14 focusBoard', () => {
  it('AD-14 focuses the bottom card of column 1 when it is non-empty', () => {
    const [a, b, c] = [fake(), fake(), fake()] as [Fake, Fake, Fake];
    const { main } = setup([{ cards: [a, b] }, { cards: [c] }]);
    focusBoard();
    expect(b.focused).toBe(true);
    expect(b.options).toEqual({ preventScroll: true });
    expect(a.focused || c.focused || main.focused).toBe(false);
  });

  it('AD-14 skips an empty column 1 and focuses the bottom card of column 3', () => {
    const c3 = fake();
    const { main } = setup([{ cards: [] }, { cards: [] }, { cards: [fake(), c3] }]);
    focusBoard();
    expect(c3.focused).toBe(true);
    expect(main.focused).toBe(false);
  });

  it('AD-14 focuses main when every column is empty (after a win)', () => {
    const { main } = setup([{ cards: [] }, { cards: [] }]);
    focusBoard();
    expect(main.focused).toBe(true);
  });

  it('AD-14 counts only cards whose data-place is column', () => {
    const { queried } = setup([{ cards: [] }]);
    focusBoard();
    expect(queried).toEqual(['[data-card-id][data-place="column"]']);
  });
});

describe('AD-14 focus helpers', () => {
  function find(map: Record<string, Fake | null>): void {
    vi.stubGlobal('document', { querySelector: (selector: string) => map[selector] ?? null });
  }

  it('AD-14 focusCard focuses the live element of a card, never the cell stack', () => {
    const tile = fake({ place: 'tray' });
    find({ '[data-card-id="7"]': tile });
    expect(focusCard(7)).toBe(true);
    expect(tile.focused).toBe(true);
    const cell = fake({ place: 'cell' });
    find({ '[data-card-id="8"]': cell });
    expect(focusCard(8)).toBe(false);
    expect(cell.focused).toBe(false);
    find({});
    expect(focusCard(9)).toBe(false);
  });

  it('AD-14 focusFirstTile focuses the first live tray tile, else the board; focusFirstStrip the first strip card', () => {
    const tile = fake();
    const strip = fake();
    find({
      '[data-card-id][data-place="tray"]': tile,
      '[data-card-id][data-place="strip"]': strip,
    });
    focusFirstTile();
    focusFirstStrip();
    expect(tile.focused).toBe(true);
    expect(strip.focused).toBe(true);
    const main = fake();
    vi.stubGlobal('document', {
      querySelector: (selector: string) => (selector === 'main' ? main : null),
      querySelectorAll: () => [],
    });
    focusFirstTile();
    expect(main.focused).toBe(true);
  });

  it('AD-14 afterRemoval gives the next tile, the previous one if it was last, null when none is left or movable', () => {
    expect(afterRemoval(2, [1, 2, 3], [1, 3])).toBe(3);
    expect(afterRemoval(3, [1, 2, 3], [1, 2])).toBe(2);
    expect(afterRemoval(1, [1, 2, 3], [2, 3])).toBe(2);
    expect(afterRemoval(1, [1], [])).toBeNull();
    expect(afterRemoval(2, [1, 2], [1, 2])).toBe(2);
    expect(() => afterRemoval(9, [1, 2], [1])).toThrow(/^AD-14 afterRemoval/);
  });

  it('AD-14 afterLoss gives the next sibling still in the region, else the region first item, else null', () => {
    expect(afterLoss(2, [1, 2, 3, 4], [1, 3, 4])).toBe(3);
    expect(afterLoss(2, [1, 2, 3, 4], [1, 4])).toBe(4);
    expect(afterLoss(4, [1, 2, 3, 4], [1, 2, 3])).toBe(1);
    expect(afterLoss(1, [1], [])).toBeNull();
  });
});
