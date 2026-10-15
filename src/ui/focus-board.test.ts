import { afterEach, describe, expect, it, vi } from 'vitest';
import { focusBoard } from './focus-board';

// EXPERIENCE.md Focus: the board is the bottom card of the lowest-numbered non-empty column, else
// `main`. The unit environment is node (no jsdom installed), so `document` is a minimal fake that
// answers the three selectors focusBoard uses.
type Fake = { tabIndex: number; focused: boolean; focus: () => void };
const fake = (): Fake => {
  const el: Fake = { tabIndex: 0, focused: false, focus: () => (el.focused = true) };
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
    expect(b.tabIndex).toBe(-1);
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
