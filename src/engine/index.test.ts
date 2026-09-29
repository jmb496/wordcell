import { describe, expect, it } from 'vitest';
import * as engine from './index';

describe('engine surface', () => {
  it('AD-2 index exports accrue, apply, createSession, deal, EN, letterCount, SESSION_VERSION and view only at runtime', () => {
    expect(Object.keys(engine).sort()).toEqual([
      'EN',
      'SESSION_VERSION',
      'accrue',
      'apply',
      'createSession',
      'deal',
      'letterCount',
      'view',
    ]);
  });
});
