import type { Page } from '@playwright/test';

// AD-17 storage spy: records this page's localStorage writes (setItem, and removeItem as a null
// value) in order, from the moment it is armed until the next navigation. With `throwOn`, a
// setItem to that key is recorded, then throws `storage-spy: <key>` without writing.
export type StorageWrite = { key: string; value: string | null };

const armed = new WeakSet<Page>();

export async function armStorageSpy(page: Page, options: { throwOn?: string } = {}): Promise<void> {
  if (armed.has(page)) throw new Error('armStorageSpy: already armed on this page');
  await page.waitForFunction(() => {
    const hook = window.__wordcell;
    return hook !== undefined && hook.current().kind !== 'booting';
  });
  // Sent to the page as source: everything it uses comes in through `throwOn`.
  await page.evaluate((throwOn) => {
    if (window.__wordcellStorageWrites !== undefined) {
      throw new Error('armStorageSpy: already armed on this page');
    }
    const writes: { key: string; value: string | null }[] = [];
    window.__wordcellStorageWrites = writes;
    const proto = Storage.prototype;
    const setItem = proto.setItem;
    const removeItem = proto.removeItem;
    proto.setItem = function (this: Storage, key: string, value: string): void {
      if (this === localStorage) {
        writes.push({ key, value });
        if (key === throwOn) throw new Error(`storage-spy: ${key}`);
      }
      setItem.call(this, key, value);
    };
    proto.removeItem = function (this: Storage, key: string): void {
      if (this === localStorage) writes.push({ key, value: null });
      removeItem.call(this, key);
    };
  }, options.throwOn ?? null);
  armed.add(page);
}

export async function storageWrites(page: Page): Promise<StorageWrite[]> {
  if (!armed.has(page)) throw new Error('storageWrites: armStorageSpy was not called on this page');
  return page.evaluate(() => {
    const writes = window.__wordcellStorageWrites;
    if (writes === undefined)
      throw new Error('storageWrites: the spy is not armed in this document');
    return writes;
  });
}
