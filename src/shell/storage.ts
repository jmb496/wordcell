// AD-7: stateless reads and writes; the only module that touches `localStorage` and
// `navigator.storage` (AD-1, epic 7 SPEC CAP-3). No parsing here: the stores parse (AD-7).
// `localStorage` and `navigator.storage` are looked up on every call.

export const SESSION_KEY = 'wordcell:session';
export const HISTORY_KEY = 'wordcell:history';
export const PREFS_KEY = 'wordcell:prefs';

export type StorageKey = typeof SESSION_KEY | typeof HISTORY_KEY | typeof PREFS_KEY;

export function read(key: StorageKey): string | null {
  return localStorage.getItem(key);
}

export function write(key: StorageKey, text: string): void {
  localStorage.setItem(key, text);
}

export function remove(key: StorageKey): void {
  localStorage.removeItem(key);
}

/** Q-38: whether a `storage` event's area is this origin's `localStorage` (not sessionStorage). */
export function isLocalArea(area: Storage | null): boolean {
  return area !== null && area === localStorage;
}

/**
 * AD-7, epic 7 SPEC CAP-3: asks once per launch that the origin's storage be persistent. Absent
 * `navigator.storage` → nothing; already persisted → nothing; else `persist()`, its boolean
 * ignored. No catch (rule 6): a rejection reaches AD-15's `unhandledrejection` handler. Called only
 * by `main.ts`'s boot tail (AD-16), the spec-sanctioned exception to "`storage.ts` is called only by
 * the shell stores".
 */
export async function requestPersistence(): Promise<void> {
  const storage = navigator.storage;
  if (storage === undefined) return;
  if (await storage.persisted()) return;
  await storage.persist();
}
