// AD-16 worker registration (epic 7 SPEC CAP-1, F2): the dynamic chunk `main.ts` imports after the
// dictionary settles; the only importer of `workbox-window`. No prompt, no skip-waiting message,
// no reload on `controlling`: a waiting worker activates once every window has closed. The state
// is recomputed from the registration's slots after `register()` resolves (workers present before
// this chunk loaded included), on every `updatefound` (this module's own listener: `Workbox` drops
// its listener after an update it judges external) and on every observed worker's `statechange`.
// Q-40 failures (CAP-1, F5): an absent `navigator.serviceWorker`, a `register()` rejecting or
// resolving `undefined`, and a worker turning redundant before it was seen `activated` with no newer worker in any slot
// set the sticky `failed`; the attempt still resolves. Anything else (a throwing `Workbox`
// constructor, a throwing listener) reaches AD-15 (rule 6).
import { Workbox } from 'workbox-window';
import { setSwState, swState } from './sw-state';

// Q-40: the transition into `failed` is reported once per launch, only in hook builds (`sw.ts`
// never loads in dev, F3); production stays silent.
function fail(reason: string, cause?: unknown): void {
  if (swState() === 'failed') return;
  setSwState('failed');
  if (import.meta.env.VITE_TEST_HOOKS === '1') {
    reportError(new Error(`Q-40 ${reason}`, cause === undefined ? undefined : { cause }));
  }
}

/**
 * The registration attempt: resolves, after setting `failed` on a Q-40 failure; any other throw
 * (e.g. the `Workbox` constructor's) rejects it (rule 6).
 */
export async function registerWorker(): Promise<void> {
  // F5: before construction, since the `Workbox` constructor listens on the container.
  if (navigator.serviceWorker === undefined) {
    fail('navigator.serviceWorker is absent');
    return;
  }
  const workbox = new Workbox('/sw.js', { scope: '/' });
  let registration: ServiceWorkerRegistration | undefined;
  try {
    registration = await workbox.register();
  } catch (cause) {
    fail('Workbox.register() rejected', cause);
    return;
  }
  if (registration === undefined) {
    fail('Workbox.register() resolved no registration');
    return;
  }
  const slots = registration;
  // Every worker observed this launch, in first-seen order (one `statechange` listener each),
  // those any observation saw `activated`, and those already judged once seen `redundant`.
  const seen = new Map<ServiceWorker, number>();
  const reached = new WeakSet<ServiceWorker>();
  const judged = new WeakSet<ServiceWorker>();
  const recompute = (): void => {
    const { installing, waiting, active } = slots;
    // Within one slot read, first-seen order is active, then waiting, then installing.
    let newestLive = -1;
    for (const worker of [active, waiting, installing]) {
      if (worker === null) continue;
      let order = seen.get(worker);
      if (order === undefined) {
        order = seen.size;
        seen.set(worker, order);
        worker.addEventListener('statechange', recompute);
      }
      if (worker.state !== 'redundant') newestLive = Math.max(newestLive, order);
    }
    for (const worker of seen.keys()) {
      if (worker.state === 'activated') reached.add(worker);
    }
    // Every seen worker is judged once, at the first recompute that sees it `redundant`, also
    // one that left its slot before turning redundant.
    for (const [worker, order] of seen) {
      if (worker.state !== 'redundant' || judged.has(worker)) continue;
      judged.add(worker);
      if (!reached.has(worker) && newestLive < order) {
        fail(`a service worker turned redundant before it activated (${worker.scriptURL})`);
      }
    }
    setSwState(
      waiting !== null
        ? 'waiting'
        : installing !== null
          ? 'installing'
          : active !== null
            ? 'active'
            : 'unregistered',
    );
  };
  // Attached before the first slot read, so no update found from here on is missed.
  registration.addEventListener('updatefound', recompute);
  recompute();
}
