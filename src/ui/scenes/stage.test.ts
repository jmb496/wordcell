import { createRawSnippet } from 'svelte';
import { render } from 'svelte/server';
import { describe, expect, it, vi } from 'vitest';
import { BAND_ORDER } from '../layout/bands';
import { sceneBaseHeight } from '../layout/geometry';
import {
  CELLS_TOP,
  COLUMN_AREA_H,
  COLUMNS,
  columnRowY,
  fillerCount,
  LABELS_TOP,
  MAX_CELL_CARDS,
  MAX_COLUMN_CARDS,
  MIN_COLUMN_CARDS,
  STAGE_H,
  STAGE_INPUTS,
  STRIP,
  TRAY_TOP,
} from './geometry';
import { scenes } from './index';
import Stage from './Stage.svelte';
import { FILLER_LETTERS, fillerColumns } from './stage';

// Epic 8 ticket 6 (HP-1, HP-6; AD-3, AD-11, AD-14): the shared stage.
vi.mock('../../shell/prefs.svelte', () => ({ prefs: { motion: { baseMs: 180, reduced: false } } }));

const children = createRawSnippet(() => ({ render: () => '<span data-scene-el="x"></span>' }));
const stage = (columns: readonly (readonly string[])[], lengths: readonly number[]) =>
  render(Stage, {
    props: {
      columns,
      filler: fillerColumns(lengths),
      cells: { '6': ['L'] },
      scale: 1,
      children,
    },
  }).body;

// The glyph letters of every card inside the `n`th element (1-based) with class `cls`.
const lettersOf = (html: string, cls: string, n: number): string[] => {
  const segment = html.split(`<div class="${cls} `)[n] ?? '';
  const end = segment.search(/<div class="(?:column|tray-frame|cell) /);
  return [
    ...(end < 0 ? segment : segment.slice(0, end)).matchAll(/class="glyph[^"]*">([^<]+)</g),
  ].map((m) => m[1]);
};

describe('AD-14 the shared stage structure', () => {
  const columns = [
    ['F', 'E', 'D', 'K', 'A'],
    ['X', 'O', 'R', 'I', 'N'],
    ['L', 'M', 'F', 'B'],
  ];
  const lengths = columns.map((c) => c.length);
  const body = stage(columns, lengths);

  it('AD-14 eight columns, the tray with its word strip and WordCells 3 to 10, in BAND_ORDER order', () => {
    expect(body.match(/<div class="column /g)).toHaveLength(COLUMNS);
    expect(body).toContain('class="word-strip');
    expect([...body.matchAll(/data-cell="(\d+)"/g)].map((m) => m[1])).toStrictEqual([
      '3',
      '4',
      '5',
      '6',
      '7',
      '8',
      '9',
      '10',
    ]);
    const at = (needle: string) => body.indexOf(needle);
    expect(at('data-column="8"')).toBeLessThan(at('tray-frame'));
    expect(at('tray-frame')).toBeLessThan(at('data-cell="3"'));
    const order = BAND_ORDER.flat();
    expect(order.indexOf('columns')).toBeLessThan(order.indexOf('tray'));
    expect(order.indexOf('tray')).toBeLessThan(order.indexOf('labels'));
    expect(order.indexOf('labels')).toBeLessThan(order.indexOf('wordcells'));
    // The same order in px.
    expect(COLUMN_AREA_H).toBeLessThan(TRAY_TOP);
    expect(TRAY_TOP).toBeLessThan(LABELS_TOP);
    expect(LABELS_TOP).toBeLessThan(CELLS_TOP);
  });

  it('AD-14 the stage is aria-hidden, its cards are static and none carries a card attribute', () => {
    expect(body).toContain('aria-hidden="true"');
    expect(body.match(/class="card[^"]*static/g)?.length).toBeGreaterThan(0);
    for (const attribute of ['data-card-id', 'data-testid', 'data-place', 'data-mirror-of'])
      expect(body).not.toContain(attribute);
  });

  it('AD-14 at least 5 cards in every column; the scripted cards sit unchanged under the filler', () => {
    const filler = fillerColumns(lengths);
    for (let n = 1; n <= COLUMNS; n++) {
      const letters = lettersOf(body, 'column', n);
      expect(letters.length).toBeGreaterThanOrEqual(MIN_COLUMN_CARDS);
      const scripted = columns[n - 1] ?? [];
      expect(letters).toStrictEqual([...filler[n - 1], ...scripted]);
    }
  });

  it('AD-14 the filler letters equal the fixed sequence, column by column, far end first', () => {
    const filler = fillerColumns(lengths);
    const flat = filler.flat();
    expect(flat).toStrictEqual(
      Array.from({ length: flat.length }, (_, i) => FILLER_LETTERS[i % FILLER_LETTERS.length]),
    );
    // Columns 1 and 2 are full, column 3 gets one filler card, columns 4 to 8 five each.
    expect(filler.map((f) => f.length)).toStrictEqual([0, 0, 1, 5, 5, 5, 5, 5]);
    expect(flat.slice(0, 3)).toStrictEqual(['R', 'S', 'T']);
    expect(fillerColumns(lengths)).toStrictEqual(filler);
  });

  it('AD-14 scripted positions follow the filler: card i of a column starts at (filler + i) strips', () => {
    expect(fillerCount(4)).toBe(1);
    expect(fillerCount(7)).toBe(0);
    expect(columnRowY(4, 0)).toBe(STRIP);
    expect(columnRowY(5, 4)).toBe(4 * STRIP);
  });
});

describe('AD-11 the stage height covers every scene', () => {
  it('AD-11 STAGE_H is the base height of the scenes’ maximum column cards, stack and tray rows', () => {
    expect(STAGE_H).toBe(sceneBaseHeight(STAGE_INPUTS));
  });

  it('AD-11 MAX_COLUMN_CARDS and MAX_CELL_CARDS cover the tallest column and stack of every scene', () => {
    let tallest = 0;
    let stack = 0;
    for (const scene of scenes) {
      const { columns, cells } = scene.fixture.start;
      const lengths = scene.carry === undefined ? [] : columns.map((c) => c.length);
      for (let i = 0; i < COLUMNS; i++) {
        const length = lengths[i] ?? 0;
        let cards = fillerCount(length) + length;
        // A landed tail makes the destination column that much taller.
        if (scene.carry !== undefined && scene.carry.destinationColumn === i + 1)
          cards += scene.carry.count;
        tallest = Math.max(tallest, cards);
      }
      for (const entry of scene.fixture.cells ?? []) stack = Math.max(stack, entry.cards.length);
      for (const cards of Object.values(cells ?? {})) stack = Math.max(stack, cards.length);
    }
    expect(MAX_COLUMN_CARDS).toBeGreaterThanOrEqual(tallest);
    expect(MAX_CELL_CARDS).toBeGreaterThanOrEqual(stack);
    // The tight bound keeps the stage from growing without a scene needing it.
    expect(MAX_COLUMN_CARDS).toBe(tallest);
    expect(MAX_CELL_CARDS).toBe(stack);
  });
});
