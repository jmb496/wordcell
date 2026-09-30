// AD-4 game store, first cut. E7 transitional: boots straight to `active` with `createSession(1)`
// at module load; CAP-3 replaces this with the load, storage, dispatch and a random seed.
import { createSession, EN, type GameView, type Session, view } from '../engine/index';

type GameState =
  | { readonly kind: 'booting' }
  | { readonly kind: 'active'; readonly session: Session };

let state: GameState = $state.raw({ kind: 'booting' });
state = { kind: 'active', session: createSession(1) };

const current: GameView | undefined = $derived(
  state.kind === 'active' ? view(state.session, EN) : undefined,
);

export const game = {
  get state(): GameState {
    return state;
  },
  get view(): GameView | undefined {
    return current;
  },
};
