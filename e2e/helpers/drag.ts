import { expect, type Page } from '@playwright/test';

// AD-12 drag residue (SPEC CAP-7, CAP-8): every element with a `wc-drag-*` class, and every face
// with an inline transform. Zero for both means no drag, ghost, layer or target is showing.
export function dragResidue(page: Page): Promise<{ classes: number; transforms: number }> {
  return page.evaluate(() => ({
    classes: [...document.querySelectorAll('*')].filter((el) =>
      [...el.classList].some((c) => c.startsWith('wc-drag-')),
    ).length,
    transforms: [...document.querySelectorAll<HTMLElement>('.face')].filter(
      (el) => el.style.transform !== '',
    ).length,
  }));
}

export async function expectNoResidue(page: Page): Promise<void> {
  await expect.poll(() => dragResidue(page)).toEqual({ classes: 0, transforms: 0 });
}
