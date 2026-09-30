import { dealIds } from './deal';
import { apply, createSession, EN, type Session } from './index';
import { spelling } from './lang/lang-data';

/**
 * Shared test helper: wins `seed` through public `apply`. For each column
 * 1 → 8, self-drops the whole column (k = 0, R-11, R-22), validates it against an inline set
 * holding the column's R-37 string (`QU` → "qu") and confirms at the default target (R-42).
 * Not exported from `index.ts`.
 */
export function winSeed(seed: number): Session {
  const columns = dealIds(seed);
  let session = createSession(seed);
  for (const [i, column] of columns.entries()) {
    const c = i + 1;
    const word = column.map((card) => spelling(card, EN)).join('');
    const ctx = { lang: EN, dictionary: new Set([word]) };
    session = apply(
      session,
      { type: 'drop', sourceColumn: c, sourceCount: column.length, destinationColumn: c },
      ctx,
    ).session;
    session = apply(session, { type: 'validate' }, ctx).session;
    session = apply(session, { type: 'confirm' }, ctx).session;
  }
  return session;
}
