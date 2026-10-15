// AD-13 History API adapter: the only History API and `popstate` user (AD-1). Holds no id stack,
// only the launch id and depth arithmetic. `launch()` (awaited first at boot, AD-16) rewinds to
// the base entry and stamps it `{ wc: 0, launch }`; `register()` takes the overlays' close
// callback and depth getter; `push()` / `pop()` are queued so a pop's `popstate` settles before
// the next push. `count` is the wc of the current entry as nav knows it: each push sends
// `{ wc: count + 1, launch }`. A `popstate` nav did not start is a back (close callback) or a
// Forward (corrected with `go`, closes nothing), each preceded by the `registerBeforeBack` hook
// (R1/F7); a stale launch's entry is ignored (A-E1).
import { newSeed } from './seed';

export interface NavCallbacks {
  /** Closes every entry deeper than `depth`, topmost first; never calls nav. */
  readonly closedByBack: (depth: number) => void;
  /** The number of open entries. */
  readonly depth: () => number;
}

type Op = 'push' | 'pop';

const REWIND_MS = 250;

let launchId: number | undefined;
let count = 0;
let pending = 0;
const queue: Op[] = [];
let callbacks: NavCallbacks | undefined;
let beforeBack: (() => void) | undefined;
let ready = false;
let failed = false;
let rewound: (() => void) | undefined;
const settleWaiters: (() => void)[] = [];

function stateOf(value: unknown): { launch?: unknown; wc?: unknown } | undefined {
  return typeof value === 'object' && value !== null ? value : undefined;
}

function settled(): boolean {
  return pending === 0 && queue.length === 0;
}

function drain(): void {
  while (ready && pending === 0 && queue.length > 0) {
    const op = queue.shift();
    if (op === 'push') {
      count += 1;
      history.pushState({ wc: count, launch: launchId }, '');
    } else {
      pending += 1;
      history.back();
    }
  }
  // One at a time: a waiter that closes an entry queues a pop, which the next waiter then waits for.
  while (settled() && settleWaiters.length > 0) settleWaiters.shift()?.();
}

function finish(): void {
  history.replaceState({ wc: 0, launch: launchId }, '');
  count = 0;
  ready = true;
  drain();
}

function onPopState(event: PopStateEvent): void {
  if (failed) return;
  if (rewound !== undefined) {
    // The launch rewind's own popstate: exempt from the stale-launch check.
    rewound();
    return;
  }
  const state = stateOf(event.state);
  const current = state !== undefined && state.launch === launchId;
  const wc = state?.wc;
  if (pending > 0) {
    // nav's own pop or Forward correction: settles the queue, closes nothing.
    pending -= 1;
    if (current && typeof wc === 'number') count = wc;
    drain();
    return;
  }
  if (!current) return;
  if (typeof wc !== 'number') return;
  // R1/F7: the before-back hook (the pointer controller's cancel) runs first for every back nav
  // did not start, before the Forward check and the close callback.
  beforeBack?.();
  if (callbacks === undefined) throw new Error('AD-13 back before register()');
  count = wc;
  const depth = callbacks.depth();
  if (wc > depth) {
    // Forward: return to the entry matching the open depth; nothing closes.
    pending += 1;
    history.go(-(wc - depth));
    return;
  }
  callbacks.closedByBack(wc);
}

/** AD-13/AD-16: rewinds to the base entry and stamps it; rejects if the rewind never settles. */
function launch(): Promise<void> {
  if (launchId !== undefined) throw new Error('AD-13 launch() called twice');
  launchId = newSeed();
  window.addEventListener('popstate', onPopState);
  const d = stateOf(history.state)?.wc;
  if (typeof d !== 'number' || !Number.isInteger(d) || d <= 0) {
    finish();
    return Promise.resolve();
  }
  return new Promise((resolve, reject) => {
    // A plain timer (requestAnimationFrame does not fire while hidden); no throw inside it.
    const timer = setTimeout(() => {
      failed = true;
      rewound = undefined;
      reject(new Error(`AD-13 launch rewind: no popstate within ${REWIND_MS} ms`));
    }, REWIND_MS);
    rewound = () => {
      clearTimeout(timer);
      rewound = undefined;
      finish();
      resolve();
    };
    history.go(-d);
  });
}

/** AD-13: called once by `main.ts` after `launch()` resolves, before any push. */
function register(next: NavCallbacks): void {
  if (!ready) throw new Error('AD-13 register() before launch() resolved');
  if (callbacks !== undefined) throw new Error('AD-13 register() called twice');
  callbacks = next;
}

/** AD-13 R1/F7: called once by `main.ts` after `launch()` resolves; separate from `register()`. */
function registerBeforeBack(fn: () => void): void {
  if (!ready) throw new Error('AD-13 registerBeforeBack() before launch() resolved');
  if (beforeBack !== undefined) throw new Error('AD-13 registerBeforeBack() called twice');
  beforeBack = fn;
}

function enqueue(op: Op): void {
  if (callbacks === undefined) throw new Error(`AD-13 ${op}() before register()`);
  queue.push(op);
  drain();
}

/** AD-13: pushes one entry `{ wc: count + 1, launch }` once no pop is pending. */
function push(): void {
  enqueue('push');
}

/** AD-13: goes back one entry; called only by `overlays.close`. */
function pop(): void {
  enqueue('pop');
}

/** AD-13: runs `fn` at once when no pop is pending, else when the queue next settles (epic 6 CAP-10). */
function whenSettled(fn: () => void): void {
  if (settled()) fn();
  else settleWaiters.push(fn);
}

export const nav = { launch, register, registerBeforeBack, push, pop, settled, whenSettled };
