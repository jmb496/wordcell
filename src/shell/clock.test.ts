import { beforeEach, describe, expect, it, vi } from 'vitest';

type Clock = typeof import('./clock');
let clock: Clock;

beforeEach(async () => {
  vi.resetModules();
  clock = await import('./clock');
});

describe('clock.ts', () => {
  it('AD-9 take before any resume returns 0 (the clock starts paused)', () => {
    expect(clock.take(1000)).toBe(0);
    expect(clock.peek(2000)).toBe(0);
  });

  it('AD-9 from resume(0), take floors and carries the fraction across takes', () => {
    clock.resume(0);
    expect(clock.take(10.5)).toBe(10);
    expect(clock.take(20.25)).toBe(10);
    expect(clock.take(20.75)).toBe(0);
    expect(clock.take(21.5)).toBe(1);
  });

  it('AD-9 peek floors the unflushed ms without consuming it', () => {
    clock.resume(0);
    expect(clock.peek(7.5)).toBe(7);
    expect(clock.peek(9.75)).toBe(9);
    expect(clock.take(10.5)).toBe(10);
    expect(clock.peek(10.5)).toBe(0);
    expect(clock.peek(11)).toBe(1);
  });

  it('AD-9 resume while running and pause while paused are no-ops', () => {
    clock.pause(5);
    clock.resume(10);
    clock.resume(50);
    expect(clock.take(60)).toBe(50);
    clock.pause(70);
    clock.pause(90);
    expect(clock.take(100)).toBe(10);
  });

  it('AD-9 paused time is not counted: resume(0), pause(10), take(100) = 10, resume(200), take(205) = 5', () => {
    clock.resume(0);
    clock.pause(10);
    expect(clock.take(100)).toBe(10);
    clock.resume(200);
    expect(clock.take(205)).toBe(5);
  });
});
