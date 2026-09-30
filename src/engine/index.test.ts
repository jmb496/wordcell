import { describe, expect, expectTypeOf, it } from 'vitest';
import type * as commands from './commands';
import type * as scoreHistory from './history';
import type {
  ApplyContext,
  ApplyResult,
  CardId,
  CellView,
  ColumnView,
  Command,
  Cursor,
  DestinationSide,
  DraftView,
  Face,
  GameRecord,
  GameView,
  LangData,
  LongestWord,
  Move,
  ParseHistoryResult,
  ParseSessionResult,
  Phase,
  PlaceView,
  Reached,
  ScoreHistory,
  Session,
  Statistics,
  Status,
  StructuralCheck,
  WordCellNumber,
} from './index';
import * as engine from './index';
import type * as langData from './lang/lang-data';
import type * as replay from './replay';
import type * as serialize from './serialize';
import type * as session from './session';
import type * as types from './types';
import type * as view from './view';

describe('engine surface', () => {
  it('AD-2 index exports accrue, apply, createSession, EN, gameRecord, HISTORY_VERSION, isRecorded, letterCount, parseHistory, parseSession, reconcileHistory, serializeHistory, serializeSession, SESSION_VERSION, statistics and view only at runtime', () => {
    expect(Object.keys(engine).sort()).toEqual([
      'EN',
      'HISTORY_VERSION',
      'SESSION_VERSION',
      'accrue',
      'apply',
      'createSession',
      'gameRecord',
      'isRecorded',
      'letterCount',
      'parseHistory',
      'parseSession',
      'reconcileHistory',
      'serializeHistory',
      'serializeSession',
      'statistics',
      'view',
    ]);
  });

  it('AD-2 index keeps exporting each listed type, equal to its source-module type (checked by npm run check)', () => {
    expectTypeOf<ApplyContext>().toEqualTypeOf<commands.ApplyContext>();
    expectTypeOf<ApplyResult>().toEqualTypeOf<commands.ApplyResult>();
    expectTypeOf<Command>().toEqualTypeOf<commands.Command>();
    expectTypeOf<GameRecord>().toEqualTypeOf<scoreHistory.GameRecord>();
    expectTypeOf<ScoreHistory>().toEqualTypeOf<scoreHistory.ScoreHistory>();
    expectTypeOf<Statistics>().toEqualTypeOf<scoreHistory.Statistics>();
    expectTypeOf<LangData>().toEqualTypeOf<langData.LangData>();
    expectTypeOf<Status>().toEqualTypeOf<replay.Status>();
    expectTypeOf<ParseHistoryResult>().toEqualTypeOf<serialize.ParseHistoryResult>();
    expectTypeOf<ParseSessionResult>().toEqualTypeOf<serialize.ParseSessionResult>();
    expectTypeOf<Cursor>().toEqualTypeOf<session.Cursor>();
    expectTypeOf<DestinationSide>().toEqualTypeOf<session.DestinationSide>();
    expectTypeOf<Move>().toEqualTypeOf<session.Move>();
    expectTypeOf<Phase>().toEqualTypeOf<session.Phase>();
    expectTypeOf<Reached>().toEqualTypeOf<session.Reached>();
    expectTypeOf<Session>().toEqualTypeOf<session.Session>();
    expectTypeOf<CardId>().toEqualTypeOf<types.CardId>();
    expectTypeOf<WordCellNumber>().toEqualTypeOf<types.WordCellNumber>();
    expectTypeOf<CellView>().toEqualTypeOf<view.CellView>();
    expectTypeOf<ColumnView>().toEqualTypeOf<view.ColumnView>();
    expectTypeOf<DraftView>().toEqualTypeOf<view.DraftView>();
    expectTypeOf<Face>().toEqualTypeOf<view.Face>();
    expectTypeOf<GameView>().toEqualTypeOf<view.GameView>();
    expectTypeOf<LongestWord>().toEqualTypeOf<view.LongestWord>();
    expectTypeOf<PlaceView>().toEqualTypeOf<view.PlaceView>();
    expectTypeOf<StructuralCheck>().toEqualTypeOf<view.StructuralCheck>();
  });
});
