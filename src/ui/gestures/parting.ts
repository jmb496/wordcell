// Epic 5 SPEC CAP-5, CAP-6 the parting set of the tile and free-letter drags (AD-10, AD-11, AD-12),
// split from controller.ts (epic 5 retrospective A1).

import { near, type Offset, REST } from './drag-types';
import { translate } from './fly-back';
import type { Gate } from './gate';

// Epic 5 SPEC CAP-5 the parting set (AD-10, AD-11, F6, F24): every running parting or return
// animation by face with its target offset, under one gate count from the first start until the
// last finish or `finishAll()` (synchronous, as `finishFlight`). A face already heading to the new
// target keeps its animation; otherwise its current offset is its rendered transform (computed
// style: a running animation's effect included, layout margins never counted, so a D-block mirror
// face drawn 2 px off its slot reads rest), and a superseded animation is read, cancelled unsettled
// (its handlers cleared first) and replaced; the end transform is written inline (`''` at rest).
// Any other cancel throws (rule 6).
export function createParting(gate: Gate) {
  const running = new Map<HTMLElement, { animation: Animation; target: Offset }>();
  let counted = false;

  function settle(): void {
    if (!counted || running.size > 0) return;
    counted = false;
    gate.leave();
  }

  function track(face: HTMLElement, animation: Animation, target: Offset): void {
    if (!counted) {
      counted = true;
      gate.enter();
    }
    running.set(face, { animation, target });
    animation.onfinish = () => {
      if (running.get(face)?.animation !== animation) return;
      running.delete(face);
      settle();
    };
    animation.oncancel = () => {
      throw new Error('AD-12 parting animation cancelled');
    };
  }

  // A running animation of `face` already ends on `target`.
  function heading(face: HTMLElement, target: Offset): boolean {
    const entry = running.get(face);
    return entry !== undefined && near(entry.target, target);
  }

  // The face's current rendered offset; a running animation is then cancelled unsettled.
  function take(face: HTMLElement): Offset {
    const m = new DOMMatrixReadOnly(getComputedStyle(face).transform);
    const current = { dx: m.m41, dy: m.m42 };
    const animation = running.get(face)?.animation;
    if (animation !== undefined) {
      running.delete(face);
      animation.onfinish = null;
      animation.oncancel = null;
      animation.cancel();
    }
    return current;
  }

  /** Moves `face` from its current offset to `target` over `ms` (0: written at once). */
  function part(face: HTMLElement, target: Offset, ms: number): void {
    if (heading(face, target)) return;
    const animating = running.has(face);
    const current = take(face);
    if (!animating && near(current, target)) return;
    const end = near(target, REST) ? '' : translate(target.dx, target.dy);
    face.style.transform = end;
    if (ms > 0) {
      const to = end === '' ? translate(0, 0) : end;
      track(
        face,
        face.animate([{ transform: translate(current.dx, current.dy) }, { transform: to }], {
          duration: ms,
          easing: 'ease-out',
        }),
        target,
      );
    }
    settle();
  }

  /**
   * A face off rest returns over `ms`; under reduced motion its transform clears and it fades in
   * (fly-back.ts), except a D-block mirror (`mirror`), whose parting shift clears at once with no
   * animation (AD-14: a mirror never fades).
   */
  function home(face: HTMLElement, ms: number, reduced: boolean, mirror = false): void {
    if (heading(face, REST)) return;
    const animating = running.has(face);
    const current = take(face);
    if (!animating && near(current, REST)) return;
    face.style.transform = '';
    if (reduced && mirror) {
      settle();
      return;
    }
    track(
      face,
      reduced
        ? face.animate([{ opacity: 0 }, { opacity: 1 }], { duration: ms })
        : face.animate(
            [{ transform: translate(current.dx, current.dy) }, { transform: translate(0, 0) }],
            { duration: ms, easing: 'ease-out' },
          ),
      REST,
    );
  }

  /** Completes every running animation at once; the gate count leaves synchronously. */
  function finishAll(): void {
    for (const { animation } of running.values()) {
      animation.onfinish = null;
      animation.finish();
    }
    running.clear();
    settle();
  }

  return { part, home, finishAll, running: (): boolean => running.size > 0 };
}
