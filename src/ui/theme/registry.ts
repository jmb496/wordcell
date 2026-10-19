// Q-45, AD-10, AD-16 theme registry (epic themes TH-3): theme id -> label (text.ts) and explicit
// `theme-color` meta colour. `applyTheme(id)` sets `data-theme` on the root (always, `default`
// included) and updates the one meta in place; an unregistered id throws to AD-15 (rule 6).
// Production registers `default`, `scifi`, `garden`, `steampunk` and `paper` (in that order); there is no
// test-only entry. Each entry's meta equals its theme's `--wc-table` in app.css.
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

/** Deep Space (epic themes TH-3): equals its `--wc-table` in app.css. */
export const scifiTheme: ThemeEntry = {
  id: 'scifi',
  label: text.themeDeepSpace,
  meta: '#0A0F1C',
};

/** Greenhouse Dusk (epic themes TH-3): equals its `--wc-table` in app.css. */
export const gardenTheme: ThemeEntry = {
  id: 'garden',
  label: text.themeGreenhouseDusk,
  meta: '#101A14',
};

/** Brass and Walnut (epic themes TH-3): equals its `--wc-table` in app.css. */
export const steampunkTheme: ThemeEntry = {
  id: 'steampunk',
  label: text.themeBrassAndWalnut,
  meta: '#1D1510',
};

/** Daylight Paper (epic themes TH-3): equals its `--wc-table` in app.css. */
export const paperTheme: ThemeEntry = { id: 'paper', label: text.themePaper, meta: '#ECE6D8' };

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
