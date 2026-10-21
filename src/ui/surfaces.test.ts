import { createRawSnippet } from 'svelte';
import { render } from 'svelte/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import dialogSrc from './Dialog.svelte?raw';
import endSheetSrc from './EndSheet.svelte?raw';
import { initMotion, REDUCED_FADE_MS } from './motion';
import panelSrc from './Panel.svelte?raw';
import {
  firstClick,
  onMounted,
  onOpenChange,
  onSettled,
  onTransitionEnd,
  ownsAnimation,
  ownsTransition,
} from './presence';
import sheetSrc from './Sheet.svelte?raw';
import viewSrc from './WordCellView.svelte?raw';

// Epic 6 CAP-1 (6.1): the shared surface primitives. The unit environment is `node` (no DOM), so
// the components are proved by server renders (markup, classes, `inert`) and the transition and
// focus logic by `presence.ts`; focus return and the computed transition are proved in a browser
// (e2e/menu.spec.ts for Sheet and Panel, e2e/wordcell-view.spec.ts for the view).
const mocks = vi.hoisted(() => ({ nav: [] as string[] }));

vi.mock('../shell/nav', () => ({
  nav: { push: () => mocks.nav.push('push'), pop: () => mocks.nav.push('pop') },
}));
vi.mock('../shell/game.svelte', () => ({
  game: {
    state: { kind: 'active' },
    view: {},
  },
}));
vi.mock('./Board.svelte', () => ({ default: () => undefined }));
vi.mock('./HistoryNotice.svelte', () => ({ default: () => undefined }));

const body = createRawSnippet(() => ({ render: () => '<p id="body">content</p>' }));
const noop = () => undefined;

describe('AD-14 presence', () => {
  it('AD-14 open mounts hidden, then shows once attached; close hides first and keeps it until the opacity transition ends', () => {
    let state = onOpenChange({ present: false, shown: false }, true, false);
    expect(state).toEqual({ present: true, shown: false });
    state = onMounted(true);
    expect(state).toEqual({ present: true, shown: true });
    state = onOpenChange(state, false, true);
    expect(state).toEqual({ present: true, shown: false });
    expect(onTransitionEnd(state, false)).toEqual({ present: false, shown: false });
  });

  it('AD-14 a close then reopen of the same surface during the exit ends in the latest state; a late transition end changes nothing', () => {
    let state = onOpenChange({ present: true, shown: true }, false, true);
    state = onOpenChange(state, true, true);
    expect(state).toEqual({ present: true, shown: true });
    expect(onTransitionEnd(state, true)).toBe(state);
  });

  it('AD-14 a close before it ever showed removes it at once; an end with it shown or absent changes nothing', () => {
    expect(onOpenChange({ present: true, shown: false }, false, true)).toEqual({
      present: false,
      shown: false,
    });
    const shown = { present: true, shown: true };
    expect(onTransitionEnd(shown, false)).toBe(shown);
    const gone = { present: false, shown: false };
    expect(onTransitionEnd(gone, false)).toBe(gone);
    expect(onMounted(false)).toEqual({ present: false, shown: false });
  });

  it('AD-14 close during the open fade: the cancel of the reversed transition keeps it; the end (or a cancel with nothing running) removes it', () => {
    let state = onMounted(true);
    state = onOpenChange(state, false, true);
    expect(onSettled(state, false, true)).toBe(state);
    expect(onTransitionEnd(state, false)).toEqual({ present: false, shown: false });
    expect(onSettled(state, false, false)).toEqual({ present: false, shown: false });
  });

  it('AD-14 a close in the frame it opened (no transition started) leaves once nothing is running; a reopen keeps it', () => {
    const closed = onOpenChange(onMounted(true), false, true);
    expect(onSettled(closed, false, false)).toEqual({ present: false, shown: false });
    const reopened = onOpenChange(closed, true, true);
    expect(onSettled(reopened, true, false)).toBe(reopened);
  });

  it('AD-14 only animations targeting the surface own elements count as running', () => {
    const node = { hasAttribute: () => false };
    const marked = { hasAttribute: (name: string) => name === 'data-presence-target' };
    const descendant = { hasAttribute: () => false };
    const anim = (target: unknown) => ({ effect: { target } }) as unknown as Animation;
    const n = node as unknown as EventTarget;
    expect(ownsAnimation(anim(node), n)).toBe(true);
    expect(ownsAnimation(anim(marked), n)).toBe(true);
    expect(ownsAnimation(anim(descendant), n)).toBe(false);
    expect(ownsAnimation({ effect: null } as unknown as Animation, n)).toBe(false);
  });

  it('AD-14 only the surface own elements end its exit: a descendant opacity end does not', () => {
    const node = { hasAttribute: () => false };
    const marked = { hasAttribute: (name: string) => name === 'data-presence-target' };
    const descendant = { hasAttribute: () => false };
    expect(ownsTransition(node as unknown as EventTarget, node as unknown as EventTarget)).toBe(
      true,
    );
    expect(ownsTransition(marked as unknown as EventTarget, node as unknown as EventTarget)).toBe(
      true,
    );
    expect(
      ownsTransition(descendant as unknown as EventTarget, node as unknown as EventTarget),
    ).toBe(false);
    expect(ownsTransition(null, node as unknown as EventTarget)).toBe(false);
    expect(sheetSrc.match(/data-presence-target/g)).toHaveLength(2);
  });

  it('AD-12 firstClick ignores the second click of a multi-click and passes keyboard activation', () => {
    const calls: number[] = [];
    const handler = firstClick(() => calls.push(1));
    handler({ detail: 0 } as MouseEvent);
    handler({ detail: 1 } as MouseEvent);
    handler({ detail: 2 } as MouseEvent);
    expect(calls).toHaveLength(2);
    expect(() => firstClick(undefined)({ detail: 1 } as MouseEvent)).not.toThrow();
  });
});

describe('AD-10 initMotion', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('AD-10 after initMotion() --wc-fade-ms equals the exported 120 ms constant', () => {
    const style = new Map<string, string>();
    vi.stubGlobal('document', {
      documentElement: { style: { setProperty: (k: string, v: string) => style.set(k, v) } },
    });
    initMotion();
    expect(REDUCED_FADE_MS).toBe(120);
    expect(style.get('--wc-fade-ms')).toBe(`${REDUCED_FADE_MS}ms`);
  });
});

describe('AD-10 surface CSS', () => {
  const FILES: [string, string][] = [
    ['Sheet', sheetSrc],
    ['Panel', panelSrc],
    ['Dialog', dialogSrc],
    ['WordCellView', viewSrc],
    ['EndSheet', endSheetSrc],
  ];

  for (const [name, source] of FILES) {
    it(`AD-10 ${name}.svelte: a @container style(--wc-reduced: 1) branch reads var(--wc-fade-ms); no literal 120ms, no WAAPI`, () => {
      const css = source.slice(source.indexOf('<style>'));
      const branch = /@container style\(--wc-reduced: 1\) \{([\s\S]*?)\n {2}\}/.exec(css);
      expect(branch).not.toBeNull();
      expect(branch?.[1]).toContain('transition: opacity var(--wc-fade-ms)');
      expect(css).not.toMatch(/120\s*ms/);
      expect(css).toContain('var(--wc-base-ms)');
      expect(source).not.toMatch(/\.animate\(|duration\('overlay'\)/);
    });
  }
});

describe('AD-14 Sheet, Panel and Dialog markup', () => {
  it('AD-14 Sheet open: a dialog with a scrim, a close control with the given name, safe-area padding, content', async () => {
    const { default: Sheet } = await import('./Sheet.svelte');
    const { body: html } = render(Sheet, {
      props: {
        title: 'Menu',
        closeLabel: 'Close menu',
        onclose: noop,
        onscrim: noop,
        children: body,
      },
    });
    expect(html).toContain('role="dialog"');
    expect(html).toContain('aria-modal="true"');
    expect(html).toContain('>Menu</h2>');
    expect(html).toContain('aria-label="Close menu"');
    expect(html).toContain('content</p>');
    expect(html).not.toContain('inert');
    expect(html).not.toContain('shown');
    const source = sheetSrc;
    expect(source).toContain('padding-bottom: env(safe-area-inset-bottom)');
    expect(source).toContain('max-height: 80dvh');
  });

  it('AD-14 Sheet closed renders nothing; exiting is inert (the open flag drives both)', async () => {
    const { default: Sheet } = await import('./Sheet.svelte');
    const { body: html } = render(Sheet, {
      props: { title: 'Menu', closeLabel: 'Close', onclose: noop, open: false, children: body },
    });
    expect(html).not.toContain('role="dialog"');
    const source = sheetSrc;
    expect(source).toContain('inert={!open}');
    expect(source).toContain('ontransitioncancel');
  });

  it('AD-14 Panel open: a heading focus target (tabindex -1), the back control, safe-area padding on all sides', async () => {
    const { default: Panel } = await import('./Panel.svelte');
    const { body: html } = render(Panel, {
      props: { title: 'Statistics', closeLabel: 'Back', onclose: noop, children: body },
    });
    expect(html).toContain('<h2');
    expect(html).toContain('tabindex="-1"');
    expect(html).toContain('aria-label="Back"');
    const source = panelSrc;
    for (const side of ['top', 'right', 'bottom', 'left']) {
      expect(source).toContain(`env(safe-area-inset-${side})`);
    }
    expect(source).toContain('max-width: 560px');
  });

  it('AD-14 Dialog: the action takes the primary or the default danger style; the dismissive button is first', async () => {
    const { default: Dialog } = await import('./Dialog.svelte');
    const props = {
      title: 'T',
      body: 'B',
      dismiss: 'Keep playing',
      action: 'New game',
      ondismiss: noop,
      onaction: noop,
    };
    const primary = render(Dialog, { props: { ...props, actionStyle: 'primary' } }).body;
    expect(primary).toMatch(/class="primary[^"]*"[^>]*>New game/);
    expect(primary.indexOf('Keep playing')).toBeLessThan(primary.indexOf('New game'));
    const danger = render(Dialog, { props }).body;
    expect(danger).toMatch(/class="danger[^"]*"[^>]*>New game/);
    expect(render(Dialog, { props: { ...props, inert: true } }).body).toContain('inert');
    expect(render(Dialog, { props: { ...props, open: false } }).body).not.toContain(
      'role="dialog"',
    );
  });
});

describe('AD-13 App main inert', () => {
  // resetConfirm opens over endSheet, which is not itself in INERT_UNDER, so its own inertness decides.
  const INERT_IDS = [
    'historyNotice',
    'resetConfirm',
    'menu',
    'statistics',
    'preferences',
    'howToPlay',
    'newGameConfirm',
    'replayConfirm',
  ] as const;

  async function mountApp(
    open: (o: Awaited<typeof import('./overlays.svelte')>['overlays']) => void,
  ) {
    vi.resetModules();
    const { render } = await import('svelte/server');
    const { overlays } = await import('./overlays.svelte');
    open(overlays);
    const { default: App } = await import('./App.svelte');
    const controller = { attach: () => noop, cancel: noop, refreshHover: noop };
    return render(App, { props: { layout: {} as never, controller: controller as never } }).body;
  }

  it('AD-13 main is not inert with no surface open', async () => {
    expect(await mountApp(noop)).not.toMatch(/<main[^>]*inert/);
  });

  for (const id of INERT_IDS) {
    it(`AD-13 main is inert while ${id} is on the stack`, async () => {
      const html = await mountApp((o) => {
        if (id === 'resetConfirm') o.openDeferred(o.deferEndSheetOpen());
        o.open(id);
      });
      expect(html).toMatch(/<main[^>]*inert/);
    });
  }
});
