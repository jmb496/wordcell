import { describe, expect, it } from 'vitest';
import * as engine from './index';

describe('engine surface', () => {
  it('AD-2 index exports apply, createSession, deal, EN, letterCount and SESSION_VERSION only at runtime', () => {
    expect(Object.keys(engine).sort()).toEqual([
      'EN',
      'SESSION_VERSION',
      'apply',
      'createSession',
      'deal',
      'letterCount',
    ]);
  });
});
