import { describe, expect, it } from 'vitest';
import composeFixture from '../../fixtures/how-to-play-compose.json' with { type: 'json' };
import destinationFixture from '../../fixtures/how-to-play-destination.json' with { type: 'json' };
import dragFixture from '../../fixtures/how-to-play-drag.json' with { type: 'json' };
import dictionary from '../../generated/dictionary/en.txt?raw';
import type { Command } from './commands';
import { EngineError } from './errors';
import { replayScene, type SceneFixture } from './scene-replay';

// Epic 8 ticket 1 (HP-5): every How to play scene fixture replays through the real engine. The
// negative cases clone the fixture and break one field; a small inline dictionary Set holds the
// minimal word, and only the named dictionary repro test loads the generated file (once).

const compose = composeFixture as unknown as SceneFixture;
const destination = destinationFixture as unknown as SceneFixture;
const FIXTURES: readonly SceneFixture[] = [
  dragFixture as unknown as SceneFixture,
  compose,
  destination,
];
const DICT = new Set(['baked', 'balked']);
const clone = (scene: SceneFixture): SceneFixture => structuredClone(scene);

function expectEngineError(fn: () => unknown, check: string): void {
  let thrown: unknown;
  try {
    fn();
  } catch (e) {
    thrown = e;
  }
  expect(thrown).toBeInstanceOf(EngineError);
  expect((thrown as EngineError).check).toBe(check);
}

describe('AD-2 How to play scene replay', () => {
  it.each(FIXTURES.map((f) => [f.scene, f] as const))(
    'R-10 R-20 R-23 scene %s: every command replays through the engine',
    (_name, scene) => {
      const { session, rejectedWords } = replayScene(scene, DICT);
      expect(rejectedWords.every((w) => w === undefined)).toBe(true);
      expect(session.moves.length).toBeGreaterThan(0);
    },
  );

  it('R-23 R-33 R-38 scene compose: BAKED, BALKED with the borrowed L, then validate; validatable matches the engine', () => {
    const { session, rejectedWords } = replayScene(compose, DICT);
    expect(rejectedWords).toStrictEqual([undefined, undefined, undefined, undefined]);
    expect(session.cursor.phase).toBe('place');
    expect(compose.validatable).toHaveLength(compose.commands.length + 1);
  });

  it('R-30 R-31 R-32 scene destination: APE, TAPE, STAPE and PEATS after Flip, validatable matches the engine', () => {
    const { session, rejectedWords } = replayScene(destination, DICT);
    expect(rejectedWords).toStrictEqual([undefined, undefined, undefined, undefined]);
    expect(session.cursor.phase).toBe('composing');
    expect(destination.validatable).toHaveLength(destination.commands.length + 1);
  });

  it('R-38 scene compose: a flipped validatable flag fails the harness', () => {
    for (const fixture of [compose, destination]) {
      const count = fixture.validatable?.length ?? 0;
      for (let i = 0; i < count; i++) {
        const scene = clone(fixture);
        const entry = (scene.validatable as unknown as { canValidate: boolean }[])[i];
        entry.canValidate = !entry.canValidate;
        expect(() => replayScene(scene, DICT)).toThrow(/stated canValidate/);
      }
    }
  });

  it('R-38 scene compose: BALKED missing from the dictionary fails the fixture; without validatable the last rejectedWord is balked', () => {
    const only = new Set(['baked']);
    expect(() => replayScene(compose, only)).toThrow(/after 4 commands stated canValidate false/);
    const scene = clone(compose);
    delete (scene as { validatable?: unknown }).validatable;
    const { rejectedWords } = replayScene(scene, only);
    expect(rejectedWords[rejectedWords.length - 1]).toBe('balked');
  });

  it.each([
    ['compose', compose],
    ['destination', destination],
  ] as const)(
    'R-30 R-38 scene %s: a stated word changed to a non-word fails the harness',
    (_name, fixture) => {
      const scene = clone(fixture);
      (scene.words as unknown as { word: string }[])[0].word = 'XQZXQ';
      expect(() => replayScene(scene, DICT)).toThrow(/stated word XQZXQ/);
    },
  );

  it('R-31 scene destination: setDestinationCount 0 after the drop throws r31-destination-count (cf. replay.test.ts k = 0 on a non-empty destination)', () => {
    const scene = clone(destination);
    (scene.commands as Command[])[1] = { type: 'setDestinationCount', k: 0 };
    expectEngineError(() => replayScene(scene, DICT), 'r31-destination-count');
  });

  it('R-23 scene drag: the drop of E D K A on column 3 reaches Composing with D = B', () => {
    const { session } = replayScene(dragFixture as unknown as SceneFixture, DICT);
    expect(session.cursor).toStrictEqual({ index: 0, phase: 'composing' });
    expect(session.moves[0]).toMatchObject({
      sourceColumn: 1,
      sourceCount: 4,
      destinationColumn: 3,
      destinationCount: 1,
    });
  });

  it('R-13 AD-2 an illegal move in a cloned fixture throws its EngineError check code (TABLE R-13, sourceCount 0)', () => {
    const scene = clone(dragFixture as unknown as SceneFixture);
    (scene.commands as Command[])[0] = {
      type: 'drop',
      sourceColumn: 1,
      sourceCount: 0,
      destinationColumn: 3,
    };
    expectEngineError(() => replayScene(scene, DICT), 'r13-source-count');
  });

  it('R-38 AD-2 a non-word in a cloned fixture is the command rejectedWord outcome', () => {
    const scene = clone(dragFixture as unknown as SceneFixture);
    (scene.commands as Command[]).push({ type: 'validate' });
    const { rejectedWords } = replayScene(scene, DICT);
    expect(rejectedWords).toStrictEqual([undefined, 'bedka']);
  });

  it('R-80 AD-2 a wrong stated score (engine score + 1) fails the harness assertion', () => {
    const scene = clone(dragFixture as unknown as SceneFixture);
    const ok = { ...scene, scores: [{ after: 1, score: 6 }] };
    expect(() => replayScene(ok, DICT)).not.toThrow();
    const wrong = { ...scene, scores: [{ after: 1, score: 6 + 1 }] };
    expect(() => replayScene(wrong, DICT)).toThrow(/stated score 7, engine 6/);
  });

  it('R-30 AD-2 a stated word is checked against the engine draft word, when present', () => {
    const scene = clone(dragFixture as unknown as SceneFixture);
    const base = { ...scene, words: [{ command: 0, word: 'BEDKA' }] };
    expect(() => replayScene(base, DICT)).not.toThrow();
    const wrong = { ...scene, words: [{ command: 0, word: 'BAKED' }] };
    expect(() => replayScene(wrong, DICT)).toThrow(/stated word BAKED/);
  });

  it('AD-2 a rejected case states its outcome, citing the TABLE row, and the harness checks it', () => {
    const scene = clone(dragFixture as unknown as SceneFixture);
    const row = { id: 'R-13', precondition: 'sourceCount 0' };
    const command: Command = {
      type: 'drop',
      sourceColumn: 1,
      sourceCount: 0,
      destinationColumn: 3,
    };
    const good = {
      ...scene,
      rejected: [{ after: 0, command, outcome: 'throw' as const, check: 'r13-source-count', row }],
    };
    expect(() => replayScene(good, DICT)).not.toThrow();
    const bad = { ...good, rejected: [{ ...good.rejected[0], check: 'r31-destination-count' }] };
    expect(() => replayScene(bad, DICT)).toThrow(/expected throw r31-destination-count/);
    const noop = {
      ...scene,
      rejected: [{ after: 1, command: { type: 'undo' } as Command, outcome: 'noop' as const, row }],
    };
    expect(() => replayScene(noop, DICT)).toThrow(/expected a no-op/);
  });

  it('AD-2 a fixture index out of range or negative fails with the scene-named harness Error', () => {
    const scene = clone(dragFixture as unknown as SceneFixture);
    const command: Command = { type: 'undo' };
    const row = { id: 'R-70', precondition: 'nothing to undo' };
    const bad: SceneFixture[] = [
      { ...scene, words: [{ command: 1, word: 'X' }] },
      { ...scene, words: [{ command: -1, word: 'X' }] },
      { ...scene, scores: [{ after: 2, score: 0 }] },
      { ...scene, scores: [{ after: -1, score: 0 }] },
      { ...scene, validatable: [{ after: 2, canValidate: false }] },
      { ...scene, validatable: [{ after: -1, canValidate: false }] },
      { ...scene, rejected: [{ after: 2, command, outcome: 'noop', row }] },
      { ...scene, rejected: [{ after: -1, command, outcome: 'noop', row }] },
    ];
    for (const fixture of bad)
      expect(() => replayScene(fixture, DICT)).toThrow(/^scene drag: .* out of range 0\.\.\d/);
  });

  it('R-38 AD-17 dictionary repro: every fixture word is in the generated dictionary', () => {
    const words = new Set<string>(dictionary.split('\n'));
    for (const scene of FIXTURES) {
      const { rejectedWords } = replayScene(scene, words);
      expect(rejectedWords.filter((w) => w !== undefined)).toStrictEqual([]);
    }
  });
});
