import { describe, expect, it, vi } from 'vitest';

// AD-13/AD-16 History notice gating with the game store, score history and nav stubbed; the real
// overlays store records the open. Fresh modules per test (module-level `shown` flag).
const mocks = vi.hoisted(() => ({
  game: { kind: 'active' as string },
  history: {
    state: { status: 'unreadable', reason: { reason: 'version-unknown', version: 2 } } as {
      status: string;
      reason?: unknown;
    },
  },
  nav: [] as string[],
}));

vi.mock('../shell/game.svelte', () => ({
  game: {
    get state() {
      return { kind: mocks.game.kind };
    },
  },
}));

vi.mock('../shell/history.svelte', () => ({
  scoreHistory: {
    get state() {
      return mocks.history.state;
    },
  },
}));

vi.mock('../shell/nav', () => ({
  nav: {
    push: () => mocks.nav.push('push'),
    pop: () => mocks.nav.push('pop'),
  },
}));

const UNREADABLE = { status: 'unreadable', reason: { reason: 'version-unknown', version: 2 } };

async function load(kind = 'active', state: { status: string; reason?: unknown } = UNREADABLE) {
  vi.resetModules();
  mocks.game.kind = kind;
  mocks.history.state = state;
  mocks.nav.length = 0;
  const notice = await import('./history-notice.svelte');
  const { overlays } = await import('./overlays.svelte');
  return { ...notice, overlays };
}

describe('AD-13 openHistoryNotice', () => {
  it('AD-13 opens once when active and unreadable; a second call after it closes does not reopen it', async () => {
    const t = await load();
    t.openHistoryNotice();
    expect(t.overlays.isOpen('historyNotice')).toBe(true);
    expect(mocks.nav).toEqual(['push']);
    t.overlays.close('historyNotice');
    t.openHistoryNotice();
    expect(t.overlays.isOpen('historyNotice')).toBe(false);
    expect(mocks.nav).toEqual(['push', 'pop']);
  });

  it('AD-13 does not open while the store is rejected or halted', async () => {
    for (const kind of ['rejected', 'halted', 'booting']) {
      const t = await load(kind);
      t.openHistoryNotice();
      expect(t.overlays.depth).toBe(0);
      expect(mocks.nav).toEqual([]);
    }
  });

  it('AD-13 does not open while the history is readable', async () => {
    const t = await load('active', { status: 'ok' });
    t.openHistoryNotice();
    expect(t.overlays.depth).toBe(0);
    expect(t.noticeReason()).toBeUndefined();
  });

  it('AD-13 after a rejected-store call, opens once the store is active (deferred push)', async () => {
    const t = await load('rejected');
    t.openHistoryNotice();
    expect(t.overlays.depth).toBe(0);
    mocks.game.kind = 'active';
    t.openHistoryNotice();
    expect(t.overlays.isOpen('historyNotice')).toBe(true);
  });

  it('AD-13 noticeReason() keeps the reason captured at open after the history flips to ok', async () => {
    const t = await load();
    expect(t.noticeReason()).toBeUndefined();
    t.openHistoryNotice();
    mocks.history.state = { status: 'ok' };
    expect(t.noticeReason()).toEqual({ reason: 'version-unknown', version: 2 });
  });
});
