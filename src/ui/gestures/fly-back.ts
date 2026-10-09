// AD-12 fly-back (epic 4 SPEC CAP-7, epic 4 SPEC F13, epic 4 SPEC F32, epic 4 SPEC F33): a dragged
// tail that is not dropped flies back from its last written transform by WAAPI over
// `duration('flyBack')` on its faces, or under reduced motion clears the transform at once and
// fades the faces in. A restoring fly-back lands each face on its resting slot (lifted if its
// wrapper is `lifted`, else unlifted); the others land on `translate(0px, 0px)`. One flight at a
// time, gate-counted from its start until it settles: on its faces' last `onfinish`, or at once
// through `finishFlight()` (cancel(), a new press, a new drag). The settle clears the drag classes
// and transform (`clearDrag`), leaves the gate, then calls `onSettle` (the controller's suppress
// and hover repaint). A cancelled animation would never settle and throws (rule 6). `translate()`
// is the one transform writer the drag moves share.
import { prefs } from '../../shell/prefs.svelte';
import { SELECTION_LIFT_PX } from '../layout/geometry';
import { duration } from '../motion';
import type { Drag } from './controller';
import type { Gate } from './gate';

export function translate(dx: number, dy: number): string {
  return `translate(${dx}px, ${dy}px)`;
}

/** A running fly-back (F13). */
type Flight = { readonly drag: Drag; readonly animations: Animation[]; settled: boolean };

export type FlyBackDeps = {
  readonly gate: Gate;
  /** Removes every drag class and the inline transform from the tail. */
  clearDrag(drag: Drag): void;
  /** Runs at the end of every settle, after the gate leave. */
  onSettle(): void;
};

export type FlyBack = {
  flyBack(drag: Drag, restoring: boolean): void;
  /** Epic 4 SPEC F13: completes a running fly-back at once; its settle runs synchronously. */
  finishFlight(): void;
  /** True while a fly-back runs. */
  running(): boolean;
};

export function createFlyBack(deps: FlyBackDeps): FlyBack {
  const { gate, clearDrag } = deps;
  /** The running fly-back, if any. */
  let flying: Flight | null = null;

  // F13: WAAPI on the faces from the last written transform back to the slot (F32/F33: when
  // `restoring`, each face's resting slot, lifted if its wrapper is `lifted`); under reduced motion
  // the transform clears at once (Card's `.lifted .face` rests a kept selection's faces lifted) and
  // the faces fade in. Gate-counted until settled.
  function flyBack(drag: Drag, restoring: boolean): void {
    if (flying !== null) throw new Error('AD-12 fly-back while one is running');
    gate.enter();
    const ms = duration('flyBack');
    const reduced = prefs.motion.reduced;
    const flight: Flight = { drag, animations: [], settled: false };
    flying = flight;
    let remaining = drag.faces.length;
    const done = (): void => {
      remaining -= 1;
      if (remaining === 0) settle(flight);
    };
    for (const [i, face] of drag.faces.entries()) {
      let animation: Animation;
      if (reduced) {
        face.style.transform = '';
        animation = face.animate([{ opacity: 0 }, { opacity: 1 }], { duration: ms });
      } else {
        const rest =
          restoring && drag.wrappers[i]?.classList.contains('lifted') === true
            ? -SELECTION_LIFT_PX
            : 0;
        animation = face.animate(
          [
            { transform: translate(drag.dx, drag.dy - drag.lift) },
            { transform: translate(0, rest) },
          ],
          { duration: ms, easing: 'ease-out' },
        );
        face.style.transform = '';
      }
      animation.onfinish = done;
      // Rule 6: a cancelled fly-back would never settle (gate held, drag classes on);
      // finishFlight's finish() never cancels.
      animation.oncancel = () => {
        throw new Error('AD-12 fly-back animation cancelled');
      };
      flight.animations.push(animation);
    }
  }

  // Idempotent: the last face's onfinish, or finishFlight().
  function settle(flight: Flight): void {
    if (flight.settled) return;
    flight.settled = true;
    if (flying === flight) flying = null;
    clearDrag(flight.drag);
    gate.leave();
    deps.onSettle();
  }

  // F13: completes a running fly-back at once; its settle runs synchronously.
  function finishFlight(): void {
    const flight = flying;
    if (flight === null) return;
    for (const animation of flight.animations) animation.finish();
    settle(flight);
  }

  function running(): boolean {
    return flying !== null;
  }

  return { flyBack, finishFlight, running };
}
