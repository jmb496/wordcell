import { describe, expect, it, vi } from 'vitest';
import type { Controller } from './gestures/controller';

vi.mock('../shell/nav', () => ({ nav: { push: () => {}, pop: () => {} } }));

// AD-12 act(): a fresh module per test (module-level controller, no reset export).
async function load() {
  vi.resetModules();
  const { overlays } = await import('./overlays.svelte');
  return { ...(await import('./act')), overlays };
}

function fakeController(log: string[]): Controller {
  return {
    cancel: () => log.push('cancel'),
    attach: () => () => {},
    refreshHover: () => {},
  };
}

describe('AD-12 act()', () => {
  it('AD-12 act() calls cancel() before the handler and forwards its arguments', async () => {
    const { act, setController } = await load();
    const log: string[] = [];
    setController(fakeController(log));
    const wrapped = act((a: number, b: string) => log.push(`handler ${a} ${b}`));
    wrapped(1, 'x');
    expect(log).toEqual(['cancel', 'handler 1 x']);
  });

  it('AD-12 act() before setController() throws on call and runs neither; wrapping does not throw', async () => {
    const { act } = await load();
    const handler = vi.fn();
    let wrapped: (() => void) | undefined;
    expect(() => {
      wrapped = act(handler);
    }).not.toThrow();
    expect(() => wrapped?.()).toThrow(/^AD-12 act\(\) before setController\(\)/);
    expect(handler).not.toHaveBeenCalled();
  });

  it('AD-12 a second setController() throws', async () => {
    const { setController } = await load();
    setController(fakeController([]));
    expect(() => setController(fakeController([]))).toThrow(
      /^AD-12 setController\(\) called twice/,
    );
  });

  // Epic 5 SPEC CAP-4 (F1): act() clears the tile selection after cancel(), before its handler.
  it('AD-4 act() runs cancel(), then clears the tile selection, then the handler; with none selected too', async () => {
    const { act, setController, overlays } = await load();
    const log: string[] = [];
    setController({
      cancel: () => log.push(`cancel ${overlays.tileSelection}`),
      attach: () => () => {},
      refreshHover: () => {},
    });
    const wrapped = act(() => log.push(`handler ${overlays.tileSelection}`));
    overlays.selectTile(12);
    wrapped();
    expect(log).toEqual(['cancel 12', 'handler null']);
    expect(overlays.tileSelection).toBeNull();
    log.length = 0;
    wrapped();
    expect(log).toEqual(['cancel null', 'handler null']);
  });
});
