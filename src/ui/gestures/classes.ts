// AD-12 class names and custom properties the pointer controller and its modules write on the DOM
// (epic 5 SPEC CAP-3): the desktop hover classes and the k preview's custom properties on one
// `[data-column]`, the drag ghost, layer and target classes, the root's selection suppression and
// the hover peek's hide class. The single TypeScript source of these names; Column.svelte and
// HoverPeek.svelte CSS cannot import TypeScript and keep the literals, pointing here by comment.
// `lifted` stays a Card-owned literal.

export const HOVER_TAIL = 'wc-hover-tail';
export const GRAB = 'wc-grab';
export const DROP = 'wc-drop';
export const DROP_SELF = 'wc-drop-self';
export const HOVER_CLASSES = [HOVER_TAIL, GRAB, DROP, DROP_SELF] as const;
export const HOVER_FROM = '--wc-hover-from';
export const HOVER_LEN = '--wc-hover-len';
export const DRAG_GHOST = 'wc-drag-ghost';
export const DRAG_LAYER = 'wc-drag-layer';
export const DRAG_TARGET = 'wc-drag-target';
export const SUPPRESSED = 'wc-selection-suppressed';
export const HOVER_PEEK_HIDDEN = 'wc-hover-peek-hidden';
