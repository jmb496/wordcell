import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { GameView } from '../engine/index';
import { createFocusFollow } from './focus-follow';

// Ticket 6.11 (EXPERIENCE.md Focus): the recover branch of `sync`. The unit environment is node, so
// `document` and `HTMLElement` are minimal fakes that answer the selectors focus-follow.ts and
// focus-board.ts use. The first `sync` only records the phase; `attach` tracks the focused item.
class FakeEl {
  isConnected = true;
  focused = false;
  constructor(
    readonly dataset: Record<string, string> = {},
    private readonly doc?: { active: FakeEl | null },
  ) {}
  closest(): null {
    return null;
  }
  focus(): void {
    this.focused = true;
    if (this.doc !== undefined) this.doc.active = this;
  }
}

const VIEW = { status: 'playing', phase: 'composing' } as unknown as GameView;

function setup(ids: number[]) {
  const state = { active: null as FakeEl | null };
  const body = new FakeEl();
  const main = new FakeEl({}, state);
  const tiles = new Map(
    ids.map((id) => [id, new FakeEl({ cardId: String(id), place: 'tray' }, state)]),
  );
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
      const id = /\[data-card-id="(\d+)"\]/.exec(selector)?.[1];
      return live.find((el) => el.dataset.cardId === id) ?? null;
    },
  };
  vi.stubGlobal('HTMLElement', FakeEl);
  vi.stubGlobal('document', doc);
  const follow = createFocusFollow();
  follow.sync(VIEW);
  follow.attach();
  return {
    follow,
    main,
    tiles,
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
