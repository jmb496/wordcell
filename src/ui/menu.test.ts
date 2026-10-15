import { describe, expect, it, vi } from 'vitest';

// Epic 6 CAP-2 (ticket 6.2): the Menu sheet by server render (the unit environment has no DOM).
vi.mock('../shell/nav', () => ({ nav: { push: () => undefined, pop: () => undefined } }));
vi.mock('../shell/game.svelte', () => ({ game: { state: { kind: 'active' }, view: {} } }));

async function menuHtml(canGiveUp: boolean): Promise<string> {
  vi.resetModules();
  const { render } = await import('svelte/server');
  const { overlays } = await import('./overlays.svelte');
  overlays.open('menu');
  const { default: Menu } = await import('./Menu.svelte');
  return render(Menu, { props: { view: { canGiveUp } as never, hoverFine: false } }).body;
}

const giveUpButton = /<button[^>]*class="row[^"]*"[^>]*>(?:(?!<\/button>)[\s\S])*Give up/;

describe('AD-3 Menu sheet', () => {
  it('AD-3 Give up is disabled when view.canGiveUp is false', async () => {
    const html = await menuHtml(false);
    expect(giveUpButton.exec(html)?.[0]).toContain('disabled');
  });

  it('AD-3 Give up is enabled when view.canGiveUp is true; New game and Replay never disabled', async () => {
    const html = await menuHtml(true);
    expect(giveUpButton.exec(html)?.[0]).not.toContain('disabled');
    expect(html).toContain('New game');
    expect(html).toContain('Replay this deal');
    expect(html.match(/disabled/g)).toBeNull();
  });

  it('AD-13 the sheet has the title, the close control and the footer version', async () => {
    const html = await menuHtml(true);
    expect(html).toContain('>Menu</h2>');
    expect(html).toContain('aria-label="Close menu"');
    expect(html).toContain('class="version');
  });
});
