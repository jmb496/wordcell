import { afterEach, describe, expect, it, vi } from 'vitest';
import type { CardId, Command, Phase } from '../engine/index';
import type { DispatchResult } from '../shell/game.svelte';
import type { BandKey, Box, Flip, Placed } from './flip';
import { createFlip, flyingSet, inFlight, motionKind, planGlides } from './flip';
import type { Gate } from './gestures/gate';
import type { MotionKind } from './motion';

// AD-14 FLIP (ticket 5.10, epic 5 SPEC CAP-8) in node: no DOM or WAAPI. A fake root answers
// `querySelectorAll('[data-card-id]')` with fake wrappers (`getAttribute` of `data-card-id` and
// `data-place`, `querySelector(':scope > .face')` → a fake face) and `querySelector` of each
// `[data-band="…"]` and of `[data-band="tray"] .tiles`; its contents are a settable scene, so a
// test changes the "DOM" between capture and play. A fake face records `animate()` (keyframes,
// options) and returns a fake Animation whose `finish()` is recorded and whose `onfinish` a test
// fires (WAAPI fires it later). A counting gate throws on a leave at count 0. `flushSync` is mocked
// to run a hook the test sets, then clear it (as controller.test.ts).
const svelteFlush = vi.hoisted(() => ({
  onFlush: null as (() => void) | null,
  onEach: null as (() => void) | null,
  calls: 0,
}));

vi.mock('svelte', async (importOriginal) => {
  const actual = await importOriginal<typeof import('svelte')>();
  return {
    ...actual,
    flushSync: () => {
      svelteFlush.calls += 1;
      svelteFlush.onEach?.();
      svelteFlush.onFlush?.();
      svelteFlush.onFlush = null;
    },
  };
});

vi.mock('../shell/prefs.svelte', () => ({
  prefs: { motion: { baseMs: 180, reduced: false } },
}));

class FakeAnimation {
  onfinish: (() => void) | null = null;
  oncancel: (() => void) | null = null;
  readonly finish = vi.fn();
  constructor(
    readonly keyframes: Keyframe[],
    readonly options: KeyframeAnimationOptions,
  ) {}
}

class FakeClassList {
  readonly names = new Set<string>();
  add(name: string): void {
    this.names.add(name);
  }
  remove(name: string): void {
    this.names.delete(name);
  }
  contains(name: string): boolean {
    return this.names.has(name);
  }
}

class FakeFace {
  readonly classList = new FakeClassList();
  readonly animations: FakeAnimation[] = [];
  constructor(public rect: Box) {}
  getBoundingClientRect(): DOMRect {
    const { left, top, width, height } = this.rect;
    return { left, top, width, height, right: left + width, bottom: top + height } as DOMRect;
  }
  animate(keyframes: Keyframe[], options: KeyframeAnimationOptions): FakeAnimation {
    const animation = new FakeAnimation(keyframes, options);
    this.animations.push(animation);
    return animation;
  }
}

class FakeWrapper {
  readonly parentElement: { getAttribute(name: string): string | null } | null;
  constructor(
    readonly attrs: Record<string, string>,
    readonly face: FakeFace | null,
    cell?: number,
  ) {
    this.parentElement =
      cell === undefined
        ? null
        : { getAttribute: (name) => (name === 'data-wordcell' ? String(cell) : null) };
  }
  getAttribute(name: string): string | null {
    return this.attrs[name] ?? null;
  }
  querySelector(selector: string): FakeFace | null {
    if (selector !== ':scope > .face') throw new Error(`fake wrapper selector ${selector}`);
    return this.face;
  }
}

type Card = { id: number; place: string; rect: Box; cell?: number };
// `mirrors`: WordCell n → the CardId of its direct `[data-mirror-of]` child (R-52).
type Scene = { cards: Card[]; bands: Record<BandKey, Box>; mirrors?: Record<number, number> };

const box = (left: number, top: number, width = 40, height = 53): Box => ({
  left,
  top,
  width,
  height,
});

const BANDS: Record<BandKey, Box> = {
  columns: box(0, 50, 412, 300),
  tray: box(0, 500, 412, 150),
  wordcells: box(0, 380, 412, 100),
};

class FakeRoot {
  readonly tiles = { classList: new FakeClassList() };
  /**
   * The faces of the current scene by CardId (a re-render makes new nodes per scene; `keep` reuses
   * each CardId's face node with its new rect, as Svelte's keyed each does within a band).
   */
  faces = new Map<number, FakeFace>();
  wrappers: FakeWrapper[] = [];
  bands: Record<BandKey, Box> = BANDS;
  show(scene: Scene, options: { keep?: boolean } = {}): void {
    const previous = this.faces;
    this.faces = new Map();
    this.wrappers = scene.cards.map((card) => {
      const kept = options.keep === true ? previous.get(card.id) : undefined;
      const face = kept ?? new FakeFace(card.rect);
      face.rect = card.rect;
      this.faces.set(card.id, face);
      return new FakeWrapper(
        { 'data-card-id': String(card.id), 'data-place': card.place },
        face,
        card.cell,
      );
    });
    this.bands = scene.bands;
    this.mirrors = scene.mirrors ?? {};
  }
  mirrors: Record<number, number> = {};
  querySelectorAll(selector: string): unknown[] {
    if (selector === '[data-wordcell]') {
      return [...new Set(this.wrappers.map((w) => w.parentElement).filter((p) => p !== null))]
        .map((p) => Number(p.getAttribute('data-wordcell')))
        .concat(Object.keys(this.mirrors).map(Number))
        .filter((n, i, all) => all.indexOf(n) === i)
        .map((n) => ({
          getAttribute: () => String(n),
          querySelector: (inner: string) => {
            if (inner !== ':scope > [data-mirror-of]')
              throw new Error(`fake cell selector ${inner}`);
            const id = this.mirrors[n];
            return id === undefined ? null : { getAttribute: () => String(id) };
          },
        }));
    }
    if (selector !== '[data-card-id]') throw new Error(`fake root selectorAll ${selector}`);
    return this.wrappers;
  }
  querySelector(selector: string): unknown {
    if (selector === '[data-band="tray"] .tiles') return this.tiles;
    const m = /^\[data-band="(\w+)"\]$/.exec(selector);
    if (m === null) throw new Error(`fake root selector ${selector}`);
    const rect = this.bands[m[1] as BandKey];
    return rect === undefined ? null : new FakeFace(rect);
  }
  face(id: number): FakeFace {
    const face = this.faces.get(id);
    if (face === undefined) throw new Error(`no face ${id}`);
    return face;
  }
}

function fakeGate() {
  const counts = { enter: 0, leave: 0 };
  const trace: string[] = [];
  const gate = {
    scrollReset: () => {
      trace.push('scrollReset');
    },
    enter: () => {
      counts.enter += 1;
    },
    leave: () => {
      if (counts.enter === counts.leave) throw new Error('fake gate leave() at count 0');
      counts.leave += 1;
    },
  } as unknown as Gate;
  return { gate, active: () => counts.enter - counts.leave, counts, trace };
}

const DURATIONS: Record<MotionKind, number> = {
  snap: 180,
  flyBack: 180,
  parting: 90,
  undoRedo: 190,
  flyToCell: 360,
  overlay: 180,
};

// The module-level `inFlight` hold outlives a test that leaves animations unsettled: every flip
// made by setup() is finished after each test.
const made: Flip[] = [];
afterEach(() => {
  for (const flip of made.splice(0)) flip.finishAll();
});

function setup(options: { reduced?: boolean; phase?: Phase | undefined } = {}) {
  svelteFlush.onFlush = null;
  svelteFlush.onEach = null;
  svelteFlush.calls = 0;
  const root = new FakeRoot();
  const g = fakeGate();
  const state = {
    root: root as FakeRoot | null,
    reduced: options.reduced ?? false,
    phase: ('phase' in options ? options.phase : 'composing') as Phase | undefined,
  };
  const duration = vi.fn((kind: MotionKind) => (state.reduced ? 120 : DURATIONS[kind]));
  const stagger = vi.fn(() => (state.reduced ? 0 : 30));
  const flip: Flip = createFlip({
    gate: g.gate,
    layout: {
      beginMove: () => {
        g.trace.push('beginMove');
      },
      endMove: () => {
        g.trace.push('endMove');
      },
    },
    root: () => state.root as unknown as HTMLElement | null,
    reduced: () => state.reduced,
    phase: () => state.phase,
    duration,
    stagger,
  });
  made.push(flip);
  return { root, flip, duration, stagger, state, ...g };
}

// Two tray tiles and a column card; SAME_BAND swaps the tiles.
const START: Scene = {
  cards: [
    { id: 3, place: 'tray', rect: box(10, 520) },
    { id: 4, place: 'tray', rect: box(54, 520) },
    { id: 7, place: 'column', rect: box(10, 100) },
  ],
  bands: BANDS,
};
const SAME_BAND: Scene = {
  cards: [
    { id: 3, place: 'tray', rect: box(54, 520) },
    { id: 4, place: 'tray', rect: box(10, 520) },
    { id: 7, place: 'column', rect: box(10, 100) },
  ],
  bands: BANDS,
};
// Card 7 joins the strip between 3 (unmoved) and 4 (one slot right).
const BAND_CHANGE: Scene = {
  cards: [
    { id: 3, place: 'strip', rect: box(10, 520) },
    { id: 4, place: 'strip', rect: box(98, 520) },
    { id: 7, place: 'strip', rect: box(54, 520) },
  ],
  bands: BANDS,
};

const CHANGED: DispatchResult = { changed: true };
const flipCommand: Command = { type: 'flip' };
const undo: Command = { type: 'undo' };

/** One capture → scene change → play. */
function move(
  t: ReturnType<typeof setup>,
  next: Scene,
  command: Command = flipCommand,
  result = CHANGED,
) {
  t.flip.capture();
  t.root.show(next);
  t.flip.play(command, result);
}

describe('AD-14 FLIP kind table', () => {
  const cases: [string, Command, DispatchResult, Phase, MotionKind | null][] = [
    [
      'drop',
      { type: 'drop', sourceColumn: 1, sourceCount: 1, destinationColumn: 2 },
      CHANGED,
      'composing',
      'snap',
    ],
    ['tapDestinationCard', { type: 'tapDestinationCard', card: 3 }, CHANGED, 'composing', 'snap'],
    ['setDestinationCount', { type: 'setDestinationCount', k: 2 }, CHANGED, 'composing', 'snap'],
    ['flip', flipCommand, CHANGED, 'composing', 'snap'],
    ['arrange', { type: 'arrange', arrangement: [3, 4] }, CHANGED, 'composing', 'snap'],
    ['addFreeLetter', { type: 'addFreeLetter', cell: 3 }, CHANGED, 'composing', 'snap'],
    ['removeFreeLetter', { type: 'removeFreeLetter', cell: 3 }, CHANGED, 'composing', 'snap'],
    ['validate', { type: 'validate' }, CHANGED, 'place', 'snap'],
    [
      'validate changed: false (empty set)',
      { type: 'validate' },
      { changed: false, rejectedWord: 'xyz' },
      'composing',
      null,
    ],
    ['setPlacementOrder', { type: 'setPlacementOrder', order: [3, 4] }, CHANGED, 'place', 'snap'],
    ['setTarget (empty set)', { type: 'setTarget', cell: 4 }, CHANGED, 'place', null],
    ['giveUp (empty set)', { type: 'giveUp' }, { changed: true, finished: 'gaveUp' }, 'idle', null],
    ['confirm', { type: 'confirm' }, CHANGED, 'idle', 'flyToCell'],
    [
      'winning confirm',
      { type: 'confirm' },
      { changed: true, finished: 'won' },
      'idle',
      'flyToCell',
    ],
    ['undo', undo, CHANGED, 'place', 'undoRedo'],
    ['undo with unfinished', undo, { changed: true, unfinished: true }, 'place', 'undoRedo'],
    ['committing redo', { type: 'redo' }, CHANGED, 'idle', 'flyToCell'],
    ['winning redo', { type: 'redo' }, { changed: true, finished: 'won' }, 'idle', 'flyToCell'],
    ['non-committing redo', { type: 'redo' }, CHANGED, 'composing', 'undoRedo'],
  ];
  for (const [label, command, result, phase, kind] of cases) {
    it(`AD-14 motionKind: ${label} → ${kind ?? 'empty set'}`, () => {
      expect(motionKind(command, result, phase)).toBe(kind);
    });
  }

  it('AD-14 the empty animated set (failed validate, setTarget) starts nothing', () => {
    for (const [command, result] of [
      [{ type: 'validate' }, { changed: false }],
      [{ type: 'setTarget', cell: 4 }, CHANGED],
    ] as [Command, DispatchResult][]) {
      const t = setup();
      t.root.show(START);
      move(t, SAME_BAND, command, result);
      expect(t.counts.enter).toBe(0);
      expect(t.duration).not.toHaveBeenCalled();
      // The capture was consumed: a next capture/play on the same instance animates normally.
      expect(() => t.flip.capture()).not.toThrow();
      t.root.show(START);
      expect(() => t.flip.play(flipCommand, CHANGED)).not.toThrow();
      expect(t.active()).toBe(2);
    }
  });

  it('AD-14 at normal motion a flip play and an undo play pass their kind to duration() and its value to the animation, ease-out', () => {
    for (const [command, kind] of [
      [flipCommand, 'snap'],
      [undo, 'undoRedo'],
    ] as [Command, MotionKind][]) {
      const t = setup();
      t.root.show(START);
      move(t, SAME_BAND, command);
      expect(t.duration.mock.calls).toEqual([[kind]]);
      const animations = [t.root.face(3), t.root.face(4)].flatMap((f) => f.animations);
      expect(animations).toHaveLength(2);
      for (const animation of animations) {
        expect(animation.options).toEqual({ duration: DURATIONS[kind], easing: 'ease-out' });
      }
      expect(t.root.face(3).animations[0]?.keyframes).toEqual([
        { transform: 'translate(-44px, 0px)' },
        { transform: 'translate(0px, 0px)' },
      ]);
      expect(t.root.face(3).classList.contains('wc-glide')).toBe(true);
      expect(t.root.face(7).animations).toEqual([]);
    }
  });

  it('AD-14 under reduced motion a flip play and an undo play fade opacity 0 → 1 over duration() (120), no translate, no wc-glide', () => {
    for (const [command, kind] of [
      [flipCommand, 'snap'],
      [undo, 'undoRedo'],
    ] as [Command, MotionKind][]) {
      const t = setup({ reduced: true });
      t.root.show(START);
      move(t, SAME_BAND, command);
      expect(t.duration.mock.calls).toEqual([[kind]]);
      for (const id of [3, 4]) {
        const face = t.root.face(id);
        expect(face.animations).toHaveLength(1);
        expect(face.animations[0]?.keyframes).toEqual([{ opacity: 0 }, { opacity: 1 }]);
        expect(face.animations[0]?.options.duration).toBe(120);
        expect(face.classList.contains('wc-glide')).toBe(false);
      }
      expect(t.root.tiles.classList.contains('wc-drag-tiles')).toBe(false);
    }
  });

  it('AD-14 under reduced motion a band-changing undo fades the band changer and the same-band mover, no wc-glide, no wc-drag-tiles', () => {
    const t = setup({ reduced: true });
    t.root.show(START);
    move(t, BAND_CHANGE, undo);
    expect(t.duration.mock.calls).toEqual([['undoRedo']]);
    // 7 changes band (column → strip); 4 moves one slot within the tray band; 3 stays.
    for (const id of [7, 4]) {
      const face = t.root.face(id);
      expect(face.animations).toHaveLength(1);
      expect(face.animations[0]?.keyframes).toEqual([{ opacity: 0 }, { opacity: 1 }]);
      expect(face.animations[0]?.options.duration).toBe(120);
      expect(face.classList.contains('wc-glide')).toBe(false);
    }
    expect(t.root.face(3).animations).toEqual([]);
    expect(t.root.tiles.classList.contains('wc-drag-tiles')).toBe(false);
  });

  it('AD-14 the kind reads the phase after the move (F7): a redo captured in place that ends idle animates nothing; one captured idle that ends composing animates as undoRedo', () => {
    // Committing redo: phase place at capture, idle after the move → flyToCell.
    let t = setup({ phase: 'place' });
    t.root.show(START);
    t.flip.capture();
    t.state.phase = 'idle';
    t.root.show(BAND_CHANGE);
    t.flip.play({ type: 'redo' }, CHANGED);
    expect(t.counts.enter).toBe(0);
    expect(t.duration.mock.calls).toEqual([]);
    // Non-committing redo: phase idle at capture, composing after the move → undoRedo.
    t = setup({ phase: 'idle' });
    t.root.show(START);
    t.flip.capture();
    t.state.phase = 'composing';
    t.root.show(BAND_CHANGE);
    t.flip.play({ type: 'redo' }, CHANGED);
    expect(t.duration.mock.calls).toEqual([['undoRedo']]);
    for (const id of [7, 4]) {
      expect(t.root.face(id).animations[0]?.options.duration).toBe(DURATIONS.undoRedo);
    }
    expect(t.active()).toBe(2);
  });
});

// Ticket 5.11 (CAP-8, F28): cell 5 holds card 9; tray tiles 3 and 4 are committed on top of it.
const CELL_START: Scene = {
  cards: [
    { id: 9, place: 'cell', rect: box(100, 400), cell: 5 },
    { id: 3, place: 'tray', rect: box(10, 520) },
    { id: 4, place: 'tray', rect: box(54, 520) },
  ],
  bands: BANDS,
};
const CELL_COMMITTED: Scene = {
  cards: [
    { id: 9, place: 'cell', rect: box(100, 400), cell: 5 },
    { id: 3, place: 'cell', rect: box(100, 400), cell: 5 },
    { id: 4, place: 'cell', rect: box(100, 400), cell: 5 },
  ],
  bands: BANDS,
};
const confirm: Command = { type: 'confirm' };
const committed = () => [...inFlight.committed];

function fly(t: ReturnType<typeof setup>, from: Scene, to: Scene, command: Command = confirm) {
  t.root.show(from);
  t.flip.capture();
  t.root.show(to);
  t.flip.play(command, CHANGED);
}

function settleAll(t: ReturnType<typeof setup>, ids: number[]) {
  for (const id of ids) t.root.face(id).animations[0]?.onfinish?.();
}

describe('AD-14 flyToCell playback (ticket 5.11, CAP-8, F28)', () => {
  it('AD-14 flyToCell glides the committed faces captured → settled rect, bottom first, delay i × stagger() with fill backwards over duration(flyToCell), the target card 9 untouched', () => {
    for (const command of [confirm, { type: 'redo' } as Command]) {
      const t = setup({ phase: 'idle' });
      fly(t, CELL_START, CELL_COMMITTED, command);
      expect(t.duration.mock.calls).toEqual([['flyToCell']]);
      expect(t.root.face(9).animations).toEqual([]);
      expect(t.root.face(3).animations[0]?.keyframes).toEqual([
        { transform: 'translate(-90px, 120px)' },
        { transform: 'translate(0px, 0px)' },
      ]);
      expect(t.root.face(4).animations[0]?.keyframes).toEqual([
        { transform: 'translate(-46px, 120px)' },
        { transform: 'translate(0px, 0px)' },
      ]);
      expect(t.root.face(3).animations[0]?.options).toEqual({
        duration: 360,
        delay: 0,
        easing: 'ease-out',
        fill: 'backwards',
      });
      expect(t.root.face(4).animations[0]?.options.delay).toBe(30);
      expect(t.root.face(3).classList.contains('wc-glide')).toBe(true);
      expect(t.root.tiles.classList.contains('wc-drag-tiles')).toBe(true);
      expect(t.active()).toBe(2);
      settleAll(t, [3, 4]);
      expect(t.active()).toBe(0);
      expect(t.root.tiles.classList.contains('wc-drag-tiles')).toBe(false);
    }
  });

  it('AD-14 flyToCell plays a winning confirm like any other', () => {
    const t = setup({ phase: 'idle' });
    t.root.show(CELL_START);
    t.flip.capture();
    t.root.show(CELL_COMMITTED);
    t.flip.play(confirm, { changed: true, finished: 'won' });
    expect(t.active()).toBe(2);
  });

  it('AD-14 flyToCell sets the hold before the second flushSync and keeps it until the last landing, which releases it together', () => {
    const t = setup({ phase: 'idle' });
    const seen: number[][] = [];
    t.root.show(CELL_START);
    t.flip.capture();
    t.root.show(CELL_COMMITTED);
    svelteFlush.calls = 0;
    svelteFlush.onEach = () => seen.push(committed());
    t.flip.play(confirm, CHANGED);
    // The first flush renders the settled DOM (no hold yet), the second renders the hold.
    expect(seen).toEqual([[], [3, 4]]);
    expect(committed()).toEqual([3, 4]);
    settleAll(t, [3]);
    expect(committed()).toEqual([3, 4]);
    settleAll(t, [4]);
    expect(committed()).toEqual([]);
    expect(t.active()).toBe(0);
  });

  it('AD-14 flyToCell records the target cell used mirror (R-52) only for the gaining cell, from the capture', () => {
    const t = setup({ phase: 'idle' });
    fly(t, { ...CELL_START, mirrors: { 5: 3, 7: 20 } }, CELL_COMMITTED);
    expect([...inFlight.used]).toEqual([3]);
    settleAll(t, [3, 4]);
    expect([...inFlight.used]).toEqual([]);
    const u = setup({ phase: 'idle' });
    fly(u, CELL_START, CELL_COMMITTED);
    expect([...inFlight.used]).toEqual([]);
    u.flip.finishAll();
  });

  it('AD-14 flyToCell under reduced motion fades every face in at once (no delay, no wc-glide, no tile lift) over duration(flyToCell) and holds to its end', () => {
    const t = setup({ phase: 'idle', reduced: true });
    fly(t, CELL_START, CELL_COMMITTED);
    for (const id of [3, 4]) {
      const animation = t.root.face(id).animations[0];
      expect(animation?.keyframes).toEqual([{ opacity: 0 }, { opacity: 1 }]);
      expect(animation?.options.duration).toBe(120);
      expect(animation?.options.delay).toBe(0);
      expect(t.root.face(id).classList.contains('wc-glide')).toBe(false);
    }
    expect(t.root.tiles.classList.contains('wc-drag-tiles')).toBe(false);
    expect(committed()).toEqual([3, 4]);
    settleAll(t, [3, 4]);
    expect(committed()).toEqual([]);
  });

  it('AD-14 flyToCell glides a free letter from another cell rect to rect, no tile lift, and skips nothing under 0.5 px', () => {
    const t = setup({ phase: 'idle' });
    const from: Scene = {
      cards: [
        { id: 9, place: 'cell', rect: box(100, 400), cell: 5 },
        { id: 3, place: 'cell', rect: box(60, 400), cell: 4 },
        { id: 4, place: 'tray', rect: box(100.2, 520) },
      ],
      bands: BANDS,
    };
    const to: Scene = {
      cards: [
        { id: 9, place: 'cell', rect: box(100, 400), cell: 5 },
        { id: 3, place: 'cell', rect: box(100, 400), cell: 5 },
        { id: 4, place: 'cell', rect: box(100, 400), cell: 5 },
      ],
      bands: BANDS,
    };
    fly(t, from, to);
    expect(t.root.face(3).animations[0]?.keyframes?.[0]).toEqual({
      transform: 'translate(-40px, 0px)',
    });
    expect(t.root.face(4).animations).toHaveLength(1);
    expect(t.active()).toBe(2);
    expect(t.root.tiles.classList.contains('wc-drag-tiles')).toBe(true);
  });

  it('AD-14 flyToCell: the in-flight state is empty after finishAll, after an animation-less play and for an empty flying set', () => {
    const t = setup({ phase: 'idle' });
    fly(t, CELL_START, CELL_COMMITTED);
    expect(committed()).toEqual([3, 4]);
    t.flip.finishAll();
    expect(committed()).toEqual([]);
    expect(t.active()).toBe(0);
    // An animation-less flyToCell play (nothing moved) holds nothing.
    t.root.show(CELL_COMMITTED);
    t.flip.capture();
    t.flip.play(confirm, CHANGED);
    expect(committed()).toEqual([]);
    expect(t.active()).toBe(0);
    // A flyToCell kind whose flying set is empty (nothing entered a cell) animates nothing.
    t.root.show(START);
    t.flip.capture();
    t.flip.play({ type: 'redo' }, CHANGED);
    expect(committed()).toEqual([]);
    expect(t.active()).toBe(0);
  });

  it('AD-14 flyToCell into an empty cell flies the committed set with no previous top to hold', () => {
    const t = setup({ phase: 'idle' });
    fly(
      t,
      { cards: CELL_START.cards.slice(1), bands: BANDS },
      { cards: CELL_COMMITTED.cards.slice(1), bands: BANDS },
    );
    expect(committed()).toEqual([3, 4]);
    expect(t.active()).toBe(2);
  });

  it('AD-14 flyToCell throws when the flying cards land in different cells (rule 6)', () => {
    const t = setup({ phase: 'idle' });
    expect(() =>
      fly(
        t,
        {
          cards: [
            { id: 3, place: 'tray', rect: box(10, 520) },
            { id: 4, place: 'tray', rect: box(54, 520) },
          ],
          bands: BANDS,
        },
        {
          cards: [
            { id: 3, place: 'cell', rect: box(100, 400), cell: 5 },
            { id: 4, place: 'cell', rect: box(140, 400), cell: 6 },
          ],
          bands: BANDS,
        },
      ),
    ).toThrow(/^AD-14 FLIP flying card 4 lands in cell 6, not cell 5/);
  });

  it('AD-14 flyingSet lists the cards that entered a cell, in document order', () => {
    const at = (cell?: number): Placed =>
      cell === undefined
        ? { band: 'tray', rect: box(0, 0) }
        : { band: 'wordcells', rect: box(0, 0), cell };
    expect(
      flyingSet(
        new Map<CardId, Placed>([
          [1 as CardId, at(5)],
          [2 as CardId, at()],
          [3 as CardId, at(4)],
        ]),
        new Map<CardId, Placed>([
          [1 as CardId, at(5)],
          [2 as CardId, at(5)],
          [3 as CardId, at(5)],
        ]),
      ),
    ).toEqual([2, 3]);
  });
});

describe('AD-14 FLIP coordinate frame (planGlides)', () => {
  const placed = (band: BandKey, rect: Box): Placed => ({ band, rect });
  const plan = (
    before: [CardId, Placed][],
    after: [CardId, Placed][],
    bandsBefore: Record<BandKey, Box> = BANDS,
    bandsAfter: Record<BandKey, Box> = BANDS,
  ) =>
    planGlides({
      before: new Map(before),
      after: new Map(after),
      bandsBefore,
      bandsAfter,
      kind: 'snap',
      reduced: false,
    });

  it('AD-14 (a) + 14 → 15 with the block left and a band shift: band-shifted column cards get none, tiles invert by the band-relative delta', () => {
    // The tray grows a row: the columns band and the tray band both move up 48 px; tile 20 also
    // moves one slot right (a new D mirror on its left).
    const bandsAfter = {
      columns: box(0, 2, 412, 300),
      tray: box(0, 452, 412, 198),
      wordcells: box(0, 332, 412, 100),
    };
    const glides = plan(
      [
        [7, placed('columns', box(10, 100))],
        [8, placed('columns', box(54, 120))],
        [20, placed('tray', box(54, 520, 44, 44))],
      ],
      [
        [7, placed('columns', box(10, 52))],
        [8, placed('columns', box(54, 72))],
        [20, placed('tray', box(98, 472, 44, 44))],
      ],
      BANDS,
      bandsAfter,
    );
    expect(glides).toEqual([
      {
        id: 20,
        keyframes: [{ transform: 'translate(-44px, 0px)' }, { transform: 'translate(0px, 0px)' }],
        translate: true,
        bandChange: false,
      },
    ]);
  });

  it('AD-14 (b) a band change at 412 × 780 whose next rect includes a 6 px scroll: the first keyframe is captured − next viewport rect', () => {
    // The re-layout scrolled the document 6 px: every band and the next rect sit 6 px higher.
    const shifted = {
      columns: box(0, 44, 412, 300),
      tray: box(0, 494, 412, 150),
      wordcells: box(0, 374, 412, 100),
    };
    const glides = plan(
      [[7, placed('columns', box(10, 300))]],
      [[7, placed('tray', box(98, 514))]],
      BANDS,
      shifted,
    );
    expect(glides).toEqual([
      {
        id: 7,
        keyframes: [
          { transform: 'translate(-88px, -214px)' },
          { transform: 'translate(0px, 0px)' },
        ],
        translate: true,
        bandChange: true,
      },
    ]);
  });

  it('AD-14 equal captured and next rects → no keyframes', () => {
    expect(plan([[3, placed('tray', box(10, 520))]], [[3, placed('tray', box(10, 520))]])).toEqual(
      [],
    );
    expect(
      plan([[3, placed('tray', box(10, 520))]], [[3, placed('tray', box(10.4, 519.6))]]),
    ).toEqual([]);
  });

  it('AD-14 the 0.5 px cut-off: a band changer moved (0.3, 0.2) → none; exactly (0.5, 0) → one glide; (0.4, 12) → one glide', () => {
    expect(
      plan([[7, placed('columns', box(10, 300))]], [[7, placed('tray', box(10.3, 300.2))]]),
    ).toEqual([]);
    expect(
      plan([[3, placed('tray', box(10.5, 520))]], [[3, placed('tray', box(10, 520))]]),
    ).toEqual([
      {
        id: 3,
        keyframes: [{ transform: 'translate(0.5px, 0px)' }, { transform: 'translate(0px, 0px)' }],
        translate: true,
        bandChange: false,
      },
    ]);
    expect(plan([[3, placed('tray', box(0.4, 532))]], [[3, placed('tray', box(0, 520))]])).toEqual([
      {
        id: 3,
        keyframes: [{ transform: 'translate(0.4px, 12px)' }, { transform: 'translate(0px, 0px)' }],
        translate: true,
        bandChange: false,
      },
    ]);
  });

  it('AD-14 different sizes → the top-left delta; different sizes with equal top-lefts → none', () => {
    const card = box(10, 520, 40, 53);
    expect(plan([[3, placed('tray', card)]], [[3, placed('tray', box(30, 510, 44, 44))]])).toEqual([
      {
        id: 3,
        keyframes: [{ transform: 'translate(-20px, 10px)' }, { transform: 'translate(0px, 0px)' }],
        translate: true,
        bandChange: false,
      },
    ]);
    expect(plan([[3, placed('tray', card)]], [[3, placed('tray', box(10, 520, 44, 44))]])).toEqual(
      [],
    );
  });

  it('AD-14 a dropped face starts its first keyframe from its released (transformed) captured rect', () => {
    // Released 37 px right and 212 px up of its slot, it lands in the tray slot at (54, 520).
    const released = box(10 + 37, 300 - 212);
    const glides = plan([[5, placed('columns', released)]], [[5, placed('tray', box(54, 520))]]);
    expect(glides[0]?.keyframes[0]).toEqual({ transform: 'translate(-7px, -432px)' });
  });

  it('AD-14 a null or flyToCell kind plans nothing', () => {
    for (const kind of [null, 'flyToCell'] as const) {
      expect(
        planGlides({
          before: new Map([[3, placed('tray', box(10, 520))]]),
          after: new Map([[3, placed('tray', box(54, 520))]]),
          bandsBefore: BANDS,
          bandsAfter: BANDS,
          kind,
          reduced: false,
        }),
      ).toEqual([]);
    }
  });
});

describe('AD-14 FLIP finish-all path', () => {
  it('AD-14 the gate is idle and running() false when capture() returns; a second capture/play during the first glide, then its late onfinish, leaves the second untouched', () => {
    const t = setup();
    t.root.show(START);
    move(t, BAND_CHANGE, undo);
    const first = [3, 4, 7].flatMap((id) => t.root.face(id).animations);
    expect(first).toHaveLength(2);
    expect(t.active()).toBe(2);
    expect(t.flip.running()).toBe(true);
    // Mid-glide each moving face reports a rect between its ends; finish() settles it (as WAAPI).
    for (const [id, mid] of [
      [4, box(70, 520)],
      [7, box(30, 300)],
    ] as [number, Box][]) {
      const face = t.root.face(id);
      const settled = face.rect;
      face.rect = mid;
      face.animations[0]?.finish.mockImplementation(() => {
        face.rect = settled;
      });
    }
    // A second Undo during the first glide.
    t.flip.capture();
    expect(t.active()).toBe(0);
    expect(t.flip.running()).toBe(false);
    for (const animation of first) expect(animation.finish).toHaveBeenCalledOnce();
    t.root.show(START);
    t.flip.play(undo, CHANGED);
    expect(t.active()).toBe(2);
    // The second glide starts from the settled rects (strip (98, 520) and (54, 520)), not mid-glide.
    expect(t.root.face(4).animations[0]?.keyframes[0]).toEqual({
      transform: 'translate(44px, 0px)',
    });
    expect(t.root.face(7).animations[0]?.keyframes[0]).toEqual({
      transform: 'translate(44px, 420px)',
    });
    expect(t.root.face(7).classList.contains('wc-glide')).toBe(true);
    expect(t.root.tiles.classList.contains('wc-drag-tiles')).toBe(true);
    // The first glide's late onfinish events are no-ops.
    for (const animation of first) animation.onfinish?.();
    expect(t.active()).toBe(2);
    expect(t.flip.running()).toBe(true);
    expect(t.root.face(7).classList.contains('wc-glide')).toBe(true);
    expect(t.root.tiles.classList.contains('wc-drag-tiles')).toBe(true);
  });

  it('AD-14 two same-band glides on the same face nodes: the first glide late onfinish leaves the second glide class, running() and gate count untouched', () => {
    const t = setup();
    t.root.show(START);
    move(t, SAME_BAND);
    const face3 = t.root.face(3);
    const first = face3.animations[0];
    expect(t.active()).toBe(2);
    // A second Flip during the first glide: the same face nodes swap back.
    t.flip.capture();
    t.root.show(START, { keep: true });
    t.flip.play(flipCommand, CHANGED);
    expect(t.root.face(3)).toBe(face3);
    expect(face3.animations).toHaveLength(2);
    expect(t.active()).toBe(2);
    first?.onfinish?.();
    expect(face3.classList.contains('wc-glide')).toBe(true);
    expect(t.flip.running()).toBe(true);
    expect(t.active()).toBe(2);
  });

  it('AD-14 wc-glide and wc-drag-tiles stay until the last settle by onfinish', () => {
    const t = setup();
    t.root.show(START);
    move(t, BAND_CHANGE);
    const faces = [4, 7].map((id) => t.root.face(id));
    expect(t.root.tiles.classList.contains('wc-drag-tiles')).toBe(true);
    faces[0]?.animations[0]?.onfinish?.();
    expect(t.active()).toBe(1);
    expect(faces[0]?.classList.contains('wc-glide')).toBe(true);
    expect(t.root.tiles.classList.contains('wc-drag-tiles')).toBe(true);
    faces[1]?.animations[0]?.onfinish?.();
    faces[1]?.animations[0]?.onfinish?.();
    expect(t.active()).toBe(0);
    expect(t.flip.running()).toBe(false);
    for (const face of faces) expect(face?.classList.contains('wc-glide')).toBe(false);
    expect(t.root.tiles.classList.contains('wc-drag-tiles')).toBe(false);
  });

  it('AD-14 finishAll() finishes every glide and settles synchronously, removing wc-glide and wc-drag-tiles', () => {
    const t = setup();
    t.root.show(START);
    move(t, BAND_CHANGE);
    const faces = [4, 7].map((id) => t.root.face(id));
    t.flip.finishAll();
    expect(t.active()).toBe(0);
    expect(t.flip.running()).toBe(false);
    for (const face of faces) {
      expect(face?.animations[0]?.finish).toHaveBeenCalledOnce();
      expect(face?.classList.contains('wc-glide')).toBe(false);
    }
    expect(t.root.tiles.classList.contains('wc-drag-tiles')).toBe(false);
    for (const face of faces) face?.animations[0]?.onfinish?.();
    expect(t.counts.leave).toBe(2);
  });

  it('AD-14 a same-band-only play adds no wc-drag-tiles', () => {
    const t = setup();
    t.root.show(START);
    move(t, SAME_BAND);
    expect(t.active()).toBe(2);
    expect(t.root.tiles.classList.contains('wc-drag-tiles')).toBe(false);
  });

  it('AD-14 capture() flushes before measuring: a lift dropped by the flush is not recorded (deselect before Undo)', () => {
    const t = setup();
    // Card 7 is drawn lifted 8 px until the flush renders the deselect.
    t.root.show({
      cards: [
        { id: 3, place: 'tray', rect: box(10, 520) },
        { id: 4, place: 'tray', rect: box(54, 520) },
        { id: 7, place: 'column', rect: box(10, 92) },
      ],
      bands: BANDS,
    });
    svelteFlush.onFlush = () => t.root.show(START);
    t.flip.capture();
    t.root.show(START);
    t.flip.play(undo, CHANGED);
    expect(t.root.face(7).animations).toEqual([]);
    expect(t.counts.enter).toBe(0);
  });

  it('AD-14 play() flushes before measuring', () => {
    const t = setup();
    t.root.show(START);
    t.flip.capture();
    svelteFlush.onFlush = () => t.root.show(SAME_BAND);
    t.flip.play(flipCommand, CHANGED);
    expect(t.root.face(3).animations).toHaveLength(1);
    expect(svelteFlush.calls).toBe(2);
  });
});

describe('AD-14 FLIP throws', () => {
  // A fresh module per test (module-level install, no reset export), as act.test.ts.
  async function load() {
    vi.resetModules();
    return import('./flip');
  }

  it('AD-14 capture(), play() and finishAll() before setFlip() throw', async () => {
    const m = await load();
    expect(() => m.capture()).toThrow(/^AD-14 capture\(\) before setFlip\(\)/);
    expect(() => m.play(undo, CHANGED)).toThrow(/^AD-14 play\(\) before setFlip\(\)/);
    expect(() => m.finishAll()).toThrow(/^AD-14 finishAll\(\) before setFlip\(\)/);
  });

  it('AD-14 a second setFlip() throws; the installed instance serves the module calls', async () => {
    const m = await load();
    const calls: string[] = [];
    const fake: Flip = {
      capture: () => calls.push('capture'),
      play: () => calls.push('play'),
      finishAll: () => calls.push('finishAll'),
      running: () => false,
    };
    m.setFlip(fake);
    expect(() => m.setFlip(fake)).toThrow(/^AD-14 setFlip\(\) called twice/);
    m.capture();
    m.play(undo, CHANGED);
    m.finishAll();
    expect(calls).toEqual(['capture', 'play', 'finishAll']);
  });

  it('AD-14 a pending capture throws; play() without a capture throws', () => {
    const t = setup();
    t.root.show(START);
    expect(() => t.flip.play(undo, CHANGED)).toThrow(/^AD-14 FLIP play\(\) without a capture/);
    t.flip.capture();
    expect(() => t.flip.capture()).toThrow(/^AD-14 FLIP capture\(\) while a capture is pending/);
  });

  it('AD-14 a null root at capture and at play throws', () => {
    const t = setup();
    t.state.root = null;
    expect(() => t.flip.capture()).toThrow(/^AD-14 FLIP capture\(\) with no root/);
    t.state.root = t.root;
    t.root.show(START);
    t.flip.capture();
    t.state.root = null;
    expect(() => t.flip.play(undo, CHANGED)).toThrow(/^AD-14 FLIP play\(\) with no root/);
  });

  it('AD-14 no view at play throws', () => {
    const t = setup({ phase: undefined });
    t.root.show(START);
    t.flip.capture();
    expect(() => t.flip.play(undo, CHANGED)).toThrow(/^AD-14 FLIP play\(\) with no view/);
  });

  it('AD-14 a CardId missing from or duplicated in either measurement throws', () => {
    const two: Scene = { cards: START.cards.slice(0, 2), bands: BANDS };
    const dup: Scene = {
      cards: [...START.cards, { id: 3, place: 'tray', rect: box(98, 520) }],
      bands: BANDS,
    };
    // Missing after the move.
    let t = setup();
    t.root.show(START);
    t.flip.capture();
    t.root.show(two);
    expect(() => t.flip.play(undo, CHANGED)).toThrow(/^AD-14 FLIP card 7 missing after the move/);
    // Missing from the capture.
    t = setup();
    t.root.show(two);
    t.flip.capture();
    t.root.show(START);
    expect(() => t.flip.play(undo, CHANGED)).toThrow(/^AD-14 FLIP card 7 missing from the capture/);
    // Duplicated at capture, and after the move.
    t = setup();
    t.root.show(dup);
    expect(() => t.flip.capture()).toThrow(/^AD-14 FLIP card 3 is live twice/);
    t = setup();
    t.root.show(START);
    t.flip.capture();
    t.root.show(dup);
    expect(() => t.flip.play(undo, CHANGED)).toThrow(/^AD-14 FLIP card 3 is live twice/);
  });

  it('AD-14 an unmapped data-place throws', () => {
    for (const place of ['view', '']) {
      const t = setup();
      t.root.show({ cards: [{ id: 9, place, rect: box(0, 0) }], bands: BANDS });
      expect(() => t.flip.capture()).toThrow(/^AD-14 FLIP card 9 has data-place/);
    }
    const t = setup();
    t.root.show(START);
    t.root.wrappers.push(new FakeWrapper({ 'data-card-id': '11' }, new FakeFace(box(0, 0))));
    expect(() => t.flip.capture()).toThrow(/^AD-14 FLIP card 11 has data-place null/);
  });

  it('AD-14 a data-card-id that is not a CardId 0–51 throws', () => {
    for (const raw of ['', '52', '-1', '3.5', 'x']) {
      const t = setup();
      t.root.show(START);
      t.root.wrappers.push(
        new FakeWrapper({ 'data-card-id': raw, 'data-place': 'tray' }, new FakeFace(box(0, 0))),
      );
      expect(() => t.flip.capture(), `"${raw}"`).toThrow(
        /^AD-14 FLIP data-card-id .* is not a CardId 0–51/,
      );
    }
  });

  it('AD-14 a cancel event throws', () => {
    const t = setup();
    t.root.show(START);
    move(t, SAME_BAND);
    const animation = t.root.face(3).animations[0];
    expect(() => animation?.oncancel?.()).toThrow(/^AD-14 FLIP animation cancelled/);
  });
});

describe('AD-11 move bracket', () => {
  it('AD-11 capture clears scroll-busy, then opens the layout move, before anything else', () => {
    const t = setup();
    t.root.show(START);
    t.flip.capture();
    expect(t.trace).toEqual(['scrollReset', 'beginMove']);
  });

  it('AD-11 play applies the layout move right after the move flush and before it measures or animates', () => {
    const t = setup();
    t.root.show(START);
    t.flip.capture();
    t.trace.length = 0;
    svelteFlush.onFlush = () => {
      t.trace.push('flush');
      t.root.show(SAME_BAND);
    };
    t.flip.play(flipCommand, CHANGED);
    expect(t.trace).toEqual(['flush', 'endMove']);
    expect(t.root.face(3).animations).toHaveLength(1);
  });

  it('AD-11 a no-op move (failed Validate) still brackets: reset, begin, end', () => {
    const t = setup();
    t.root.show(START);
    move(t, START, { type: 'validate' }, { changed: false });
    expect(t.trace).toEqual(['scrollReset', 'beginMove', 'endMove']);
    expect(t.counts.enter).toBe(0);
  });

  it('AD-14 a pure band shift (every band and card up 6 px) animates no face', () => {
    const t = setup();
    t.root.show(START);
    const up = (rect: Box): Box => ({ ...rect, top: rect.top - 6 });
    const shifted: Scene = {
      cards: START.cards.map((card) => ({ ...card, rect: up(card.rect) })),
      bands: {
        columns: up(BANDS.columns),
        tray: up(BANDS.tray),
        wordcells: up(BANDS.wordcells),
      },
    };
    move(t, shifted);
    expect(t.counts.enter).toBe(0);
    for (const id of [3, 4, 7]) expect(t.root.face(id).animations).toHaveLength(0);
  });
});
