// AD-12 lookups (epic 5 SPEC CAP-3): one helper, `found`, turns a lookup's miss (`null` or
// `undefined`, never another falsy value such as CardId 0) into a throw of the caller's own message
// (rule 6); `cellIn` finds a `CellView` by its `cell` field, never by index; `columnIn` takes the
// `ColumnView` at index n − 1 and checks its `column` field. `attribute()` is the shared attribute
// parser: `Number()` of the attribute's value, throwing when the attribute is missing or empty (it
// would read as 0, a valid CardId; rule 6) or is not an integer. Pure apart from reading the
// element.
import type { CellView, ColumnView } from '../../engine/index';

/** `value`, or a throw of `new Error(message)` when it is `null` or `undefined`. */
export function found<T>(value: T | null | undefined, message: string): T {
  if (value === null || value === undefined) throw new Error(message);
  return value;
}

/** The entry of `cells` whose `cell` field is `n`. */
export function cellIn(cells: readonly CellView[], n: number, message: string): CellView {
  return found(
    cells.find((c) => c.cell === n),
    message,
  );
}

/** The entry of `columns` at index `n` − 1, whose `column` field must be `n`. */
export function columnIn(columns: readonly ColumnView[], n: number, message: string): ColumnView {
  const entry = columns[n - 1];
  return found(entry?.column === n ? entry : undefined, message);
}

/** The integer value of `el`'s attribute `name`; throws when it is missing, empty or not one. */
export function attribute(el: Element, name: string): number {
  const raw = el.getAttribute(name);
  if (raw === null || raw.trim() === '') throw new Error(`AD-12 ${name} is missing or empty`);
  const value = Number(raw);
  if (!Number.isInteger(value)) throw new Error(`AD-12 ${name} is not an integer`);
  return value;
}
