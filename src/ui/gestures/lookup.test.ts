import { describe, expect, it } from 'vitest';
import type { CellView, ColumnView } from '../../engine/index';
import { attribute, cellIn, columnIn, found } from './lookup';

const cell = (n: number, cards: number[]) => ({ cell: n, cards }) as unknown as CellView;
const withAttribute = (value: string | null) =>
  ({ getAttribute: () => value }) as unknown as Element;
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

  it("AD-12 attribute reads an integer value, '0' (CardId 0) included", () => {
    expect(attribute(withAttribute('0'), 'data-card-id')).toBe(0);
    expect(attribute(withAttribute('42'), 'data-card-id')).toBe(42);
  });

  it('AD-12 attribute throws on a missing attribute (rule 6: not card 0)', () => {
    expect(() => attribute(withAttribute(null), 'data-card-id')).toThrow(
      /^AD-12 data-card-id is missing or empty$/,
    );
  });

  it('AD-12 attribute throws on an empty or blank attribute (rule 6: not card 0)', () => {
    expect(() => attribute(withAttribute(''), 'data-column')).toThrow(
      /^AD-12 data-column is missing or empty$/,
    );
    expect(() => attribute(withAttribute(' '), 'data-column')).toThrow(
      /^AD-12 data-column is missing or empty$/,
    );
  });

  it('AD-12 attribute throws on a non-integer value', () => {
    expect(() => attribute(withAttribute('1.5'), 'data-wordcell')).toThrow(
      /^AD-12 data-wordcell is not an integer$/,
    );
    expect(() => attribute(withAttribute('x'), 'data-wordcell')).toThrow(
      /^AD-12 data-wordcell is not an integer$/,
    );
  });
});
