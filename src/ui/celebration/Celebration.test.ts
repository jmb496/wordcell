import { render } from 'svelte/server';
import { describe, expect, it, vi } from 'vitest';
import cardSource from '../Card.svelte?raw';
import columnSource from '../Column.svelte?raw';
import { cardMetrics } from '../layout/geometry';
import { text } from '../text';
import wordCellViewSource from '../WordCellView.svelte?raw';
import Celebration from './Celebration.svelte';
import source from './Celebration.svelte?raw';
import { CARD_STEP, rowWidth } from './step';

vi.mock('../../shell/prefs.svelte', () => ({ prefs: { motion: { baseMs: 180, reduced: false } } }));

// AD-19 (AD-14, A-D12): the renderer's markup.
const html = (
  groups: { letter: string; letterCount: number }[][],
  band = { left: 0, top: 56, width: 360, height: 500 },
) =>
  render(Celebration, {
    props: {
      groups,
      band,
      cardW: 40,
      register: () => undefined,
    },
  }).body;
const face = (letter: string) => ({ letter, letterCount: letter === 'QU' ? 2 : 1 });

describe('AD-19 Celebration', () => {
  it('AD-19 every group is hidden, carries data-celebration and aria-hidden, and has no live-card attributes', () => {
    const body = html([
      [face('C'), face('A'), face('T')],
      [face('QU'), face('A')],
    ]);
    // Each copy (5 = the sum of the rows' cards) carries data-celebration and aria-hidden; each
    // group element its own data-celebration-group marker.
    const copies = body.match(/<div class="face[^>]*>/g) ?? [];
    expect(copies).toHaveLength(5);
    expect(
      copies.every((t) => t.includes('data-celebration=""') && t.includes('aria-hidden="true"')),
    ).toBe(true);
    expect(body.match(/data-celebration=""/g)).toHaveLength(5);
    expect(body.match(/data-celebration-group=""/g)).toHaveLength(2);
    expect(
      body
        .match(/<div class="group[^>]*>/g)
        ?.every((t) => t.includes('data-celebration-group=""') && t.includes('opacity: 0')),
    ).toBe(true);
    // SPEC F21: a group element holds its copies and nothing else (the controller writes a
    // transform to each of its children).
    for (const g of body.split(/<div class="group/).slice(1))
      expect(g.match(/<div class="face/g)?.length).toBe(g.match(/<div/g)?.length);
    const root = /<div class="celebration[^>]*>/.exec(body)?.[0] ?? '';
    expect(root).toContain('data-celebration-root=""');
    expect(root).toContain('aria-hidden="true"');
    expect(body).not.toMatch(/data-card-id|data-testid|data-mirror-of/);
  });

  it('AD-19 the container is fixed to the band and clips to it; each copy scales from its top left', () => {
    const body = html([[face('A')]], { left: 12, top: 96, width: 336, height: 460 });
    const root = /<div class="celebration[^>]*style="([^"]*)"/.exec(body)?.[1] ?? '';
    for (const decl of ['left: 12px', 'top: 96px', 'width: 336px', 'height: 460px'])
      expect(root).toContain(decl);
    expect(rules(source, '.celebration').get('position')).toBe('fixed');
    expect(rules(source, '.celebration').get('overflow')).toBe('hidden');
    expect(rules(source, '.face').get('transform-origin')).toBe('0 0');
    expect(rules(source, '.face').get('left')).toBe('0');
    expect(rules(source, '.face').get('top')).toBe('0');
    // DESIGN.md Layer order: drag layer → win celebration → scrim → overlay.
    const z = Number(rules(source, '.celebration').get('z-index'));
    expect(z).toBe(6);
    expect(z).toBeGreaterThan(
      Number(rules(columnSource, '.cards :global(.face.wc-drag-layer)').get('z-index')),
    );
    expect(z).toBeLessThan(Number(rules(wordCellViewSource, '.layer').get('z-index')));
  });

  it('AD-19 each copy shows its own card letter in word order, at the board card height', () => {
    const body = html([
      [face('C'), face('A'), face('T')],
      [face('QU'), face('O'), face('T'), face('E')],
    ]);
    const groups = body.split(/<div class="group/).slice(1);
    expect(groups).toHaveLength(2);
    const glyphs = (g: string) => [...g.matchAll(/class="glyph[^"]*">([^<]*)</g)].map((m) => m[1]);
    expect(glyphs(groups[0] ?? '')).toEqual(['C', 'A', 'T']);
    expect(glyphs(groups[1] ?? '')).toEqual(['Qu', 'O', 'T', 'E']);
    const { H } = cardMetrics(40);
    expect(H).not.toBe(40 * 1.2);
    expect(rules(source, '.face').get('height')).toBe('var(--wc-H)');
    const root = /<div class="celebration[^>]*style="([^"]*)"/.exec(body)?.[1] ?? '';
    expect(root).toContain(`--wc-H: ${H}px`);
  });

  it('AD-19 SPEC F20: the copies carry no row layout (step.ts places each card, CARD_STEP 0.65 apart) and the faces carry the drag shadow', () => {
    const body = html([[face('W'), face('O'), face('R'), face('D')]]);
    // Every copy starts at its group's top left; each frame's per-card transform places it.
    expect(body.match(/<div class="face[^>]*style=/g)).toBeNull();
    expect(/<div class="group[^>]*style="([^"]*)"/.exec(body)?.[1]).toBe('opacity: 0;');
    expect(CARD_STEP).toBe(0.65);
    expect(rowWidth(4, 40)).toBeCloseTo(40 + 3 * 26, 10);
    // Per-card transforms: each copy is its own composited layer, the group only fades.
    expect(rules(source, '.face').get('will-change')).toBe('transform');
    expect(rules(source, '.group').get('will-change')).toBe('opacity');
    expect(rules(source, '.group').get('transform-origin')).toBeUndefined();
    // DESIGN.md Win celebration: the lifted-card shadow, read from --wc-shadow-drag (#0008 by default).
    expect(source).toContain('box-shadow: 0 6px 16px var(--wc-shadow-drag)');
  });

  it('AD-19 SPEC F23 stacking: the copies carry no z-index of their own; the letter and badge sit in the top of the face, so a lower copy drawn above covers only the bottom', () => {
    const body = html([[face('QU'), face('A'), face('T')]]);
    // The controller writes each copy's z-index (`stackOrder`); the markup starts in row order.
    expect(body).not.toMatch(/z-index/);
    expect(rules(source, '.face').get('z-index')).toBeUndefined();
    // The group element is a stacking context (will-change: opacity), so a copy's z-index orders
    // it only among its own group's copies.
    expect(rules(source, '.group').get('will-change')).toBe('opacity');
    // The glyph fills the top 72 % (its letter centred at 36 %), the QU badge the top 13 px: a copy
    // drawn above, at least as low on screen, never reaches either from above.
    expect(rules(source, '.glyph').get('top')).toBe('0');
    expect(rules(source, '.glyph').get('height')).toBe('72%');
    expect(rules(source, '.glyph.qu').get('top')).toBe('12px');
    expect(rules(source, '.badge').get('top')).toBe('1px');
    expect(rules(source, '.badge').get('height')).toBe('12px');
  });

  it('AD-19 a QU copy shows Qu with its badge, other letters have none', () => {
    const body = html([[face('QU')]]);
    expect(body).toMatch(/class="glyph[^"]* qu[^"]*">Qu</);
    expect(body).toMatch(new RegExp(`class="badge[^"]*">${text.quBadge}<`));
    expect(html([[face('A')]])).not.toContain('class="badge');
  });

  it('AD-19 the live [data-card-id] count is unchanged: the renderer emits none', () => {
    expect(html([[face('A')], [face('B')]]).match(/data-card-id/g)).toBeNull();
  });

  // AD-19: the copies' face rules equal Card.svelte's normal-state ones, property by property.
  const rules = (svelte: string, selector: string): Map<string, string> => {
    const css = (/<style>([\s\S]*)<\/style>/.exec(svelte)?.[1] ?? '').replace(
      /\/\*[\s\S]*?\*\//g,
      '',
    );
    const body = [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)].find(
      (m) => m[1]?.trim() === selector,
    )?.[2];
    if (body === undefined) throw new Error(`no ${selector} rule`);
    return new Map(
      body
        .split(';')
        .map((d) => d.trim().replace(/\s+/g, ' '))
        .filter((d) => d !== '')
        .map((d) => [d.slice(0, d.indexOf(':')).trim(), d.slice(d.indexOf(':') + 1).trim()]),
    );
  };
  const differing = (a: Map<string, string>, b: Map<string, string>, allowed: readonly string[]) =>
    [...new Set([...a.keys(), ...b.keys()])].filter(
      (p) => a.get(p) !== b.get(p) && !allowed.includes(p),
    );
  // The intended differences only. `.face`: a copy sits absolutely at its group's top left and is
  // placed by its own transform (`position`, `left`, `top`, `transform-origin`, `will-change`,
  // SPEC F21) and carries the drag elevation (`box-shadow`, DESIGN.md Win celebration); the board's
  // card has its wrapper margin and `pointer-events: none` (the copies' container already has it).
  const ALLOWED: Record<string, readonly string[]> = {
    '.face': [
      'position',
      'left',
      'top',
      'transform-origin',
      'will-change',
      'box-shadow',
      'margin',
      'pointer-events',
    ],
    '.face::after': [],
    '.glyph': [],
    '.glyph.qu': [],
    '.badge': [],
  };

  it('AD-19 the copy face rules match Card.svelte normal state, except the listed differences', () => {
    for (const [selector, allowed] of Object.entries(ALLOWED))
      expect([
        selector,
        differing(rules(source, selector), rules(cardSource, selector), allowed),
      ]).toEqual([selector, []]);
    // Negative control: the comparator flags a mutated declaration.
    const mutated = source.replace('font-weight: 600', 'font-weight: 700');
    expect(mutated).not.toBe(source);
    expect(differing(rules(mutated, '.glyph'), rules(cardSource, '.glyph'), [])).toEqual([
      'font-weight',
    ]);
  });
});
