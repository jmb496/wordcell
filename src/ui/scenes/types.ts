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
  /** After `after` commands, the engine's `canValidate` (R-38); the UI draws Validate from it. */
  readonly validatable?: readonly { readonly after: number; readonly canValidate: boolean }[];
}

export interface Point {
  readonly x: number;
  readonly y: number;
}

export type StepType = 'grab' | 'move' | 'drop' | 'fly' | 'tap';

export interface Step {
  readonly type: StepType;
  /** A scene-local target id: where the pointer ghost goes. */
  readonly target: string;
  /** The motion.ts kind of this step (never literal ms, AD-10). */
  readonly kind: MotionKind;
  /** The step's duration is `times` multiples of `duration(kind)` (default 1). */
  readonly times?: number;
  /** A hold before the step starts: `times` multiples of `duration(kind)`. */
  readonly wait?: { readonly kind: MotionKind; readonly times: number };
  /** The fixture command this step animates; its type must fit the step's (script.ts). */
  readonly command?: number;
  /** After the step: `show` fades in, `hide` fades out, over `kind`. */
  readonly reveal?: {
    readonly show: string;
    readonly hide: readonly string[];
    readonly kind: MotionKind;
  };
}

/**
 * One reduced-motion frame: where the carried tail is and whether the tray is open. The optional
 * fields draw the open tray (epic 8 ticket 2): the tile letters in tray order, the destination
 * block's size `k` and `side`, Validate (`pressed` on the tap), and WordCell 6's top card (`top`)
 * or its borrowed state (`used`, R-33).
 */
export interface Frame {
  readonly tail: 'home' | 'lifted' | 'over' | 'gone';
  readonly tray: boolean;
  readonly order?: readonly string[];
  readonly k?: number;
  readonly side?: 'left' | 'right';
  readonly validate?: 'off' | 'lit' | 'pressed';
  readonly cell6?: 'top' | 'used';
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
  /** Stage top-left points: where the tail and the D cards sit before the play, and where they fly to in the tray. */
  readonly layout: {
    readonly tailHome: Point;
    readonly destHome: Point;
    readonly trayTail: Point;
    readonly trayDest: Point;
    /** The tray tile pitch when it is not SLOT (scenes with the controls row). */
    readonly traySlot?: number;
  };
}
