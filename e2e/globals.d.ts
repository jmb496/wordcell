import type {
  ParseHistoryResult,
  ParseSessionResult,
  ScoreHistory,
  Session,
} from '../src/engine/index';

// Mirrors src/shell/test-hook.ts and its game-store and score-history types (change together).
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

declare global {
  interface Window {
    __wordcell?: Readonly<{
      loaded(): {
        readonly session: Session | null | { readonly rejected: RejectReason };
        readonly history: ScoreHistory | null | { readonly rejected: HistoryRejectReason };
      };
      current():
        | { readonly kind: 'booting' }
        | {
            readonly kind: 'active';
            readonly session: Session;
            readonly history: ScoreHistory | { readonly rejected: HistoryRejectReason };
          }
        | { readonly kind: 'rejected'; readonly reason: RejectReason }
        | { readonly kind: 'halted' };
    }>;
    __wordcellBoot?: Record<
      'wordcell:session' | 'wordcell:history' | 'wordcell:prefs',
      string | null
    >;
    // e2e/helpers/storage-spy.ts: localStorage writes in order (removeItem as a null value).
    __wordcellStorageWrites?: { key: string; value: string | null }[];
  }
}
