// Epic 10 ticket 10.7 (SPEC F13, A-E16, AD-19): the ☰ button's and the `M` key's one way to the
// menu. With the win celebration on top, `celebration.end()` runs first: its close queues
// `nav.pop()`, and its `done` (a microtask after the removal, end-sheet.ts) pushes `endSheet`
// behind it, so the menu opens only once nav settles (the pop's `popstate`, then the sheet's push),
// and only over `endSheet`; any other top at the settle (a back in between, or a second press that
// already opened the menu) drops the open. The deferred open runs inside act(): between the press
// and the settle a new press can start on the sheet, and act() cancels it and clears a tile
// selection, as every App-owned open does. Otherwise `openSurface('menu')` at once.
// celebration.svelte.ts with its explicit `.ts` (as main.ts and end-sheet.ts): drvfs resolves
// `./celebration.svelte` case-insensitively to `Celebration.svelte`.
import { nav } from '../shell/nav';
import { act } from './act';
import { celebration } from './celebration/celebration.svelte.ts';
import { openSurface } from './open-surface';
import { overlays } from './overlays.svelte';

export function openMenu(): void {
  if (overlays.top === 'celebration') {
    celebration.end();
    nav.whenSettled(
      act(() => {
        if (overlays.top === 'endSheet') openSurface('menu');
      }),
    );
    return;
  }
  openSurface('menu');
}
