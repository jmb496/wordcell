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
