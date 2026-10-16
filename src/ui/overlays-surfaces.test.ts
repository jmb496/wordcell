import { describe, expect, it, vi } from 'vitest';

// Epic 6 CAP-1 (6.1) AD-13 matrix for the six new surface ids and resetConfirm's legal tops, with
// nav stubbed; fresh overlays module per test (module-level stack). `calls` records nav ops.
const calls: string[] = [];

vi.mock('../shell/nav', () => ({
  nav: { push: () => calls.push('push'), pop: () => calls.push('pop') },
}));

async function load() {
  vi.resetModules();
  calls.length = 0;
  const { overlays } = await import('./overlays.svelte');
  const { openSurface } = await import('./open-surface');
  return { overlays, openSurface };
}

type Overlays = Awaited<ReturnType<typeof load>>['overlays'];
type Id = Parameters<Overlays['open']>[0];

const PANELS: Id[] = ['statistics', 'preferences', 'howToPlay'];
const BASE: Id[] = ['menu', ...PANELS];
const CONFIRMS: Id[] = ['newGameConfirm', 'replayConfirm'];
const NEW_IDS: Id[] = [...BASE, ...CONFIRMS];

function withEndSheet(overlays: Overlays): void {
  overlays.openDeferred(overlays.deferEndSheetOpen());
}

describe('AD-13 new surface ids: depth, close, back, reset', () => {
  for (const id of BASE) {
    it(`AD-13 ${id}: open on empty is depth 1, on the end sheet depth 2; close pops; back removes it; reset leaves 0`, async () => {
      const { overlays } = await load();
      overlays.open(id);
      expect(overlays.depth).toBe(1);
      expect(overlays.top).toBe(id);
      overlays.close(id);
      expect(overlays.depth).toBe(0);
      expect(calls).toEqual(['push', 'pop']);
      calls.length = 0;
      withEndSheet(overlays);
      overlays.open(id);
      expect(overlays.depth).toBe(2);
      overlays.closedByBack(1);
      expect(overlays.depth).toBe(1);
      expect(overlays.top).toBe('endSheet');
      overlays.open(id);
      overlays.resetForNewSession();
      expect(overlays.depth).toBe(0);
      expect(calls.filter((c) => c === 'pop')).toHaveLength(2);
    });
  }

  for (const id of CONFIRMS) {
    it(`AD-13 ${id}: depth 1, 2 over the end sheet or a panel, 3 over a panel under the end sheet`, async () => {
      const { overlays } = await load();
      overlays.open(id);
      expect(overlays.depth).toBe(1);
      overlays.close(id);
      withEndSheet(overlays);
      overlays.open(id);
      expect(overlays.depth).toBe(2);
      overlays.close(id);
      overlays.open('statistics');
      overlays.open(id);
      expect(overlays.depth).toBe(3);
      overlays.resetForNewSession();
      expect(overlays.depth).toBe(0);
      expect(calls.filter((c) => c === 'pop')).toHaveLength(
        calls.filter((c) => c === 'push').length,
      );
      overlays.open('statistics');
      overlays.open(id);
      overlays.closedByBack(1);
      expect(overlays.top).toBe('statistics');
      overlays.closedByBack(0);
      expect(overlays.depth).toBe(0);
    });

    it(`AD-13 ${id}: dismissal closes only the confirm; the opener below stays`, async () => {
      const { overlays } = await load();
      overlays.open('preferences');
      overlays.open(id);
      overlays.close(id);
      expect(overlays.top).toBe('preferences');
      expect(overlays.depth).toBe(1);
    });
  }
});

describe('AD-13 new surface ids: legal tops and refusals', () => {
  it('AD-13 one illegal pair per new id throws AD-13 open(<id>) while <top> is the top entry', async () => {
    const { overlays } = await load();
    overlays.open('menu');
    for (const id of NEW_IDS.filter((x) => x !== 'menu')) {
      expect(() => overlays.open(id)).toThrow(`AD-13 open(${id}) while menu is the top entry`);
    }
    expect(overlays.depth).toBe(1);
    expect(calls).toEqual(['push']);
  });

  it('AD-13 a confirm over a confirm throws', async () => {
    const { overlays } = await load();
    overlays.open('newGameConfirm');
    expect(() => overlays.open('replayConfirm')).toThrow(
      'AD-13 open(replayConfirm) while newGameConfirm is the top entry',
    );
  });

  it('AD-13 a menu, panel or confirm over a panel or a notice throws (only confirms stack on a panel)', async () => {
    const { overlays } = await load();
    overlays.open('statistics');
    for (const id of ['menu', 'preferences', 'howToPlay'] as Id[]) {
      expect(() => overlays.open(id)).toThrow(
        `AD-13 open(${id}) while statistics is the top entry`,
      );
    }
    overlays.close('statistics');
    overlays.open('historyNotice');
    for (const id of NEW_IDS) {
      expect(() => overlays.open(id)).toThrow(
        `AD-13 open(${id}) while historyNotice is the top entry`,
      );
    }
  });

  it('AD-13 an open of a new id over tailSelection or wordcellView throws', async () => {
    const { overlays } = await load();
    overlays.select(2, 3);
    expect(() => overlays.open('menu')).toThrow(
      'AD-13 open(menu) while tailSelection is the top entry',
    );
    overlays.deselect();
    overlays.openView(4);
    expect(() => overlays.open('statistics')).toThrow(
      'AD-13 open(statistics) while wordcellView is the top entry',
    );
  });

  it('AD-13 a new id over a peek throws; over hoverPeek it clears it; tile selection stays untouched', async () => {
    const { overlays } = await load();
    overlays.openPeek(5);
    expect(() => overlays.open('menu')).toThrow('AD-13 open(menu) while a peek is open');
    overlays.closePeek();
    overlays.openHoverPeek(5);
    overlays.selectTile(7);
    overlays.open('menu');
    expect(overlays.hoverPeek).toBeNull();
    expect(overlays.tileSelection).toBe(7);
  });

  it('AD-13 select, expandEndSheet and openView throw with a new id on top', async () => {
    const { overlays } = await load();
    for (const id of BASE) {
      overlays.open(id);
      expect(() => overlays.select(1, 1)).toThrow(`AD-13 select(1, 1) while ${id} is open`);
      expect(() => overlays.openView(3)).toThrow(`AD-13 openView while ${id} is the top entry`);
      overlays.close(id);
    }
    withEndSheet(overlays);
    overlays.collapseEndSheet();
    overlays.open('newGameConfirm');
    expect(() => overlays.expandEndSheet()).toThrow(
      'AD-13 expandEndSheet while newGameConfirm is open',
    );
    expect(() => overlays.openView(3)).toThrow(
      'AD-13 openView while newGameConfirm is the top entry',
    );
  });

  it('AD-13 the menu item order: [endSheet, menu] -> [endSheet] -> [endSheet, X]; [menu] -> [] -> [X]', async () => {
    const { overlays, openSurface } = await load();
    withEndSheet(overlays);
    openSurface('menu');
    expect(overlays.depth).toBe(2);
    overlays.close('menu');
    expect(overlays.top).toBe('endSheet');
    openSurface('statistics');
    expect(overlays.top).toBe('statistics');
    expect(overlays.depth).toBe(2);
    overlays.resetForNewSession();
    calls.length = 0;
    openSurface('menu');
    overlays.close('menu');
    expect(overlays.depth).toBe(0);
    openSurface('newGameConfirm');
    expect(overlays.depth).toBe(1);
    expect(calls).toEqual(['push', 'pop', 'push']);
  });
});

describe('AD-13 resetConfirm legal tops', () => {
  it('AD-13 resetConfirm opens over historyNotice, statistics and endSheet; the chains reach depth 3', async () => {
    const { overlays } = await load();
    withEndSheet(overlays);
    overlays.open('historyNotice');
    overlays.open('resetConfirm');
    expect(overlays.depth).toBe(3);
    overlays.resetForNewSession();
    withEndSheet(overlays);
    overlays.open('statistics');
    overlays.open('resetConfirm');
    expect(overlays.depth).toBe(3);
    overlays.resetForNewSession();
    withEndSheet(overlays);
    overlays.open('resetConfirm');
    expect(overlays.depth).toBe(2);
  });

  it('AD-13 resetConfirm elsewhere throws, including on an empty stack, and keeps hoverPeek', async () => {
    const { overlays } = await load();
    expect(() => overlays.open('resetConfirm')).toThrow(
      'AD-13 open(resetConfirm) on an empty stack',
    );
    overlays.open('menu');
    expect(() => overlays.open('resetConfirm')).toThrow(
      'AD-13 open(resetConfirm) while menu is the top entry',
    );
    overlays.close('menu');
    overlays.open('preferences');
    expect(() => overlays.open('resetConfirm')).toThrow(
      'AD-13 open(resetConfirm) while preferences is the top entry',
    );
    overlays.close('preferences');
    overlays.select(2, 3);
    expect(() => overlays.open('resetConfirm')).toThrow(
      'AD-13 open(resetConfirm) while tailSelection is the top entry',
    );
    overlays.deselect();
    overlays.openView(4);
    expect(() => overlays.open('resetConfirm')).toThrow(
      'AD-13 open(resetConfirm) while wordcellView is the top entry',
    );
  });

  it('AD-13 resetConfirm over a legal top keeps hoverPeek', async () => {
    const { overlays } = await load();
    overlays.openHoverPeek(5);
    overlays.open('historyNotice');
    expect(overlays.hoverPeek).toBe(5);
    overlays.open('resetConfirm');
    expect(overlays.hoverPeek).toBe(5);
    expect(overlays.top).toBe('resetConfirm');
  });

  it('AD-13 historyNotice keeps its rules: opens over a peek or sticky view and keeps hoverPeek', async () => {
    const { overlays } = await load();
    overlays.openView(4);
    overlays.open('historyNotice');
    expect(overlays.depth).toBe(2);
    overlays.resetForNewSession();
    overlays.openHoverPeek(5);
    overlays.open('historyNotice');
    expect(overlays.hoverPeek).toBe(5);
  });
});

describe('AD-13 openSurface', () => {
  it('AD-13 a tail selection pops its entry then pushes; the selection is null', async () => {
    const { overlays, openSurface } = await load();
    overlays.select(2, 3);
    calls.length = 0;
    openSurface('menu');
    expect(calls).toEqual(['pop', 'push']);
    expect(overlays.selection).toBeNull();
    expect(overlays.top).toBe('menu');
  });

  it('AD-13 a tile selection is cleared', async () => {
    const { overlays, openSurface } = await load();
    overlays.selectTile(3);
    openSurface('menu');
    expect(overlays.tileSelection).toBeNull();
  });

  it('AD-13 a sticky view is closed, then the surface pushed', async () => {
    const { overlays, openSurface } = await load();
    overlays.openView(4);
    calls.length = 0;
    openSurface('statistics');
    expect(calls).toEqual(['pop', 'push']);
    expect(overlays.viewCell).toBeNull();
    expect(overlays.depth).toBe(1);
  });

  it('AD-13 a peek and a hover peek are cleared without a throw', async () => {
    const { overlays, openSurface } = await load();
    overlays.openPeek(4);
    openSurface('menu');
    expect(overlays.peek).toBeNull();
    overlays.close('menu');
    overlays.openHoverPeek(5);
    openSurface('menu');
    expect(overlays.hoverPeek).toBeNull();
  });

  it('AD-13 over a modal notice it throws and clears nothing; resetConfirm itself is excepted', async () => {
    const { overlays, openSurface } = await load();
    overlays.open('historyNotice');
    overlays.selectTile(3);
    expect(() => openSurface('menu')).toThrow(
      'AD-13 open(menu) while historyNotice is the top entry',
    );
    expect(overlays.tileSelection).toBe(3);
    openSurface('resetConfirm');
    expect(overlays.depth).toBe(2);
    expect(() => openSurface('newGameConfirm')).toThrow(
      'AD-13 open(newGameConfirm) while resetConfirm is the top entry',
    );
  });

  it('AD-13 resetConfirm over the History notice leaves a sticky view, a tail selection or a peek beneath it untouched', async () => {
    for (const beneath of ['view', 'tail', 'peek'] as const) {
      const { overlays, openSurface } = await load();
      if (beneath === 'view') overlays.openView(4);
      else if (beneath === 'tail') overlays.select(2, 3);
      else overlays.openPeek(4);
      overlays.open('historyNotice');
      calls.length = 0;
      expect(() => openSurface('resetConfirm')).not.toThrow();
      expect(overlays.top).toBe('resetConfirm');
      expect(calls).toEqual(['push']);
      expect(
        overlays.viewCell !== null || overlays.selection !== null || overlays.peek !== null,
      ).toBe(true);
    }
  });

  it('AD-13 a second call while the pop is pending throws from the store guard; nav sees one pop then one push', async () => {
    const { overlays, openSurface } = await load();
    overlays.select(2, 3);
    calls.length = 0;
    openSurface('menu');
    overlays.selectTile(7);
    expect(() => openSurface('menu')).toThrow('AD-13 open(menu) while it is open');
    expect(overlays.tileSelection).toBe(7);
    expect(() => openSurface('statistics')).toThrow(
      'AD-13 open(statistics) while menu is the top entry',
    );
    expect(calls).toEqual(['pop', 'push']);
  });
});
