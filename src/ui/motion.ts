// AD-10: the only source of WAAPI animation durations, after EXPERIENCE.md Motion: each kind is a
// multiple of `prefs.motion.baseMs`; under reduced motion every kind is the 120 ms fade except
// parting, which snaps (0), and there is no stagger. No animation uses it until epic 5.
import { prefs } from '../shell/prefs.svelte';

export type MotionKind = 'snap' | 'flyBack' | 'parting' | 'undoRedo' | 'flyToCell' | 'overlay';

const FACTOR: Record<MotionKind, number> = {
  snap: 1,
  flyBack: 1,
  parting: 0.5,
  undoRedo: 1,
  flyToCell: 2,
  overlay: 1,
};
const REDUCED_FADE_MS = 120;
const STAGGER_MS = 30;

/** AD-10: the duration in ms of one animation of `kind`. */
export function duration(kind: MotionKind): number {
  const { baseMs, reduced } = prefs.motion;
  if (reduced) return kind === 'parting' ? 0 : REDUCED_FADE_MS;
  return baseMs * FACTOR[kind];
}

/** AD-10: the delay in ms between staggered animations. */
export function stagger(): number {
  return prefs.motion.reduced ? 0 : STAGGER_MS;
}
