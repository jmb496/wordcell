import type { Scene } from './types';

/**
 * AGENTS rule 6: a bad script throws when it is defined (at load), never falls back: no steps, a
 * step or reveal naming an unknown target or element, a grab or drop without a drop command of the
 * fixture, no frames, or a non-positive rest.
 */
export function defineScene(scene: Scene): Scene {
  const where = `scene ${scene.id}`;
  if (scene.steps.length === 0) throw new Error(`${where}: no steps`);
  if (scene.frames.length === 0) throw new Error(`${where}: no frames`);
  if (!(scene.rest.times > 0)) throw new Error(`${where}: the rest must be positive`);
  for (const [i, step] of scene.steps.entries()) {
    if (!Object.hasOwn(scene.targets, step.target))
      throw new Error(`${where}: step ${i} has unknown target ${step.target}`);
    if (step.type === 'grab' || step.type === 'drop') {
      const command = step.command === undefined ? undefined : scene.fixture.commands[step.command];
      if (command?.type !== 'drop')
        throw new Error(`${where}: step ${i} (${step.type}) names no fixture drop command`);
    }
    for (const id of step.reveal ? [step.reveal.show, ...step.reveal.hide] : [])
      if (!scene.elements.includes(id))
        throw new Error(`${where}: step ${i} reveals unknown element ${id}`);
  }
  return scene;
}
