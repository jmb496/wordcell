// Epic 6 CAP-10 (6.11, EXPERIENCE.md Keyboard): the key label each tooltip shows, one per command
// that carries a key in its desktop tooltip. Pure data with no store imports, so `text.ts` (which
// e2e specs import) and the key table in keys.ts (`Row.label`) read the same literals. Give up has
// no key and no entry.
export type TooltipCommand =
  | 'undo'
  | 'redo'
  | 'validate'
  | 'confirm'
  | 'k-'
  | 'k+'
  | 'flip'
  | 'menu'
  | 'newGame'
  | 'howToPlay';

export const KEY_LABELS: Readonly<Record<TooltipCommand, string>> = {
  undo: 'Z',
  redo: 'Y',
  validate: 'Enter',
  confirm: 'Enter',
  'k-': '-',
  'k+': '+',
  flip: 'F',
  menu: 'M',
  newGame: 'N',
  howToPlay: '?',
};
