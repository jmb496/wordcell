import { expect, type Locator, type Page, test } from '@playwright/test';
import { openFixture } from './helpers/board';
import { dictionaryReady } from './helpers/restore';

// Epic 6 ticket 6.11 (SPEC CAP-10, CAP-11; EXPERIENCE.md Keyboard): on a desktop (hover and fine
// pointer) each keyed button's `title` is `Label (Key)`; on touch no button has a `title`, and the
// accessible name is unchanged either way. Runs on both projects.

const desktop = () => test.info().project.name === 'desktop';
const tray = (page: Page) => page.locator('[data-band="tray"]');
const primary = (page: Page) => page.getByTestId('primary-action');
const menuButton = (page: Page) => page.getByRole('button', { name: 'Menu', exact: true });

async function expectTitle(button: Locator, title: string): Promise<void> {
  if (desktop()) await expect(button).toHaveAttribute('title', title);
  else await expect(button).not.toHaveAttribute('title');
}

test('Q-24 the top bar buttons carry Menu (M), Undo (Z) and Redo (Y) on desktop and no title on touch', async ({
  page,
}) => {
  await openFixture(page, 'session-idle-empty-column');
  await expectTitle(menuButton(page), 'Menu (M)');
  await expectTitle(page.getByTestId('undo'), 'Undo (Z)');
  await expectTitle(page.getByTestId('redo'), 'Redo (Y)');
  await expect(page.getByTestId('undo')).toHaveAccessibleName('Undo');
  await expect(menuButton(page)).toHaveAccessibleName('Menu');
});

test('Q-24 R-31 Composing: Validate (Enter), the − and + buttons and Flip (F) carry their key', async ({
  page,
}) => {
  await openFixture(page, 'session-composing');
  await dictionaryReady(page);
  await expectTitle(primary(page), 'Validate (Enter)');
  const controls = tray(page).locator('.controls');
  await expectTitle(controls.getByRole('button', { name: '−', exact: true }), '− (-)');
  await expectTitle(controls.getByRole('button', { name: '+', exact: true }), '+ (+)');
  await expectTitle(controls.getByRole('button', { name: /Flip/ }), 'Flip (F)');
});

test('Q-24 Place: Confirm (Enter)', async ({ page }) => {
  await openFixture(page, 'session-place');
  await expectTitle(primary(page), 'Confirm (Enter)');
});

test('Q-24 the primary action is New game (N) in Game over', async ({ page }) => {
  await openFixture(page, 'session-gave-up', { endSheet: 'collapsed' });
  await expect(primary(page)).toHaveAccessibleName('New game');
  await expectTitle(primary(page), 'New game (N)');
});

test('Q-24 the menu rows New game (N) and How to play (?) carry their key; Give up has none', async ({
  page,
}) => {
  await openFixture(page, 'session-idle-empty-column');
  await menuButton(page).click();
  const menu = page.getByRole('dialog', { name: 'Menu', exact: true });
  await expectTitle(menu.getByRole('button', { name: 'New game', exact: true }), 'New game (N)');
  await expectTitle(
    menu.getByRole('button', { name: 'How to play', exact: true }),
    'How to play (?)',
  );
  await expect(menu.getByRole('button', { name: 'Give up', exact: true })).not.toHaveAttribute(
    'title',
  );
});
