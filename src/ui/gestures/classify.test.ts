import { describe, expect, it } from 'vitest';
import { classify, type PressEvent, type PressState, start } from './classify';

// AD-12 classify (EXPERIENCE.md Pointer thresholds): fold events over a press, then release.
function run(state: PressState, events: readonly PressEvent[]) {
  let s = state;
  for (const event of events) {
    const next = classify(s, event);
    if (typeof next === 'string') throw new Error(`outcome ${next} before up`);
    s = next;
  }
  return { state: s, outcome: classify(s, { type: 'up' }) };
}

describe('AD-12 classify', () => {
  it('AD-12 a move of 10 px then back to 2 px releases as a drag', () => {
    const r = run(start('column', 100, 100), [
      { type: 'move', x: 110, y: 100 },
      { type: 'move', x: 102, y: 100 },
    ]);
    expect(r.state.kind).toBe('drag');
    expect(r.outcome).toBe('drag');
  });

  it('AD-12 exactly 8 px latches a drag; 7.9 px releases as a tap', () => {
    expect(run(start('column', 0, 0), [{ type: 'move', x: 8, y: 0 }]).outcome).toBe('drag');
    expect(run(start('column', 0, 0), [{ type: 'move', x: 0, y: -8 }]).outcome).toBe('drag');
    expect(run(start('column', 0, 0), [{ type: 'move', x: 7.9, y: 0 }]).outcome).toBe('tap');
    // Euclidean: 6 × 6 is 8.49 px.
    expect(run(start('column', 0, 0), [{ type: 'move', x: 6, y: 6 }]).outcome).toBe('drag');
  });

  it('AD-12 a timer on a WordCell is a long-press; a later 20 px move keeps it', () => {
    const r = run(start('wordcell', 0, 0), [{ type: 'timer' }, { type: 'move', x: 20, y: 0 }]);
    expect(r.state.kind).toBe('longPress');
    expect(r.outcome).toBe('longPress');
  });

  it('AD-12 an empty WordCell long-press then a move releases as a tap', () => {
    const r = run(start('emptyWordcell', 0, 0), [
      { type: 'timer' },
      { type: 'move', x: 20, y: 20 },
    ]);
    expect(r.state.kind).toBe('longPress');
    expect(r.outcome).toBe('tap');
  });

  it('AD-12 a column press held past 400 ms (timer fed) releases as a tap', () => {
    const r = run(start('column', 0, 0), [{ type: 'timer' }]);
    expect(r.state.kind).toBe('pending');
    expect(r.outcome).toBe('tap');
  });

  it('AD-12 a drag then the timer stays a drag', () => {
    const r = run(start('wordcell', 0, 0), [{ type: 'move', x: 10, y: 0 }, { type: 'timer' }]);
    expect(r.outcome).toBe('drag');
  });

  it('AD-12 the timer is ignored for other presses', () => {
    const r = run(start('other', 0, 0), [{ type: 'timer' }]);
    expect(r.state.kind).toBe('pending');
    expect(r.outcome).toBe('tap');
  });
});
