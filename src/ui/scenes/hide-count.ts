// Epic 8 (AD-9): how many times the page turned hidden, for the scene player (a hide since a step
// began). No listener here: `main.ts` registers `noteSceneHide` with `game.registerBeforeHide`, so
// every hide flush (hidden, pagehide) counts one.
let hides = 0;

/** The hide flush callback: one more hide. */
export function noteSceneHide(): void {
  hides++;
}

/** How many hide flushes ran so far. */
export function sceneHides(): number {
  return hides;
}
