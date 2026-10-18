import { parse } from 'svelte/compiler';
import { describe, expect, it, vi } from 'vitest';
import source from './HowToPlayPanel.svelte?raw';
import { bandNames, text } from './text';

// Ticket 6.9 (CAP-8): the How to play panel by server render (the unit environment has no DOM).
// Epic 8 ticket 1: the scenes read the Animation speed pref, whose store imports the game store.
vi.mock('../shell/prefs.svelte', () => ({ prefs: { motion: { baseMs: 180, reduced: false } } }));
vi.mock('../shell/nav', () => ({ nav: { push: () => undefined, pop: () => undefined } }));

async function html(): Promise<string> {
  vi.resetModules();
  const { render } = await import('svelte/server');
  const { overlays } = await import('./overlays.svelte');
  overlays.open('howToPlay');
  const { default: Panel } = await import('./HowToPlayPanel.svelte');
  return render(Panel).body;
}

const decode = (s: string): string =>
  s.replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n))).replace(/&amp;/g, '&');

function inner(body: string, tag: string): string[] {
  return [...body.matchAll(new RegExp(`<${tag}(?=[\\s>])[^>]*>([\\s\\S]*?)</${tag}>`, 'g'))].map(
    (m) => decode((m[1] ?? '').replace(/<!---->|<!--\[.*?-->/g, '')),
  );
}

describe('AD-3 How to play panel', () => {
  it('AD-3 the title and the three h3 headings equal the text.ts strings, in order', async () => {
    const body = await html();
    expect(inner(body, 'h2')).toEqual([text.howToPlay]);
    expect(inner(body, 'h3')).toEqual(Object.values(text.howTo.headings));
    expect(Object.values(text.howTo.headings)).toHaveLength(3);
  });

  it('AD-3 every body paragraph, caption and band is rendered from text.ts', async () => {
    const body = await html();
    const paragraphs = inner(body, 'p');
    const expected = [...text.howTo.goal, ...text.howTo.scoring];
    expect(paragraphs).toEqual(expected);
    // The carousel mounts a scene only after its first non-zero width measurement (ticket 6), which
    // a server render never has: the captions are asserted in scenes.test.ts and the e2e specs.
    expect(inner(body, 'figcaption')).toEqual([]);
    expect(inner(body, 'caption')).toEqual(Object.values(text.howTo.controlCaptions));
    for (const name of bandNames()) expect(body).toContain(name);
  });

  it('AD-3 the scene cards are static: no card id, test id, place or mirror-of', async () => {
    const body = await html();
    expect(body).not.toContain('data-card-id');
    expect(body).not.toContain('data-testid');
    expect(body).not.toContain('data-mirror-of');
    expect(body).not.toContain('data-place');
    // No scene is mounted before the first width measurement (ticket 6): the cards are counted in
    // scenes.test.ts and stage.test.ts.
    expect(body.match(/class="card[^"]*static/g)).toBeNull();
  });

  it('HP-7 the A move and Worked example headings are absent; the kept sections are present', async () => {
    const body = await html();
    const headings = inner(body, 'h3');
    expect(headings).not.toContain('A move');
    expect(headings).not.toContain('Worked example');
    expect(headings).toEqual([
      text.howTo.headings.goal,
      text.howTo.headings.scoring,
      text.howTo.headings.controls,
    ]);
    expect(body).not.toContain('class="example"');
  });

  it('AD-3 the markup has no prose text node (every string is a text.ts expression)', () => {
    const ast = parse(source, { modern: true });
    const prose: string[] = [];
    const visit = (node: unknown): void => {
      if (node === null || typeof node !== 'object') return;
      const n = node as { type?: string; data?: string };
      if (n.type === 'Text' && (n.data ?? '').trim() !== '') prose.push(n.data ?? '');
      for (const [key, value] of Object.entries(node)) {
        if (key === 'attributes') continue;
        if (Array.isArray(value)) for (const item of value) visit(item);
        else if (value !== null && typeof value === 'object') visit(value);
      }
    };
    visit(ast.fragment);
    expect(prose).toEqual([]);
  });

  it('AD-3 the keyboard strings cover every key of the EXPERIENCE.md Keyboard table', () => {
    expect(text.howTo.keyboard.map(([key]) => key)).toEqual([
      '1\u20138',
      '\u2191 / \u2193',
      '3\u20139, 0 (= 10)',
      '\u2190 / \u2192',
      'Shift + \u2190 / \u2192',
      'Space',
      '+ or = / -',
      'F',
      'Enter',
      'Z, Ctrl/Cmd + Z',
      'Y, Ctrl/Cmd + Y, Ctrl/Cmd + Shift + Z',
      'Esc',
      'M',
      'N',
      '?',
    ]);
    expect(text.howTo.keyboard.map(([, effect]) => effect)).toEqual([
      'Select the bottom card of a column, or drop the selected tail on it',
      'Make the selected tail longer / shorter',
      'Add that WordCell\u2019s top card as a free letter, or set it as the target',
      'Move focus along the tiles or the strip',
      'Move the focused tile or card one place',
      'Tap the focused card, tile or WordCell; on a WordCell, open its view',
      'More / fewer destination cards',
      'Flip the destination block',
      'Tap the focused item; otherwise Validate or Confirm',
      'Undo',
      'Redo',
      'Close the topmost panel, or clear the selection',
      'Open the menu',
      'Start a new game',
      'Open this page',
    ]);
  });
});
