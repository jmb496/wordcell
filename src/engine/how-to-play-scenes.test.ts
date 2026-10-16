import { describe, expect, it } from 'vitest';
import composeFixture from '../../fixtures/how-to-play-compose.json' with { type: 'json' };
import destinationFixture from '../../fixtures/how-to-play-destination.json' with { type: 'json' };
import dragFixture from '../../fixtures/how-to-play-drag.json' with { type: 'json' };
import placeFixture from '../../fixtures/how-to-play-place.json' with { type: 'json' };
import scoringFixture from '../../fixtures/how-to-play-scoring.json' with { type: 'json' };
import dictionary from '../../generated/dictionary/en.txt?raw';
import type { Command } from './commands';
import { EngineError } from './errors';
import { replayScene, type SceneFixture } from './scene-replay';

// Epic 8 ticket 1 (HP-5): every How to play scene fixture replays through the real engine. The
// negative cases clone the fixture and break one field; a small inline dictionary Set holds the
// minimal word, and only the named dictionary repro test loads the generated file (once).

const compose = composeFixture as unknown as SceneFixture;
const destination = destinationFixture as unknown as SceneFixture;
const place = placeFixture as unknown as SceneFixture;
const scoring = scoringFixture as unknown as SceneFixture;
const FIXTURES: readonly SceneFixture[] = [
  dragFixture as unknown as SceneFixture,
  compose,
  destination,
  place,
  scoring,
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
      // Scoring (epic 8 ticket 3) has no commands: its cells-only start is the whole scene.
      if (scene !== scoring) expect(session.moves.length).toBeGreaterThan(0);
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
  ] as const)('R-30 R-38 scene %s: a wrong stated word fails the harness', (_name, fixture) => {
    const scene = clone(fixture);
    (scene.words as unknown as { word: string }[])[0].word = 'XQZXQ';
    expect(() => replayScene(scene, DICT)).toThrow(/stated word XQZXQ/);
  });

  it('R-31 scene destination: setDestinationCount 0 after the drop throws r31-destination-count (cf. replay.test.ts k = 0 on a non-empty destination)', () => {
    const scene = clone(destination);
    (scene.commands as Command[])[1] = { type: 'setDestinationCount', k: 0 };
    expectEngineError(() => replayScene(scene, DICT), 'r31-destination-count');
  });

  // Epic 8 ticket 3 (HP-3d, HP-3e, HP-5): scenes place and scoring.
  const edit = <T>(fixture: SceneFixture, field: string, change: (entries: T[]) => void) => {
    const scene = clone(fixture);
    change((scene as unknown as Record<string, T[]>)[field]);
    return scene;
  };

  it('R-40 R-42 R-50 R-51 R-52 R-60 scene place: BALKED placed on cell 6 in order D B A L K E, top E, score 36', () => {
    const { session, rejectedWords } = replayScene(place, DICT);
    expect(rejectedWords.every((w) => w === undefined)).toBe(true);
    expect(session.moves).toHaveLength(1);
    expect(session.cursor.phase).toBe('idle');
    expect(place.place?.map((p) => [p.after, p.target])).toStrictEqual([
      [4, 6],
      [5, 5],
      [6, 6],
      [7, 6],
    ]);
    expect(place.validatable?.map((v) => v.after)).toStrictEqual([3, 4, 5, 6, 7, 8]);
  });

  it('R-80 R-36 scene scoring: CAT 9, QUIT 16 (QU counts two), BALKED 36, total 61', () => {
    const { session, rejectedWords } = replayScene(scoring, DICT);
    expect(session.moves).toHaveLength(0);
    expect(rejectedWords).toStrictEqual([]);
    expect(scoring.cellScores?.map((c) => c.score)).toStrictEqual([9, 16, 36]);
    expect(scoring.scores).toStrictEqual([{ after: 0, score: 61 }]);
  });

  it('R-80 scene scoring: a total of 62 fails the harness', () => {
    const scene = edit<{ score: number }>(scoring, 'scores', (e) => {
      e[0].score = 62;
    });
    expect(() => replayScene(scene, DICT)).toThrow(/stated score 62, engine 61/);
  });

  it('R-80 scene scoring: a changed per-cell score fails the harness', () => {
    for (let i = 0; i < 3; i++) {
      const scene = edit<{ score: number }>(scoring, 'cellScores', (e) => {
        e[i].score += 1;
      });
      expect(() => replayScene(scene, DICT)).toThrow(/cell \d stated/);
    }
  });

  it('R-80 scene scoring: a non-empty cell with no stated score fails the harness', () => {
    const scene = edit(scoring, 'cellScores', (e) => {
      e.pop();
    });
    expect(() => replayScene(scene, DICT)).toThrow(/cell 6 has no stated score/);
  });

  it('R-80 scene scoring: a stated score for an empty cell fails the harness', () => {
    const scene = edit<{ after: number; cell: number; score: number }>(
      scoring,
      'cellScores',
      (e) => {
        e.push({ after: 0, cell: 5, score: 0 });
      },
    );
    expect(() => replayScene(scene, DICT)).toThrow(/cell 5 is empty/);
  });

  it('R-80 scene scoring: cell scores that do not sum to the stated total fail the harness', () => {
    const scene = edit<{ after: number; score: number }>(scoring, 'scores', (e) => {
      e.length = 0;
    });
    expect(() => replayScene(scene, DICT)).toThrow(/no scores entry/);
  });

  it('R-52 R-60 scene scoring: a changed cells card fails the harness', () => {
    const scene = edit<{ cards: string[] }>(scoring, 'cells', (e) => {
      e[1].cards[0] = 'Q';
    });
    expect(() => replayScene(scene, DICT)).toThrow(/cell 4 stated/);
    const place8 = edit<{ cards: string[] }>(place, 'cells', (e) => {
      e[0].cards = ['B', 'D', 'A', 'L', 'K', 'E'];
    });
    expect(() => replayScene(place8, DICT)).toThrow(/cell 6 stated/);
  });

  it.each([
    ['legalTargets', (e: Record<string, unknown>[]) => (e[0].legalTargets = [3, 4, 5])],
    ['target', (e: Record<string, unknown>[]) => (e[1].target = 6)],
    ['order', (e: Record<string, unknown>[]) => (e[3].order = [3, 0, 24, 22, 8, 6])],
  ])('R-40 R-42 R-51 scene place: a changed %s entry fails the harness', (_name, change) => {
    const scene = edit<Record<string, unknown>>(place, 'place', (e) => {
      change(e);
    });
    expect(() => replayScene(scene, DICT)).toThrow(/stated (target|legalTargets|order)/);
  });

  it('R-80 R-40 scene place: a stated score of 37 after the confirm fails the harness', () => {
    const scene = edit<{ score: number }>(place, 'scores', (e) => {
      e[0].score = 37;
    });
    expect(() => replayScene(scene, DICT)).toThrow(/stated score 37, engine 36/);
  });

  it('R-40 scene place: a place entry outside the Place phase fails the harness', () => {
    const scene = edit<{ after: number }>(place, 'place', (e) => {
      e[0].after = 3;
    });
    expect(() => replayScene(scene, DICT)).toThrow(/no Place phase/);
  });

  it('AD-2 scene place and scoring: an after beyond the command count fails with the scene-named harness Error', () => {
    const bad: SceneFixture[] = [
      edit<{ after: number }>(place, 'cells', (e) => {
        e[0].after = 9;
      }),
      edit<{ after: number }>(place, 'place', (e) => {
        e[0].after = 9;
      }),
      edit<{ after: number }>(place, 'cellScores', (e) => {
        e[0].after = 9;
      }),
      edit<{ after: number }>(place, 'scores', (e) => {
        e[0].after = 9;
      }),
      edit<{ after: number }>(scoring, 'cellScores', (e) => {
        for (const entry of e) entry.after = 1;
      }),
    ];
    for (const fixture of bad)
      expect(() => replayScene(fixture, DICT)).toThrow(/^scene (place|scoring): .* out of range/);
  });

  it('R-38 R-41 scene place: BALKED missing from the dictionary throws an EngineError at command 4 setTarget', () => {
    // The rejected validate (command 3) leaves Composing, so setTarget (command 4) is a wrong-phase throw.
    expectEngineError(() => replayScene(place, new Set(['baked'])), 'command-phase');
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
