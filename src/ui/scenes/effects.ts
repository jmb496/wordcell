import type { MotionKind } from '../motion';
import {
  CARD_W,
  FACE_MARGIN,
  HAND_TIP,
  LIFT,
  PLACE_CELL_TOP,
  placeCellX,
  RICH_SLOT,
  RICH_TILE_W,
  SLOT,
  STRIP,
  STRIP_TOP,
  stripTileX,
} from './geometry';
import type { Frame, Point, Scene } from './types';

/** One element's keyframes inside a step; `phase` 1 runs after every phase 0 effect finished. */
export interface Effect {
  readonly element: string;
  readonly keyframes: Keyframe[];
  readonly kind: MotionKind;
  /** The duration in multiples of `duration(kind)`. */
  readonly times: number;
  readonly phase: 0 | 1;
  /** The animation's effect-level easing (absent: the player's default, ease-in-out). */
  readonly easing?: string;
}

/** Where tuck flier `k` starts: the strip tile's place in the place layers' frame (ticket 8). */
export const tuckStart = (k: number): string =>
  `translate(${stripTileX(k)}px, ${STRIP_TOP}px) scale(1, 1)`;
/** Where every flier ends: WordCell `cell`'s top-card face (only x scales, tile face 36 to 40). */
export const tuckEnd = (cell: number): string => {
  const sx = CARD_W / RICH_TILE_W;
  return `translate(${placeCellX(cell) + FACE_MARGIN - FACE_MARGIN * sx}px, ${PLACE_CELL_TOP}px) scale(${sx}, 1)`;
};

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
  // Where the tail wrapper and the D block rest relative to their homes.
  const carries: Record<'tail' | 'dest', Point> = { tail: { x: 0, y: 0 }, dest: { x: 0, y: 0 } };
  // The element the pointer carries: the tail, or (a `lifts: 'dest'` carry) the D block.
  let mover: 'tail' | 'dest' = 'tail';
  // After the fly the carried cards are in the tray: later moves are only the pointer's. A landed or
  // carry-less scene draws no tail at all.
  let flown = scene.carry === undefined || scene.carry.landed === true;
  // Where the flown elements rest in the tray (their transform), so an undo can send them back.
  let flownAt = new Map<string, string>();
  // The ghost fades in with its first movement.
  let shown = false;
  return scene.steps.map((step): Effect[] => {
    const to = scene.targets[step.target];
    const from = pointer;
    pointer = to;
    const effects: Effect[] = [];
    const ghost = (): Effect => {
      const fade: [number, number] | undefined = shown ? undefined : [0, 1];
      shown = true;
      return {
        element: 'ghost',
        keyframes: [
          { transform: ghostAt(from), ...(fade ? { opacity: fade[0] } : {}) },
          { transform: ghostAt(to), ...(fade ? { opacity: fade[1] } : {}) },
        ],
        kind: step.kind,
        times: step.times ?? 1,
        phase: 0,
      };
    };
    const carried = (next: Point): Effect => {
      const before = carries[mover];
      carries[mover] = next;
      return {
        element: mover,
        keyframes: [{ transform: at(before) }, { transform: at(next) }],
        kind: step.kind,
        times: step.times ?? 1,
        phase: 0,
      };
    };
    switch (step.type) {
      case 'grab':
        mover = step.carry?.lifts === 'dest' ? 'dest' : 'tail';
        effects.push(ghost(), carried(add(carries[mover], { x: 0, y: -LIFT })));
        break;
      case 'move':
        effects.push(ghost(), ...(flown ? [] : [carried(add(carries[mover], sub(to, from)))]));
        break;
      case 'drop':
        effects.push(carried(add(carries[mover], { x: 0, y: LIFT })));
        break;
      case 'fly': {
        if (step.tucks !== undefined) {
          // Epic 8 ticket 8 (R-51, R-52): each card flies in its own sixth of six multiples, leftmost
          // first, onto the cell's top-card face; the final frame then replaces the fliers.
          const { cell, letters } = step.tucks;
          const placed = scene.frames.findLast((f) => f.placeOrder !== undefined);
          if (placed === undefined)
            throw new Error(`scene ${scene.id}: a tucks step needs a placeOrder frame`);
          const stripId = `strip-${scene.frames.indexOf(placed)}`;
          const n = letters.length;
          const whole = { kind: step.kind, times: n } as const;
          const hold = (element: string, opacity: number): Effect => ({
            element,
            keyframes: [{ opacity }, { opacity }],
            kind: step.kind,
            times: n,
            phase: 0,
          });
          const swap = (element: string, opacity: number): Effect => ({
            element,
            keyframes: [{ opacity }, { opacity }],
            kind: 'overlay',
            times: 1,
            phase: 1,
          });
          effects.push({
            element: 'ghost',
            keyframes: [
              { transform: ghostAt(to), opacity: 1 },
              { transform: ghostAt(to), opacity: 0 },
            ],
            kind: step.kind,
            times: 1,
            phase: 0,
          });
          effects.push(hold('tuck', 1), hold(stripId, 0), hold('confirm', 0));
          letters.forEach((_, k) => {
            const start = tuckStart(k);
            const end = tuckEnd(cell);
            const frames: Keyframe[] = [
              ...(k === 0 ? [] : [{ offset: 0, transform: start }]),
              { offset: k / n, transform: start, easing: 'ease-in-out' },
              { offset: (k + 1) / n, transform: end },
              ...(k === n - 1 ? [] : [{ offset: 1, transform: end }]),
            ];
            effects.push({
              element: `tuck-${k}`,
              keyframes: frames,
              ...whole,
              phase: 0,
              easing: 'linear',
            });
          });
          effects.push(swap(`place-${scene.frames.length - 1}`, 1), swap('tuck', 0));
          break;
        }
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
        const fly = (element: string, start: Point, end: Point): void => {
          flownAt.set(element, at(end));
          effects.push({
            element,
            keyframes: [{ transform: at(start) }, { transform: at(end) }],
            kind: step.kind,
            times: step.times ?? 1,
            phase: 0,
          });
        };
        flown = true;
        // Each tail card flies on its own, from its place in the stack (j strips down the
        // wrapper, which rests at its carry) to its own place in the tray row; the D block, which
        // may itself be the lifted element, flies to the start of the row.
        if (mover === 'tail') {
          // The wrapper itself only fades out (the reveal); an undo returns it from where it rests.
          flownAt.set('tail', at(carries.tail));
          const slot = scene.layout.traySlot ?? SLOT;
          const resting = add(tailHome, carries.tail);
          for (let j = 0; j < scene.carry.count; j++)
            fly(
              `tail-${j}`,
              { x: 0, y: 0 },
              sub(
                { x: trayTail.x + j * slot, y: trayTail.y },
                add(resting, { x: 0, y: j * STRIP }),
              ),
            );
        }
        fly('dest', carries.dest, sub(trayDest, destHome));
        break;
      }
      case 'tap':
        effects.push(ghost());
        break;
      case 'arrange': {
        // Epic 8 ticket 7: the pointer does not drag every card. It fades out, the new frame's
        // layer replaces the old one in place, and each moved tile glides from its place in the
        // previous frame's `order` to its place in this one (one step, one glide).
        const layer = step.reveal?.show ?? '';
        const frame = Number(/^tray-(\d+)$/.exec(layer)?.[1]);
        const before = scene.frames[frame - 1]?.order;
        const after = scene.frames[frame]?.order;
        if (before === undefined || after === undefined)
          throw new Error(
            `scene ${scene.id}: an arrange step needs tray frames ${frame - 1}, ${frame}`,
          );
        const times = step.times ?? 1;
        effects.push(
          {
            element: 'ghost',
            keyframes: [{ opacity: 1 }, { opacity: 0 }],
            kind: step.kind,
            times,
            phase: 0,
          },
          {
            element: layer,
            keyframes: [{ opacity: 1 }, { opacity: 1 }],
            kind: step.kind,
            times,
            phase: 0,
          },
        );
        const taken = new Set<number>();
        after.forEach((letter, j) => {
          const from = before.findIndex((l, i) => l === letter && !taken.has(i));
          if (from < 0) throw new Error(`scene ${scene.id}: arrange has no ${letter} before`);
          taken.add(from);
          if (from === j) return;
          effects.push({
            element: `${layer}-tile-${j}`,
            keyframes: [
              { transform: at({ x: (from - j) * RICH_SLOT, y: 0 }) },
              { transform: at({ x: 0, y: 0 }) },
            ],
            kind: step.kind,
            times,
            phase: 0,
          });
        });
        break;
      }
    }
    if (step.reveal) {
      const undone =
        step.command !== undefined && scene.fixture.commands[step.command]?.type === 'undo';
      // An undo sends what flew into the tray back to its column while the tray fades out.
      if (undone) {
        for (const [element, end] of flownAt) {
          const fades = !element.startsWith('tail-');
          effects.push({
            element,
            keyframes: [
              { transform: end, ...(fades ? { opacity: 0 } : {}) },
              { transform: at({ x: 0, y: 0 }), ...(fades ? { opacity: 1 } : {}) },
            ],
            kind: step.reveal.kind,
            times: 1,
            phase: 1,
          });
        }
        carries.tail = { x: 0, y: 0 };
        carries.dest = { x: 0, y: 0 };
        flown = false;
        flownAt = new Map();
      }
      if (step.reveal.show !== undefined && step.type !== 'arrange')
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

/**
 * A reduced-motion frame's D block: `lifted` raises it, `gone` hides it (it is in the tray), absent
 * leaves it at home (epic 8 ticket 4; earlier scenes name no `dest` and keep it drawn).
 */
export function frameDest(frame: Frame): { transform?: string; hidden: boolean } {
  switch (frame.dest) {
    case 'lifted':
      return { transform: at({ x: 0, y: -LIFT }), hidden: false };
    case 'gone':
      return { hidden: true };
    case undefined:
      return { hidden: false };
  }
}
