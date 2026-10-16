import { render } from 'svelte/server';
import { describe, expect, it, vi } from 'vitest';
import type { CellView, ColumnView, DraftView, Face } from '../engine/index';
import src0 from './App.svelte?raw';
import src6 from './announce.ts?raw';
import src1 from './Card.svelte?raw';
import Column from './Column.svelte';
import src2 from './Column.svelte?raw';
import src7 from './commands.ts?raw';
import src8 from './end-sheet.ts?raw';
import src11 from './gestures/controller.ts?raw';
import src12 from './gestures/free-letter-drag.ts?raw';
import src13 from './gestures/tile-drag.ts?raw';
import src9 from './keys.ts?raw';
import src3 from './Menu.svelte?raw';
import src10 from './new-game.ts?raw';
import src4 from './Tray.svelte?raw';
import { text } from './text';
import src14 from './tray/ControlRow.svelte?raw';
import TileRows from './tray/TileRows.svelte';
import src15 from './tray/TileRows.svelte?raw';
import src16 from './tray/WordLine.svelte?raw';
import WordCellRow from './WordCellRow.svelte';
import src5 from './WordCellRow.svelte?raw';

vi.mock('../shell/game.svelte', () => ({ game: { feedback: {} } }));

// Epic 6 CAP-11 (6.13): the screen-reader names, read from the server-rendered markup.
const letter = (l: string): Face => ({ letter: l, letterCount: l === 'QU' ? 2 : 1 });
const faces: Face[] = Array.from({ length: 52 }, (_, i) =>
  letter(i === 10 ? 'QU' : ('ABCDEFGHIJKLMNOPRSTUVWXYZ'[i % 25] as string)),
);
// faces: 0 A, 1 B, 2 C, 3 D, 4 E, 5 F, ... 10 QU.

const tags = (html: string, selector: RegExp): string[] => html.match(selector) ?? [];
const names = (html: string): string[] =>
  [...html.matchAll(/<div[^>]*class="card[^"]*"[^>]*>/g)]
    .map((m) => m[0])
    .filter((tag) => /role="button"/.test(tag))
    .map((tag) => /aria-label="([^"]*)"/.exec(tag)?.[1] ?? '');

const column = (n: number, cards: number[]): ColumnView =>
  ({ column: n, cards, canPickUp: true, canDropOn: true, canTapForK: false }) as ColumnView;

const drawColumn = (
  col: ColumnView,
  over: Partial<{
    draft: DraftView | undefined;
    phase: 'idle' | 'composing' | 'place';
    selection: { column: number; count: number } | null;
  }> = {},
) =>
  render(Column, {
    props: {
      column: col,
      faces,
      draft: over.draft,
      phase: over.phase ?? 'idle',
      cardsRow: 1,
      footRow: 2,
      selection: over.selection ?? null,
    },
  }).body;

describe('AD-3 screen-reader names', () => {
  it('AD-3 column cards read letter, column, position, selected, destination and are buttons', () => {
    const html = drawColumn(column(1, [0, 1, 4]), { selection: { column: 1, count: 1 } });
    expect(names(html)).toEqual([
      'A, column 1, card 1 of 3',
      'B, column 1, card 2 of 3',
      'E, column 1, card 3 of 3, selected',
    ]);
  });

  it('AD-3 a destination card in Composing reads destination, joined after selected; a ghost carries no name', () => {
    const draft = { source: [1], destination: [4], sourceColumn: 2, destinationColumn: 1 };
    const html = drawColumn(column(1, [0, 1, 4]), {
      draft: draft as unknown as DraftView,
      phase: 'composing',
      selection: { column: 1, count: 1 },
    });
    expect(names(html)).toEqual([
      'A, column 1, card 1 of 3',
      'E, column 1, card 3 of 3, selected, destination',
    ]);
    expect(html).toContain('data-mirror-of="1"');
    expect(tags(html, /data-mirror-of="1"[^>]*/)[0]).not.toContain('aria-label');
  });

  it('AD-3 a QU card reads Q U, counts as two letters', () => {
    expect(names(drawColumn(column(3, [10])))).toEqual([
      'Q U, counts as two letters, column 3, card 1 of 1',
    ]);
  });

  it('AD-3 the foot is a group named Column N foot, the source foot reads Column N, here', () => {
    const idle = drawColumn(column(3, [0]));
    expect(idle).toMatch(/role="group"[^>]*aria-label="Column 3 foot"/);
    const source = drawColumn(column(3, [0]), { selection: { column: 3, count: 1 } });
    expect(source).toMatch(/role="group"[^>]*aria-label="Column 3, here"/);
    const other = drawColumn(column(4, [0]), { selection: { column: 3, count: 1 } });
    expect(other).toContain('aria-label="Column 4 foot"');
  });
});

const cell = (n: number, cards: number[], used = false): CellView =>
  ({
    cell: n,
    cards,
    used,
    canAddFreeLetter: false,
    canSetTarget: false,
    isLegalTarget: false,
  }) as unknown as CellView;

const drawCells = (cells: CellView[]) =>
  render(WordCellRow, {
    props: { cells, faces, place: undefined, labelsRow: 1, cellsRow: 2 },
  }).body;

describe('AD-3 WordCell names', () => {
  it('AD-3 WordCell templates: singular, plural, used, empty and QU', () => {
    const html = drawCells([
      cell(3, []),
      cell(4, [19], false),
      cell(6, [1, 2, 3, 11], true),
      cell(5, [4, 10], true),
    ]);
    expect(html).toContain('aria-label="WordCell 3, empty"');
    expect(html).toContain('aria-label="WordCell 4, top U, 1 card"');
    expect(html).toContain('aria-label="WordCell 6, top L, 4 cards, used"');
    expect(html).toContain(
      'aria-label="WordCell 5, top Q U, counts as two letters, 2 cards, used"',
    );
  });

  it('AD-3 a 4-card non-used cell exposes one named button, its top card; the rest are aria-hidden', () => {
    const html = drawCells([cell(6, [1, 2, 3, 11])]);
    expect(names(html)).toEqual(['L, WordCell 6, top']);
    const cards = [...html.matchAll(/<div[^>]*class="card[^"]*"[^>]*>/g)].map((m) => m[0]);
    expect(cards).toHaveLength(4);
    expect(cards.filter((c) => c.includes('aria-hidden="true"'))).toHaveLength(3);
    for (const c of cards.filter((c) => c.includes('aria-hidden'))) {
      expect(c).not.toContain('role=');
      expect(c).not.toContain('tabindex');
    }
  });

  it('AD-3 a used cell exposes no named button and the used top is a mirror', () => {
    const html = drawCells([cell(6, [1, 2, 3, 11], true)]);
    expect(names(html)).toEqual([]);
  });

  it('AD-3 a QU top card of a non-used cell reads Q U, counts as two letters, WordCell N, top', () => {
    expect(names(drawCells([cell(5, [4, 10])]))).toEqual([
      'Q U, counts as two letters, WordCell 5, top',
    ]);
  });
});

const sizing = {
  mode: 'card',
  rows: 1,
  perRow: 8,
  tileWidth: 44,
  tileHeight: 60,
  area: 92,
} as never;
const drawTiles = (tiles: { id: number; mirror: boolean }[], strip = false) =>
  render(TileRows, {
    props: { tiles, faces, strip, tags: new Map(), sizing },
  }).body;

describe('AD-3 tray tile names', () => {
  it('AD-3 tile i and n count live named tiles only, mirrors carry no name', () => {
    const html = drawTiles([
      { id: 0, mirror: false },
      { id: 5, mirror: true },
      { id: 4, mirror: false },
    ]);
    expect(names(html)).toEqual(['A, tray, tile 1 of 2', 'E, tray, tile 2 of 2']);
    expect(tags(html, /data-mirror-of="5"[^>]*/)[0]).not.toContain('aria-label');
  });

  it('AD-3 the strip names tiles with the tray template', () => {
    expect(names(drawTiles([{ id: 0, mirror: false }], true))).toEqual(['A, tray, tile 1 of 1']);
  });
});

describe('AD-3 string families', () => {
  it('AD-3 delta wording and plural forms', () => {
    expect([text.delta(30), text.delta(-4), text.delta(0)]).toEqual([
      'plus 30',
      'minus 4',
      'no change',
    ]);
    expect(text.nameCell(7, 'A', 1, false)).toBe('WordCell 7, top A, 1 card');
    expect(text.phaseComposing('qu', 2)).toBe('Composing. QU, 2 letters.');
    expect(text.phasePlace('a', 1)).toBe('Place. A, 1 letter.');
    expect(text.phaseIdle).toBe('Idle.');
  });

  it('AD-3 the tray tile selected state and −/+/Flip names', () => {
    expect(text.nameTrayTile('E', 2, 2, true)).toBe('E, tray, tile 2 of 2, selected');
    expect([text.minus, text.plus, text.flip]).toEqual(['−', '+', 'Flip']);
  });

  it('AD-3 srOutcome reads a negative score as minus N with no U+2212', () => {
    expect(text.srOutcome('Game given up.', -12, 'Wordsmith')).toBe(
      'Game given up. Score minus 12, Wordsmith.',
    );
    expect(text.srOutcome('Every column cleared.', 118, 'Wordsmith')).toBe(
      'Every column cleared. Score 118, Wordsmith.',
    );
  });
});

// The sources the scans read (explicit `?raw` imports: AD-1 forbids import.meta.glob under src/).
const SOURCES: Record<string, string> = {
  'App.svelte': src0,
  'Card.svelte': src1,
  'Column.svelte': src2,
  'Menu.svelte': src3,
  'Tray.svelte': src4,
  'WordCellRow.svelte': src5,
  'announce.ts': src6,
  'commands.ts': src7,
  'end-sheet.ts': src8,
  'keys.ts': src9,
  'new-game.ts': src10,
  'gestures/controller.ts': src11,
  'gestures/free-letter-drag.ts': src12,
  'gestures/tile-drag.ts': src13,
  'tray/ControlRow.svelte': src14,
  'tray/TileRows.svelte': src15,
  'tray/WordLine.svelte': src16,
};
const read = (path: string): string => SOURCES[path] as string;

describe('AD-3 sole owners', () => {
  it('AD-3 no inline aria-label string remains in the card, column, WordCell and tray files', () => {
    for (const file of [
      'WordCellRow.svelte',
      'Column.svelte',
      'Card.svelte',
      'Tray.svelte',
      ...Object.keys(SOURCES).filter((f) => f.startsWith('tray/') && f.endsWith('.svelte')),
    ]) {
      expect(read(file), file).not.toMatch(/aria-label="/);
    }
  });

  it('AD-3 no game.dispatch( call is left in src/ui outside announce.ts and tests', () => {
    const offenders = Object.entries(SOURCES)
      .filter(([f, src]) => f !== 'announce.ts' && /\bgame\.dispatch\(/.test(src))
      .map(([f]) => f);
    expect(offenders).toEqual([]);
  });

  it('AD-3 only announce.ts writes the live region', () => {
    const offenders = Object.entries(SOURCES)
      .filter(([f, src]) => f !== 'announce.ts' && /textContent\s*=[^=]/.test(src))
      .map(([f]) => f);
    expect(offenders).toEqual([]);
  });
});

describe('AD-3 live region mount', () => {
  const app = read('App.svelte');

  it('AD-3 the region is mounted once at the App root, before every branch, polite and clipped', () => {
    expect(app.match(/use:region/g)).toHaveLength(1);
    expect(app.indexOf('use:region')).toBeLessThan(app.indexOf('{#if game.state.kind'));
    expect(app).toMatch(/role="status" aria-live="polite" use:region/);
    const css = /\.live \{([^}]*)\}/.exec(app)?.[1] ?? '';
    expect(css).toContain('clip-path');
    expect(css).not.toContain('display');
    expect(app).not.toMatch(/<[^>]*(use:region)[^>]*inert/);
  });

  it('AD-3 no other component mounts a live region (Tray and every inert wrapper)', () => {
    const others = Object.entries(SOURCES)
      .filter(([f]) => f.endsWith('.svelte') && f !== 'App.svelte')
      .filter(([, src]) => /aria-live|role="status"/.test(src))
      .map(([f]) => f);
    expect(others).not.toContain('Tray.svelte');
    expect(others.filter((f) => f.startsWith('tray/'))).toEqual([]);
  });
});
