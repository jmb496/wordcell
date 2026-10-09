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
// Entry 5.7: the tray band (registered `kind: 'tray'`) holds a `.tiles` element whose tile wrappers
// have `.face` children with rects on the resting slots (w 40, tray inner width 384 from deps:
// tileWidth 44, H 53, perRow 8, origin (10, 640)); a fake Animation can be cancelled (`cancel()`
// clears it, as WAAPI's cancel: no later finish).
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

// Server-compiled runes make `flushSync` a no-op; the mock lets a test settle the fake DOM there.
const svelteFlush = vi.hoisted(() => ({ onFlush: null as (() => void) | null }));

vi.mock('svelte', async (importOriginal) => {
  const actual = await importOriginal<typeof import('svelte')>();
  return {
    ...actual,
    flushSync: () => {
      svelteFlush.onFlush?.();
      svelteFlush.onFlush = null;
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
  cancelled = false;
  readonly finish = vi.fn(() => {
    if (this.cancelled) return;
    order.push('finish');
    if (this.finished) return;
    this.finished = true;
    clock.add(() => this.onfinish?.(), 0);
  });
  /** Entry 5.7: WAAPI's cancel; its `cancel` event is the test's to fire (`oncancel`). */
  readonly cancel = vi.fn(() => {
    order.push('cancel');
    this.cancelled = true;
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
  querySelectorAll(selector: string): FakeEl[] {
    const found: FakeEl[] = [];
    for (const child of this.children) {
      if (child.is(selector)) found.push(child);
      found.push(...child.querySelectorAll(selector));
    }
    return found;
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
  buttons: number;
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
    buttons: 0,
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
  // Entry 13 (F34): the sticky bars bound the visible band; by default the top bar ends at y 0,
  // the banner (always rendered, empty) has no height and the action bar starts at y 1200, so
  // nothing is clipped.
  const topBar = at(el('div', { 'data-band': 'topBar' }, root), {
    left: 0,
    top: -44,
    right: 400,
    bottom: 0,
  });
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
  // Entry 12: the cells lie below the columns, x 0 … 50 and 50 … 100, y 450 … 510.
  const cell3 = at(el('div', { 'data-wordcell': '3' }, root), {
    left: 0,
    top: 450,
    right: 50,
    bottom: 510,
  });
  const cellCard = el('div', { 'data-place': 'cell', 'data-card-id': '2' }, cell3);
  const badge = el('span', {}, cell3);
  const cell4 = at(el('div', { 'data-wordcell': '4' }, root), {
    left: 50,
    top: 450,
    right: 100,
    bottom: 510,
  });
  // Epic 5 CAP-4: cell 5 (tileView: a legal non-current Place target), x 100 … 150.
  const cell5 = at(el('div', { 'data-wordcell': '5' }, root), {
    left: 100,
    top: 450,
    right: 150,
    bottom: 510,
  });
  // Entry 12: the hover peek root (rendered only while open in the app; always here).
  const hoverPeek = el('div', { 'data-hover-peek': '' }, root);
  // Entry 5.7: the tray band x 0 … 400, y 600 … 800; its `.tiles` holds tray positions 0, 1, 2
  // (tile 3, tile 4, then strip tile 6 in Place or the mirror in Composing) on slots x 10 + 48p,
  // y 640 … 693 (wrapper 2 px wider each side).
  const tray = at(el('div', { 'data-band': 'tray' }, root), {
    left: 0,
    top: 600,
    right: 400,
    bottom: 800,
  });
  const tiles = el('div', {}, tray);
  tiles.classes.add('tiles');
  const slotAt = (p: number): Rect => ({
    left: 10 + 48 * p,
    top: 640,
    right: 54 + 48 * p,
    bottom: 693,
  });
  const tileAt = (attrs: Record<string, string>, p: number) => {
    const s = slotAt(p);
    const wrapper = at(el('div', attrs, tiles), { ...s, left: s.left - 2, right: s.right + 2 });
    const f = at(el('div', {}, wrapper), s);
    f.classes.add('face');
    return [wrapper, f] as const;
  };
  const [tile, tileFace] = tileAt({ 'data-place': 'tray', 'data-card-id': '3' }, 0);
  // Epic 5 CAP-4: a second tray tile, a strip tile (Place) and the gap above the action bar.
  const [tile2, tile2Face] = tileAt({ 'data-place': 'tray', 'data-card-id': '4' }, 1);
  const [stripTile, stripFace] = tileAt({ 'data-place': 'strip', 'data-card-id': '6' }, 2);
  const trayMirror = at(el('div', { 'data-mirror-of': '1' }, tiles), slotAt(2));
  const trayMirrorFace = el('div', {}, trayMirror);
  const actionGap = el('div', { 'data-band': 'actionGap' }, root);
  const leftover = el('div', { 'data-band': 'leftover' }, root);
  const banner = at(el('div', { 'data-band': 'banner' }, root), {
    left: 0,
    top: 0,
    right: 400,
    bottom: 0,
  });
  const actionBar = at(el('div', { 'data-band': 'actionBar' }, root), {
    left: 0,
    top: 1200,
    right: 400,
    bottom: 1260,
  });
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
    cell5,
    tile,
    tile2,
    stripTile,
    tileFace,
    tile2Face,
    stripFace,
    tiles,
    slotAt,
    tray,
    actionGap,
    trayMirror,
    trayMirrorFace,
    leftover,
    topBar,
    banner,
    actionBar,
    scrim,
    sheet,
    sheetTitle,
    viewScroll,
    sheetMirror,
    hoverPeek,
    outside,
  };
}

type Timer = { cb: () => void; due: number; done: boolean };

async function setup() {
  vi.resetModules();
  navCalls.length = 0;
  order.length = 0;
  svelteFlush.onFlush = null;
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
  dropTarget(b.tray as unknown as Element, { kind: 'tray' });
  let hit: FakeEl | null = null;
  // Entry 12: hoverFine off by default, so the setTimer call counts above stay long-press only.
  const media = { hoverFine: false };
  const hoverFineWatchers = new Set<() => void>();
  // A hoverFine media change: the new value, then every watcher (layout.watchHoverFine).
  const flipHoverFine = (matches: boolean) => {
    media.hoverFine = matches;
    for (const callback of hoverFineWatchers) callback();
  };
  const controller = createController(gate, {
    elementFromPoint: () => {
      order.push('point');
      return hit as unknown as Element | null;
    },
    setTimer,
    clearTimer,
    hoverFine: () => media.hoverFine,
    watchHoverFine: (callback) => {
      hoverFineWatchers.add(callback);
      return () => {
        hoverFineWatchers.delete(callback);
      };
    },
    w: () => 40,
    trayInnerWidth: () => 384,
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
  // A mouse pointerover at `target` (elementFromPoint answers it); entry 12: `init` adds
  // relatedTarget, buttons and the point.
  const hover = (target: FakeEl | null, init: Partial<FakeEvent> = {}) => {
    hit = target;
    return b.root.fire('pointerover', { pointerType: 'mouse', target, ...init });
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
    media,
    flipHoverFine,
  };
}

// Epic 5 CAP-4: a Composing view whose live tray tiles are 3 (S) and 4 (a free letter from cell 5,
// whose top it is); column 1 is the destination (card 0 → k 2, card 5 the top of D → null); cell 3
// is available, cell 4 empty. Place: the strip [3, 4, 6] at target 3 (cell 3 current, cell 5
// legal, cell 4 not legal).
function tileView(phase: 'composing' | 'place' = 'composing'): void {
  const composing = phase === 'composing';
  const col = (column: number, cards: number[]) => ({
    column,
    cards,
    canPickUp: false,
    canDropOn: false,
    ...(composing && column === 1
      ? {
          kIfTapped: new Map([
            [0, 2],
            [5, null],
          ]),
        }
      : {}),
  });
  const cell = (n: number, cards: number[], flags: Record<string, boolean>) => ({
    cell: n,
    cards,
    used: false,
    canAddFreeLetter: false,
    canSetTarget: false,
    isLegalTarget: false,
    ...flags,
  });
  shared.view = {
    status: 'playing',
    phase,
    columns: [col(1, [0, 5]), col(2, [1]), ...[3, 4, 5, 6, 7, 8].map((c) => col(c, []))],
    cells: [
      cell(3, [2], composing ? { canAddFreeLetter: true } : { isLegalTarget: true }),
      cell(4, [], {}),
      cell(
        5,
        [4],
        composing ? { used: true } : { used: true, isLegalTarget: true, canSetTarget: true },
      ),
    ],
    draft: { arrangement: [3, 4], freeLetters: [5], destination: [5], k: 1, side: 'right' },
    ...(composing ? {} : { place: { placementOrder: [3, 4, 6], target: 3 } }),
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
    tileView();
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
      t.overlays.clearTile();
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

describe('AD-12 resolved press target', () => {
  it('AD-12 each resolved target kind shows by its outcome: a column-card tap selects, a non-empty WordCell long-press peeks, an empty one opens nothing, an other tap deselects', async () => {
    const t = await setup();
    t.detach();
    // column → a tap selects the tail.
    t.tap(t.b.card1b);
    expect(t.overlays.selection).toEqual({ column: 1, count: 1 });
    // wordcell → the long-press opens the peek; the release (no overflow) closes it, selection kept.
    t.down(t.b.cellCard);
    t.advance(400);
    expect(t.overlays.peek).toBe(3);
    t.fire('pointerup');
    expect(t.overlays.peek).toBeNull();
    expect(t.overlays.selection).toEqual({ column: 1, count: 1 });
    // emptyWordcell → the long-press opens nothing (its release is a tap, which deselects).
    t.down(t.b.cell4);
    t.advance(400);
    expect(t.overlays.peek).toBeNull();
    t.fire('pointerup');
    expect(t.overlays.selection).toBeNull();
    // other → a tap clears the selection.
    t.tap(t.b.card2);
    t.tap(t.b.leftover);
    expect(t.overlays.selection).toBeNull();
    expect(navCalls).toEqual(['push', 'pop', 'push', 'pop']);
  });

  it('AD-12 WordCell emptiness comes from the GameView, not the DOM: a cardless cell element that is non-empty in the GameView peeks', async () => {
    const t = await setup();
    t.detach();
    const view = shared.view as { cells: { cell: number; cards: number[] }[] };
    (view.cells[1] as { cards: number[] }).cards = [9];
    t.down(t.b.cell4);
    t.advance(400);
    expect(t.overlays.peek).toBe(4);
    t.fire('pointerup');
  });

  it('AD-12 a WordCell press on a cell missing from the GameView, or with no GameView, throws', async () => {
    const t = await setup();
    t.detach();
    const view = shared.view as { cells: { cell: number; cards: number[] }[] };
    view.cells = view.cells.filter((c) => c.cell !== 4);
    expect(() => t.down(t.b.cell4)).toThrow(/^AD-12 WordCell press on unknown cell 4$/);
    const u = await setup();
    u.detach();
    shared.view = undefined;
    expect(() => u.down(u.b.cellCard)).toThrow(/^AD-12 WordCell press without a GameView$/);
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

  it('AD-12 CAP-4 a same-id pointerdown with button !== 0 during a live press ends it (sameId) before the button check returns', async () => {
    const t = await setup();
    t.detach();
    t.down(t.b.card1);
    t.down(t.b.card2, { button: 2 });
    expect(t.counts).toEqual({ enter: 1, leave: 1 });
    expect(t.b.card1.log).toEqual(['set 1', 'release 1']);
    expect(t.b.card2.log).toEqual([]);
    expect(t.active()).toBe(0);
    expect(navCalls).toEqual([]);
  });

  // Ticket 4.13 D18: documents current behaviour. A captured element that loses capture without a
  // lostpointercapture at the root (disconnected: the browser fires it at the document) is not
  // reachable in the app: captured elements are keyed and nothing replaces them during a held press.
  it('AD-12 CAP-4 a captured press whose capture vanished with no lostpointercapture keeps ignoring a new pointerId until its own end', async () => {
    const t = await setup();
    t.detach();
    t.down(t.b.card1, { pointerId: 1 });
    t.b.card1.captures.clear();
    t.down(t.b.card2, { pointerId: 2 });
    expect(t.counts).toEqual({ enter: 1, leave: 0 });
    expect(t.b.card2.log).toEqual([]);
    t.fire('pointerup', { pointerId: 1 });
    expect(t.counts).toEqual({ enter: 1, leave: 1 });
    t.down(t.b.card2, { pointerId: 2 });
    expect(t.b.card2.log).toEqual(['set 2']);
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
    expect(t.fire('contextmenu').preventDefault).not.toHaveBeenCalled();
    t.fire('pointerup');
    expect(t.fire('contextmenu').preventDefault).not.toHaveBeenCalled();
    expect(t.counts).toEqual({ enter: 2, leave: 2 });
  });
});

describe('AD-12 contextmenu slot, pointercancel-ended', () => {
  it('AD-12 the slot clears on that pointer’s next uncaptured press, ended by pointercancel', async () => {
    const t = await setup();
    t.detach();
    t.down(t.b.card1);
    t.controller.cancel();
    t.down(t.b.foot1);
    expect(t.fire('contextmenu').preventDefault).not.toHaveBeenCalled();
    t.fire('pointercancel');
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

  it('AD-12 a same-id pointerdown that closes a peek flushes before resolving: its tap opens and closes no view', async () => {
    const t = await setup();
    t.detach();
    t.down(t.b.cellCard);
    t.advance(400);
    expect(t.overlays.peek).toBe(3);
    // The peek's scrim is under the new press until the flush removes it.
    svelteFlush.onFlush = () => t.point(t.b.leftover);
    t.down(t.b.scrim);
    expect(t.overlays.peek).toBeNull();
    expect(() => t.fire('pointerup', { target: t.b.leftover })).not.toThrow();
    expect(t.overlays.viewCell).toBeNull();
    expect(t.overlays.depth).toBe(0);
    expect(navCalls).toEqual([]);
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

  it('AD-13 a long-press up with overflow turns the peek sticky: one push, above a kept selection', async () => {
    const t = await setup();
    t.detach();
    t.tap(t.b.card1);
    t.b.viewScroll.scrollHeight = 301;
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
      expect(t.b.root.captureListeners.size).toBe(0);
      t.down(el, { clientX: 100, clientY: 100 });
      t.fire('pointercancel');
      expect(t.b.root.captureListeners.size).toBe(0);
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
    t.down(t.b.scrim);
    t.advance(250);
    t.fire('pointerup', { target: t.b.scrim });
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
    tileView();
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

  it('AD-12 F25 a click with detail 0 resolving outside, on a tray tile or on a block deselects; detail 1 and a column target do nothing', async () => {
    const t = await setup();
    t.detach();
    t.tap(t.b.card1);
    t.fire('click', { target: t.b.leftover, detail: 1 });
    t.fire('click', { target: t.b.card2, detail: 0 });
    t.fire('click', { target: t.b.undo, detail: 0 });
    expect(t.overlays.selection).toEqual({ column: 1, count: 2 });
    t.fire('click', { target: t.b.leftover, detail: 0 });
    expect(t.overlays.selection).toBeNull();
    t.tap(t.b.card1);
    t.fire('click', { target: t.b.tile, detail: 1 });
    expect(t.overlays.selection).toEqual({ column: 1, count: 2 });
    t.fire('click', { target: t.b.tile, detail: 0 });
    expect(t.overlays.selection).toBeNull();
    t.tap(t.b.card1);
    t.fire('click', { target: t.b.trayMirror, detail: 0 });
    expect(t.overlays.selection).toBeNull();
    expect(navCalls).toEqual(['push', 'pop', 'push', 'pop', 'push', 'pop']);
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
      expect(durations.kinds).toEqual(['flyBack']);
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

describe('AD-12 F34 drop targets clipped to the visible band', () => {
  type T = Awaited<ReturnType<typeof setup>>;
  const drop = (source: number, count: number, destination: number) =>
    `dispatch ${JSON.stringify({ type: 'drop', sourceColumn: source, sourceCount: count, destinationColumn: destination })}`;
  // card1b's face rests at y 20 … 80; a press at (25, 50) moved to (125, y) puts it over column 3
  // with its top at y − 30.
  const moveTo = (t: T, y: number) => t.fire('pointermove', { clientX: 125, clientY: y });
  const lit = (t: T) => t.b.placeholder3.classes.has('wc-drag-target');
  const bar = (el: FakeEl, top: number, bottom: number) => {
    el.rect = { left: 0, top, right: 400, bottom };
  };

  it('AD-12 F34 a column wholly under the top bar is never lit; the release flies back with no dispatch', async () => {
    const t = await setup();
    t.detach();
    bar(t.b.topBar, 0, 100);
    t.down(t.b.card1b, { clientX: 25, clientY: 50 });
    // Face y 40 … 100 over column 3: all of it under the bar.
    moveTo(t, 70);
    expect(lit(t)).toBe(false);
    t.fire('pointerup');
    expect(t.b.face1b.animations).toHaveLength(1);
    t.advance(180);
    expect(t.active()).toBe(0);
    expect(navCalls).toEqual([]);
  });

  it('AD-12 F34 the source column is clipped too: after leaving, a return over the top bar does not target it', async () => {
    const t = await setup();
    t.detach();
    bar(t.b.topBar, 0, 100);
    t.down(t.b.card1b, { clientX: 25, clientY: 50 });
    // Face y 200 … 260 over column 3, below the bar: the drag leaves the source.
    moveTo(t, 230);
    expect(lit(t)).toBe(true);
    // Face y 40 … 100 back over column 1: all of it under the bar.
    t.fire('pointermove', { clientX: 25, clientY: 70 });
    expect(lit(t)).toBe(false);
    expect(t.b.card1.classes.has('wc-drag-target')).toBe(false);
    t.fire('pointerup');
    expect(navCalls).toEqual([]);
    t.advance(180);
    expect(t.active()).toBe(0);
  });

  it('AD-12 F34 a column under the action bar is never lit', async () => {
    const t = await setup();
    t.detach();
    bar(t.b.actionBar, 300, 360);
    t.down(t.b.card1b, { clientX: 25, clientY: 50 });
    // Face y 310 … 370 over column 3 (y 0 … 400): all of it under the action bar.
    moveTo(t, 340);
    expect(lit(t)).toBe(false);
    // Face y 260 … 320: 40 / 60 in the visible part.
    moveTo(t, 290);
    expect(lit(t)).toBe(true);
    t.controller.cancel();
  });

  it('AD-12 F34 a partly hidden column lights at ≥ 25 % overlap with its visible part, not its whole rect', async () => {
    const t = await setup();
    t.detach();
    bar(t.b.topBar, 0, 100);
    t.down(t.b.card1b, { clientX: 25, clientY: 50 });
    // Face y 50 … 110: 10 / 60 visible overlap (< 25 %), though wholly inside the unclipped rect.
    moveTo(t, 80);
    expect(lit(t)).toBe(false);
    // Face y 85 … 145: 45 / 60 visible overlap.
    moveTo(t, 115);
    expect(lit(t)).toBe(true);
    t.fire('pointerup');
    expect(navCalls).toEqual([drop(1, 1, 3)]);
  });

  it('AD-12 F34 a shown banner moves the band top to its bottom', async () => {
    const t = await setup();
    t.detach();
    bar(t.b.topBar, 0, 44);
    bar(t.b.banner, 44, 44);
    t.down(t.b.card1b, { clientX: 25, clientY: 50 });
    // Face y 50 … 110: below the top bar, so lit while the banner is empty.
    moveTo(t, 80);
    expect(lit(t)).toBe(true);
    bar(t.b.banner, 44, 100);
    moveTo(t, 81);
    expect(lit(t)).toBe(false);
    t.fire('pointerup');
    expect(navCalls).toEqual([]);
    t.advance(180);
    expect(t.active()).toBe(0);
  });

  it('AD-12 F34 a hidden (zero-height) banner below the top bar clips nothing', async () => {
    const t = await setup();
    t.detach();
    // A dev `?bands=` order can place the always-rendered banner wrapper lower on the page.
    bar(t.b.banner, 200, 200);
    t.down(t.b.card1b, { clientX: 25, clientY: 50 });
    // Face y 50 … 110 over column 3, above the hidden banner.
    moveTo(t, 80);
    expect(lit(t)).toBe(true);
    t.fire('pointerup');
    expect(navCalls).toEqual([drop(1, 1, 3)]);
  });

  // card1b's face rests at y 20 … 80; each bar covers 48 / 60 of it (80 %), leaving a 12 px
  // sliver to press. The nudge leaves 3 / 60 visible (no target), still over the source's rect;
  // the return puts at least 25 % of the face over the source column's visible part.
  it.each([
    {
      // Bar y 0 … 68; press y 74; nudge face y 11 … 71; return face y 50 … 110 (42 / 60).
      name: 'top bar',
      hide: (t: T) => bar(t.b.topBar, 0, 68),
      press: 74,
      nudge: 65,
      back: 104,
    },
    {
      // Bar from y 32; press y 26; nudge face y 29 … 89; return face y −10 … 50 (32 / 60).
      name: 'action bar',
      hide: (t: T) => bar(t.b.actionBar, 32, 1260),
      press: 26,
      nudge: 35,
      back: -4,
    },
  ])(
    'AD-12 F37 a press on a face mostly under the $name has not left its source: a nudge and a release back over its visible part fly back with no dispatch (Q-34)',
    async ({ hide, press, nudge, back }) => {
      const t = await setup();
      t.detach();
      hide(t);
      t.down(t.b.card1b, { clientX: 25, clientY: press });
      t.fire('pointermove', { clientX: 25, clientY: nudge });
      expect(t.b.card1.classes.has('wc-drag-target')).toBe(false);
      t.fire('pointermove', { clientX: 25, clientY: back });
      expect(t.b.card1.classes.has('wc-drag-target')).toBe(false);
      t.fire('pointerup');
      expect(navCalls).toEqual([]);
      expect(t.b.face1b.animations).toHaveLength(1);
      t.advance(180);
      expect(t.active()).toBe(0);
    },
  );

  it('AD-12 F37 a face wholly under the top bar over another column has left its source: back over its visible part lights the source and the release self-drops (Q-34)', async () => {
    const t = await setup();
    t.detach();
    bar(t.b.topBar, 0, 68);
    t.down(t.b.card1b, { clientX: 25, clientY: 74 });
    // Face x 100 … 150, y 0 … 60 over column 3, all of it under the bar (`raw` null), missing
    // the source's unclipped rect: the drag has left.
    moveTo(t, 54);
    expect(lit(t)).toBe(false);
    // Face y 50 … 110 back over column 1: 42 / 60 over its visible part.
    t.fire('pointermove', { clientX: 25, clientY: 104 });
    expect(t.b.card1.classes.has('wc-drag-target')).toBe(true);
    t.fire('pointerup');
    expect(navCalls).toEqual([drop(1, 1, 1)]);
  });

  it('AD-12 F37 a face under the top bar 40 % over its source and 60 % over column 2 has not left its source (Q-34)', async () => {
    const t = await setup();
    t.detach();
    bar(t.b.topBar, 0, 68);
    t.down(t.b.card1b, { clientX: 25, clientY: 74 });
    // Face x 30 … 80, y 0 … 60, all of it under the bar (`raw` null): 20 / 50 over column 1's
    // unclipped rect (40 %), so not left; only the source is tested, column 2's 60 % is ignored.
    t.fire('pointermove', { clientX: 55, clientY: 54 });
    expect(t.b.card1.classes.has('wc-drag-target')).toBe(false);
    expect(t.b.card2.classes.has('wc-drag-target')).toBe(false);
    // Face x 0 … 50, y 50 … 110: 42 / 60 over column 1's visible part.
    t.fire('pointermove', { clientX: 25, clientY: 104 });
    expect(t.b.card1.classes.has('wc-drag-target')).toBe(false);
    t.fire('pointerup');
    expect(navCalls).toEqual([]);
    expect(t.b.face1b.animations).toHaveLength(1);
    t.advance(180);
    expect(t.active()).toBe(0);
  });

  it('AD-12 F34 a missing bar during a drag throws (rule 6)', async () => {
    const t = await setup();
    t.detach();
    delete t.b.actionBar.attrs['data-band'];
    t.down(t.b.card1b, { clientX: 25, clientY: 50 });
    expect(() => moveTo(t, 70)).toThrow(/^AD-12 drag without \[data-band="actionBar"\]$/);
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
    // F12: the overlays store is untouched mid-drag.
    expect(t.overlays.selection).toEqual({ column: selection[0], count: selection[1] });
    expect(navCalls).toEqual([]);
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
      // The face (y 390 … 450) overlaps registered column 2 (y 0 … 400) by 10 / 60, below MIN_RATIO.
      name: 'release over a registered column below the overlap minimum',
      selection: [2, 1],
      to: [75, 420],
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

  it('AD-12 F33 a dragged stack that is a proper subset of a two-card selection keeps the lift and flies back to its lifted slot', async () => {
    const t = await liftedDrag('card1b', false, 2);
    expect(t.b.face1b.style.transform).toBe('translate(0px, 22px)');
    expect(t.b.face1.style.transform).toBe('');
    move(t, 125, 50);
    expect(t.b.face1b.style.transform).toBe('translate(100px, -8px)');
    t.fire('pointercancel');
    expect(keyframes(t.b.face1b)).toEqual([
      [{ transform: 'translate(100px, -8px)' }, { transform: 'translate(0px, -8px)' }],
    ]);
    expect(keyframes(t.b.face1)).toEqual([]);
    expect(t.b.root.classes.has(SUPPRESSED)).toBe(false);
    t.advance(180);
    expect(t.active()).toBe(0);
    expect(t.overlays.selection).toEqual({ column: 1, count: 2 });
    expect(navCalls).toEqual([]);
  });

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
      draft: { arrangement: [3], freeLetters: [], destination: [5] },
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

describe('AD-12 entry 12 desktop hover peek', () => {
  type T = Awaited<ReturnType<typeof setup>>;
  const mouse = { pointerType: 'mouse' };
  const IN3 = { clientX: 25, clientY: 480 };
  const drop = (source: number, count: number, destination: number) =>
    `dispatch ${JSON.stringify({ type: 'drop', sourceColumn: source, sourceCount: count, destinationColumn: destination })}`;
  const cells = () => (shared.view as { cells: { cell: number; cards: number[] }[] }).cells;
  // A boundary entry into cell 3 (relatedTarget outside it) at a point inside its rect.
  const enter3 = (t: T, init: Partial<FakeEvent> = {}) =>
    t.hover(t.b.cellCard, { relatedTarget: t.b.leftover, ...IN3, ...init });
  const leave3 = (t: T, to: FakeEl | null = t.b.leftover) =>
    t.b.root.fire('pointerout', { ...mouse, target: t.b.cellCard, relatedTarget: to });
  const hoverTimers = (t: T) => t.setTimer.mock.calls.filter(([, ms]) => ms === 400).length;
  // hoverFine on, cell 3 entered and its 400 ms run: the hover peek is open on cell 3.
  const open3 = (t: T) => {
    t.media.hoverFine = true;
    enter3(t);
    t.advance(400);
    expect(t.overlays.hoverPeek).toBe(3);
  };

  it('AD-12 a mouse entry into a non-empty cell arms one 400 ms timer: nothing at 399 ms, openHoverPeek at 400 ms', async () => {
    const t = await setup();
    t.detach();
    t.media.hoverFine = true;
    enter3(t);
    expect(t.setTimer.mock.calls.map(([, ms]) => ms)).toEqual([400]);
    t.advance(399);
    expect(t.overlays.hoverPeek).toBeNull();
    t.advance(1);
    expect(t.overlays.hoverPeek).toBe(3);
    expect(navCalls).toEqual([]);
  });

  it('AD-12 a relatedTarget-null entry arms; a move inside the cell (relatedTarget inside) does not', async () => {
    const t = await setup();
    t.detach();
    t.media.hoverFine = true;
    t.hover(t.b.badge, { relatedTarget: t.b.cellCard, ...IN3 });
    expect(hoverTimers(t)).toBe(0);
    enter3(t, { relatedTarget: null });
    expect(hoverTimers(t)).toBe(1);
    t.advance(400);
    expect(t.overlays.hoverPeek).toBe(3);
  });

  it('AD-12 no arm when hoverFine is false, for a touch or pen pointerover, with buttons ≠ 0 and no press, or on an empty cell', async () => {
    const t = await setup();
    t.detach();
    enter3(t);
    t.media.hoverFine = true;
    for (const pointerType of ['touch', 'pen']) {
      t.b.root.fire('pointerover', {
        pointerType,
        target: t.b.cellCard,
        relatedTarget: t.b.leftover,
        ...IN3,
      });
    }
    enter3(t, { buttons: 1 });
    t.hover(t.b.cell4, { relatedTarget: t.b.leftover, clientX: 75, clientY: 480 });
    expect(hoverTimers(t)).toBe(0);
    t.advance(1000);
    expect(t.overlays.hoverPeek).toBeNull();
  });

  it('AD-12 an entry while a press is held (captured or not) or during a fly-back does not arm', async () => {
    const t = await setup();
    t.detach();
    t.media.hoverFine = true;
    // Captured: a column-card press.
    t.down(t.b.card1, { pointerId: 2 });
    enter3(t);
    t.fire('pointerup', { pointerId: 2 });
    // Uncaptured: a press on nothing.
    t.down(t.b.leftover, { pointerId: 2 });
    enter3(t);
    t.fire('pointerup', { pointerId: 2 });
    // A fly-back: a pick-up drag released over nothing.
    t.down(t.b.card1b, { pointerId: 2, clientX: 25, clientY: 50 });
    t.fire('pointermove', { pointerId: 2, clientX: 25, clientY: 1050 });
    t.fire('pointerup', { pointerId: 2 });
    enter3(t);
    expect(hoverTimers(t)).toBe(0);
    t.advance(1000);
    expect(t.overlays.hoverPeek).toBeNull();
  });

  it('AD-12 hoverFine flipped false between arm and fire: no openHoverPeek', async () => {
    const t = await setup();
    t.detach();
    t.media.hoverFine = true;
    enter3(t);
    t.media.hoverFine = false;
    t.advance(400);
    expect(t.overlays.hoverPeek).toBeNull();
  });

  it('AD-12 a fire after the cell’s GameView became empty does not call openHoverPeek', async () => {
    const t = await setup();
    t.detach();
    t.media.hoverFine = true;
    enter3(t);
    (cells()[0] as { cards: number[] }).cards = [];
    t.advance(400);
    expect(t.overlays.hoverPeek).toBeNull();
  });

  it('AD-12 an entry while that cell’s hover peek is open does not arm', async () => {
    const t = await setup();
    t.detach();
    open3(t);
    enter3(t);
    expect(hoverTimers(t)).toBe(1);
  });

  it('AD-12 leave clears the timer and closes; moving straight to another cell closes the old one and arms the new one', async () => {
    const t = await setup();
    t.detach();
    t.media.hoverFine = true;
    enter3(t);
    t.advance(300);
    leave3(t);
    expect(t.clearTimer).toHaveBeenCalledWith(t.setTimer.mock.results[0]?.value);
    t.advance(1000);
    expect(t.overlays.hoverPeek).toBeNull();
    (cells()[1] as { cards: number[] }).cards = [9];
    open3(t);
    leave3(t, t.b.cell4);
    expect(t.overlays.hoverPeek).toBeNull();
    t.hover(t.b.cell4, { relatedTarget: t.b.cellCard, clientX: 75, clientY: 480 });
    t.advance(399);
    expect(t.overlays.hoverPeek).toBeNull();
    t.advance(1);
    expect(t.overlays.hoverPeek).toBe(4);
  });

  it('AD-12 an entry into another cell with no pointerout from the open one closes it and arms the new one', async () => {
    const t = await setup();
    t.detach();
    (cells()[1] as { cards: number[] }).cards = [9];
    open3(t);
    t.hover(t.b.cell4, { relatedTarget: null, clientX: 75, clientY: 480 });
    expect(t.overlays.hoverPeek).toBeNull();
    t.advance(399);
    expect(t.overlays.hoverPeek).toBeNull();
    t.advance(1);
    expect(t.overlays.hoverPeek).toBe(4);
  });

  it('AD-12 cancel() and detach clear a pending hover timer and close an open hover peek', async () => {
    for (const ender of ['cancel', 'detach'] as const) {
      const t = await setup();
      const detach = t.detach();
      t.media.hoverFine = true;
      enter3(t);
      if (ender === 'cancel') t.controller.cancel();
      else detach();
      expect(t.clearTimer, ender).toHaveBeenCalledWith(t.setTimer.mock.results[0]?.value);
      t.advance(1000);
      expect(t.overlays.hoverPeek, ender).toBeNull();
      if (ender === 'detach') continue;
      leave3(t);
      open3(t);
      t.controller.cancel();
      expect(t.overlays.hoverPeek).toBeNull();
      const u = await setup();
      const d = u.detach();
      open3(u);
      d();
      expect(u.overlays.hoverPeek).toBeNull();
    }
  });

  it('AD-12 cancel() with no press suppresses the cell under the last point: a boundary entry does not arm; pointerout then re-entry arms', async () => {
    const t = await setup();
    t.detach();
    open3(t);
    t.controller.cancel();
    expect(t.overlays.hoverPeek).toBeNull();
    enter3(t, { relatedTarget: null });
    expect(hoverTimers(t)).toBe(1);
    leave3(t);
    enter3(t);
    expect(hoverTimers(t)).toBe(2);
    t.advance(400);
    expect(t.overlays.hoverPeek).toBe(3);
  });

  it('AD-12 suppression is one slot: a mouse press end over cell 3 suppresses it; a later one over no cell clears it', async () => {
    const t = await setup();
    t.detach();
    t.media.hoverFine = true;
    t.fire('pointermove', { ...mouse, ...IN3 });
    t.down(t.b.cellCard, { ...mouse, ...IN3 });
    t.fire('pointerup', { ...mouse, ...IN3 });
    // The tap opened the sticky view (Idle); closing it leaves the suppression.
    expect(t.overlays.viewCell).toBe(3);
    t.overlays.close('wordcellView');
    enter3(t, { relatedTarget: null });
    // Only the press's long-press timer.
    expect(hoverTimers(t)).toBe(1);
    t.fire('pointermove', { ...mouse, clientX: 25, clientY: 300 });
    t.down(t.b.leftover, { ...mouse, clientX: 25, clientY: 300 });
    t.fire('pointerup', mouse);
    enter3(t, { relatedTarget: null });
    expect(hoverTimers(t)).toBe(2);
    t.advance(400);
    expect(t.overlays.hoverPeek).toBe(3);
  });

  it('AD-12 a touch press end leaves the suppression slot as it was', async () => {
    const t = await setup();
    t.detach();
    open3(t);
    t.controller.cancel();
    // The last mouse point moves into no cell with no pointerout: a suppress() at the touch end
    // would clear the slot.
    t.fire('pointermove', { ...mouse, clientX: 25, clientY: 300 });
    t.down(t.b.leftover);
    t.fire('pointerup');
    enter3(t, { relatedTarget: null });
    expect(hoverTimers(t)).toBe(1);
  });

  it('AD-12 any pointerdown clears a pending timer first: an enabled button, a non-primary press', async () => {
    for (const press of [
      (t: T) => t.down(t.b.undoIcon, mouse),
      (t: T) => t.down(t.b.cellCard, { ...mouse, button: 2 }),
    ]) {
      const t = await setup();
      t.detach();
      t.media.hoverFine = true;
      enter3(t);
      press(t);
      expect(t.clearTimer).toHaveBeenCalledWith(t.setTimer.mock.results[0]?.value);
      t.advance(1000);
      expect(t.overlays.hoverPeek).toBeNull();
      expect(t.active()).toBe(0);
    }
  });

  it('AD-12 the hover timer is keyed by cell number: a pointerout from a replaced cell node, or an entry into an empty cell, stops it', async () => {
    const t = await setup();
    t.detach();
    t.media.hoverFine = true;
    enter3(t);
    // Svelte replaced cell 3's node: the pointerout comes from the new one.
    const replaced = new FakeEl('div', { 'data-wordcell': '3' }, t.b.root);
    t.b.root.fire('pointerout', { ...mouse, target: replaced, relatedTarget: t.b.leftover });
    expect(t.clearTimer).toHaveBeenCalledWith(t.setTimer.mock.results[0]?.value);
    t.advance(1000);
    expect(t.overlays.hoverPeek).toBeNull();
    // A removed node sends no pointerout: the entry into empty cell 4 stops the pending timer.
    enter3(t);
    t.hover(t.b.cell4, { relatedTarget: null, clientX: 75, clientY: 480 });
    expect(t.clearTimer).toHaveBeenCalledWith(t.setTimer.mock.results[1]?.value);
    t.advance(1000);
    expect(t.overlays.hoverPeek).toBeNull();
  });

  it('AD-12 the suppression slot uses half-open rects: a last point on the shared 3/4 edge suppresses cell 4, not cell 3', async () => {
    const t = await setup();
    t.detach();
    t.media.hoverFine = true;
    (cells()[1] as { cards: number[] }).cards = [9];
    t.fire('pointermove', { ...mouse, clientX: 50, clientY: 480 });
    t.controller.cancel();
    t.hover(t.b.cell4, { relatedTarget: null, clientX: 50, clientY: 480 });
    expect(hoverTimers(t)).toBe(0);
    enter3(t, { relatedTarget: null });
    expect(hoverTimers(t)).toBe(1);
    t.advance(400);
    expect(t.overlays.hoverPeek).toBe(3);
  });

  it('AD-12 a non-primary press leaves an open hover peek open', async () => {
    const t = await setup();
    t.detach();
    open3(t);
    t.down(t.b.cellCard, { ...mouse, button: 2 });
    expect(t.overlays.hoverPeek).toBe(3);
  });

  it('AD-12 a tap that does nothing keeps an open hover peek open', async () => {
    const t = await setup();
    t.detach();
    open3(t);
    t.down(t.b.leftover, { ...mouse, ...IN3 });
    t.fire('pointerup', mouse);
    expect(t.overlays.hoverPeek).toBe(3);
  });

  it('AD-12 a touch or mouse WordCell press crossing the threshold closes it at the crossing', async () => {
    for (const pointerType of ['touch', 'mouse']) {
      const t = await setup();
      t.detach();
      open3(t);
      t.down(t.b.cellCard, { pointerType, pointerId: 2, ...IN3 });
      expect(t.overlays.hoverPeek, pointerType).toBe(3);
      t.fire('pointermove', { pointerType, pointerId: 2, clientX: 25, clientY: 440 });
      expect(t.overlays.hoverPeek, pointerType).toBeNull();
      t.fire('pointerup', { pointerType, pointerId: 2 });
      expect(navCalls, pointerType).toEqual([]);
    }
  });

  it('AD-12 another pointer’s pick-up drag hides it at the crossing and closes it in end(): before the drop dispatch, at pointercancel, lostpointercapture and cancel()', async () => {
    const enders: [string, (t: T) => void][] = [
      ['pointerup', (t) => t.fire('pointerup', { pointerId: 2 })],
      ['pointercancel', (t) => t.fire('pointercancel', { pointerId: 2 })],
      [
        'lostpointercapture',
        (t) => {
          t.b.card1b.captures.clear();
          t.fire('lostpointercapture', { pointerId: 2, target: t.b.card1b });
        },
      ],
      ['cancel()', (t) => t.controller.cancel()],
    ];
    for (const [name, ender] of enders) {
      const t = await setup();
      t.detach();
      open3(t);
      let atDispatch: number | null | undefined;
      shared.onDispatch = () => {
        atDispatch = t.overlays.hoverPeek;
      };
      t.down(t.b.card1b, { pointerId: 2, clientX: 25, clientY: 50 });
      t.fire('pointermove', { pointerId: 2, clientX: 125, clientY: 50 });
      expect(t.b.hoverPeek.classes.has('wc-hover-peek-hidden'), name).toBe(true);
      expect(t.overlays.hoverPeek, name).toBe(3);
      ender(t);
      expect(t.overlays.hoverPeek, name).toBeNull();
      if (name === 'pointerup') {
        expect(atDispatch).toBeNull();
        expect(navCalls).toEqual([drop(1, 1, 3)]);
      }
      expect(t.active() <= 1, name).toBe(true);
    }
  });

  it('AD-12 a fly-back settle suppresses the cell under the last mouse point: an entry does not arm; pointerout then re-entry arms', async () => {
    const t = await setup();
    t.detach();
    t.media.hoverFine = true;
    t.fire('pointermove', { ...mouse, ...IN3 });
    // A touch pick-up drag released over no target: its end sets no suppression (touch), the
    // settle does.
    t.down(t.b.card1b, { pointerId: 2, clientX: 25, clientY: 50 });
    t.fire('pointermove', { pointerId: 2, clientX: 25, clientY: 1050 });
    t.fire('pointerup', { pointerId: 2 });
    expect(t.b.face1b.animations).toHaveLength(1);
    t.advance(180);
    expect(t.active()).toBe(0);
    enter3(t, { relatedTarget: null });
    expect(hoverTimers(t)).toBe(0);
    leave3(t);
    enter3(t);
    expect(hoverTimers(t)).toBe(1);
    t.advance(400);
    expect(t.overlays.hoverPeek).toBe(3);
  });

  it('AD-12 an inert column-card drag (canPickUp false) closes an open hover peek at the crossing, before pointerup', async () => {
    const t = await setup();
    t.detach();
    open3(t);
    const view = shared.view as { columns: { canPickUp: boolean }[] };
    (view.columns[0] as { canPickUp: boolean }).canPickUp = false;
    t.down(t.b.card1b, { pointerId: 2, clientX: 25, clientY: 50 });
    expect(t.overlays.hoverPeek).toBe(3);
    t.fire('pointermove', { pointerId: 2, clientX: 25, clientY: 90 });
    expect(t.overlays.hoverPeek).toBeNull();
    expect(t.b.hoverPeek.classes.has('wc-hover-peek-hidden')).toBe(false);
    t.fire('pointerup', { pointerId: 2 });
    expect(navCalls).toEqual([]);
  });

  it('AD-12 with hoverFine flipped false, refreshHover() clears the timer and closes an open hover peek', async () => {
    const t = await setup();
    t.detach();
    open3(t);
    t.media.hoverFine = false;
    t.controller.refreshHover();
    expect(t.overlays.hoverPeek).toBeNull();
    t.media.hoverFine = true;
    leave3(t);
    enter3(t);
    t.media.hoverFine = false;
    t.controller.refreshHover();
    expect(t.clearTimer).toHaveBeenCalledWith(t.setTimer.mock.results[1]?.value);
    t.media.hoverFine = true;
    t.advance(1000);
    expect(t.overlays.hoverPeek).toBeNull();
  });

  it('AD-12 a hoverFine change to false closes an open hover peek with no refreshHover() call; detach unwatches', async () => {
    const t = await setup();
    const detach = t.detach();
    open3(t);
    t.flipHoverFine(false);
    expect(t.overlays.hoverPeek).toBeNull();
    t.flipHoverFine(true);
    leave3(t);
    enter3(t);
    t.flipHoverFine(false);
    expect(t.clearTimer).toHaveBeenCalledWith(t.setTimer.mock.results[1]?.value);
    t.media.hoverFine = true;
    t.advance(1000);
    expect(t.overlays.hoverPeek).toBeNull();
    detach();
    t.overlays.openHoverPeek(3);
    t.flipHoverFine(false);
    expect(t.overlays.hoverPeek).toBe(3);
  });
});

// Epic 5 SPEC CAP-4 (F1, F2, F13, F18): the tile selection through the controller, on tileView().
describe('AD-12 epic 5 tile tap', () => {
  type T = Awaited<ReturnType<typeof setup>>;
  const dispatched = (command: Record<string, unknown>) => `dispatch ${JSON.stringify(command)}`;
  const move = (t: T, x: number, y: number) => t.fire('pointermove', { clientX: x, clientY: y });
  // A press on `el` at (100, 100) moved 10 px (past the threshold).
  const crossed = (t: T, el: FakeEl) => {
    t.down(el, { clientX: 100, clientY: 100 });
    move(t, 110, 100);
  };
  const ready = async (phase: 'composing' | 'place' = 'composing', selected: number | null = 3) => {
    const t = await setup();
    t.detach();
    tileView(phase);
    if (selected !== null) t.overlays.selectTile(selected);
    navCalls.length = 0;
    return t;
  };

  it('AD-12 F2 a tray tile, a strip tile and a hit inside the pitch outside the face resolve to their tile; a mirror to the block', async () => {
    const t = await ready('composing', null);
    // elementFromPoint answers the slot wrapper for any point of its pitch (a half-gap included).
    t.tap(t.b.tile);
    expect(t.overlays.tileSelection).toBe(3);
    t.tap(t.b.trayMirrorFace);
    expect(t.overlays.tileSelection).toBe(3);
    t.tap(t.b.tile);
    expect(t.overlays.tileSelection).toBeNull();
    t.tap(t.b.tile2);
    expect(t.overlays.tileSelection).toBe(4);
    const p = await ready('place', null);
    p.tap(p.b.stripTile);
    expect(p.overlays.tileSelection).toBe(6);
    // The selected tile's own wrapper (its half-gap) resolves to it: a second tap deselects (R-35).
    p.tap(p.b.stripTile);
    expect(p.overlays.tileSelection).toBeNull();
    expect(navCalls).toEqual([]);
  });

  it('AD-12 a swap dispatches one arrange or setPlacementOrder with the selection already cleared', async () => {
    const t = await ready();
    const seen: (number | null)[] = [];
    shared.onDispatch = () => seen.push(t.overlays.tileSelection);
    t.tap(t.b.tile2);
    expect(navCalls).toEqual([dispatched({ type: 'arrange', arrangement: [4, 3] })]);
    expect(seen).toEqual([null]);
    expect(t.overlays.tileSelection).toBeNull();
    const p = await ready('place', 6);
    p.tap(p.b.tile);
    expect(navCalls).toEqual([dispatched({ type: 'setPlacementOrder', order: [6, 4, 3] })]);
    expect(p.overlays.tileSelection).toBeNull();
  });

  it('AD-12 Q-31 a second tap on a selected Composing free letter dispatches removeFreeLetter and ends the selection; on an S tile only deselects', async () => {
    const t = await ready('composing', 4);
    const seen: (number | null)[] = [];
    shared.onDispatch = () => seen.push(t.overlays.tileSelection);
    t.tap(t.b.tile2);
    expect(navCalls).toEqual([dispatched({ type: 'removeFreeLetter', cell: 5 })]);
    expect(seen).toEqual([null]);
    expect(t.overlays.tileSelection).toBeNull();
    navCalls.length = 0;
    t.overlays.selectTile(3);
    t.tap(t.b.tile);
    expect(t.overlays.tileSelection).toBeNull();
    expect(navCalls).toEqual([]);
  });

  it('AD-12 a column-card tap in Composing clears the selection and still dispatches tapDestinationCard', async () => {
    const t = await ready();
    const seen: (number | null)[] = [];
    shared.onDispatch = () => seen.push(t.overlays.tileSelection);
    t.tap(t.b.card1);
    expect(navCalls).toEqual([dispatched({ type: 'tapDestinationCard', card: 0 })]);
    expect(seen).toEqual([null]);
    t.overlays.selectTile(3);
    t.tap(t.b.card2);
    expect(t.overlays.tileSelection).toBeNull();
    expect(navCalls).toHaveLength(1);
  });

  it('AD-12 R-39 a destination-card drag-as-tap clears the tile selection before its one tapDestinationCard', async () => {
    const t = await ready();
    const seen: (number | null)[] = [];
    shared.onDispatch = () => seen.push(t.overlays.tileSelection);
    crossed(t, t.b.card1);
    t.fire('pointerup');
    expect(navCalls).toEqual([dispatched({ type: 'tapDestinationCard', card: 0 })]);
    expect(seen).toEqual([null]);
    expect(t.overlays.tileSelection).toBeNull();
  });

  it('AD-12 R-32 a block tap, an empty or long-pressed empty Composing WordCell keep; an available cell, outside, the action gap and a disabled button clear', async () => {
    const t = await ready();
    t.tap(t.b.trayMirrorFace);
    t.tap(t.b.cell4);
    t.down(t.b.cell4);
    t.advance(400);
    t.fire('pointerup');
    expect(t.overlays.tileSelection).toBe(3);
    t.overlays.clearTile();
    for (const el of [t.b.cellCard, t.b.tray, t.b.actionGap, t.b.redoDisabled, t.b.leftover]) {
      t.overlays.selectTile(3);
      t.tap(el);
      expect(t.overlays.tileSelection).toBeNull();
    }
    expect(navCalls).toEqual([]);
  });

  it('AD-12 F13 Place: a not-legal WordCell keeps; the current target and a legal non-current cell clear, dispatching nothing', async () => {
    const t = await ready('place', 6);
    t.tap(t.b.cell4);
    expect(t.overlays.tileSelection).toBe(6);
    t.tap(t.b.cellCard);
    expect(t.overlays.tileSelection).toBeNull();
    t.overlays.selectTile(6);
    t.tap(t.b.cell5);
    expect(t.overlays.tileSelection).toBeNull();
    expect(navCalls).toEqual([]);
  });

  it('AD-12 F1 Place: a legal non-current cell dragged ≥ 8 px and released by pointerup clears, dispatching nothing', async () => {
    const t = await ready('place', 6);
    crossed(t, t.b.cell5);
    expect(t.overlays.tileSelection).toBe(6);
    t.fire('pointerup');
    expect(t.overlays.tileSelection).toBeNull();
    expect(navCalls).toEqual([]);
  });

  it('AD-12 D-block mirror press or drag keeps, whatever its end', async () => {
    const t = await ready();
    crossed(t, t.b.trayMirrorFace);
    t.fire('pointerup');
    expect(t.overlays.tileSelection).toBe(3);
    crossed(t, t.b.trayMirrorFace);
    t.fire('pointercancel');
    expect(t.overlays.tileSelection).toBe(3);
    expect(navCalls).toEqual([]);
  });

  it('AD-12 F1 a ≥ 8 px move on the tray background ended by pointerup clears; by pointercancel keeps', async () => {
    const t = await ready();
    crossed(t, t.b.tray);
    t.fire('pointercancel');
    expect(t.overlays.tileSelection).toBe(3);
    crossed(t, t.b.tray);
    expect(t.overlays.tileSelection).toBe(3);
    t.fire('pointerup');
    expect(t.overlays.tileSelection).toBeNull();
    expect(navCalls).toEqual([]);
  });

  it('AD-12 F1 a crossed captured non-tile press ended by lostpointercapture keeps; an available cell dragged and released clears', async () => {
    const t = await ready();
    crossed(t, t.b.card2);
    t.fire('lostpointercapture', { target: t.b.card2 });
    expect(t.active()).toBe(0);
    expect(t.overlays.tileSelection).toBe(3);
    crossed(t, t.b.cellCard);
    t.fire('pointerup');
    expect(t.overlays.tileSelection).toBeNull();
    expect(navCalls).toEqual([]);
  });

  // Entry 5.7 keeps this test's threshold half; its ends are the tile drag's (describe below).
  it('AD-12 F18 a ≥ 8 px press on any live tile clears the tile selection at the threshold', async () => {
    for (const which of ['tile', 'tile2'] as const) {
      const t = await ready();
      crossed(t, t.b[which]);
      expect(t.overlays.tileSelection).toBeNull();
      expect(navCalls).toEqual([]);
    }
    const p = await ready('place', 6);
    crossed(p, p.b.stripTile);
    expect(p.overlays.tileSelection).toBeNull();
    expect(navCalls).toEqual([]);
  });

  it('AD-12 F1 a tile press under 8 px ended by pointercancel keeps', async () => {
    const t = await ready();
    t.down(t.b.tile2, { clientX: 100, clientY: 100 });
    move(t, 104, 104);
    t.fire('pointercancel');
    expect(t.overlays.tileSelection).toBe(3);
    expect(navCalls).toEqual([]);
  });

  it('AD-12 AD-9 a same-id pointerdown, cancel({ byBack: true }) and cancel() (the before-hide path) keep', async () => {
    const t = await ready();
    t.down(t.b.leftover);
    t.down(t.b.tray);
    t.fire('pointercancel');
    expect(t.overlays.tileSelection).toBe(3);
    t.down(t.b.leftover);
    t.controller.cancel({ byBack: true });
    expect(t.overlays.tileSelection).toBe(3);
    crossed(t, t.b.tray);
    t.controller.cancel();
    expect(t.overlays.tileSelection).toBe(3);
    t.controller.cancel();
    expect(t.overlays.tileSelection).toBe(3);
    expect(t.active()).toBe(0);
    expect(navCalls).toEqual([]);
  });

  it('AD-12 F13 a long-press peek keeps the selection, also with a ≥ 8 px move after it fires', async () => {
    const t = await ready();
    t.down(t.b.cellCard, { clientX: 100, clientY: 100 });
    t.advance(400);
    expect(t.overlays.peek).toBe(3);
    t.fire('pointerup');
    expect(t.overlays.peek).toBeNull();
    expect(t.overlays.tileSelection).toBe(3);
    t.down(t.b.cellCard, { clientX: 100, clientY: 100 });
    t.advance(400);
    move(t, 130, 100);
    t.fire('pointerup');
    expect(t.overlays.tileSelection).toBe(3);
    expect(navCalls).toEqual([]);
  });

  it('AD-12 AD-13 F13 a peek turned sticky keeps the selection; a scrim tap and back close the view and keep it', async () => {
    const t = await ready();
    t.b.viewScroll.scrollHeight = 900;
    t.b.viewScroll.clientHeight = 300;
    const sticky = () => {
      t.down(t.b.cellCard);
      t.advance(400);
      t.fire('pointerup', { target: t.b.cellCard });
      expect(t.overlays.top).toBe('wordcellView');
      expect(t.overlays.tileSelection).toBe(3);
    };
    sticky();
    t.tap(t.b.scrim);
    expect(t.overlays.viewCell).toBeNull();
    expect(t.overlays.tileSelection).toBe(3);
    sticky();
    t.controller.cancel({ byBack: true });
    t.overlays.closedByBack(t.overlays.depth - 1);
    expect(t.overlays.viewCell).toBeNull();
    expect(t.overlays.depth).toBe(0);
    expect(t.overlays.tileSelection).toBe(3);
  });

  it('AD-12 F2 a non-pointer click (detail 0) on outside or on a tile leaves the tile selection alone', async () => {
    const t = await ready();
    for (const target of [t.b.leftover, t.b.tile, t.b.tile2, t.b.trayMirror, t.b.tray]) {
      t.fire('click', { target, detail: 0 });
      expect(t.overlays.tileSelection).toBe(3);
    }
    expect(navCalls).toEqual([]);
  });

  it('AD-12 a stale tile selection throws at the next tap', async () => {
    const t = await ready('composing', 6);
    expect(() => t.tap(t.b.leftover)).toThrow(
      /^AD-12 tileTap with tile 6 selected, not a live tile/,
    );
  });
});

// Epic 5 SPEC CAP-5 (F2, F4, F5, F18; AD-10, AD-11): the tile drag on tileView(). Every press is at
// (100, 100), so a move to (100 + dx, 100 + dy) writes translate(dx, dy − lift) on the face. Resting
// face centres: tile 3 x 32, tile 4 x 80, strip tile 6 x 128 (y 666.5); gap-rect centres x 8, 56,
// 104 (and 152 in Place), y 666.5. Composing run [3, 4] (block of one on the right), Place [3, 4, 6].
describe('AD-12 epic 5 tile drag', () => {
  type T = Awaited<ReturnType<typeof setup>>;
  const dispatched = (command: Record<string, unknown>) => `dispatch ${JSON.stringify(command)}`;
  const move = (t: T, dx: number, dy = 0, init: Partial<FakeEvent> = {}) =>
    t.fire('pointermove', { clientX: 100 + dx, clientY: 100 + dy, ...init });
  const press = (t: T, el: FakeEl, init: Partial<FakeEvent> = {}) =>
    t.down(el, { clientX: 100, clientY: 100, ...init });
  const ready = async (
    phase: 'composing' | 'place' = 'composing',
    selected: number | null = null,
  ) => {
    const t = await setup();
    t.detach();
    tileView(phase);
    if (selected !== null) t.overlays.selectTile(selected);
    navCalls.length = 0;
    return t;
  };
  const faces = (t: T) => [t.b.tileFace, t.b.tile2Face, t.b.stripFace];
  const transforms = (t: T) => faces(t).map((f) => f.style.transform);
  const last = (f: FakeEl) => {
    const a = f.animations.at(-1);
    if (a === undefined) throw new Error('no animation');
    return a;
  };
  // Nothing of the drag left on the DOM: no transform, layer or clip class.
  const clean = (t: T) =>
    transforms(t).every((x) => x === '') &&
    faces(t).every((f) => !f.classes.has('wc-drag-layer')) &&
    !t.b.tiles.classes.has('wc-drag-tiles');
  // Tile 4 dragged left onto gap 0 (Composing): tile 3 parts one slot right.
  const partedLeft = async (selected: number | null = null) => {
    const t = await ready('composing', selected);
    press(t, t.b.tile2);
    move(t, -72);
    expect(t.b.tileFace.style.transform).toBe('translate(48px, 0px)');
    return t;
  };

  it('AD-12 R-34 a tile released over an accepted gap dispatches one arrange, the drag and parting cleared and the gate idle at the dispatch, then repaints hover', async () => {
    const t = await ready();
    let at: { active: number; clean: boolean } | null = null;
    shared.onDispatch = () => {
      at = { active: t.active(), clean: clean(t) };
    };
    press(t, t.b.tile2);
    move(t, -72);
    expect(t.b.tile2Face.style.transform).toBe('translate(-72px, 0px)');
    expect(t.b.tile2Face.classes.has('wc-drag-layer')).toBe(true);
    expect(t.b.tiles.classes.has('wc-drag-tiles')).toBe(true);
    expect(t.b.tileFace.style.transform).toBe('translate(48px, 0px)');
    t.fire('pointerup');
    expect(navCalls).toEqual([dispatched({ type: 'arrange', arrangement: [4, 3] })]);
    expect(at).toEqual({ active: 0, clean: true });
    expect(last(t.b.tileFace).finish).toHaveBeenCalled();
    // No landing glide (entry 16): no fly-back on the dragged face.
    expect(t.b.tile2Face.animations).toHaveLength(0);
    // A drag right by two: tile 3 onto gap 2 parts tile 4 one slot left.
    const r = await ready();
    press(r, r.b.tile);
    move(r, 72);
    expect(r.b.tile2Face.style.transform).toBe('translate(-48px, 0px)');
    r.fire('pointerup');
    expect(navCalls).toEqual([dispatched({ type: 'arrange', arrangement: [4, 3] })]);
    expect(clean(r)).toBe(true);
  });

  it('AD-12 R-51 a strip tile released over gap 0 dispatches one setPlacementOrder', async () => {
    const t = await ready('place');
    press(t, t.b.stripTile);
    move(t, -120);
    expect(transforms(t)).toEqual([
      'translate(48px, 0px)',
      'translate(48px, 0px)',
      'translate(-120px, 0px)',
    ]);
    t.fire('pointerup');
    expect(navCalls).toEqual([dispatched({ type: 'setPlacementOrder', order: [6, 3, 4] })]);
    expect(clean(t)).toBe(true);
    expect(t.active()).toBe(0);
  });

  it('AD-12 R-71 a release over the own gap dispatches nothing: the tile flies back, the face already heading home keeps its animation', async () => {
    const t = await ready();
    press(t, t.b.tile2);
    move(t, -72);
    move(t, 10);
    // Tile 3 already heads home (parting to rest): the release keeps that animation.
    const home = last(t.b.tileFace);
    const count = t.b.tileFace.animations.length;
    t.fire('pointerup');
    expect(navCalls).toEqual([]);
    expect(t.b.tileFace.animations).toHaveLength(count);
    expect(home.cancel).not.toHaveBeenCalled();
    const fly = last(t.b.tile2Face);
    expect(fly.keyframes).toEqual([
      { transform: 'translate(10px, 0px)' },
      { transform: 'translate(0px, 0px)' },
    ]);
    expect(fly.options.duration).toBe(180);
    expect(home.keyframes.at(-1)).toEqual({ transform: 'translate(0px, 0px)' });
    expect(durations.kinds.filter((k) => k === 'flyBack')).toHaveLength(2);
    expect(t.active()).toBeGreaterThan(0);
    expect(t.b.tile2Face.classes.has('wc-drag-layer')).toBe(true);
    t.advance(180);
    expect(t.active()).toBe(0);
    expect(clean(t)).toBe(true);
    expect(navCalls).toEqual([]);
  });

  it('AD-12 F4 tray acceptance is pickTarget with the clipped band as sole candidate, exactly 25 % inclusive; under 25 % every other face rests and the release flies back', async () => {
    const t = await ready();
    // Tile 3 right onto gap 2 (face x 82 … 126, inside the band's width).
    press(t, t.b.tile);
    // Face top 560.25: 13.25 of its 53 px over the band (y 600) is exactly 25 %.
    move(t, 72, -79.75);
    expect(t.b.tile2Face.style.transform).toBe('translate(-48px, 0px)');
    move(t, 72, -80);
    expect(t.b.tile2Face.style.transform).toBe('');
    expect(last(t.b.tile2Face).keyframes).toEqual([
      { transform: 'translate(-48px, 0px)' },
      { transform: 'translate(0px, 0px)' },
    ]);
    // Over a column (y 0 … 400) and outside the band: no column lights (the tray is the only
    // candidate).
    move(t, 72, -600);
    for (const el of [t.b.column1, t.b.card1, t.b.placeholder1, t.b.placeholder3]) {
      expect(el.classes.has('wc-drag-target')).toBe(false);
    }
    t.fire('pointerup');
    expect(navCalls).toEqual([]);
    expect(last(t.b.tileFace).keyframes[0]).toEqual({ transform: 'translate(72px, -600px)' });
    t.advance(180);
    expect(clean(t)).toBe(true);
    expect(t.active()).toBe(0);
    // F4: the band clipped by the action bar (top 700): 13.25 px over the visible part is 25 %,
    // 12.25 px is not, though both lie wholly over the unclipped band.
    const c = await ready();
    c.b.actionBar.rect = { left: 0, top: 700, right: 400, bottom: 760 };
    press(c, c.b.tile);
    move(c, 72, 46.75);
    expect(c.b.tile2Face.style.transform).toBe('translate(-48px, 0px)');
    move(c, 72, 47.75);
    expect(c.b.tile2Face.style.transform).toBe('');
    c.fire('pointerup');
    expect(navCalls).toEqual([]);
  });

  it('AD-12 a pointerup with no new move acts on the last move’s acceptance and gap', async () => {
    const t = await ready();
    press(t, t.b.tile2);
    move(t, -72);
    // The face is moved under 25 % without a pointermove (e.g. the band shifted): still gap 0.
    t.b.tray.rect = { left: 0, top: 2000, right: 400, bottom: 2200 };
    t.fire('pointerup', { clientX: 100, clientY: 100 });
    expect(navCalls).toEqual([dispatched({ type: 'arrange', arrangement: [4, 3] })]);
    const u = await ready();
    press(u, u.b.tile2);
    move(u, -72, -200);
    u.fire('pointerup', { clientX: 28, clientY: 100 });
    expect(navCalls).toEqual([]);
  });

  it('AD-12 F2 a selected tile drags from its lifted face with no jump and flies back unlifted, restoring no selection', async () => {
    const t = await ready('composing', 3);
    // The selected face rests 4 px above its slot (Card's selected lift).
    t.b.tileFace.rect = { left: 10, top: 636, right: 54, bottom: 689 };
    press(t, t.b.tile);
    move(t, 10);
    expect(t.b.tileFace.style.transform).toBe('translate(10px, -4px)');
    expect(t.overlays.tileSelection).toBeNull();
    t.b.tileFace.rect = t.b.slotAt(0);
    t.fire('pointercancel');
    expect(last(t.b.tileFace).keyframes).toEqual([
      { transform: 'translate(10px, -4px)' },
      { transform: 'translate(0px, 0px)' },
    ]);
    t.advance(180);
    expect(t.overlays.tileSelection).toBeNull();
    expect(clean(t)).toBe(true);
  });

  it('AD-10 the parted faces animate over duration(parting); under reduced motion they are written at once with no running animation', async () => {
    const t = await ready();
    press(t, t.b.tile2);
    move(t, -72);
    expect(durations.kinds).toContain('parting');
    const a = last(t.b.tileFace);
    expect(a.keyframes).toEqual([
      { transform: 'translate(0px, 0px)' },
      { transform: 'translate(48px, 0px)' },
    ]);
    expect(a.options).toEqual({ duration: 90, easing: 'ease-out' });
    expect(t.b.tileFace.style.transform).toBe('translate(48px, 0px)');
    expect(t.active()).toBe(2);
    t.advance(90);
    expect(t.active()).toBe(1);
    // D-block mirrors never move.
    expect(t.b.trayMirrorFace.animations).toHaveLength(0);
    expect(t.b.trayMirrorFace.style.transform).toBe('');
    const r = await ready();
    motion.value = { baseMs: 180, reduced: true };
    press(r, r.b.tile2);
    move(r, -72);
    expect(r.b.tileFace.style.transform).toBe('translate(48px, 0px)');
    expect(r.b.tileFace.animations).toHaveLength(0);
    expect(r.active()).toBe(1);
    move(r, 10);
    expect(r.b.tileFace.style.transform).toBe('');
    expect(r.b.tileFace.animations).toHaveLength(0);
    move(r, -72);
    // A no-edit end under reduced motion: the parted face clears and fades in (the fly-back's).
    r.controller.cancel({ byBack: true });
    expect(r.b.tileFace.style.transform).toBe('');
    expect(last(r.b.tileFace).keyframes).toEqual([{ opacity: 0 }, { opacity: 1 }]);
    expect(last(r.b.tileFace).options.duration).toBe(120);
    r.advance(120);
    expect(r.active()).toBe(0);
    expect(clean(r)).toBe(true);
  });

  it('AD-11 AD-12 two gap changes within one parting duration: each supersedes the running animation from its current offset; the gate is idle at the release dispatch', async () => {
    const t = await ready('place');
    let atDispatch: number | null = null;
    shared.onDispatch = () => {
      atDispatch = t.active();
    };
    press(t, t.b.stripTile);
    move(t, -120);
    const first = last(t.b.tileFace);
    const kept = last(t.b.tile2Face);
    t.advance(30);
    move(t, -72);
    // Tile 3 back toward rest from its current offset; tile 4 stays parted.
    expect(first.cancel).toHaveBeenCalled();
    expect(first.onfinish).toBeNull();
    expect(last(t.b.tileFace).keyframes).toEqual([
      { transform: 'translate(48px, 0px)' },
      { transform: 'translate(0px, 0px)' },
    ]);
    expect(t.b.tileFace.style.transform).toBe('');
    expect(t.b.tile2Face.style.transform).toBe('translate(48px, 0px)');
    // Tile 4's animation already ends on its offset: kept, not restarted.
    expect(kept.cancel).not.toHaveBeenCalled();
    expect(t.b.tile2Face.animations).toEqual([kept]);
    t.advance(30);
    move(t, -120);
    expect(last(t.b.tileFace).keyframes).toEqual([
      { transform: 'translate(0px, 0px)' },
      { transform: 'translate(48px, 0px)' },
    ]);
    expect(t.active()).toBe(2);
    move(t, -72);
    t.fire('pointerup');
    expect(navCalls).toEqual([dispatched({ type: 'setPlacementOrder', order: [3, 6, 4] })]);
    expect(atDispatch).toBe(0);
    expect(clean(t)).toBe(true);
    t.advance(200);
    expect(t.active()).toBe(0);
  });

  it('AD-12 a parting animation cancelled by anything but the controller throws (rule 6)', async () => {
    const t = await partedLeft();
    expect(() => last(t.b.tileFace).oncancel?.()).toThrow(/^AD-12 parting animation cancelled/);
  });

  it('AD-12 F5 F18 pointercancel, lostpointercapture and cancel({ byBack: true }) with a tile selected fly back with the returns, dispatch nothing and end with nothing selected; the gate idles once they settle', async () => {
    const enders: [string, (t: T) => void][] = [
      ['pointercancel', (t) => t.fire('pointercancel')],
      ['lostpointercapture', (t) => t.fire('lostpointercapture', { target: t.b.tile2 })],
      ['cancel byBack', (t) => t.controller.cancel({ byBack: true })],
    ];
    for (const [name, ender] of enders) {
      const t = await partedLeft(3);
      expect(t.overlays.tileSelection, name).toBeNull();
      ender(t);
      expect(navCalls, name).toEqual([]);
      expect(last(t.b.tile2Face).keyframes, name).toEqual([
        { transform: 'translate(-72px, 0px)' },
        { transform: 'translate(0px, 0px)' },
      ]);
      expect(last(t.b.tileFace).keyframes, name).toEqual([
        { transform: 'translate(48px, 0px)' },
        { transform: 'translate(0px, 0px)' },
      ]);
      expect(t.active(), name).toBe(2);
      t.advance(180);
      expect(t.active(), name).toBe(0);
      expect(clean(t), name).toBe(true);
      expect(t.overlays.tileSelection, name).toBeNull();
    }
  });

  it('AD-11 AD-12 mid-drag (parted) cancel() clears every transform, class and animation at once, gate idle, no dispatch, nothing selected', async () => {
    const t = await partedLeft(3);
    const parted = last(t.b.tileFace);
    t.controller.cancel();
    expect(clean(t)).toBe(true);
    expect(parted.finish).toHaveBeenCalled();
    expect(t.b.tile2Face.animations).toHaveLength(0);
    expect(t.active()).toBe(0);
    expect(navCalls).toEqual([]);
    expect(t.overlays.tileSelection).toBeNull();
    t.advance(200);
    expect(t.active()).toBe(0);
  });

  it('AD-12 a same-id pointerdown and detach settle a tile drag at once', async () => {
    const t = await partedLeft();
    press(t, t.b.leftover);
    expect(clean(t)).toBe(true);
    expect(t.active()).toBe(1);
    t.fire('pointerup');
    expect(t.active()).toBe(0);
    expect(navCalls).toEqual([]);
  });

  it('AD-12 detach mid-drag settles at once', async () => {
    const t = await setup();
    const off = t.detach();
    tileView();
    press(t, t.b.tile2);
    move(t, -72);
    off();
    expect(clean(t)).toBe(true);
    expect(t.active()).toBe(0);
  });

  it('AD-11 AD-12 a button-0 pointerdown during the fly-back and returns finishes both first; the gate never idles between', async () => {
    const t = await partedLeft();
    move(t, 10);
    t.fire('pointerup');
    expect(navCalls).toEqual([]);
    const before = t.active();
    expect(before).toBe(2);
    const from = order.length;
    press(t, t.b.leftover);
    let count = before;
    let min = before;
    for (const entry of order.slice(from)) {
      if (entry === 'enter') count += 1;
      if (entry === 'leave') count -= 1;
      min = Math.min(min, count);
    }
    expect(min).toBeGreaterThan(0);
    expect(order.slice(from)[0]).toBe('enter');
    expect(clean(t)).toBe(true);
    expect(t.active()).toBe(1);
    t.fire('pointerup');
    expect(t.active()).toBe(0);
  });

  it('AD-12 an App button pressed mid-drag settles it at once and dispatches only its own command', async () => {
    const t = await partedLeft(3);
    const { act, setController } = await import('../act');
    const { game } = await import('../../shell/game.svelte');
    setController(t.controller);
    let at: { active: number; clean: boolean } | null = null;
    shared.onDispatch = () => {
      at = { active: t.active(), clean: clean(t) };
    };
    act(() => game.dispatch({ type: 'undo' }))();
    expect(navCalls).toEqual([dispatched({ type: 'undo' })]);
    expect(at).toEqual({ active: 0, clean: true });
    expect(t.overlays.tileSelection).toBeNull();
    // The held pointer's later moves and release do nothing.
    move(t, -72);
    t.fire('pointerup');
    expect(navCalls).toHaveLength(1);
    expect(clean(t)).toBe(true);
  });

  it('AD-12 a mouse tile drag clears hover and hides the hover peek at its threshold, closes the peek at its end, and repaints hover only at the fly-back’s settle (or after an edit dispatch)', async () => {
    const mouse = { pointerType: 'mouse' };
    const t = await ready();
    t.media.hoverFine = true;
    t.hover(t.b.card1);
    expect([...t.b.column1.classes]).toEqual(['wc-hover-tail']);
    t.overlays.openHoverPeek(3);
    press(t, t.b.tile, mouse);
    move(t, 10, 0, mouse);
    expect(t.b.column1.classes.size).toBe(0);
    expect(t.b.hoverPeek.classes.has('wc-hover-peek-hidden')).toBe(true);
    expect(t.overlays.hoverPeek).toBe(3);
    t.hover(t.b.card1);
    t.controller.refreshHover();
    expect(t.b.column1.classes.size).toBe(0);
    t.fire('pointerup', mouse);
    expect(navCalls).toEqual([]);
    expect(t.overlays.hoverPeek).toBeNull();
    expect(t.b.column1.classes.size).toBe(0);
    t.advance(180);
    expect([...t.b.column1.classes]).toEqual(['wc-hover-tail']);
    // An edit release repaints after its dispatch.
    const e = await ready();
    e.media.hoverFine = true;
    let atDispatch: number | null = null;
    shared.onDispatch = () => {
      atDispatch = e.b.column1.classes.size;
    };
    press(e, e.b.tile2, mouse);
    move(e, -72, 0, mouse);
    e.point(e.b.card1);
    e.fire('pointerup', mouse);
    expect(navCalls).toEqual([dispatched({ type: 'arrange', arrangement: [4, 3] })]);
    expect(atDispatch).toBe(0);
    expect([...e.b.column1.classes]).toEqual(['wc-hover-tail']);
  });

  it('AD-12 R-32 with the block on the left (run from tray position 1) the other run face parts from and returns to its own slot', async () => {
    const t = await ready();
    // Tray order: the mirror at position 0, tile 3 at 1, tile 4 at 2.
    const view = shared.view as { draft: { side: string } };
    view.draft.side = 'left';
    const kids = t.b.tiles.children;
    kids.splice(kids.indexOf(t.b.trayMirror), 1);
    kids.unshift(t.b.trayMirror);
    t.b.trayMirror.rect = { ...t.b.slotAt(0), left: 8, right: 56 };
    for (const [wrapper, face, p] of [
      [t.b.tile, t.b.tileFace, 1],
      [t.b.tile2, t.b.tile2Face, 2],
    ] as const) {
      const r = t.b.slotAt(p);
      wrapper.rect = { ...r, left: r.left - 2, right: r.right + 2 };
      face.rect = r;
    }
    press(t, t.b.tile2);
    // Tile 4's centre (x 128) onto gap 0 (x 54 … 58, between the mirror and tile 3).
    move(t, -72);
    expect(t.b.tileFace.style.transform).toBe('translate(48px, 0px)');
    expect(last(t.b.tileFace).keyframes).toEqual([
      { transform: 'translate(0px, 0px)' },
      { transform: 'translate(48px, 0px)' },
    ]);
    expect(t.b.trayMirrorFace.animations).toHaveLength(0);
    t.fire('pointercancel');
    expect(last(t.b.tileFace).keyframes).toEqual([
      { transform: 'translate(48px, 0px)' },
      { transform: 'translate(0px, 0px)' },
    ]);
    t.advance(180);
    expect(clean(t)).toBe(true);
    expect(t.active()).toBe(0);
    // An edit release from the same state: arrange [4, 3].
    const e = await ready();
    (shared.view as { draft: { side: string } }).draft.side = 'left';
    e.b.tiles.children.splice(e.b.tiles.children.indexOf(e.b.trayMirror), 1);
    e.b.tiles.children.unshift(e.b.trayMirror);
    e.b.trayMirror.rect = { ...e.b.slotAt(0), left: 8, right: 56 };
    e.b.tileFace.rect = e.b.slotAt(1);
    e.b.tile2Face.rect = e.b.slotAt(2);
    press(e, e.b.tile2);
    move(e, -72);
    e.fire('pointerup');
    expect(navCalls).toEqual([dispatched({ type: 'arrange', arrangement: [4, 3] })]);
  });

  it('AD-12 a plain cancel() while a no-edit release’s fly-back and returns run finishes them at once, with or without a press: gate idle, no residue', async () => {
    for (const withPress of [false, true]) {
      const t = await ready();
      press(t, t.b.tile2);
      move(t, -72);
      // Back over the own gap: tile 3 heads home; the release flies tile 4 back.
      move(t, 10);
      const home = last(t.b.tileFace);
      t.fire('pointerup');
      const fly = last(t.b.tile2Face);
      expect(t.active()).toBe(2);
      if (withPress) press(t, t.b.leftover);
      t.controller.cancel();
      expect(home.finish).toHaveBeenCalled();
      expect(fly.finish).toHaveBeenCalled();
      expect(t.active()).toBe(0);
      expect(clean(t)).toBe(true);
      expect(navCalls).toEqual([]);
      t.advance(1000);
      expect(t.active()).toBe(0);
    }
  });

  it('AD-12 R-32 a block-mirror drag moves nothing and keeps the tile selection', async () => {
    const t = await ready('composing', 3);
    press(t, t.b.trayMirrorFace);
    move(t, -72);
    move(t, -120);
    expect(t.overlays.tileSelection).toBe(3);
    expect(clean(t)).toBe(true);
    expect(faces(t).every((f) => f.animations.length === 0)).toBe(true);
    expect(t.b.trayMirrorFace.style.transform).toBe('');
    t.fire('pointerup');
    expect(navCalls).toEqual([]);
    expect(t.overlays.tileSelection).toBe(3);
    expect(t.active()).toBe(0);
  });
});
