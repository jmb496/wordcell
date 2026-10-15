<script lang="ts">
import type { Snippet } from 'svelte';
// biome-ignore lint/correctness/noUnusedImports: used in markup, which Biome does not read.
import { firstClick } from './presence';
import { createPresence } from './presence.svelte';

// Epic 6 CAP-1 (6.1, build-notes § Per-surface behaviour, DESIGN.md Sheet and Elevation): the
// bottom sheet (the menu now, the end sheet later). A full-viewport scrim covers the board and
// consumes taps (`onscrim`, when given, acts on them); the sheet sits on it with `{rounded.lg}`
// top corners, at most 80 % of the viewport height, the header with the always-visible close
// control outside the scrolling content, and the safe-area inset as bottom padding. Focus starts
// on the first focusable control of the content; the opener gets it back at close (presence.svelte).
// Like Dialog it passes handlers through unwrapped (act.ts ACT_EXEMPT_FILES): callers wrap
// `onclose` and `onscrim` in `act()`. Open and close are a CSS transition on `--wc-base-ms`, an
// opacity-only fade of `--wc-fade-ms` under reduced motion (SPEC F7); no WAAPI. While it exits it
// is `inert` and takes no input. `open` defaults to true for callers that mount it with `{#if}`.
interface Props {
  title: string;
  closeLabel: string;
  onclose: () => void;
  onscrim?: (() => void) | undefined;
  open?: boolean;
  children: Snippet;
}

const { title, closeLabel, onclose, onscrim, open = true, children }: Props = $props();
const id = $props.id();
const presence = createPresence(() => open);

function focusStart(element: HTMLElement): void {
  const first = element.querySelector<HTMLElement>(
    'button:not(:disabled), [href], input:not(:disabled), [tabindex]:not([tabindex="-1"])',
  );
  first?.focus();
}
</script>

{#if presence.present}
  <div
    class="layer"
    class:shown={presence.shown}
    inert={!open}
    {@attach presence.attach}
    ontransitionend={presence.onend}
    ontransitioncancel={presence.oncancel}
  >
    <!-- The scrim is pointer-only: keyboard and screen-reader users close with the close control. -->
    <div class="scrim" data-presence-target aria-hidden="true" onclick={firstClick(onscrim)}></div>
    <div class="sheet" data-presence-target role="dialog" aria-modal="true" aria-labelledby="{id}-title">
      <header>
        <h2 id="{id}-title">{title}</h2>
        <button type="button" class="close" aria-label={closeLabel} onclick={firstClick(onclose)}
          >&times;</button
        >
      </header>
      <div class="content" {@attach focusStart}>{@render children()}</div>
    </div>
  </div>
{/if}

<style>
  .layer { position: fixed; inset: 0; z-index: 20; }
  .scrim {
    position: absolute; inset: 0; background: var(--wc-scrim); opacity: 0;
    transition: opacity var(--wc-base-ms);
  }
  .sheet {
    position: absolute; left: 0; right: 0; bottom: 0; box-sizing: border-box;
    display: flex; flex-direction: column; max-height: 80dvh; margin: 0 auto; max-width: 560px;
    padding-bottom: env(safe-area-inset-bottom);
    background: var(--wc-surface); border-radius: 20px 20px 0 0;
    opacity: 0; transform: translateY(24px);
    transition: opacity var(--wc-base-ms), transform var(--wc-base-ms);
  }
  .shown .scrim, .shown .sheet { opacity: 1; }
  .shown .sheet { transform: none; }
  header {
    flex: none; display: flex; align-items: center; justify-content: space-between;
    padding: 8px 8px 0 16px;
  }
  h2 { margin: 0; font: 600 1.25rem/1.75rem system-ui, "Roboto", sans-serif; color: var(--wc-ink-primary); }
  .close {
    min-width: 44px; min-height: 44px; border: none; border-radius: 9999px; background: none;
    color: var(--wc-ink-primary); font: 400 1.5rem/1 system-ui, "Roboto", sans-serif;
  }
  .content { flex: 1 1 auto; min-height: 0; overflow-y: auto; overscroll-behavior: contain; }
  @container style(--wc-reduced: 1) {
    .scrim, .sheet { transition: opacity var(--wc-fade-ms); }
    .sheet { transform: none; }
  }
</style>
