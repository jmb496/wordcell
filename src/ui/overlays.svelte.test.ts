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
