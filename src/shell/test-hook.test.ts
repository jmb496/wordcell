import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// AD-17 Celebration seam (epic 10 entry 5): the test hook over a stubbed `window` (the unit
// environment is `node`, where Vitest's `import.meta.env.DEV` is true, so the gate installs it),
// driven by a stub seam. Fresh module per case (the seam is module state).
vi.mock('./game.svelte', () => ({ game: { loaded: () => null, current: () => null } }));
vi.mock('./dictionary.svelte', () => ({ dictionary: { state: 'ready' } }));

type Hook = NonNullable<Window['__wordcell']>;

function stubSeam(isRunning = false) {
  const calls: string[] = [];
  const state = { running: isRunning };
  return {
    calls,
    state,
    seam: {
      running: () => state.running,
      advance: (ms: number) => calls.push(`advance ${ms}`),
      setManual: (on: boolean) => calls.push(`setManual ${on}`),
      setEnabled: (on: boolean) => calls.push(`setEnabled ${on}`),
    },
  };
}

async function load(): Promise<{
  hook: Hook;
  registerCelebrationSeam: typeof import('./test-hook').registerCelebrationSeam;
}> {
  vi.resetModules();
  const win: { __wordcell?: Hook } = {};
  vi.stubGlobal('window', win);
  const { registerCelebrationSeam } = await import('./test-hook');
  const hook = win.__wordcell;
  if (hook === undefined) throw new Error('test hook not installed');
  return { hook, registerCelebrationSeam };
}

beforeEach(() => {
  expect(import.meta.env.DEV).toBe(true);
});
afterEach(() => vi.unstubAllGlobals());

describe('AD-17 celebration seam', () => {
  it('AD-17 the hook and its celebration object are frozen with the sorted keys', async () => {
    const { hook } = await load();
    expect(Object.isFrozen(hook)).toBe(true);
    expect(Reflect.ownKeys(hook).map(String).sort()).toEqual([
      'celebration',
      'current',
      'dictionaryState',
      'loaded',
    ]);
    expect(Object.isFrozen(hook.celebration)).toBe(true);
    expect(Reflect.ownKeys(hook.celebration).map(String).sort()).toEqual([
      'advance',
      'running',
      'setEnabled',
    ]);
  });

  it('AD-17 every celebration method throws before the seam is registered', async () => {
    const { hook } = await load();
    expect(() => hook.celebration.running()).toThrow(/^AD-17 /);
    expect(() => hook.celebration.advance(16)).toThrow(/^AD-17 /);
    expect(() => hook.celebration.setEnabled(true)).toThrow(/^AD-17 /);
  });

  it('AD-17 a second registerCelebrationSeam throws and keeps the first seam', async () => {
    const { hook, registerCelebrationSeam } = await load();
    const first = stubSeam();
    const second = stubSeam(true);
    registerCelebrationSeam(first.seam);
    expect(() => registerCelebrationSeam(second.seam)).toThrow(/^AD-17 /);
    expect(hook.celebration.running()).toBe(false);
  });

  it('AD-17 setEnabled throws while running and calls neither setter', async () => {
    const { hook, registerCelebrationSeam } = await load();
    const stub = stubSeam(true);
    registerCelebrationSeam(stub.seam);
    expect(() => hook.celebration.setEnabled(true)).toThrow(/^AD-17 /);
    expect(() => hook.celebration.setEnabled(false)).toThrow(/^AD-17 /);
    expect(stub.calls).toEqual([]);
  });

  it('AD-17 setEnabled while idle sets the flag, then the manual clock, to the same value', async () => {
    const { hook, registerCelebrationSeam } = await load();
    const stub = stubSeam();
    registerCelebrationSeam(stub.seam);
    hook.celebration.setEnabled(true);
    hook.celebration.setEnabled(false);
    expect(stub.calls).toEqual([
      'setEnabled true',
      'setManual true',
      'setEnabled false',
      'setManual false',
    ]);
  });

  it('AD-17 advance throws while not running and delegates while running', async () => {
    const { hook, registerCelebrationSeam } = await load();
    const stub = stubSeam();
    registerCelebrationSeam(stub.seam);
    expect(() => hook.celebration.advance(16)).toThrow(/^AD-17 /);
    expect(stub.calls).toEqual([]);
    stub.state.running = true;
    expect(hook.celebration.running()).toBe(true);
    hook.celebration.advance(3008);
    expect(stub.calls).toEqual(['advance 3008']);
  });
});
