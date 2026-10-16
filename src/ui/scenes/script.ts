import type { Scene, StepType } from './types';

/** The fixture command types a step of each kind may animate (a step without one is only motion). */
const COMMAND_TYPES: Record<StepType, readonly string[]> = {
  grab: ['drop'],
  drop: ['drop'],
  move: ['arrange'],
  fly: [],
  tap: ['addFreeLetter', 'validate', 'setDestinationCount', 'flip'],
};

/**
 * AGENTS rule 6: a bad script throws when it is defined (at load), never falls back: no steps, a
 * step or reveal naming an unknown target or element, a grab or drop without a drop command of the
 * fixture, no frames, a step whose command does not fit its type, or a non-positive rest.
 */
export function defineScene(scene: Scene): Scene {
  const where = `scene ${scene.id}`;
  if (scene.steps.length === 0) throw new Error(`${where}: no steps`);
  if (scene.frames.length === 0) throw new Error(`${where}: no frames`);
  if (!(scene.rest.times > 0)) throw new Error(`${where}: the rest must be positive`);
  for (const [i, step] of scene.steps.entries()) {
    if (!Object.hasOwn(scene.targets, step.target))
      throw new Error(`${where}: step ${i} has unknown target ${step.target}`);
    const command = step.command === undefined ? undefined : scene.fixture.commands[step.command];
    if (step.type === 'grab' || step.type === 'drop') {
      if (command?.type !== 'drop')
        throw new Error(`${where}: step ${i} (${step.type}) names no fixture drop command`);
    } else if (step.command !== undefined) {
      const allowed = COMMAND_TYPES[step.type];
      if (command === undefined || !allowed.includes(command.type))
        throw new Error(
          `${where}: step ${i} (${step.type}) names fixture command ${step.command}, not a ${allowed.join(' or ')}`,
        );
    }
    for (const id of step.reveal ? [step.reveal.show, ...step.reveal.hide] : [])
      if (!scene.elements.includes(id))
        throw new Error(`${where}: step ${i} reveals unknown element ${id}`);
  }
  return scene;
}
