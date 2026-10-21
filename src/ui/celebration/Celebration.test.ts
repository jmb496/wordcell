import { render } from 'svelte/server';
import { describe, expect, it, vi } from 'vitest';
import { text } from '../text';
import Celebration from './Celebration.svelte';
import source from './Celebration.svelte?raw';

vi.mock('../../shell/prefs.svelte', () => ({ prefs: { motion: { baseMs: 180, reduced: false } } }));

// AD-19 (AD-14, A-D12): the renderer's markup.
const html = (groups: { letter: string; letterCount: number }[][]) =>
  render(Celebration, {
    props: {
      groups,
      band: { left: 0, top: 56, width: 360, height: 500 },
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
    expect(body.match(/data-celebration=""/g)).toHaveLength(2);
    expect(
      body
        .match(/<div class="group[^>]*>/g)
        ?.every((t) => t.includes('aria-hidden="true"') && t.includes('opacity: 0')),
    ).toBe(true);
    expect(body).not.toMatch(/data-card-id|data-testid|data-mirror-of/);
  });

  it('AD-19 cards overlap by 50 % of the card width and the faces carry the drag shadow', () => {
    const body = html([[face('C'), face('A'), face('T')]]);
    const lefts = [...body.matchAll(/class="face[^"]*" style="left: ([\d.]+)px/g)].map((m) => m[1]);
    expect(lefts).toEqual(['0', '20', '40']);
    expect(body).toContain('width: 80px');
    // DESIGN.md Win celebration: the lifted-card shadow, read from --wc-shadow-drag (#0008 by default).
    expect(source).toContain('box-shadow: 0 6px 16px var(--wc-shadow-drag)');
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
});
