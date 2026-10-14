<script lang="ts">
import type { Snippet } from 'svelte';

// DESIGN.md Dialog / Blocking message: the one card style (surface, radius, padding, title and body
// type) both share. `children` are the buttons, rendered after the body. `modal` marks a Dialog's
// `aria-modal`; `positioned` lifts the card above a sibling scrim.
interface Props {
  role: 'dialog' | 'alertdialog';
  title: string;
  body?: string | undefined;
  modal?: boolean;
  positioned?: boolean;
  children: Snippet;
}

const { role, title, body, modal = false, positioned = false, children }: Props = $props();
const id = $props.id();
</script>

<div
  class="card"
  class:positioned
  {role}
  aria-modal={modal ? 'true' : undefined}
  aria-labelledby="{id}-title"
  aria-describedby={body === undefined ? undefined : `${id}-body`}
>
  <h2 id="{id}-title">{title}</h2>
  {#if body !== undefined}
    <p id="{id}-body">{body}</p>
  {/if}
  {@render children()}
</div>

<style>
  .card {
    box-sizing: border-box; width: 100%; max-width: 320px; padding: 24px;
    background: var(--wc-surface-raised); border-radius: 12px;
  }
  .positioned { position: relative; }
  h2 { margin: 0; font: 600 1.25rem/1.75rem system-ui, "Roboto", sans-serif; color: var(--wc-ink-primary); }
  p {
    margin: 8px 0 0; font: 400 1rem/1.5rem system-ui, "Roboto", sans-serif;
    color: var(--wc-ink-secondary); overflow-wrap: anywhere;
  }
</style>
