import { describe, expect, it } from 'vitest';
import * as engine from './index';

describe('engine surface', () => {
  it('AD-2 index exports deal, EN and letterCount only at runtime', () => {
    expect(Object.keys(engine).sort()).toEqual(['EN', 'deal', 'letterCount']);
  });
});
