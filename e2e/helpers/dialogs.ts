import { expect, type Page } from '@playwright/test';

// §2/Q-33 History notice and Reset confirm over the AD-13 nav adapter: locators and reads shared
// by the nav and history-notice specs.

export const NOTICE_TITLE = "Your score history can't be read.";
export const CONFIRM_TITLE = 'Delete the score history?';

export type NavState = { wc: number; launch: number } | null;

// The current history entry's AD-13 state.
export const wc = (page: Page) => page.evaluate(() => history.state as NavState);
export const notice = (page: Page) => page.getByRole('dialog', { name: NOTICE_TITLE });
export const confirmDialog = (page: Page) => page.getByRole('dialog', { name: CONFIRM_TITLE });
export const button = (page: Page, name: string) => page.getByRole('button', { name, exact: true });

// Back from the base entry leaves the app (the page opened the app from its initial about:blank).
export async function expectLeaves(page: Page): Promise<void> {
  await page.goBack();
  await expect(page).toHaveURL('about:blank');
}

// What sits at (x, y): a dialog's scrim or a button (by its text), with the title of the dialog
// layer it belongs to (null outside any dialog).
export type Hit = {
  kind: 'scrim' | 'button' | 'other';
  name: string | null;
  dialog: string | null;
};
export function hitAt(page: Page, x: number, y: number): Promise<Hit> {
  return page.evaluate(
    ([px, py]) => {
      const el = document.elementFromPoint(px, py);
      if (el === null) throw new Error('nothing at the point');
      const dialog = el.closest('.layer')?.querySelector('[role="dialog"] h2')?.textContent ?? null;
      if (el.classList.contains('scrim')) return { kind: 'scrim' as const, name: null, dialog };
      const b = el.closest('button');
      if (b !== null)
        return { kind: 'button' as const, name: b.textContent?.trim() ?? null, dialog };
      return { kind: 'other' as const, name: el.tagName, dialog };
    },
    [x, y],
  );
}
