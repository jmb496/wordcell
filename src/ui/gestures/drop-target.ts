// AD-12 drop targets (SPEC CAP-7, build-notes CAP-4): `use:dropTarget={{ kind: 'column', id }}` on
// each whole column slot registers its element; the controller reads `columnTargets()` on every
// drag move and measures each element's live `getBoundingClientRect()` as the candidates. Order is
// registration order; `update` replaces the entry, `destroy` removes it; a second registration of
// the same element or column id throws (rule 6). Epic 5 SPEC CAP-5: `use:dropTarget={{ kind:
// 'tray' }}` on `[data-band="tray"]` registers the one tray band target, kept apart from the
// columns (`columnTargets()` never lists it) and read by `trayTarget()`, which throws with none; a
// second tray registration, or an `update` that changes the kind, throws.

export type DropTargetParams =
  | { readonly kind: 'column'; readonly id: number }
  | { readonly kind: 'tray' };

export type ColumnTarget = { readonly id: number; readonly el: Element };

let targets: ColumnTarget[] = [];
let tray: Element | null = null;

function check(el: Element, id: number): void {
  if (tray === el) throw new Error('AD-12 dropTarget element registered twice');
  for (const t of targets) {
    if (t.el === el) throw new Error('AD-12 dropTarget element registered twice');
    if (t.id === id) throw new Error(`AD-12 dropTarget column ${id} registered twice`);
  }
}

type Registration = { update(next: DropTargetParams): void; destroy(): void };

function registerTray(node: Element): Registration {
  if (tray !== null) throw new Error('AD-12 dropTarget tray registered twice');
  if (targets.some((t) => t.el === node)) {
    throw new Error('AD-12 dropTarget element registered twice');
  }
  tray = node;
  const own = (): void => {
    if (tray !== node) throw new Error('AD-12 dropTarget used after destroy');
  };
  return {
    update(next: DropTargetParams): void {
      own();
      if (next.kind !== 'tray') throw new Error('AD-12 dropTarget kind changed on update');
    },
    destroy(): void {
      own();
      tray = null;
    },
  };
}

export function dropTarget(node: Element, params: DropTargetParams): Registration {
  if (params.kind === 'tray') return registerTray(node);
  check(node, params.id);
  targets = [...targets, { id: params.id, el: node }];
  const index = (): number => {
    const i = targets.findIndex((t) => t.el === node);
    if (i < 0) throw new Error('AD-12 dropTarget used after destroy');
    return i;
  };
  return {
    update(next: DropTargetParams): void {
      const i = index();
      if (next.kind !== 'column') throw new Error('AD-12 dropTarget kind changed on update');
      const rest = targets.filter((_, j) => j !== i);
      if (rest.some((t) => t.id === next.id)) {
        throw new Error(`AD-12 dropTarget column ${next.id} registered twice`);
      }
      targets = targets.map((t, j) => (j === i ? { id: next.id, el: node } : t));
    },
    destroy(): void {
      const i = index();
      targets = targets.filter((_, j) => j !== i);
    },
  };
}

/** The registered column elements, in registration order. */
export function columnTargets(): readonly ColumnTarget[] {
  return targets;
}

/** Epic 5 SPEC CAP-5: the one registered tray band element. */
export function trayTarget(): Element {
  if (tray === null) throw new Error('AD-12 no tray dropTarget registered');
  return tray;
}
