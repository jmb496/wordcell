import type {
  ParseHistoryResult,
  ParseSessionResult,
  ScoreHistory,
  Session,
} from '../src/engine/index';

// Mirrors src/shell/test-hook.ts and its game-store, score-history and prefs types (change together).
type RejectReason = ParseSessionResult extends infer R
  ? R extends { readonly ok: false }
    ? Omit<R, 'ok'>
    : never
  : never;

type HistoryRejectReason = ParseHistoryResult extends infer R
  ? R extends { readonly ok: false }
    ? Omit<R, 'ok'>
    : never
  : never;

// AD-10 prefs (src/shell/prefs.svelte.ts), declared inline.
type ThemeId = 'default' | 'scifi' | 'garden' | 'steampunk' | 'paper' | 'plum';

type Prefs = {
  readonly version: 1;
  readonly animationSpeed: 'fast' | 'normal' | 'slow';
  readonly showTimer: boolean;
  readonly theme: ThemeId;
};

// `loaded().prefs`: the stored shape, `theme` present only when stored.
type StoredPrefs = Omit<Prefs, 'theme'> & { readonly theme?: ThemeId };

type PrefsRejectReason =
  | { readonly reason: 'version-unreadable' }
  | { readonly reason: 'version-unknown' | 'contents-unreadable'; readonly version: number };

declare global {
  interface Window {
    __wordcell?: Readonly<{
      loaded(): {
        readonly session: Session | null | { readonly rejected: RejectReason };
        readonly history: ScoreHistory | null | { readonly rejected: HistoryRejectReason };
        readonly prefs: StoredPrefs | null | { readonly rejected: PrefsRejectReason };
      };
      current():
        | { readonly kind: 'booting' }
        | {
            readonly kind: 'active';
            readonly session: Session;
            readonly history: ScoreHistory | { readonly rejected: HistoryRejectReason };
            readonly prefs: Prefs;
          }
        | { readonly kind: 'rejected'; readonly reason: RejectReason }
        | { readonly kind: 'halted' };
      dictionaryState(): 'loading' | 'ready' | 'failed';
      // AD-17 Celebration seam: the one writable part (epic 10 entry 5).
      celebration: Readonly<{
        advance(ms: number): void;
        running(): boolean;
        setEnabled(on: boolean): void;
      }>;
    }>;
    __wordcellBoot?: Record<
      'wordcell:session' | 'wordcell:history' | 'wordcell:prefs',
      string | null
    >;
    // e2e/helpers/storage-spy.ts: localStorage writes in order (removeItem as a null value).
    __wordcellStorageWrites?: { key: string; value: string | null }[];
    // e2e/helpers/board.ts stashSession: the store's Session reference, stashed to assert it is
    // unchanged.
    __pointerSession?: unknown;
  }
}
