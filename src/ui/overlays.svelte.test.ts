import { describe, expect, it, vi } from 'vitest';

// AD-13 overlays store with nav stubbed: fresh module per test (module-level stack). Each stubbed
// pop records the top left after the close, so the close order is observable.
const calls: string[] = [];
const topAtPop: (string | undefined)[] = [];
let current: { readonly top: string | undefined } | undefined;

vi.mock('../shell/nav', () => ({
  nav: {
    push: () => calls.push('push'),
    pop: () => {
      calls.push('pop');
      topAtPop.push(current?.top);
    },
  },
}));

async function load() {
  vi.resetModules();
  calls.length = 0;
  topAtPop.length = 0;
  const { overlays } = await import('./overlays.svelte');
  current = overlays;
  return overlays;
}

describe('AD-13 overlays', () => {
  it('AD-13 open pushes one entry per id; depth, top and isOpen follow the stack', async () => {
    const overlays = await load();
    expect(overlays.depth).toBe(0);
    expect(overlays.top).toBeUndefined();
    overlays.open('historyNotice');
    overlays.open('resetConfirm');
    expect(calls).toEqual(['push', 'push']);
    expect(overlays.depth).toBe(2);
    expect(overlays.top).toBe('resetConfirm');
    expect(overlays.isOpen('historyNotice')).toBe(true);
    expect(overlays.isOpen('resetConfirm')).toBe(true);
    overlays.close('resetConfirm');
    expect(calls).toEqual(['push', 'push', 'pop']);
    expect(overlays.top).toBe('historyNotice');
    expect(overlays.isOpen('resetConfirm')).toBe(false);
  });

  it('AD-13 open(id) on an open id throws and pushes nothing', async () => {
    const overlays = await load();
    overlays.open('historyNotice');
    expect(() => overlays.open('historyNotice')).toThrow(/^AD-13 open\(historyNotice\)/);
    expect(calls).toEqual(['push']);
    expect(overlays.depth).toBe(1);
  });

  it('AD-13 close(id) on a non-top entry throws, and on an empty stack', async () => {
    const overlays = await load();
    expect(() => overlays.close('historyNotice')).toThrow(/^AD-13 close\(historyNotice\)/);
    overlays.open('historyNotice');
    overlays.open('resetConfirm');
    expect(() => overlays.close('historyNotice')).toThrow(/^AD-13 close\(historyNotice\)/);
    expect(calls).toEqual(['push', 'push']);
    expect(overlays.depth).toBe(2);
  });

  it('AD-13 closedByBack(d) closes every entry deeper than d, topmost first, and never calls nav', async () => {
    const overlays = await load();
    overlays.open('historyNotice');
    overlays.open('resetConfirm');
    calls.length = 0;
    overlays.closedByBack(1);
    expect(overlays.top).toBe('historyNotice');
    expect(overlays.depth).toBe(1);
    overlays.closedByBack(1);
    expect(overlays.depth).toBe(1);
    overlays.closedByBack(0);
    expect(overlays.depth).toBe(0);
    expect(calls).toEqual([]);
  });

  it('AD-13 one closedByBack(0) with two entries open closes both and never calls nav', async () => {
    const overlays = await load();
    overlays.open('historyNotice');
    overlays.open('resetConfirm');
    calls.length = 0;
    overlays.closedByBack(0);
    expect(overlays.depth).toBe(0);
    expect(overlays.top).toBeUndefined();
    expect(calls).toEqual([]);
  });

  it('AD-13 resetForNewSession() with two entries open closes the top one first (nav.pop twice), leaving depth 0', async () => {
    const overlays = await load();
    overlays.open('historyNotice');
    overlays.open('resetConfirm');
    calls.length = 0;
    overlays.resetForNewSession();
    expect(topAtPop).toEqual(['historyNotice', undefined]);
    expect(calls).toEqual(['pop', 'pop']);
    expect(overlays.depth).toBe(0);
    overlays.resetForNewSession();
    expect(calls).toEqual(['pop', 'pop']);
  });
});

// Epic 4 CAP-5: tail selection, WordCell peek / sticky view / hover peek and the end sheet.
// Throws are matched with /^AD-13 / only; each throw case also asserts no state change, no nav.
describe('AD-13 overlays epic 4: selection, views and end sheet', () => {
  const AD13 = /^AD-13 /;

  it('AD-13 one entry per tail selection; re-select pushes none; deselect pops it and clears the selection', async () => {
    const overlays = await load();
    overlays.select(2, 3);
    expect(overlays.selection).toEqual({ column: 2, count: 3 });
    expect(overlays.isOpen('tailSelection')).toBe(true);
    expect(overlays.top).toBe('tailSelection');
    expect(calls).toEqual(['push']);
    overlays.select(2, 1);
    expect(overlays.selection).toEqual({ column: 2, count: 1 });
    expect(overlays.depth).toBe(1);
    expect(calls).toEqual(['push']);
    overlays.deselect();
    expect(overlays.selection).toBeNull();
    expect(overlays.isOpen('tailSelection')).toBe(false);
    expect(calls).toEqual(['push', 'pop']);
  });

  it('AD-13 deselect() with nothing selected is a no-op with no nav call', async () => {
    const overlays = await load();
    overlays.deselect();
    expect(calls).toEqual([]);
    expect(overlays.depth).toBe(0);
  });

  it('AD-13 back clears the selection without nav; close(tailSelection) clears it with one pop', async () => {
    const overlays = await load();
    overlays.select(4, 2);
    overlays.closedByBack(0);
    expect(overlays.selection).toBeNull();
    expect(overlays.depth).toBe(0);
    expect(calls).toEqual(['push']);
    overlays.select(4, 2);
    overlays.close('tailSelection');
    expect(overlays.selection).toBeNull();
    expect(calls).toEqual(['push', 'push', 'pop']);
  });

  it('AD-13 select throws for a bad column or count, before any change', async () => {
    const overlays = await load();
    for (const [column, count] of [
      [0, 1],
      [9, 1],
      [1.5, 1],
      [Number.NaN, 1],
      [2, 0],
      [2, -1],
      [2, 1.5],
    ] as const) {
      expect(() => overlays.select(column, count)).toThrow(AD13);
    }
    overlays.select(2, 2);
    expect(() => overlays.select(2, 0)).toThrow(AD13);
    expect(() => overlays.select(9, 2)).toThrow(AD13);
    expect(overlays.selection).toEqual({ column: 2, count: 2 });
    expect(calls).toEqual(['push']);
  });

  it('AD-13 select on a different column while a tail is selected throws, keeping the selection', async () => {
    const overlays = await load();
    overlays.select(2, 2);
    expect(() => overlays.select(3, 1)).toThrow(AD13);
    expect(overlays.selection).toEqual({ column: 2, count: 2 });
    expect(calls).toEqual(['push']);
  });

  it('AD-13 a first select throws while the stack is non-empty or a peek is open', async () => {
    const overlays = await load();
    overlays.open('historyNotice');
    expect(() => overlays.select(1, 1)).toThrow(AD13);
    overlays.close('historyNotice');
    overlays.openView(5);
    expect(() => overlays.select(1, 1)).toThrow(AD13);
    overlays.close('wordcellView');
    overlays.openPeek(5);
    expect(() => overlays.select(1, 1)).toThrow(AD13);
    overlays.closePeek();
    expect(overlays.selection).toBeNull();
    expect(calls).toEqual(['push', 'pop', 'push', 'pop']);
  });

  it('AD-13 a first select throws while the end sheet is expanded', async () => {
    const overlays = await load();
    overlays.openDeferred(overlays.deferEndSheetOpen());
    expect(() => overlays.select(1, 1)).toThrow(AD13);
    expect(overlays.selection).toBeNull();
    expect(calls).toEqual(['push']);
  });

  it('AD-13 re-select with a view stacked above replaces the selection with no push; deselect then throws until the view closes', async () => {
    const overlays = await load();
    overlays.select(2, 3);
    overlays.openView(6);
    expect(overlays.top).toBe('wordcellView');
    overlays.select(2, 1);
    expect(overlays.selection).toEqual({ column: 2, count: 1 });
    expect(calls).toEqual(['push', 'push']);
    expect(() => overlays.deselect()).toThrow(AD13);
    expect(overlays.selection).toEqual({ column: 2, count: 1 });
    expect(overlays.depth).toBe(2);
    expect(calls).toEqual(['push', 'push']);
    overlays.close('wordcellView');
    overlays.deselect();
    expect(overlays.selection).toBeNull();
    expect(calls).toEqual(['push', 'push', 'pop', 'pop']);
  });

  it('AD-13 a peek pushes no entry; closePeek clears it with no nav call', async () => {
    const overlays = await load();
    overlays.openPeek(3);
    expect(overlays.peek).toBe(3);
    expect(overlays.depth).toBe(0);
    overlays.closePeek();
    expect(overlays.peek).toBeNull();
    expect(calls).toEqual([]);
  });

  it('AD-13 a sticky view pushes one entry; close and closedByBack clear the view cell', async () => {
    const overlays = await load();
    overlays.openView(10);
    expect(overlays.viewCell).toBe(10);
    expect(overlays.isOpen('wordcellView')).toBe(true);
    expect(calls).toEqual(['push']);
    overlays.close('wordcellView');
    expect(overlays.viewCell).toBeNull();
    expect(overlays.isOpen('wordcellView')).toBe(false);
    expect(calls).toEqual(['push', 'pop']);
    overlays.openView(4);
    overlays.closedByBack(0);
    expect(overlays.viewCell).toBeNull();
    expect(overlays.depth).toBe(0);
    expect(calls).toEqual(['push', 'pop', 'push']);
  });

  it('AD-13 a peek turned sticky pushes one entry above a kept selection', async () => {
    const overlays = await load();
    overlays.select(1, 2);
    overlays.openPeek(7);
    overlays.peekToSticky();
    expect(overlays.peek).toBeNull();
    expect(overlays.viewCell).toBe(7);
    expect(overlays.top).toBe('wordcellView');
    expect(overlays.depth).toBe(2);
    expect(overlays.selection).toEqual({ column: 1, count: 2 });
    expect(calls).toEqual(['push', 'push']);
  });

  it('AD-13 a hover peek pushes no entry; openPeek and openView close it; closeHoverPeek with none open is a no-op', async () => {
    const overlays = await load();
    overlays.openHoverPeek(8);
    expect(overlays.hoverPeek).toBe(8);
    overlays.openPeek(8);
    expect(overlays.hoverPeek).toBeNull();
    overlays.closePeek();
    overlays.openHoverPeek(9);
    overlays.openView(9);
    expect(overlays.hoverPeek).toBeNull();
    overlays.close('wordcellView');
    overlays.openHoverPeek(3);
    overlays.closeHoverPeek();
    expect(overlays.hoverPeek).toBeNull();
    overlays.closeHoverPeek();
    expect(overlays.hoverPeek).toBeNull();
    expect(calls).toEqual(['push', 'pop']);
  });

  it('AD-13 openPeek → openHoverPeek (no-op) → peekToSticky → hoverPeek null', async () => {
    const overlays = await load();
    overlays.openPeek(5);
    overlays.openHoverPeek(6);
    expect(overlays.hoverPeek).toBeNull();
    overlays.peekToSticky();
    expect(overlays.hoverPeek).toBeNull();
    expect(overlays.viewCell).toBe(5);
    expect(calls).toEqual(['push']);
  });

  it('AD-13 openHoverPeek while a view is open, or under historyNotice, resetConfirm or the expanded end sheet, is a no-op', async () => {
    const overlays = await load();
    overlays.openView(4);
    overlays.openHoverPeek(5);
    expect(overlays.hoverPeek).toBeNull();
    overlays.close('wordcellView');
    overlays.open('historyNotice');
    overlays.openHoverPeek(5);
    expect(overlays.hoverPeek).toBeNull();
    overlays.open('resetConfirm');
    overlays.openHoverPeek(5);
    expect(overlays.hoverPeek).toBeNull();
    overlays.resetForNewSession();
    overlays.openDeferred(overlays.deferEndSheetOpen());
    overlays.openHoverPeek(5);
    expect(overlays.hoverPeek).toBeNull();
    expect(calls).toEqual(['push', 'pop', 'push', 'push', 'pop', 'pop', 'push']);
  });

  it('AD-13 openHoverPeek throws for a bad cell even while a peek is open, and while a hover peek is open', async () => {
    const overlays = await load();
    overlays.openPeek(5);
    expect(() => overlays.openHoverPeek(2)).toThrow(AD13);
    overlays.closePeek();
    expect(() => overlays.openHoverPeek(11)).toThrow(AD13);
    expect(() => overlays.openHoverPeek(4.5)).toThrow(AD13);
    overlays.openHoverPeek(4);
    expect(() => overlays.openHoverPeek(5)).toThrow(AD13);
    expect(overlays.hoverPeek).toBe(4);
    expect(calls).toEqual([]);
  });

  it('AD-13 openView, openPeek and peekToSticky throw for a bad cell or under a modal top entry, before any change', async () => {
    const overlays = await load();
    for (const cell of [2, 11, 3.5, Number.NaN]) {
      expect(() => overlays.openView(cell)).toThrow(AD13);
      expect(() => overlays.openPeek(cell)).toThrow(AD13);
    }
    overlays.openHoverPeek(4);
    overlays.open('historyNotice');
    expect(() => overlays.openView(4)).toThrow(AD13);
    expect(() => overlays.openPeek(4)).toThrow(AD13);
    overlays.open('resetConfirm');
    expect(() => overlays.openView(4)).toThrow(AD13);
    expect(() => overlays.openPeek(4)).toThrow(AD13);
    overlays.close('resetConfirm');
    overlays.close('historyNotice');
    expect(overlays.hoverPeek).toBe(4);
    overlays.closeHoverPeek();
    overlays.openPeek(6);
    overlays.open('historyNotice');
    expect(() => overlays.peekToSticky()).toThrow(AD13);
    expect(overlays.peek).toBe(6);
    expect(overlays.viewCell).toBeNull();
    expect(calls).toEqual(['push', 'push', 'pop', 'pop', 'push']);
  });

  it('AD-13 openView and openPeek throw under the expanded end sheet', async () => {
    const overlays = await load();
    overlays.openDeferred(overlays.deferEndSheetOpen());
    expect(() => overlays.openView(4)).toThrow(AD13);
    expect(() => overlays.openPeek(4)).toThrow(AD13);
    expect(overlays.viewCell).toBeNull();
    expect(overlays.peek).toBeNull();
    expect(calls).toEqual(['push']);
  });

  it('AD-13 openView throws while a peek or the view is open; openPeek throws while a peek or the view is open', async () => {
    const overlays = await load();
    overlays.openPeek(5);
    expect(() => overlays.openView(6)).toThrow(AD13);
    expect(() => overlays.openPeek(6)).toThrow(AD13);
    expect(overlays.peek).toBe(5);
    overlays.peekToSticky();
    expect(() => overlays.openView(6)).toThrow(AD13);
    expect(() => overlays.openPeek(6)).toThrow(AD13);
    expect(overlays.viewCell).toBe(5);
    expect(overlays.peek).toBeNull();
    expect(calls).toEqual(['push']);
  });

  it('AD-13 closePeek and peekToSticky with no peek open throw', async () => {
    const overlays = await load();
    expect(() => overlays.closePeek()).toThrow(AD13);
    expect(() => overlays.peekToSticky()).toThrow(AD13);
    expect(overlays.depth).toBe(0);
    expect(calls).toEqual([]);
  });

  it('AD-13 generic open() throws for tailSelection, wordcellView and endSheet', async () => {
    const overlays = await load();
    for (const id of ['tailSelection', 'wordcellView', 'endSheet'] as const) {
      expect(() => overlays.open(id)).toThrow(AD13);
    }
    expect(overlays.depth).toBe(0);
    expect(calls).toEqual([]);
  });

  it('AD-13 back to an intermediate depth: closedByBack(1) clears the view cell and keeps the selection; closedByBack(0) clears the selection; peek and hover peek untouched', async () => {
    const overlays = await load();
    overlays.select(3, 2);
    overlays.openView(8);
    calls.length = 0;
    overlays.closedByBack(1);
    expect(overlays.viewCell).toBeNull();
    expect(overlays.selection).toEqual({ column: 3, count: 2 });
    expect(overlays.top).toBe('tailSelection');
    overlays.closedByBack(0);
    expect(overlays.selection).toBeNull();
    expect(overlays.depth).toBe(0);
    expect(calls).toEqual([]);
  });

  it('AD-13 closedByBack leaves the peek and the hover peek unchanged', async () => {
    const overlays = await load();
    overlays.openHoverPeek(9);
    overlays.select(1, 1);
    overlays.closedByBack(0);
    expect(overlays.hoverPeek).toBe(9);
    overlays.closeHoverPeek();
    overlays.select(1, 1);
    overlays.deselect();
    overlays.openPeek(4);
    overlays.open('historyNotice');
    overlays.closedByBack(0);
    expect(overlays.peek).toBe(4);
  });

  it('AD-13 end sheet: hidden → deferred open expanded (push) → collapseEndSheet collapsed (pop) → expandEndSheet (push); isOpen(endSheet) ⇔ expanded', async () => {
    const overlays = await load();
    expect(overlays.endSheet).toBe('hidden');
    expect(overlays.isOpen('endSheet')).toBe(false);
    overlays.openDeferred(overlays.deferEndSheetOpen());
    expect(overlays.endSheet).toBe('expanded');
    expect(overlays.isOpen('endSheet')).toBe(true);
    expect(overlays.top).toBe('endSheet');
    overlays.collapseEndSheet();
    expect(overlays.endSheet).toBe('collapsed');
    expect(overlays.isOpen('endSheet')).toBe(false);
    overlays.expandEndSheet();
    expect(overlays.endSheet).toBe('expanded');
    expect(overlays.isOpen('endSheet')).toBe(true);
    expect(calls).toEqual(['push', 'pop', 'push']);
  });

  it('AD-13 closedByBack on the end sheet collapses it, never hides it, and calls no nav; direct close(endSheet) collapses with one pop', async () => {
    const overlays = await load();
    overlays.openDeferred(overlays.deferEndSheetOpen());
    overlays.closedByBack(0);
    expect(overlays.endSheet).toBe('collapsed');
    expect(overlays.depth).toBe(0);
    expect(calls).toEqual(['push']);
    overlays.expandEndSheet();
    overlays.close('endSheet');
    expect(overlays.endSheet).toBe('collapsed');
    expect(calls).toEqual(['push', 'push', 'pop']);
  });

  it('AD-13 expandEndSheet throws unless collapsed with the stack empty; collapseEndSheet throws unless expanded on top', async () => {
    const overlays = await load();
    expect(() => overlays.expandEndSheet()).toThrow(AD13);
    expect(() => overlays.collapseEndSheet()).toThrow(AD13);
    overlays.openDeferred(overlays.deferEndSheetOpen());
    expect(() => overlays.expandEndSheet()).toThrow(AD13);
    overlays.collapseEndSheet();
    expect(() => overlays.collapseEndSheet()).toThrow(AD13);
    overlays.select(2, 1);
    expect(() => overlays.expandEndSheet()).toThrow(AD13);
    expect(overlays.endSheet).toBe('collapsed');
    overlays.deselect();
    overlays.expandEndSheet();
    overlays.closedByBack(0);
    overlays.open('historyNotice');
    expect(() => overlays.expandEndSheet()).toThrow(AD13);
    expect(overlays.endSheet).toBe('collapsed');
    expect(calls).toEqual(['push', 'pop', 'push', 'pop', 'push', 'push']);
  });

  it('AD-13 collapseEndSheet throws when the expanded sheet is not the top entry', async () => {
    const overlays = await load();
    overlays.openDeferred(overlays.deferEndSheetOpen());
    overlays.open('historyNotice');
    expect(() => overlays.collapseEndSheet()).toThrow(AD13);
    expect(overlays.endSheet).toBe('expanded');
    expect(calls).toEqual(['push', 'push']);
  });

  it('AD-13 onUnfinished: expanded → one pop then hidden; collapsed → hidden, no nav; hidden → stays hidden, no nav', async () => {
    const overlays = await load();
    overlays.openDeferred(overlays.deferEndSheetOpen());
    overlays.onUnfinished();
    expect(overlays.endSheet).toBe('hidden');
    expect(overlays.depth).toBe(0);
    expect(calls).toEqual(['push', 'pop']);
    overlays.openDeferred(overlays.deferEndSheetOpen());
    overlays.collapseEndSheet();
    calls.length = 0;
    overlays.onUnfinished();
    expect(overlays.endSheet).toBe('hidden');
    overlays.onUnfinished();
    expect(overlays.endSheet).toBe('hidden');
    expect(calls).toEqual([]);
  });

  it('AD-13 unrecordedFinish: set by markFinishUnrecorded, kept through collapse and expand, cleared by onUnfinished from expanded or collapsed and by resetForNewSession', async () => {
    const overlays = await load();
    expect(overlays.unrecordedFinish).toBe(false);
    overlays.openDeferred(overlays.deferEndSheetOpen());
    overlays.markFinishUnrecorded();
    overlays.collapseEndSheet();
    overlays.expandEndSheet();
    expect(overlays.unrecordedFinish).toBe(true);
    overlays.onUnfinished();
    expect(overlays.unrecordedFinish).toBe(false);
    overlays.openDeferred(overlays.deferEndSheetOpen());
    overlays.markFinishUnrecorded();
    overlays.collapseEndSheet();
    overlays.onUnfinished();
    expect(overlays.unrecordedFinish).toBe(false);
    overlays.openDeferred(overlays.deferEndSheetOpen());
    overlays.markFinishUnrecorded();
    overlays.resetForNewSession();
    expect(overlays.unrecordedFinish).toBe(false);
  });

  it('AD-13 onUnfinished from expanded throws when the end sheet is not the top entry', async () => {
    const overlays = await load();
    overlays.openDeferred(overlays.deferEndSheetOpen());
    overlays.open('historyNotice');
    expect(() => overlays.onUnfinished()).toThrow(AD13);
    expect(overlays.endSheet).toBe('expanded');
    expect(overlays.depth).toBe(2);
    expect(calls).toEqual(['push', 'push']);
  });

  it('AD-13 deferred-open cancel: deferEndSheetOpen → onUnfinished → openDeferred(token) stays hidden with zero pushes', async () => {
    const overlays = await load();
    const token = overlays.deferEndSheetOpen();
    overlays.onUnfinished();
    overlays.openDeferred(token);
    expect(overlays.endSheet).toBe('hidden');
    expect(calls).toEqual([]);
  });

  it('AD-13 deferred-open cancel: deferEndSheetOpen → cancelEndSheetOpen → openDeferred(token) stays hidden with zero pushes; cancel with none live is a no-op', async () => {
    const overlays = await load();
    overlays.cancelEndSheetOpen();
    const token = overlays.deferEndSheetOpen();
    overlays.cancelEndSheetOpen();
    overlays.openDeferred(token);
    overlays.cancelEndSheetOpen();
    expect(overlays.endSheet).toBe('hidden');
    expect(calls).toEqual([]);
  });

  it('AD-13 openDeferred without a view pushes one entry; with a view on top pops the view, then pushes the sheet', async () => {
    const overlays = await load();
    overlays.openDeferred(overlays.deferEndSheetOpen());
    expect(calls).toEqual(['push']);
    expect(overlays.depth).toBe(1);
    overlays.resetForNewSession();
    calls.length = 0;
    topAtPop.length = 0;
    overlays.openView(7);
    const token = overlays.deferEndSheetOpen();
    overlays.openDeferred(token);
    expect(calls).toEqual(['push', 'pop', 'push']);
    expect(topAtPop).toEqual([undefined]);
    expect(overlays.viewCell).toBeNull();
    expect(overlays.endSheet).toBe('expanded');
    expect(overlays.depth).toBe(1);
    expect(overlays.top).toBe('endSheet');
  });

  it('AD-13 openDeferred clears an open hover peek with no extra nav call', async () => {
    const overlays = await load();
    overlays.openHoverPeek(3);
    overlays.openDeferred(overlays.deferEndSheetOpen());
    expect(overlays.hoverPeek).toBeNull();
    expect(calls).toEqual(['push']);
  });

  it('AD-13 a consumed, superseded or never-issued token is a no-op; the superseding token opens', async () => {
    const overlays = await load();
    const t1 = overlays.deferEndSheetOpen();
    const t2 = overlays.deferEndSheetOpen();
    overlays.openDeferred(t1);
    overlays.openDeferred(t2 + 1000);
    expect(overlays.endSheet).toBe('hidden');
    expect(calls).toEqual([]);
    overlays.openDeferred(t2);
    expect(overlays.endSheet).toBe('expanded');
    overlays.openDeferred(t2);
    expect(overlays.depth).toBe(1);
    expect(calls).toEqual(['push']);
  });

  it('AD-13 a superseded token is a no-op, not a throw, while a peek or a selection is open', async () => {
    const overlays = await load();
    const t1 = overlays.deferEndSheetOpen();
    overlays.deferEndSheetOpen();
    overlays.openPeek(5);
    expect(() => overlays.openDeferred(t1)).not.toThrow();
    expect(overlays.endSheet).toBe('hidden');
    expect(calls).toEqual([]);
    overlays.closePeek();
    overlays.select(1, 1);
    calls.length = 0;
    expect(() => overlays.openDeferred(t1)).not.toThrow();
    expect(overlays.endSheet).toBe('hidden');
    expect(calls).toEqual([]);
  });

  it('AD-13 deferEndSheetOpen throws unless the sheet is hidden', async () => {
    const overlays = await load();
    overlays.openDeferred(overlays.deferEndSheetOpen());
    expect(() => overlays.deferEndSheetOpen()).toThrow(AD13);
    overlays.collapseEndSheet();
    expect(() => overlays.deferEndSheetOpen()).toThrow(AD13);
    expect(calls).toEqual(['push', 'pop']);
  });

  it('AD-13 openDeferred(live) throws while a peek is open, or with a non-top view or other entry, leaving the token live', async () => {
    const overlays = await load();
    // peek open
    const token = overlays.deferEndSheetOpen();
    overlays.openPeek(5);
    expect(() => overlays.openDeferred(token)).toThrow(AD13);
    overlays.closePeek();
    // view not the top entry: the selection is below it, so the stack is not empty after closing it
    overlays.select(1, 1);
    overlays.openView(6);
    expect(() => overlays.openDeferred(token)).toThrow(AD13);
    expect(overlays.viewCell).toBe(6);
    overlays.close('wordcellView');
    // another entry (the selection) open
    overlays.openHoverPeek(4);
    expect(() => overlays.openDeferred(token)).toThrow(AD13);
    expect(overlays.hoverPeek).toBe(4);
    overlays.deselect();
    // a modal on top of a view: the stack is [wordcellView, historyNotice], the view not on top
    overlays.openView(6);
    overlays.open('historyNotice');
    expect(calls).toEqual(['push', 'push', 'pop', 'pop', 'push', 'push']);
    expect(() => overlays.openDeferred(token)).toThrow(AD13);
    expect(overlays.viewCell).toBe(6);
    expect(overlays.depth).toBe(2);
    expect(overlays.top).toBe('historyNotice');
    expect(overlays.endSheet).toBe('hidden');
    expect(calls).toEqual(['push', 'push', 'pop', 'pop', 'push', 'push']);
    overlays.close('historyNotice');
    overlays.close('wordcellView');
    // the token is still live
    overlays.openDeferred(token);
    expect(overlays.endSheet).toBe('expanded');
    expect(calls).toEqual(['push', 'push', 'pop', 'pop', 'push', 'push', 'pop', 'pop', 'push']);
  });

  it('AD-13 resetForNewSession from a selection plus a sticky view and a live token pops top-down, hides the sheet and clears all; the old token stays dead, a fresh one opens', async () => {
    const overlays = await load();
    overlays.select(2, 2);
    overlays.openView(9);
    const old = overlays.deferEndSheetOpen();
    calls.length = 0;
    overlays.resetForNewSession();
    expect(calls).toEqual(['pop', 'pop']);
    expect(topAtPop).toEqual(['tailSelection', undefined]);
    expect(overlays.depth).toBe(0);
    expect(overlays.selection).toBeNull();
    expect(overlays.viewCell).toBeNull();
    expect(overlays.endSheet).toBe('hidden');
    overlays.openDeferred(old);
    expect(overlays.endSheet).toBe('hidden');
    expect(calls).toEqual(['pop', 'pop']);
    overlays.openDeferred(overlays.deferEndSheetOpen());
    expect(overlays.endSheet).toBe('expanded');
    expect(calls).toEqual(['pop', 'pop', 'push']);
  });

  it('AD-13 resetForNewSession clears the peek and the hover peek, and closes an expanded or collapsed sheet to hidden', async () => {
    const overlays = await load();
    overlays.openPeek(4);
    overlays.resetForNewSession();
    expect(overlays.peek).toBeNull();
    overlays.openHoverPeek(5);
    overlays.resetForNewSession();
    expect(overlays.hoverPeek).toBeNull();
    overlays.openDeferred(overlays.deferEndSheetOpen());
    overlays.resetForNewSession();
    expect(overlays.endSheet).toBe('hidden');
    overlays.openDeferred(overlays.deferEndSheetOpen());
    overlays.collapseEndSheet();
    overlays.resetForNewSession();
    expect(overlays.endSheet).toBe('hidden');
    expect(calls).toEqual(['push', 'pop', 'push', 'pop']);
  });

  it('AD-13 re-select while a peek is open replaces the selection with no nav call', async () => {
    const overlays = await load();
    overlays.select(2, 2);
    overlays.openPeek(5);
    overlays.select(2, 1);
    expect(overlays.selection).toEqual({ column: 2, count: 1 });
    expect(calls).toEqual(['push']);
  });

  it('AD-13 peekToSticky throws under resetConfirm or the expanded end sheet, before any change', async () => {
    const overlays = await load();
    overlays.openPeek(6);
    overlays.open('historyNotice');
    overlays.open('resetConfirm');
    calls.length = 0;
    expect(() => overlays.peekToSticky()).toThrow(AD13);
    expect(overlays.peek).toBe(6);
    expect(overlays.viewCell).toBeNull();
    expect(overlays.depth).toBe(2);
    expect(calls).toEqual([]);
    overlays.resetForNewSession();
    // The peek first, then the sheet: openDeferred throws while a peek is open, so expand a
    // collapsed sheet.
    overlays.openDeferred(overlays.deferEndSheetOpen());
    overlays.collapseEndSheet();
    overlays.openPeek(7);
    overlays.expandEndSheet();
    calls.length = 0;
    expect(() => overlays.peekToSticky()).toThrow(AD13);
    expect(overlays.peek).toBe(7);
    expect(overlays.viewCell).toBeNull();
    expect(overlays.top).toBe('endSheet');
    expect(overlays.depth).toBe(1);
    expect(calls).toEqual([]);
  });

  it('AD-13 closedByBack(0) collapses an expanded end sheet under another entry, with no nav call', async () => {
    const overlays = await load();
    overlays.openDeferred(overlays.deferEndSheetOpen());
    overlays.open('historyNotice');
    calls.length = 0;
    overlays.closedByBack(0);
    expect(overlays.depth).toBe(0);
    expect(overlays.endSheet).toBe('collapsed');
    expect(calls).toEqual([]);
  });

  it('AD-13 resetForNewSession with the expanded sheet under historyNotice pops top-down and hides the sheet', async () => {
    const overlays = await load();
    overlays.openDeferred(overlays.deferEndSheetOpen());
    overlays.open('historyNotice');
    calls.length = 0;
    overlays.resetForNewSession();
    expect(calls).toEqual(['pop', 'pop']);
    expect(topAtPop).toEqual(['endSheet', undefined]);
    expect(overlays.endSheet).toBe('hidden');
  });

  it('AD-13 openHoverPeek throws for a bad cell under a modal top entry', async () => {
    const overlays = await load();
    overlays.open('historyNotice');
    expect(() => overlays.openHoverPeek(2)).toThrow(AD13);
    expect(overlays.hoverPeek).toBeNull();
  });
});

// Epic 5 SPEC CAP-4, F1: the tile selection beside the tail selection, with no history entry.
describe('AD-13 overlays epic 5: tile selection', () => {
  it('AD-13 selectTile sets the tile selection and clearTile clears it, with no nav call and no entry', async () => {
    const overlays = await load();
    expect(overlays.tileSelection).toBeNull();
    overlays.selectTile(0);
    expect(overlays.tileSelection).toBe(0);
    expect(overlays.depth).toBe(0);
    overlays.clearTile();
    expect(overlays.tileSelection).toBeNull();
    overlays.clearTile();
    expect(overlays.tileSelection).toBeNull();
    overlays.selectTile(51);
    expect(overlays.tileSelection).toBe(51);
    expect(overlays.depth).toBe(0);
    expect(calls).toEqual([]);
  });

  it('AD-13 back ignores the tile selection: closedByBack(0) keeps it and calls no nav', async () => {
    const overlays = await load();
    overlays.selectTile(7);
    overlays.closedByBack(0);
    expect(overlays.tileSelection).toBe(7);
    expect(calls).toEqual([]);
  });

  it('AD-13 resetForNewSession clears the tile selection', async () => {
    const overlays = await load();
    overlays.selectTile(12);
    overlays.resetForNewSession();
    expect(overlays.tileSelection).toBeNull();
    expect(calls).toEqual([]);
  });

  it('AD-13 selectTile throws for a card outside 0–51, while a tile is selected and while a tail is selected, changing nothing', async () => {
    const overlays = await load();
    for (const bad of [-1, 52, 1.5, Number.NaN]) {
      expect(() => overlays.selectTile(bad)).toThrow(/^AD-13 selectTile\(.*\): card out of range/);
    }
    expect(overlays.tileSelection).toBeNull();
    overlays.selectTile(3);
    expect(() => overlays.selectTile(4)).toThrow(/^AD-13 selectTile\(4\) while tile 3 is selected/);
    expect(overlays.tileSelection).toBe(3);
    overlays.clearTile();
    overlays.select(1, 2);
    expect(() => overlays.selectTile(4)).toThrow(/^AD-13 selectTile\(4\) while a tail is selected/);
    expect(overlays.tileSelection).toBeNull();
    expect(calls).toEqual(['push']);
  });
});

// Epic 10 entry 4 (AD-13 celebration bullet, AD-19): the `celebration` entry, its start and its
// removal reasons. The removal callback here is a recording stub; the controller wiring is in
// celebration/attached.test.ts.
describe('AD-13 overlays celebration entry', () => {
  async function loadWith() {
    const overlays = await load();
    const reasons: string[] = [];
    overlays.onCelebrationRemoved((reason) => reasons.push(reason));
    return { overlays, reasons };
  }

  function snapshot(overlays: Awaited<ReturnType<typeof load>>) {
    return {
      depth: overlays.depth,
      top: overlays.top,
      endSheet: overlays.endSheet,
      peek: overlays.peek,
      viewCell: overlays.viewCell,
      hoverPeek: overlays.hoverPeek,
      selection: overlays.selection,
    };
  }

  it('AD-13 a legal start on an empty stack pushes one entry and clears the hover peek', async () => {
    const { overlays, reasons } = await loadWith();
    overlays.openHoverPeek(4);
    overlays.startCelebration();
    expect(calls).toEqual(['push']);
    expect(overlays.top).toBe('celebration');
    expect(overlays.depth).toBe(1);
    expect(overlays.hoverPeek).toBeNull();
    expect(overlays.endSheet).toBe('hidden');
    expect(reasons).toEqual([]);
  });

  it('AD-13 a legal start with a sticky view on top pops the view, then pushes once', async () => {
    const { overlays, reasons } = await loadWith();
    overlays.openView(5);
    calls.length = 0;
    overlays.startCelebration();
    expect(calls).toEqual(['pop', 'push']);
    expect(overlays.viewCell).toBeNull();
    expect(overlays.top).toBe('celebration');
    expect(overlays.depth).toBe(1);
    expect(reasons).toEqual([]);
  });

  type Overlays = Awaited<ReturnType<typeof load>>;
  const ILLEGAL: readonly [string, (o: Overlays) => void][] = [
    ['a peek', (o) => o.openPeek(3)],
    ['historyNotice', (o) => o.open('historyNotice')],
    ['menu', (o) => o.open('menu')],
    [
      'a tail selection',
      (o) => {
        o.select(2, 1);
        o.openHoverPeek(6);
      },
    ],
    ['the expanded end sheet', (o) => o.openDeferred(o.deferEndSheetOpen())],
    [
      'the collapsed end sheet',
      (o) => {
        o.openDeferred(o.deferEndSheetOpen());
        o.collapseEndSheet();
        o.openHoverPeek(6);
      },
    ],
    ['celebration itself', (o) => o.startCelebration()],
    [
      'a view over a tail selection',
      (o) => {
        o.select(2, 1);
        o.openView(4);
      },
    ],
    [
      'a view over the collapsed end sheet',
      (o) => {
        o.openDeferred(o.deferEndSheetOpen());
        o.collapseEndSheet();
        o.openView(4);
      },
    ],
  ];

  for (const [name, arrange] of ILLEGAL) {
    it(`AD-13 startCelebration with ${name} throws with no state or nav change`, async () => {
      const { overlays, reasons } = await loadWith();
      arrange(overlays);
      const before = snapshot(overlays);
      calls.length = 0;
      expect(() => overlays.startCelebration()).toThrow(/^AD-13 startCelebration /);
      expect(snapshot(overlays)).toEqual(before);
      expect(calls).toEqual([]);
      expect(reasons).toEqual([]);
    });
  }

  it('AD-13 on a fresh module startCelebration with no callback registered throws with no push, also with a view on top', async () => {
    const overlays = await load();
    expect(() => overlays.startCelebration()).toThrow(
      /^AD-13 startCelebration with no removal callback/,
    );
    expect(overlays.depth).toBe(0);
    overlays.openView(4);
    calls.length = 0;
    expect(() => overlays.startCelebration()).toThrow(
      /^AD-13 startCelebration with no removal callback/,
    );
    expect(overlays.top).toBe('wordcellView');
    expect(overlays.viewCell).toBe(4);
    expect(calls).toEqual([]);
  });

  it('AD-13 after two registrations only the second callback runs', async () => {
    const overlays = await load();
    const first: string[] = [];
    const second: string[] = [];
    overlays.onCelebrationRemoved((reason) => first.push(reason));
    overlays.onCelebrationRemoved((reason) => second.push(reason));
    overlays.startCelebration();
    overlays.close('celebration');
    expect(first).toEqual([]);
    expect(second).toEqual(['ended']);
  });

  it('AD-13 open(celebration) throws: it has its own operation', async () => {
    const { overlays } = await loadWith();
    expect(() => overlays.open('celebration')).toThrow(/^AD-13 open\(celebration\)/);
    expect(overlays.depth).toBe(0);
    expect(calls).toEqual([]);
  });

  it('AD-13 close(celebration) is an end: one pop, the callback gets ended once', async () => {
    const { overlays, reasons } = await loadWith();
    overlays.startCelebration();
    calls.length = 0;
    overlays.close('celebration');
    expect(calls).toEqual(['pop']);
    expect(topAtPop).toEqual([undefined]);
    expect(reasons).toEqual(['ended']);
  });

  it('AD-13 closedByBack removing celebration is an end with no nav call', async () => {
    const { overlays, reasons } = await loadWith();
    overlays.startCelebration();
    calls.length = 0;
    overlays.closedByBack(0);
    expect(calls).toEqual([]);
    expect(overlays.depth).toBe(0);
    expect(reasons).toEqual(['ended']);
  });

  it('AD-13 onUnfinished with celebration open cancels the token first, then closes it as cancelled with one pop', async () => {
    const { overlays, reasons } = await loadWith();
    const token = overlays.deferEndSheetOpen();
    overlays.startCelebration();
    calls.length = 0;
    overlays.onUnfinished();
    expect(calls).toEqual(['pop']);
    expect(overlays.depth).toBe(0);
    expect(reasons).toEqual(['cancelled']);
    expect(overlays.openDeferred(token)).toBe(false);
    expect(overlays.endSheet).toBe('hidden');
  });

  it('AD-13 onUnfinished with celebration open but not the top entry throws close()’s AD-13 error, the token already dead', async () => {
    const { overlays, reasons } = await loadWith();
    const token = overlays.deferEndSheetOpen();
    overlays.startCelebration();
    overlays.open('historyNotice');
    calls.length = 0;
    expect(() => overlays.onUnfinished()).toThrow(
      /^AD-13 close\(celebration\) while the top is historyNotice/,
    );
    expect(calls).toEqual([]);
    expect(reasons).toEqual([]);
    expect(overlays.openDeferred(token)).toBe(false);
  });

  it('AD-13 resetForNewSession with celebration open closes it as cancelled with one pop and kills the token', async () => {
    const { overlays, reasons } = await loadWith();
    const token = overlays.deferEndSheetOpen();
    overlays.startCelebration();
    calls.length = 0;
    overlays.resetForNewSession();
    expect(calls).toEqual(['pop']);
    expect(reasons).toEqual(['cancelled']);
    expect(overlays.openDeferred(token)).toBe(false);
  });

  it('AD-13 with celebration on top openView and openPeek throw, openHoverPeek is a no-op, a deferred open throws', async () => {
    const { overlays } = await loadWith();
    const token = overlays.deferEndSheetOpen();
    overlays.startCelebration();
    calls.length = 0;
    expect(() => overlays.openView(4)).toThrow(/^AD-13 openView while celebration is the top/);
    expect(() => overlays.openPeek(4)).toThrow(/^AD-13 openPeek while celebration is the top/);
    overlays.openHoverPeek(4);
    expect(overlays.hoverPeek).toBeNull();
    expect(() => overlays.openDeferred(token)).toThrow(/^AD-13 openDeferred while celebration/);
    expect(() => overlays.open('menu')).toThrow(/^AD-13 open\(menu\) while celebration/);
    expect(calls).toEqual([]);
    expect(overlays.top).toBe('celebration');
  });

  it('AD-13 celebration is in SUSPENDING', async () => {
    vi.resetModules();
    const { SUSPENDING } = await import('./overlays.svelte');
    expect(SUSPENDING).toContain('celebration');
  });

  it('AD-13 overlays.svelte.ts imports nothing from ./celebration/', async () => {
    const { default: source } = await import('./overlays.svelte.ts?raw');
    expect(source).not.toMatch(/['"]\.\/celebration\//);
    expect(source).not.toMatch(/['"][^'"]*celebration\.svelte(\.ts)?['"]/);
  });
});
