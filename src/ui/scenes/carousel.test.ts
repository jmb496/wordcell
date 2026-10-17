import { describe, expect, it, vi } from 'vitest';
import { text } from '../text';
import source from './Carousel.svelte?raw';
import { scenes } from './index';

// Epic 8 ticket 6 (HP-1, HP-6): the scene carousel by server render (no DOM, so no width
// measurement) and by its source for the wiring a render cannot show.
vi.mock('../../shell/prefs.svelte', () => ({ prefs: { motion: { baseMs: 180, reduced: false } } }));
vi.mock('../../shell/nav', () => ({ nav: { push: () => undefined, pop: () => undefined } }));

async function html(): Promise<string> {
  vi.resetModules();
  const { render } = await import('svelte/server');
  const { overlays } = await import('../overlays.svelte');
  overlays.open('howToPlay');
  const { default: Carousel } = await import('./Carousel.svelte');
  return render(Carousel).body;
}

const labels = text.howTo.carousel;

describe('AD-3 scene carousel', () => {
  it('AD-3 previous and next arrows by their text.ts names, one dot per scene named Scene n of N', async () => {
    const body = await html();
    expect(body).toContain(`aria-label="${labels.previous}"`);
    expect(body).toContain(`aria-label="${labels.next}"`);
    expect(labels.previous).toBe('Previous scene');
    expect(labels.next).toBe('Next scene');
    for (let i = 1; i <= scenes.length; i++)
      expect(body).toContain(`aria-label="Scene ${i} of ${scenes.length}"`);
    expect(body.match(/class="dot /g)).toHaveLength(scenes.length);
  });

  it('AD-3 the first scene is current and the start arrow is aria-disabled, the end arrow is not', async () => {
    const body = await html();
    expect(body.match(/aria-current="true"/g)).toHaveLength(1);
    expect(body).toMatch(/aria-label="Scene 1 of \d+" aria-current="true"/);
    expect(body).toMatch(/aria-label="Previous scene" aria-disabled="true"/);
    expect(body).not.toMatch(/aria-label="Next scene" aria-disabled/);
  });

  it('AD-3 no scene is mounted before the first non-zero width measurement', async () => {
    const body = await html();
    expect(body).not.toContain('<figure');
    expect(body).not.toContain('<figcaption');
    expect(body).toContain('class="host');
  });

  it('AD-3 no live region and no swipe or drag handlers', async () => {
    const body = await html();
    expect(body).not.toContain('aria-live');
    expect(source).not.toMatch(/aria-live|onpointer|ontouch|ondrag/);
  });
});

describe('AD-12 scene carousel wiring', () => {
  it('AD-12 every button handler and the key handler go through act()', () => {
    const handlers = [...source.matchAll(/onclick=\{([^}]*)\}/g)].map((m) => m[1]);
    expect(handlers).toHaveLength(3);
    for (const handler of handlers) expect(handler).toMatch(/^act\(/);
    expect(source).toMatch(/act\(event\.key === 'ArrowLeft' \? previous : next\)\(\)/);
  });

  it('AD-9 the keys are an element handler on the root: no window or document listener', () => {
    expect(source).toContain('{onkeydown}');
    expect(source).not.toMatch(/addEventListener|svelte:window|svelte:document/);
  });

  it('AD-13 the scene mounts only while the howToPlay open flag is true, and the index resets when it goes false', () => {
    expect(source).toContain("overlays.isOpen('howToPlay')");
    expect(source).toMatch(/if \(!open\) index = 0/);
    expect(source).toMatch(/const mounted = \$derived\(open && fit !== undefined\)/);
  });

  it('AD-11 the scene is keyed on index, reduced motion, Animation speed and the fitted card width', () => {
    expect(source).toMatch(
      /\$\{index\}\|\$\{prefs\.motion\.reduced\}\|\$\{prefs\.motion\.baseMs\}\|\$\{fit\.cardWidth\}/,
    );
    expect(source).toContain('{#key key}');
  });
});
