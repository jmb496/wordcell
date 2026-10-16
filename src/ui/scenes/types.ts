import type { MotionKind } from '../motion';

// Epic 8 ticket 1 (HP-1, HP-5): the scene script types. A script is data: the fixture it animates
// (`fixtures/how-to-play-*.json`, replayed through the engine by `src/engine/how-to-play-scenes.test.ts`),
// scene-local target points, and the steps. Positions are px on the scene stage (geometry.ts).

/** The part of a scene fixture the UI reads; the engine harness holds the full shape (AD-1). */
export interface SceneFixtureData {
  readonly scene: string;
  readonly start: {
    readonly columns: readonly (readonly string[])[];
    readonly cells?: Readonly<Record<string, readonly string[]>>;
  };
  readonly commands: readonly { readonly type: string; readonly [key: string]: unknown }[];
}

export interface Point {
  readonly x: number;
  readonly y: number;
}

export type StepType = 'grab' | 'move' | 'drop' | 'tap';

export interface Step {
  readonly type: StepType;
  /** A scene-local target id: where the pointer ghost goes. */
  readonly target: string;
  /** The motion.ts kind of this step (never literal ms, AD-10). */
  readonly kind: MotionKind;
  /** The fixture command a grab or drop step animates. */
  readonly command?: number;
  /** After the step: `show` fades in, `hide` fades out, over `kind`. */
  readonly reveal?: {
    readonly show: string;
    readonly hide: readonly string[];
    readonly kind: MotionKind;
  };
}

/** One reduced-motion frame: where the carried tail is and whether the tray is open. */
export interface Frame {
  readonly tail: 'home' | 'lifted' | 'over' | 'gone';
  readonly tray: boolean;
}

export interface Scene {
  readonly id: string;
  readonly fixture: SceneFixtureData;
  /** The figure's visible description (text.ts). */
  readonly caption: string;
  /** The tail the pointer carries; `destinationCount` is the D block that joins (R-31). */
  readonly carry: {
    readonly sourceColumn: number;
    readonly count: number;
    readonly destinationColumn: number;
    readonly destinationCount: number;
  };
  readonly targets: Readonly<Record<string, Point>>;
  /** Scene-local element ids the player may animate (`data-scene-el`). */
  readonly elements: readonly string[];
  readonly steps: readonly Step[];
  /** The rest between loops: `times` multiples of `duration(kind)`. */
  readonly rest: { readonly kind: MotionKind; readonly times: number };
  readonly frames: readonly Frame[];
  /** The tail's offset from its column to the landing place. */
  readonly offset: Point;
}
