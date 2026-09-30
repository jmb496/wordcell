// @ts-check
import { describe, expect, it } from 'vitest';
import { summarise } from './measure-dispatch.mjs';

describe('measure-dispatch summarise', () => {
  it('AD-17 an empty sample list throws', () => {
    expect(() => summarise([])).toThrow();
  });

  it('AD-17 one sample is its own max and median', () => {
    expect(summarise([3])).toEqual({ count: 1, max: 3, median: 3, flagged: false });
  });

  it('AD-17 an unsorted even count has the mean of the two middle values as median', () => {
    expect(summarise([4, 1, 3, 2])).toEqual({ count: 4, max: 4, median: 2.5, flagged: false });
  });

  it('AD-17 an unsorted odd count above one has the middle value as median', () => {
    expect(summarise([5, 1, 3])).toEqual({ count: 3, max: 5, median: 3, flagged: false });
  });

  it('AD-17 a max of exactly 16 ms is not flagged', () => {
    expect(summarise([16]).flagged).toBe(false);
  });

  it('AD-17 a max of 16.01 ms is flagged', () => {
    expect(summarise([16.01]).flagged).toBe(true);
  });
});
