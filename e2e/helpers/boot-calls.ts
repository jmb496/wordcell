import type { Page } from '@playwright/test';

// Epic 7 CAP-3 boot-call recorder (AD-16, AD-7): an init script, on this page only (never the
// context), that wraps `ServiceWorkerContainer.prototype.register` and
// `StorageManager.prototype.persisted`/`persist` and logs each call in order: `register`, the
// original `register` promise's settle (`then(onFulfil, onReject)`, never an unhandled rejection),
// `persisted` (stubbed to resolve false) and `persist` (called through). Every entry carries
// `dictionaryState()` read when it is pushed, only when `window.__wordcell` exists then (no key
// otherwise, so it also runs on the hook-free `dist/`). With `holdRegister`, `register` returns a
// promise settling as the original did only once `releaseRegister` has been called. The log is
// per document: a navigation starts a fresh one.
export type BootCall = NonNullable<Window['__wordcellBootCalls']>[number];

const armed = new WeakMap<Page, { holdRegister: boolean }>();

export async function recordBootCalls(
  page: Page,
  options: { holdRegister?: boolean } = {},
): Promise<void> {
  if (armed.has(page)) throw new Error('recordBootCalls: already armed on this page');
  const holdRegister = options.holdRegister === true;
  // Sent to the page as source: everything it uses comes in through `hold`.
  await page.addInitScript((hold) => {
    type Call = NonNullable<Window['__wordcellBootCalls']>[number];
    const calls: Call[] = [];
    window.__wordcellBootCalls = calls;
    const push = (event: Call['event'], outcome?: Call['outcome']): void => {
      const call: Call = { event };
      if (outcome !== undefined) call.outcome = outcome;
      const hook = window.__wordcell;
      if (hook !== undefined) call.dictionary = hook.dictionaryState();
      calls.push(call);
    };
    let release = (): void => {};
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    if (hold) window.__wordcellBootRelease = () => release();
    const container = ServiceWorkerContainer.prototype;
    const register = container.register;
    container.register = function (
      this: ServiceWorkerContainer,
      ...args: Parameters<ServiceWorkerContainer['register']>
    ): Promise<ServiceWorkerRegistration> {
      push('register');
      const original = register.apply(this, args);
      original.then(
        () => push('register-settled', 'fulfilled'),
        () => push('register-settled', 'rejected'),
      );
      return hold ? gate.then(() => original) : original;
    };
    const storage = StorageManager.prototype;
    const persist = storage.persist;
    storage.persisted = (): Promise<boolean> => {
      push('persisted');
      return Promise.resolve(false);
    };
    storage.persist = function (this: StorageManager): Promise<boolean> {
      push('persist');
      return persist.call(this);
    };
  }, holdRegister);
  armed.set(page, { holdRegister });
}

export async function bootCalls(page: Page): Promise<BootCall[]> {
  if (!armed.has(page)) throw new Error('bootCalls: recordBootCalls was not called on this page');
  return page.evaluate(() => {
    const calls = window.__wordcellBootCalls;
    if (calls === undefined) throw new Error('bootCalls: no boot-call log in this document');
    return calls;
  });
}

export async function releaseRegister(page: Page): Promise<void> {
  if (armed.get(page)?.holdRegister !== true) {
    throw new Error(
      'releaseRegister: recordBootCalls was not called with holdRegister on this page',
    );
  }
  await page.evaluate(() => {
    const release = window.__wordcellBootRelease;
    if (release === undefined)
      throw new Error('releaseRegister: no held register in this document');
    release();
  });
}
