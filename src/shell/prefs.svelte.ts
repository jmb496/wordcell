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

export type AnimationSpeed = 'fast' | 'normal' | 'slow';

export type Prefs = {
  readonly version: 1;
  readonly animationSpeed: AnimationSpeed;
  readonly showTimer: boolean;
};

export type ParsePrefsResult =
  | { readonly ok: true; readonly prefs: Prefs }
  | { readonly ok: false; readonly reason: 'version-unreadable' }
  | {
      readonly ok: false;
      readonly reason: 'version-unknown' | 'contents-unreadable';
      readonly version: number;
    };

/** AD-10: a failed `parsePrefs` result without `ok`. */
export type PrefsRejectReason =
  | { readonly reason: 'version-unreadable' }
  | { readonly reason: 'version-unknown' | 'contents-unreadable'; readonly version: number };

/** AD-17 `loaded().prefs`: stored shape, `null` when absent. */
export type LoadedPrefs = Prefs | null | { readonly rejected: PrefsRejectReason };

export type Motion = { readonly baseMs: number; readonly reduced: boolean };

// AD-7 defaults.
const DEFAULTS: Prefs = { version: 1, animationSpeed: 'normal', showTimer: false };
const BASE_MS: Record<AnimationSpeed, number> = { fast: 90, normal: 180, slow: 320 };
const SPEEDS: readonly string[] = Object.keys(BASE_MS);
const FIELDS = Object.keys(DEFAULTS).sort();

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
  const keys = Object.keys(record).sort();
  if (
    keys.length !== FIELDS.length ||
    keys.some((key, i) => key !== FIELDS[i]) ||
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
    },
  };
}

let value = $state.raw<Prefs>(DEFAULTS);
let reduced = $state(false);
const motion: Motion = $derived({ baseMs: BASE_MS[value.animationSpeed], reduced });
// Q-38: the last `wordcell:prefs` text this store read or successfully wrote (`null` when absent).
let lastText: string | null = null;
let launch: LoadedPrefs | undefined;

function rejectReason(parsed: Exclude<ParsePrefsResult, { ok: true }>): PrefsRejectReason {
  return parsed.reason === 'version-unreadable'
    ? { reason: parsed.reason }
    : { reason: parsed.reason, version: parsed.version };
}

// AD-10: the CSS mirror of `motion` on the root element.
function mirror(): void {
  const style = document.documentElement.style;
  style.setProperty('--wc-base-ms', `${motion.baseMs}ms`);
  style.setProperty('--wc-reduced', motion.reduced ? '1' : '0');
}

function load(): void {
  if (launch !== undefined) throw new Error('AD-10 load() called twice');
  const text = read(PREFS_KEY);
  lastText = text;
  if (text === null) {
    launch = null;
  } else {
    const result = parsePrefs(text);
    if (result.ok) {
      launch = result.prefs;
      value = result.prefs;
    } else {
      launch = { rejected: rejectReason(result) };
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
  setter: 'setAnimationSpeed' | 'setShowTimer',
  animationSpeed: AnimationSpeed,
  showTimer: boolean,
): void {
  const kind = game.state.kind;
  if (kind === 'halted' || kind === 'booting') throw new Error(`AD-15 ${setter}() while ${kind}`);
  if (animationSpeed === value.animationSpeed && showTimer === value.showTimer) return;
  const next: Prefs = { version: 1, animationSpeed, showTimer };
  const text = JSON.stringify(next);
  write(PREFS_KEY, text);
  lastText = text;
  value = next;
  mirror();
}

function setAnimationSpeed(animationSpeed: AnimationSpeed): void {
  set('setAnimationSpeed', animationSpeed, value.showTimer);
}

function setShowTimer(showTimer: boolean): void {
  set('setShowTimer', value.animationSpeed, showTimer);
}

/** Q-38: whether `wordcell:prefs` differs from the text this store last read or wrote. */
function isStale(): boolean {
  return read(PREFS_KEY) !== lastText;
}

function loaded(): LoadedPrefs {
  if (launch === undefined) throw new Error('AD-17 prefs loaded() before load()');
  return launch;
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
  isStale,
};
