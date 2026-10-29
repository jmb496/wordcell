import { describe, expect, it, vi } from 'vitest';
import freeLetterFixture from '../../../fixtures/how-to-play-free-letter.json';
import moveComposeFixture from '../../../fixtures/how-to-play-move-compose.json';
import placeFixture from '../../../fixtures/how-to-play-place.json';
import scoringFixture from '../../../fixtures/how-to-play-scoring.json';
import sourceDropFixture from '../../../fixtures/how-to-play-source-drop.json';
import cardSource from '../Card.svelte?raw';
import { type SceneStageInputs, sceneStageHeight } from '../layout/geometry';
import { trayLayout } from '../layout/tray';
import type { MotionKind } from '../motion';
import { text } from '../text';
import wordCellRowSource from '../WordCellRow.svelte?raw';
import { frameDest, ghostStart, sceneEffects, tuckEnd, tuckStart } from './effects';
import effectsSource from './effects.ts?raw';
import { freeLetterScene } from './free-letter';
import {
  CARD_H,
  CARD_W,
  columnX,
  HAND_H,
  HAND_TIP,
  HAND_W,
  LIFT,
  MIN_COLUMN_CARDS,
  PLACE_TILES,
  placeCellX,
  RICH_INSET,
  RICH_SLOT,
  SLOT,
  STAGE_W,
  STRIP,
  stageGeometry,
  stripTileX,
} from './geometry';
import { scenes } from './index';
import { moveComposeScene } from './move-compose';
import { placeScene } from './place';
import { type AnimationHandle, type PlayerDeps, restMs, ScenePlayer } from './player';
import playerSource from './player.ts?raw';
import source from './Scene.svelte?raw';
import stageSource from './Stage.svelte?raw';
import { scoringScene } from './scoring';
import { defineScene } from './script';
import { sourceDropScene } from './source-drop';
import {
  destinationCards,
  drawnColumns,
  FILLER_LETTERS,
  fillerColumns,
  joinCards,
  joinHidden,
} from './stage';
import type { Frame, Point, Scene, Step } from './types';

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
const fitOf = (scene: { stage: SceneStageInputs }) => ({
  cardWidth: 40,
  stageHeight: sceneStageHeight(40, scene.stage),
});

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

  it('AD-14 Q-31 free-letter frames: BAKED as scene 1 left it, L appended (BAKLED) with cell 6 used, arranged to BALKED, Validate pressed', () => {
    expect(
      freeLetterScene.frames.map((f) => [f.order?.join(''), f.k, f.side, f.cell6, f.validate]),
    ).toStrictEqual([
      ['BAKED', 2, 'right', 'top', 'lit'],
      ['BAKLED', 2, 'right', 'used', 'lit'],
      ['BALKED', 2, 'right', 'used', 'lit'],
      ['BALKED', 2, 'right', 'used', 'pressed'],
    ]);
  });
});

describe('AD-1 a step command must fit its step type', () => {
  it('AD-1 a move names a setPlacementOrder (never an arrange, owner decisions D3 D4), a tap one of the tap commands, an arrange step only an arrange; a mismatch or a missing command throws', () => {
    const [grab, move, drop, fly, plus, , , , arrange] = moveComposeScene.steps;
    const redefine = (steps: typeof moveComposeScene.steps) =>
      defineScene({ ...moveComposeScene, steps });
    expect(() => redefine([grab, move, drop, fly, plus, arrange])).not.toThrow();
    expect(() => redefine([grab, { ...move, command: 0 }])).toThrow(/step 1 \(move\)/);
    expect(() => redefine([grab, { ...move, command: 99 }])).toThrow(/step 1 \(move\)/);
    expect(() => redefine([grab, { ...move, command: 5 }])).toThrow(/step 1 \(move\)/);
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

  it('AD-10 the player times each effect, step wait hold and the rest by duration(kind) × times, at two speeds', async () => {
    for (const baseMs of [90, 320])
      for (const scene of scenes) {
        const { animations, deps } = fakes(false, baseMs);
        const ms = (kind: MotionKind, times: number): number => baseMs * KIND_FACTOR[kind] * times;
        const effects = sceneEffects(scene);
        const expected: { id: string; element: string; ms: number }[] = [];
        scene.steps.forEach((step, i) => {
          const id = `${scene.id}-step-${i}`;
          if (step.wait)
            expected.push({ id, element: 'stage', ms: ms(step.wait.kind, step.wait.times) });
          for (const phase of [0, 1])
            for (const e of effects[i].filter((x) => x.phase === phase))
              expected.push({ id, element: e.element, ms: ms(e.kind, e.times) });
        });
        const rest = ms(scene.rest.kind, scene.rest.times);
        expect(restMs(scene, deps.duration)).toBe(rest);
        expected.push({ id: `${scene.id}-rest`, element: 'stage', ms: rest });
        const player = new ScenePlayer(scene, deps, () => undefined);
        player.start();
        await flush();
        for (let guard = 0; guard < 200 && animations.length <= expected.length; guard++) {
          for (const a of animations) a.done();
          await flush();
        }
        player.destroy();
        // One full loop, then the next starts again at step 1.
        expect(
          animations
            .slice(0, expected.length)
            .map((a) => ({ id: a.id, element: a.element, ms: a.ms })),
        ).toStrictEqual(expected);
        expect(animations[expected.length]?.id).toBe(`${scene.id}-step-0`);
      }
  });
});

// A distinct ms per MotionKind (× baseMs), so a duration read for the wrong kind or without `times`
// shows in the recorded animate calls.
const KIND_FACTOR: Record<MotionKind, number> = {
  snap: 1,
  flyBack: 2,
  parting: 3,
  undoRedo: 5,
  flyToCell: 7,
  overlay: 11,
};

function fakes(initiallyHidden = false, baseMs = 100) {
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
  let hides = initiallyHidden ? 1 : 0;
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
    duration: (kind) => baseMs * KIND_FACTOR[kind],
    hidden: () => hidden,
    hides: () => hides,
    whenVisible: () =>
      new Promise<void>((resolve) => {
        visible = () => {
          hidden = false;
          resolve();
        };
      }),
  };
  return {
    animations,
    deps,
    hide: () => {
      hidden = true;
      hides++;
    },
    show: () => {
      hidden = false;
      visible?.();
    },
  };
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

  it('AD-14 destroy() cancels every animation and no animate call follows it; the Scene effect teardown calls it', async () => {
    const { animations, deps } = fakes();
    const player = new ScenePlayer(moveComposeScene, deps, () => undefined);
    player.start();
    await flush();
    animations[0].done();
    await flush();
    const before = animations.length;
    expect(before).toBeGreaterThan(1);
    player.destroy();
    for (const a of animations) a.done();
    await flush();
    expect(animations).toHaveLength(before);
    expect(animations.every((a) => a.cancelled)).toBe(true);
    // An unmounted scene (closed panel, another carousel scene) keeps no player running.
    expect(source).toMatch(/return \(\) => \{\s*next\.destroy\(\);/);
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

  it('AD-9 a step that finishes only after the page turned visible again restarts at step 1', async () => {
    const f = fakes();
    const player = new ScenePlayer(moveComposeScene, f.deps, () => undefined);
    player.start();
    await flush();
    // A hidden tab does not advance WAAPI: the step in flight resolves only once visible again.
    f.hide();
    await flush();
    f.show();
    await flush();
    for (let guard = 0; guard < 5 && !f.animations.some((a) => a.cancelled); guard++) {
      for (const a of f.animations) a.done();
      await flush();
    }
    const restart = f.animations.findLastIndex((a) => a.cancelled) + 1;
    expect(restart).toBeGreaterThan(0);
    expect(f.animations.slice(0, restart).every((a) => a.cancelled)).toBe(true);
    expect(f.animations[restart].id).toBe('move-compose-step-0');
    expect(f.animations.filter((a) => a.id === 'move-compose-step-1')).toHaveLength(0);
    expect(player.state).toBe('playing');
    player.destroy();
  });
});

describe('AD-3 scene figure structure', () => {
  async function html(reduced: boolean): Promise<string> {
    mocked.motion = { baseMs: 180, reduced };
    vi.resetModules();
    const { render } = await import('svelte/server');
    const { default: Scene } = await import('./Scene.svelte');
    return render(Scene, { props: { scene: moveComposeScene, ...fitOf(moveComposeScene) } }).body;
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
    ['free-letter', freeLetterScene, 4, 'freeLetter'],
  ] as const)(
    'AD-3 scene %s: one tray layer per open frame, Validate and controls drawn, no ids',
    async (name, scene, layers, key) => {
      mocked.motion = { baseMs: 180, reduced: false };
      vi.resetModules();
      const { render } = await import('svelte/server');
      const { default: Scene } = await import('./Scene.svelte');
      const body = render(Scene, { props: { scene, ...fitOf(scene) } }).body;
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
      const body = render(Scene, { props: { scene, ...fitOf(scene) } }).body;
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
      // Owner decision D5: frame 0 (Composing) shows the word in the tray; the later frames do not.
      expect(frame.tray).toBe(i === 0);
      expect(frame.order === undefined).toBe(i !== 0);
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
      cell6: 'top',
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

  it('AD-14 Q-49 the tuck: six fliers D B A L K E, one sixth each, linear with a segment easing, strip, Confirm and the target star hidden, swap in phase 1', () => {
    const index = placeScene.steps.findIndex((s) => s.type === 'fly');
    const fly = sceneEffects(placeScene)[index];
    const hidden = [{ opacity: 0 }, { opacity: 0 }];
    for (const id of ['strip-4', 'confirm'])
      expect(fly.find((e) => e.element === id)?.keyframes).toStrictEqual(hidden);
    // Q-49 (E6): the fly step has no wait, so the target's star goes in its phase 0, at commit;
    // the previewed top E on place-4 stays drawn under the fliers (nothing targets place-4).
    expect(placeScene.steps[index].wait).toBeUndefined();
    expect(fly.some((e) => e.element === 'place-4')).toBe(false);
    const mark = need(fly.find((e) => e.element === 'mark-4'));
    expect([mark.keyframes, mark.phase]).toStrictEqual([hidden, 0]);
    // Before the commit nothing touches the star: its one effect is this fly-step hold.
    const marks = sceneEffects(placeScene)
      .flat()
      .filter((e) => e.element === 'mark-4');
    expect(marks).toStrictEqual([mark]);
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
        y: stageGeometry(scoringScene.stage).cellsTop + CARD_H / 2,
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
    const { start } = scoringScene.fixture;
    const oneCard = { ...start, cells: { ...start.cells, '3': ['T'] } };
    expect(() =>
      defineScene({
        ...scoringScene,
        fixture: { ...scoringScene.fixture, start: oneCard },
        steps: steps.map((s, k) => (k === 0 ? { ...s, grows: { cell: 3, cards: 1 } } : s)),
      }),
    ).toThrow(/grows 1 cards, not the fixture's 1 \(at least 2\)/);
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
    return render(Scene, { props: { scene, ...fitOf(scene) } }).body;
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
    // Q-49: frames 1 to 4 each draw one previewed top with the star (frame 2's cell 6 is empty).
    expect(html.match(/class="preview-mark[ "]/g)).toHaveLength(4);
    expect(html.match(/data-scene-el="mark-4"/g)).toHaveLength(1);
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

  // Each place layer's WordCells: number, whether it is dimmed, whether its top card is used, its
  // card glyphs, its `★` pills (Q-49), the pill's data-scene-el, and whether its stack is empty.
  const placeLayers = (html: string) =>
    html
      .split('data-scene-el="place-')
      .slice(1)
      .map((layer) => {
        const cells = layer
          .split('<div class="wcell')
          .slice(1)
          .map((whole) => whole.split(/<div class="tiles|<span class="ctl|<div class="layer/)[0])
          .map((cell) => ({
            n: Number(/class="num[^"]*">(\d+)</.exec(cell)?.[1]),
            dim: /^[^>]*\bwc-dim\b/.test(cell),
            used: /class="card[^"]*\bused\b/.test(cell),
            glyphs: [...cell.matchAll(/class="glyph[^"]*">([^<]+)</g)].map((m) => m[1]),
            marks: (cell.match(/class="preview-mark[ "]/g) ?? []).length,
            markEl: /class="preview-mark[^"]*"[^>]*data-scene-el="([^"]+)"/.exec(cell)?.[1],
            empty: /<div class="stack[^"]*\bempty\b/.test(cell),
          }));
        const from = layer.indexOf('<div class="tiles');
        const strip = from < 0 ? '' : layer.slice(from, layer.indexOf('class="ctl', from));
        const cards = strip
          .split('<div class="card')
          .slice(1)
          .map((card) => ({
            glyph: /class="glyph[^"]*">([^<]+)</.exec(card)?.[1],
            destination: /^[^>]*\bdestination\b/.test(card),
            marks: [...card.matchAll(/class="(?:position|star) mark[^"]*">([^<]+)</g)].map(
              (m) => m[1],
            ),
          }));
        return { cells, cards };
      });

  it('AD-14 R-30 R-31 scene place: frame 0 shows the composed word B A L K E D in the tray with the D block B locked (owner decision D5)', async () => {
    for (const reduced of [false, true]) {
      const [first] = placeLayers(await body(placeScene, reduced));
      expect(first.cards.map((c) => c.glyph).join('')).toBe(
        need(placeFixture.drafts.find((d) => d.after === 3)).letters.join(''),
      );
      const block = need(placeFixture.block.find((b) => b.after === 3));
      expect(first.cards.map((c) => c.destination)).toStrictEqual(
        first.cards.map((_, j) => (block.side === 'left' ? j < block.k : false)),
      );
      expect(first.cards.flatMap((c) => c.marks)).toStrictEqual([]);
    }
  });

  it('AD-14 R-50 scene place: every strip marks its first card bottom and its last top with the star, the game marks (owner decision D9)', async () => {
    const layers = placeLayers(await body(placeScene, true));
    const strips = placeScene.frames.flatMap((f, i) => (f.placeOrder === undefined ? [] : [i]));
    expect(strips).toStrictEqual([1, 2, 3, 4]);
    for (const i of strips) {
      const { cards } = layers[i];
      const order = need(placeScene.frames[i].placeOrder);
      expect(cards.map((c) => c.glyph)).toStrictEqual([...order]);
      expect(cards.map((c) => c.marks)).toStrictEqual(
        order.map((_, j) =>
          j === 0 ? [text.stripBottom] : j === order.length - 1 ? [text.stripTop, text.star] : [],
        ),
      );
    }
    // The strip cards sit in place `strip`, as the game's (Card shows the marks only there).
    expect(source).toMatch(/place="strip"[\s\S]*?position=\{j === 0 \? 'bottom'/);
  });

  it("AD-14 R-50 scene place: its tray, strip and tuck tiles are the game's card-mode tiles for the scene card (trayLayout), so the marks get the game's face", async () => {
    const longest = Math.max(
      ...placeScene.frames.map((f) => (f.order ?? f.placeOrder ?? []).length),
    );
    const game = trayLayout(longest, CARD_W, STAGE_W - 2 * RICH_INSET);
    expect(game.mode).toBe('card');
    expect(PLACE_TILES.tileWidth).toBe(game.tileWidth);
    expect(PLACE_TILES.mode).toBe(game.mode);
    const html = await body(placeScene);
    const tiles = [...html.matchAll(/class="card[^"]*\btile\b[^"]*"[^>]*style="([^"]*)"/g)];
    // Frame 0's six tray tiles, four strips of six, six tuck fliers.
    expect(tiles).toHaveLength(6 + 4 * 6 + 6);
    for (const [, style] of tiles) expect(style).toContain(`--tile-w: ${game.tileWidth}px`);
    expect(stripTileX(1) - stripTileX(0)).toBe(game.tileWidth + 4);
  });

  it('AD-14 R-40 R-33 Q-49 scene place: not-legal cells dim in Place, cell 6 is used in frame 0 only and frames 1 to 4 draw the preview (owner decision D11)', async () => {
    // Per frame, cells 5 and 6: [glyphs, used, star count, empty] (the plan's frame table).
    const MATRIX: readonly Record<5 | 6, readonly [string[], boolean, number, boolean]>[] = [
      { 5: [[], false, 0, true], 6: [['L'], true, 0, false] },
      { 5: [[], false, 0, true], 6: [['D'], false, 1, false] },
      { 5: [['D'], false, 1, false], 6: [[], false, 0, true] },
      { 5: [[], false, 0, true], 6: [['D'], false, 1, false] },
      { 5: [[], false, 0, true], 6: [['E'], false, 1, false] },
      { 5: [[], false, 0, true], 6: [['E'], false, 0, false] },
    ];
    for (const reduced of [false, true]) {
      const html = await body(placeScene, reduced);
      const layers = placeLayers(html);
      expect(layers).toHaveLength(placeScene.frames.length);
      layers.forEach(({ cells }, i) => {
        const frame = placeScene.frames[i];
        const placing = frame.placeOrder !== undefined;
        expect(cells.map((c) => c.n)).toStrictEqual([3, 4, 5, 6, 7, 8, 9, 10]);
        for (const cell of cells) {
          const at = `frame ${i} cell ${cell.n}`;
          const legal = frame.lit?.includes(cell.n) === true || frame.placeTarget === cell.n;
          expect(cell.dim, at).toBe(placing && !legal);
          expect(cell.used, at).toBe(cell.n === 6 && frame.cell6 === 'used');
          expect(cell.markEl, at).toBe(i === 4 && cell.n === 6 ? 'mark-4' : undefined);
          if (cell.n === 5 || cell.n === 6) {
            const row = MATRIX[i][cell.n];
            expect([cell.glyphs, cell.used, cell.marks, cell.empty], at).toStrictEqual([...row]);
          } else {
            // The other cells are the fixture start's (cellCards): all empty in this scene.
            expect([cell.glyphs, cell.marks, cell.empty], at).toStrictEqual([[], 0, true]);
          }
        }
      });
      // The frame 2 empty preview of cell 6 is ringed as legal (R-40).
      expect(html.split('data-scene-el="place-')[3]).toMatch(
        /class="num[^"]*">6<\/span>\s*(?:<!--[^>]*-->\s*)*<div class="stack[^"]*\bempty\b[^"]*\blit\b/,
      );
      // Frames 1 to 4 dim exactly 7 to 10 (BALKED has six letters, R-40).
      expect(layers[1].cells.filter((c) => c.dim).map((c) => c.n)).toStrictEqual([7, 8, 9, 10]);
      // No count badge in any scene frame (owner decision 2026-10-29).
      for (const layer of html.split('data-scene-el="place-').slice(1))
        expect(layer).not.toContain('class="count');
    }
  });

  it('AD-14 Q-49 scene place: rendering throws when a Place frame names an after with no previews entries or has no after, or the fixture has no previews', async () => {
    const withFrame2 = (frame: Frame): Scene => ({
      ...placeScene,
      frames: placeScene.frames.map((f, i) => (i === 2 ? frame : f)),
    });
    const { after: _after, ...noAfter } = placeScene.frames[2];
    await expect(body(withFrame2({ ...placeScene.frames[2], after: 3 }), true)).rejects.toThrow(
      /^scene place: frame 2/,
    );
    await expect(body(withFrame2(noAfter), true)).rejects.toThrow(/^scene place: frame 2/);
    await expect(
      body({ ...placeScene, fixture: { ...placeScene.fixture, previews: undefined } }, true),
    ).rejects.toThrow(/^scene place: the fixture has no previews/);
  });

  it('AD-14 R-33 scene free-letter: from the tap on, cell 6 draws its top card in the used look, not a dimmed whole card (owner decision D11)', async () => {
    const html = await body(freeLetterScene);
    const overlays = html.split('class="cell6 cell').slice(1);
    expect(overlays).toHaveLength(freeLetterScene.frames.filter((f) => f.cell6 === 'used').length);
    for (const overlay of overlays)
      expect(overlay.slice(0, overlay.indexOf('</div></div>'))).toMatch(/class="card[^"]*\bused\b/);
  });

  it('AD-14 R-33 R-40 the dim and the used hatch have one source, app.css, read by the game and the scenes (owner decision D11)', () => {
    // Neither the game components nor the scene restate them (the computed 0.35, 0.4 and hatch are
    // asserted in the browser: e2e/place.spec.ts, e2e/how-to-play.spec.ts).
    for (const [file, css] of [
      ['Card.svelte', cardSource],
      ['WordCellRow.svelte', wordCellRowSource],
      ['Scene.svelte', source],
      ['Stage.svelte', stageSource],
    ] as const) {
      const style = css.slice(css.indexOf('<style>'));
      expect(style, file).not.toMatch(/opacity:\s*0?\.(35|4)\b|repeating-linear-gradient/);
    }
    expect(wordCellRowSource.match(/class:wc-dim=\{dim\}/g)).toHaveLength(2);
    expect(cardSource).toContain("class:used={mirror === 'used' || (mirror === 'static' && used)}");
    expect(source).toMatch(/class:wc-dim=\{frame\.placeOrder !== undefined && !lit && !target\}/);
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
    // Each wrapper draws the fixture card at its place (`QU` as the Qu glyph); the one visible at
    // the t=0 base (no opacity 0) is the fixture top card (R-65).
    const glyphs = (segment: string) =>
      [...segment.matchAll(/class="glyph[^"]*">([^<]+)</g)].map((m) => m[1]);
    const shown = (letter: string) => (letter === 'QU' ? 'Qu' : letter);
    const cells = scoringFixture.start.cells;
    const pieces = html.split('<div data-scene-el="grow-').slice(1);
    expect(pieces.map((piece) => glyphs(piece)[0])).toStrictEqual(
      [cells['3'], cells['4'], cells['6']].flat().map(shown),
    );
    for (const cell of ['3', '4', '6'] as const) {
      const visible = pieces.filter(
        (piece) => piece.startsWith(`${cell}-`) && !px(piece.split('>')[0]).includes('opacity:0'),
      );
      expect(
        visible.map((piece) => glyphs(piece)[0]),
        cell,
      ).toStrictEqual([shown(need(cells[cell].at(-1)))]);
    }
    const reduced = await body(scoringScene, true);
    expect(reduced).not.toContain('data-scene-el="grow-');
    // Frame 0 draws only the top cards (R-65): fixture-listed top letters T, T, E.
    const mini = (cell: number) =>
      (reduced.split(`data-cell="${cell}"`)[1] ?? '').split('class="cell')[0];
    for (const cell of [3, 4, 6]) expect((mini(cell).match(/class="card /g) ?? []).length).toBe(1);
    for (const cell of ['3', '4', '6'] as const)
      expect(glyphs(mini(Number(cell))), cell).toStrictEqual([shown(need(cells[cell].at(-1)))]);
  });
});

// Epic 8 ticket 10 (HP-4, HP-5, HP-6): the one Tricky rule scene against its fixture.
describe.each([
  // `applied`: per frame, the number of fixture commands applied (the ticket's `n`).
  ['source-drop', sourceDropScene, sourceDropFixture, text.howTo.scenes.sourceDrop, [0, 0, 1, 2]],
] as const)('AD-14 scene %s against its fixture', (name, scene, data, caption, applied) => {
  type Frames = readonly {
    validate?: string;
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
    for (const step of scene.steps) {
      if (step.type !== 'grab' && step.type !== 'drop') continue;
      const c = carryOf(scene);
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
    }
    // A mismatching carry throws at load.
    const carry = carryOf(scene);
    const wrong = { ...carry, count: carry.count + 1 };
    expect(() => defineScene({ ...scene, carry: wrong })).toThrow(
      /carry differs from fixture drop command/,
    );
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

  it('AD-14 frame 0 equals the start: tail home, no tray, nothing dimmed, and every cell of the start is drawn', async () => {
    expect(scene.frames[0]).toStrictEqual({ tail: 'home', tray: false, validate: 'off' });
    mocked.motion = { baseMs: 180, reduced: true };
    try {
      vi.resetModules();
      const { render } = await import('svelte/server');
      const { default: Scene } = await import('./Scene.svelte');
      const body = render(Scene, { props: { scene, ...fitOf(scene) } }).body;
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
      ['arrange', 'grab', 1],
    ]);
    const effects = sceneEffects(sourceDropScene);
    const tails = effects.flat().filter((e) => e.element === 'tail' && e.phase === 0);
    expect(tails.at(-1)?.keyframes[1].transform).toBe('translate(0px, 0px)');
    const out = sourceDropScene.targets.out;
    // R-14 Q-34: the out point is beyond the source column's hit rect (card width at its x); owner
    // decision D8: to its right, over the stage, not left of column 1.
    const sourceX = columnX(need(carryOf(sourceDropScene)).sourceColumn);
    expect(out.x).toBeGreaterThan(sourceX + CARD_W);
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
  it('AD-14 the Tricky rule scene follows the three basic scenes and scoring comes last', async () => {
    const { basicScenes, scenes } = await import('./index');
    expect(basicScenes.map((s) => s.id)).toStrictEqual(['move-compose', 'free-letter', 'place']);
    expect(scenes.map((s) => s.id)).toStrictEqual([
      ...basicScenes.map((s) => s.id),
      'source-drop',
      'scoring',
    ]);
  });
});

describe('AD-14 frame k and side against the engine-checked fixture block', () => {
  // The commands applied in each frame (the frame's `n`); the engine replay checks `block` (R-31).
  it.each([
    ['move-compose', moveComposeScene, moveComposeFixture.block, [0, 0, 1, 2, 3, 4, 5, 6]],
    ['free-letter', freeLetterScene, freeLetterFixture.block, [6, 7, 8, 9]],
    ['source-drop', sourceDropScene, sourceDropFixture.block, [0, 0, 1, 2]],
    ['place', placeScene, placeFixture.block, [3, 4, 5, 6, 7, 8]],
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

// Owner decision D5 (R-33): a frame draws WordCell 6 used exactly while the word holds its top
// card: after the fixture command that adds it as a free letter and before the Confirm that places
// the word (or a removal). Checked for every scene against the fixture commands it has applied.
// Q-49 supersedes D5 for the place scene's Place frames (1 to 4): they draw the preview, not the
// used card; its frame 0 keeps D5.
describe('AD-14 frame cell 6 state against the fixture commands', () => {
  const APPLIED: Record<string, readonly number[]> = {
    'move-compose': [0, 0, 1, 2, 3, 4, 5, 6],
    'free-letter': [6, 7, 8, 9],
    place: [3, 4, 5, 6, 7, 8],
    'source-drop': [0, 0, 1, 2],
  };
  const usedAfter = (commands: Scene['fixture']['commands'], n: number): boolean => {
    let used = false;
    for (const command of commands.slice(0, n)) {
      if (command.type === 'addFreeLetter' && command.cell === 6) used = true;
      if (command.type === 'confirm' || (command.type === 'removeFreeLetter' && command.cell === 6))
        used = false;
    }
    return used;
  };

  it.each(scenes.filter((s) => s.id !== 'scoring').map((s) => [s.id, s] as const))(
    'AD-14 R-33 scene %s: cell 6 is drawn used exactly while the applied fixture commands hold its top card, except on Place frames (Q-49)',
    (id, scene) => {
      const applied = APPLIED[id];
      expect(scene.frames).toHaveLength(applied.length);
      scene.frames.forEach((frame, i) => {
        if (usedAfter(scene.fixture.commands, applied[i]) && frame.placeOrder === undefined)
          expect(frame.cell6, `${id} frame ${i}`).toBe('used');
        else expect(frame.cell6, `${id} frame ${i}`).not.toBe('used');
      });
    },
  );

  it('AD-14 R-33 Q-49 scene place: cell 6 is used in frame 0 only, and Confirm draws its top', () => {
    expect(placeScene.frames.map((f) => f.cell6)).toStrictEqual([
      'used',
      undefined,
      undefined,
      undefined,
      undefined,
      'top',
    ]);
  });

  it('AD-14 Q-49 scene place: frame.after is the applied command count on frames 1 to 4, absent on frames 0 and 5', () => {
    expect(placeScene.frames.map((f) => f.after)).toStrictEqual(
      APPLIED.place.map((n, i) => (placeScene.frames[i].placeOrder === undefined ? undefined : n)),
    );
    expect(placeScene.frames.map((f) => f.after)).toStrictEqual([undefined, 4, 5, 6, 7, undefined]);
  });
});

describe('AD-14 frame tray letters against the engine-checked fixture drafts', () => {
  // The commands applied in each frame (the frame's `n`); the engine replay checks `drafts` (R-30,
  // R-51). A frame shows tray letters exactly where the fixture states them.
  it.each([
    ['move-compose', moveComposeScene, moveComposeFixture.drafts, [0, 0, 1, 2, 3, 4, 5, 6]],
    ['free-letter', freeLetterScene, freeLetterFixture.drafts, [6, 7, 8, 9]],
    ['place', placeScene, placeFixture.drafts, [3, 4, 5, 6, 7, 8]],
    ['source-drop', sourceDropScene, sourceDropFixture.drafts, [0, 0, 1, 2]],
  ] as const)(
    'AD-14 R-30 R-51 scene %s: every frame order and placement order equal the fixture drafts entry',
    (_n, scene, drafts, applied) => {
      expect(scene.frames).toHaveLength(applied.length);
      for (const [i, frame] of scene.frames.entries()) {
        const stated = drafts.find((d) => d.after === applied[i])?.letters;
        expect(frame.order ?? frame.placeOrder, `frame ${i}`).toStrictEqual(stated);
      }
    },
  );

  it('AD-14 R-51 scene place: the tucked letters equal the fixture drafts entry at Confirm', () => {
    const confirm = placeScene.steps.find((s) => s.tucks !== undefined);
    const command = placeScene.steps[placeScene.steps.indexOf(need(confirm)) - 1].command;
    expect(placeFixture.commands[need(command)].type).toBe('confirm');
    const stated = placeFixture.drafts.find((d) => d.after === need(command))?.letters;
    expect(confirm?.tucks?.letters).toStrictEqual(need(stated));
  });
});

// Motion on, the steps are what the player sees: each command step must aim the pointer at the
// control its fixture command names and reveal the layer of the frame that command produces.
describe('AD-14 command steps against their fixture commands', () => {
  // The commands applied in each frame (the frame's `n`, as the reduced-motion tests above).
  const APPLIED: Record<string, readonly number[]> = {
    'move-compose': [0, 0, 1, 2, 3, 4, 5, 6],
    'free-letter': [6, 7, 8, 9],
    place: [3, 4, 5, 6, 7, 8],
    'source-drop': [0, 0, 1, 2],
    scoring: [0, 0, 0, 0, 0, 0],
  };
  type Command = Scene['fixture']['commands'][number];
  const onColumn = (p: Point, column: number): boolean =>
    p.x >= columnX(column) && p.x <= columnX(column) + CARD_W;
  // The one table: the target a step carrying each fixture command type aims at (a name, or a
  // test of the point for a drop). `kBefore` is the fixture block's k before the command (R-31).
  const AIM: Record<
    string,
    (
      c: Command,
      step: Step,
      previous: Step | undefined,
      kBefore: number,
    ) => string | ((p: Point) => boolean)
  > = {
    drop: (c, step) => (p) =>
      onColumn(p, Number(step.type === 'grab' ? c.sourceColumn : c.destinationColumn)),
    setDestinationCount: (c, _step, _previous, kBefore) =>
      Number(c.k) > kBefore ? 'plus' : 'minus',
    flip: () => 'flip',
    validate: () => 'validate',
    addFreeLetter: (c) => `cell${c.cell}`,
    setTarget: (c) => `cell${c.cell}`,
    confirm: () => 'confirm',
    setPlacementOrder: () => 'front',
    // An arrange step's pointer fades where it is (effects.ts).
    arrange: (_c, _step, previous) => need(previous).target,
  };

  function aimProblems(scene: Scene): string[] {
    const problems: string[] = [];
    scene.steps.forEach((step, i) => {
      if (step.command === undefined) return;
      const command = scene.fixture.commands[step.command];
      const aim = AIM[command.type];
      if (aim === undefined) {
        problems.push(`step ${i}: no aim for ${command.type}`);
        return;
      }
      const kBefore =
        scene.fixture.block?.find((b) => b.after === step.command)?.k ??
        scene.carry?.destinationCount ??
        0;
      const expected = aim(command, step, scene.steps[i - 1], kBefore);
      const ok =
        typeof expected === 'string'
          ? step.target === expected
          : expected(scene.targets[step.target]);
      if (!ok) problems.push(`step ${i} (${command.type}) aims at ${step.target}`);
    });
    return problems;
  }

  // The frame layers a step reveals: its `tray-N` / `place-N` show, or the last place layer a tucks
  // step swaps in (effects.ts).
  const layersOf = (scene: Scene, step: Step): string[] =>
    step.tucks !== undefined
      ? [`place-${scene.frames.length - 1}`]
      : [step.reveal?.show ?? []].flat().filter((id) => /^(tray|place)-\d+$/.test(id));

  // Command c's layers: those revealed from the last step naming c up to the next command step;
  // they must be exactly the first frame whose `n` is c + 1. No other step reveals a frame layer.
  function revealProblems(scene: Scene): string[] {
    const applied = APPLIED[scene.id];
    const prefix = scene.frames.some((f) => f.lit !== undefined) ? 'place' : 'tray';
    const problems: string[] = [];
    const revealed = new Map<number, string[]>();
    scene.steps.forEach((step, i) => {
      const owner = scene.steps.slice(0, i + 1).findLast((s) => s.command !== undefined)?.command;
      const done =
        owner !== undefined && !scene.steps.slice(i + 1).some((s) => s.command === owner);
      const layers = layersOf(scene, step);
      if (!done) {
        if (layers.length > 0) problems.push(`step ${i} reveals ${layers} before its command ends`);
        return;
      }
      revealed.set(owner, [...(revealed.get(owner) ?? []), ...layers]);
    });
    for (const c of new Set(
      scene.steps.flatMap((s) => (s.command === undefined ? [] : [s.command])),
    )) {
      const expected = [`${prefix}-${applied.indexOf(c + 1)}`];
      const got = revealed.get(c) ?? [];
      if (got.join() !== expected.join())
        problems.push(`command ${c} reveals ${got.join() || 'nothing'}, not ${expected}`);
    }
    return problems;
  }

  const restep = (scene: Scene, i: number, patch: Partial<Step>): Scene => ({
    ...scene,
    steps: scene.steps.map((s, j) => (j === i ? { ...s, ...patch } : s)),
  });
  const stepOf = (scene: Scene, command: number, type?: string): number =>
    scene.steps.findIndex((s) => s.command === command && (type === undefined || s.type === type));

  it('AD-14 every scene: the APPLIED table covers its frames', () => {
    expect(scenes.map((s) => s.id).sort()).toStrictEqual(Object.keys(APPLIED).sort());
    for (const scene of scenes)
      expect(scene.frames, scene.id).toHaveLength(APPLIED[scene.id].length);
  });

  it.each(scenes.map((s) => [s.id, s] as const))(
    'AD-14 scene %s: each command step aims at the control its fixture command names and reveals the frame after it',
    (_id, scene) => {
      expect(aimProblems(scene)).toStrictEqual([]);
      expect(revealProblems(scene)).toStrictEqual([]);
    },
  );

  it.each([
    [
      'setDestinationCount up, plus → minus',
      moveComposeScene,
      stepOf(moveComposeScene, 1),
      'minus',
    ],
    [
      'setDestinationCount down, minus → plus',
      moveComposeScene,
      stepOf(moveComposeScene, 3),
      'plus',
    ],
    ['flip → plus', moveComposeScene, stepOf(moveComposeScene, 4), 'plus'],
    ['validate → cell6', freeLetterScene, stepOf(freeLetterScene, 8), 'cell6'],
    [
      'arrange step moving the pointer off the tapped cell',
      freeLetterScene,
      stepOf(freeLetterScene, 7),
      'validate',
    ],
    ['addFreeLetter cell 6 → validate', freeLetterScene, stepOf(freeLetterScene, 6), 'validate'],
    ['setTarget cell 5 → cell6', placeScene, stepOf(placeScene, 4), 'cell6'],
    ['confirm → validate', placeScene, stepOf(placeScene, 7), 'validate'],
    ['setPlacementOrder → dtile', placeScene, stepOf(placeScene, 6), 'dtile'],
    ['grab over the destination', moveComposeScene, stepOf(moveComposeScene, 0, 'grab'), 'over'],
    ['drop over the source', moveComposeScene, stepOf(moveComposeScene, 0, 'drop'), 'grab'],
    ['arrange step moving the pointer', moveComposeScene, stepOf(moveComposeScene, 5), 'plus'],
    ['arrange step moving the pointer out', sourceDropScene, stepOf(sourceDropScene, 1), 'out'],
  ] as const)('AD-14 a mutated copy fails the aim check: %s', (_name, scene, i, target) => {
    expect(i).toBeGreaterThanOrEqual(0);
    // (Moving the step before an arrange step also moves where that arrange's pointer must stay.)
    expect(aimProblems(restep(scene, i, { target }))).toContainEqual(
      expect.stringMatching(new RegExp(`^step ${i} \\(`)),
    );
  });

  it('AD-14 a mutated copy fails the reveal check: a shifted, a missing or an early layer', () => {
    const shown = (scene: Scene, i: number, show: string): Partial<Step> => ({
      reveal: { ...need(scene.steps[i].reveal), show },
    });
    const tray3 = stepOf(moveComposeScene, 1);
    expect(moveComposeScene.steps[tray3].reveal?.show).toBe('tray-3');
    expect(
      revealProblems(restep(moveComposeScene, tray3, shown(moveComposeScene, tray3, 'tray-4'))),
    ).toStrictEqual(['command 1 reveals tray-4, not tray-3']);
    const place2 = stepOf(placeScene, 4);
    expect(
      revealProblems(restep(placeScene, place2, shown(placeScene, place2, 'place-3'))),
    ).toStrictEqual(['command 4 reveals place-3, not place-2']);
    const cell6 = stepOf(freeLetterScene, 6);
    expect(revealProblems(restep(freeLetterScene, cell6, { reveal: undefined }))).toStrictEqual([
      'command 6 reveals nothing, not tray-1',
    ]);
    // The tray opens on the fly after the drop: shown on the grab instead, it opens too early.
    const fly = sourceDropScene.steps.findIndex((s) => s.type === 'fly');
    const grab = stepOf(sourceDropScene, 0, 'grab');
    const early = restep(restep(sourceDropScene, fly, { reveal: undefined }), grab, {
      reveal: need(sourceDropScene.steps[fly].reveal),
    });
    expect(revealProblems(early)).toStrictEqual([
      `step ${grab} reveals tray-2 before its command ends`,
      'command 0 reveals nothing, not tray-2',
    ]);
    // The Confirm tap's frame is the last place layer, which the tucks step swaps in.
    const tucks = placeScene.steps.findIndex((s) => s.tucks !== undefined);
    expect(revealProblems(restep(placeScene, tucks, { tucks: undefined }))).toStrictEqual([
      'command 7 reveals nothing, not place-5',
    ]);
  });
});

// The board a carried scene draws on frame 0 (columns, tail, D block) is the fixture start; the
// place scene's board is the engine's after Confirm (R-60).
describe('AD-14 the drawn board against the fixture', () => {
  async function render(scene: Scene, reduced: boolean): Promise<string> {
    mocked.motion = { baseMs: 180, reduced };
    try {
      vi.resetModules();
      const { render: ssr } = await import('svelte/server');
      const { default: Scene } = await import('./Scene.svelte');
      return ssr(Scene, { props: { scene, ...fitOf(scene) } }).body;
    } finally {
      mocked.motion = { baseMs: 180, reduced: false };
    }
  }
  const glyphs = (segment: string): string[] =>
    [...segment.matchAll(/class="glyph[^"]*">([^<]+)</g)].map((m) => (m[1] === 'Qu' ? 'QU' : m[1]));
  // Each stage column's glyphs, far end first, with its filler (stage.ts) split off.
  function columnsOf(body: string, scene: Scene) {
    const filler = fillerColumns(scene.fixture.start.columns.map((c) => c.length));
    const segments = body
      .slice(0, body.indexOf('class="tray-frame'))
      .split('<div class="column ')
      .slice(1);
    expect(segments).toHaveLength(8);
    return segments.map((segment, i) => {
      expect(segment).toContain(`data-column="${i + 1}"`);
      const all = glyphs(segment);
      expect(all.slice(0, filler[i].length), `column ${i + 1} filler`).toStrictEqual(filler[i]);
      return { rows: all.length, scripted: all.slice(filler[i].length) };
    });
  }
  // A wrapper's glyphs and its left and top px, up to the next scene element that is not its own.
  function wrapper(body: string, id: string) {
    const from = body.indexOf(`data-scene-el="${id}"`);
    expect(from).toBeGreaterThan(0);
    const rest = body.slice(from + 1);
    const next = rest.search(new RegExp(`data-scene-el="(?!${id}-)`));
    const tag = rest.slice(0, rest.indexOf('>'));
    const px = (prop: string) => Number(new RegExp(`${prop}: (-?[\\d.]+)px`).exec(tag)?.[1]);
    return { glyphs: glyphs(rest.slice(0, next)), left: px('left'), top: px('top'), tag };
  }

  const carried = scenes.filter((s) => s.carry !== undefined && s.carry.landed !== true);

  it('AD-14 the carried scenes are move-compose and source-drop', () => {
    expect(carried.map((s) => s.id)).toStrictEqual(['move-compose', 'source-drop']);
  });

  it.each(carried.map((s) => [s.id, s] as const))(
    'AD-14 R-21 scene %s: frame 0 draws each start column whole: its scripted cards, the D block, then the tail, in stage order',
    async (_id, scene) => {
      const body = await render(scene, true);
      const c = carryOf(scene);
      const columns = columnsOf(body, scene);
      const dest = wrapper(body, 'dest');
      const tail = wrapper(body, 'tail');
      for (const { tag } of [dest, tail]) expect(tag).not.toContain('visibility');
      columns.forEach(({ scripted }, i) => {
        const column = i + 1;
        const drawn = [
          ...scripted,
          ...(column === c.destinationColumn ? dest.glyphs : []),
          ...(column === c.sourceColumn ? tail.glyphs : []),
        ];
        expect(drawn, `column ${column}`).toStrictEqual(scene.fixture.start.columns[i] ?? []);
      });
      // Stage order: the D block sits right under its column's cards, the tail under its column's
      // (and, on the source column, R-21, under the D block too).
      const same = c.sourceColumn === c.destinationColumn;
      expect([dest.left, dest.top]).toStrictEqual([
        columnX(c.destinationColumn),
        columns[c.destinationColumn - 1].rows * STRIP,
      ]);
      expect([tail.left, tail.top]).toStrictEqual([
        columnX(c.sourceColumn),
        (columns[c.sourceColumn - 1].rows + (same ? dest.glyphs.length : 0)) * STRIP,
      ]);
    },
  );

  it('AD-14 R-60 scene place: the drawn columns equal the fixture columns entry after Confirm', async () => {
    const entry = need(placeFixture.columns.at(-1));
    expect(entry.after).toBe(placeFixture.commands.length);
    expect(placeFixture.commands[entry.after - 1].type).toBe('confirm');
    // The stage's columns are drawn once for every frame (not per frame), so the post-Confirm frame
    // shows the board every render shows.
    expect(source).toContain('<Stage columns={drawn.columns}');
    for (const reduced of [true, false]) {
      const columns = columnsOf(await render(placeScene, reduced), placeScene);
      expect(columns.map((c) => c.scripted)).toStrictEqual(
        Array.from({ length: 8 }, (_, i) => entry.columns[i] ?? []),
      );
    }
  });
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
    expect(sourceDropScene.frames.map((f) => f.dest)).toStrictEqual([
      undefined,
      undefined,
      'gone',
      'gone',
    ]);
  });

  it('AD-14 every scene: from the frame a step reveal hides the D block on (its tray-N), each reduced-motion frame hides it', () => {
    const checked: string[] = [];
    for (const scene of scenes) {
      for (const step of scene.steps) {
        if (step.reveal?.hide.includes('dest') !== true) continue;
        const layer = [step.reveal.show ?? []].flat().find((el) => /^tray-\d+$/.test(el));
        const from = Number(need(layer).slice('tray-'.length));
        scene.frames.forEach((frame, i) => {
          if (i >= from) expect(frameDest(frame).hidden, `${scene.id} frame ${i}`).toBe(true);
        });
        checked.push(scene.id);
      }
    }
    expect(checked).toStrictEqual(['move-compose', 'source-drop']);
  });
});

// Epic 8 ticket 7 (HP-3, HP-5, HP-6): scene 2 against its fixture, the arrange step, continuity.
describe('AD-14 scene free-letter against its fixture', () => {
  const data = freeLetterFixture;
  const opens = need(data.opens);
  // Frame i = the state after `opens + i` fixture commands (frame 0 is scene 1's final position).
  const applied = [opens, opens + 1, opens + 2, opens + 3];

  it('AD-14 the steps carry fixture commands from opens on, in order, and the scene id equals the fixture', () => {
    const indexes = freeLetterScene.steps.flatMap((s) =>
      s.command === undefined ? [] : [s.command],
    );
    expect(indexes).toStrictEqual([opens, opens + 1, opens + 2]);
    expect(data.commands.slice(opens).map((c) => c.type)).toStrictEqual([
      'addFreeLetter',
      'arrange',
      'validate',
    ]);
    expect(freeLetterScene.steps.map((s) => s.type)).toStrictEqual(['tap', 'arrange', 'tap']);
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
    expect(freeLetterScene.frames.map((f) => f.cell6)).toStrictEqual([
      'top',
      'used',
      'used',
      'used',
    ]);
  });

  it('AD-14 frame 0 deep-equals the last frame of move-compose (tile order, k, side, cell 6) and the board and tail are the same', () => {
    expect(freeLetterScene.frames[0]).toStrictEqual(moveComposeScene.frames.at(-1));
    expect(freeLetterScene.fixture.start).toStrictEqual(moveComposeScene.fixture.start);
    expect(freeLetterScene.carry).toStrictEqual({ ...need(moveComposeScene.carry), landed: true });
    // The pointer rests in the same corner; only the column area's height differs per scene.
    expect(freeLetterScene.targets.rest.x).toBe(moveComposeScene.targets.rest.x);
  });

  it('AD-14 every scene animates each of its fixture arrange commands as an arrange tile glide, never a pointer move (owner decisions D3 D4)', () => {
    const glides: string[] = [];
    for (const scene of scenes)
      for (const step of scene.steps) {
        if (step.command === undefined) continue;
        const arrange = scene.fixture.commands[step.command].type === 'arrange';
        expect(step.type === 'arrange', `${scene.id} step ${step.command}`).toBe(arrange);
        if (arrange) glides.push(scene.id);
      }
    expect(glides).toStrictEqual(['move-compose', 'free-letter', 'source-drop']);
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

describe('AD-14 every arrange step and the pointer across scenes', () => {
  it('AD-14 every arrange step of every scene glides exactly the tiles whose place changed, by their slot distance', () => {
    let checked = 0;
    for (const scene of scenes) {
      const effects = sceneEffects(scene);
      scene.steps.forEach((step, i) => {
        if (step.type !== 'arrange') return;
        const frame = Number(String(step.reveal?.show).slice('tray-'.length));
        const before = need(scene.frames[frame - 1].order);
        const after = need(scene.frames[frame].order);
        const taken = new Set<number>();
        const expected = Object.fromEntries(
          after.flatMap((letter, j) => {
            const from = before.findIndex((l, k) => l === letter && !taken.has(k));
            taken.add(from);
            return from === j
              ? []
              : [[`tray-${frame}-tile-${j}`, `translate(${(from - j) * RICH_SLOT}px, 0px)`]];
          }),
        );
        const glided = Object.fromEntries(
          effects[i]
            .filter((e) => /-tile-/.test(e.element))
            .map((e) => [e.element, e.keyframes[0].transform]),
        );
        expect(glided, `${scene.id} step ${i}`).toStrictEqual(expected);
        expect(Object.keys(glided).length).toBeGreaterThan(0);
        checked++;
      });
    }
    expect(checked).toBe(3);
  });

  it('AD-14 every scene: the pointer is visible whenever it moves, also after an arrange or a tuck faded it out', () => {
    for (const scene of scenes) {
      let opacity = 0;
      sceneEffects(scene).forEach((step, i) => {
        for (const effect of step.filter((e) => e.element === 'ghost')) {
          const [first, last] = [effect.keyframes[0], effect.keyframes.at(-1)];
          if (last?.opacity !== undefined) opacity = Number(last.opacity);
          if (first.transform !== undefined && first.transform !== last?.transform)
            expect(opacity, `${scene.id} step ${i}`).toBe(1);
        }
      });
    }
    // Scene 2's Validate tap follows the arrange that faded the pointer: it fades in again.
    const tap = freeLetterScene.steps.findIndex((s) => s.target === 'validate');
    expect(freeLetterScene.steps[tap - 1].type).toBe('arrange');
    const ghost = sceneEffects(freeLetterScene)[tap].find((e) => e.element === 'ghost');
    expect(ghost?.keyframes.map((k) => k.opacity)).toStrictEqual([0, 1]);
  });

  it('AD-14 every scene: every pointer target and the carried cards at every step stay on the stage (owner decision D8)', () => {
    const translate = (value: unknown): Point => {
      const m = /translate\((-?[\d.]+)px, (-?[\d.]+)px\)/.exec(String(value));
      if (m === null) throw new Error(`no translate in ${String(value)}`);
      return { x: Number(m[1]), y: Number(m[2]) };
    };
    for (const scene of scenes) {
      const { stageH } = stageGeometry(scene.stage);
      const inside = (x: number, y: number, w: number, h: number, what: string) => {
        expect(x, `${scene.id} ${what} left`).toBeGreaterThanOrEqual(0);
        expect(y, `${scene.id} ${what} top`).toBeGreaterThanOrEqual(0);
        expect(x + w, `${scene.id} ${what} right`).toBeLessThanOrEqual(STAGE_W);
        expect(y + h, `${scene.id} ${what} bottom`).toBeLessThanOrEqual(stageH);
      };
      for (const [name, p] of Object.entries(scene.targets))
        inside(p.x - HAND_TIP.x, p.y - HAND_TIP.y, HAND_W, HAND_H, name);
      if (scene.carry === undefined || scene.layout === undefined) continue;
      const home = scene.layout.tailHome;
      const tallH = (scene.carry.count - 1) * STRIP + CARD_H;
      for (const effect of sceneEffects(scene).flat())
        if (effect.element === 'tail')
          for (const frame of effect.keyframes.filter((k) => k.transform !== undefined)) {
            const at = translate(frame.transform);
            inside(home.x + at.x, home.y + at.y, SLOT, tallH, 'carried tail');
          }
    }
  });
});

// Owner decision D10 (2026-10-22; R-31): a destination card in the frame's D block is drawn in the
// tray only, never also in its column, and it fades out of (or back into) the column with the +/−
// reveal that changes k.
describe('AD-14 the destination column against the frame k', () => {
  const carried = scenes.filter((s) => s.carry !== undefined);
  // The destination column as the drop finds it (R-21: a drop on the source column lands on what
  // the lift left).
  const destinationOf = (scene: Scene): readonly string[] =>
    destinationCards(scene.fixture, carryOf(scene));
  // The cards frame `frame` draws in the destination column (the D block wrapper aside).
  const visible = (scene: Scene, frame: Frame): readonly string[] => {
    const { column, cards } = joinCards(scene.fixture, scene.carry, scene.frames);
    const hidden = new Set(cards.filter((c) => joinHidden(frame, c.depth)).map((c) => c.index));
    return drawnColumns(scene.fixture, scene.carry)[column - 1].filter((_, i) => !hidden.has(i));
  };

  it.each(carried.map((s) => [s.id, s] as const))(
    'AD-14 R-31 scene %s: every open tray frame draws the destination column without its last k cards',
    (_id, scene) => {
      const dest = destinationOf(scene);
      for (const [i, frame] of scene.frames.entries()) {
        if (frame.k === undefined) continue;
        expect(visible(scene, frame), `frame ${i}`).toStrictEqual(
          dest.slice(0, dest.length - frame.k),
        );
      }
    },
  );

  it('AD-14 R-31 scenes 1 and 2: column 3 reads M F N D, then M F N at k 2 and M F at k 3', () => {
    expect(moveComposeScene.frames.map((f) => visible(moveComposeScene, f).join(''))).toStrictEqual(
      ['MFND', 'MFND', 'MFND', 'MFN', 'MF', 'MFN', 'MFN', 'MFN'],
    );
    expect(freeLetterScene.frames.map((f) => visible(freeLetterScene, f).join(''))).toStrictEqual([
      'MFN',
      'MFN',
      'MFN',
      'MFN',
    ]);
  });

  it.each(carried.map((s) => [s.id, s] as const))(
    'AD-14 R-31 scene %s: the reveal that shows a frame fades exactly the destination cards whose state changes, with the tray layer',
    (_id, scene) => {
      const effects = sceneEffects(scene);
      const { cards } = joinCards(scene.fixture, scene.carry, scene.frames);
      scene.steps.forEach((step, i) => {
        const layer = [step.reveal?.show ?? []].flat().find((id) => /^tray-\d+$/.test(id));
        const n = layer === undefined ? undefined : Number(layer.slice('tray-'.length));
        const expected =
          n === undefined
            ? []
            : cards.flatMap(({ depth }) => {
                const [was, is] = [
                  joinHidden(scene.frames[n - 1], depth),
                  joinHidden(scene.frames[n], depth),
                ];
                return was === is
                  ? []
                  : [[`join-${depth}`, was ? 0 : 1, is ? 0 : 1, step.reveal?.kind, 1]];
              });
        expect(
          effects[i]
            .filter((e) => e.element.startsWith('join-'))
            .map((e) => [
              e.element,
              e.keyframes[0].opacity,
              e.keyframes[1].opacity,
              e.kind,
              e.phase,
            ]),
          `step ${i}`,
        ).toStrictEqual(expected);
      });
    },
  );

  it('AD-14 R-31 scene move-compose: + fades D then N out of column 3 and − fades N back in', () => {
    const fades = sceneEffects(moveComposeScene).flatMap((step, i) =>
      step
        .filter((e) => e.element.startsWith('join-'))
        .map((e) => [moveComposeScene.steps[i].target, e.element, e.keyframes[1].opacity]),
    );
    expect(fades).toStrictEqual([
      ['plus', 'join-1', 0],
      ['plus', 'join-2', 0],
      ['minus', 'join-2', 1],
    ]);
  });

  it('AD-14 R-31 the drawn column wraps each joining card, its base the frame-0 state (scene 2 opens at k 2 without D)', async () => {
    const wrappers = async (scene: Scene, reduced: boolean) => {
      mocked.motion = { baseMs: 180, reduced };
      try {
        vi.resetModules();
        const { render } = await import('svelte/server');
        const { default: Scene } = await import('./Scene.svelte');
        const html = render(Scene, { props: { scene, ...fitOf(scene) } }).body;
        const column = html.split('data-column="3"')[1].split('<div class="column')[0];
        return [
          ...column.matchAll(
            /data-scene-el="(join-\d)"([^>]*)>[\s\S]*?class="glyph[^"]*">([^<]+)</g,
          ),
        ].map((m) => [m[1], m[3], /opacity:\s*0/.test(m[2])]);
      } finally {
        mocked.motion = { baseMs: 180, reduced: false };
      }
    };
    for (const reduced of [false, true]) {
      expect(await wrappers(moveComposeScene, reduced)).toStrictEqual([
        ['join-2', 'N', false],
        ['join-1', 'D', false],
      ]);
      expect(await wrappers(freeLetterScene, reduced)).toStrictEqual([['join-1', 'D', true]]);
    }
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
