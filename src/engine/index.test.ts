import { describe, expect, it } from 'vitest';
import * as engine from './index';

describe('engine surface', () => {
  it('AD-2 index exports accrue, apply, createSession, deal, EN, gameRecord, HISTORY_VERSION, isRecorded, letterCount, parseHistory, parseSession, reconcileHistory, serializeHistory, serializeSession, SESSION_VERSION, statistics and view only at runtime', () => {
    expect(Object.keys(engine).sort()).toEqual([
      'EN',
      'HISTORY_VERSION',
      'SESSION_VERSION',
      'accrue',
      'apply',
      'createSession',
      'deal',
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
});
