// AD-9 passive visible-time clock: no listeners; callers pass `performance.now()` as `now`.
// Starts paused. `carry` holds flushed-but-untaken ms, including the fraction `take` keeps.

let running = false;
let startedAt = 0;
let carry = 0;

function unflushed(now: number): number {
  return carry + (running ? now - startedAt : 0);
}

export function resume(now: number): void {
  if (running) return;
  running = true;
  startedAt = now;
}

export function pause(now: number): void {
  if (!running) return;
  carry += now - startedAt;
  running = false;
}

export function take(now: number): number {
  const total = unflushed(now);
  const ms = Math.floor(total);
  carry = total - ms;
  if (running) startedAt = now;
  return ms;
}

export function peek(now: number): number {
  return Math.floor(unflushed(now));
}
