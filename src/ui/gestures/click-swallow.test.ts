import { describe, expect, it } from 'vitest';
import { createClickSwallower, SWALLOW_MS } from './click-swallow';

// AD-12 click swallower in node (build-notes CAP-9): an injected `EventTarget` stands for the
// controller's attach root and fake timers for its setTimer/clearTimer (as in gate.test.ts). A
// click "reaches its handler" when it was dispatched with propagation not stopped: a handler on a
// descendant of the root never sees a click the root's capture listener stopped.
function setup() {
  const timers = new Map<number, { fn: () => void; ms: number }>();
  let nextHandle = 1;
  const cleared: number[] = [];
  const swallower = createClickSwallower<number>({
    setTimer: (fn, ms) => {
      const handle = nextHandle++;
      timers.set(handle, { fn, ms });
      return handle;
    },
    clearTimer: (handle) => {
      cleared.push(handle);
      timers.delete(handle);
    },
  });
  const root = new EventTarget();
  const listeners = { added: 0, removed: 0 };
  const add = root.addEventListener.bind(root);
  const remove = root.removeEventListener.bind(root);
  root.addEventListener = (type, fn, options) => {
    expect(type).toBe('click');
    expect(options).toEqual({ capture: true });
    listeners.added += 1;
    add(type, fn, options);
  };
  root.removeEventListener = (type, fn, options) => {
    expect(options).toEqual({ capture: true });
    listeners.removed += 1;
    remove(type, fn, options);
  };
  // Dispatches a click with `detail`; returns whether it reached the handler and was not prevented.
  const click = (detail: number) => {
    const event = new CustomEvent('click', { detail, cancelable: true });
    root.dispatchEvent(event);
    return { reached: !event.cancelBubble, prevented: event.defaultPrevented };
  };
  // Fires every pending timer (the expiry).
  const elapse = () => {
    const due = [...timers.values()];
    timers.clear();
    for (const t of due) t.fn();
  };
  return { swallower, root, timers, cleared, listeners, click, elapse };
}

describe('AD-12 sticky-view trailing click swallower', () => {
  it('AD-12 a trailing click is swallowed (stopPropagation, preventDefault) then a later click reaches its handler', () => {
    const t = setup();
    t.swallower.arm(t.root);
    expect(t.click(1)).toEqual({ reached: false, prevented: true });
    expect(t.click(1)).toEqual({ reached: true, prevented: false });
    expect(t.listeners).toEqual({ added: 1, removed: 1 });
    expect(t.timers.size).toBe(0);
  });

  it('AD-12 the 300 ms expiry disarms it', () => {
    const t = setup();
    t.swallower.arm(t.root);
    expect([...t.timers.values()].map((x) => x.ms)).toEqual([SWALLOW_MS]);
    expect(SWALLOW_MS).toBe(300);
    t.elapse();
    expect(t.listeners).toEqual({ added: 1, removed: 1 });
    expect(t.click(1)).toEqual({ reached: true, prevented: false });
  });

  it('AD-12 a detail-0 click passes and keeps it armed', () => {
    const t = setup();
    t.swallower.arm(t.root);
    expect(t.click(0)).toEqual({ reached: true, prevented: false });
    expect(t.listeners).toEqual({ added: 1, removed: 0 });
    expect(t.timers.size).toBe(1);
    expect(t.click(2)).toEqual({ reached: false, prevented: true });
  });

  it('AD-12 disarm removes listener and timer; a second disarm and re-arm are safe', () => {
    const t = setup();
    t.swallower.arm(t.root);
    t.swallower.disarm();
    expect(t.listeners).toEqual({ added: 1, removed: 1 });
    expect(t.cleared).toEqual([1]);
    expect(t.timers.size).toBe(0);
    expect(t.click(1)).toEqual({ reached: true, prevented: false });
    t.swallower.disarm();
    expect(t.listeners.removed).toBe(1);
    t.swallower.arm(t.root);
    t.swallower.arm(t.root);
    expect(t.listeners).toEqual({ added: 3, removed: 2 });
    expect(t.timers.size).toBe(1);
    expect(t.click(1)).toEqual({ reached: false, prevented: true });
    expect(t.click(1)).toEqual({ reached: true, prevented: false });
  });
});
