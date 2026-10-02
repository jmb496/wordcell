import { describe, expect, it } from 'vitest';
import { createGate } from './gate';

// AD-11 gate on a fake frame queue and fake timers (build-notes CAP-3, A-A9).
function setup() {
  const frames: (() => void)[] = [];
  const timers = new Map<number, { fn: () => void; ms: number }>();
  let nextHandle = 1;
  const gate = createGate<number>({
    raf: (fn) => frames.push(fn),
    setTimer: (fn, ms) => {
      const handle = nextHandle++;
      timers.set(handle, { fn, ms });
      return handle;
    },
    clearTimer: (handle) => {
      timers.delete(handle);
    },
  });
  // Runs the frames requested so far (not those requested while they run).
  const frame = () => {
    for (const fn of frames.splice(0)) fn();
  };
  // Fires every armed timer (the 150 ms quiet point).
  const elapse = () => {
    const due = [...timers.values()];
    timers.clear();
    for (const t of due) t.fn();
  };
  const log: string[] = [];
  const work = (name: string, then?: () => void) => () => {
    log.push(name);
    then?.();
  };
  return { gate, frames, timers, frame, elapse, log, work };
}

describe('AD-11 gate pending work in the next idle frame, scroll busy until scrollend, hide or 150 ms', () => {
  it('AD-11 idle work runs in the next frame, FIFO, not synchronously', () => {
    const { gate, frame, log, work } = setup();
    expect(gate.busy).toBe(false);
    gate.whenIdle(work('a'));
    gate.whenIdle(work('b'));
    expect(log).toEqual([]);
    frame();
    expect(log).toEqual(['a', 'b']);
    frame();
    expect(log).toEqual(['a', 'b']);
  });

  it('AD-11 enter holds work; leave to 0 requests a frame that runs it', () => {
    const { gate, frames, frame, log, work } = setup();
    gate.enter();
    gate.enter();
    expect(gate.busy).toBe(true);
    gate.whenIdle(work('a'));
    frame();
    expect(log).toEqual([]);
    gate.leave();
    expect(gate.busy).toBe(true);
    expect(frames).toHaveLength(0);
    frame();
    expect(log).toEqual([]);
    gate.leave();
    expect(gate.busy).toBe(false);
    expect(frames).toHaveLength(1);
    frame();
    expect(log).toEqual(['a']);
  });

  it('AD-11 leave() at count 0 throws (rule 6)', () => {
    const { gate } = setup();
    expect(() => gate.leave()).toThrow('AD-11 gate leave() at count 0');
    gate.enter();
    gate.leave();
    expect(() => gate.leave()).toThrow();
  });

  it('AD-11 scroll is busy until scrollEnd, which releases queued work', () => {
    const { gate, frame, timers, log, work } = setup();
    gate.scroll();
    expect(gate.busy).toBe(true);
    gate.whenIdle(work('a'));
    frame();
    expect(log).toEqual([]);
    gate.scrollEnd();
    expect(gate.busy).toBe(false);
    expect(timers.size).toBe(0);
    frame();
    expect(log).toEqual(['a']);
  });

  it('AD-11 the 150 ms quiet timer ends scroll-busy and releases queued work', () => {
    const { gate, frame, timers, elapse, log, work } = setup();
    gate.scroll();
    expect([...timers.values()].map((t) => t.ms)).toEqual([150]);
    gate.whenIdle(work('a'));
    frame();
    elapse();
    expect(gate.busy).toBe(false);
    frame();
    expect(log).toEqual(['a']);
  });

  it('AD-11 each scroll re-arms the quiet timer', () => {
    const { gate, timers } = setup();
    gate.scroll();
    const [first] = [...timers.keys()];
    gate.scroll();
    expect(timers.size).toBe(1);
    expect([...timers.keys()]).not.toContain(first);
    gate.scroll();
    expect(timers.size).toBe(1);
  });

  it('AD-11 scrollReset (hide) ends scroll-busy, clears the timer and releases queued work', () => {
    const { gate, frame, timers, log, work } = setup();
    gate.scroll();
    gate.whenIdle(work('a'));
    frame();
    gate.scrollReset();
    expect(gate.busy).toBe(false);
    expect(timers.size).toBe(0);
    frame();
    expect(log).toEqual(['a']);
  });

  it('AD-11 scrollReset also clears the own-write ignore flag', () => {
    const { gate } = setup();
    gate.ignoreNextScroll();
    gate.scrollReset();
    gate.scroll();
    expect(gate.busy).toBe(true);
  });

  it('AD-11 leave to 0 while scroll-busy runs no work until the scroll ends', () => {
    const { gate, frames, frame, log, work } = setup();
    gate.enter();
    gate.scroll();
    gate.whenIdle(work('a'));
    frame();
    gate.leave();
    expect(gate.busy).toBe(true);
    expect(frames).toHaveLength(0);
    frame();
    expect(log).toEqual([]);
    gate.scrollEnd();
    frame();
    expect(log).toEqual(['a']);
  });

  it('AD-11 own write: scroll after ignoreNextScroll is not busy; the next frame clears the flag with an empty queue', () => {
    const { gate, frames, frame, timers } = setup();
    gate.ignoreNextScroll();
    expect(frames).toHaveLength(1);
    gate.scroll();
    gate.scroll();
    expect(gate.busy).toBe(false);
    expect(timers.size).toBe(0);
    frame();
    gate.scroll();
    expect(gate.busy).toBe(true);
  });

  it('AD-11 the own-write flag clears in a frame even when no scroll fired', () => {
    const { gate, frame } = setup();
    gate.ignoreNextScroll();
    frame();
    gate.scroll();
    expect(gate.busy).toBe(true);
  });

  it('AD-11 at most one frame is outstanding', () => {
    const { gate, frames, frame, work } = setup();
    gate.whenIdle(work('a'));
    gate.whenIdle(work('b'));
    gate.ignoreNextScroll();
    gate.enter();
    gate.leave();
    gate.scroll();
    gate.scrollEnd();
    gate.scrollReset();
    expect(frames).toHaveLength(1);
    frame();
    expect(frames).toHaveLength(0);
    gate.whenIdle(work('c'));
    expect(frames).toHaveLength(1);
  });

  it('AD-11 a fn that makes the gate busy returns the rest to the queue head in order', () => {
    const { gate, frame, log, work } = setup();
    gate.whenIdle(work('a', () => gate.enter()));
    gate.whenIdle(work('b'));
    gate.whenIdle(work('c'));
    frame();
    expect(log).toEqual(['a']);
    gate.whenIdle(work('d'));
    frame();
    expect(log).toEqual(['a']);
    gate.leave();
    frame();
    expect(log).toEqual(['a', 'b', 'c', 'd']);
  });

  it('AD-11 work queued during a flush waits for the next idle frame', () => {
    const { gate, frames, frame, log, work } = setup();
    gate.whenIdle(work('a', () => gate.whenIdle(work('b'))));
    frame();
    expect(log).toEqual(['a']);
    expect(frames).toHaveLength(1);
    frame();
    expect(log).toEqual(['a', 'b']);
  });

  it('AD-11 transitions to idle with an empty queue request no frame', () => {
    const { gate, frames } = setup();
    gate.enter();
    gate.leave();
    gate.scroll();
    gate.scrollEnd();
    gate.scroll();
    gate.scrollReset();
    expect(frames).toHaveLength(0);
  });
});
