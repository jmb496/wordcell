// AD-12 drop targets (SPEC CAP-7, build-notes CAP-4): `use:dropTarget={{ kind: 'column', id }}` on
// each whole column slot registers its element; the controller reads `columnTargets()` on every
// drag move and measures each element's live `getBoundingClientRect()` as the candidates. Order is
// registration order; `update` replaces the entry, `destroy` removes it; a second registration of
// the same element or column id throws (rule 6).

export type DropTargetParams = { readonly kind: 'column'; readonly id: number };

export type ColumnTarget = { readonly id: number; readonly el: Element };

let targets: ColumnTarget[] = [];

function check(el: Element, id: number): void {
  for (const t of targets) {
    if (t.el === el) throw new Error('AD-12 dropTarget element registered twice');
    if (t.id === id) throw new Error(`AD-12 dropTarget column ${id} registered twice`);
  }
}

export function dropTarget(
  node: Element,
  params: DropTargetParams,
): { update(next: DropTargetParams): void; destroy(): void } {
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
