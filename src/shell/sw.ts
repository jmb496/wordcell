// AD-16 worker registration (epic 7 SPEC CAP-1, F2): the dynamic chunk `main.ts` imports after the
// dictionary settles; the only importer of `workbox-window`. No prompt, no skip-waiting message,
// no reload on `controlling`: a waiting worker activates once every window has closed. The state
// is recomputed from the registration's slots after `register()` resolves (workers present before
// this chunk loaded included), on every `updatefound` (this module's own listener: `Workbox` drops
// its listener after an update it judges external) and on every slot worker's `statechange`.
import { Workbox } from 'workbox-window';
import { setSwState } from './sw-state';

/** The registration attempt: resolves once `register()` resolves (a rejection reaches AD-15). */
export async function registerWorker(): Promise<void> {
  const registration = await new Workbox('/sw.js', { scope: '/' }).register();
  if (registration === undefined) {
    throw new Error('AD-16 Workbox.register() resolved no registration');
  }
  // One `statechange` listener per worker, also when a worker seen here fires `updatefound` too.
  const listened = new WeakSet<ServiceWorker>();
  const recompute = (): void => {
    const { installing, waiting, active } = registration;
    for (const worker of [installing, waiting, active]) {
      if (worker === null || listened.has(worker)) continue;
      listened.add(worker);
      worker.addEventListener('statechange', recompute);
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
