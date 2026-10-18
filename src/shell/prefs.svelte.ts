// AD-10 preferences store: the owner of `wordcell:prefs` and the motion variables. `load()` (called
// by `main.ts` between the font check and `game.load()`, AD-16) parses the key once and never
// writes; an absent key gives the AD-7 defaults, an unreadable or unknown-version one the defaults
// silently (Q-36), replaced on the first changing setter call. The setters write at once (AD-10),
// throwing while the game store is halted or booting (AD-15). `motion` is derived from the prefs
// and the reduced-motion media query and mirrored to `--wc-base-ms` and `--wc-reduced` on the root
// element. `isStale()` is the Q-38 bfcache check. No browser global at import; reads `game.state`
// only inside functions (import cycle with the game store).
import { game } from './game.svelte';
import { PREFS_KEY, read, write } from './storage';
import {
  assertWritable,
  launchSnapshot,
  type RejectReasonOf,
  rejectReason,
  trackLastText,
} from './stored-key';

export type AnimationSpeed = 'fast' | 'normal' | 'slow';

/** AD-7 theme ids (Q-45). */
export type ThemeId = 'default' | 'scifi' | 'garden' | 'steampunk' | 'paper' | 'plum';

/** AD-7 stored shape: `theme` is present only when stored (a writer omits `default`). */
export type StoredPrefs = {
  readonly version: 1;
  readonly animationSpeed: AnimationSpeed;
  readonly showTimer: boolean;
  readonly theme?: ThemeId;
};

/** The resolved in-memory prefs: `theme` is `default` when not stored. */
export type Prefs = {
  readonly version: 1;
  readonly animationSpeed: AnimationSpeed;
  readonly showTimer: boolean;
  readonly theme: ThemeId;
};

export type ParsePrefsResult =
  | { readonly ok: true; readonly prefs: StoredPrefs }
  | { readonly ok: false; readonly reason: 'version-unreadable' }
  | {
      readonly ok: false;
      readonly reason: 'version-unknown' | 'contents-unreadable';
      readonly version: number;
    };

/** AD-10: a failed `parsePrefs` result without `ok`. */
export type PrefsRejectReason = RejectReasonOf<ParsePrefsResult>;

/** AD-17 `loaded().prefs`: stored shape, `null` when absent. */
export type LoadedPrefs = StoredPrefs | null | { readonly rejected: PrefsRejectReason };

export type Motion = { readonly baseMs: number; readonly reduced: boolean };

// AD-7 defaults.
const DEFAULTS: Prefs = {
  version: 1,
  animationSpeed: 'normal',
  showTimer: false,
  theme: 'default',
};
const BASE_MS: Record<AnimationSpeed, number> = { fast: 90, normal: 180, slow: 320 };
const SPEEDS: readonly string[] = Object.keys(BASE_MS);
const THEMES: readonly string[] = ['default', 'scifi', 'garden', 'steampunk', 'paper', 'plum'];
const REQUIRED = ['animationSpeed', 'showTimer', 'version'];

/** Q-36: parses stored prefs; the failure reasons mirror `parseHistory`'s. */
export function parsePrefs(text: string): ParsePrefsResult {
  let root: unknown;
  try {
    root = JSON.parse(text);
  } catch {
    return { ok: false, reason: 'version-unreadable' };
  }
  if (typeof root !== 'object' || root === null || Array.isArray(root)) {
    return { ok: false, reason: 'version-unreadable' };
  }
  const record = root as Record<string, unknown>;
  const version = Object.hasOwn(record, 'version') ? record.version : undefined;
  if (typeof version !== 'number' || !Number.isSafeInteger(version) || version < 0) {
    return { ok: false, reason: 'version-unreadable' };
  }
  if (version !== 1) return { ok: false, reason: 'version-unknown', version };
  // AD-7: `theme` is optional; any other key set is unreadable.
  const hasTheme = Object.hasOwn(record, 'theme');
  const keys = Object.keys(record)
    .filter((key) => key !== 'theme')
    .sort();
  if (
    keys.length !== REQUIRED.length ||
    keys.some((key, i) => key !== REQUIRED[i]) ||
    (hasTheme && (typeof record.theme !== 'string' || !THEMES.includes(record.theme))) ||
    typeof record.animationSpeed !== 'string' ||
    !SPEEDS.includes(record.animationSpeed) ||
    typeof record.showTimer !== 'boolean'
  ) {
    return { ok: false, reason: 'contents-unreadable', version };
  }
  return {
    ok: true,
    prefs: {
      version: 1,
      animationSpeed: record.animationSpeed as AnimationSpeed,
      showTimer: record.showTimer,
      ...(hasTheme ? { theme: record.theme as ThemeId } : {}),
    },
  };
}

let value = $state.raw<Prefs>(DEFAULTS);
let reduced = $state(false);
const motion: Motion = $derived({ baseMs: BASE_MS[value.animationSpeed], reduced });
// Q-38: the last `wordcell:prefs` text this store read or successfully wrote (`null` when absent).
const lastText = trackLastText();
const launch = launchSnapshot<LoadedPrefs>();

// AD-10: the CSS mirror of `motion` on the root element.
function mirror(): void {
  const style = document.documentElement.style;
  style.setProperty('--wc-base-ms', `${motion.baseMs}ms`);
  style.setProperty('--wc-reduced', motion.reduced ? '1' : '0');
}

function load(): void {
  launch.assertUnset('AD-10 load() called twice');
  const text = read(PREFS_KEY);
  lastText.remember(text);
  if (text === null) {
    launch.set(null);
  } else {
    const result = parsePrefs(text);
    if (result.ok) {
      launch.set(result.prefs);
      value = { ...result.prefs, theme: result.prefs.theme ?? 'default' };
    } else {
      launch.set({ rejected: rejectReason(result) });
    }
  }
  const query = matchMedia('(prefers-reduced-motion: reduce)');
  reduced = query.matches;
  query.addEventListener('change', (event) => {
    reduced = event.matches;
    mirror();
  });
  mirror();
}

// AD-10: state check, same-value no-op, write, then memory and the mirror (a throwing write
// propagates with nothing changed, rule 6).
function set(
  setter: 'setAnimationSpeed' | 'setShowTimer' | 'setTheme',
  animationSpeed: AnimationSpeed,
  showTimer: boolean,
  theme: ThemeId,
): void {
  assertWritable(game.state.kind, setter);
  if (
    animationSpeed === value.animationSpeed &&
    showTimer === value.showTimer &&
    theme === value.theme
  ) {
    return;
  }
  const next: Prefs = { version: 1, animationSpeed, showTimer, theme };
  // AD-7: writers omit `theme` iff it is `default`.
  const stored: StoredPrefs =
    theme === 'default' ? { version: 1, animationSpeed, showTimer } : next;
  const text = JSON.stringify(stored);
  write(PREFS_KEY, text);
  lastText.remember(text);
  value = next;
  mirror();
}

function setAnimationSpeed(animationSpeed: AnimationSpeed): void {
  set('setAnimationSpeed', animationSpeed, value.showTimer, value.theme);
}

function setShowTimer(showTimer: boolean): void {
  set('setShowTimer', value.animationSpeed, showTimer, value.theme);
}

// AD-10: the UI's theme apply, registered by `main.ts` (shell never imports `src/ui/`).
let themeChange: ((theme: ThemeId) => void) | null = null;

function onThemeChange(callback: (theme: ThemeId) => void): void {
  themeChange = callback;
}

// Q-45: write first, then (only on a changed value after a successful write) the callback.
function setTheme(theme: ThemeId): void {
  const before = value.theme;
  set('setTheme', value.animationSpeed, value.showTimer, theme);
  if (value.theme !== before) themeChange?.(value.theme);
}

/** Q-38: whether `wordcell:prefs` differs from the text this store last read or wrote. */
function isStale(): boolean {
  return lastText.isStale(read(PREFS_KEY));
}

function loaded(): LoadedPrefs {
  return launch.get(() => 'AD-17 prefs loaded() before load()');
}

export const prefs = {
  /** AD-17 `current().prefs`: the in-memory prefs (defaults when absent or unreadable). */
  get value(): Prefs {
    return value;
  },
  get motion(): Motion {
    return motion;
  },
  load,
  loaded,
  setAnimationSpeed,
  setShowTimer,
  setTheme,
  onThemeChange,
  isStale,
};
