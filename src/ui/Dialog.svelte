<script lang="ts">
// biome-ignore lint/correctness/noUnusedImports: used in markup, which Biome does not read.
import MessageCard from './MessageCard.svelte';

// DESIGN.md Dialog: a non-native modal (never showModal(), AD-13: a native modal <dialog> may take
// Android back as its own close request). A full-viewport scrim consumes taps outside the card
// (`onscrim`, when given, acts on them); the card is centred, max 320 px, buttons right-aligned,
// dismissive secondary first, the danger action second. Focus starts on the dismissive button;
// when the dialog becomes the top one again (`inert` cleared), focus returns to its action, the
// button that opened the dialog above. Later dialogs render above earlier ones (DOM order). No
// keydown handling (Esc arrives with epic 6's keyboard map, via overlays.close).
interface Props {
  title: string;
  body: string;
  dismiss: string;
  action: string;
  ondismiss: () => void;
  onaction: () => void;
  onscrim?: (() => void) | undefined;
  inert?: boolean;
}

const {
  title,
  body,
  dismiss,
  action,
  ondismiss,
  onaction,
  onscrim,
  inert = false,
}: Props = $props();

function focusOnMount(button: HTMLButtonElement): void {
  button.focus();
}

let covered = false;

function focusOnReturn(button: HTMLButtonElement): void {
  if (inert) {
    covered = true;
    return;
  }
  if (covered) {
    covered = false;
    button.focus();
  }
}

// No part of the dialog (scrim or buttons) acts on the second or later click of a multi-click: a
// double tap on the button that opened this dialog lands its second click on this freshly mounted
// dialog. Keyboard activation has detail 0.
function first(handler: (() => void) | undefined): (event: MouseEvent) => void {
  return (event) => {
    if (event.detail > 1) return;
    handler?.();
  };
}
</script>

<div class="layer" {inert}>
  <!-- The scrim is pointer-only: keyboard and screen-reader users dismiss with the buttons. -->
  <div class="scrim" aria-hidden="true" onclick={first(onscrim)}></div>
  <MessageCard role="dialog" {title} {body} modal positioned>
    <div class="buttons">
      <button type="button" class="secondary" onclick={first(ondismiss)} {@attach focusOnMount}
        >{dismiss}</button
      >
      <button type="button" class="danger" onclick={first(onaction)} {@attach focusOnReturn}
        >{action}</button
      >
    </div>
  </MessageCard>
</div>

<style>
  .layer {
    position: fixed; inset: 0; box-sizing: border-box; padding: 16px;
    display: grid; place-items: center;
  }
  .scrim { position: absolute; inset: 0; background: var(--wc-scrim); }
  .buttons { display: flex; flex-wrap: wrap; justify-content: flex-end; gap: 8px; margin-top: 24px; }
  button {
    min-height: 44px; padding: 0 16px; border-radius: 9999px;
    font: 600 1rem/1.5rem system-ui, "Roboto", sans-serif;
  }
  .secondary {
    background: var(--wc-surface); border: 1px solid var(--wc-outline); color: var(--wc-ink-primary);
  }
  .danger { background: var(--wc-error); border: none; color: var(--wc-ink-on-accent); }
</style>
