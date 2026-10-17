import type { Scene, StepType } from './types';

/** The fixture command types a step of each kind may animate (a step without one is only motion). */
const COMMAND_TYPES: Record<StepType, readonly string[]> = {
  grab: ['drop'],
  drop: ['drop'],
  move: ['arrange', 'setPlacementOrder'],
  arrange: ['arrange'],
  fly: [],
  tap: ['addFreeLetter', 'validate', 'setDestinationCount', 'flip', 'setTarget', 'confirm', 'undo'],
};

/**
 * AGENTS rule 6: a bad script throws when it is defined (at load), never falls back: no steps, a
 * step or reveal naming an unknown target or element, a grab or drop without a drop command of the
 * fixture, no frames, a step whose command does not fit its type, a grab or drop whose carry
 * (its own, else the scene's) differs from the fixture drop command it names, a step animating a
 * command below the fixture's `opens` (epic 8 ticket 7), an `arrange` step without its command or
 * its `tray-<frame>` layer (with both frames' orders, one letter multiset, and every
 * `tray-<frame>-tile-<j>` declared), or a non-positive rest.
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
    const carried = scene.carry !== undefined && scene.carry.landed !== true;
    if ((step.type === 'grab' || step.type === 'drop') && !carried)
      throw new Error(`${where}: step ${i} (${step.type}) needs a carry that is not landed`);
    if (
      step.type === 'fly' &&
      carried &&
      (scene.layout === undefined || scene.offset === undefined)
    )
      throw new Error(`${where}: step ${i} (fly) needs an offset and a layout`);
    if (step.type === 'grab' || step.type === 'drop') {
      if (command?.type !== 'drop')
        throw new Error(`${where}: step ${i} (${step.type}) names no fixture drop command`);
      const c = step.carry ?? scene.carry;
      if (
        c === undefined ||
        command.sourceColumn !== c.sourceColumn ||
        command.sourceCount !== c.count ||
        command.destinationColumn !== c.destinationColumn
      )
        throw new Error(
          `${where}: step ${i} (${step.type}) carry differs from fixture drop command`,
        );
      if (
        c.lifts === 'dest' &&
        (scene.carry === undefined ||
          c.sourceColumn !== scene.carry.destinationColumn ||
          c.count !== scene.carry.destinationCount)
      )
        throw new Error(
          `${where}: step ${i} (${step.type}) lifts a D block the scene does not have`,
        );
    } else if (step.command !== undefined) {
      const allowed = COMMAND_TYPES[step.type];
      if (command === undefined || !allowed.includes(command.type))
        throw new Error(
          `${where}: step ${i} (${step.type}) names fixture command ${step.command}, not a ${allowed.join(' or ')}`,
        );
    }
    if (
      step.command !== undefined &&
      scene.fixture.opens !== undefined &&
      step.command < scene.fixture.opens
    )
      throw new Error(
        `${where}: step ${i} animates command ${step.command}, below opens ${scene.fixture.opens}`,
      );
    if (step.type === 'arrange') {
      if (step.command === undefined)
        throw new Error(`${where}: step ${i} (arrange) names no fixture command`);
      if (!/^tray-\d+$/.test(step.reveal?.show ?? ''))
        throw new Error(`${where}: step ${i} (arrange) must reveal its tray-<frame> layer`);
      const layer = step.reveal?.show as string;
      const frame = Number(layer.slice('tray-'.length));
      const before = scene.frames[frame - 1]?.order;
      const after = scene.frames[frame]?.order;
      if (before === undefined || after === undefined)
        throw new Error(
          `${where}: step ${i} (arrange) needs orders on frames ${frame - 1}, ${frame}`,
        );
      if ([...before].sort().join('') !== [...after].sort().join(''))
        throw new Error(
          `${where}: step ${i} (arrange) frames ${frame - 1}, ${frame} differ in letters`,
        );
      for (let j = 0; j < after.length; j++)
        if (!scene.elements.includes(`${layer}-tile-${j}`))
          throw new Error(`${where}: step ${i} (arrange) does not declare ${layer}-tile-${j}`);
    }
    for (const id of step.reveal ? [step.reveal.show ?? [], ...step.reveal.hide].flat() : [])
      if (!scene.elements.includes(id))
        throw new Error(`${where}: step ${i} reveals unknown element ${id}`);
  }
  return scene;
}
