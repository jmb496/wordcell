import { describe, expect, it } from 'vitest';
import type { CellView, ColumnView } from '../../engine/index';
import { cellIn, columnIn, found } from './lookup';

const cell = (n: number, cards: number[]) => ({ cell: n, cards }) as unknown as CellView;
const column = (n: number) => ({ column: n, cards: [] }) as unknown as ColumnView;

describe('AD-12 lookup', () => {
  it('AD-12 found returns a hit, 0 included', () => {
    expect(found(0, 'm')).toBe(0);
    expect(found('', 'm')).toBe('');
    const value = { a: 1 };
    expect(found(value, 'm')).toBe(value);
  });

  it('AD-12 found throws the caller message verbatim on null and undefined', () => {
    expect(() => found(null, 'AD-12 missing 3')).toThrow(/^AD-12 missing 3$/);
    expect(() => found(undefined, 'AD-12 missing 4')).toThrow(/^AD-12 missing 4$/);
  });

  it('AD-12 cellIn matches the cell field, never the index', () => {
    const cells = [cell(5, [1]), cell(3, [2])];
    expect(cellIn(cells, 3, 'm')).toBe(cells[1]);
    expect(cellIn(cells, 5, 'm')).toBe(cells[0]);
    expect(() => cellIn(cells, 4, 'AD-12 no cell 4')).toThrow(/^AD-12 no cell 4$/);
  });

  it('AD-12 columnIn takes index n − 1 and checks its column field', () => {
    const columns = [column(1), column(2)];
    expect(columnIn(columns, 2, 'm')).toBe(columns[1]);
    expect(() => columnIn(columns, 3, 'AD-12 no column 3')).toThrow(/^AD-12 no column 3$/);
    expect(() => columnIn([column(2), column(1)], 1, 'AD-12 column 1 mismatch')).toThrow(
      /^AD-12 column 1 mismatch$/,
    );
  });
});
