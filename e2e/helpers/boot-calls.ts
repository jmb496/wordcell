import type { Page } from '@playwright/test';

// Epic 7 CAP-3 boot-call recorder (AD-16, AD-7): an init script, on this page only (never the
// context), that wraps `ServiceWorkerContainer.prototype.register` and
// `StorageManager.prototype.persisted`/`persist` and logs each call in order: `register`, the
// original `register` promise's settle (`then(onFulfil, onReject)`, never an unhandled rejection),
// `persisted` (stubbed to resolve false) and `persist` (called through). Every entry carries
// `dictionaryState()` read when it is pushed, only when `window.__wordcell` exists then (no key
// otherwise, so it also runs on the hook-free `dist/`). With `holdRegister`, `register` returns a
// promise settling as the original did only once `releaseRegister` has been called. With
// `holdListText`, `Response.prototype.text` on a word-list response (pathname matching
// `LIST_PATH`, the build's `en*.txt`, as e2e's `**/en*.txt` routes) counts the call
// (`listTextCalls`) and resolves as the original did only once `releaseListText` has been called,
// which stamps `performance.now()` first (`listTextReleasedAt`). The log is per document: a
// navigation starts a fresh one.
export type BootCall = NonNullable<Window['__wordcellBootCalls']>[number];

/** The word-list pathname the `holdListText` gate matches (AD-8's hashed `en*.txt`). */
export const LIST_PATH = /\/en[^/]*\.txt$/;

const armed = new WeakMap<Page, { holdRegister: boolean; holdListText: boolean }>();

export async function recordBootCalls(
  page: Page,
  options: { holdRegister?: boolean; holdListText?: boolean } = {},
): Promise<void> {
  if (armed.has(page)) throw new Error('recordBootCalls: already armed on this page');
  const holdRegister = options.holdRegister === true;
  const holdListText = options.holdListText === true;
  // Sent to the page as source: everything it uses comes in through its argument.
  await page.addInitScript(
    ({ hold, holdText, listPath }) => {
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
      if (holdText) {
        const list = new RegExp(listPath);
        let releaseText = (): void => {};
        const textGate = new Promise<void>((resolve) => {
          releaseText = resolve;
        });
        window.__wordcellListTextCalls = 0;
        window.__wordcellListTextRelease = () => {
          window.__wordcellListTextReleasedAt = performance.now();
          releaseText();
        };
        const text = Response.prototype.text;
        Response.prototype.text = function (this: Response): Promise<string> {
          const original = text.call(this);
          if (!list.test(new URL(this.url, location.href).pathname)) return original;
          window.__wordcellListTextCalls = (window.__wordcellListTextCalls ?? 0) + 1;
          // A body failure while held reaches the caller through the returned promise only, as
          // the original would (no unhandledrejection, so no AD-15 halt, before the release).
          original.catch(() => {});
          return textGate.then(() => original);
        };
      }
    },
    { hold: holdRegister, holdText: holdListText, listPath: LIST_PATH.source },
  );
  armed.set(page, { holdRegister, holdListText });
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

function listTextArmed(page: Page, name: string): void {
  if (armed.get(page)?.holdListText !== true) {
    throw new Error(`${name}: recordBootCalls was not called with holdListText on this page`);
  }
}

/** With `holdListText`: how many word-list `text()` calls this document has made (held or not). */
export async function listTextCalls(page: Page): Promise<number> {
  listTextArmed(page, 'listTextCalls');
  return page.evaluate(() => {
    const calls = window.__wordcellListTextCalls;
    if (calls === undefined) throw new Error('listTextCalls: no held text() in this document');
    return calls;
  });
}

/** With `holdListText`: lets the held word-list `text()` promises settle; returns the stamp. */
export async function releaseListText(page: Page): Promise<number> {
  listTextArmed(page, 'releaseListText');
  return page.evaluate(() => {
    const release = window.__wordcellListTextRelease;
    if (release === undefined) throw new Error('releaseListText: no held text() in this document');
    release();
    return window.__wordcellListTextReleasedAt as number;
  });
}
