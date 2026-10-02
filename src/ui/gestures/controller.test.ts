import { describe, expect, it, vi } from 'vitest';
import type { Gate } from './gate';

// AD-12 pointer controller in node: a fake root (listener map, `contains`), fake elements
// (`closest` over a parent chain and an attribute map; capture spies with `hasPointerCapture`
// state; releasing capture fires `lostpointercapture` synchronously, as a browser may), fake events
// with preventDefault/stopPropagation spies, a counting gate, a virtual-time scheduler, nav stubbed
// with a call log, `game.view` settable, `game.dispatch` logging into the same order log (entry 7),
// the real overlays store (fresh modules per test).
const navCalls: string[] = [];
const shared: { view: unknown } = { view: undefined };

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
  root: FakeEl | null = null;
  readonly classes = new Set<string>();
  readonly props = new Map<string, string>();
  readonly classList = {
    add: (...names: string[]) => {
      for (const n of names) this.classes.add(n);
    },
    remove: (...names: string[]) => {
      for (const n of names) this.classes.delete(n);
    },
  };
  readonly style = {
    setProperty: (name: string, value: string) => this.props.set(name, value),
    removeProperty: (name: string) => this.props.delete(name),
  };
  constructor(
    readonly tag: string,
    readonly attrs: Record<string, string> = {},
    readonly parent: FakeEl | null = null,
    readonly disabled = false,
  ) {}
  getAttribute(name: string): string | null {
    return this.attrs[name] ?? null;
  }
  closest(selector: string): FakeEl | null {
    for (let el: FakeEl | null = this; el !== null; el = el.parent) {
      if (el.is(selector)) return el;
    }
    return null;
  }
  private is(selector: string): boolean {
    if (selector === 'button:enabled') return this.tag === 'button' && !this.disabled;
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
    expect(options).toEqual({ passive: false });
    this.listeners.set(type, fn);
  }
  removeEventListener(type: string, fn: Listener): void {
    if (this.listeners.get(type) === fn) this.listeners.delete(type);
  }
  fire(type: string, init: Partial<FakeEvent>): FakeEvent {
    const event = makeEvent(init);
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
  const topBar = el('div', { 'data-band': 'topBar' }, root);
  const undo = el('button', {}, topBar);
  const undoIcon = el('svg', {}, undo);
  const redoDisabled = el('button', {}, topBar, true);
  const column1 = el('div', { 'data-column': '1' }, root);
  const card1 = el('div', { 'data-place': 'column', 'data-card-id': '0' }, column1);
  const card1b = el('div', { 'data-place': 'column', 'data-card-id': '5' }, column1);
  const ghost = el('div', { 'data-mirror-of': '7' }, column1);
  const foot1 = el('div', { 'data-foot': '1' }, column1);
  const column2 = el('div', { 'data-column': '2' }, root);
  const card2 = el('div', { 'data-place': 'column', 'data-card-id': '1' }, column2);
  const cell3 = el('div', { 'data-wordcell': '3' }, root);
  const cellCard = el('div', { 'data-place': 'cell', 'data-card-id': '2' }, cell3);
  const badge = el('span', {}, cell3);
  const cell4 = el('div', { 'data-wordcell': '4' }, root);
  const tray = el('div', { 'data-band': 'tray' }, root);
  const tile = el('div', { 'data-place': 'tray', 'data-card-id': '3' }, tray);
  const trayMirror = el('div', { 'data-mirror-of': '1' }, tray);
  const trayMirrorFace = el('div', {}, trayMirror);
  const leftover = el('div', { 'data-band': 'leftover' }, root);
  const outside = new FakeEl('div');
  return {
    root,
    undo,
    undoIcon,
    redoDisabled,
    column1,
    card1,
    card1b,
    ghost,
    foot1,
    column2,
    card2,
    cell3,
    cellCard,
    badge,
    cell4,
    tile,
    trayMirror,
    trayMirrorFace,
    leftover,
    outside,
  };
}

type Timer = { cb: () => void; due: number; done: boolean };

async function setup() {
  vi.resetModules();
  navCalls.length = 0;
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
  const { overlays } = await import('../overlays.svelte');
  const { createController } = await import('./controller');

  const counts = { enter: 0, leave: 0 };
  const gate = {
    enter: () => {
      counts.enter += 1;
    },
    leave: () => {
      if (counts.enter - counts.leave === 0) throw new Error('fake gate leave() at count 0');
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

  const b = board();
  let hit: FakeEl | null = null;
  const controller = createController(gate, {
    elementFromPoint: () => hit as unknown as Element | null,
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
  return {
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
  it('AD-12 cancel(), cancel({ byBack: true }), pointercancel and lostpointercapture close an open peek with no nav call', async () => {
    const enders: ((t: Awaited<ReturnType<typeof setup>>) => void)[] = [
      (t) => t.controller.cancel(),
      (t) => t.controller.cancel({ byBack: true }),
      (t) => t.fire('pointercancel'),
      (t) => {
        t.b.cellCard.captures.clear();
        t.fire('lostpointercapture', { target: t.b.cellCard });
      },
    ];
    for (const ender of enders) {
      const t = await setup();
      t.detach();
      t.down(t.b.cellCard);
      t.overlays.openPeek(3);
      ender(t);
      expect(t.overlays.peek).toBeNull();
      expect(navCalls).toEqual([]);
      expect(t.active()).toBe(0);
    }
  });

  it('AD-12 pointerup leaves the peek to the handlers; a stale pointercancel or lostpointercapture after cancel() leaves a peek open', async () => {
    const t = await setup();
    t.detach();
    t.down(t.b.cellCard);
    t.overlays.openPeek(3);
    t.fire('pointerup', { target: t.b.cellCard });
    expect(t.overlays.peek).toBe(3);
    t.overlays.closePeek();
    t.down(t.b.cellCard);
    t.controller.cancel();
    t.overlays.openPeek(3);
    t.fire('lostpointercapture', { target: t.b.cellCard });
    t.fire('pointercancel');
    expect(t.overlays.peek).toBe(3);
    expect(t.counts).toEqual({ enter: 2, leave: 2 });
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

  it('AD-12 a drag and a non-empty WordCell long-press change nothing; an empty-WordCell long-press deselects on release', async () => {
    const t = await setup();
    t.detach();
    t.tap(t.b.card1);
    t.down(t.b.card2, { clientX: 0, clientY: 0 });
    t.fire('pointermove', { clientX: 20, clientY: 0 });
    t.fire('pointerup', { target: t.b.card2 });
    t.down(t.b.cellCard);
    t.advance(400);
    t.fire('pointerup', { target: t.b.cellCard });
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
