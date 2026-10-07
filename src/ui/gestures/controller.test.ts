import { describe, expect, it, vi } from 'vitest';
import type { Gate } from './gate';

// AD-12 pointer controller in node: a fake root (listener map, `contains`), fake elements
// (`closest` over a parent chain and an attribute map; capture spies with `hasPointerCapture`
// state; releasing capture fires `lostpointercapture` synchronously, as a browser may), fake events
// with preventDefault/stopPropagation spies, a counting gate, a virtual-time scheduler, nav stubbed
// with a call log, `game.view` settable, `game.dispatch` logging into the same order log (entry 7),
// the real overlays store (fresh modules per test).
// Entry 8: elements also have children (`querySelector` over descendants: attribute and `.class`
// selectors), a settable `rect` (`getBoundingClientRect` adds a parsed inline `translate`), a
// `style.transform`, and `animate()` returning a fake Animation that finishes in virtual time
// (`finish()` queues `onfinish` once on the virtual clock, as real WAAPI fires it later); prefs mocked (motion, as in motion.test.ts);
// `duration` from ../motion wrapped to log its kinds and answer `durations.override` per kind.
// Entry 11: the board also holds the view's scrim and sheet, the sheet's `[data-view-scroll]`
// area (settable `scrollHeight`/`clientHeight`) and a mirror inside it; a `{ capture: true }`
// listener (the click swallower) is kept apart from the controller's and runs first.
const navCalls: string[] = [];
// Entry 9: gate enter/leave, animation finish and elementFromPoint calls, in order.
const order: string[] = [];
const shared: { view: unknown; onDispatch: (() => void) | null } = {
  view: undefined,
  onDispatch: null,
};
const motion = vi.hoisted(() => ({ value: { baseMs: 180, reduced: false } }));

const durations = vi.hoisted(() => ({
  kinds: [] as string[],
  override: {} as Record<string, number>,
}));

vi.mock('../motion', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../motion')>();
  return {
    ...actual,
    duration: (kind: Parameters<typeof actual.duration>[0]) => {
      durations.kinds.push(kind);
      return durations.override[kind] ?? actual.duration(kind);
    },
  };
});

vi.mock('../../shell/prefs.svelte', () => ({
  prefs: {
    get motion() {
      return motion.value;
    },
  },
}));

type Rect = { left: number; top: number; right: number; bottom: number };

class FakeAnimation {
  onfinish: (() => void) | null = null;
  /** Never called by the fake; a test fires it to simulate a cancelled animation. */
  oncancel: (() => void) | null = null;
  finished = false;
  readonly finish = vi.fn(() => {
    order.push('finish');
    if (this.finished) return;
    this.finished = true;
    clock.add(() => this.onfinish?.(), 0);
  });
  constructor(
    readonly keyframes: Record<string, unknown>[],
    readonly options: { duration: number; easing?: string },
    /** The animated element. */
    readonly el: FakeEl,
  ) {}
}

// The virtual-time scheduler animations run on (set by setup()).
const clock: { add: (cb: () => void, ms: number) => void } = {
  add: () => {
    throw new Error('clock used before setup()');
  },
};

vi.mock('../../shell/nav', () => ({
  nav: {
    push: () => navCalls.push('push'),
    pop: () => navCalls.push('pop'),
  },
}));

vi.mock('../../shell/game.svelte', () => ({
  game: {
    get view() {
      return shared.view;
    },
    dispatch: (command: Record<string, unknown>) => {
      shared.onDispatch?.();
      navCalls.push(`dispatch ${JSON.stringify(command)}`);
      return { kind: 'applied' };
    },
  },
}));

type Listener = (event: unknown) => void;

class FakeEl {
  readonly captures = new Set<number>();
  readonly log: string[] = [];
  listeners = new Map<string, Listener>();
  readonly captureListeners = new Map<string, Listener>();
  root: FakeEl | null = null;
  scrollHeight = 0;
  clientHeight = 0;
  readonly classes = new Set<string>();
  readonly props = new Map<string, string>();
  readonly classList = {
    add: (...names: string[]) => {
      for (const n of names) this.classes.add(n);
    },
    remove: (...names: string[]) => {
      for (const n of names) this.classes.delete(n);
    },
    contains: (name: string) => this.classes.has(name),
  };
  readonly style = {
    setProperty: (name: string, value: string) => this.props.set(name, value),
    removeProperty: (name: string) => this.props.delete(name),
    transform: '',
  };
  readonly children: FakeEl[] = [];
  readonly animations: FakeAnimation[] = [];
  rect: Rect | null = null;
  constructor(
    readonly tag: string,
    readonly attrs: Record<string, string> = {},
    readonly parent: FakeEl | null = null,
    readonly disabled = false,
  ) {
    parent?.children.push(this);
  }
  querySelector(selector: string): FakeEl | null {
    for (const child of this.children) {
      if (child.is(selector)) return child;
      const found = child.querySelector(selector);
      if (found !== null) return found;
    }
    return null;
  }
  getBoundingClientRect(): Rect {
    if (this.rect === null) throw new Error(`fake ${this.tag} has no rect`);
    const m = /^translate\((-?[\d.]+)px, (-?[\d.]+)px\)$/.exec(this.style.transform);
    if (this.style.transform !== '' && m === null) {
      throw new Error(`fake transform ${this.style.transform}`);
    }
    const dx = m === null ? 0 : Number(m[1]);
    const dy = m === null ? 0 : Number(m[2]);
    const r = this.rect;
    return { left: r.left + dx, top: r.top + dy, right: r.right + dx, bottom: r.bottom + dy };
  }
  animate(keyframes: Record<string, unknown>[], options: { duration: number; easing?: string }) {
    const animation = new FakeAnimation(keyframes, options, this);
    this.animations.push(animation);
    clock.add(() => animation.finish(), options.duration);
    return animation;
  }
  getAttribute(name: string): string | null {
    return this.attrs[name] ?? null;
  }
  closest(selector: string): FakeEl | null {
    for (let el: FakeEl | null = this; el !== null; el = el.parent) {
      if (el.is(selector)) return el;
    }
    return null;
  }
  is(selector: string): boolean {
    if (selector === 'button:enabled') return this.tag === 'button' && !this.disabled;
    if (/^\.[\w-]+$/.test(selector)) return this.classes.has(selector.slice(1));
    const m = /^\[([\w-]+)(?:="([^"]*)")?\]$/.exec(selector);
    if (m === null) throw new Error(`fake closest: unsupported selector ${selector}`);
    const value = this.attrs[m[1] as string];
    return m[2] === undefined ? value !== undefined : value === m[2];
  }
  contains(el: FakeEl): boolean {
    for (let e: FakeEl | null = el; e !== null; e = e.parent) if (e === this) return true;
    return false;
  }
  setPointerCapture(id: number): void {
    this.log.push(`set ${id}`);
    this.captures.add(id);
  }
  hasPointerCapture(id: number): boolean {
    return this.captures.has(id);
  }
  releasePointerCapture(id: number): void {
    this.log.push(`release ${id}`);
    this.captures.delete(id);
    // A browser may fire lostpointercapture synchronously; the controller has cleared the press.
    this.root?.fire('lostpointercapture', { pointerId: id, target: this });
  }
  addEventListener(type: string, fn: Listener, options: unknown): void {
    if ((options as { capture?: boolean }).capture === true) {
      expect(options).toEqual({ capture: true });
      this.captureListeners.set(type, fn);
      return;
    }
    expect(options).toEqual({ passive: false });
    this.listeners.set(type, fn);
  }
  removeEventListener(type: string, fn: Listener, options?: unknown): void {
    const map =
      (options as { capture?: boolean } | undefined)?.capture === true
        ? this.captureListeners
        : this.listeners;
    if (map.get(type) === fn) map.delete(type);
  }
  fire(type: string, init: Partial<FakeEvent>): FakeEvent {
    const event = makeEvent(init);
    this.captureListeners.get(type)?.(event);
    this.listeners.get(type)?.(event);
    return event;
  }
}

type FakeEvent = {
  pointerId: number;
  pointerType: string;
  detail: number;
  relatedTarget: unknown;
  button: number;
  clientX: number;
  clientY: number;
  target: unknown;
  preventDefault: ReturnType<typeof vi.fn>;
  stopPropagation: ReturnType<typeof vi.fn>;
};

function makeEvent(init: Partial<FakeEvent>): FakeEvent {
  return {
    pointerId: 1,
    pointerType: 'touch',
    detail: 1,
    relatedTarget: null,
    button: 0,
    clientX: 0,
    clientY: 0,
    target: null,
    preventDefault: vi.fn(),
    stopPropagation: vi.fn(),
    ...init,
  };
}

// The board fixture: every press target kind the controller resolves.
function board() {
  const root = new FakeEl('main');
  const el = (tag: string, attrs: Record<string, string>, parent: FakeEl, disabled = false) => {
    const e = new FakeEl(tag, attrs, parent, disabled);
    e.root = root;
    return e;
  };
  // Geometry (entry 8): column n spans x (n − 1) × 50 … n × 50, y 0 … 400; strip 20, H 60.
  const at = (e: FakeEl, rect: Rect) => {
    e.rect = rect;
    return e;
  };
  const colRect = (n: number): Rect => ({ left: (n - 1) * 50, top: 0, right: n * 50, bottom: 400 });
  const face = (wrapper: FakeEl, n: number, top: number) => {
    const f = at(el('div', {}, wrapper), {
      left: (n - 1) * 50,
      top,
      right: n * 50,
      bottom: top + 60,
    });
    f.classes.add('face');
    return f;
  };
  const topBar = el('div', { 'data-band': 'topBar' }, root);
  const undo = el('button', {}, topBar);
  const undoIcon = el('svg', {}, undo);
  const redoDisabled = el('button', {}, topBar, true);
  const column1 = at(el('div', { 'data-column': '1' }, root), colRect(1));
  const placeholder1 = el('div', { 'data-placeholder': '' }, column1);
  const card1 = el('div', { 'data-place': 'column', 'data-card-id': '0' }, column1);
  const face1 = face(card1, 1, 0);
  const card1b = el('div', { 'data-place': 'column', 'data-card-id': '5' }, column1);
  const face1b = face(card1b, 1, 20);
  const ghost = el('div', { 'data-mirror-of': '7' }, column1);
  const foot1 = el('div', { 'data-foot': '1' }, column1);
  const column2 = at(el('div', { 'data-column': '2' }, root), colRect(2));
  el('div', { 'data-placeholder': '' }, column2);
  const card2 = el('div', { 'data-place': 'column', 'data-card-id': '1' }, column2);
  const face2 = face(card2, 2, 0);
  const column3 = at(el('div', { 'data-column': '3' }, root), colRect(3));
  const placeholder3 = el('div', { 'data-placeholder': '' }, column3);
  const cell3 = el('div', { 'data-wordcell': '3' }, root);
  const cellCard = el('div', { 'data-place': 'cell', 'data-card-id': '2' }, cell3);
  const badge = el('span', {}, cell3);
  const cell4 = el('div', { 'data-wordcell': '4' }, root);
  const tray = el('div', { 'data-band': 'tray' }, root);
  const tile = el('div', { 'data-place': 'tray', 'data-card-id': '3' }, tray);
  const trayMirror = el('div', { 'data-mirror-of': '1' }, tray);
  const trayMirrorFace = el('div', {}, trayMirror);
  const leftover = el('div', { 'data-band': 'leftover' }, root);
  // Entry 11: the WordCell view (rendered in the DOM only while a peek or view is open).
  const scrim = el('div', { 'data-view-scrim': '' }, root);
  const sheet = el('div', { 'data-view-sheet': '' }, root);
  const sheetTitle = el('h2', {}, sheet);
  const viewScroll = el('div', { 'data-view-scroll': '' }, sheet);
  const sheetMirror = el('div', { 'data-mirror-of': '2' }, viewScroll);
  const outside = new FakeEl('div');
  return {
    root,
    undo,
    undoIcon,
    redoDisabled,
    column1,
    placeholder1,
    card1,
    face1,
    card1b,
    face1b,
    ghost,
    foot1,
    column2,
    card2,
    face2,
    column3,
    placeholder3,
    cell3,
    cellCard,
    badge,
    cell4,
    tile,
    trayMirror,
    trayMirrorFace,
    leftover,
    scrim,
    sheet,
    sheetTitle,
    viewScroll,
    sheetMirror,
    outside,
  };
}

type Timer = { cb: () => void; due: number; done: boolean };

async function setup() {
  vi.resetModules();
  navCalls.length = 0;
  order.length = 0;
  shared.onDispatch = null;
  const col = (column: number, cards: number[]) => ({
    column,
    cards,
    canPickUp: cards.length > 0,
    canDropOn: true,
  });
  shared.view = {
    status: 'playing',
    phase: 'idle',
    columns: [col(1, [0, 5]), col(2, [1]), ...[3, 4, 5, 6, 7, 8].map((c) => col(c, []))],
    cells: [
      { cell: 3, cards: [2] },
      { cell: 4, cards: [] },
    ],
  };
  motion.value = { baseMs: 180, reduced: false };
  durations.kinds.length = 0;
  durations.override = {};
  const { overlays } = await import('../overlays.svelte');
  const { createController } = await import('./controller');
  const { dropTarget } = await import('./drop-target');

  const counts = { enter: 0, leave: 0 };
  const gate = {
    enter: () => {
      order.push('enter');
      counts.enter += 1;
    },
    leave: () => {
      if (counts.enter - counts.leave === 0) throw new Error('fake gate leave() at count 0');
      order.push('leave');
      counts.leave += 1;
    },
  } as unknown as Gate;

  let now = 0;
  const timers: Timer[] = [];
  const setTimer = vi.fn((cb: () => void, ms: number) => {
    const t = { cb, due: now + ms, done: false };
    timers.push(t);
    return t;
  });
  const clearTimer = vi.fn((t: Timer) => {
    t.done = true;
  });
  // Fires every uncleared callback due by the new time; returns how many fired.
  const advance = (ms: number) => {
    now += ms;
    let fired = 0;
    for (const t of timers) {
      if (!t.done && t.due <= now) {
        t.done = true;
        fired += 1;
        t.cb();
      }
    }
    return fired;
  };
  clock.add = (cb, ms) => {
    timers.push({ cb, due: now + ms, done: false });
  };

  const b = board();
  for (const [id, column] of [b.column1, b.column2, b.column3].entries()) {
    dropTarget(column as unknown as Element, { kind: 'column', id: id + 1 });
  }
  let hit: FakeEl | null = null;
  const controller = createController(gate, {
    elementFromPoint: () => {
      order.push('point');
      return hit as unknown as Element | null;
    },
    setTimer,
    clearTimer,
  });
  const detach = () => controller.attach(b.root as unknown as HTMLElement);
  // A pointerdown whose resolution reads `target` from elementFromPoint; event.target is another
  // element on purpose (resolution never reads it).
  const down = (target: FakeEl | null, init: Partial<FakeEvent> = {}) => {
    hit = target;
    return b.root.fire('pointerdown', { target: b.leftover, ...init });
  };
  const fire = (type: string, init: Partial<FakeEvent> = {}) => b.root.fire(type, init);
  // A complete touch tap (pointerdown, pointerup) on `target`.
  const tap = (target: FakeEl | null) => {
    down(target);
    fire('pointerup', { target });
  };
  // A mouse pointerover at `target` (elementFromPoint answers it).
  const hover = (target: FakeEl | null) => {
    hit = target;
    return b.root.fire('pointerover', { pointerType: 'mouse', target });
  };
  const active = () => counts.enter - counts.leave;
  // Sets what elementFromPoint answers (hover recomputes read it).
  const point = (target: FakeEl | null) => {
    hit = target;
  };
  return {
    point,
    overlays,
    controller,
    detach,
    b,
    down,
    fire,
    tap,
    hover,
    counts,
    active,
    setTimer,
    clearTimer,
    advance,
  };
}

describe('AD-12 one pointer', () => {
  it('AD-12 a button !== 0 pointerdown, a second pointer and an enabled button never enter the gate; the second pointer is untouched', async () => {
    const t = await setup();
    t.detach();
    const right = t.down(t.b.card1, { button: 2 });
    expect(t.counts.enter).toBe(0);
    expect(right.preventDefault).not.toHaveBeenCalled();
    expect(right.stopPropagation).not.toHaveBeenCalled();
    t.down(t.b.undoIcon);
    expect(t.counts.enter).toBe(0);
    t.down(t.b.card1, { pointerId: 1 });
    expect(t.counts.enter).toBe(1);
    for (const type of ['pointerdown', 'pointermove', 'pointerup', 'pointercancel']) {
      const e =
        type === 'pointerdown'
          ? t.down(t.b.card2, { pointerId: 2 })
          : t.fire(type, { pointerId: 2 });
      expect(e.preventDefault).not.toHaveBeenCalled();
      expect(e.stopPropagation).not.toHaveBeenCalled();
    }
    expect(t.counts).toEqual({ enter: 1, leave: 0 });
    expect(t.b.card2.log).toEqual([]);
    t.fire('pointerup', { pointerId: 1 });
    expect(t.counts).toEqual({ enter: 1, leave: 1 });
  });

  it('AD-12 a disabled button falls through: active, uncaptured', async () => {
    const t = await setup();
    t.detach();
    t.down(t.b.redoDisabled);
    expect(t.active()).toBe(1);
    expect(t.b.redoDisabled.log).toEqual([]);
    t.fire('pointerup');
    expect(t.active()).toBe(0);
  });

  it('AD-12 resolution reads elementFromPoint, never event.target', async () => {
    const t = await setup();
    t.detach();
    t.down(t.b.card1, { target: t.b.undo });
    expect(t.active()).toBe(1);
    expect(t.b.card1.log).toEqual(['set 1']);
    t.fire('pointerup');
    t.down(t.b.undo, { target: t.b.card1 });
    expect(t.counts.enter).toBe(1);
  });
});

describe('AD-12 press targets', () => {
  it('AD-12 column card, WordCell card, WordCell part, empty WordCell, tray tile and tray mirror are captured on their card, WordCell or mirror element', async () => {
    const t = await setup();
    t.detach();
    const cases: [hit: FakeEl, captured: FakeEl][] = [
      [t.b.card1, t.b.card1],
      [t.b.cellCard, t.b.cellCard],
      [t.b.badge, t.b.cell3],
      [t.b.cell4, t.b.cell4],
      [t.b.tile, t.b.tile],
      [t.b.trayMirrorFace, t.b.trayMirror],
    ];
    for (const [hit, captured] of cases) {
      captured.log.length = 0;
      t.down(hit);
      expect(captured.log).toEqual(['set 1']);
      expect(t.active()).toBe(1);
      t.fire('pointerup', { target: captured });
      expect(captured.log).toEqual(['set 1', 'release 1']);
      expect(t.active()).toBe(0);
    }
    expect(t.b.badge.log).toEqual([]);
    expect(t.b.trayMirrorFace.log).toEqual([]);
  });

  it('AD-12 a foot pad, a ghost mirror, a non-card band, a null hit and a hit outside the root are active and uncaptured', async () => {
    const t = await setup();
    t.detach();
    for (const el of [t.b.foot1, t.b.ghost, t.b.leftover, null, t.b.outside]) {
      t.down(el);
      expect(t.active()).toBe(1);
      const ctx = t.fire('contextmenu');
      expect(ctx.preventDefault).not.toHaveBeenCalled();
      t.fire('pointerup');
      expect(t.active()).toBe(0);
      expect(el?.log ?? []).toEqual([]);
    }
  });
});

describe('AD-12 press ends', () => {
  it('AD-12 pointerup, pointercancel, cancel() and cancel({ byBack: true }) each end once, then a lostpointercapture changes nothing', async () => {
    const enders: ((t: Awaited<ReturnType<typeof setup>>) => void)[] = [
      (t) => t.fire('pointerup', { target: t.b.card1 }),
      (t) => t.fire('pointercancel', { target: t.b.card1 }),
      (t) => t.controller.cancel(),
      (t) => t.controller.cancel({ byBack: true }),
    ];
    for (const ender of enders) {
      const t = await setup();
      t.detach();
      t.down(t.b.card1);
      ender(t);
      expect(t.counts).toEqual({ enter: 1, leave: 1 });
      expect(t.b.card1.log).toEqual(['set 1', 'release 1']);
      t.fire('lostpointercapture', { target: t.b.card1 });
      expect(t.counts).toEqual({ enter: 1, leave: 1 });
      // Entry 7: the pointerup end is a tap, which selects (one push); the others act on nothing.
      expect(navCalls).toEqual(ender === enders[0] ? ['push'] : []);
    }
  });

  it('AD-12 lostpointercapture on the captured element ends the press; from another element it does not', async () => {
    const t = await setup();
    t.detach();
    t.down(t.b.card1);
    t.fire('lostpointercapture', { target: t.b.card2 });
    expect(t.active()).toBe(1);
    t.b.card1.captures.delete(1);
    t.fire('lostpointercapture', { target: t.b.card1 });
    expect(t.counts).toEqual({ enter: 1, leave: 1 });
    expect(t.b.card1.log).toEqual(['set 1']);
  });

  it('AD-12 an uncaptured foot-pad press then pointercancel is balanced', async () => {
    const t = await setup();
    t.detach();
    t.down(t.b.foot1);
    t.fire('pointercancel');
    expect(t.counts).toEqual({ enter: 1, leave: 1 });
  });

  it('AD-12 mouse id 1 pressed and released twice ends each once', async () => {
    const t = await setup();
    t.detach();
    for (let i = 0; i < 2; i++) {
      t.down(t.b.card1);
      t.fire('pointerup', { target: t.b.card1 });
    }
    expect(t.counts).toEqual({ enter: 2, leave: 2 });
  });

  it('AD-12 a new pointer after cancel() starts a new press', async () => {
    const t = await setup();
    t.detach();
    t.down(t.b.card1, { pointerId: 1 });
    t.controller.cancel();
    t.down(t.b.card2, { pointerId: 2 });
    expect(t.counts).toEqual({ enter: 2, leave: 1 });
    expect(t.b.card2.log).toEqual(['set 2']);
    t.fire('pointerup', { pointerId: 1 });
    expect(t.active()).toBe(1);
    t.fire('pointerup', { pointerId: 2 });
    expect(t.active()).toBe(0);
  });

  it('AD-12 a same-id pointerdown after cancel() starts a press that ends once on its pointerup', async () => {
    const t = await setup();
    t.detach();
    t.down(t.b.card1);
    t.controller.cancel();
    t.down(t.b.card2);
    expect(t.active()).toBe(1);
    t.fire('pointerup');
    t.fire('pointerup');
    expect(t.counts).toEqual({ enter: 2, leave: 2 });
  });

  it('AD-12 an uncaptured press with no pointerup, then a same-id pointerdown: balanced, the new press active', async () => {
    const t = await setup();
    t.detach();
    t.down(t.b.leftover);
    t.down(t.b.card1);
    expect(t.counts).toEqual({ enter: 2, leave: 1 });
    expect(t.b.card1.log).toEqual(['set 1']);
  });

  it('AD-12 a captured press with a lost end, then a same-id pointerdown releases the old capture first', async () => {
    const t = await setup();
    t.detach();
    t.down(t.b.card1);
    t.down(t.b.card2);
    expect(t.counts).toEqual({ enter: 2, leave: 1 });
    expect(t.b.card1.log).toEqual(['set 1', 'release 1']);
    expect(t.b.card2.log).toEqual(['set 1']);
  });

  it('AD-12 cancel() when the element no longer holds capture does not release it and does not throw', async () => {
    const t = await setup();
    t.detach();
    t.down(t.b.card1);
    t.b.card1.captures.clear();
    expect(() => t.controller.cancel()).not.toThrow();
    expect(t.b.card1.log).toEqual(['set 1']);
    expect(t.active()).toBe(0);
  });

  it('AD-12 attach while attached throws; detach cancels the press (gate balanced)', async () => {
    const t = await setup();
    const detach = t.detach();
    expect(() => t.detach()).toThrow(/^AD-12 attach\(\) while attached/);
    t.down(t.b.card1);
    detach();
    expect(t.counts).toEqual({ enter: 1, leave: 1 });
    expect(t.b.card1.log).toEqual(['set 1', 'release 1']);
    expect(t.b.root.listeners.size).toBe(0);
    expect(t.b.root.captureListeners.size).toBe(0);
  });
});

describe('AD-12 contextmenu', () => {
  it('AD-12 a captured press suppresses contextmenu; after cancel() until that pointer’s pointerup', async () => {
    const t = await setup();
    t.detach();
    t.down(t.b.card1);
    expect(t.fire('contextmenu').preventDefault).toHaveBeenCalled();
    t.controller.cancel();
    expect(t.fire('contextmenu').preventDefault).toHaveBeenCalled();
    t.fire('pointerup', { pointerId: 2 });
    expect(t.fire('contextmenu').preventDefault).toHaveBeenCalled();
    t.fire('pointerup', { pointerId: 1 });
    expect(t.fire('contextmenu').preventDefault).not.toHaveBeenCalled();
    expect(t.counts).toEqual({ enter: 1, leave: 1 });
  });

  it('AD-12 a lostpointercapture end keeps suppressing until pointercancel; a pointerup end does not', async () => {
    const t = await setup();
    t.detach();
    t.down(t.b.card1);
    t.b.card1.captures.clear();
    t.fire('lostpointercapture', { target: t.b.card1 });
    expect(t.fire('contextmenu').preventDefault).toHaveBeenCalled();
    t.fire('pointercancel');
    expect(t.fire('contextmenu').preventDefault).not.toHaveBeenCalled();
    t.down(t.b.card1);
    t.fire('pointerup');
    expect(t.fire('contextmenu').preventDefault).not.toHaveBeenCalled();
  });

  it('AD-12 the slot clears on the next captured press and on detach, not on an uncaptured one', async () => {
    const t = await setup();
    const detach = t.detach();
    t.down(t.b.card1);
    t.controller.cancel();
    t.down(t.b.leftover, { pointerId: 2 });
    t.fire('pointerup', { pointerId: 2 });
    expect(t.fire('contextmenu').preventDefault).toHaveBeenCalled();
    t.down(t.b.card2, { pointerId: 3 });
    t.fire('pointerup', { pointerId: 3 });
    expect(t.fire('contextmenu').preventDefault).not.toHaveBeenCalled();
    t.down(t.b.card1);
    t.controller.cancel();
    detach();
    t.detach();
    expect(t.fire('contextmenu').preventDefault).not.toHaveBeenCalled();
  });

  it('AD-12 the slot clears on that pointer’s next uncaptured press', async () => {
    const t = await setup();
    t.detach();
    t.down(t.b.card1);
    t.controller.cancel();
    t.down(t.b.foot1);
    t.fire('pointerup');
    expect(t.fire('contextmenu').preventDefault).not.toHaveBeenCalled();
    expect(t.counts).toEqual({ enter: 2, leave: 2 });
  });
});

describe('AD-12 peek on end', () => {
  it('AD-12 peek on end: cancel(), cancel({ byBack: true }), pointercancel, lostpointercapture, a same-id pointerdown and detach close the peek, never sticky, no nav call', async () => {
    const enders: ((t: Awaited<ReturnType<typeof setup>>, detach: () => void) => void)[] = [
      (t) => t.controller.cancel(),
      (t) => t.controller.cancel({ byBack: true }),
      (t) => t.fire('pointercancel'),
      (t) => {
        t.b.cellCard.captures.clear();
        t.fire('lostpointercapture', { target: t.b.cellCard });
      },
      (t) => t.down(t.b.leftover),
      (_t, detach) => detach(),
    ];
    for (const ender of enders) {
      const t = await setup();
      const detach = t.detach();
      // An overflowing scroll area: only a pointerup could turn the peek sticky.
      t.b.viewScroll.scrollHeight = 900;
      t.b.viewScroll.clientHeight = 300;
      t.down(t.b.cellCard);
      t.advance(400);
      expect(t.overlays.peek).toBe(3);
      ender(t, detach);
      expect(t.overlays.peek).toBeNull();
      expect(t.overlays.viewCell).toBeNull();
      expect(t.overlays.depth).toBe(0);
      expect(navCalls).toEqual([]);
    }
  });

  it('AD-12 a stale pointercancel or lostpointercapture after cancel() leaves a peek open', async () => {
    const t = await setup();
    t.detach();
    t.down(t.b.cellCard);
    t.controller.cancel();
    t.overlays.openPeek(3);
    t.fire('lostpointercapture', { target: t.b.cellCard });
    t.fire('pointercancel');
    expect(t.overlays.peek).toBe(3);
    expect(t.counts).toEqual({ enter: 1, leave: 1 });
  });
});

describe('AD-12 entry 11 long-press peek', () => {
  it('AD-12 Q-21 a non-empty WordCell long-press opens the peek at 400 ms with no nav call; an empty one opens none', async () => {
    const t = await setup();
    t.detach();
    t.down(t.b.cellCard);
    t.advance(399);
    expect(t.overlays.peek).toBeNull();
    t.advance(1);
    expect(t.overlays.peek).toBe(3);
    expect(navCalls).toEqual([]);
    t.fire('pointerup', { target: t.b.cellCard });
    t.down(t.b.cell4);
    t.advance(400);
    expect(t.overlays.peek).toBeNull();
    t.fire('pointerup', { target: t.b.cell4 });
    expect(t.overlays.viewCell).toBeNull();
    expect(navCalls).toEqual([]);
  });

  it('AD-13 a long-press up without overflow closes the peek: no entry, no nav call', async () => {
    const t = await setup();
    t.detach();
    t.b.viewScroll.scrollHeight = 300;
    t.b.viewScroll.clientHeight = 300;
    t.down(t.b.cellCard);
    t.advance(400);
    t.fire('pointerup', { target: t.b.cellCard });
    expect(t.overlays.peek).toBeNull();
    expect(t.overlays.viewCell).toBeNull();
    expect(navCalls).toEqual([]);
    expect(t.active()).toBe(0);
  });

  it('AD-13 a long-press up with a 1 px rounding excess closes the peek: no entry, no nav call', async () => {
    const t = await setup();
    t.detach();
    t.b.viewScroll.scrollHeight = 301;
    t.b.viewScroll.clientHeight = 300;
    t.down(t.b.cellCard);
    t.advance(400);
    t.fire('pointerup', { target: t.b.cellCard });
    expect(t.overlays.peek).toBeNull();
    expect(t.overlays.viewCell).toBeNull();
    expect(navCalls).toEqual([]);
    expect(t.active()).toBe(0);
  });

  it('AD-13 a long-press up with overflow turns the peek sticky: one push, above a kept selection', async () => {
    const t = await setup();
    t.detach();
    t.tap(t.b.card1);
    t.b.viewScroll.scrollHeight = 302;
    t.b.viewScroll.clientHeight = 300;
    t.down(t.b.cellCard);
    t.advance(400);
    t.fire('pointerup', { target: t.b.cellCard });
    expect(t.overlays.peek).toBeNull();
    expect(t.overlays.viewCell).toBe(3);
    expect(t.overlays.top).toBe('wordcellView');
    expect(t.overlays.depth).toBe(2);
    expect(t.overlays.selection).toEqual({ column: 1, count: 2 });
    expect(navCalls).toEqual(['push', 'push']);
  });

  it('AD-12 a missing [data-view-scroll] at a long-press release throws (rule 6)', async () => {
    const t = await setup();
    t.detach();
    delete t.b.viewScroll.attrs['data-view-scroll'];
    t.down(t.b.cellCard);
    t.advance(400);
    expect(() => t.fire('pointerup', { target: t.b.cellCard })).toThrow(
      /^AD-12 peek release without a rendered \[data-view-scroll\]/,
    );
  });

  it('AD-12 a WordCell drag opens nothing, keeps the selection and lifts no tail (R-12)', async () => {
    const t = await setup();
    t.detach();
    t.tap(t.b.card1);
    t.down(t.b.cellCard, { clientX: 100, clientY: 100 });
    t.fire('pointermove', { clientX: 100, clientY: 120 });
    t.advance(1000);
    t.fire('pointerup', { target: t.b.cellCard });
    expect(t.overlays.peek).toBeNull();
    expect(t.overlays.viewCell).toBeNull();
    expect(t.overlays.selection).toEqual({ column: 1, count: 2 });
    expect(t.b.root.classes.size).toBe(0);
    for (const wrapper of [t.b.card1, t.b.card1b, t.b.card2]) {
      expect(wrapper.classes.size).toBe(0);
    }
    expect(navCalls).toEqual(['push']);
  });
});

describe('AD-12 entry 11 sticky view', () => {
  it('AD-13 a non-empty WordCell tap with nothing selected opens the view (one push); an empty one opens nothing', async () => {
    const t = await setup();
    t.detach();
    t.tap(t.b.cell4);
    expect(t.overlays.viewCell).toBeNull();
    t.tap(t.b.cellCard);
    expect(t.overlays.viewCell).toBe(3);
    expect(navCalls).toEqual(['push']);
  });

  it('AD-13 a still press on the sheet then lift closes the view (one pop)', async () => {
    const t = await setup();
    t.detach();
    t.tap(t.b.cellCard);
    t.down(t.b.sheetMirror);
    expect(t.b.sheetMirror.log).toEqual([]);
    t.advance(1000);
    t.fire('pointerup', { target: t.b.sheetMirror });
    expect(t.overlays.viewCell).toBeNull();
    expect(navCalls).toEqual(['push', 'pop']);
    expect(t.active()).toBe(0);
  });

  it('AD-13 a scrim tap closes only the view; the selection under it is kept', async () => {
    const t = await setup();
    t.detach();
    t.tap(t.b.card1);
    t.overlays.openView(3);
    t.tap(t.b.scrim);
    expect(t.overlays.viewCell).toBeNull();
    expect(t.overlays.selection).toEqual({ column: 1, count: 2 });
    expect(t.overlays.top).toBe('tailSelection');
    expect(navCalls).toEqual(['push', 'push', 'pop']);
    expect(t.b.scrim.log).toEqual([]);
  });

  it('AD-12 a scrim or sheet drag ≥ 8 px keeps the view, a pan’s pointercancel too', async () => {
    const t = await setup();
    t.detach();
    t.tap(t.b.cellCard);
    for (const el of [t.b.scrim, t.b.sheet]) {
      t.down(el, { clientX: 100, clientY: 100 });
      t.fire('pointermove', { clientX: 100, clientY: 120 });
      t.fire('pointerup', { target: el });
      t.down(el, { clientX: 100, clientY: 100 });
      t.fire('pointercancel');
    }
    expect(t.overlays.viewCell).toBe(3);
    expect(navCalls).toEqual(['push']);
    expect(t.active()).toBe(0);
  });

  it('AD-12 the closing tap’s trailing click is swallowed, then a later click is handled', async () => {
    const t = await setup();
    t.detach();
    t.tap(t.b.cellCard);
    t.tap(t.b.scrim);
    const trailing = t.fire('click', { target: t.b.undo, detail: 1 });
    expect(trailing.stopPropagation).toHaveBeenCalledOnce();
    expect(trailing.preventDefault).toHaveBeenCalledOnce();
    const later = t.fire('click', { target: t.b.undo, detail: 1 });
    expect(later.stopPropagation).not.toHaveBeenCalled();
    expect(later.preventDefault).not.toHaveBeenCalled();
    expect(t.b.root.captureListeners.size).toBe(0);
  });

  it('AD-12 the next pointerdown (any id or button) disarms it', async () => {
    for (const init of [{}, { pointerId: 7 }, { button: 2 }]) {
      const t = await setup();
      t.detach();
      t.tap(t.b.cellCard);
      t.tap(t.b.sheet);
      expect(t.b.root.captureListeners.size).toBe(1);
      t.down(t.b.leftover, init);
      expect(t.b.root.captureListeners.size).toBe(0);
      const click = t.fire('click', { target: t.b.undo, detail: 1 });
      expect(click.preventDefault).not.toHaveBeenCalled();
    }
  });

  it('AD-12 the 300 ms expiry armed at pointerup disarms it', async () => {
    const t = await setup();
    t.detach();
    t.tap(t.b.cellCard);
    t.tap(t.b.scrim);
    t.advance(299);
    expect(t.b.root.captureListeners.size).toBe(1);
    t.advance(1);
    expect(t.b.root.captureListeners.size).toBe(0);
  });

  it('AD-12 detach disarms it', async () => {
    const t = await setup();
    const detach = t.detach();
    t.tap(t.b.cellCard);
    t.tap(t.b.scrim);
    detach();
    expect(t.b.root.captureListeners.size).toBe(0);
    expect(t.advance(1000)).toBe(0);
  });
});

describe('AD-13 entry 11 view above a selection', () => {
  // The plan's I/O row "Under view + selection" (F24): wordcellView above tailSelection.
  async function stickyAboveSelection() {
    const t = await setup();
    t.detach();
    t.tap(t.b.card1);
    t.b.viewScroll.scrollHeight = 900;
    t.b.viewScroll.clientHeight = 300;
    t.down(t.b.cellCard);
    t.advance(400);
    t.fire('pointerup', { target: t.b.cellCard });
    expect(t.overlays.top).toBe('wordcellView');
    navCalls.length = 0;
    return t;
  }

  it('AD-13 a peek turned sticky above a selection, then cancel(), cancel({ byBack: true }) and the before-hide cancel(): no throw, selection and view kept, depth 2, no nav call', async () => {
    const t = await stickyAboveSelection();
    const beforeHide = [() => t.controller.cancel()];
    expect(() => {
      t.controller.cancel();
      t.controller.cancel({ byBack: true });
      for (const fn of beforeHide) fn();
    }).not.toThrow();
    // A press held on the sheet when hidden ends with the view kept too.
    t.down(t.b.sheet);
    expect(() => {
      for (const fn of beforeHide) fn();
    }).not.toThrow();
    expect(t.overlays.selection).toEqual({ column: 1, count: 2 });
    expect(t.overlays.viewCell).toBe(3);
    expect(t.overlays.depth).toBe(2);
    expect(navCalls).toEqual([]);
  });

  it('AD-13 the first closedByBack(1) closes the view, closedByBack(0) clears the selection', async () => {
    const t = await stickyAboveSelection();
    t.controller.cancel({ byBack: true });
    t.overlays.closedByBack(1);
    expect(t.overlays.viewCell).toBeNull();
    expect(t.overlays.selection).toEqual({ column: 1, count: 2 });
    t.controller.cancel({ byBack: true });
    t.overlays.closedByBack(0);
    expect(t.overlays.selection).toBeNull();
    expect(t.overlays.depth).toBe(0);
    expect(navCalls).toEqual([]);
  });

  it('AD-13 back while a peek is held above a selection closes the peek (no sticky); closedByBack(0) clears the selection', async () => {
    const t = await setup();
    t.detach();
    t.tap(t.b.card1);
    t.b.viewScroll.scrollHeight = 900;
    t.b.viewScroll.clientHeight = 300;
    t.down(t.b.cellCard);
    t.advance(400);
    navCalls.length = 0;
    t.controller.cancel({ byBack: true });
    expect(t.overlays.peek).toBeNull();
    expect(t.overlays.viewCell).toBeNull();
    t.overlays.closedByBack(0);
    expect(t.overlays.selection).toBeNull();
    t.fire('pointerup', { target: t.b.cellCard });
    expect(t.overlays.viewCell).toBeNull();
    expect(navCalls).toEqual([]);
  });
});

describe('AD-12 detached', () => {
  it('AD-12 cancel() and cancel({ byBack: true }) before attach and after detach call no gate, nav or overlays', async () => {
    const t = await setup();
    t.overlays.openPeek(3);
    t.controller.cancel();
    t.controller.cancel({ byBack: true });
    const detach = t.detach();
    t.controller.cancel();
    detach();
    t.controller.cancel();
    t.controller.cancel({ byBack: true });
    expect(t.overlays.peek).toBe(3);
    expect(t.counts).toEqual({ enter: 0, leave: 0 });
    expect(navCalls).toEqual([]);
  });
});

describe('AD-12 long-press timer', () => {
  it('AD-12 setTimer(…, 400) only for WordCell presses', async () => {
    const t = await setup();
    t.detach();
    for (const el of [t.b.card1, t.b.foot1, t.b.tile, t.b.leftover]) {
      t.down(el);
      t.fire('pointerup');
    }
    expect(t.setTimer).not.toHaveBeenCalled();
    for (const el of [t.b.cellCard, t.b.cell4]) {
      t.down(el);
      t.fire('pointerup');
    }
    expect(t.setTimer.mock.calls.map(([, ms]) => ms)).toEqual([400, 400]);
  });

  it('AD-12 a held WordCell press fires at 400 ms, not 399', async () => {
    const t = await setup();
    t.detach();
    t.down(t.b.cellCard);
    expect(t.advance(399)).toBe(0);
    expect(t.advance(1)).toBe(1);
    t.fire('pointerup');
    expect(t.clearTimer).not.toHaveBeenCalled();
    expect(t.active()).toBe(0);
  });

  it('AD-12 a drag latched at 300 ms clears the timer; nothing fires later', async () => {
    const t = await setup();
    t.detach();
    t.down(t.b.cellCard, { clientX: 100, clientY: 100 });
    t.advance(300);
    t.fire('pointermove', { clientX: 110, clientY: 100 });
    expect(t.clearTimer).toHaveBeenCalledWith(t.setTimer.mock.results[0]?.value);
    expect(t.advance(500)).toBe(0);
    t.fire('pointerup');
    expect(t.clearTimer).toHaveBeenCalledTimes(1);
  });

  it('AD-12 cancel() at 200 ms clears the timer; nothing fires later', async () => {
    const t = await setup();
    t.detach();
    t.down(t.b.cellCard);
    t.advance(200);
    t.controller.cancel();
    expect(t.clearTimer).toHaveBeenCalledWith(t.setTimer.mock.results[0]?.value);
    expect(t.advance(500)).toBe(0);
  });

  it('AD-12 pointerup, pointercancel, lostpointercapture, a same-id pointerdown and detach each clear a pending timer', async () => {
    const enders: ((t: Awaited<ReturnType<typeof setup>>, detach: () => void) => void)[] = [
      (t) => t.fire('pointerup'),
      (t) => t.fire('pointercancel'),
      (t) => {
        t.b.cell4.captures.clear();
        t.fire('lostpointercapture', { target: t.b.cell4 });
      },
      (t) => t.down(t.b.leftover),
      (_t, detach) => detach(),
    ];
    for (const ender of enders) {
      const t = await setup();
      const detach = t.detach();
      t.down(t.b.cell4);
      ender(t, detach);
      expect(t.clearTimer).toHaveBeenCalledWith(t.setTimer.mock.results[0]?.value);
      expect(t.advance(1000)).toBe(0);
    }
  });
});

describe('AD-13 F24 press-only paths', () => {
  it('AD-13 F24 (a) a tap-selection, a press on another column’s card held at hide: selection kept, no nav call after select(), gate balanced, later pointerup ignored', async () => {
    const t = await setup();
    t.detach();
    const scrollReset = vi.fn();
    const beforeHide = [() => t.controller.cancel(), scrollReset];
    t.overlays.select(1, 1);
    navCalls.length = 0;
    t.down(t.b.card2);
    for (const fn of beforeHide) fn();
    expect(scrollReset).toHaveBeenCalledOnce();
    expect(t.overlays.selection).toEqual({ column: 1, count: 1 });
    expect(navCalls).toEqual([]);
    expect(t.counts).toEqual({ enter: 1, leave: 1 });
    t.fire('pointerup', { target: t.b.card2 });
    expect(t.counts).toEqual({ enter: 1, leave: 1 });
    expect(navCalls).toEqual([]);
  });

  it('AD-13 F24 (b) a tap-selection, a held WordCell press, then openView, hide: no throw, both kept, no nav call after openView()', async () => {
    const t = await setup();
    t.detach();
    const beforeHide = [() => t.controller.cancel(), vi.fn()];
    t.overlays.select(1, 1);
    t.down(t.b.cellCard);
    t.overlays.openView(3);
    navCalls.length = 0;
    expect(() => {
      for (const fn of beforeHide) fn();
    }).not.toThrow();
    expect(t.overlays.selection).toEqual({ column: 1, count: 1 });
    expect(t.overlays.viewCell).toBe(3);
    expect(navCalls).toEqual([]);
    expect(t.counts).toEqual({ enter: 1, leave: 1 });
  });
});

describe('AD-12 entry 7 tap actions', () => {
  it('AD-12 a held column-card press released without a drag is a tap and selects the tail', async () => {
    const t = await setup();
    t.detach();
    t.down(t.b.card1);
    t.advance(1000);
    t.fire('pointerup', { target: t.b.card1 });
    expect(t.overlays.selection).toEqual({ column: 1, count: 2 });
    expect(navCalls).toEqual(['push']);
    expect(t.active()).toBe(0);
  });

  it('AD-13 a tap-drop deselects (nav pop) before it dispatches the drop', async () => {
    const t = await setup();
    t.detach();
    t.tap(t.b.card1);
    t.tap(t.b.card2);
    expect(t.overlays.selection).toBeNull();
    expect(navCalls).toEqual([
      'push',
      'pop',
      'dispatch {"type":"drop","sourceColumn":1,"sourceCount":2,"destinationColumn":2}',
    ]);
  });

  it('AD-13 a re-select changes the count with no nav call; the selected card is a no-op', async () => {
    const t = await setup();
    t.detach();
    t.tap(t.b.card1);
    t.tap(t.b.card1b);
    expect(t.overlays.selection).toEqual({ column: 1, count: 1 });
    t.tap(t.b.card1b);
    expect(t.overlays.selection).toEqual({ column: 1, count: 1 });
    expect(navCalls).toEqual(['push']);
  });

  it('AD-12 a self-drop from the source foot; nothing selected, a foot tap is inert', async () => {
    const t = await setup();
    t.detach();
    t.tap(t.b.foot1);
    expect(t.overlays.selection).toBeNull();
    t.tap(t.b.card1b);
    t.tap(t.b.foot1);
    expect(navCalls).toEqual([
      'push',
      'pop',
      'dispatch {"type":"drop","sourceColumn":1,"sourceCount":1,"destinationColumn":1}',
    ]);
  });

  // Entry 9: a pick-up drag with a selection open replaces it (AD-13 entry 9 selection replacement).
  // Entry 11: the non-empty long-press opens a peek, closed on release (no overflow).
  it('AD-12 a non-empty WordCell long-press peeks and closes on release with the selection kept; an empty-WordCell long-press deselects on release', async () => {
    const t = await setup();
    t.detach();
    t.tap(t.b.card1);
    t.down(t.b.cellCard);
    t.advance(400);
    expect(t.overlays.peek).toBe(3);
    t.fire('pointerup', { target: t.b.cellCard });
    expect(t.overlays.peek).toBeNull();
    expect(t.overlays.viewCell).toBeNull();
    expect(t.overlays.selection).toEqual({ column: 1, count: 2 });
    expect(navCalls).toEqual(['push']);
    t.down(t.b.cell4);
    t.advance(400);
    t.fire('pointerup', { target: t.b.cell4 });
    expect(t.overlays.selection).toBeNull();
    expect(navCalls).toEqual(['push', 'pop']);
  });

  it('AD-12 a WordCell tap deselects; F25 an outside tap deselects', async () => {
    const t = await setup();
    t.detach();
    t.tap(t.b.card1);
    t.tap(t.b.cellCard);
    expect(t.overlays.selection).toBeNull();
    t.tap(t.b.card2);
    t.tap(t.b.leftover);
    expect(t.overlays.selection).toBeNull();
    t.tap(t.b.card2);
    t.tap(t.b.redoDisabled);
    expect(t.overlays.selection).toBeNull();
    expect(navCalls).toEqual(['push', 'pop', 'push', 'pop', 'push', 'pop']);
  });

  it('AD-13 F25 with openView above a selection an outside tap keeps it and does not throw', async () => {
    const t = await setup();
    t.detach();
    t.tap(t.b.card1);
    t.overlays.openView(3);
    navCalls.length = 0;
    expect(() => t.tap(t.b.leftover)).not.toThrow();
    expect(t.overlays.selection).toEqual({ column: 1, count: 2 });
    expect(t.overlays.viewCell).toBe(3);
    expect(navCalls).toEqual([]);
  });

  it('AD-11 a non-card column press is captured and its contextmenu prevented only with a selection', async () => {
    const t = await setup();
    t.detach();
    t.down(t.b.foot1);
    expect(t.fire('contextmenu').preventDefault).not.toHaveBeenCalled();
    t.fire('pointercancel');
    expect(t.b.foot1.log).toEqual([]);
    t.tap(t.b.card2);
    t.down(t.b.foot1);
    expect(t.b.foot1.log).toEqual(['set 1']);
    expect(t.fire('contextmenu').preventDefault).toHaveBeenCalled();
    t.fire('pointercancel');
    t.down(t.b.ghost);
    expect(t.b.column1.log).toEqual(['set 1']);
    expect(t.fire('contextmenu').preventDefault).toHaveBeenCalled();
    t.fire('pointercancel');
    expect(t.overlays.selection).toEqual({ column: 2, count: 1 });
  });

  it('AD-12 F25 a click with detail 0 resolving outside deselects; detail 1 and a column target do nothing', async () => {
    const t = await setup();
    t.detach();
    t.tap(t.b.card1);
    t.fire('click', { target: t.b.leftover, detail: 1 });
    t.fire('click', { target: t.b.card2, detail: 0 });
    t.fire('click', { target: t.b.undo, detail: 0 });
    expect(t.overlays.selection).toEqual({ column: 1, count: 2 });
    t.fire('click', { target: t.b.leftover, detail: 0 });
    expect(t.overlays.selection).toBeNull();
    expect(navCalls).toEqual(['push', 'pop']);
  });
});

describe('AD-12 entry 7 hover', () => {
  it('AD-12 refreshHover toggles the column classes and clears them on leave and detach', async () => {
    const t = await setup();
    const detach = t.detach();
    t.hover(t.b.card1b);
    expect([...t.b.column1.classes]).toEqual(['wc-hover-tail', 'wc-grab']);
    expect(t.b.column1.props.get('--wc-hover-from')).toBe('1');
    t.hover(t.b.card2);
    expect(t.b.column1.classes.size).toBe(0);
    expect(t.b.column1.props.size).toBe(0);
    expect([...t.b.column2.classes]).toEqual(['wc-hover-tail', 'wc-grab']);
    // A touch pointerover is not hover.
    t.b.root.fire('pointerover', { pointerType: 'touch', target: t.b.card1 });
    expect([...t.b.column2.classes]).toEqual(['wc-hover-tail', 'wc-grab']);
    t.overlays.select(1, 1);
    t.controller.refreshHover();
    expect([...t.b.column2.classes]).toEqual(['wc-drop']);
    t.hover(t.b.foot1);
    expect(t.b.column2.classes.size).toBe(0);
    expect([...t.b.column1.classes]).toEqual(['wc-drop-self']);
    t.hover(t.b.card1b);
    expect(t.b.column1.classes.size).toBe(0);
    t.hover(t.b.card1);
    expect([...t.b.column1.classes]).toEqual(['wc-hover-tail']);
    expect(t.b.column1.props.get('--wc-hover-from')).toBe('0');
    t.b.root.fire('pointerout', { pointerType: 'mouse', relatedTarget: t.b.card2 });
    expect([...t.b.column1.classes]).toEqual(['wc-hover-tail']);
    t.b.root.fire('pointerout', { pointerType: 'mouse', relatedTarget: null });
    expect(t.b.column1.classes.size).toBe(0);
    t.controller.refreshHover();
    expect(t.b.column1.classes.size).toBe(0);
    t.hover(t.b.card2);
    expect([...t.b.column2.classes]).toEqual(['wc-drop']);
    detach();
    expect(t.b.column2.classes.size).toBe(0);
    t.controller.refreshHover();
    expect(t.b.column2.classes.size).toBe(0);
  });
});

describe('AD-12 entry 8 drag', () => {
  type T = Awaited<ReturnType<typeof setup>>;
  const drop = (source: number, count: number, destination: number) =>
    `dispatch ${JSON.stringify({ type: 'drop', sourceColumn: source, sourceCount: count, destinationColumn: destination })}`;
  // Every `wc-drag-*` class on any element of the board, as `<tag>#<i>:<class>`.
  const dragClasses = (t: T): string[] => {
    const out: string[] = [];
    const walk = (el: FakeEl) => {
      for (const c of el.classes) if (c.startsWith('wc-drag')) out.push(`${el.tag}:${c}`);
      for (const child of el.children) walk(child);
    };
    walk(t.b.root);
    return out;
  };
  const faces = (t: T) => [t.b.face1, t.b.face1b, t.b.face2];
  const transforms = (t: T) => faces(t).map((f) => f.style.transform);
  const animations = (t: T) => faces(t).flatMap((f) => f.animations);
  const move = (t: T, x: number, y: number, init: Partial<FakeEvent> = {}) =>
    t.fire('pointermove', { clientX: x, clientY: y, ...init });

  it('AD-12 a single-move flick onto column 3 drops there', async () => {
    const t = await setup();
    t.detach();
    t.down(t.b.card1b, { clientX: 25, clientY: 50 });
    move(t, 125, 50);
    expect(t.b.face1b.style.transform).toBe('translate(100px, 0px)');
    expect(t.b.placeholder3.classes.has('wc-drag-target')).toBe(true);
    expect(navCalls).toEqual([]);
    // What the tail and target carry at the moment the drop dispatches.
    let atDispatch: { classes: string[]; transforms: string[] } | null = null;
    shared.onDispatch = () => {
      atDispatch = { classes: dragClasses(t), transforms: transforms(t) };
    };
    t.fire('pointerup');
    expect(atDispatch).toEqual({ classes: [], transforms: ['', '', ''] });
    expect(navCalls).toEqual([drop(1, 1, 3)]);
    expect(dragClasses(t)).toEqual([]);
    expect(transforms(t)).toEqual(['', '', '']);
    expect(animations(t)).toEqual([]);
    expect(t.active()).toBe(0);
  });

  it('AD-12 the transform is written on every tail face per move, with no dispatch or nav call before release and one dispatch at release', async () => {
    const t = await setup();
    t.detach();
    t.down(t.b.card1, { clientX: 25, clientY: 10 });
    move(t, 25, 20);
    expect(transforms(t)).toEqual(['translate(0px, 10px)', 'translate(0px, 10px)', '']);
    expect(dragClasses(t).sort()).toEqual(
      ['div:wc-drag-ghost', 'div:wc-drag-ghost', 'div:wc-drag-layer', 'div:wc-drag-layer'].sort(),
    );
    expect([...t.b.card1.classes, ...t.b.face1b.classes]).toEqual([
      'wc-drag-ghost',
      'face',
      'wc-drag-layer',
    ]);
    move(t, 60, 12);
    expect(transforms(t)).toEqual(['translate(35px, 2px)', 'translate(35px, 2px)', '']);
    move(t, 75, 10);
    expect(transforms(t)).toEqual(['translate(50px, 0px)', 'translate(50px, 0px)', '']);
    expect(t.b.card2.classes.has('wc-drag-target')).toBe(true);
    expect(navCalls).toEqual([]);
    expect(t.overlays.selection).toBeNull();
    t.fire('pointerup');
    expect(navCalls).toEqual([drop(1, 2, 2)]);
    expect(dragClasses(t)).toEqual([]);
    expect(transforms(t)).toEqual(['', '', '']);
    expect(t.active()).toBe(0);
  });

  it('AD-12 a drag that never leaves the source highlights nothing and releases with no dispatch', async () => {
    const t = await setup();
    t.detach();
    t.down(t.b.card1b, { clientX: 25, clientY: 50 });
    for (const [x, y] of [
      [25, 60],
      [25, 70],
      [30, 80],
    ] as const) {
      move(t, x, y);
      expect(dragClasses(t).filter((c) => c.endsWith('wc-drag-target'))).toEqual([]);
    }
    t.fire('pointerup');
    expect(navCalls).toEqual([]);
    expect(t.b.face1b.animations).toHaveLength(1);
    expect(t.active()).toBe(1);
    t.advance(180);
    expect(t.active()).toBe(0);
    expect(dragClasses(t)).toEqual([]);
  });

  it('AD-12 leave and return highlights the source: partial on the card above the tail, whole on the placeholder', async () => {
    const t = await setup();
    t.detach();
    t.down(t.b.card1b, { clientX: 25, clientY: 50 });
    move(t, 75, 50);
    expect(t.b.card2.classes.has('wc-drag-target')).toBe(true);
    move(t, 25, 50);
    expect(t.b.card2.classes.has('wc-drag-target')).toBe(false);
    expect(t.b.card1.classes.has('wc-drag-target')).toBe(true);
    t.fire('pointerup');
    expect(navCalls).toEqual([drop(1, 1, 1)]);
    expect(dragClasses(t)).toEqual([]);

    navCalls.length = 0;
    t.down(t.b.card1, { clientX: 25, clientY: 10 });
    move(t, 75, 10);
    move(t, 25, 10);
    expect(t.b.placeholder1.classes.has('wc-drag-target')).toBe(true);
    t.fire('pointerup');
    expect(navCalls).toEqual([drop(1, 2, 1)]);
    expect(dragClasses(t)).toEqual([]);
  });

  it('AD-12 overlap is measured on the grabbed face (tail[0]), not the faces below it', async () => {
    const t = await setup();
    t.detach();
    // Tail [face1 (y 0–60), face1b (y 20–80)] over column 3 (y 0–400). Down 380: face1 keeps
    // 20/60 in column 3, face1b none → column 3 lights.
    t.down(t.b.card1, { clientX: 25, clientY: 10 });
    move(t, 125, 390);
    expect(t.b.placeholder3.classes.has('wc-drag-target')).toBe(true);
    // Up 50: face1 keeps 10/60 (< 25 %), face1b 30/60 → nothing lights.
    move(t, 125, -40);
    expect(dragClasses(t).filter((c) => c.endsWith('wc-drag-target'))).toEqual([]);
    t.controller.cancel();
    expect(navCalls).toEqual([]);
  });

  it('AD-12 leaving the source through no column (raw null) and returning highlights the source', async () => {
    const t = await setup();
    t.detach();
    t.down(t.b.card1b, { clientX: 25, clientY: 50 });
    move(t, 25, 1050);
    expect(dragClasses(t).filter((c) => c.endsWith('wc-drag-target'))).toEqual([]);
    move(t, 25, 50);
    expect(t.b.card1.classes.has('wc-drag-target')).toBe(true);
    t.fire('pointerup');
    expect(navCalls).toEqual([drop(1, 1, 1)]);
  });

  // `duration('flyBack')` answers baseMs + 57 (no other kind does), proving the kind, not just the
  // baseMs.
  for (const baseMs of [180, 320]) {
    it(`AD-10 the fly-back runs over duration('flyBack') at baseMs ${baseMs} from the last transform`, async () => {
      const t = await setup();
      motion.value = { baseMs, reduced: false };
      const ms = baseMs + 57;
      durations.override = { flyBack: ms };
      t.detach();
      t.down(t.b.card1b, { clientX: 25, clientY: 50 });
      move(t, 25, 600);
      move(t, 25, 1050);
      t.fire('pointerup');
      const [a] = t.b.face1b.animations;
      expect(a?.keyframes).toEqual([
        { transform: 'translate(0px, 1000px)' },
        { transform: 'translate(0px, 0px)' },
      ]);
      expect(durations.kinds).toEqual(['flyBack']);
      expect(a?.options).toEqual({ duration: ms, easing: 'ease-out' });
      expect(t.b.face1b.style.transform).toBe('');
      expect(dragClasses(t).sort()).toEqual(['div:wc-drag-ghost', 'div:wc-drag-layer']);
      expect(t.active()).toBe(1);
      t.advance(ms - 1);
      expect(t.active()).toBe(1);
      t.advance(1);
      expect(t.active()).toBe(0);
      expect(dragClasses(t)).toEqual([]);
      expect(navCalls).toEqual([]);
    });
  }

  it('AD-10 reduced motion clears the transform at once and fades the faces 0 → 1 over 120 ms, gate entered then left', async () => {
    const t = await setup();
    motion.value = { baseMs: 320, reduced: true };
    t.detach();
    t.down(t.b.card1, { clientX: 25, clientY: 10 });
    move(t, 25, 1010);
    t.fire('pointerup');
    expect(transforms(t)).toEqual(['', '', '']);
    for (const f of [t.b.face1, t.b.face1b]) {
      expect(f.animations.map((a) => [a.keyframes, a.options])).toEqual([
        [[{ opacity: 0 }, { opacity: 1 }], { duration: 120 }],
      ]);
    }
    expect(durations.kinds).toEqual(['flyBack']);
    expect(t.counts).toEqual({ enter: 2, leave: 1 });
    t.advance(120);
    expect(t.counts).toEqual({ enter: 2, leave: 2 });
    expect(dragClasses(t)).toEqual([]);
  });

  const platformEnds: [string, (t: T) => void][] = [
    ['pointercancel', (t) => t.fire('pointercancel')],
    ['lostpointercapture', (t) => t.fire('lostpointercapture', { target: t.b.card1b })],
    ['cancel({ byBack: true })', (t) => t.controller.cancel({ byBack: true })],
  ];
  for (const [name, ender] of platformEnds) {
    it(`AD-12 ${name} with a column highlighted flies back from the last transform, no dispatch`, async () => {
      const t = await setup();
      t.detach();
      t.down(t.b.card1b, { clientX: 25, clientY: 50 });
      move(t, 125, 50);
      expect(t.b.placeholder3.classes.has('wc-drag-target')).toBe(true);
      ender(t);
      expect(t.b.placeholder3.classes.has('wc-drag-target')).toBe(false);
      const [a] = t.b.face1b.animations;
      expect(a?.keyframes[0]).toEqual({ transform: 'translate(100px, 0px)' });
      expect(a?.options.duration).toBe(180);
      expect(t.b.face1b.style.transform).toBe('');
      expect(t.active()).toBe(1);
      t.advance(180);
      expect(t.active()).toBe(0);
      expect(dragClasses(t)).toEqual([]);
      expect(navCalls).toEqual([]);
    });
  }

  it('AD-12 a plain cancel(), detach and a same-id pointerdown mid-drag snap back: no transform or drag class, gate idle, no dispatch', async () => {
    const enders: [string, (t: T, detach: () => void) => void][] = [
      ['cancel()', (t) => t.controller.cancel()],
      ['detach', (_t, detach) => detach()],
      [
        'same-id pointerdown',
        (t) => {
          t.down(t.b.leftover);
          t.fire('pointerup');
        },
      ],
    ];
    for (const [name, ender] of enders) {
      const t = await setup();
      const detach = t.detach();
      t.down(t.b.card1, { clientX: 25, clientY: 10 });
      move(t, 125, 10);
      expect(t.b.placeholder3.classes.has('wc-drag-target'), name).toBe(true);
      ender(t, detach);
      expect(dragClasses(t), name).toEqual([]);
      expect(transforms(t), name).toEqual(['', '', '']);
      expect(animations(t), name).toEqual([]);
      expect(t.active(), name).toBe(0);
      expect(navCalls, name).toEqual([]);
    }
  });

  it('AD-12 a plain cancel() mid-fly-back finishes it at once, with or without a press: gate idle before it returns', async () => {
    for (const withPress of [false, true]) {
      const t = await setup();
      t.detach();
      t.down(t.b.card1b, { clientX: 25, clientY: 50 });
      move(t, 25, 1050);
      t.fire('pointerup');
      expect(t.active()).toBe(1);
      if (withPress) t.down(t.b.card2);
      t.controller.cancel();
      const [a] = t.b.face1b.animations;
      expect(a?.finish).toHaveBeenCalledOnce();
      expect(t.active()).toBe(0);
      expect(dragClasses(t)).toEqual([]);
      expect(transforms(t)).toEqual(['', '', '']);
      expect(navCalls).toEqual([]);
      // The finished animation's own end changes nothing more.
      t.advance(1000);
      expect(t.active()).toBe(0);
    }
  });

  it('AD-12 a new drag settles a running fly-back first', async () => {
    const t = await setup();
    t.detach();
    t.down(t.b.card1b, { clientX: 25, clientY: 50 });
    move(t, 25, 1050);
    t.fire('pointerup');
    t.down(t.b.card2, { clientX: 75, clientY: 30 });
    move(t, 75, 1030);
    expect(t.b.face1b.animations[0]?.finish).toHaveBeenCalledOnce();
    expect(t.b.card1b.classes.has('wc-drag-ghost')).toBe(false);
    expect(t.b.card2.classes.has('wc-drag-ghost')).toBe(true);
    expect(t.active()).toBe(1);
    t.controller.cancel();
    expect(t.active()).toBe(0);
  });

  it('AD-13 with a selection open, a drag dropped on a column other than its source deselects (pop) once, before the dispatch', async () => {
    const t = await setup();
    t.detach();
    t.tap(t.b.card2);
    expect(t.overlays.selection).toEqual({ column: 2, count: 1 });
    t.down(t.b.card1b, { clientX: 25, clientY: 50 });
    move(t, 125, 50);
    expect(navCalls).toEqual(['push']);
    t.fire('pointerup');
    expect(navCalls).toEqual(['push', 'pop', drop(1, 1, 3)]);
    expect(t.overlays.selection).toBeNull();
  });

  it('AD-12 hover classes clear at threshold; refreshHover() and pointerover add none mid-drag or mid-fly-back; the fly-back end recomputes them', async () => {
    const t = await setup();
    t.detach();
    const mouse = { pointerType: 'mouse' };
    t.hover(t.b.card1b);
    expect([...t.b.column1.classes]).toEqual(['wc-hover-tail', 'wc-grab']);
    t.down(t.b.card1b, { ...mouse, clientX: 25, clientY: 50 });
    move(t, 25, 1050, mouse);
    expect(t.b.column1.classes.size).toBe(0);
    t.controller.refreshHover();
    t.hover(t.b.card1b);
    expect(t.b.column1.classes.size).toBe(0);
    t.fire('pointerup', mouse);
    t.controller.refreshHover();
    t.hover(t.b.card1b);
    expect(t.b.column1.classes.size).toBe(0);
    t.advance(180);
    expect([...t.b.column1.classes]).toEqual(['wc-hover-tail', 'wc-grab']);
  });

  it('AD-12 a mouse drag dropped on a column, or snapped back by cancel(), recomputes the hover at the last point with no further pointer event', async () => {
    const mouse = { pointerType: 'mouse' };
    const enders: [string, (t: T) => void][] = [
      ['drop', (t) => t.fire('pointerup', mouse)],
      ['cancel()', (t) => t.controller.cancel()],
    ];
    for (const [name, ender] of enders) {
      const t = await setup();
      t.detach();
      t.hover(t.b.card1b);
      t.down(t.b.card1b, { ...mouse, clientX: 25, clientY: 50 });
      move(t, 75, 50, mouse);
      expect(t.b.card2.classes.has('wc-drag-target'), name).toBe(true);
      // The last pointer point is over column 2's card.
      t.point(t.b.card2);
      ender(t);
      expect(t.active(), name).toBe(0);
      expect([...t.b.column2.classes], name).toEqual(['wc-hover-tail', 'wc-grab']);
    }
  });

  it('AD-12 a cancelled fly-back animation throws (rule 6)', async () => {
    const t = await setup();
    t.detach();
    t.down(t.b.card1b, { clientX: 25, clientY: 50 });
    move(t, 25, 1050);
    t.fire('pointerup');
    const [a] = t.b.face1b.animations;
    expect(() => a?.oncancel?.()).toThrow(/^AD-12 fly-back animation cancelled$/);
  });

  it('AD-12 a drag from a column whose canPickUp is false does nothing', async () => {
    const t = await setup();
    t.detach();
    const view = shared.view as { columns: { canPickUp: boolean }[] };
    (view.columns[0] as { canPickUp: boolean }).canPickUp = false;
    t.down(t.b.card1b, { clientX: 25, clientY: 50 });
    move(t, 125, 50);
    expect(dragClasses(t)).toEqual([]);
    expect(transforms(t)).toEqual(['', '', '']);
    t.fire('pointerup');
    expect(navCalls).toEqual([]);
    expect(animations(t)).toEqual([]);
    expect(t.active()).toBe(0);
  });
});

describe('AD-13 entry 9 selection replacement', () => {
  type T = Awaited<ReturnType<typeof setup>>;
  const SUPPRESSED = 'wc-selection-suppressed';
  const drop = (source: number, count: number, destination: number) =>
    `dispatch ${JSON.stringify({ type: 'drop', sourceColumn: source, sourceCount: count, destinationColumn: destination })}`;
  const suppressed = (t: T) => t.b.root.classes.has(SUPPRESSED);
  const move = (t: T, x: number, y: number) => t.fire('pointermove', { clientX: x, clientY: y });
  const animations = (t: T) => [t.b.face1, t.b.face1b, t.b.face2].flatMap((f) => f.animations);
  const dragResidue = (t: T) =>
    [t.b.card1, t.b.card1b, t.b.card2, t.b.face1, t.b.face1b, t.b.face2].filter(
      (el) => [...el.classes].some((c) => c.startsWith('wc-drag')) || el.style.transform !== '',
    ).length;
  // Opens `selection`, then starts a pick-up drag of column 1's bottom card (card1b) and moves it
  // to (x, y); navCalls start empty after the select.
  async function replacing(
    selection: [column: number, count: number],
    x: number,
    y: number,
  ): Promise<T & { detachFn: () => void }> {
    const t = await setup();
    const detachFn = t.detach();
    t.overlays.select(...selection);
    navCalls.length = 0;
    t.down(t.b.card1b, { clientX: 25, clientY: 50 });
    move(t, x, y);
    expect(suppressed(t)).toBe(true);
    return { ...t, detachFn };
  }

  type Ending = {
    name: string;
    selection: [number, number];
    to: [number, number];
    end: (t: T & { detachFn: () => void }) => void;
  };
  const deselecting: Ending[] = [
    {
      name: 'release over nothing',
      selection: [2, 1],
      to: [25, 1050],
      end: (t) => t.fire('pointerup'),
    },
    {
      name: 'release on the never-left source',
      selection: [1, 2],
      to: [25, 70],
      end: (t) => t.fire('pointerup'),
    },
    {
      // Column 4 registers no drop target in the fixture: nothing is highlighted over it.
      name: 'release over a non-target column',
      selection: [2, 1],
      to: [175, 50],
      end: (t) => t.fire('pointerup'),
    },
  ];
  it.each(deselecting)(
    'AD-13 F24 $name: fly-back, class gone at end(), one pop, no dispatch',
    async ({ selection, to, end }) => {
      const t = await replacing(selection, ...to);
      end(t);
      expect(suppressed(t)).toBe(false);
      expect(t.b.face1b.animations).toHaveLength(1);
      expect(navCalls).toEqual(['pop']);
      expect(t.overlays.selection).toBeNull();
      t.advance(180);
      expect(t.active()).toBe(0);
      expect(navCalls).toEqual(['pop']);
    },
  );

  it('AD-13 F24 a drop on another column: class gone before the dispatch, pop then one drop', async () => {
    const t = await replacing([2, 1], 125, 50);
    expect(t.b.placeholder3.classes.has('wc-drag-target')).toBe(true);
    let atDispatch: boolean | null = null;
    shared.onDispatch = () => {
      atDispatch = suppressed(t);
    };
    t.fire('pointerup');
    expect(atDispatch).toBe(false);
    expect(navCalls).toEqual(['pop', drop(1, 1, 3)]);
    expect(t.overlays.selection).toBeNull();
    expect(t.active()).toBe(0);
  });

  const snapping: Ending[] = [
    { name: 'plain cancel()', selection: [2, 1], to: [125, 50], end: (t) => t.controller.cancel() },
    { name: 'detach', selection: [2, 1], to: [125, 50], end: (t) => t.detachFn() },
  ];
  it.each(snapping)(
    'AD-13 F24 $name: snap back, class gone, one pop',
    async ({ selection, to, end }) => {
      const t = await replacing(selection, ...to);
      end(t);
      expect(suppressed(t)).toBe(false);
      expect(animations(t)).toEqual([]);
      expect(dragResidue(t)).toBe(0);
      expect(navCalls).toEqual(['pop']);
      expect(t.overlays.selection).toBeNull();
      expect(t.active()).toBe(0);
    },
  );

  const restoring: Ending[] = [
    {
      name: 'cancel({ byBack: true })',
      selection: [2, 1],
      to: [125, 50],
      end: (t) => t.controller.cancel({ byBack: true }),
    },
    {
      name: 'pointercancel',
      selection: [2, 1],
      to: [125, 50],
      end: (t) => t.fire('pointercancel'),
    },
    {
      name: 'lostpointercapture',
      selection: [2, 1],
      to: [125, 50],
      end: (t) => t.fire('lostpointercapture', { target: t.b.card1b }),
    },
  ];
  it.each(restoring)(
    'AD-13 F28 $name: fly-back, class gone at its start (F33), selection kept, no nav call',
    async ({ selection, to, end }) => {
      const t = await replacing(selection, ...to);
      end(t);
      expect(t.b.face1b.animations).toHaveLength(1);
      expect(suppressed(t)).toBe(false);
      expect(t.overlays.selection).toEqual({ column: 2, count: 1 });
      t.advance(179);
      expect(t.active()).toBe(1);
      t.advance(1);
      expect(suppressed(t)).toBe(false);
      expect(t.overlays.selection).toEqual({ column: 2, count: 1 });
      expect(navCalls).toEqual([]);
      expect(t.active()).toBe(0);
    },
  );

  const settles: [string, (t: T & { detachFn: () => void }) => void][] = [
    ['onfinish', (t) => t.advance(180)],
    // An enabled button: the press finishes the flight, resolves to nothing and leaves the gate.
    ['a press', (t) => t.down(t.b.undoIcon)],
    ['cancel()', (t) => t.controller.cancel()],
    ['detach', (t) => t.detachFn()],
  ];
  it.each(settles)(
    'AD-13 F28 a restoring fly-back settled by %s: class removed, selection kept, no nav call, gate idle',
    async (_name, settle) => {
      const t = await replacing([2, 1], 125, 50);
      t.fire('pointercancel');
      // F33: the class goes at the fly-back's start.
      expect(suppressed(t)).toBe(false);
      settle(t);
      expect(suppressed(t)).toBe(false);
      expect(dragResidue(t)).toBe(0);
      expect(t.overlays.selection).toEqual({ column: 2, count: 1 });
      expect(navCalls).toEqual([]);
      expect(t.active()).toBe(0);
    },
  );

  it('AD-13 F24 a same-id pointerdown mid-drag snaps back and restores at once; the new press sees the selection', async () => {
    const t = await replacing([2, 1], 125, 50);
    t.down(t.b.foot1);
    expect(suppressed(t)).toBe(false);
    expect(animations(t)).toEqual([]);
    expect(dragResidue(t)).toBe(0);
    expect(t.overlays.selection).toEqual({ column: 2, count: 1 });
    expect(navCalls).toEqual([]);
    // A foot press is captured only with a selection open (entry 7).
    expect(t.b.foot1.log).toEqual(['set 1']);
    expect(t.active()).toBe(1);
    t.fire('pointercancel');
    expect(t.active()).toBe(0);
    expect(navCalls).toEqual([]);
  });

  it('AD-13 F28 a press during a restoring fly-back settles it; the press is captured with the selection open', async () => {
    const t = await replacing([2, 1], 125, 50);
    t.fire('pointercancel');
    // F33: the class goes at the fly-back's start.
    expect(suppressed(t)).toBe(false);
    t.down(t.b.foot1);
    expect(suppressed(t)).toBe(false);
    expect(t.overlays.selection).toEqual({ column: 2, count: 1 });
    // A foot press is captured only with a selection open (entry 7).
    expect(t.b.foot1.log).toEqual(['set 1']);
    expect(navCalls).toEqual([]);
    t.fire('pointercancel');
    expect(t.active()).toBe(0);
    expect(navCalls).toEqual([]);
  });

  it('AD-12 F24 the class goes on at the threshold-crossing move, not below it', async () => {
    const t = await setup();
    t.detach();
    t.overlays.select(2, 1);
    t.down(t.b.card1b, { clientX: 25, clientY: 50 });
    move(t, 25, 54);
    expect(suppressed(t)).toBe(false);
    move(t, 25, 58);
    expect(suppressed(t)).toBe(true);
    expect(t.b.face1b.classes.has('wc-drag-layer')).toBe(true);
    t.controller.cancel();
  });

  it('AD-12 CAP-4 an inert drag with a selection (foot pad, column space, placeholder, non-pickable card, WordCell) and a pick-up drag with nothing selected never add the class', async () => {
    for (const from of ['foot', 'space', 'placeholder', 'non-pickable card', 'WordCell'] as const) {
      const t = await setup();
      t.detach();
      t.overlays.select(2, 1);
      navCalls.length = 0;
      const view = shared.view as { columns: { canPickUp: boolean }[] };
      (view.columns[0] as { canPickUp: boolean }).canPickUp = false;
      const pressed = {
        foot: t.b.foot1,
        space: t.b.column1,
        placeholder: t.b.placeholder1,
        'non-pickable card': t.b.card1b,
        WordCell: t.b.cellCard,
      }[from];
      t.down(pressed, { clientX: 25, clientY: 300 });
      move(t, 45, 300);
      expect(suppressed(t), from).toBe(false);
      t.fire('pointerup');
      expect(suppressed(t), from).toBe(false);
      expect(t.overlays.selection, from).toEqual({ column: 2, count: 1 });
      expect(navCalls, from).toEqual([]);
    }
    const t = await setup();
    t.detach();
    t.down(t.b.card1b, { clientX: 25, clientY: 50 });
    move(t, 125, 50);
    expect(t.b.placeholder3.classes.has('wc-drag-target')).toBe(true);
    expect(suppressed(t)).toBe(false);
    t.fire('pointercancel');
    t.advance(180);
    expect(suppressed(t)).toBe(false);
  });

  it('AD-12 F13 a press during a fly-back enters the gate, finishes the flight, then resolves by elementFromPoint and captures there', async () => {
    const t = await setup();
    t.detach();
    t.down(t.b.card1b, { clientX: 25, clientY: 50 });
    move(t, 25, 1050);
    t.fire('pointerup');
    expect(t.active()).toBe(1);
    order.length = 0;
    // event.target is another element (t.down's default); resolution reads elementFromPoint.
    t.down(t.b.card2);
    expect(order).toEqual(['enter', 'finish', 'leave', 'point']);
    expect(t.b.card2.log).toEqual(['set 1']);
    expect(t.b.leftover.log).toEqual([]);
    expect(dragResidue(t)).toBe(0);
    expect(t.active()).toBe(1);
    t.fire('pointerup', { target: t.b.card2 });
    expect(t.active()).toBe(0);
  });

  it('AD-12 F13 a press on an enabled button during a fly-back finishes it and leaves the gate at once', async () => {
    const t = await setup();
    t.detach();
    t.down(t.b.card1b, { clientX: 25, clientY: 50 });
    move(t, 25, 1050);
    t.fire('pointerup');
    order.length = 0;
    t.down(t.b.undoIcon);
    expect(order).toEqual(['enter', 'finish', 'leave', 'point', 'leave']);
    expect(t.active()).toBe(0);
    expect(dragResidue(t)).toBe(0);
    t.advance(1000);
    expect(t.active()).toBe(0);
  });
});

// F32: Card.svelte's `lifted` wrapper class marks a tap-selected face (8 px lift, DESIGN.md
// Elevation & Depth); the fixture sets it by hand where the selection would.
describe('AD-12 F32 a dragged selected card keeps its lift', () => {
  type T = Awaited<ReturnType<typeof setup>>;
  const SUPPRESSED = 'wc-selection-suppressed';
  const move = (t: T, x: number, y: number) => t.fire('pointermove', { clientX: x, clientY: y });
  const keyframes = (f: FakeEl) => f.animations.map((a) => a.keyframes);
  // Selects column 1's bottom `count` cards (card1b, then card1, lifted), presses `card` at
  // (25, 50) and crosses the threshold with a 30 px move down.
  async function liftedDrag(card: 'card1' | 'card1b', reduced = false, count = 1) {
    const t = await setup();
    motion.value = { baseMs: 180, reduced };
    t.detach();
    t.overlays.select(1, count);
    t.b.card1b.classes.add('lifted');
    if (count === 2) t.b.card1.classes.add('lifted');
    navCalls.length = 0;
    t.down(t.b[card], { clientX: 25, clientY: 50 });
    move(t, 25, 80);
    return t;
  }

  it('AD-12 F32 the threshold-crossing move keeps a lifted face 8 px up', async () => {
    const t = await liftedDrag('card1b');
    expect(t.b.face1b.style.transform).toBe('translate(0px, 22px)');
    // AD-12 targeting measures the rendered rect: lifted face top 20 − 8 + 30.
    expect(t.b.face1b.getBoundingClientRect().top).toBe(42);
    move(t, 125, 50);
    expect(t.b.face1b.style.transform).toBe('translate(100px, -8px)');
  });

  it('AD-12 F33 a stack bigger than the selection (pressed above it in the same column) has no lift on any face', async () => {
    const t = await liftedDrag('card1');
    expect(t.b.face1.style.transform).toBe('translate(0px, 30px)');
    expect(t.b.face1b.style.transform).toBe('translate(0px, 30px)');
    move(t, 125, 50);
    expect(t.b.face1.style.transform).toBe('translate(100px, 0px)');
    expect(t.b.face1b.style.transform).toBe('translate(100px, 0px)');
    t.fire('pointercancel');
    // The restoring fly-back aims each face at its resting slot: card1 unlifted, card1b (still
    // `lifted`, selection kept) 8 px up, so nothing pops at settle.
    expect(keyframes(t.b.face1)).toEqual([
      [{ transform: 'translate(100px, 0px)' }, { transform: 'translate(0px, 0px)' }],
    ]);
    expect(keyframes(t.b.face1b)).toEqual([
      [{ transform: 'translate(100px, 0px)' }, { transform: 'translate(0px, -8px)' }],
    ]);
    expect(t.overlays.selection).toEqual({ column: 1, count: 1 });
  });

  // Column 2 spans y 0 … 400 and the face is 60 high: a 366 px drop puts an unlifted face's top at
  // 386 (14 / 60 < 25 % overlap, AD-12) and a lifted one's at 378 (22 / 60 ≥ 25 %).
  it.each([true, false])(
    'AD-12 F32 drop targeting measures the lifted rect (lifted %s): the lift alone crosses the overlap threshold',
    async (lifted) => {
      const t = lifted ? await liftedDrag('card1b') : await setup();
      if (!lifted) {
        t.detach();
        t.down(t.b.card1b, { clientX: 25, clientY: 50 });
        move(t, 25, 80);
      }
      move(t, 75, 416);
      expect(t.b.card2.classes.has('wc-drag-target')).toBe(lifted);
    },
  );

  it('AD-12 F32 an unlifted face (no selection) keeps translate(pointer − press point)', async () => {
    const t = await setup();
    t.detach();
    t.down(t.b.card1b, { clientX: 25, clientY: 50 });
    move(t, 25, 80);
    expect(t.b.face1b.style.transform).toBe('translate(0px, 30px)');
  });

  const restoring: [string, (t: T) => void][] = [
    ['pointercancel', (t) => t.fire('pointercancel')],
    ['lostpointercapture', (t) => t.fire('lostpointercapture', { target: t.b.card1 })],
    [
      // Back closes the WordCell view on top, so the selection stays open.
      'cancel({ byBack: true }) under another entry',
      (t) => {
        t.overlays.openView(3);
        t.controller.cancel({ byBack: true });
        t.overlays.closedByBack(1);
      },
    ],
  ];
  it.each(restoring)(
    'AD-12 F32 F33 a restoring fly-back (%s) lands every lifted face on its lifted slot and removes the suppression at its start',
    async (_name, end) => {
      const t = await liftedDrag('card1', false, 2);
      move(t, 125, 50);
      end(t);
      for (const face of [t.b.face1, t.b.face1b]) {
        expect(keyframes(face)).toEqual([
          [{ transform: 'translate(100px, -8px)' }, { transform: 'translate(0px, -8px)' }],
        ]);
      }
      expect(t.b.root.classes.has(SUPPRESSED)).toBe(false);
      t.advance(180);
      expect(t.active()).toBe(0);
      expect(t.overlays.selection).toEqual({ column: 1, count: 2 });
    },
  );

  it('AD-12 F32 a drag cancelled by a back that closes the selection flies the lifted face to its unlifted slot', async () => {
    const t = await liftedDrag('card1b');
    move(t, 125, 50);
    // nav's popstate order: the before-back hook, then closedByBack (AD-13).
    t.controller.cancel({ byBack: true });
    expect(t.b.root.classes.has(SUPPRESSED)).toBe(false);
    t.overlays.closedByBack(0);
    expect(keyframes(t.b.face1b)).toEqual([
      [{ transform: 'translate(100px, -8px)' }, { transform: 'translate(0px, 0px)' }],
    ]);
    expect(t.overlays.selection).toBe(null);
    expect(navCalls).toEqual([]);
    t.advance(180);
    expect(t.active()).toBe(0);
  });

  it('AD-12 F32 a release over nothing deselects, so the lifted face flies back to its unlifted slot', async () => {
    const t = await liftedDrag('card1b');
    move(t, 25, 1050);
    t.fire('pointerup');
    expect(t.overlays.selection).toBe(null);
    expect(keyframes(t.b.face1b)).toEqual([
      [{ transform: 'translate(0px, 992px)' }, { transform: 'translate(0px, 0px)' }],
    ]);
  });

  it('AD-12 F32 a restoring reduced-motion fade removes the suppression at its start, selection kept', async () => {
    const t = await liftedDrag('card1b', true);
    t.fire('pointercancel');
    expect(t.b.face1b.style.transform).toBe('');
    expect(keyframes(t.b.face1b)).toEqual([[{ opacity: 0 }, { opacity: 1 }]]);
    expect(t.b.root.classes.has(SUPPRESSED)).toBe(false);
    expect(t.b.face1b.classes.has('wc-drag-layer')).toBe(true);
    expect(t.overlays.selection).toEqual({ column: 1, count: 1 });
    t.advance(120);
    expect(t.b.face1b.classes.has('wc-drag-layer')).toBe(false);
    expect(t.active()).toBe(0);
    expect(navCalls).toEqual([]);
  });

  it('AD-12 F33 a restoring fly-back with full motion removes the suppression at its start, selection kept', async () => {
    const t = await liftedDrag('card1b');
    t.fire('pointercancel');
    expect(t.b.root.classes.has(SUPPRESSED)).toBe(false);
    expect(t.b.face1b.classes.has('wc-drag-layer')).toBe(true);
    expect(t.overlays.selection).toEqual({ column: 1, count: 1 });
    t.advance(180);
    expect(t.b.face1b.classes.has('wc-drag-layer')).toBe(false);
    expect(t.active()).toBe(0);
    expect(navCalls).toEqual([]);
  });

  it.each([false, true])(
    'AD-12 F33 a replacing drag from another column (reduced motion %s): its restoring fly-back removes the suppression at its start; the unlifted face lands on its slot',
    async (reduced) => {
      const t = await setup();
      motion.value = { baseMs: 180, reduced };
      t.detach();
      t.overlays.select(1, 1);
      t.b.card1b.classes.add('lifted');
      navCalls.length = 0;
      t.down(t.b.card2, { clientX: 75, clientY: 30 });
      move(t, 75, 60);
      expect(t.b.face2.style.transform).toBe('translate(0px, 30px)');
      expect(t.b.root.classes.has(SUPPRESSED)).toBe(true);
      t.fire('pointercancel');
      expect(t.b.root.classes.has(SUPPRESSED)).toBe(false);
      expect(keyframes(t.b.face2)).toEqual([
        reduced
          ? [{ opacity: 0 }, { opacity: 1 }]
          : [{ transform: 'translate(0px, 30px)' }, { transform: 'translate(0px, 0px)' }],
      ]);
      t.advance(180);
      expect(t.active()).toBe(0);
      expect(t.overlays.selection).toEqual({ column: 1, count: 1 });
      expect(navCalls).toEqual([]);
    },
  );
});

describe('AD-12 entry 10 Composing columns', () => {
  type T = Awaited<ReturnType<typeof setup>>;
  const tapDest = (card: number) =>
    `dispatch ${JSON.stringify({ type: 'tapDestinationCard', card })}`;
  // Composing (src/engine/view.ts): no column picks up or takes drops; column 1 is the destination,
  // remainder [0, 5] at k = 1 (card 0 → 2, card 5 the top of D → null); the ghost is an S mirror.
  const compose = (
    kIfTapped: [number, number | null][] = [
      [0, 2],
      [5, null],
    ],
  ) => {
    const col = (column: number, cards: number[]) => ({
      column,
      cards,
      canPickUp: false,
      canDropOn: false,
      ...(column === 1 ? { kIfTapped: new Map(kIfTapped) } : {}),
    });
    shared.view = {
      status: 'playing',
      phase: 'composing',
      columns: [col(1, [0, 5]), col(2, [1]), ...[3, 4, 5, 6, 7, 8].map((c) => col(c, []))],
      cells: [
        { cell: 3, cards: [2] },
        { cell: 4, cards: [] },
      ],
    };
  };
  const dragClasses = (t: T): string[] => {
    const out: string[] = [];
    const walk = (el: FakeEl) => {
      for (const c of el.classes) if (c.startsWith('wc-drag')) out.push(c);
      for (const child of el.children) walk(child);
    };
    walk(t.b.root);
    return out;
  };
  // Card 7 (the ghost's data-mirror-of) is mapped only so a mirror misresolved as a card would
  // dispatch or preview; ghost cases only, no engine view gives it a number.
  const composeGhostMapped = () =>
    compose([
      [0, 2],
      [5, null],
      [7, 1],
    ]);
  const transforms = (t: T) => [t.b.face1, t.b.face1b, t.b.face2].map((f) => f.style.transform);
  const move = (t: T, x: number, y: number, init: Partial<FakeEvent> = {}) =>
    t.fire('pointermove', { clientX: x, clientY: y, ...init });
  // A press on card 0 (column 1, y 0–60) dragged past the threshold onto column 2.
  const crossed = (t: T, init: Partial<FakeEvent> = {}) => {
    t.down(t.b.card1, { clientX: 25, clientY: 10, ...init });
    move(t, 25, 30, init);
    move(t, 75, 10, init);
  };

  it('AD-12 a destination-card tap dispatches tapDestinationCard once; null and every other column part do nothing', async () => {
    const t = await setup();
    t.detach();
    compose();
    t.tap(t.b.card1);
    expect(navCalls).toEqual([tapDest(0)]);
    for (const el of [t.b.card1b, t.b.foot1, t.b.placeholder1, t.b.card2, t.b.column3]) {
      t.tap(el);
    }
    composeGhostMapped();
    t.tap(t.b.ghost);
    expect(navCalls).toEqual([tapDest(0)]);
    expect(t.overlays.selection).toBeNull();
    expect(t.active()).toBe(0);
  });

  it('AD-12 a drag-as-tap never moves the card and dispatches once at pointerup', async () => {
    const t = await setup();
    t.detach();
    compose();
    crossed(t);
    expect(dragClasses(t)).toEqual([]);
    expect(transforms(t)).toEqual(['', '', '']);
    expect(navCalls).toEqual([]);
    t.fire('pointerup');
    expect(navCalls).toEqual([tapDest(0)]);
    expect(dragClasses(t)).toEqual([]);
    expect(t.overlays.selection).toBeNull();
    expect(t.active()).toBe(0);
  });

  it('AD-12 the drag-as-tap reads kIfTapped at pointerup, not at pointerdown', async () => {
    const t = await setup();
    t.detach();
    compose();
    crossed(t);
    compose([
      [0, null],
      [5, null],
    ]);
    t.fire('pointerup');
    expect(navCalls).toEqual([]);
    crossed(t);
    compose();
    t.fire('pointerup');
    expect(navCalls).toEqual([tapDest(0)]);
  });

  it('AD-12 a drag-as-tap on a null card, a ghost or another column dispatches nothing', async () => {
    const t = await setup();
    t.detach();
    for (const [el, x] of [
      [t.b.card1b, 25],
      [t.b.ghost, 25],
      [t.b.card2, 75],
    ] as const) {
      if (el === t.b.ghost) composeGhostMapped();
      else compose();
      t.down(el, { clientX: x, clientY: 30 });
      move(t, x + 50, 30);
      expect(dragClasses(t)).toEqual([]);
      t.fire('pointerup');
    }
    expect(navCalls).toEqual([]);
    expect(t.active()).toBe(0);
  });

  it('AD-12 pointercancel, lostpointercapture and cancel() end a drag-as-tap with no dispatch', async () => {
    const t = await setup();
    t.detach();
    compose();
    crossed(t);
    t.fire('pointercancel');
    crossed(t);
    t.fire('lostpointercapture', { target: t.b.card1 });
    crossed(t);
    t.controller.cancel();
    t.fire('pointerup');
    t.down(t.b.card1);
    t.controller.cancel();
    t.fire('pointerup');
    expect(navCalls).toEqual([]);
    expect(t.active()).toBe(0);
  });

  it('AD-12 the k hover previews the would-be D with no grab; null, ghosts, spaces and other columns nothing', async () => {
    const t = await setup();
    t.detach();
    compose();
    t.hover(t.b.card1);
    expect([...t.b.column1.classes]).toEqual(['wc-hover-tail']);
    expect(Object.fromEntries(t.b.column1.props)).toEqual({
      '--wc-hover-from': '0',
      '--wc-hover-len': '2',
    });
    for (const el of [t.b.card1b, t.b.ghost, t.b.foot1, t.b.card2, t.b.column3]) {
      if (el === t.b.ghost) composeGhostMapped();
      else compose();
      t.hover(el);
      for (const column of [t.b.column1, t.b.column2, t.b.column3]) {
        expect(column.classes.size).toBe(0);
        expect(column.props.size).toBe(0);
      }
    }
  });

  it('AD-12 a crossed drag-as-tap clears the k hover, keeps it off while held and repaints it at every end', async () => {
    const t = await setup();
    t.detach();
    compose();
    const mouse = { pointerType: 'mouse' };
    // A same-id pointerdown ends the crossed press, then starts a pending press on card 0.
    let sameIdPending = false;
    for (const finish of [
      () => t.fire('pointerup', mouse),
      () => t.fire('pointercancel', mouse),
      () => t.fire('lostpointercapture', { target: t.b.card1, ...mouse }),
      () => t.controller.cancel(),
      () => {
        t.down(t.b.card1, { clientX: 25, clientY: 10, ...mouse });
        sameIdPending = true;
      },
    ]) {
      t.hover(t.b.card1);
      expect([...t.b.column1.classes]).toEqual(['wc-hover-tail']);
      t.down(t.b.card1, { clientX: 25, clientY: 10, ...mouse });
      move(t, 25, 30, mouse);
      expect(t.b.column1.classes.size).toBe(0);
      t.hover(t.b.card1);
      t.controller.refreshHover();
      expect(t.b.column1.classes.size).toBe(0);
      finish();
      expect([...t.b.column1.classes]).toEqual(['wc-hover-tail']);
    }
    // The same-id press's new pending press ends as a tap: one more tapDestinationCard.
    expect(sameIdPending).toBe(true);
    t.fire('pointerup', mouse);
    expect(navCalls).toEqual([tapDest(0), tapDest(0)]);
    expect(t.active()).toBe(0);
  });

  it('AD-12 an Idle space drag with a selection does not drop; wc-drop clears at the crossing and repaints at pointerup', async () => {
    const t = await setup();
    t.detach();
    t.tap(t.b.card2);
    const mouse = { pointerType: 'mouse' };
    t.hover(t.b.foot1);
    expect([...t.b.column1.classes]).toEqual(['wc-drop']);
    t.down(t.b.foot1, { clientX: 25, clientY: 390, ...mouse });
    move(t, 25, 370, mouse);
    expect(t.b.column1.classes.size).toBe(0);
    t.controller.refreshHover();
    expect(t.b.column1.classes.size).toBe(0);
    expect(dragClasses(t)).toEqual([]);
    t.fire('pointerup', mouse);
    expect([...t.b.column1.classes]).toEqual(['wc-drop']);
    expect(t.overlays.selection).toEqual({ column: 2, count: 1 });
    expect(navCalls).toEqual(['push']);
    expect(t.active()).toBe(0);
  });
});
