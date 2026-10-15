<script lang="ts">
// biome-ignore lint/correctness/noUnusedImports: used in markup, which Biome does not read.
import MessageCard from './MessageCard.svelte';
import { firstClick } from './presence';
import { createPresence } from './presence.svelte';

// DESIGN.md Dialog: a non-native modal (never showModal(), AD-13: a native modal <dialog> may take
// Android back as its own close request). A full-viewport scrim consumes taps outside the card
// (`onscrim`, when given, acts on them); the card is centred, max 320 px, buttons right-aligned,
// dismissive secondary first, the danger action second. Focus starts on the dismissive button;
// when the dialog becomes the top one again (`inert` cleared), focus returns to its action, the
// button that opened the dialog above. Later dialogs render above earlier ones (DOM order). No
// keydown handling (Esc arrives with epic 6's keyboard map, via overlays.close).
// Epic 6 CAP-1 (6.1): the dialog fades in and out with a CSS transition on `--wc-base-ms` (opacity
// only; under reduced motion `--wc-fade-ms`, SPEC F7), exits while `inert` when `open` turns false
// and gives focus back to its opener at close (presence.svelte). `open` defaults to true for callers
// that mount it with `{#if}`. `actionStyle` is `primary` for the New game and Replay confirms
// (DESIGN.md Buttons), `danger` (the default) where asked. Handlers stay unwrapped (callers use
// `act()`); `onscrim` is passed only for confirms: the History notice's scrim does nothing.
interface Props {
  title: string;
  body: string;
  dismiss: string;
  action: string;
  ondismiss: () => void;
  onaction: () => void;
  onscrim?: (() => void) | undefined;
  inert?: boolean;
  open?: boolean;
  actionStyle?: 'primary' | 'danger';
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
  open = true,
  actionStyle = 'danger',
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

const presence = createPresence(() => open);
const first = firstClick;
</script>

{#if presence.present}
<div
  class="layer"
  class:shown={presence.shown}
  inert={inert || !open}
  {@attach presence.attach}
  ontransitionend={presence.onend}
  ontransitioncancel={presence.oncancel}
>
  <!-- The scrim is pointer-only: keyboard and screen-reader users dismiss with the buttons. -->
  <div class="scrim" aria-hidden="true" onclick={first(onscrim)}></div>
  <MessageCard role="dialog" {title} {body} modal positioned>
    <div class="buttons">
      <button type="button" class="secondary" onclick={first(ondismiss)} {@attach focusOnMount}
        >{dismiss}</button
      >
      <button type="button" class={actionStyle} onclick={first(onaction)} {@attach focusOnReturn}
        >{action}</button
      >
    </div>
  </MessageCard>
</div>
{/if}

<style>
  .layer {
    position: fixed; inset: 0; box-sizing: border-box; padding: 16px;
    display: grid; place-items: center; z-index: 30;
    opacity: 0; transition: opacity var(--wc-base-ms);
  }
  .shown { opacity: 1; }
  @container style(--wc-reduced: 1) {
    .layer { transition: opacity var(--wc-fade-ms); }
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
  .primary { background: var(--wc-accent-teal); border: none; color: var(--wc-ink-on-accent); }
  .danger { background: var(--wc-error); border: none; color: var(--wc-ink-on-accent); }
</style>
