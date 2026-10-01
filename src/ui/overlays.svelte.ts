// AD-13 overlays store (SPEC E3): the single owner of the ordered stack of open entries. `open`
// pushes one history entry through nav; `close` is top-down only and pops one; `closedByBack`
// (nav's close callback) removes every entry deeper than the back's depth, topmost first, and
// never calls nav. `resetForNewSession()` (New game, AD-4) closes every entry top-down; epics 4
// and 6 add the end-sheet and selection parts.
import { nav } from '../shell/nav';

export type OverlayId = 'historyNotice' | 'resetConfirm';

let stack = $state.raw<readonly OverlayId[]>([]);

function open(id: OverlayId): void {
  if (stack.includes(id)) throw new Error(`AD-13 open(${id}) while it is open`);
  stack = [...stack, id];
  nav.push();
}

function close(id: OverlayId): void {
  const top = stack.at(-1);
  if (top !== id) throw new Error(`AD-13 close(${id}) while the top is ${top ?? 'nothing'}`);
  stack = stack.slice(0, -1);
  nav.pop();
}

function closedByBack(depth: number): void {
  while (stack.length > depth) stack = stack.slice(0, -1);
}

function resetForNewSession(): void {
  for (let top = stack.at(-1); top !== undefined; top = stack.at(-1)) close(top);
}

export const overlays = {
  get depth(): number {
    return stack.length;
  },
  get top(): OverlayId | undefined {
    return stack.at(-1);
  },
  isOpen(id: OverlayId): boolean {
    return stack.includes(id);
  },
  open,
  close,
  closedByBack,
  resetForNewSession,
};
