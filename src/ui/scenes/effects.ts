import type { MotionKind } from '../motion';
import { GHOST, LIFT } from './geometry';
import type { Frame, Point, Scene } from './types';

/** One element's keyframes inside a step; `phase` 1 runs after every phase 0 effect finished. */
export interface Effect {
  readonly element: string;
  readonly keyframes: Keyframe[];
  readonly kind: MotionKind;
  readonly phase: 0 | 1;
}

const at = (p: Point): string => `translate(${p.x}px, ${p.y}px)`;
const ghostAt = (p: Point): string => at({ x: p.x - GHOST / 2, y: p.y - GHOST / 2 });
const add = (a: Point, b: Point): Point => ({ x: a.x + b.x, y: a.y + b.y });
const sub = (a: Point, b: Point): Point => ({ x: a.x - b.x, y: a.y - b.y });

/** The ghost's resting transform, before any step (it starts hidden at the `rest` target). */
export function ghostStart(scene: Scene): string {
  return ghostAt(scene.targets.rest);
}

/**
 * The effects of every step in order, walking the pointer from target to target and the carried
 * tail with it: grab presses and lifts the tail, move carries it, drop lowers it and then reveals.
 */
export function sceneEffects(scene: Scene): readonly (readonly Effect[])[] {
  let pointer = scene.targets.rest;
  let carry: Point = { x: 0, y: 0 };
  return scene.steps.map((step): Effect[] => {
    const to = scene.targets[step.target];
    const from = pointer;
    pointer = to;
    const effects: Effect[] = [];
    const ghost = (opacity?: [number, number]): Effect => ({
      element: 'ghost',
      keyframes: [
        { transform: ghostAt(from), ...(opacity ? { opacity: opacity[0] } : {}) },
        { transform: ghostAt(to), ...(opacity ? { opacity: opacity[1] } : {}) },
      ],
      kind: step.kind,
      phase: 0,
    });
    const tail = (next: Point): Effect => {
      const before = carry;
      carry = next;
      return {
        element: 'tail',
        keyframes: [{ transform: at(before) }, { transform: at(next) }],
        kind: step.kind,
        phase: 0,
      };
    };
    switch (step.type) {
      case 'grab':
        effects.push(ghost([0, 1]), tail(add(carry, { x: 0, y: -LIFT })));
        break;
      case 'move':
        effects.push(ghost(), tail(add(carry, sub(to, from))));
        break;
      case 'drop':
        effects.push(tail(add(carry, { x: 0, y: LIFT })));
        break;
      case 'tap':
        effects.push(ghost());
        break;
    }
    if (step.reveal) {
      effects.push({
        element: step.reveal.show,
        keyframes: [{ opacity: 0 }, { opacity: 1 }],
        kind: step.reveal.kind,
        phase: 1,
      });
      for (const element of step.reveal.hide)
        effects.push({
          element,
          keyframes: [{ opacity: 1 }, { opacity: 0 }],
          kind: step.reveal.kind,
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
      return at(add(scene.offset, { x: 0, y: -LIFT }));
    case 'gone':
      return undefined;
  }
}
