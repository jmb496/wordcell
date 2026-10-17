import { describe, expect, it, vi } from 'vitest';
import destinationRuleFixture from '../../../fixtures/how-to-play-destination-rule.json';
import freeLetterFixture from '../../../fixtures/how-to-play-free-letter.json';
import moveComposeFixture from '../../../fixtures/how-to-play-move-compose.json';
import placeFixture from '../../../fixtures/how-to-play-place.json';
import scoringFixture from '../../../fixtures/how-to-play-scoring.json';
import sourceDropFixture from '../../../fixtures/how-to-play-source-drop.json';
import topCardFixture from '../../../fixtures/how-to-play-top-card.json';
import { sceneStageHeight } from '../layout/geometry';
import { text } from '../text';
import { destinationRuleScene } from './destination-rule';
import { frameDest, sceneEffects } from './effects';
import effectsSource from './effects.ts?raw';
import { freeLetterScene } from './free-letter';
import { CARD_W, columnX, LIFT, MIN_COLUMN_CARDS, RICH_SLOT, STAGE_INPUTS } from './geometry';
import { moveComposeScene } from './move-compose';
import { placeScene } from './place';
import { type AnimationHandle, type PlayerDeps, restMs, ScenePlayer } from './player';
import playerSource from './player.ts?raw';
import source from './Scene.svelte?raw';
import { scoringScene } from './scoring';
import { defineScene } from './script';
import { sourceDropScene } from './source-drop';
import { FILLER_LETTERS } from './stage';
import { topCardScene } from './top-card';
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
    });
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
    const fly = effects[placeScene.steps.findIndex((s) => s.type === 'fly')];
    expect(fly.filter((e) => e.element === 'strip-4' && e.phase === 0)).toHaveLength(1);
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
  it('AD-14 R-80 the four steps are commandless taps revealing 9, 16, 36 and the total 61', () => {
    expect(scoringFixture.commands).toStrictEqual([]);
    expect(scoringScene.id).toBe(scoringFixture.scene);
    expect(scoringScene.caption).toBe(text.howTo.scenes.scoring);
    expect(scoringScene.carry).toBeUndefined();
    expect(scoringScene.steps.map((s) => [s.type, s.command, s.reveal?.show])).toStrictEqual([
      ['tap', undefined, 'score-1'],
      ['tap', undefined, 'score-2'],
      ['tap', undefined, 'score-3'],
      ['tap', undefined, 'total'],
    ]);
    expect(scoringFixture.cellScores.map((c) => c.score)).toStrictEqual([9, 16, 36]);
    expect(scoringFixture.scores).toStrictEqual([{ after: 0, score: 61 }]);
  });

  it('AD-14 R-80 frames reveal one more per-cell figure each, the last adds the stated total', () => {
    expect(scoringScene.frames.map((f) => [f.numbers, f.total])).toStrictEqual([
      [0, undefined],
      [1, undefined],
      [2, undefined],
      [3, undefined],
      [3, scoringFixture.scores[0].score],
    ]);
    for (const frame of scoringScene.frames) {
      expect(frame.tail).toBe('gone');
      expect(frame.tray).toBe(false);
      expect(frame.order).toBeUndefined();
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
    // Eight columns of filler (5 cards each) and the stacks 3 + 3 + 6.
    expect(html.match(/class="card[^"]*static/g)).toHaveLength(8 * MIN_COLUMN_CARDS + 12);
    expect(html).not.toContain('>Z<');
    expect(html).not.toContain('data-scene-el="tail');
    expect(html).not.toContain('data-card-id');
  });
});

// Epic 8 ticket 4 (HP-4, HP-5, HP-6): the Tricky rules scenes against their fixtures.
describe.each([
  // `applied`: per frame, the number of fixture commands applied (the ticket's `n`).
  ['source-drop', sourceDropScene, sourceDropFixture, text.howTo.scenes.sourceDrop, [0, 0, 1, 2]],
  [
    'destination-rule',
    destinationRuleScene,
    destinationRuleFixture,
    text.howTo.scenes.destinationRule,
    [0, 0, 1, 2, 2, 3, 4, 5],
  ],
  ['top-card', topCardScene, topCardFixture, text.howTo.scenes.topCard, [0, 0, 1, 2]],
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

describe('AD-14 scene destination-rule', () => {
  it('AD-14 R-31 R-22 Q-12 Q-27 frames: half 1 BAT with B locked, undone, half 2 B alone (k 0) then A and T from the cells', () => {
    expect(
      destinationRuleScene.frames.map((f) => [f.tail, f.dest, f.order?.join(''), f.k, f.used]),
    ).toStrictEqual([
      ['home', undefined, undefined, undefined, undefined],
      ['lifted', undefined, undefined, undefined, undefined],
      ['gone', 'gone', 'BAT', 1, undefined],
      ['home', undefined, undefined, undefined, undefined],
      ['home', 'lifted', undefined, undefined, undefined],
      ['home', 'gone', 'B', 0, undefined],
      ['home', 'gone', 'BA', 0, [3]],
      ['home', 'gone', 'BAT', 0, [3, 4]],
    ]);
  });

  it('AD-14 R-31 the second half lifts the D block (the same B), not the tail; the undo returns what flew into the tray', () => {
    const effects = sceneEffects(destinationRuleScene);
    const undo = destinationRuleScene.steps.findIndex((s) => s.command === 1);
    const back = effects[undo].filter((e) => e.phase === 1 && e.element !== 'tray-2');
    expect(back.map((e) => e.element).sort()).toStrictEqual(['dest', 'tail', 'tail-0', 'tail-1']);
    for (const e of back) expect(e.keyframes[1].transform).toBe('translate(0px, 0px)');
    // After the undo, no tail effect moves it again, and the half-2 grab, move and drop act on dest.
    const grab2 = destinationRuleScene.steps.findIndex((s) => s.type === 'grab' && s.command === 2);
    const later = effects.slice(grab2).flat();
    expect(later.some((e) => e.element === 'tail' || e.element.startsWith('tail-'))).toBe(false);
    const lift = effects[grab2].find((e) => e.element === 'dest');
    expect(lift?.keyframes[0].transform).toBe('translate(0px, 0px)');
    expect(lift?.keyframes[1].transform).toBe('translate(0px, -8px)');
    const fly =
      effects[destinationRuleScene.steps.findIndex((s, i) => i > grab2 && s.type === 'fly')];
    expect(fly.filter((e) => e.phase === 0).map((e) => e.element)).toStrictEqual(['dest']);
  });

  it('AD-1 a lifts-dest carry that matches its drop command but not the scene D block throws the lifts message', () => {
    // Carry 2 equals fixture command 2 (column 2, 1 card, to column 3); the primary carry now has
    // two D cards, so lifting "the D block" of 1 card is inconsistent.
    expect(() =>
      defineScene({
        ...destinationRuleScene,
        carry: { ...carryOf(destinationRuleScene), destinationCount: 2 },
      }),
    ).toThrow(/step 5 \(grab\) lifts a D block the scene does not have/);
  });

  it('AD-14 the Undo tap names the fixture undo command, reveals no layer and hides tray-2', () => {
    const step = destinationRuleScene.steps.find((s) => s.target === 'undo');
    expect(step?.type).toBe('tap');
    expect(destinationRuleFixture.commands[step?.command ?? -1]).toStrictEqual({ type: 'undo' });
    expect(step?.reveal?.show).toBeUndefined();
    expect(step?.reveal?.hide).toStrictEqual(['tray-2']);
  });

  it('AD-3 the Undo pill is aria-hidden stage markup labelled by text.undo, with no test id', async () => {
    mocked.motion = { baseMs: 180, reduced: false };
    vi.resetModules();
    const { render } = await import('svelte/server');
    const { default: Scene } = await import('./Scene.svelte');
    const body = render(Scene, { props: { scene: destinationRuleScene, ...FIT } }).body;
    expect(body).toMatch(new RegExp(`data-scene-el="undo"[^>]*>${text.undo}</span>`));
    expect(body).not.toContain('data-testid');
    const outside = body.slice(body.indexOf('<button'));
    expect(outside).not.toContain(text.undo);
  });
});

describe('AD-14 scene top-card', () => {
  it('AD-14 R-33 Q-31 the free letter is cell 5 at index 0 and the second tap on cell 5 carries no command', () => {
    expect(topCardFixture.commands[1]).toStrictEqual({ type: 'addFreeLetter', cell: 5, index: 0 });
    const taps = topCardScene.steps.filter((s) => s.type === 'tap');
    expect(taps.map((s) => [s.target, s.command])).toStrictEqual([
      ['cell5', 1],
      ['cell5', undefined],
    ]);
    // The throw lives only in the fixture's rejected list.
    expect(topCardFixture.rejected[0].check).toBe('r33-free-letter-duplicate');
    expect(topCardScene.frames).toHaveLength(4);
    expect(topCardScene.frames[3].used).toStrictEqual([5]);
    expect(topCardFixture.start.columns[1]).toStrictEqual([]);
  });

  it('AD-14 the second tap animates only the pointer: no reveal, no layer, nothing dimmed again', () => {
    const effects = sceneEffects(topCardScene);
    const second = effects.at(-1) ?? [];
    expect(second.map((e) => e.element)).toStrictEqual(['ghost']);
  });
});

describe('AD-14 the scenes in the panel order', () => {
  it('AD-14 the three Tricky rules scenes follow the four basic scenes', async () => {
    const { basicScenes, trickyScenes, scenes } = await import('./index');
    expect(basicScenes.map((s) => s.id)).toStrictEqual([
      'move-compose',
      'free-letter',
      'place',
      'scoring',
    ]);
    expect(trickyScenes.map((s) => s.id)).toStrictEqual([
      'source-drop',
      'destination-rule',
      'top-card',
    ]);
    expect(scenes.map((s) => s.id)).toStrictEqual(
      [...basicScenes, ...trickyScenes].map((s) => s.id),
    );
  });
});

describe('AD-14 frame k and side against the engine-checked fixture block', () => {
  // The commands applied in each frame (the frame's `n`); the engine replay checks `block` (R-31).
  it.each([
    ['move-compose', moveComposeScene, moveComposeFixture.block, [0, 0, 1, 2, 3, 4, 5, 6]],
    ['free-letter', freeLetterScene, freeLetterFixture.block, [6, 7, 8]],
    ['source-drop', sourceDropScene, sourceDropFixture.block, [0, 0, 1, 2]],
    [
      'destination-rule',
      destinationRuleScene,
      destinationRuleFixture.block,
      [0, 0, 1, 2, 2, 3, 4, 5],
    ],
    ['top-card', topCardScene, topCardFixture.block, [0, 0, 1, 2]],
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

describe('AD-14 frameDest and the Tricky rules frames', () => {
  it('AD-14 frameDest: lifted raises by LIFT and is shown, gone is hidden, absent stays at home', () => {
    const frame = { tail: 'home', tray: false } as const;
    expect(frameDest({ ...frame, dest: 'lifted' })).toStrictEqual({
      transform: `translate(0px, ${-LIFT}px)`,
      hidden: false,
    });
    expect(frameDest({ ...frame, dest: 'gone' })).toStrictEqual({ hidden: true });
    expect(frameDest(frame)).toStrictEqual({ hidden: false });
  });

  it('AD-14 the Tricky rules frames name the D block as the ticket lists: gone once the tray is open, lifted when half 2 lifts B', async () => {
    const { trickyScenes } = await import('./index');
    expect(trickyScenes.map((s) => s.frames.map((f) => f.dest))).toStrictEqual([
      [undefined, undefined, 'gone', 'gone'],
      [undefined, undefined, 'gone', undefined, 'lifted', 'gone', 'gone', 'gone'],
      [undefined, undefined, 'gone', 'gone'],
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

  it('AD-14 the first step of scene 2 is a tap from the rest point: the pointer is at rest at its start', () => {
    expect(freeLetterScene.steps[0].type).toBe('tap');
    const [first] = sceneEffects(freeLetterScene)[0].filter((e) => e.element === 'ghost');
    expect(first.keyframes[0].opacity).toBe(0);
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
      return sceneEffects(moveComposeScene)
        [index].filter((e) => e.element === 'ghost')
        .reduce((ms, e) => ms + duration(e.kind) * e.times, 0);
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
});

describe('AD-14 scene captions come from text.ts', () => {
  it('AD-14 HP-6 each figure caption equals its text.ts string; scene 2 holds the owner sentence verbatim', () => {
    expect(moveComposeScene.caption).toBe(text.howTo.scenes.moveCompose);
    expect(freeLetterScene.caption).toBe(text.howTo.scenes.freeLetter);
    expect(text.howTo.scenes.freeLetter).toContain(
      'The top card of each WordCell can be used as a free letter added to the word.',
    );
  });
});
