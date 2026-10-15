import { render } from 'svelte/server';
import { describe, expect, it, vi } from 'vitest';
import type { GameView } from '../engine/index';
import Tray from './Tray.svelte';

vi.mock('../shell/game.svelte', () => ({ game: { feedback: {} } }));

const sizing = { w: 40 } as never;
const draw = (pendingDraftWord: string | undefined, draft?: object): string =>
  render(Tray, {
    props: {
      view: {
        pendingDraftWord,
        draft,
        place: undefined,
        status: 'playing',
        faces: [],
      } as unknown as GameView,
      sizing,
      height: 200,
      hoverFine: false,
    },
  }).body;

// The word-line slot's text with the markup removed.
const slot = (html: string): string =>
  (/<div class="word-line[^"]*">(.*?)<\/div>/s.exec(html)?.[1] ?? '').replace(/<[^>]*>/g, '');

describe('AD-3 pending-draft line', () => {
  it('AD-3 renders prefix, uppercased word and suffix from pendingDraftWord only', () => {
    const html = draw('quake');
    expect(slot(html)).toBe('Undone: QUAKE · Redo brings it back');
    expect(html).not.toMatch(/aria-live|role="status"/);
  });

  it('AD-3 renders no line when pendingDraftWord is undefined', () => {
    expect(draw(undefined)).not.toContain('Undone');
  });

  it('AD-3 a defined draft takes the word-line branch: no pending line even with pendingDraftWord set', () => {
    const html = draw('quake', {
      wordCards: [],
      destination: [],
      freeLetters: [],
      arrangement: [],
      side: 'left',
      k: 0,
      letterCount: 0,
    });
    expect(html).not.toContain('Undone');
    expect(html).not.toContain('class="pending');
  });
});
