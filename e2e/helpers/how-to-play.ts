import { expect, type Locator, type Page } from '@playwright/test';
import { scenes } from '../../src/ui/scenes/index';
import { text } from '../../src/ui/text';
import { openFixture } from './board';

// Epic 8 ticket 6, epic themes ticket 6: reach a How to play scene. Seeds through `openFixture`,
// then Menu, How to play, the scene's dot, and Next `last` times (none when `last` is 0). Callers
// set `reducedMotion` and the viewport first. Returns the scene figure.
export async function openScene(
  page: Page,
  {
    fixture,
    prefs,
    scene,
    id,
    last,
  }: {
    fixture: string;
    prefs?: string;
    scene: number;
    id: keyof typeof text.howTo.scenes;
    last: number;
  },
): Promise<Locator> {
  await openFixture(page, fixture, prefs === undefined ? {} : { prefs });
  await page.getByRole('button', { name: 'Menu', exact: true }).click();
  await page.getByRole('button', { name: 'How to play', exact: true }).click();
  const panel = page.getByRole('dialog', { name: 'How to play', exact: true });
  await panel.getByRole('button', { name: text.howTo.carousel.dot(scene, 5), exact: true }).click();
  const figure = panel.getByRole('figure', { name: text.howTo.scenes[id] });
  await expect(figure).toBeVisible();
  for (let i = 0; i < last; i++) {
    await figure.getByRole('button', { name: text.howTo.sceneControls.next, exact: true }).click();
  }
  return figure;
}

// The Next clicks from scene `scene`'s first reduced-motion frame to its final (Replay) one, from
// the scene definition (src/ui/scenes/), so a caller's `last` never goes stale.
export function finalFrame(scene: number): number {
  return scenes[scene - 1].frames.length - 1;
}
