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
  /** The engine's live score after `after` commands (R-80); the scoring scene draws its total. */
  readonly scores?: readonly { readonly after: number; readonly score: number }[];
  /** After `after` commands, the draft's D block size and side (R-31); the frames' `k` and `side` equal it. */
  readonly block?: readonly {
    readonly after: number;
    readonly k: number;
    readonly side: string;
  }[];
  /** After `after` commands, cell `cell` holds `cards` (letters bottom to top; epic 8 ticket 3). */
  readonly cells?: readonly {
    readonly after: number;
    readonly cell: number;
    readonly cards: readonly string[];
  }[];
  /** After `after` commands in the Place phase: target, legal targets, order (CardIds, R-51). */
  readonly place?: readonly {
    readonly after: number;
    readonly target: number;
    readonly legalTargets: readonly number[];
    readonly order: readonly number[];
  }[];
  /** After `after` commands, cell `cell` scores `score` (letters x number, R-80). */
  readonly cellScores?: readonly {
    readonly after: number;
    readonly cell: number;
    readonly score: number;
  }[];
}

export interface Point {
  readonly x: number;
  readonly y: number;
}

export type StepType = 'grab' | 'move' | 'drop' | 'fly' | 'tap';

/**
 * A column move a scene draws: the tail of `count` cards from `sourceColumn`, the `destinationCount`
 * destination cards (R-31) that join from `destinationColumn`. `landed`: the move is already done,
 * so the destination column is drawn whole (D block, then the tail) and `dest` and `tail` are not
 * drawn. `lifts: 'dest'` (epic 8 ticket 4, a `Step.carry` only): the pointer carries the scene's D
 * block (the primary carry's destination cards) instead of the tail.
 */
export interface Carry {
  readonly sourceColumn: number;
  readonly count: number;
  readonly destinationColumn: number;
  readonly destinationCount: number;
  readonly landed?: boolean;
  readonly lifts?: 'dest';
}

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
  /**
   * A grab or drop that carries something other than `Scene.carry` (absent: `Scene.carry`); its
   * source, count and destination are pinned to the fixture drop command the step names.
   */
  readonly carry?: Carry;
  /**
   * A `fly` in a scene whose tail has already landed: `element` slides by `by` and fades out
   * (the placement strip flying to its WordCell).
   */
  readonly flies?: { readonly element: string; readonly by: Point };
  /** After the step: `show` fades in, `hide` fades out, over `kind`. */
  readonly reveal?: {
    readonly show?: string;
    readonly hide: readonly string[];
    readonly kind: MotionKind;
  };
}

/**
 * One reduced-motion frame: where the carried tail is and whether the tray is open. The optional
 * fields draw the open tray (epic 8 ticket 2): the tile letters in tray order, the destination
 * block's size `k` and `side`, Validate (`pressed` on the tap), and WordCell 6's top card (`top`)
 * or its borrowed state (`used`, R-33). The place and scoring scenes (epic 8 ticket 3) add the
 * placement strip (`placeTarget` the selected WordCell, `lit` the legal ones, `placeOrder` the
 * letters bottom to top) and the scoring figures (`numbers` per-cell scores shown, `total`). The
 * Tricky rules scenes (epic 8 ticket 4) add `used` (WordCells 3 to 5 whose top card is borrowed,
 * dimmed in the frame its letter is added, R-33) and `dest` (the D block: lifted, or gone into the
 * tray; absent: at home).
 */
export interface Frame {
  readonly tail: 'home' | 'lifted' | 'over' | 'gone';
  readonly tray: boolean;
  readonly order?: readonly string[];
  readonly k?: number;
  readonly side?: 'left' | 'right';
  readonly validate?: 'off' | 'lit' | 'pressed';
  readonly cell6?: 'top' | 'used';
  readonly used?: readonly number[];
  readonly dest?: 'lifted' | 'gone';
  readonly placeTarget?: number;
  readonly lit?: readonly number[];
  readonly placeOrder?: readonly string[];
  readonly numbers?: number;
  readonly total?: number;
}

export interface Scene {
  readonly id: string;
  readonly fixture: SceneFixtureData;
  /** The figure's visible description (text.ts). */
  readonly caption: string;
  /**
   * The tail the pointer carries; `destinationCount` is the D block that joins (R-31). Absent in a
   * scene that draws no column move (scoring).
   */
  readonly carry?: Carry;
  readonly targets: Readonly<Record<string, Point>>;
  /** Scene-local element ids the player may animate (`data-scene-el`). */
  readonly elements: readonly string[];
  readonly steps: readonly Step[];
  /** The rest between loops: `times` multiples of `duration(kind)`. */
  readonly rest: { readonly kind: MotionKind; readonly times: number };
  readonly frames: readonly Frame[];
  /** The tail's offset from its column to the landing place (scenes that carry a tail). */
  readonly offset?: Point;
  /** Stage top-left points: where the tail and the D cards sit before the play, and where they fly to in the tray. */
  readonly layout?: {
    readonly tailHome: Point;
    readonly destHome: Point;
    readonly trayTail: Point;
    readonly trayDest: Point;
    /** The tray tile pitch when it is not SLOT (scenes with the controls row). */
    readonly traySlot?: number;
  };
}
