import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { GameView } from '../engine/index';
import { createFocusFollow } from './focus-follow';

// Ticket 6.11 (EXPERIENCE.md Focus): the recover and phase branches of `sync`. The unit environment
// is node, so `document` and `HTMLElement` are minimal fakes that answer the selectors
// focus-follow.ts and focus-board.ts use. The first `sync` follows only a restore into Composing or
// Place; `attach` tracks the focused item.
class FakeEl {
  isConnected = true;
  focused = false;
  inDialog = false;
  constructor(
    readonly dataset: Record<string, string> = {},
    private readonly doc?: { active: FakeEl | null },
  ) {}
  closest(): FakeEl | null {
    return this.inDialog ? this : null;
  }
  focus(): void {
    this.focused = true;
    if (this.doc !== undefined) this.doc.active = this;
  }
}

const VIEW = { status: 'playing', phase: 'composing' } as unknown as GameView;
const IDLE = { status: 'playing', phase: 'idle' } as unknown as GameView;
const PLACE = { status: 'playing', phase: 'place' } as unknown as GameView;
const OVER = { status: 'won', phase: 'idle' } as unknown as GameView;

function setup(ids: number[], first: GameView = VIEW, strip: number[] = []) {
  const state = { active: null as FakeEl | null };
  const body = new FakeEl();
  const main = new FakeEl({}, state);
  const tiles = new Map(
    ids.map((id) => [id, new FakeEl({ cardId: String(id), place: 'tray' }, state)]),
  );
  const cards = strip.map((id) => new FakeEl({ cardId: String(id), place: 'strip' }, state));
  let live = [...tiles.values()];
  let focusin: ((event: { target: FakeEl }) => void) | undefined;
  state.active = body;
  const doc = {
    body,
    get activeElement() {
      return state.active;
    },
    addEventListener: (_type: string, fn: typeof focusin) => {
      focusin = fn;
    },
    removeEventListener: () => {},
    querySelectorAll: (selector: string) =>
      selector === '[data-card-id][data-place="tray"]' ? live : [],
    querySelector: (selector: string) => {
      if (selector === 'main') return main;
      if (selector === '[data-card-id][data-place="tray"]') return live[0] ?? null;
      if (selector === '[data-card-id][data-place="strip"]') return cards[0] ?? null;
      const id = /\[data-card-id="(\d+)"\]/.exec(selector)?.[1];
      return live.find((el) => el.dataset.cardId === id) ?? null;
    },
  };
  vi.stubGlobal('HTMLElement', FakeEl);
  vi.stubGlobal('document', doc);
  const follow = createFocusFollow();
  follow.sync(first);
  follow.attach();
  return {
    follow,
    main,
    body,
    tiles,
    cards,
    focus(id: number): void {
      const el = tiles.get(id) as FakeEl;
      el.focus();
      focusin?.({ target: el });
    },
    /** Removes the tile from the DOM and drops focus to the body, as a removed focused node does. */
    remove(id: number): void {
      const el = tiles.get(id) as FakeEl;
      el.isConnected = false;
      live = live.filter((entry) => entry !== el);
      state.active = body;
    },
    focused: () => state.active,
    /** Puts focus on an element inside a dialog (a surface owns focus). */
    surface(): FakeEl {
      const el = new FakeEl({}, state);
      el.inDialog = true;
      el.focus();
      return el;
    },
  };
}

beforeEach(() => vi.unstubAllGlobals());
afterEach(() => vi.unstubAllGlobals());

describe('AD-14 focus-follow recover', () => {
  it('AD-14 a disconnected tracked tile hands focus to its next sibling in the region', () => {
    const s = setup([1, 2, 3]);
    s.focus(2);
    s.remove(2);
    s.follow.sync(VIEW);
    expect(s.focused()).toBe(s.tiles.get(3));
  });

  it('AD-14 a disconnected last tile hands focus to the region first tile', () => {
    const s = setup([1, 2, 3]);
    s.focus(3);
    s.remove(3);
    s.follow.sync(VIEW);
    expect(s.focused()).toBe(s.tiles.get(1));
  });

  it('AD-14 a disconnected tile with the region empty hands focus to the board', () => {
    const s = setup([1]);
    s.focus(1);
    s.remove(1);
    s.follow.sync(VIEW);
    expect(s.focused()).toBe(s.main);
  });

  it('AD-14 a connected tracked tile, or focus already elsewhere, is left alone', () => {
    const s = setup([1, 2, 3]);
    s.focus(2);
    s.follow.sync(VIEW);
    expect(s.focused()).toBe(s.tiles.get(2));
    s.remove(2);
    s.focus(1);
    s.follow.sync(VIEW);
    expect(s.focused()).toBe(s.tiles.get(1));
  });
});

describe('AD-14 focus-follow phase', () => {
  it('AD-14 the first sync of a restore into Composing focuses the first tile', () => {
    const s = setup([1, 2]);
    expect(s.focused()).toBe(s.tiles.get(1));
  });

  it('AD-14 the first sync of a restore into Place focuses the first strip card', () => {
    const s = setup([], PLACE, [7, 8]);
    expect(s.focused()).toBe(s.cards[0]);
  });

  it('AD-14 the first Idle paint and a restored Game over move no focus', () => {
    const idle = setup([1], IDLE);
    expect(idle.focused()).toBe(idle.body);
    const over = setup([1], OVER);
    expect(over.focused()).toBe(over.body);
  });

  it('AD-14 the first sync leaves focus alone while a surface owns it', () => {
    const state = setup([1], IDLE);
    const dialog = state.surface();
    const follow = createFocusFollow();
    follow.sync(VIEW);
    expect(state.focused()).toBe(dialog);
  });

  it('AD-14 a phase change focuses the first tile, and leaves focus alone while a surface owns it', () => {
    const s = setup([1, 2], IDLE);
    s.follow.sync(VIEW);
    expect(s.focused()).toBe(s.tiles.get(1));
    s.follow.sync(IDLE);
    const dialog = s.surface();
    s.follow.sync(VIEW);
    expect(s.focused()).toBe(dialog);
  });

  it('AD-14 a disconnected column card hands focus to its next column sibling', () => {
    const state = { active: null as FakeEl | null };
    const body = new FakeEl();
    const column = { dataset: { column: '2' } };
    const make = (id: number) => {
      const el = new FakeEl({ cardId: String(id), place: 'column' }, state);
      el.closest = () => column as unknown as FakeEl;
      return el;
    };
    const a = make(20);
    const b = make(21);
    let live = [a, b];
    let focusin: ((event: { target: FakeEl }) => void) | undefined;
    state.active = body;
    vi.stubGlobal('HTMLElement', FakeEl);
    vi.stubGlobal('document', {
      body,
      get activeElement() {
        return state.active;
      },
      addEventListener: (_type: string, fn: typeof focusin) => {
        focusin = fn;
      },
      removeEventListener: () => {},
      querySelectorAll: (selector: string) =>
        selector === '[data-column="2"] [data-card-id][data-place="column"]' ? live : [],
      querySelector: (selector: string) =>
        live.find((el) => selector === `[data-card-id="${el.dataset.cardId}"]`) ?? null,
    });
    const follow = createFocusFollow();
    follow.sync(IDLE);
    follow.attach();
    a.focus();
    focusin?.({ target: a });
    a.isConnected = false;
    live = [b];
    state.active = body;
    follow.sync(IDLE);
    expect(state.active).toBe(b);
  });
});
