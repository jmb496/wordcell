import { describe, expect, it, vi } from 'vitest';
import composeFixture from '../../../fixtures/how-to-play-compose.json';
import destinationFixture from '../../../fixtures/how-to-play-destination.json';
import fixture from '../../../fixtures/how-to-play-drag.json';
import { text } from '../text';
import { composeScene } from './compose';
import { destinationScene } from './destination';
import { dragScene } from './drag';
import { sceneEffects } from './effects';
import effectsSource from './effects.ts?raw';
import { RICH_SLOT } from './geometry';
import { type AnimationHandle, type PlayerDeps, restMs, ScenePlayer } from './player';
import playerSource from './player.ts?raw';
import source from './Scene.svelte?raw';
import { defineScene } from './script';

// Epic 8 ticket 1 (HP-1, HP-5, HP-6): the scene script, player and figure structure.
const mocked = vi.hoisted(() => ({ motion: { baseMs: 180, reduced: false } }));
vi.mock('../../shell/prefs.svelte', () => ({
  prefs: {
    get motion() {
      return mocked.motion;
    },
  },
}));
vi.mock('../../shell/nav', () => ({ nav: { push: () => undefined, pop: () => undefined } }));

const KINDS = ['snap', 'flyBack', 'parting', 'undoRedo', 'flyToCell', 'overlay'];

describe('AD-14 scene script against its fixture', () => {
  it('AD-14 the carried tail matches the fixture drop command: source, tail length, destination', () => {
    const command = fixture.commands[0];
    expect(command).toMatchObject({
      type: 'drop',
      sourceColumn: dragScene.carry.sourceColumn,
      sourceCount: dragScene.carry.count,
      destinationColumn: dragScene.carry.destinationColumn,
    });
    const columns = fixture.start.columns;
    expect(columns[command.sourceColumn - 1].slice(-command.sourceCount)).toStrictEqual([
      'E',
      'D',
      'K',
      'A',
    ]);
    expect(
      columns[command.destinationColumn - 1].slice(-dragScene.carry.destinationCount),
    ).toStrictEqual(['B']);
  });

  it('AD-14 every grab and drop step names a fixture drop command; step kinds are motion kinds', () => {
    const types = dragScene.steps.map((s) => s.type);
    expect(types).toStrictEqual(['grab', 'move', 'drop', 'fly']);
    for (const step of dragScene.steps) {
      expect(KINDS).toContain(step.kind);
      if (step.type === 'grab' || step.type === 'drop')
        expect(dragScene.fixture.commands[step.command ?? -1]?.type).toBe('drop');
    }
  });

  it('AD-14 the frames are start, lifted, over column 3, dropped with the tray open', () => {
    expect(dragScene.frames).toStrictEqual([
      { tail: 'home', tray: false },
      { tail: 'lifted', tray: false },
      { tail: 'over', tray: false },
      { tail: 'gone', tray: true },
    ]);
  });

  it('AD-14 the carried tail ends each step where the next begins, lands on its offset, then flies to the tray', () => {
    const effects = sceneEffects(dragScene);
    const tails = effects.flat().filter((e) => e.element === 'tail' && e.phase === 0);
    for (let i = 1; i < tails.length; i++)
      expect(tails[i].keyframes[0].transform).toBe(tails[i - 1].keyframes[1].transform);
    const { offset, layout } = dragScene;
    const dropAt = dragScene.steps.findIndex((s) => s.type === 'drop');
    const landed = effects[dropAt].find((e) => e.element === 'tail');
    expect(landed?.keyframes[1].transform).toBe(`translate(${offset.x}px, ${offset.y}px)`);
    const flown = effects.flat().filter((e) => e.element.startsWith('tail-'));
    expect(flown).toHaveLength(dragScene.carry.count);
    expect(new Set(flown.map((e) => e.keyframes[1].transform)).size).toBe(dragScene.carry.count);
    expect(layout.trayTail.y).toBeGreaterThan(layout.tailHome.y);
  });
});

// Epic 8 ticket 2 (HP-3b, HP-3c, HP-5, HP-6): scenes 2 and 3 against their fixtures.
describe.each([
  ['compose', composeScene, composeFixture, [0, 0, 1, 2, 3, 4]],
  ['destination', destinationScene, destinationFixture, [0, 1, 2, 3, 4]],
] as const)('AD-14 scene %s against its fixture', (name, scene, data, applied) => {
  it('AD-14 the indexes of the steps carrying a command cover the fixture commands in order', () => {
    const indexes = scene.steps.flatMap((s) => (s.command === undefined ? [] : [s.command]));
    expect([...new Set(indexes)]).toStrictEqual(data.commands.map((_, i) => i));
    expect(indexes).toStrictEqual([...indexes].sort((a, b) => a - b));
    expect(scene.id).toBe(data.scene);
    expect(scene.caption).toBe(text.howTo.scenes[name]);
  });

  it('AD-14 the carried tail matches the fixture drop command', () => {
    expect(data.commands[0]).toMatchObject({
      type: 'drop',
      sourceColumn: scene.carry.sourceColumn,
      sourceCount: scene.carry.count,
      destinationColumn: scene.carry.destinationColumn,
    });
  });

  it('AD-14 the drawn Validate is lit exactly where the fixture says it is validatable, pressed on the tap', () => {
    expect(scene.frames).toHaveLength(applied.length);
    scene.frames.forEach((frame, i) => {
      const entry = data.validatable.find((v) => v.after === applied[i]);
      expect(entry).toBeDefined();
      const pressed = data.commands[applied[i] - 1]?.type === 'validate';
      expect(frame.validate).toBe(pressed ? 'pressed' : entry?.canValidate ? 'lit' : 'off');
    });
  });

  it('AD-14 each open tray frame spells the fixture word (block, then the arranged cards)', () => {
    scene.frames.forEach((frame, i) => {
      expect(frame.tray).toBe(frame.order !== undefined);
      const word = data.words.find(
        (w) => w.command === applied[i] - 1 && frame.order !== undefined,
      );
      if (frame.order !== undefined && word !== undefined) {
        expect(frame.order.join('')).toBe(word.word);
      }
    });
    // Frames with no fixture word: the first tray order is the destination block then the carried
    // tail (R-30), and the pressed frame keeps the previous frame's order.
    const drop = data.commands[0] as { sourceColumn: number; sourceCount: number };
    const cols = data.start.columns as string[][];
    const first = [
      ...cols[scene.carry.destinationColumn - 1].slice(-scene.carry.destinationCount),
      ...cols[drop.sourceColumn - 1].slice(-drop.sourceCount),
    ].join('');
    const open = scene.frames.filter((f) => f.order !== undefined);
    expect(open[0].order?.join('')).toBe(first);
    scene.frames.forEach((frame, i) => {
      if (i > 0 && data.commands[applied[i] - 1]?.type === 'validate')
        expect(frame.order).toStrictEqual(scene.frames[i - 1].order);
    });
  });

  it('AD-14 the tray cards fly one RICH_SLOT apart and no tail effect follows the fly step', () => {
    const effects = sceneEffects(scene);
    const xs = effects
      .flat()
      .filter((e) => /^tail-\d+$/.test(e.element))
      .map((e) => Number(/translate\((-?[\d.]+)px/.exec(String(e.keyframes[1].transform))?.[1]));
    expect(xs).toHaveLength(scene.carry.count);
    for (let j = 1; j < xs.length; j++) expect(xs[j] - xs[j - 1]).toBe(RICH_SLOT);
    const fly = scene.steps.findIndex((s) => s.type === 'fly');
    for (const later of effects.slice(fly + 1))
      expect(later.some((e) => e.element === 'tail')).toBe(false);
  });

  it('AD-14 each frame k is the latest setDestinationCount applied and side is right exactly after a flip', () => {
    scene.frames.forEach((frame, i) => {
      const done = data.commands.slice(0, applied[i]);
      const counts = done.filter((c) => c.type === 'setDestinationCount') as { k: number }[];
      if (frame.order !== undefined)
        expect(frame.k).toBe(
          counts.length > 0 ? counts[counts.length - 1].k : scene.carry.destinationCount,
        );
      if (frame.order !== undefined)
        expect(frame.side === 'right').toBe(done.some((c) => c.type === 'flip'));
    });
  });

  it('AD-14 every animated element is declared and every step names a motion kind', () => {
    for (const effect of sceneEffects(scene).flat())
      expect(scene.elements).toContain(effect.element);
    for (const step of scene.steps) expect(KINDS).toContain(step.kind);
    for (const frame of scene.frames.filter((f) => f.tray))
      expect(scene.elements).toContain(`tray-${scene.frames.indexOf(frame)}`);
  });
});

describe('AD-14 scene compose frames', () => {
  it('AD-14 frames: start, lifted, BEDKA k 1 left, BAKED, BALKED with cell 6 used, Validate pressed', () => {
    expect(composeScene.frames.map((f) => [f.tail, f.order?.join(''), f.k, f.side])).toStrictEqual([
      ['home', undefined, undefined, undefined],
      ['lifted', undefined, undefined, undefined],
      ['gone', 'BEDKA', 1, 'left'],
      ['gone', 'BAKED', 1, 'left'],
      ['gone', 'BALKED', 1, 'left'],
      ['gone', 'BALKED', 1, 'left'],
    ]);
    expect(composeScene.frames.map((f) => f.cell6)).toStrictEqual([
      'top',
      'top',
      'top',
      'top',
      'used',
      'used',
    ]);
  });
});

describe('AD-14 scene destination frames', () => {
  it('AD-14 frames: start, APE, TAPE, STAPE with k 1 to 3 left, PEATS with k 3 right; no cell 6', () => {
    expect(
      destinationScene.frames.map((f) => [f.order?.join(''), f.k, f.side, f.cell6]),
    ).toStrictEqual([
      [undefined, undefined, undefined, undefined],
      ['APE', 1, 'left', undefined],
      ['TAPE', 2, 'left', undefined],
      ['STAPE', 3, 'left', undefined],
      ['PEATS', 3, 'right', undefined],
    ]);
  });
});

describe('AD-1 a step command must fit its step type', () => {
  it('AD-1 a move names an arrange, a tap one of the tap commands; a mismatch or a missing command throws', () => {
    const [grab, move, drop, fly, ...taps] = composeScene.steps;
    const redefine = (steps: typeof composeScene.steps) => defineScene({ ...composeScene, steps });
    expect(() => redefine([grab, move, drop, fly, ...taps])).not.toThrow();
    expect(() => redefine([grab, { ...move, command: 0 }])).toThrow(/step 1 \(move\)/);
    expect(() => redefine([grab, { ...move, command: 99 }])).toThrow(/step 1 \(move\)/);
    const tap = taps[1];
    expect(() => redefine([grab, { ...tap, command: 1 }])).toThrow(/step 1 \(tap\)/);
    expect(() => redefine([grab, { ...tap, command: 3 }])).not.toThrow();
    expect(() => redefine([grab, { ...fly, command: 0 }])).toThrow(/step 1 \(fly\)/);
    expect(() => redefine([{ ...grab, command: undefined }])).toThrow(/no fixture drop command/);
    expect(() => redefine([grab, { ...move, command: undefined }])).not.toThrow();
  });
});

describe('AD-1 a bad script throws at load', () => {
  it('AD-1 no steps, an unknown target, an unknown reveal element or a missing drop command throws', () => {
    expect(() => defineScene({ ...dragScene, steps: [] })).toThrow(/no steps/);
    const [grab, ...rest] = dragScene.steps;
    expect(() =>
      defineScene({ ...dragScene, steps: [{ ...grab, target: 'nowhere' }, ...rest] }),
    ).toThrow(/unknown target nowhere/);
    const drop = dragScene.steps[2];
    expect(() =>
      defineScene({
        ...dragScene,
        steps: [grab, { ...drop, reveal: { show: 'ghostly', hide: [], kind: 'overlay' } }],
      }),
    ).toThrow(/unknown element ghostly/);
    expect(() => defineScene({ ...dragScene, steps: [{ ...grab, command: 5 }] })).toThrow(
      /no fixture drop command/,
    );
    expect(() => defineScene({ ...dragScene, frames: [] })).toThrow(/no frames/);
  });
});

describe('AD-10 scene durations', () => {
  it('AD-10 the rest equals a duration() multiple, so Slow and Fast scale it', async () => {
    const { duration } = await import('../motion');
    for (const baseMs of [90, 180, 320]) {
      mocked.motion = { baseMs, reduced: false };
      const ms = restMs(dragScene, duration);
      expect(ms).toBe(duration(dragScene.rest.kind) * dragScene.rest.times);
      expect(ms % baseMs).toBe(0);
    }
    mocked.motion = { baseMs: 180, reduced: false };
  });
});

function fakes(initiallyHidden = false) {
  const animations: {
    id: string;
    element: string;
    ms: number;
    done: () => void;
    cancelled: boolean;
    paused: boolean;
  }[] = [];
  let hidden = initiallyHidden;
  let visible: (() => void) | undefined;
  const deps: PlayerDeps = {
    animate: (element, _keyframes, ms, id) => {
      let done!: () => void;
      let fail!: (e: unknown) => void;
      const finished = new Promise<unknown>((resolve, reject) => {
        done = () => resolve(undefined);
        fail = reject;
      });
      const record = { id, element, ms, done, cancelled: false, paused: false };
      animations.push(record);
      const handle: AnimationHandle = {
        finished,
        pause: () => {
          record.paused = true;
        },
        cancel: () => {
          record.cancelled = true;
          fail(new DOMException('cancelled', 'AbortError'));
        },
      };
      return handle;
    },
    duration: () => 100,
    hidden: () => hidden,
    whenVisible: () =>
      new Promise<void>((resolve) => {
        visible = () => {
          hidden = false;
          resolve();
        };
      }),
  };
  return { animations, deps, show: () => visible?.() };
}
const flush = async (): Promise<void> => {
  for (let i = 0; i < 10; i++) await Promise.resolve();
};

describe('AD-14 scene player', () => {
  it('AD-14 steps run in order, then the rest, then the loop starts again at step 1', async () => {
    const { animations, deps } = fakes();
    const player = new ScenePlayer(dragScene, deps, () => undefined);
    player.start();
    await flush();
    for (let guard = 0; guard < 8; guard++) {
      for (const a of animations) a.done();
      await flush();
    }
    const ids = animations.map((a) => a.id).filter((id, i, all) => id !== all[i - 1]);
    expect(ids.slice(0, 6)).toStrictEqual([
      'drag-step-0',
      'drag-step-1',
      'drag-step-2',
      'drag-step-3',
      'drag-rest',
      'drag-step-0',
    ]);
    player.destroy();
  });

  it('AD-14 a tap while playing pauses; a tap while paused restarts from step 1', async () => {
    const { animations, deps } = fakes();
    const states: string[] = [];
    const player = new ScenePlayer(dragScene, deps, (s) => states.push(s));
    player.start();
    await flush();
    animations[0].done();
    await flush();
    const before = animations.length;
    player.toggle();
    expect(player.state).toBe('paused');
    expect(
      animations
        .slice(0, before)
        .filter((a) => !a.cancelled)
        .every((a) => a.paused),
    ).toBe(true);
    player.toggle();
    await flush();
    expect(player.state).toBe('playing');
    expect(animations.slice(0, before).every((a) => a.cancelled)).toBe(true);
    expect(animations[before].id).toBe('drag-step-0');
    expect(states).toStrictEqual(['playing', 'paused', 'playing']);
    player.destroy();
    expect(animations.every((a) => a.cancelled)).toBe(true);
  });

  it('AD-9 a hidden page runs no step until visible again, then restarts at step 1, with no listener', async () => {
    const { animations, deps, show } = fakes(true);
    const player = new ScenePlayer(dragScene, deps, () => undefined);
    player.start();
    await flush();
    expect(animations).toHaveLength(0);
    show();
    await flush();
    expect(animations[0].id).toBe('drag-step-0');
    player.destroy();
    for (const file of [source, playerSource, effectsSource])
      expect(file).not.toMatch(/visibilitychange|pagehide|addEventListener/);
  });

  it('AD-9 a scene paused by a tap while hidden stays paused when the page turns visible', async () => {
    const f = fakes(true);
    const player = new ScenePlayer(dragScene, f.deps, () => undefined);
    player.start();
    await flush();
    player.toggle();
    expect(player.state).toBe('paused');
    f.show();
    await flush();
    expect(player.state).toBe('paused');
    expect(f.animations).toHaveLength(0);
    player.toggle();
    await flush();
    expect(player.state).toBe('playing');
    expect(f.animations[0].id).toBe('drag-step-0');
    player.destroy();
  });

  it('AD-9 a step finishing while the page went hidden stops at the next boundary', async () => {
    const f = fakes();
    const player = new ScenePlayer(dragScene, f.deps, () => undefined);
    player.start();
    await flush();
    const hidden = vi.spyOn(f.deps, 'hidden').mockReturnValue(true);
    f.animations[0].done();
    await flush();
    expect(f.animations.every((a) => a.cancelled || a.id === 'drag-step-0')).toBe(true);
    expect(f.animations.filter((a) => a.id === 'drag-step-1')).toHaveLength(0);
    hidden.mockRestore();
    player.destroy();
  });
});

describe('AD-3 scene figure structure', () => {
  async function html(reduced: boolean): Promise<string> {
    mocked.motion = { baseMs: 180, reduced };
    vi.resetModules();
    const { render } = await import('svelte/server');
    const { default: Scene } = await import('./Scene.svelte');
    return render(Scene, { props: { scene: dragScene } }).body;
  }

  it('AD-3 a figure named by its visible description, an aria-hidden stage, a tap button outside it', async () => {
    const body = await html(false);
    expect(body).toContain('<figure');
    expect(body).toMatch(/aria-labelledby="([^"]+)-caption"/);
    expect(body).toContain(`>${text.howTo.scenes.drag}</figcaption>`);
    const stage = body.slice(body.indexOf('class="stage'), body.indexOf('<button'));
    expect(body).toContain('aria-hidden="true"');
    expect(stage).toContain('data-scene-el="tail"');
    expect(body.slice(body.indexOf('<button'))).not.toContain('data-scene-el');
    expect(body).toContain(`aria-label="${text.howTo.sceneControls.pause}"`);
    expect(body).not.toContain('data-card-id');
    expect(body).not.toContain('data-testid');
    expect(body).not.toContain('data-mirror-of');
  });

  it.each([
    ['compose', composeScene, 4],
    ['destination', destinationScene, 4],
  ] as const)(
    'AD-3 scene %s: one tray layer per open frame, Validate and controls drawn, no ids',
    async (name, scene, layers) => {
      mocked.motion = { baseMs: 180, reduced: false };
      vi.resetModules();
      const { render } = await import('svelte/server');
      const { default: Scene } = await import('./Scene.svelte');
      const body = render(Scene, { props: { scene } }).body;
      expect(body).toContain(`>${text.howTo.scenes[name]}</figcaption>`);
      expect(body.match(/data-scene-el="tray-\d"/g)).toHaveLength(layers);
      expect(body).toContain(`>${text.validate}</span>`);
      expect(body).toContain(text.flip);
      expect(body).not.toContain('data-card-id');
      expect(body).not.toContain('data-testid');
      expect(body).not.toContain('data-mirror-of');
      expect(body.includes('class="cell6')).toBe(name === 'compose');
    },
  );

  it('AD-3 reduced motion shows frame 0 with Next and no tap button', async () => {
    const body = await html(true);
    expect(body).toContain(`>${text.howTo.sceneControls.next}</button>`);
    expect(body).not.toContain(text.howTo.sceneControls.pause);
    expect(body).not.toContain(text.howTo.sceneControls.replay);
    expect(body).not.toContain('visibility: hidden');
  });

  it('AD-12 every button handler of the scene is wrapped in act()', () => {
    const handlers = [...source.matchAll(/onclick=\{([^}]*)\}/g)].map((m) => m[1]);
    expect(handlers.length).toBeGreaterThanOrEqual(3);
    for (const handler of handlers) expect(handler).toMatch(/^act\(/);
  });
});
