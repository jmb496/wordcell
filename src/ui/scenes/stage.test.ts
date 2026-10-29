import { createRawSnippet } from 'svelte';
import { render } from 'svelte/server';
import { describe, expect, it, vi } from 'vitest';
import { BAND_ORDER } from '../layout/bands';
import { cardMetrics, SCENE_MIN_W, sceneBaseHeight, sceneFit } from '../layout/geometry';
import {
  COLUMNS,
  columnRowY,
  fillerCount,
  MIN_COLUMN_CARDS,
  SLOT,
  STRIP,
  sceneTextUp,
  stageGeometry,
  TEXT_FLOOR,
} from './geometry';
import { scenes } from './index';
import sceneSource from './Scene.svelte?raw';
import Stage from './Stage.svelte';
import stageSource from './Stage.svelte?raw';
import { FILLER_LETTERS, fillerColumns } from './stage';

// Epic 8 ticket 6 (HP-1, HP-6; AD-3, AD-11, AD-14): the shared stage.
vi.mock('../../shell/prefs.svelte', () => ({ prefs: { motion: { baseMs: 180, reduced: false } } }));

const children = createRawSnippet(() => ({ render: () => '<span data-scene-el="x"></span>' }));
const geometry = stageGeometry({ columnCards: 9, cellCards: 6 });
const stage = (columns: readonly (readonly string[])[], lengths: readonly number[]) =>
  render(Stage, {
    props: {
      columns,
      filler: fillerColumns(lengths),
      cells: { '6': ['L'] },
      geometry,
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
    expect(geometry.columnAreaH).toBeLessThan(geometry.trayTop);
    expect(geometry.trayTop).toBeLessThan(geometry.labelsTop);
    expect(geometry.labelsTop).toBeLessThan(geometry.cellsTop);
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

// Owner decision D1 (2026-10-22): a covered card shows only its top strip, which turns some letters
// into others (E reads as F, G as C, ...), so a row of covered cards can spell a word nobody wrote.
// No row of any scene's board, read left to right across the eight columns, may read a word of the
// blocklist, plain or with any of its letters read as another letter of its look class: the letters
// of a class show the same top strip, so the reading goes both ways (a covered F reads as E too).
const CLIPPED_LOOKS = ['EF', 'CG', 'BPR', 'IL', 'OQ', 'VY'];
const LOOK_CLASS: ReadonlyMap<string, string> = new Map(
  CLIPPED_LOOKS.flatMap((look) => [...look].map((letter) => [letter, look] as const)),
);
const BLOCKLIST = (
  'FUCK FUK FCK SHIT CUNT COCK DICK PISS TWAT SLUT WANK CRAP FAG ASS TIT CUM POO PEE PUKE NAZI ' +
  'KKK SEX PORN DAMN HELL ANAL ARSE BUTT PUSSY WHORE BITCH DYKE SPIC GOOK KIKE NIGGER NIGGA RAPE ' +
  'PENIS BOOB JIZZ'
).split(' ');

/** The rows of a scene's whole start board (filler, then the scripted cards), top row first. */
function boardRows(lengths: readonly number[], scripted: readonly (readonly string[])[]) {
  const filler = fillerColumns(lengths);
  const columns = filler.map((f, c) => [...f, ...(scripted[c] ?? [])]);
  const height = Math.max(...columns.map((c) => c.length));
  return Array.from({ length: height }, (_, r) => columns.map((c) => c[r]));
}

/** The blocklisted words row `row` reads (a column without a card at that row breaks the run). */
function blocked(row: readonly (string | undefined)[]): string[] {
  const reads = (letter: string | undefined, want: string) =>
    letter !== undefined && (LOOK_CLASS.get(letter) ?? letter) === (LOOK_CLASS.get(want) ?? want);
  return BLOCKLIST.filter((word) =>
    row.some((_, i) => [...word].every((want, j) => reads(row[i + j], want))),
  );
}

describe('AD-14 the filler rows read no blocklisted word', () => {
  it("AD-14 every row of every scene's board, plain or strip-clipped, reads no blocklisted word", () => {
    let rows = 0;
    for (const scene of scenes) {
      // The board every frame draws a part of: a scene with a carry starts from its fixture
      // columns; one without (scoring) draws filler only (Scene.svelte `filler`).
      const scripted = scene.carry === undefined ? [] : scene.fixture.start.columns;
      for (const row of boardRows(
        scripted.map((c) => c.length),
        scripted,
      )) {
        rows++;
        expect(blocked(row), `${scene.id} row ${row.map((l) => l ?? '.').join('')}`).toStrictEqual(
          [],
        );
      }
    }
    expect(rows).toBeGreaterThan(scenes.length * MIN_COLUMN_CARDS - 1);
  });

  it('AD-14 the check catches the old order: E U G K on scene 1 reads FUCK once the strip clips it', () => {
    expect(blocked([undefined, 'E', 'U', 'G', 'K'])).toStrictEqual(['FUCK']);
    expect(blocked(['S', 'H', 'I', 'T'])).toStrictEqual(['SHIT']);
    expect(blocked(['S', 'H', undefined, 'I', 'T'])).toStrictEqual([]);
  });

  it('AD-14 the check reads the clipped looks both ways: a covered F reads as E, C as G, ...', () => {
    expect(blocked(['H', 'F', 'L', 'L'])).toStrictEqual(['HELL']);
    expect(blocked(['F', 'A', 'C'])).toStrictEqual(['FAG']);
    expect(blocked(['S', 'I', 'U', 'T'])).toStrictEqual(['SLUT']);
    expect(blocked(['P', 'O', 'P', 'N'])).toStrictEqual(['PORN']);
    expect(blocked(['P', 'U', 'K', 'F'])).toStrictEqual(['PUKE']);
    expect(blocked(['P', 'U', 'S', 'S', 'V'])).toStrictEqual(['PUSSY']);
    expect(blocked(['C', 'O', 'O', 'K'])).toStrictEqual(['GOOK']);
  });
});

describe('AD-11 each scene has the stage height it needs', () => {
  // The tallest column (filler, scripted cards, and a tail that lands) and WordCell stack of each
  // scene, counted by hand from its fixture and frames (owner decision 2026-10-17: per-scene).
  const expected: Record<string, { columnCards: number; cellCards: number }> = {
    'move-compose': { columnCards: 8, cellCards: 1 },
    'free-letter': { columnCards: 5, cellCards: 1 },
    place: { columnCards: 5, cellCards: 1 },
    'source-drop': { columnCards: 5, cellCards: 1 },
    scoring: { columnCards: 5, cellCards: 6 },
  };

  it('AD-11 each scene’s inputs are its own tallest column and stack, tray rows 2', () => {
    expect(scenes.map((s) => s.id).sort()).toStrictEqual(Object.keys(expected).sort());
    for (const scene of scenes)
      expect(scene.stage, scene.id).toStrictEqual({ ...expected[scene.id], trayRows: 2 });
  });

  it('AD-11 stageGeometry height equals the base height of the scene’s inputs and covers every drawn stack', () => {
    for (const scene of scenes) {
      const g = stageGeometry(scene.stage);
      expect(g.stageH, scene.id).toBe(sceneBaseHeight(scene.stage));
      expect(g.columnAreaH).toBe((scene.stage.columnCards - 1) * STRIP + 56);
      // Every stack the fixture states or starts with fits the cell band.
      const stacks = [
        ...Object.values(scene.fixture.start.cells ?? {}),
        ...(scene.frames.at(-1)?.cellTop === true
          ? []
          : (scene.fixture.cells ?? []).map((e) => e.cards)),
      ];
      for (const cards of stacks) expect(cards.length).toBeLessThanOrEqual(scene.stage.cellCards);
    }
  });

  it('AD-11 only scoring has a tall WordCell band, and every other scene is shorter than the old maximum', () => {
    const max = sceneBaseHeight({ columnCards: 9, trayRows: 2, cellCards: 6 });
    for (const scene of scenes) expect(stageGeometry(scene.stage).stageH).toBeLessThan(max);
    const heights = scenes.map((s) => stageGeometry(s.stage).stageH);
    expect(Math.min(...heights)).toBeLessThan(Math.max(...heights));
  });
});

// Owner decision D12 (2026-10-22; DESIGN.md: no text under 11 px): the stage is scaled by the fitted
// slot over the base slot; its text (WordCell numbers, score figures, controls, the ×2 badge, the
// strip marks) is counter-scaled by --wc-scene-up so it renders at max(authored × scale, 11 px).
describe('AD-11 scene text stays at or above 11 px at every fitted card size', () => {
  // Every card width the carousel can fit: content widths of phones to the 560 px panel, short and
  // tall boxes (the 32 px floor in landscape), each scene's own stage.
  const widths = new Set<number>();
  for (let content = 200; content <= 528; content += 4)
    for (const box of [150, 280, 360, 480, 700, 100_000])
      for (const scene of scenes) widths.add(sceneFit(content, box, scene.stage).cardWidth);

  it('AD-11 the swept widths include the 32 px landscape floor and widths below it', () => {
    expect(widths.has(SCENE_MIN_W)).toBe(true);
    expect(Math.min(...widths)).toBeLessThan(SCENE_MIN_W);
    expect(Math.max(...widths)).toBeGreaterThan(SLOT);
  });

  it.each([11, 14])(
    'AD-11 text authored at %i px renders at 11 px or more, and never smaller than unscaled text would',
    (authored) => {
      for (const w of widths) {
        const scale = cardMetrics(w).slot / SLOT;
        const up = sceneTextUp(scale);
        const size = Math.max(authored, TEXT_FLOOR * up);
        expect(size * scale, `card ${w}`).toBeGreaterThanOrEqual(TEXT_FLOOR - 1e-9);
        if (scale >= 1) expect(size, `card ${w}`).toBe(authored);
      }
    },
  );

  it('AD-11 the stage sets --wc-scene-up from its scale and every scene text rule reads it', () => {
    for (const scale of [36 / 44, 1, 1.3]) {
      const body = render(Stage, {
        props: { columns: [], filler: fillerColumns([]), cells: {}, geometry, scale, children },
      }).body;
      expect(body).toContain(`--wc-scene-up: ${sceneTextUp(scale)};`);
    }
    const rule = (css: string, selector: string) =>
      new RegExp(`${selector.replace(/[.()]/g, '\\$&')}\\s*\\{[^}]*var\\(--wc-scene-up\\)`).test(
        css,
      );
    for (const selector of ['.num', '.stage :global(.card .badge)', '.stage :global(.card .mark)'])
      expect(rule(stageSource, selector), `Stage ${selector}`).toBe(true);
    for (const selector of ['.num', '.figure', '.ctl'])
      expect(rule(sceneSource, selector), `Scene ${selector}`).toBe(true);
    // Q-49: the `★` pill's size and font are counter-scaled as the badge (D12), not its inset.
    const pill = /\.stage :global\(\.card \.preview-mark\)\s*\{([^}]*)\}/.exec(stageSource)?.[1];
    for (const property of ['width', 'height', 'font-size'])
      expect(pill, `Stage .preview-mark ${property}`).toMatch(
        new RegExp(`(?:^|[;\\s])${property}:\\s*calc\\([^;]*var\\(--wc-scene-up\\)`),
      );
    // No other px font size in either file escapes the counter-scale.
    for (const css of [stageSource, sceneSource]) {
      const style = css.slice(css.indexOf('<style>'));
      for (const [declaration] of style.matchAll(/\bfont(?:-size)?:[^;]*;/g))
        if (/\dpx/.test(declaration))
          expect(declaration, 'a scene text size').toMatch(/--wc-scene-up/);
    }
  });
});
