import { describe, expect, it, vi } from 'vitest';
import type { Controller } from './gestures/controller';

// AD-12 act(): a fresh module per test (module-level controller, no reset export).
async function load() {
  vi.resetModules();
  return import('./act');
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
});
