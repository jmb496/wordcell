import { describe, expect, it } from 'vitest';
import freeLetterFixture from '../../fixtures/how-to-play-free-letter.json' with { type: 'json' };
import moveComposeFixture from '../../fixtures/how-to-play-move-compose.json' with { type: 'json' };
import placeFixture from '../../fixtures/how-to-play-place.json' with { type: 'json' };
import scoringFixture from '../../fixtures/how-to-play-scoring.json' with { type: 'json' };
import sourceDropFixture from '../../fixtures/how-to-play-source-drop.json' with { type: 'json' };
import dictionary from '../../generated/dictionary/en.txt?raw';
import type { Command } from './commands';
import { EngineError } from './errors';
import { EN } from './lang/en';
import { replayScene, type SceneFixture, sceneStart } from './scene-replay';
import { viewFrom } from './view';

// Epic 8 ticket 1 (HP-5): every How to play scene fixture replays through the real engine. The
// negative cases clone the fixture and break one field; a small inline dictionary Set holds the
// minimal word, and only the named dictionary repro test loads the generated file (once).

const moveCompose = moveComposeFixture as unknown as SceneFixture;
const freeLetter = freeLetterFixture as unknown as SceneFixture;
// A test-local one-drop scene (the old board's E D K A onto column 3) the generic harness cases
// below clone and break; it is no How to play scene.
const baseDrop: SceneFixture = {
  scene: 'base-drop',
  start: {
    columns: [
      ['F', 'E', 'D', 'K', 'A'],
      ['X', 'O', 'R', 'I', 'N'],
      ['L', 'M', 'F', 'B'],
    ],
    cells: { '6': ['L'] },
  },
  commands: [{ type: 'drop', sourceColumn: 1, sourceCount: 4, destinationColumn: 3 }],
};
const place = placeFixture as unknown as SceneFixture;
const scoring = scoringFixture as unknown as SceneFixture;
const sourceDrop = sourceDropFixture as unknown as SceneFixture;
const FIXTURES: readonly SceneFixture[] = [moveCompose, freeLetter, place, scoring, sourceDrop];
const DICT = new Set(['baked', 'balked', 'faked', 'bat', 'sat']);
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

  // Epic 8 ticket 7 (HP-3, HP-5): scenes move-compose and free-letter.
  it('R-10 R-13 R-20 R-23 R-30 R-31 scene move-compose: K B A onto column 3 (M = K B A, D = the bottom k cards), k 2, 3, 2, Flip, arrange to BAKED', () => {
    const { session, rejectedWords } = replayScene(moveCompose, DICT);
    expect(rejectedWords.every((w) => w === undefined)).toBe(true);
    expect(session.cursor.phase).toBe('composing');
    expect(session.moves[0]).toMatchObject({
      sourceColumn: 1,
      sourceCount: 3,
      destinationColumn: 3,
      destinationCount: 2,
      destinationSide: 'right',
    });
    // Only dictionary words are stated (ticket Content); the intermediate non-words are pinned below.
    expect(moveCompose.words).toStrictEqual([{ command: 5, word: 'BAKED' }]);
    expect(moveCompose.validatable).toHaveLength(moveCompose.commands.length + 1);
    expect(moveCompose.block?.map((b) => [b.k, b.side])).toStrictEqual([
      [1, 'left'],
      [2, 'left'],
      [3, 'left'],
      [2, 'left'],
      [2, 'right'],
      [2, 'right'],
    ]);
  });

  it('R-31 R-32 scene move-compose: k is bounded by the destination column own length before the lifted cards land (column 3, 5 cards)', () => {
    const own = moveCompose.start.columns[2].length;
    expect(own).toBe(5);
    for (const [k, ok] of [
      [own, true],
      [own + 1, false],
    ] as const) {
      const scene = clone(moveCompose);
      (scene.commands as Command[])[1] = { type: 'setDestinationCount', k };
      for (const key of ['words', 'validatable', 'block', 'drafts'] as const) delete scene[key];
      if (ok) expect(() => replayScene(scene, DICT)).not.toThrow();
      else expectEngineError(() => replayScene(scene, DICT), 'r31-destination-count');
    }
  });

  it('R-33 R-34 R-38 scene free-letter: WordCell 6 L joins M, an arrange gives BALKED, then validate leaves Composing; validatable matches the engine', () => {
    const { session, rejectedWords } = replayScene(freeLetter, DICT);
    expect(rejectedWords.every((w) => w === undefined)).toBe(true);
    expect(session.cursor.phase).toBe('place');
    expect(freeLetter.commands[freeLetter.commands.length - 1]).toStrictEqual({ type: 'validate' });
    expect(freeLetter.words).toStrictEqual([
      { command: 5, word: 'BAKED' },
      { command: 7, word: 'BALKED' },
    ]);
    expect(freeLetter.validatable).toHaveLength(freeLetter.commands.length + 1);
    expect(freeLetter.validatable?.at(-1)?.canValidate).toBe(false);
  });

  it('Q-31 R-33 R-30 scene free-letter: the tap on WordCell 6 names no index, so L lands at the right end of M (BAKLED); the arrange then gives BALKED', () => {
    const tap = freeLetter.commands[freeLetter.opens ?? -1];
    expect(tap).toStrictEqual({ type: 'addFreeLetter', cell: 6 });
    const start = sceneStart(freeLetter);
    const wordAfter = (commands: number) => {
      const view = viewFrom(start, replayScene(without(freeLetter, commands), DICT).session, EN);
      return {
        word: view.draft?.wordCards.map((id) => view.faces[id].letter).join(''),
        arrangement: view.draft?.arrangement.map((id) => view.faces[id].letter).join(''),
      };
    };
    const opens = freeLetter.opens ?? 0;
    expect(wordAfter(opens)).toStrictEqual({ word: 'BAKED', arrangement: 'BAK' });
    // Q-31: appended at the right end of M (the D block E D stays on the right, R-30).
    expect(wordAfter(opens + 1)).toStrictEqual({ word: 'BAKLED', arrangement: 'BAKL' });
    expect(freeLetter.commands[opens + 1].type).toBe('arrange');
    expect(wordAfter(opens + 2)).toStrictEqual({ word: 'BALKED', arrangement: 'BALK' });
  });

  // The continuity helper (ticket 7 AC2): scene `two` provably opens on scene `one`'s final board.
  const without = (scene: SceneFixture, commands: number): SceneFixture => ({
    ...scene,
    commands: scene.commands.slice(0, commands),
    opens: undefined,
    words: undefined,
    validatable: undefined,
    block: undefined,
    drafts: undefined,
  });
  const boardOf = (scene: SceneFixture, commands: number) => {
    const prefix = without(scene, commands);
    const { session } = replayScene(prefix, DICT);
    const view = viewFrom(sceneStart(prefix), session, EN);
    return {
      columns: view.columns,
      cells: view.cells,
      draft: view.draft && {
        destination: view.draft.destination,
        k: view.draft.k,
        side: view.draft.side,
        arrangement: view.draft.arrangement,
        wordCards: view.draft.wordCards,
        freeLetters: view.draft.freeLetters,
      },
    };
  };
  function expectContinuity(one: SceneFixture, two: SceneFixture): void {
    expect(two.start).toStrictEqual(one.start);
    expect(two.opens).toBe(one.commands.length);
    expect(two.commands.length).toBeGreaterThan(two.opens ?? 0);
    one.commands.forEach((command, i) => {
      expect(two.commands[i]).toStrictEqual(command);
    });
    expect(boardOf(two, two.opens ?? 0)).toStrictEqual(boardOf(one, one.commands.length));
    const at = <T extends { after: number }>(list: readonly T[] | undefined, after: number) =>
      list?.find((e) => e.after === after);
    expect(at(two.block, two.opens ?? 0)).toStrictEqual(at(one.block, one.commands.length));
    expect(at(two.validatable, two.opens ?? 0)).toStrictEqual(
      at(one.validatable, one.commands.length),
    );
  }

  it('R-30 R-31 scene move-compose: the draft word cards read EKBA, DEKBA, NDEKBA, DEKBA, KBAED, BAKED after commands 0 to 5 (k and side as the block)', () => {
    const start = sceneStart(moveCompose);
    const letters = ['EKBA', 'DEKBA', 'NDEKBA', 'DEKBA', 'KBAED', 'BAKED'];
    letters.forEach((expected, command) => {
      const prefix = without(moveCompose, command + 1);
      const { session } = replayScene(prefix, DICT);
      const view = viewFrom(start, session, EN);
      expect(view.draft?.wordCards.map((id) => view.faces[id].letter).join('')).toBe(expected);
      const block = moveCompose.block?.find((b) => b.after === command + 1);
      expect([view.draft?.k, view.draft?.side]).toStrictEqual([block?.k, block?.side]);
    });
  });

  it('R-30 scene move-compose and free-letter: the arrange ids [3, 0, 22] map through the scene start to B, A, K', () => {
    for (const fixture of [moveCompose, freeLetter]) {
      const arrange = fixture.commands[5] as Extract<Command, { type: 'arrange' }>;
      expect(arrange.arrangement).toStrictEqual([3, 0, 22]);
      const view = viewFrom(
        sceneStart(fixture),
        replayScene(without(fixture, 0), DICT).session,
        EN,
      );
      expect(arrange.arrangement.map((id) => view.faces[id].letter)).toStrictEqual(['B', 'A', 'K']);
    }
  });

  it('R-30 R-31 R-34 scene free-letter: it opens on scene move-compose final position (same start, prefix commands, board, block, Validate)', () => {
    expect(() => expectContinuity(moveCompose, freeLetter)).not.toThrow();
    expect(freeLetter.opens).toBe(6);
    expect(boardOf(freeLetter, 6).draft).toMatchObject({ k: 2, side: 'right' });
  });

  it('R-30 R-31 scene free-letter: a changed start card, a changed prefix command or a changed opens fails the continuity helper', () => {
    const startCard = clone(freeLetter);
    (startCard.start.columns[1] as string[])[0] = 'Z';
    expect(() => expectContinuity(moveCompose, startCard)).toThrow();
    const prefix = clone(freeLetter);
    (prefix.commands as Command[])[3] = { type: 'setDestinationCount', k: 1 };
    expect(() => expectContinuity(moveCompose, prefix)).toThrow();
    for (const opens of [5, 7]) {
      const moved = clone(freeLetter);
      (moved as { opens?: number }).opens = opens;
      expect(() => expectContinuity(moveCompose, moved)).toThrow();
    }
    // Passes the start, prefix and opens checks; only the stated block at `opens` differs. (The
    // engine board check cannot differ alone: replay is deterministic over the same start and prefix.)
    const block = clone(freeLetter);
    const stated = block.block?.find((b) => b.after === block.opens);
    (stated as { k: number }).k = 3;
    expect(() => expectContinuity(moveCompose, block)).toThrow();
  });

  it('AD-2 scene free-letter: opens outside 1..commands.length-1 or not an integer fails the harness', () => {
    for (const opens of [0, 9, 2.5, -1]) {
      const scene = clone(freeLetter);
      (scene as { opens?: number }).opens = opens;
      expect(() => replayScene(scene, DICT)).toThrow(/opens .* is out of range 1\.\.8/);
    }
  });

  it('R-38 scenes move-compose and free-letter: a flipped validatable flag fails the harness', () => {
    for (const fixture of [moveCompose, freeLetter]) {
      const count = fixture.validatable?.length ?? 0;
      for (let i = 0; i < count; i++) {
        const scene = clone(fixture);
        const entry = (scene.validatable as unknown as { canValidate: boolean }[])[i];
        entry.canValidate = !entry.canValidate;
        expect(() => replayScene(scene, DICT)).toThrow(/stated canValidate/);
      }
    }
  });

  it('R-38 scene free-letter: BALKED missing from the dictionary fails the fixture; without validatable the last rejectedWord is balked', () => {
    const only = new Set(['baked']);
    expect(() => replayScene(freeLetter, only)).toThrow(
      /after 9 commands stated canValidate false/,
    );
    const scene = clone(freeLetter);
    delete (scene as { validatable?: unknown }).validatable;
    const { rejectedWords } = replayScene(scene, only);
    expect(rejectedWords[rejectedWords.length - 1]).toBe('balked');
  });

  it.each([
    ['move-compose', moveCompose],
    ['free-letter', freeLetter],
  ] as const)('R-30 R-38 scene %s: a wrong stated word fails the harness', (_name, fixture) => {
    const scene = clone(fixture);
    (scene.words as unknown as { word: string }[])[0].word = 'XQZXQ';
    expect(() => replayScene(scene, DICT)).toThrow(/stated word XQZXQ/);
  });

  it('R-31 scene move-compose: setDestinationCount 0 after the drop throws r31-destination-count (cf. replay.test.ts k = 0 on a non-empty destination)', () => {
    const scene = clone(moveCompose);
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

  it('R-52 scene place: a cells entry naming a cell the view does not list fails the harness', () => {
    const scene = edit<{ cell: number }>(place, 'cells', (e) => {
      e[0].cell = 11;
    });
    expect(() => replayScene(scene, DICT)).toThrow(/no such cell 11/);
  });

  // Regression only (Q-06, R-36): QUIT counted as three letters instead of four fails the harness.
  it('R-36 Q-06 scene scoring: QUIT stated 12 (QU counted as one) fails the harness', () => {
    const scene = edit<{ cell: number; score: number }>(scoring, 'cellScores', (e) => {
      const quit = e.find((entry) => entry.cell === 4);
      if (quit === undefined) throw new Error('no cell 4 entry');
      quit.score = 12;
    });
    expect(() => replayScene(scene, DICT)).toThrow(/cell 4 stated 12, engine 16/);
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

  it('R-80 scene scoring: cell scores without a scores entry for the total fail the harness', () => {
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
    // The harness reports no command index, so pin it: the first 4 commands (through the rejected
    // validate) replay under the same dictionary and command 4 is the setTarget that throws.
    expect(place.commands[4].type).toBe('setTarget');
    const head = { ...place, commands: place.commands.slice(0, 4) } as SceneFixture;
    expect(() =>
      replayScene(
        {
          ...head,
          words: [],
          scores: [],
          cells: [],
          place: [],
          validatable: [],
          cellScores: [],
          drafts: [],
          columns: [],
        } as SceneFixture,
        new Set(['baked']),
      ),
    ).not.toThrow();
  });

  it('R-23 scene base-drop: the drop of E D K A on column 3 reaches Composing with D = B', () => {
    const { session } = replayScene(baseDrop, DICT);
    expect(session.cursor).toStrictEqual({ index: 0, phase: 'composing' });
    expect(session.moves[0]).toMatchObject({
      sourceColumn: 1,
      sourceCount: 4,
      destinationColumn: 3,
      destinationCount: 1,
    });
  });

  it('R-13 AD-2 an illegal move in a cloned fixture throws its EngineError check code (TABLE R-13, sourceCount 0)', () => {
    const scene = clone(baseDrop);
    (scene.commands as Command[])[0] = {
      type: 'drop',
      sourceColumn: 1,
      sourceCount: 0,
      destinationColumn: 3,
    };
    expectEngineError(() => replayScene(scene, DICT), 'r13-source-count');
  });

  it('R-38 AD-2 a non-word in a cloned fixture is the command rejectedWord outcome', () => {
    const scene = clone(baseDrop);
    (scene.commands as Command[]).push({ type: 'validate' });
    const { rejectedWords } = replayScene(scene, DICT);
    expect(rejectedWords).toStrictEqual([undefined, 'bedka']);
  });

  it('R-80 AD-2 a wrong stated score (engine score + 1) fails the harness assertion', () => {
    const scene = clone(baseDrop);
    const ok = { ...scene, scores: [{ after: 1, score: 6 }] };
    expect(() => replayScene(ok, DICT)).not.toThrow();
    const wrong = { ...scene, scores: [{ after: 1, score: 6 + 1 }] };
    expect(() => replayScene(wrong, DICT)).toThrow(/stated score 7, engine 6/);
  });

  it('R-30 AD-2 a stated word is checked against the engine draft word, when present', () => {
    const scene = clone(baseDrop);
    const base = { ...scene, words: [{ command: 0, word: 'BEDKA' }] };
    expect(() => replayScene(base, DICT)).not.toThrow();
    const wrong = { ...scene, words: [{ command: 0, word: 'BAKED' }] };
    expect(() => replayScene(wrong, DICT)).toThrow(/stated word BAKED/);
  });

  it('AD-2 a fixture index out of range or negative fails with the scene-named harness Error', () => {
    const scene = clone(baseDrop);
    const bad: SceneFixture[] = [
      { ...scene, words: [{ command: 1, word: 'X' }] },
      { ...scene, words: [{ command: -1, word: 'X' }] },
      { ...scene, scores: [{ after: 2, score: 0 }] },
      { ...scene, scores: [{ after: -1, score: 0 }] },
      { ...scene, validatable: [{ after: 2, canValidate: false }] },
      { ...scene, validatable: [{ after: -1, canValidate: false }] },
      { ...scene, drafts: [{ after: 2, letters: [] }] },
      { ...scene, drafts: [{ after: -1, letters: [] }] },
    ];
    for (const fixture of bad)
      expect(() => replayScene(fixture, DICT)).toThrow(/^scene base-drop: .* out of range 0\.\.\d/);
  });

  // Epic 8 ticket 10 (HP-4, HP-5): the one Tricky rule scene.
  it('R-21 R-13 Q-11 scene source-drop: a self-drop of E D K A leaves F as D (k 1 left), arranged A K E D gives FAKED', () => {
    const { session, rejectedWords } = replayScene(sourceDrop, DICT);
    expect(rejectedWords).toStrictEqual([undefined, undefined]);
    expect(session.moves[0]).toMatchObject({
      sourceColumn: 1,
      sourceCount: 4,
      destinationColumn: 1,
    });
  });

  it.each([['source-drop', sourceDrop]] as const)(
    'R-31 scene %s: a wrong stated k or side fails the harness',
    (_name, fixture) => {
      expect(() => replayScene(fixture, DICT)).not.toThrow();
      for (const i of (fixture.block ?? []).keys()) {
        const wrongK = edit<{ k: number }>(fixture, 'block', (e) => {
          e[i].k += 1;
        });
        expect(() => replayScene(wrongK, DICT)).toThrow(/stated k/);
        const wrongSide = edit<{ side: string }>(fixture, 'block', (e) => {
          e[i].side = 'right';
        });
        expect(() => replayScene(wrongSide, DICT)).toThrow(/stated k/);
      }
    },
  );

  it.each([['source-drop', sourceDrop]] as const)(
    'R-30 scene %s: a changed stated word fails the harness',
    (_name, fixture) => {
      const scene = edit<{ word: string }>(fixture, 'words', (e) => {
        e[0].word = 'XQZXQ';
      });
      expect(() => replayScene(scene, DICT)).toThrow(/stated word XQZXQ/);
    },
  );

  it.each([['source-drop', sourceDrop]] as const)(
    'R-38 scene %s: every flipped validatable flag fails the harness',
    (_name, fixture) => {
      for (let i = 0; i < (fixture.validatable?.length ?? 0); i++) {
        const scene = edit<{ canValidate: boolean }>(fixture, 'validatable', (e) => {
          e[i].canValidate = !e[i].canValidate;
        });
        expect(() => replayScene(scene, DICT)).toThrow(/stated canValidate/);
      }
    },
  );

  it.each([
    ['move-compose', moveCompose],
    ['free-letter', freeLetter],
    ['place', place],
    ['source-drop', sourceDrop],
  ] as const)(
    'R-30 R-51 scene %s: every edited drafts entry fails the harness',
    (_name, fixture) => {
      expect(fixture.drafts?.length).toBeGreaterThan(0);
      for (let i = 0; i < (fixture.drafts?.length ?? 0); i++) {
        const swapped = edit<{ letters: string[] }>(fixture, 'drafts', (e) => {
          const [first, second, ...rest] = e[i].letters;
          e[i].letters = [second, first, ...rest];
        });
        expect(() => replayScene(swapped, DICT)).toThrow(/stated draft/);
        const dropped = edit<{ letters: string[] }>(fixture, 'drafts', (e) => {
          e[i].letters = e[i].letters.slice(1);
        });
        expect(() => replayScene(dropped, DICT)).toThrow(/stated draft/);
      }
    },
  );

  it('R-60 scene place: after Confirm column 1 keeps F and column 3 L M F (the moved cards and the D block left)', () => {
    expect(place.columns).toStrictEqual([
      {
        after: place.commands.length,
        columns: [['F'], ['X', 'O', 'R', 'I', 'N'], ['L', 'M', 'F']],
      },
    ]);
    expect(place.commands.at(-1)?.type).toBe('confirm');
    expect(() => replayScene(place, DICT)).not.toThrow();
  });

  it('R-60 scene place: an edited columns entry fails the harness', () => {
    const bad: SceneFixture[] = [
      // The pre-Confirm board (the start) stated after Confirm.
      edit<{ columns: string[][] }>(place, 'columns', (e) => {
        e[0].columns = place.start.columns.map((c) => [...c]);
      }),
      // Column 3 keeping its D block B.
      edit<{ columns: string[][] }>(place, 'columns', (e) => {
        e[0].columns[2] = ['L', 'M', 'F', 'B'];
      }),
      // Column 2 reordered, and an unlisted column that is not empty.
      edit<{ columns: string[][] }>(place, 'columns', (e) => {
        e[0].columns[1] = ['O', 'X', 'R', 'I', 'N'];
      }),
      edit<{ columns: string[][] }>(place, 'columns', (e) => {
        e[0].columns[3] = ['F'];
      }),
    ];
    for (const fixture of bad)
      expect(() => replayScene(fixture, DICT)).toThrow(
        /^scene place: after 8 commands column \d stated/,
      );
    const late = edit<{ after: number }>(place, 'columns', (e) => {
      e[0].after = 9;
    });
    expect(() => replayScene(late, DICT)).toThrow(/^scene place: columns after 9 is out of range/);
  });

  it('R-30 AD-2 a drafts entry before the first drop fails with the scene-named harness Error', () => {
    const scene = { ...clone(baseDrop), drafts: [{ after: 0, letters: ['F'] }] };
    expect(() => replayScene(scene, DICT)).toThrow(
      /^scene base-drop: after 0 commands there is no draft/,
    );
  });

  // HP-5: the words a fixture shows besides its validates: each stated `words` entry and each start
  // cell stack of two or more cards (a placed word, R-52; `QU` spelled 'qu'). A stack's placement
  // order need not be its word order (R-51; scoring's D B A L K E holds BALKED), so a stack also
  // passes as a reordering of a dictionary word.
  function notWords(scene: SceneFixture, words: ReadonlySet<string>): string[] {
    const sorted = (word: string) => [...word].sort().join('');
    const missing = (scene.words ?? [])
      .map((entry) => entry.word.toLowerCase())
      .filter((word) => !words.has(word));
    for (const cards of Object.values(scene.start.cells ?? {})) {
      if (cards.length < 2) continue;
      const stack = cards.join('').toLowerCase();
      const key = sorted(stack);
      const reordered = (word: string) => word.length === stack.length && sorted(word) === key;
      if (!words.has(stack) && ![...words].some(reordered)) missing.push(stack);
    }
    return missing;
  }

  it('R-38 AD-17 dictionary repro: every fixture word is in the generated dictionary', () => {
    const words = new Set<string>(dictionary.split('\n'));
    for (const scene of FIXTURES) {
      const { rejectedWords } = replayScene(scene, words);
      expect(rejectedWords.filter((w) => w !== undefined)).toStrictEqual([]);
      expect(notWords(scene, words), scene.scene).toStrictEqual([]);
    }
  });

  it('R-38 a stated word or a start cell stack that is not a word fails the fixture word check', () => {
    expect(notWords(sourceDrop, DICT)).toStrictEqual([]);
    const word = edit<{ word: string }>(sourceDrop, 'words', (e) => {
      e[0].word = 'XQZXQ';
    });
    expect(notWords(word, DICT)).toStrictEqual(['xqzxq']);
    const cells = (stacks: Record<string, string[]>): SceneFixture => ({
      ...clone(scoring),
      start: { columns: [['Z']], cells: stacks },
    });
    expect(
      notWords(cells({ '3': ['B', 'A', 'T'], '4': ['T', 'A', 'S'], '6': ['L'] }), DICT),
    ).toStrictEqual([]);
    expect(notWords(cells({ '3': ['B', 'A', 'X'], '4': ['QU', 'A', 'T'] }), DICT)).toStrictEqual([
      'bax',
      'quat',
    ]);
  });
});
