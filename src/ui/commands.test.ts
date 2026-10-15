import { beforeEach, describe, expect, it, vi } from 'vitest';

// Epic 6 CAP-10 (6.10, F39): the shared dispatching commands close a sticky view and any peek
// before the dispatch and pop a tail selection, so `overlays.deselect()` never throws on them.
const mocks = vi.hoisted(() => ({ log: [] as string[] }));

vi.mock('../shell/nav', () => ({ nav: { push: () => {}, pop: () => {} } }));
vi.mock('svelte', () => ({ flushSync: () => mocks.log.push('flushSync') }));
vi.mock('../shell/game.svelte', () => ({
  game: {
    dispatch: (command: { type: string }) => {
      mocks.log.push(`dispatch ${command.type}`);
      return { ok: true };
    },
  },
}));
vi.mock('./flip', () => ({
  capture: () => mocks.log.push('capture'),
  play: (command: { type: string }) => mocks.log.push(`play ${command.type}`),
}));

type Overlays = typeof import('./overlays.svelte').overlays;
let overlays: Overlays;
let commands: typeof import('./commands');

beforeEach(async () => {
  vi.resetModules();
  mocks.log.length = 0;
  ({ overlays } = await import('./overlays.svelte'));
  commands = await import('./commands');
});

describe('AD-12 shared commands', () => {
  it('AD-12 each command captures, dispatches once and plays; Validate flushes between', () => {
    commands.undo();
    commands.redo();
    commands.confirm();
    commands.flip();
    commands.validate();
    expect(mocks.log).toEqual([
      'capture',
      'dispatch undo',
      'play undo',
      'capture',
      'dispatch redo',
      'play redo',
      'capture',
      'dispatch confirm',
      'play confirm',
      'capture',
      'dispatch flip',
      'play flip',
      'capture',
      'dispatch validate',
      'flushSync',
      'play validate',
    ]);
  });

  it('AD-12 F39: Undo and Redo with a sticky WordCell view open close the view first without throwing', () => {
    for (const run of [commands.undo, commands.redo]) {
      overlays.openView(4);
      expect(run).not.toThrow();
      expect(overlays.viewCell).toBeNull();
      expect(overlays.depth).toBe(0);
    }
  });

  it('AD-12 F39: Undo closes a long-press peek and a hover peek before the dispatch', () => {
    overlays.openPeek(5);
    commands.undo();
    expect(overlays.peek).toBeNull();
    overlays.openHoverPeek(6);
    commands.redo();
    expect(overlays.hoverPeek).toBeNull();
  });

  it('AD-12 F39: Undo with a tail selection pops its entry before the dispatch', () => {
    overlays.select(3, 2);
    commands.undo();
    expect(overlays.selection).toBeNull();
    expect(overlays.depth).toBe(0);
    expect(mocks.log.indexOf('dispatch undo')).toBeGreaterThan(-1);
  });

  it('AD-12 F39: Validate, Confirm and Flip close a sticky view, a peek and a hover peek before the dispatch', () => {
    for (const run of [commands.validate, commands.confirm, commands.flip]) {
      overlays.openView(4);
      mocks.log.length = 0;
      expect(run).not.toThrow();
      expect(overlays.viewCell).toBeNull();
      overlays.openPeek(5);
      run();
      expect(overlays.peek).toBeNull();
      overlays.openHoverPeek(6);
      run();
      expect(overlays.hoverPeek).toBeNull();
    }
  });

  it('AD-12 F39: Validate, Confirm and Flip pop a tail selection before the dispatch', () => {
    for (const run of [commands.validate, commands.confirm, commands.flip]) {
      overlays.select(3, 2);
      run();
      expect(overlays.selection).toBeNull();
      expect(overlays.depth).toBe(0);
    }
  });
});
