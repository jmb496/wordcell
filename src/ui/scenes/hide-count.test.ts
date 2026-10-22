import { describe, expect, it } from 'vitest';
import { noteSceneHide, sceneHides } from './hide-count';

describe('AD-9 scene hide count', () => {
  it('AD-9 sceneHides() starts at 0 and counts each noteSceneHide() (the hide flush callback)', () => {
    expect(sceneHides()).toBe(0);
    noteSceneHide();
    expect(sceneHides()).toBe(1);
    noteSceneHide();
    expect(sceneHides()).toBe(2);
  });
});
