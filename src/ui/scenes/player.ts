import type { MotionKind } from '../motion';
import { type Effect, sceneEffects } from './effects';
import type { Scene } from './types';

// Epic 8 ticket 1 (HP-1): runs a scene's steps as WAAPI animations in a loop with a rest, pausing
// on a tap and restarting on the next (owner decision 2026-10-16). The player is DOM-free: the
// component injects `deps`. Hidden pages (AD-9): no listener here; at every step and loop boundary
// the player reads `deps.hidden()`, cancels and waits on `deps.whenVisible()` (the game store's),
// then restarts at step 1.

export interface AnimationHandle {
  readonly finished: Promise<unknown>;
  pause(): void;
  cancel(): void;
}

export interface PlayerDeps {
  /** Animates the scene element `element` (an id of `scene.elements`) over `ms`, filling forwards. */
  animate(element: string, keyframes: Keyframe[], ms: number, id: string): AnimationHandle;
  duration(kind: MotionKind): number;
  hidden(): boolean;
  whenVisible(): Promise<void>;
}

export type RunState = 'playing' | 'paused';

/** The rest between loops in ms: `rest.times` multiples of an existing `duration()` kind. */
export function restMs(scene: Scene, duration: (kind: MotionKind) => number): number {
  return duration(scene.rest.kind) * scene.rest.times;
}

export class ScenePlayer {
  state: RunState = 'playing';
  private run = 0;
  private live: AnimationHandle[] = [];
  private readonly effects: readonly (readonly Effect[])[];

  constructor(
    private readonly scene: Scene,
    private readonly deps: PlayerDeps,
    private readonly onstate: (state: RunState) => void,
  ) {
    this.effects = sceneEffects(scene);
  }

  /** Starts (or restarts) at step 1. */
  start(): void {
    this.run++;
    this.cancelAll();
    this.setState('playing');
    void this.loop(this.run);
  }

  /** A tap: pauses while playing, restarts from step 1 while paused. */
  toggle(): void {
    if (this.state === 'playing') {
      for (const animation of this.live) animation.pause();
      this.setState('paused');
    } else this.start();
  }

  destroy(): void {
    this.run++;
    this.cancelAll();
  }

  private setState(state: RunState): void {
    this.state = state;
    this.onstate(state);
  }

  private cancelAll(): void {
    for (const animation of this.live) animation.cancel();
    this.live = [];
  }

  private async play(
    items: readonly Effect[],
    id: string,
    ms: (e: Effect) => number,
  ): Promise<void> {
    const animations = items.map((e) => this.deps.animate(e.element, e.keyframes, ms(e), id));
    this.live.push(...animations);
    await Promise.all(animations.map((a) => a.finished));
  }

  /** True when the page is hidden: stops, then restarts once visible again. */
  private async hiddenStop(run: number): Promise<boolean> {
    if (!this.deps.hidden()) return false;
    this.cancelAll();
    await this.deps.whenVisible();
    // A tap during the wait paused the scene: it stays paused until the next tap.
    if (run === this.run && this.state === 'playing') this.start();
    return true;
  }

  private async loop(run: number): Promise<void> {
    try {
      for (;;) {
        for (let i = 0; i < this.scene.steps.length; i++) {
          if (await this.hiddenStop(run)) return;
          const id = `${this.scene.id}-step-${i}`;
          for (const phase of [0, 1] as const) {
            const items = this.effects[i].filter((e) => e.phase === phase);
            if (items.length > 0) await this.play(items, id, (e) => this.deps.duration(e.kind));
          }
        }
        if (await this.hiddenStop(run)) return;
        const rest: Effect = {
          element: 'stage',
          keyframes: [{ opacity: 1 }, { opacity: 1 }],
          kind: this.scene.rest.kind,
          phase: 0,
        };
        await this.play([rest], `${this.scene.id}-rest`, () =>
          restMs(this.scene, this.deps.duration),
        );
        this.cancelAll();
      }
    } catch (error) {
      // A restart or destroy cancels the animations this loop awaits; any other error is a bug.
      if (run === this.run) throw error;
    }
  }
}
