import { type ApplyContext, applyFrom, type Command } from './commands';
import { EngineError } from './errors';
import { EN } from './lang/en';
import { createSession, type Session } from './session';
import { startOf } from './test-helpers';
import type { WordCellNumber } from './types';
import { viewFrom } from './view';

/**
 * Epic 8 ticket 1 (HP-5): the replay harness for the How to play scene fixtures
 * (`fixtures/how-to-play-*.json`, read by the UI and by `how-to-play-scenes.test.ts`). It is an
 * engine source that imports neither `vitest` nor the fixtures: the test passes the fixture and the
 * dictionary in, and asserts with its own local `expect` / `expectEngineError`. A mismatch between
 * the fixture and the engine is a plain `Error` (AGENTS rule 6); an illegal move throws the
 * engine's own `EngineError`.
 */

/** A rejected case's outcome: what `applyFrom` does with the command (AD-2 TABLE). */
export type RejectedOutcome = 'throw' | 'noop' | 'rejectedWord';

export interface SceneFixture {
  readonly scene: string;
  /** §8 start: letters per card (`'QU'` is the QU card), columns top to bottom; cells bottom to top. */
  readonly start: {
    readonly columns: readonly (readonly string[])[];
    readonly cells?: Readonly<Record<string, readonly string[]>>;
  };
  readonly commands: readonly Command[];
  /** After `command`, the draft word (R-30) equals `word` (uppercase) and was not rejected. */
  readonly words?: readonly { readonly command: number; readonly word: string }[];
  /** After `after` commands, the engine's live score (R-80) equals `score`. */
  readonly scores?: readonly { readonly after: number; readonly score: number }[];
  /** After `after` commands, the engine's `canValidate` (R-38) equals `canValidate`. */
  readonly validatable?: readonly { readonly after: number; readonly canValidate: boolean }[];
  /**
   * After `after` commands, cell `cell` holds `cards` (letters bottom to top, `'QU'` for the QU
   * card; R-52, epic 8 ticket 3).
   */
  readonly cells?: readonly {
    readonly after: number;
    readonly cell: number;
    readonly cards: readonly string[];
  }[];
  /**
   * After `after` commands (Place phase only), the target, the legal targets (R-40, R-42) and the
   * placement order (CardIds bottom to top, R-51) equal the engine's.
   */
  readonly place?: readonly {
    readonly after: number;
    readonly target: number;
    readonly legalTargets: readonly number[];
    readonly order: readonly number[];
  }[];
  /**
   * After `after` commands, cell `cell` scores `score` (its letters x its number, R-80); every
   * non-empty cell must be listed and the listed scores sum to the `scores` entry at that `after`.
   */
  readonly cellScores?: readonly {
    readonly after: number;
    readonly cell: number;
    readonly score: number;
  }[];
  /**
   * After `after` commands, `command` has `outcome`; `row` cites the command TABLE row in
   * `commands.test.ts` (id and precondition, never imported or copied).
   */
  readonly rejected?: readonly {
    readonly after: number;
    readonly command: Command;
    readonly outcome: RejectedOutcome;
    readonly check?: string;
    readonly rejectedWord?: string;
    readonly row: { readonly id: string; readonly precondition: string };
  }[];
}

export interface SceneReplay {
  readonly session: Session;
  /** Per command: the outcome's `rejectedWord` (absent when accepted). */
  readonly rejectedWords: readonly (string | undefined)[];
}

/** The fixture's §8 start as a D2 `Start`: `'QU'` maps to the letter `startOf` takes as QU. */
export function sceneStart(scene: SceneFixture) {
  const letters = (cards: readonly string[]): string =>
    cards.map((letter) => (letter === 'QU' ? 'Q' : letter)).join('');
  const cells: Partial<Record<WordCellNumber, string>> = {};
  for (const [cell, cards] of Object.entries(scene.start.cells ?? {}))
    cells[Number(cell) as WordCellNumber] = letters(cards);
  return startOf(scene.start.columns.map(letters), cells);
}

function fail(scene: SceneFixture, message: string): never {
  throw new Error(`scene ${scene.scene}: ${message}`);
}

/**
 * Replays `scene.commands` over its start, then checks the optional `words`, `scores` and
 * `rejected` fields when present. `dictionary` is the `ctx.dictionary` of `validate`.
 */
export function replayScene(scene: SceneFixture, dictionary: ReadonlySet<string>): SceneReplay {
  const start = sceneStart(scene);
  const ctx: ApplyContext = { lang: EN, dictionary };
  const sessions: Session[] = [createSession(1)];
  const rejectedWords: (string | undefined)[] = [];
  for (const command of scene.commands) {
    const result = applyFrom(start, sessions[sessions.length - 1], command, ctx);
    sessions.push(result.session);
    rejectedWords.push(result.rejectedWord);
  }
  const index = (field: string, value: number, max: number): void => {
    if (!Number.isInteger(value) || value < 0 || value > max)
      fail(scene, `${field} ${value} is out of range 0..${max}`);
  };
  const count = scene.commands.length;
  for (const { command, word } of scene.words ?? []) {
    index('words command', command, count - 1);
    if (rejectedWords[command] !== undefined)
      fail(scene, `command ${command} was rejected as a non-word (${rejectedWords[command]})`);
    const shown = viewFrom(start, sessions[command + 1], EN).draft?.word;
    if (shown?.toUpperCase() !== word)
      fail(scene, `command ${command} stated word ${word}, engine ${shown?.toUpperCase()}`);
  }
  for (const { after, score } of scene.scores ?? []) {
    index('scores after', after, count);
    const engine = viewFrom(start, sessions[after], EN).liveScore;
    if (engine !== score)
      fail(scene, `after ${after} commands stated score ${score}, engine ${engine}`);
  }
  for (const { after, canValidate } of scene.validatable ?? []) {
    index('validatable after', after, count);
    const engine = viewFrom(start, sessions[after], EN).canValidate;
    if (engine !== canValidate)
      fail(scene, `after ${after} commands stated canValidate ${canValidate}, engine ${engine}`);
  }
  for (const { after, cell, cards } of scene.cells ?? []) {
    index('cells after', after, count);
    const shown = viewFrom(start, sessions[after], EN);
    const held = shown.cells
      .find((c) => c.cell === cell)
      ?.cards.map((id) => shown.faces[id].letter);
    if (held?.join(',') !== cards.join(','))
      fail(scene, `after ${after} commands cell ${cell} stated ${cards}, engine ${held}`);
  }
  for (const { after, target, legalTargets, order } of scene.place ?? []) {
    index('place after', after, count);
    const place = viewFrom(start, sessions[after], EN).place;
    if (place === undefined) fail(scene, `after ${after} commands there is no Place phase`);
    if (place.target !== target)
      fail(scene, `after ${after} commands stated target ${target}, engine ${place.target}`);
    if (place.legalTargets.join(',') !== legalTargets.join(','))
      fail(
        scene,
        `after ${after} commands stated legalTargets ${legalTargets}, engine ${place.legalTargets}`,
      );
    if (place.placementOrder.join(',') !== order.join(','))
      fail(scene, `after ${after} commands stated order ${order}, engine ${place.placementOrder}`);
  }
  const stated = new Set((scene.cellScores ?? []).map((entry) => entry.after));
  for (const after of stated) {
    index('cellScores after', after, count);
    const shown = viewFrom(start, sessions[after], EN);
    const listed = (scene.cellScores ?? []).filter((entry) => entry.after === after);
    let sum = 0;
    for (const { cell, cards } of shown.cells.filter((c) => c.cards.length > 0)) {
      const score = cards.reduce((n, id) => n + shown.faces[id].letterCount, 0) * cell;
      const entry = listed.find((e) => e.cell === cell);
      if (entry === undefined)
        fail(scene, `after ${after} commands cell ${cell} has no stated score`);
      if (entry.score !== score)
        fail(scene, `after ${after} commands cell ${cell} stated ${entry.score}, engine ${score}`);
      sum += score;
    }
    for (const { cell } of listed)
      if (!shown.cells.some((c) => c.cell === cell && c.cards.length > 0))
        fail(scene, `after ${after} commands cell ${cell} is empty but has a stated score`);
    const total = (scene.scores ?? []).find((entry) => entry.after === after);
    if (total === undefined) fail(scene, `after ${after} commands cellScores have no scores entry`);
    if (total.score !== sum)
      fail(scene, `after ${after} commands cell scores sum ${sum}, stated total ${total.score}`);
  }
  for (const { after, command, outcome, check, rejectedWord } of scene.rejected ?? []) {
    index('rejected after', after, count);
    const before = sessions[after];
    let thrown: unknown;
    let result: ReturnType<typeof applyFrom> | undefined;
    try {
      result = applyFrom(start, before, command, ctx);
    } catch (error) {
      thrown = error;
    }
    if (outcome === 'throw') {
      if (!(thrown instanceof EngineError) || thrown.check !== check)
        fail(scene, `rejected case after ${after}: expected throw ${check}, got ${String(thrown)}`);
    } else if (thrown !== undefined || result === undefined) {
      fail(scene, `rejected case after ${after}: expected ${outcome}, got ${String(thrown)}`);
    } else if (outcome === 'noop') {
      if (result.session !== before || result.rejectedWord !== undefined)
        fail(scene, `rejected case after ${after}: expected a no-op`);
    } else if (result.rejectedWord === undefined || result.rejectedWord !== rejectedWord) {
      fail(scene, `rejected case after ${after}: expected rejectedWord ${rejectedWord}`);
    }
  }
  return { session: sessions[sessions.length - 1], rejectedWords };
}
