import { describe, expect, it, vi } from 'vitest';
import freeLetterFixture from '../../../fixtures/how-to-play-free-letter.json';
import moveComposeFixture from '../../../fixtures/how-to-play-move-compose.json';
import placeFixture from '../../../fixtures/how-to-play-place.json';
import scoringFixture from '../../../fixtures/how-to-play-scoring.json';
import sourceDropFixture from '../../../fixtures/how-to-play-source-drop.json';
import { sceneStageHeight } from '../layout/geometry';
import { text } from '../text';
import { frameDest, ghostStart, sceneEffects, tuckEnd, tuckStart } from './effects';
import effectsSource from './effects.ts?raw';
import { freeLetterScene } from './free-letter';
import {
  CARD_H,
  CARD_W,
  CELLS_TOP,
  columnX,
  LIFT,
  MIN_COLUMN_CARDS,
  placeCellX,
  RICH_SLOT,
  STAGE_INPUTS,
  STRIP,
} from './geometry';
import { moveComposeScene } from './move-compose';
import { placeScene } from './place';
import { type AnimationHandle, type PlayerDeps, restMs, ScenePlayer } from './player';
import playerSource from './player.ts?raw';
import source from './Scene.svelte?raw';
import { scoringScene } from './scoring';
import { defineScene } from './script';
import { sourceDropScene } from './source-drop';
import { FILLER_LETTERS } from './stage';
import type { Scene } from './types';

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

const need = <T>(value: T | undefined): T => {
  if (value === undefined) throw new Error('missing scene geometry');
  return value;
};
const carryOf = (scene: Scene) => need(scene.carry);

// The fitted card width and stage height the carousel passes (ticket 6): 40 px is the base slot.
const FIT = { cardWidth: 40, stageHeight: sceneStageHeight(40, STAGE_INPUTS) };

const KINDS = ['snap', 'flyBack', 'parting', 'undoRedo', 'flyToCell', 'overlay'];

describe('AD-14 scene script against its fixture', () => {
  it('AD-14 the carried tail matches the fixture drop command: source, tail length, destination', () => {
    const command = moveComposeFixture.commands[0] as {
      sourceColumn: number;
      sourceCount: number;
      destinationColumn: number;
    };
    expect(command).toMatchObject({
      type: 'drop',
      sourceColumn: carryOf(moveComposeScene).sourceColumn,
      sourceCount: carryOf(moveComposeScene).count,
      destinationColumn: carryOf(moveComposeScene).destinationColumn,
    });
    const columns = moveComposeFixture.start.columns;
    expect(columns[command.sourceColumn - 1].slice(-command.sourceCount)).toStrictEqual([
      'K',
      'B',
      'A',
    ]);
    expect(
      columns[command.destinationColumn - 1].slice(-carryOf(moveComposeScene).destinationCount),
    ).toStrictEqual(['E']);
  });

  it('AD-14 every grab and drop step names a fixture drop command; step kinds are motion kinds', () => {
    const types = moveComposeScene.steps.map((s) => s.type);
    expect(types).toStrictEqual([
      'grab',
      'move',
      'drop',
      'fly',
      'tap',
      'tap',
      'tap',
      'tap',
      'arrange',
    ]);
    for (const step of moveComposeScene.steps) {
      expect(KINDS).toContain(step.kind);
      if (step.type === 'grab' || step.type === 'drop')
        expect(moveComposeScene.fixture.commands[step.command ?? -1]?.type).toBe('drop');
    }
  });

  it('AD-14 the carried tail ends each step where the next begins, lands on its offset, then flies to the tray', () => {
    const effects = sceneEffects(moveComposeScene);
    const tails = effects.flat().filter((e) => e.element === 'tail' && e.phase === 0);
    for (let i = 1; i < tails.length; i++)
      expect(tails[i].keyframes[0].transform).toBe(tails[i - 1].keyframes[1].transform);
    const offset = need(moveComposeScene.offset);
    const layout = need(moveComposeScene.layout);
    const dropAt = moveComposeScene.steps.findIndex((s) => s.type === 'drop');
    const landed = effects[dropAt].find((e) => e.element === 'tail');
    expect(landed?.keyframes[1].transform).toBe(`translate(${offset.x}px, ${offset.y}px)`);
    const flown = effects.flat().filter((e) => e.element.startsWith('tail-'));
    expect(flown).toHaveLength(carryOf(moveComposeScene).count);
    expect(new Set(flown.map((e) => e.keyframes[1].transform)).size).toBe(
      carryOf(moveComposeScene).count,
    );
    expect(layout.trayTail.y).toBeGreaterThan(layout.tailHome.y);
  });
});

// Epic 8 ticket 2 (HP-3b, HP-3c, HP-5, HP-6): scenes 2 and 3 against their fixtures.
describe.each([
  ['move-compose', moveComposeScene, moveComposeFixture, [0, 0, 1, 2, 3, 4, 5, 6]],
] as const)('AD-14 scene %s against its fixture', (_name, scene, data, applied) => {
  it('AD-14 the indexes of the steps carrying a command cover the fixture commands in order', () => {
    const indexes = scene.steps.flatMap((s) => (s.command === undefined ? [] : [s.command]));
    expect([...new Set(indexes)]).toStrictEqual(data.commands.map((_, i) => i));
    expect(indexes).toStrictEqual([...indexes].sort((a, b) => a - b));
    expect(scene.id).toBe(data.scene);
    expect(scene.caption).toBe(text.howTo.scenes.moveCompose);
  });

  it('AD-14 the carried tail matches the fixture drop command', () => {
    expect(data.commands[0]).toMatchObject({
      type: 'drop',
      sourceColumn: carryOf(scene).sourceColumn,
      sourceCount: carryOf(scene).count,
      destinationColumn: carryOf(scene).destinationColumn,
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
      ...cols[carryOf(scene).destinationColumn - 1].slice(-carryOf(scene).destinationCount),
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
    expect(xs).toHaveLength(carryOf(scene).count);
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
          counts.length > 0 ? counts[counts.length - 1].k : carryOf(scene).destinationCount,
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

describe('AD-14 scene move-compose and free-letter frames', () => {
  it('AD-14 move-compose frames: start, lifted, EKBA k 1, k 2, k 3, k 2, Flip, then arranged to BAKED', () => {
    expect(
      moveComposeScene.frames.map((f) => [f.tail, f.order?.join(''), f.k, f.side, f.cell6]),
    ).toStrictEqual([
      ['home', undefined, undefined, undefined, 'top'],
      ['lifted', undefined, undefined, undefined, 'top'],
      ['gone', 'EKBA', 1, 'left', 'top'],
      ['gone', 'DEKBA', 2, 'left', 'top'],
      ['gone', 'NDEKBA', 3, 'left', 'top'],
      ['gone', 'DEKBA', 2, 'left', 'top'],
      ['gone', 'KBAED', 2, 'right', 'top'],
      ['gone', 'BAKED', 2, 'right', 'top'],
    ]);
  });

  it('AD-14 free-letter frames: BAKED as scene 1 left it, BALKED with cell 6 used, Validate pressed', () => {
    expect(
      freeLetterScene.frames.map((f) => [f.order?.join(''), f.k, f.side, f.cell6, f.validate]),
    ).toStrictEqual([
      ['BAKED', 2, 'right', 'top', 'lit'],
      ['BALKED', 2, 'right', 'used', 'lit'],
      ['BALKED', 2, 'right', 'used', 'pressed'],
    ]);
  });
});

describe('AD-1 a step command must fit its step type', () => {
  it('AD-1 a move names an arrange, a tap one of the tap commands, an arrange step only an arrange; a mismatch or a missing command throws', () => {
    const [grab, move, drop, fly, plus, , , , arrange] = moveComposeScene.steps;
    const redefine = (steps: typeof moveComposeScene.steps) =>
      defineScene({ ...moveComposeScene, steps });
    expect(() => redefine([grab, move, drop, fly, plus, arrange])).not.toThrow();
    expect(() => redefine([grab, { ...move, command: 0 }])).toThrow(/step 1 \(move\)/);
    expect(() => redefine([grab, { ...move, command: 99 }])).toThrow(/step 1 \(move\)/);
    expect(() => redefine([grab, { ...move, command: 5 }])).not.toThrow();
    expect(() => redefine([grab, { ...plus, command: 5 }])).toThrow(/step 1 \(tap\)/);
    expect(() => redefine([grab, { ...plus, command: 3 }])).not.toThrow();
    expect(() => redefine([grab, { ...fly, command: 0 }])).toThrow(/step 1 \(fly\)/);
    expect(() => redefine([grab, { ...arrange, command: 4 }])).toThrow(/step 1 \(arrange\)/);
    expect(() => redefine([{ ...grab, command: undefined }])).toThrow(/no fixture drop command/);
    expect(() => redefine([grab, { ...move, command: undefined }])).not.toThrow();
  });
});

describe('AD-1 a bad script throws at load', () => {
  it('AD-1 no steps, an unknown target, an unknown reveal element or a missing drop command throws', () => {
    expect(() => defineScene({ ...moveComposeScene, steps: [] })).toThrow(/no steps/);
    const [grab, ...rest] = moveComposeScene.steps;
    expect(() =>
      defineScene({ ...moveComposeScene, steps: [{ ...grab, target: 'nowhere' }, ...rest] }),
    ).toThrow(/unknown target nowhere/);
    const drop = moveComposeScene.steps[2];
    expect(() =>
      defineScene({
        ...moveComposeScene,
        steps: [grab, { ...drop, reveal: { show: 'ghostly', hide: [], kind: 'overlay' } }],
      }),
    ).toThrow(/unknown element ghostly/);
    expect(() => defineScene({ ...moveComposeScene, steps: [{ ...grab, command: 5 }] })).toThrow(
      /no fixture drop command/,
    );
    expect(() => defineScene({ ...moveComposeScene, frames: [] })).toThrow(/no frames/);
  });
});

describe('AD-10 scene durations', () => {
  it('AD-10 the rest equals a duration() multiple, so Slow and Fast scale it', async () => {
    const { duration } = await import('../motion');
    for (const baseMs of [90, 180, 320]) {
      mocked.motion = { baseMs, reduced: false };
      const ms = restMs(moveComposeScene, duration);
      expect(ms).toBe(duration(moveComposeScene.rest.kind) * moveComposeScene.rest.times);
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
    easing: string | undefined;
    done: () => void;
    cancelled: boolean;
    paused: boolean;
  }[] = [];
  let hidden = initiallyHidden;
  let visible: (() => void) | undefined;
  const deps: PlayerDeps = {
    animate: (element, _keyframes, ms, id, easing) => {
      let done!: () => void;
      let fail!: (e: unknown) => void;
      const finished = new Promise<unknown>((resolve, reject) => {
        done = () => resolve(undefined);
        fail = reject;
      });
      const record = { id, element, ms, easing, done, cancelled: false, paused: false };
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
  it('AD-14 the player forwards each effect easing to animate: every tuck-k flight is linear', async () => {
    const { animations, deps } = fakes();
    const player = new ScenePlayer(placeScene, deps, () => undefined);
    player.start();
    await flush();
    for (let guard = 0; guard < 80; guard++) {
      for (const a of animations) a.done();
      await flush();
    }
    player.destroy();
    for (let k = 0; k < 6; k++) {
      const calls = animations.filter((a) => a.element === `tuck-${k}`);
      expect(calls.length).toBeGreaterThan(0);
      expect(calls.every((a) => a.easing === 'linear')).toBe(true);
    }
    expect(animations.find((a) => a.element === 'ghost')?.easing).toBeUndefined();
  });

  it('AD-14 steps run in order, then the rest, then the loop starts again at step 1', async () => {
    const { animations, deps } = fakes();
    const player = new ScenePlayer(moveComposeScene, deps, () => undefined);
    player.start();
    await flush();
    for (let guard = 0; guard < 60; guard++) {
      for (const a of animations) a.done();
      await flush();
    }
    const ids = animations.map((a) => a.id).filter((id, i, all) => id !== all[i - 1]);
    expect(ids.slice(0, 11)).toStrictEqual([
      ...moveComposeScene.steps.map((_, i) => `move-compose-step-${i}`),
      'move-compose-rest',
      'move-compose-step-0',
    ]);
    player.destroy();
  });

  it('AD-14 a tap while playing pauses; a tap while paused restarts from step 1', async () => {
    const { animations, deps } = fakes();
    const states: string[] = [];
    const player = new ScenePlayer(moveComposeScene, deps, (s) => states.push(s));
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
    expect(animations[before].id).toBe('move-compose-step-0');
    expect(states).toStrictEqual(['playing', 'paused', 'playing']);
    player.destroy();
    expect(animations.every((a) => a.cancelled)).toBe(true);
  });

  it('AD-9 a hidden page runs no step until visible again, then restarts at step 1, with no listener', async () => {
    const { animations, deps, show } = fakes(true);
    const player = new ScenePlayer(moveComposeScene, deps, () => undefined);
    player.start();
    await flush();
    expect(animations).toHaveLength(0);
    show();
    await flush();
    expect(animations[0].id).toBe('move-compose-step-0');
    player.destroy();
    for (const file of [source, playerSource, effectsSource])
      expect(file).not.toMatch(/visibilitychange|pagehide|addEventListener/);
  });

  it('AD-9 a scene paused by a tap while hidden stays paused when the page turns visible', async () => {
    const f = fakes(true);
    const player = new ScenePlayer(moveComposeScene, f.deps, () => undefined);
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
    expect(f.animations[0].id).toBe('move-compose-step-0');
    player.destroy();
  });

  it('AD-9 a step finishing while the page went hidden stops at the next boundary', async () => {
    const f = fakes();
    const player = new ScenePlayer(moveComposeScene, f.deps, () => undefined);
    player.start();
    await flush();
    const hidden = vi.spyOn(f.deps, 'hidden').mockReturnValue(true);
    f.animations[0].done();
    await flush();
    expect(f.animations.every((a) => a.cancelled || a.id === 'move-compose-step-0')).toBe(true);
    expect(f.animations.filter((a) => a.id === 'move-compose-step-1')).toHaveLength(0);
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
    return render(Scene, { props: { scene: moveComposeScene, ...FIT } }).body;
  }

  it('AD-3 a figure named by its visible description, an aria-hidden stage, a tap button outside it', async () => {
    const body = await html(false);
    expect(body).toContain('<figure');
    expect(body).toMatch(/aria-labelledby="([^"]+)-caption"/);
    expect(body).toContain(`>${text.howTo.scenes.moveCompose}</figcaption>`);
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
    ['move-compose', moveComposeScene, 6, 'moveCompose'],
    ['free-letter', freeLetterScene, 3, 'freeLetter'],
  ] as const)(
    'AD-3 scene %s: one tray layer per open frame, Validate and controls drawn, no ids',
    async (name, scene, layers, key) => {
      mocked.motion = { baseMs: 180, reduced: false };
      vi.resetModules();
      const { render } = await import('svelte/server');
      const { default: Scene } = await import('./Scene.svelte');
      const body = render(Scene, { props: { scene, ...FIT } }).body;
      expect(body).toContain(`>${text.howTo.scenes[key]}</figcaption>`);
      expect(body.match(/data-scene-el="tray-\d"/g)).toHaveLength(layers);
      expect(body).toContain(`>${text.validate}</span>`);
      expect(body).toContain(text.flip);
      expect(body).not.toContain('data-card-id');
      expect(body).not.toContain('data-testid');
      expect(body).not.toContain('data-mirror-of');
      expect(body.includes('class="cell6')).toBe(name === 'free-letter');
    },
  );

  it('AD-3 AD-14 in normal motion free-letter draws its tray-0 layer open (scene 1 final tray) and move-compose has no tray-0 layer', async () => {
    mocked.motion = { baseMs: 180, reduced: false };
    vi.resetModules();
    const { render } = await import('svelte/server');
    const { default: Scene } = await import('./Scene.svelte');
    const layer = (scene: Scene) => {
      const body = render(Scene, { props: { scene, ...FIT } }).body;
      return /<div[^>]*data-scene-el="tray-0"[^>]*>/.exec(body)?.[0];
    };
    expect(layer(freeLetterScene)).toMatch(/opacity:\s*1/);
    expect(layer(moveComposeScene)).toBeUndefined();
  });

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

// Epic 8 ticket 3 (HP-3d, HP-3e, HP-5, HP-6): scenes 4 and 5 against their fixtures.
describe('AD-14 scene place against its fixture', () => {
  const letters: Record<number, string> = { 3: 'B', 0: 'A', 24: 'L', 22: 'K', 8: 'E', 6: 'D' };
  // Frame i = the state after fixture command 3 + i (commands 0 to 2 are set-up).
  const applied = (i: number): number => 3 + i;

  it('AD-14 R-40 the steps carrying a command cover fixture commands 3 to 7 in order; set-up commands are not animated', () => {
    const indexes = placeScene.steps.flatMap((s) => (s.command === undefined ? [] : [s.command]));
    expect(indexes).toStrictEqual([3, 4, 5, 6, 7]);
    expect(placeScene.id).toBe(placeFixture.scene);
    expect(placeScene.caption).toBe(text.howTo.scenes.place);
    expect(placeScene.steps.map((s) => s.type)).toStrictEqual([
      'tap',
      'tap',
      'tap',
      'move',
      'move',
      'tap',
      'fly',
    ]);
    expect(placeFixture.commands.slice(3).map((c) => c.type)).toStrictEqual([
      'validate',
      'setTarget',
      'setTarget',
      'setPlacementOrder',
      'confirm',
    ]);
  });

  it('AD-14 Q-06 R-80 the drawn Validate follows the fixture validatable: lit, pressed on the tap, then off', () => {
    expect(placeScene.frames).toHaveLength(6);
    placeScene.frames.forEach((frame, i) => {
      // Scene.svelte draws Validate only on a frame with neither a strip nor lit cells.
      if (frame.placeOrder !== undefined || frame.lit !== undefined) return;
      const entry = placeFixture.validatable.find((v) => v.after === applied(i));
      expect(entry).toBeDefined();
      const pressed = placeFixture.commands[applied(i) - 1]?.type === 'validate';
      expect(frame.validate).toBe(pressed ? 'pressed' : entry?.canValidate ? 'lit' : 'off');
    });
  });

  it('AD-14 R-40 R-42 R-51 the frames show the fixture target, legal cells and placement order', () => {
    placeScene.frames.forEach((frame, i) => {
      expect(frame.tail).toBe('gone');
      expect(frame.tray).toBe(false);
      expect(frame.order).toBeUndefined();
      const entry = placeFixture.place.find((p) => p.after === applied(i));
      expect(frame.placeTarget).toBe(entry?.target);
      expect(frame.lit).toStrictEqual(entry?.legalTargets ?? (i === 0 ? undefined : []));
      expect(frame.placeOrder?.join('')).toBe(entry?.order.map((id) => letters[id]).join(''));
    });
    expect(placeScene.frames[1].placeOrder?.join('')).toBe('BALKED');
    expect(placeScene.frames[4].placeOrder?.join('')).toBe('DBALKE');
  });

  it('AD-14 R-52 R-60 the last frame is cell 6 holding D B A L K E, the stated cells entry', () => {
    expect(placeFixture.cells).toStrictEqual([
      { after: 8, cell: 6, cards: ['D', 'B', 'A', 'L', 'K', 'E'] },
    ]);
    expect(placeFixture.scores).toStrictEqual([{ after: 8, score: 36 }]);
    expect(placeScene.frames[5]).toStrictEqual({
      tail: 'gone',
      tray: false,
      validate: 'off',
      lit: [],
      cellTop: true,
    });
    expect(placeScene.frames.filter((f) => f.cellTop)).toHaveLength(1);
    expect(placeScene.carry?.landed).toBe(true);
  });

  it('AD-14 the pointer fades in with the first tap, no tail or D effect exists, and the fly slides the strip', () => {
    const effects = sceneEffects(placeScene);
    const ghosts = effects.flat().filter((e) => e.element === 'ghost');
    expect(ghosts[0].keyframes[0].opacity).toBe(0);
    expect(ghosts[0].keyframes[1].opacity).toBe(1);
    expect(ghosts[1].keyframes[0].opacity).toBeUndefined();
    for (const effect of effects.flat()) {
      expect(placeScene.elements).toContain(effect.element);
      expect(effect.element).not.toMatch(/^(tail|dest)/);
    }
    const index = placeScene.steps.findIndex((s) => s.type === 'fly');
    expect(placeScene.steps[index].flies).toBeUndefined();
    expect(placeScene.steps[index].reveal).toBeUndefined();
    const fly = effects[index];
    expect(fly.some((e) => e.element === 'strip-4' && e.keyframes.length === 2)).toBe(true);
  });

  it('AD-14 the tuck: six fliers D B A L K E, one sixth each, linear with a segment easing, strip and Confirm hidden, swap in phase 1', () => {
    const index = placeScene.steps.findIndex((s) => s.type === 'fly');
    const fly = sceneEffects(placeScene)[index];
    const hidden = [{ opacity: 0 }, { opacity: 0 }];
    for (const id of ['strip-4', 'confirm'])
      expect(fly.find((e) => e.element === id)?.keyframes).toStrictEqual(hidden);
    const ghost = fly.filter((e) => e.element === 'ghost');
    expect(ghost).toHaveLength(1);
    expect([ghost[0].phase, ghost[0].times, ghost[0].kind]).toStrictEqual([0, 1, 'flyToCell']);
    expect([ghost[0].keyframes[0].opacity, ghost[0].keyframes[1].opacity]).toStrictEqual([1, 0]);
    expect(fly.find((e) => e.element === 'tuck' && e.phase === 0)?.keyframes).toStrictEqual([
      { opacity: 1 },
      { opacity: 1 },
    ]);
    for (let k = 0; k < 6; k++) {
      const e = need(fly.find((x) => x.element === `tuck-${k}`));
      expect([e.phase, e.times, e.kind, e.easing]).toStrictEqual([0, 6, 'flyToCell', 'linear']);
      const offsets = e.keyframes.map((f) => f.offset);
      expect(offsets).toStrictEqual(
        [k === 0 ? undefined : 0, k / 6, (k + 1) / 6, k === 5 ? undefined : 1].filter(
          (o) => o !== undefined,
        ),
      );
      const departure = e.keyframes.find((f) => f.offset === k / 6);
      expect(departure?.easing).toBe('ease-in-out');
      expect(departure?.transform).toBe(tuckStart(k));
      expect(e.keyframes.find((f) => f.offset === (k + 1) / 6)?.transform).toBe(tuckEnd(6));
    }
    const swap = fly.filter((e) => e.phase === 1);
    expect(swap.map((e) => [e.element, e.kind, e.times, e.keyframes])).toStrictEqual([
      ['place-5', 'overlay', 1, [{ opacity: 1 }, { opacity: 1 }]],
      ['tuck', 'overlay', 1, [{ opacity: 0 }, { opacity: 0 }]],
    ]);
  });

  it('AD-1 defineScene throws when the tucks cell or letters differ from the last placement frame', () => {
    const index = placeScene.steps.findIndex((s) => s.type === 'fly');
    const tucks = need(placeScene.steps[index].tucks);
    const redefine = (t: typeof tucks) =>
      defineScene({
        ...placeScene,
        steps: placeScene.steps.map((s, i) => (i === index ? { ...s, tucks: t } : s)),
      });
    expect(() => redefine(tucks)).not.toThrow();
    expect(() => redefine({ ...tucks, cell: 5 })).toThrow(/cell 5/);
    expect(() => redefine({ ...tucks, letters: ['B', 'A', 'L', 'K', 'E', 'D'] })).toThrow(
      /placement order/,
    );
  });

  it('AD-1 a landed scene allows no grab or drop, a carried one needs its geometry, and a tap or move command must fit', () => {
    const [tap, , , move] = placeScene.steps;
    const redefine = (steps: typeof placeScene.steps) => defineScene({ ...placeScene, steps });
    expect(() => redefine([{ ...tap, type: 'grab', command: undefined }])).toThrow(/not landed/);
    expect(() => redefine([{ ...tap, command: 0 }])).toThrow(/step 0 \(tap\)/);
    expect(() => redefine([{ ...move, command: 0 }])).toThrow(/step 0 \(move\)/);
    const fly = placeScene.steps[6];
    expect(() => redefine([{ ...fly }])).not.toThrow();
    expect(() =>
      defineScene({
        ...moveComposeScene,
        steps: [moveComposeScene.steps[3]],
        layout: undefined,
      }),
    ).toThrow(/needs an offset and a layout/);
  });
});

describe('AD-14 scene scoring against its fixture', () => {
  it('AD-14 R-80 the four steps are commandless taps: three grow a stack, the third reveals 9, 16, 36 together, the fourth the total 61', () => {
    expect(scoringFixture.commands).toStrictEqual([]);
    expect(scoringScene.id).toBe(scoringFixture.scene);
    expect(scoringScene.caption).toBe(text.howTo.scenes.scoring);
    expect(scoringScene.carry).toBeUndefined();
    expect(
      scoringScene.steps.map((s) => [s.type, s.command, s.grows, s.reveal?.show]),
    ).toStrictEqual([
      ['tap', undefined, { cell: 3, cards: 3 }, undefined],
      ['tap', undefined, { cell: 4, cards: 3 }, undefined],
      ['tap', undefined, { cell: 6, cards: 6 }, ['score-1', 'score-2', 'score-3']],
      ['tap', undefined, undefined, 'total'],
    ]);
    // The k-th grown cell is the k-th scored cell.
    expect(scoringScene.steps.flatMap((s) => (s.grows ? [s.grows.cell] : []))).toStrictEqual(
      scoringFixture.cellScores.map((c) => c.cell),
    );
    expect(scoringFixture.cellScores.map((c) => c.score)).toStrictEqual([9, 16, 36]);
    expect(scoringFixture.scores).toStrictEqual([{ after: 0, score: 61 }]);
  });

  it('AD-14 R-80 R-65 six frames: stacks fill one by one, then the three figures, then the stated total', () => {
    expect(scoringScene.frames.map((f) => [f.stacks, f.numbers, f.total])).toStrictEqual([
      [0, 0, undefined],
      [1, 0, undefined],
      [2, 0, undefined],
      [3, 0, undefined],
      [3, 3, undefined],
      [3, 3, scoringFixture.scores[0].score],
    ]);
    for (const frame of scoringScene.frames) {
      expect(frame.tail).toBe('gone');
      expect(frame.tray).toBe(false);
      expect(frame.order).toBeUndefined();
    }
  });

  // Epic 8 ticket 9 (HP-3): the grow effects, as keyframe arithmetic.
  const stepFx = (i: number) => sceneEffects(scoringScene)[i];
  const grown = (i: number, element: string) => {
    const effect = stepFx(i).find((e) => e.element === element);
    if (effect === undefined) throw new Error(`no effect ${element}`);
    return effect;
  };
  const px = (n: number) => `translateY(${n}px)`;

  it('AD-14 R-65 stacks grow: each grown cell has its top card and one card per slice, phase 0, linear, g + n - 1 multiples', () => {
    for (const [i, cell, n] of [
      [0, 3, 3],
      [1, 4, 3],
      [2, 6, 6],
    ] as const) {
      const ids = stepFx(i)
        .filter((e) => e.element.startsWith('grow-'))
        .map((e) => e.element);
      expect(ids.sort()).toStrictEqual(Array.from({ length: n }, (_, j) => `grow-${cell}-${j}`));
      for (const e of stepFx(i).filter((f) => f.element.startsWith('grow-'))) {
        expect(e.phase).toBe(0);
        expect(e.easing).toBe('linear');
        expect(e.kind).toBe('flyToCell');
        expect(e.times).toBe(2 + n - 1);
      }
    }
  });

  it('AD-14 R-65 at each offset o_m the top card has risen by n-1-m strips while card m appears; it ends at translateY 0', () => {
    for (const [i, cell, n] of [
      [0, 3, 3],
      [1, 4, 3],
      [2, 6, 6],
    ] as const) {
      const g = 2;
      const top = grown(i, `grow-${cell}-${n - 1}`).keyframes;
      expect(top[0]).toMatchObject({ offset: 0, transform: px(-(n - 1) * STRIP) });
      for (let m = 0; m < n - 1; m++) {
        const o = (g + m) / (g + n - 1);
        expect(top[m + 1]).toMatchObject({
          offset: o,
          transform: px(-(n - 1 - m) * STRIP),
          easing: 'ease-in-out',
        });
        expect(grown(i, `grow-${cell}-${m}`).keyframes).toStrictEqual([
          { offset: 0, opacity: 0 },
          { offset: o, opacity: 0 },
          { offset: o, opacity: 1 },
          { offset: 1, opacity: 1 },
        ]);
      }
      expect(top.at(-1)).toStrictEqual({ offset: 1, transform: 'translateY(0px)' });
      expect(top).toHaveLength(n + 1);
    }
  });

  it('AD-14 the ghost taps the collapsed top card at a fixed point and the figures show after the last stack', () => {
    for (const [i, cell] of [
      [0, 3],
      [1, 4],
      [2, 6],
    ] as const) {
      expect(scoringScene.targets[`cell${cell}`]).toStrictEqual({
        x: placeCellX(cell) + 22,
        y: CELLS_TOP + CARD_H / 2,
      });
      expect(grown(i, 'ghost').times).toBe(2);
    }
    const shows = (i: number) =>
      stepFx(i)
        .filter((e) => e.phase === 1)
        .map((e) => e.element);
    expect(shows(0)).toStrictEqual([]);
    expect(shows(1)).toStrictEqual([]);
    expect(shows(2)).toStrictEqual(['score-1', 'score-2', 'score-3']);
    expect(shows(3)).toStrictEqual(['total']);
    // A step lasts wait + max(phase 0 times) + the reveal (multiples of the flyToCell duration).
    const len = (i: number) => {
      const wait = scoringScene.steps[i].wait?.times ?? 0;
      const phase0 = Math.max(
        ...stepFx(i)
          .filter((e) => e.phase === 0)
          .map((e) => e.times),
      );
      return wait + phase0 + (stepFx(i).some((e) => e.phase === 1) ? 0.5 : 0);
    };
    expect([0, 1, 2, 3].map(len)).toStrictEqual([6, 5, 8.5, 3.5]);
  });

  it('AD-14 defineScene throws on a bad grows step and on a list reveal.show on an arrange step', () => {
    const steps = scoringScene.steps;
    const redefine = (i: number, patch: object, elements = scoringScene.elements) =>
      defineScene({
        ...scoringScene,
        elements,
        steps: steps.map((s, k) => (k === i ? { ...s, ...patch } : s)),
      });
    expect(() => redefine(0, { type: 'move' })).toThrow(/grows only on a tap/);
    expect(() => redefine(0, { grows: { cell: 5, cards: 3 } })).toThrow(/fixture start lacks/);
    expect(() => redefine(0, { grows: { cell: 3, cards: 2 } })).toThrow(/not the fixture's 3/);
    expect(() => redefine(1, { grows: { cell: 3, cards: 3 } })).toThrow(/cell 3 twice/);
    expect(() =>
      redefine(
        0,
        {},
        scoringScene.elements.filter((e) => e !== 'grow-3-2'),
      ),
    ).toThrow(/does not declare grow-3-2/);
    expect(() => redefine(3, { reveal: { show: ['a', 'b'], hide: [], kind: 'overlay' } })).toThrow(
      /reveals unknown element a/,
    );
    const arrange = moveComposeScene.steps.find((s) => s.type === 'arrange');
    const list = { ...arrange, reveal: { show: ['tray-1'], hide: [], kind: 'overlay' } };
    expect(() =>
      defineScene({ ...moveComposeScene, steps: [list as (typeof moveComposeScene.steps)[0]] }),
    ).toThrow(/reveals one tray layer, not a list/);
  });

  it('AD-14 reveal.show accepts a list: each id is checked and faded in over the step kind', () => {
    expect(() =>
      defineScene({
        ...scoringScene,
        steps: scoringScene.steps.map((s, k) =>
          k === 2
            ? {
                ...s,
                reveal: {
                  show: ['score-1', 'score-2', 'score-3'],
                  hide: [],
                  kind: 'overlay' as const,
                },
              }
            : s,
        ),
      }),
    ).not.toThrow();
    for (const e of stepFx(2).filter((f) => f.phase === 1)) {
      expect(e.keyframes).toStrictEqual([{ opacity: 0 }, { opacity: 1 }]);
      expect(e.kind).toBe('overlay');
      expect(e.times).toBe(1);
    }
  });

  it('AD-14 R-36 the figures are letters x cell: QU counts two', () => {
    expect(text.howTo.scoreFigure(3, 3, 9)).toBe('3 \u00d7 3 = 9');
    expect(scoringFixture.start.cells['4']).toStrictEqual(['QU', 'I', 'T']);
    expect(text.howTo.scoreFigure(4, 4, 16)).toBe('4 \u00d7 4 = 16');
    for (const effect of sceneEffects(scoringScene).flat())
      expect(scoringScene.elements).toContain(effect.element);
  });
});

describe('AD-3 scenes place and scoring figure structure', () => {
  async function body(scene: Scene, reduced = false): Promise<string> {
    mocked.motion = { baseMs: 180, reduced };
    vi.resetModules();
    const { render } = await import('svelte/server');
    const { default: Scene } = await import('./Scene.svelte');
    return render(Scene, { props: { scene, ...FIT } }).body;
  }

  it('AD-3 scene place: six layers, strips on frames 1 to 4, Confirm, no tail, no ids', async () => {
    const html = await body(placeScene);
    expect(html).toContain(`>${text.howTo.scenes.place}</figcaption>`);
    expect(html.match(/data-scene-el="place-\d"/g)).toHaveLength(6);
    expect(html.match(/data-scene-el="strip-\d"/g)).toHaveLength(4);
    expect(html.match(new RegExp(`>${text.confirm}</span>`, 'g'))).toHaveLength(4);
    expect(html.match(new RegExp(`>${text.validate}</span>`, 'g'))).toHaveLength(1);
    expect(html).not.toContain('data-scene-el="tail');
    expect(html).not.toContain('data-scene-el="dest"');
    expect(html).not.toContain('data-card-id');
    expect(html).not.toContain('data-testid');
    expect(html).not.toContain('data-mirror-of');
  });

  it('AD-3 scene place: tuck fliers follow D B A L K E in DOM order after the place layers, none under reduced motion', async () => {
    const html = await body(placeScene);
    const ids = [...html.matchAll(/data-scene-el="(tuck(?:-\d)?|place-\d)"/g)].map((m) => m[1]);
    expect(ids).toStrictEqual([
      'place-0',
      'place-1',
      'place-2',
      'place-3',
      'place-4',
      'place-5',
      'tuck',
      'tuck-0',
      'tuck-1',
      'tuck-2',
      'tuck-3',
      'tuck-4',
      'tuck-5',
    ]);
    expect(html.match(/data-scene-el="confirm"/g)).toHaveLength(1);
    expect(html).not.toContain('data-mirror-of');
    expect((await body(placeScene, true)).match(/data-scene-el="tuck/g)).toBeNull();
  });

  it('AD-3 scene place: the last layer draws cell 6 as the one top card E, the fixture cells entry keeps six', async () => {
    const html = await body(placeScene, true);
    const layers = html.split('data-scene-el="place-').slice(1);
    const cell6 = (layer: string) =>
      layer.split('class="wcell ').find((c) => />6<\/span>/.test(c)) ?? '';
    const cards = (layer: string) => (cell6(layer).match(/class="card /g) ?? []).length;
    expect(cards(layers[5])).toBe(1);
    expect(cards(layers[0])).toBe(1);
    expect(cell6(layers[5])).toContain('>E</span>');
    expect(placeFixture.cells.at(-1)?.cards).toHaveLength(6);
    expect(placeFixture.cells.at(-1)?.cards.at(-1)).toBe('E');
    const full = await body(scoringScene, true);
    expect(full).toContain('data-scene-el="score-3"');
  });

  it('AD-3 scene place: column 3 is drawn without its B, which sits in the strip (owner decision, ticket 8.3)', async () => {
    const html = await body(placeScene);
    // Column 1 keeps F (the four moved cards are in the strip) and column 3 L M F; the column's
    // top card is the one drawn `full`.
    const topOf = (n: number): string[] => {
      const segment = html.split('<div class="column ')[n] ?? '';
      const upToTop = segment.slice(0, segment.indexOf(' full '));
      return [...upToTop.matchAll(/class="glyph[^"]*">([^<]+)</g)].map((m) => m[1]);
    };
    expect(topOf(1)).toStrictEqual([]);
    // Column 3 starts with four cards: one filler card on its far end (ticket 6, stage.ts).
    expect(topOf(3)).toStrictEqual([FILLER_LETTERS[0], 'L', 'M']);
  });

  it('AD-3 scene scoring: three stacks with figures, a total, nothing of the start columns', async () => {
    const html = await body(scoringScene);
    expect(html).toContain(`>${text.howTo.scenes.scoring}</figcaption>`);
    for (const figure of ['3 \u00d7 3 = 9', '4 \u00d7 4 = 16', '6 \u00d7 6 = 36'])
      expect(html).toContain(`>${figure}</span>`);
    expect(html).toContain(`>${text.score(61)}</span>`);
    // Eight columns of filler (5 cards each) and the stacks 3 + 3 + 6 (all in the DOM, in wrappers).
    expect(html.match(/class="card[^"]*static/g)).toHaveLength(8 * MIN_COLUMN_CARDS + 12);
    expect(html).not.toContain('>Z<');
    expect(html).not.toContain('data-scene-el="tail');
    expect(html).not.toContain('data-card-id');
  });

  it('AD-14 scene scoring: growth wrappers in list order, base style equal to the t=0 keyframes, none and top cards only under reduced motion', async () => {
    const html = await body(scoringScene);
    const wrappers = [...html.matchAll(/<div data-scene-el="(grow-\d+-\d+)"([^>]*)>/g)];
    expect(wrappers.map((m) => m[1])).toStrictEqual([
      ...['3-0', '3-1', '3-2', '4-0', '4-1', '4-2', '6-0', '6-1', '6-2', '6-3', '6-4', '6-5'].map(
        (id) => `grow-${id}`,
      ),
    ]);
    // SSR prints `transform: translateY(-40px);`; compare with spaces dropped (and -0 as 0).
    const px = (value: string) => value.replace(/\s/g, '').replace(/-0px/g, '0px');
    for (const [, id, rawStyle] of wrappers) {
      const style = px(rawStyle);
      const [, cell, j] = /grow-(\d+)-(\d+)/.exec(id) ?? [];
      const n = scoringFixture.start.cells[cell as '3'].length;
      const effect = sceneEffects(scoringScene)
        .flat()
        .find((e) => e.element === id);
      const first = effect?.keyframes[0];
      if (Number(j) < n - 1) {
        expect(style).toContain('opacity:0');
        expect(first).toMatchObject({ offset: 0, opacity: 0 });
        expect(style).not.toContain('transform');
      } else {
        expect(style).toContain(`transform:${px(String(first?.transform))}`);
        expect(style).not.toContain('opacity');
      }
    }
    const reduced = await body(scoringScene, true);
    expect(reduced).not.toContain('data-scene-el="grow-');
    // Frame 0 draws only the top cards (R-65): fixture-listed top letters T, T, E.
    const mini = (cell: number) =>
      (reduced.split(`data-cell="${cell}"`)[1] ?? '').split('class="cell')[0];
    for (const cell of [3, 4, 6]) expect((mini(cell).match(/class="card /g) ?? []).length).toBe(1);
  });
});

// Epic 8 ticket 10 (HP-4, HP-5, HP-6): the one Tricky rule scene against its fixture.
describe.each([
  // `applied`: per frame, the number of fixture commands applied (the ticket's `n`).
  ['source-drop', sourceDropScene, sourceDropFixture, text.howTo.scenes.sourceDrop, [0, 0, 1, 2]],
] as const)('AD-14 scene %s against its fixture', (name, scene, data, caption, applied) => {
  type Frames = readonly {
    validate?: string;
    used?: readonly number[];
    order?: readonly string[];
  }[];
  const frames = scene.frames as Frames;

  it("AD-14 the scene id, caption and every command are the fixture's: steps cover the commands in order", () => {
    expect(scene.id).toBe(name);
    expect(scene.id).toBe(data.scene);
    expect(scene.caption).toBe(caption);
    const indexes = scene.steps.flatMap((s) => (s.command === undefined ? [] : [s.command]));
    expect([...new Set(indexes)]).toStrictEqual(data.commands.map((_, i) => i));
    expect(indexes).toStrictEqual([...indexes].sort((a, b) => a - b));
  });

  it('AD-14 every grab and drop step carry is pinned to the drop command it names', () => {
    for (const [i, step] of scene.steps.entries()) {
      if (step.type !== 'grab' && step.type !== 'drop') continue;
      const c = step.carry ?? carryOf(scene);
      const command = data.commands[step.command ?? -1] as {
        type: string;
        sourceColumn: number;
        sourceCount: number;
        destinationColumn: number;
      };
      expect(command.type).toBe('drop');
      expect([command.sourceColumn, command.sourceCount, command.destinationColumn]).toStrictEqual([
        c.sourceColumn,
        c.count,
        c.destinationColumn,
      ]);
      // A mismatching carry throws at load.
      const wrong = { ...c, count: c.count + 1 };
      expect(() =>
        defineScene({
          ...scene,
          steps: scene.steps.map((s, j) => (j === i ? { ...s, carry: wrong } : s)),
        }),
      ).toThrow(/carry differs from fixture drop command/);
    }
  });

  it('AD-14 R-38 the frame count, n per frame and Validate follow the fixture validatable', () => {
    expect(frames).toHaveLength(applied.length);
    frames.forEach((frame, i) => {
      const entry = data.validatable.find((v) => v.after === applied[i]);
      expect(entry).toBeDefined();
      expect(frame.validate).toBe(entry?.canValidate ? 'lit' : 'off');
    });
    expect(data.validatable.map((v) => v.after)).toStrictEqual(
      Array.from({ length: data.commands.length + 1 }, (_, i) => i),
    );
  });

  it('AD-14 R-33 a cell is dimmed in the frame its letter is added: Frame.used is the addFreeLetter cells so far', () => {
    frames.forEach((frame, i) => {
      const cells = data.commands
        .slice(0, applied[i])
        .filter((c) => c.type === 'addFreeLetter')
        .map((c) => (c as unknown as { cell: number }).cell);
      expect(frame.used ?? []).toStrictEqual(cells);
    });
  });

  it('AD-14 frame 0 equals the start: tail home, no tray, nothing dimmed, and every cell of the start is drawn', async () => {
    expect(scene.frames[0]).toStrictEqual({ tail: 'home', tray: false, validate: 'off' });
    mocked.motion = { baseMs: 180, reduced: true };
    try {
      vi.resetModules();
      const { render } = await import('svelte/server');
      const { default: Scene } = await import('./Scene.svelte');
      const body = render(Scene, { props: { scene, ...FIT } }).body;
      // The stage's band draws WordCells 3 to 10 from frame 0 (ticket 6), the start's cards in them.
      expect(
        [...body.matchAll(/class="cell svelte-[^"]*" data-cell="(\d+)"/g)].map((m) => m[1]),
      ).toStrictEqual(['3', '4', '5', '6', '7', '8', '9', '10']);
      const band = body.slice(body.indexOf('data-cell="3"'));
      const listed = Object.values(data.start.cells).flat();
      expect(
        [...band.matchAll(/class="glyph[^"]*">([^<]+)</g)].map((m) => m[1]).slice(0, listed.length),
      ).toStrictEqual(listed);
      expect(body).not.toContain('data-testid');
      expect(body).not.toContain('data-card-id');
    } finally {
      mocked.motion = { baseMs: 180, reduced: false };
    }
  });

  it('AD-14 the drawn dim per frame: the open tray layer repeats exactly the Frame.used cells as .cell.used', async () => {
    mocked.motion = { baseMs: 180, reduced: true };
    try {
      vi.resetModules();
      const { render } = await import('svelte/server');
      const { default: Scene } = await import('./Scene.svelte');
      for (const [i, frame] of frames.entries()) {
        if (frame.order === undefined) continue;
        // Render with frame i as the first (shown) frame; its layer is `tray-0`.
        const body = render(Scene, {
          props: { scene: { ...scene, frames: scene.frames.slice(i) }, ...FIT },
        }).body;
        const layer = body.slice(body.indexOf('data-scene-el="tray-0"'));
        const end = layer.indexOf('data-scene-el="tray-', 10);
        const mine = end < 0 ? layer : layer.slice(0, end);
        const keys = [...mine.matchAll(/class="cell used[^"]*" data-cell="(\d)"/g)].map((m) =>
          Number(m[1]),
        );
        expect(keys).toStrictEqual([...(frame.used ?? [])]);
      }
    } finally {
      mocked.motion = { baseMs: 180, reduced: false };
    }
  });

  it('AD-14 every animated element is declared and every step names a motion kind', () => {
    for (const effect of sceneEffects(scene).flat())
      expect(scene.elements).toContain(effect.element);
    for (const step of scene.steps) expect(KINDS).toContain(step.kind);
    for (const [i, frame] of scene.frames.entries())
      if (frame.tray) expect(scene.elements).toContain(`tray-${i}`);
  });
});

describe('AD-14 scene source-drop', () => {
  it("AD-14 R-21 R-14 Q-34 the drop lands at the tail's home: the pointer goes out and back, then offset 0", () => {
    expect(sourceDropScene.offset).toStrictEqual({ x: 0, y: 0 });
    expect(sourceDropScene.steps.map((s) => [s.type, s.target, s.command])).toStrictEqual([
      ['grab', 'grab', 0],
      ['move', 'out', undefined],
      ['move', 'grab', undefined],
      ['drop', 'grab', 0],
      ['fly', 'grab', undefined],
      ['move', 'tiles', 1],
    ]);
    const effects = sceneEffects(sourceDropScene);
    const tails = effects.flat().filter((e) => e.element === 'tail' && e.phase === 0);
    expect(tails.at(-1)?.keyframes[1].transform).toBe('translate(0px, 0px)');
    const out = sourceDropScene.targets.out;
    const grab = sourceDropScene.targets.grab;
    expect(out.x).toBeLessThan(grab.x - 20);
    // R-14 Q-34: the out point is beyond the source column's hit rect (card width at its x).
    const sourceX = columnX(need(carryOf(sourceDropScene)).sourceColumn);
    expect(out.x < sourceX || out.x > sourceX + CARD_W).toBe(true);
  });

  it('AD-14 R-21 R-31 frames: start, lifted, F E D K A with F locked (k 1 left), FAKED', () => {
    expect(
      sourceDropScene.frames.map((f) => [f.tail, f.order?.join(''), f.k, f.side, f.dest]),
    ).toStrictEqual([
      ['home', undefined, undefined, undefined, undefined],
      ['lifted', undefined, undefined, undefined, undefined],
      ['gone', 'FEDKA', 1, 'left', 'gone'],
      ['gone', 'FAKED', 1, 'left', 'gone'],
    ]);
  });
});

describe('AD-14 the scenes in the panel order', () => {
  it('AD-14 the one Tricky rule scene follows the four basic scenes', async () => {
    const { basicScenes, scenes } = await import('./index');
    expect(basicScenes.map((s) => s.id)).toStrictEqual([
      'move-compose',
      'free-letter',
      'place',
      'scoring',
    ]);
    expect(scenes.map((s) => s.id)).toStrictEqual([...basicScenes.map((s) => s.id), 'source-drop']);
  });
});

describe('AD-14 frame k and side against the engine-checked fixture block', () => {
  // The commands applied in each frame (the frame's `n`); the engine replay checks `block` (R-31).
  it.each([
    ['move-compose', moveComposeScene, moveComposeFixture.block, [0, 0, 1, 2, 3, 4, 5, 6]],
    ['free-letter', freeLetterScene, freeLetterFixture.block, [6, 7, 8]],
    ['source-drop', sourceDropScene, sourceDropFixture.block, [0, 0, 1, 2]],
  ] as const)(
    'AD-14 R-31 scene %s: every frame k and side equal the fixture block',
    (_n, scene, block, applied) => {
      expect(scene.frames).toHaveLength(applied.length);
      for (const [i, frame] of scene.frames.entries()) {
        const stated = block.find((b) => b.after === applied[i]);
        expect(frame.k).toBe(frame.tray ? stated?.k : undefined);
        expect(frame.side).toBe(frame.tray ? stated?.side : undefined);
      }
    },
  );
});

describe('AD-14 frameDest and the source-drop frames', () => {
  it('AD-14 frameDest: lifted raises by LIFT and is shown, gone is hidden, absent stays at home', () => {
    const frame = { tail: 'home', tray: false } as const;
    expect(frameDest({ ...frame, dest: 'lifted' })).toStrictEqual({
      transform: `translate(0px, ${-LIFT}px)`,
      hidden: false,
    });
    expect(frameDest({ ...frame, dest: 'gone' })).toStrictEqual({ hidden: true });
    expect(frameDest(frame)).toStrictEqual({ hidden: false });
  });

  it('AD-14 the source-drop frames name the D block: gone once the tray is open', async () => {
    const { scenes } = await import('./index');
    expect(scenes.at(-1)?.frames.map((f) => f.dest)).toStrictEqual([
      undefined,
      undefined,
      'gone',
      'gone',
    ]);
  });
});

// Epic 8 ticket 7 (HP-3, HP-5, HP-6): scene 2 against its fixture, the arrange step, continuity.
describe('AD-14 scene free-letter against its fixture', () => {
  const data = freeLetterFixture;
  const opens = need(data.opens);
  // Frame i = the state after `opens + i` fixture commands (frame 0 is scene 1's final position).
  const applied = [opens, opens + 1, opens + 2];

  it('AD-14 the steps carry fixture commands from opens on, in order, and the scene id equals the fixture', () => {
    const indexes = freeLetterScene.steps.flatMap((s) =>
      s.command === undefined ? [] : [s.command],
    );
    expect(indexes).toStrictEqual([opens, opens + 1]);
    expect(data.commands.slice(opens).map((c) => c.type)).toStrictEqual([
      'addFreeLetter',
      'validate',
    ]);
    expect(freeLetterScene.id).toBe(data.scene);
    expect(freeLetterScene.fixture.opens).toBe(moveComposeFixture.commands.length);
  });

  it('AD-14 each frame validate, k, side and word equal the fixture at its absolute after, pressed on the tap', () => {
    freeLetterScene.frames.forEach((frame, i) => {
      const valid = data.validatable.find((v) => v.after === applied[i]);
      const pressed = data.commands[applied[i] - 1]?.type === 'validate';
      expect(frame.validate).toBe(pressed ? 'pressed' : valid?.canValidate ? 'lit' : 'off');
      const block = data.block.find((b) => b.after === applied[i]);
      expect([frame.k, frame.side]).toStrictEqual([block?.k, block?.side]);
      const word = data.words.find((w) => w.command === applied[i] - 1);
      if (word !== undefined) expect(frame.order?.join('')).toBe(word.word);
    });
    expect(freeLetterScene.frames.map((f) => f.cell6)).toStrictEqual(['top', 'used', 'used']);
  });

  it('AD-14 frame 0 deep-equals the last frame of move-compose (tile order, k, side, cell 6) and the board and tail are the same', () => {
    expect(freeLetterScene.frames[0]).toStrictEqual(moveComposeScene.frames.at(-1));
    expect(freeLetterScene.fixture.start).toStrictEqual(moveComposeScene.fixture.start);
    expect(freeLetterScene.carry).toStrictEqual({ ...need(moveComposeScene.carry), landed: true });
    expect(freeLetterScene.targets.rest).toStrictEqual(moveComposeScene.targets.rest);
  });

  it('AD-14 no move step of either new script names an arrange command', () => {
    for (const scene of [moveComposeScene, freeLetterScene])
      for (const step of scene.steps.filter((s) => s.type === 'move'))
        expect(scene.fixture.commands[step.command ?? -1]?.type).not.toBe('arrange');
  });

  it('AD-1 a step animating a command below opens throws when the script is defined', () => {
    const [tap] = freeLetterScene.steps;
    expect(() =>
      defineScene({ ...freeLetterScene, steps: [{ ...tap, command: opens - 2 }] }),
    ).toThrow(/below opens 6/);
    expect(() =>
      defineScene({ ...freeLetterScene, steps: [{ ...tap, command: undefined }] }),
    ).not.toThrow();
  });

  it('AD-14 every animated element is declared and every step names a motion kind', () => {
    for (const effect of sceneEffects(freeLetterScene).flat())
      expect(freeLetterScene.elements).toContain(effect.element);
    for (const step of freeLetterScene.steps) expect(KINDS).toContain(step.kind);
    // Frame 0 is scene 1's final tray, drawn by Scene.svelte as the always-open tray-0 layer, which
    // is not animated and so not declared; the later open frames are the animated layers.
    freeLetterScene.frames.forEach((frame, i) => {
      if (i > 0 && frame.tray) expect(freeLetterScene.elements).toContain(`tray-${i}`);
    });
  });

  it('AD-14 the first step of scene 2 is a tap from the rest point: the pointer is at rest at its start', () => {
    expect(freeLetterScene.steps[0].type).toBe('tap');
    const [first] = sceneEffects(freeLetterScene)[0].filter((e) => e.element === 'ghost');
    expect(first.keyframes[0].opacity).toBe(0);
    expect(first.keyframes[0].transform).toBe(ghostStart(freeLetterScene));
  });
});

describe('AD-14 the arrange step', () => {
  const index = moveComposeScene.steps.findIndex((s) => s.type === 'arrange');
  const step = moveComposeScene.steps[index];

  it('AD-14 it is a snap step bound to the arrange command, hides the pointer and glides only the moved tiles', () => {
    expect(step.kind).toBe('snap');
    expect(moveComposeScene.fixture.commands[step.command ?? -1]?.type).toBe('arrange');
    const effects = sceneEffects(moveComposeScene)[index];
    const ghost = effects.find((e) => e.element === 'ghost');
    expect(ghost?.keyframes.map((k) => k.opacity)).toStrictEqual([1, 0]);
    // Flip leaves K B A E D; arranged B A K E D: B and A move one place left, K two places right.
    const moved = Object.fromEntries(
      effects
        .filter((e) => /tile/.test(e.element))
        .map((e) => [e.element, e.keyframes.map((k) => k.transform)]),
    );
    expect(moved).toStrictEqual({
      'tray-7-tile-0': [`translate(${RICH_SLOT}px, 0px)`, 'translate(0px, 0px)'],
      'tray-7-tile-1': [`translate(${RICH_SLOT}px, 0px)`, 'translate(0px, 0px)'],
      'tray-7-tile-2': [`translate(${-2 * RICH_SLOT}px, 0px)`, 'translate(0px, 0px)'],
    });
    expect(effects.every((e) => e.kind === 'snap' && e.times === step.times)).toBe(true);
    // The layer is shown from the start of the glide: no later fade-in replaces it.
    expect(effects.filter((e) => e.element === 'tray-7' && e.phase === 1)).toHaveLength(0);
  });

  it('AD-14 its total ms doubles when the Animation speed preference doubles (Fast 90 ms against Slow 180 ms)', async () => {
    const { duration } = await import('../motion');
    const total = (baseMs: number): number => {
      mocked.motion = { baseMs, reduced: false };
      return sceneEffects(moveComposeScene)[index].reduce(
        (ms, e) => ms + duration(e.kind) * e.times,
        0,
      );
    };
    const fast = total(90);
    expect(fast).toBeGreaterThan(0);
    expect(total(180)).toBe(fast * 2);
    mocked.motion = { baseMs: 180, reduced: false };
  });

  it('AD-1 an arrange step needs its command and a tray-<frame> layer to reveal', () => {
    const redefine = (s: typeof step) =>
      defineScene({ ...moveComposeScene, steps: [moveComposeScene.steps[0], s] });
    expect(() => redefine({ ...step, command: undefined })).toThrow(/names no fixture command/);
    expect(() => redefine({ ...step, reveal: undefined })).toThrow(/tray-<frame> layer/);
    expect(() => redefine(step)).not.toThrow();
  });

  it('AD-1 an arrange step throws at load when a tile element is undeclared or the frames differ in letters', () => {
    const redefine = (scene: Scene) =>
      defineScene({ ...scene, steps: [moveComposeScene.steps[0], step] });
    const elements = moveComposeScene.elements.filter((e) => e !== 'tray-7-tile-4');
    expect(() => redefine({ ...moveComposeScene, elements })).toThrow(
      /does not declare tray-7-tile-4/,
    );
    const frames = moveComposeScene.frames.map((f, i) =>
      i === 7 ? { ...f, order: ['B', 'A', 'K', 'E', 'X'] } : f,
    );
    expect(() => redefine({ ...moveComposeScene, frames })).toThrow(/differ in letters/);
  });
});

describe('AD-14 scene captions come from text.ts', () => {
  it('AD-14 HP-6 each figure caption equals its text.ts string; scene 2 holds the owner sentence verbatim', () => {
    expect(moveComposeScene.caption).toBe(text.howTo.scenes.moveCompose);
    expect(sourceDropScene.caption).toBe(
      'Dropping back on the column you lifted from is allowed. You must use at least 1 letter from the destination column, unless you drag to an empty column.',
    );
    expect(freeLetterScene.caption).toBe(text.howTo.scenes.freeLetter);
    expect(text.howTo.scenes.freeLetter).toContain(
      'The top card of each WordCell can be used as a free letter added to the word.',
    );
  });
});
