import type { MotionKind } from '../motion';
import { HAND_TIP, LIFT, SLOT, STRIP } from './geometry';
import type { Frame, Point, Scene } from './types';

/** One element's keyframes inside a step; `phase` 1 runs after every phase 0 effect finished. */
export interface Effect {
  readonly element: string;
  readonly keyframes: Keyframe[];
  readonly kind: MotionKind;
  /** The duration in multiples of `duration(kind)`. */
  readonly times: number;
  readonly phase: 0 | 1;
}

const at = (p: Point): string => `translate(${p.x}px, ${p.y}px)`;
const ghostAt = (p: Point): string => at({ x: p.x - HAND_TIP.x, y: p.y - HAND_TIP.y });
const add = (a: Point, b: Point): Point => ({ x: a.x + b.x, y: a.y + b.y });
const sub = (a: Point, b: Point): Point => ({ x: a.x - b.x, y: a.y - b.y });

/** The ghost's resting transform, before any step (it starts hidden at the `rest` target). */
export function ghostStart(scene: Scene): string {
  return ghostAt(scene.targets.rest);
}

/**
 * The effects of every step in order, walking the pointer from target to target and the carried
 * tail with it: grab presses and lifts the tail, move carries it, drop lowers it, fly sends the tail
 * and the D cards down into the tray, and a reveal fades the next part in.
 */
export function sceneEffects(scene: Scene): readonly (readonly Effect[])[] {
  let pointer = scene.targets.rest;
  let carry: Point = { x: 0, y: 0 };
  // After the fly the tail is in the tray: later moves are only the pointer's. A landed or
  // carry-less scene draws no tail at all.
  let flown = scene.carry === undefined || scene.carry.landed === true;
  // The ghost fades in with its first movement.
  let shown = false;
  return scene.steps.map((step): Effect[] => {
    const to = scene.targets[step.target];
    const from = pointer;
    pointer = to;
    const effects: Effect[] = [];
    const ghost = (opacity?: [number, number]): Effect => {
      const fade: [number, number] | undefined = opacity ?? (shown ? undefined : [0, 1]);
      shown = true;
      return ghostEffect(fade);
    };
    const ghostEffect = (opacity?: [number, number]): Effect => ({
      element: 'ghost',
      keyframes: [
        { transform: ghostAt(from), ...(opacity ? { opacity: opacity[0] } : {}) },
        { transform: ghostAt(to), ...(opacity ? { opacity: opacity[1] } : {}) },
      ],
      kind: step.kind,
      times: step.times ?? 1,
      phase: 0,
    });
    const tail = (next: Point): Effect => {
      const before = carry;
      carry = next;
      return {
        element: 'tail',
        keyframes: [{ transform: at(before) }, { transform: at(next) }],
        kind: step.kind,
        times: step.times ?? 1,
        phase: 0,
      };
    };
    switch (step.type) {
      case 'grab':
        effects.push(ghost([0, 1]), tail(add(carry, { x: 0, y: -LIFT })));
        break;
      case 'move':
        effects.push(ghost(), ...(flown ? [] : [tail(add(carry, sub(to, from)))]));
        break;
      case 'drop':
        effects.push(tail(add(carry, { x: 0, y: LIFT })));
        break;
      case 'fly': {
        if (step.flies !== undefined) {
          const { element, by } = step.flies;
          effects.push({
            element,
            keyframes: [
              { transform: at({ x: 0, y: 0 }), opacity: 1 },
              { transform: at(by), opacity: 0 },
            ],
            kind: step.kind,
            times: step.times ?? 1,
            phase: 0,
          });
          break;
        }
        if (scene.carry === undefined || scene.layout === undefined)
          throw new Error(`scene ${scene.id}: a fly step needs a carry and a layout, or flies`);
        const { tailHome, destHome, trayTail, trayDest } = scene.layout;
        // Each tail card flies on its own, from its place in the stack (j strips down the
        // wrapper, which rests at `carry`) to its own place in the tray row.
        flown = true;
        const slot = scene.layout.traySlot ?? SLOT;
        const resting = add(tailHome, carry);
        for (let j = 0; j < scene.carry.count; j++)
          effects.push({
            element: `tail-${j}`,
            keyframes: [
              { transform: at({ x: 0, y: 0 }) },
              {
                transform: at(
                  sub(
                    { x: trayTail.x + j * slot, y: trayTail.y },
                    add(resting, { x: 0, y: j * STRIP }),
                  ),
                ),
              },
            ],
            kind: step.kind,
            times: step.times ?? 1,
            phase: 0,
          });
        effects.push({
          element: 'dest',
          keyframes: [
            { transform: at({ x: 0, y: 0 }) },
            { transform: at(sub(trayDest, destHome)) },
          ],
          kind: step.kind,
          times: step.times ?? 1,
          phase: 0,
        });
        break;
      }
      case 'tap':
        effects.push(ghost());
        break;
    }
    if (step.reveal) {
      effects.push({
        element: step.reveal.show,
        keyframes: [{ opacity: 0 }, { opacity: 1 }],
        kind: step.reveal.kind,
        times: 1,
        phase: 1,
      });
      for (const element of step.reveal.hide)
        effects.push({
          element,
          keyframes: [{ opacity: 1 }, { opacity: 0 }],
          kind: step.reveal.kind,
          times: 1,
          phase: 1,
        });
    }
    return effects;
  });
}

/** A reduced-motion frame's tail transform; `undefined` when the tail is gone (it is in the tray). */
export function frameTail(scene: Scene, frame: Frame): string | undefined {
  switch (frame.tail) {
    case 'home':
      return at({ x: 0, y: 0 });
    case 'lifted':
      return at({ x: 0, y: -LIFT });
    case 'over':
      if (scene.offset === undefined)
        throw new Error(`scene ${scene.id}: an over frame needs an offset`);
      return at(add(scene.offset, { x: 0, y: -LIFT }));
    case 'gone':
      return undefined;
  }
}
