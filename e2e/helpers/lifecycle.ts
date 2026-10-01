import type { Page } from '@playwright/test';

// AD-17 Time and hide: visibility override lasts until the next navigation.
async function setVisibility(page: Page, state: 'hidden' | 'visible'): Promise<void> {
  await page.evaluate((target) => {
    if (document.visibilityState === target) {
      throw new Error(`visibilityState is already '${target}'`);
    }
    Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => target });
    Object.defineProperty(document, 'hidden', {
      configurable: true,
      get: () => target === 'hidden',
    });
    document.dispatchEvent(new Event('visibilitychange', { bubbles: true }));
  }, state);
}

export async function hidePage(page: Page): Promise<void> {
  await setVisibility(page, 'hidden');
}

export async function showPage(page: Page): Promise<void> {
  await setVisibility(page, 'visible');
}

export async function pageHide(page: Page): Promise<void> {
  await page.evaluate(() => {
    window.dispatchEvent(new PageTransitionEvent('pagehide', { persisted: false }));
  });
}

export async function pageShow(page: Page, { persisted }: { persisted: boolean }): Promise<void> {
  await page.evaluate((p) => {
    window.dispatchEvent(new PageTransitionEvent('pageshow', { persisted: p }));
  }, persisted);
}

// AD-17: every later navigation of this page loads hidden (visibilityState 'hidden', hidden true)
// until showPage overrides it in that document. Call before goto; the getters are configurable.
export async function startHidden(page: Page): Promise<void> {
  await page.addInitScript(() => {
    Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'hidden' });
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => true });
  });
}
