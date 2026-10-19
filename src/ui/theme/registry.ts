// Q-45, AD-10, AD-16 theme registry (epic themes TH-3): theme id -> label (text.ts) and explicit
// `theme-color` meta colour. `applyTheme(id)` sets `data-theme` on the root (always, `default`
// included) and updates the one meta in place; an unregistered id throws to AD-15 (rule 6).
// Production registers `default` and `paper` (in that order); `testGarden` is the only test-only
// entry, which `main.ts` registers in builds carrying the test hook. Each entry's meta equals its
// theme's `--wc-table` in app.css.
import type { ThemeId } from '../../shell/prefs.svelte';
import { text } from '../text';

export type ThemeEntry = {
  readonly id: ThemeId;
  readonly label: string;
  /** The `theme-color` meta colour (AD-10). */
  readonly meta: string;
};

/** TH-3: equals `--wc-table` in app.css (and the static `index.html` meta). */
export const defaultTheme: ThemeEntry = {
  id: 'default',
  label: text.themeDefault,
  meta: '#15171B',
};

/** Daylight Paper (epic themes TH-3): equals its `--wc-table` in app.css. */
export const paperTheme: ThemeEntry = { id: 'paper', label: text.themePaper, meta: '#ECE6D8' };

/**
 * Test-only theme for the TH-9 art hooks; exempt from the token check. It sets only the two art
 * tokens (garden.css), so its table colour is the default's.
 */
export const testGarden: ThemeEntry = {
  id: 'garden',
  label: text.themeGarden,
  meta: defaultTheme.meta,
};

const table = new Map<ThemeId, ThemeEntry>();

export function register(entry: ThemeEntry): void {
  if (table.has(entry.id)) throw new Error(`AD-10 theme '${entry.id}' registered twice`);
  table.set(entry.id, entry);
}

/** The registered themes, in registration order. */
export function entries(): readonly ThemeEntry[] {
  return [...table.values()];
}

export function applyTheme(id: ThemeId): void {
  const entry = table.get(id);
  if (entry === undefined) throw new Error(`AD-10 theme '${id}' is not registered`);
  const meta = document.head.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
  if (meta === null) throw new Error('AD-16 theme-color meta is missing');
  document.documentElement.dataset.theme = id;
  meta.content = entry.meta;
}
