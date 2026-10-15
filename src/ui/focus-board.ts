// EXPERIENCE.md Focus: "the board" is the bottom card of the lowest-numbered non-empty column, or
// the focusable board container (`main`) when every column is empty, as after a win. Cards carry no
// tab stop of their own yet (the keyboard map, entry 10), so the chosen card is made programmatically
// focusable (`tabindex="-1"`) here.
export function focusBoard(): void {
  for (const column of document.querySelectorAll<HTMLElement>('[data-column]')) {
    const cards = column.querySelectorAll<HTMLElement>('[data-card-id][data-place="column"]');
    const bottom = cards.item(cards.length - 1);
    if (bottom === null) continue;
    bottom.tabIndex = -1;
    bottom.focus();
    return;
  }
  document.querySelector<HTMLElement>('main')?.focus();
}
