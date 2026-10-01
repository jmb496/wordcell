// AD-7: stateless reads and writes; the only module that touches `localStorage` (AD-1). No parsing
// here: the stores parse (AD-7). `localStorage` is looked up on every call.

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
