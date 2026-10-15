<script lang="ts">
import type { Snippet } from 'svelte';
// biome-ignore lint/correctness/noUnusedImports: used in markup, which Biome does not read.
import { firstClick } from './presence';
import { createPresence } from './presence.svelte';

// Epic 6 CAP-1 (6.1, build-notes § Per-surface behaviour, DESIGN.md Panels): the full-screen panel
// on the table (Statistics, Preferences, How to play): a 48 px header with the back control and the
// title, content at most 560 px wide and centred, scrolling inside, the safe-area insets as padding;
// no scrim. Focus starts on the heading; the opener gets it back at close. Passes `onclose` through
// unwrapped (act.ts ACT_EXEMPT_FILES): callers wrap it in `act()`. Transition and `inert` exit as
// in Sheet (SPEC F7).
interface Props {
  title: string;
  closeLabel: string;
  onclose: () => void;
  open?: boolean;
  covered?: boolean;
  children: Snippet;
}

const { title, closeLabel, onclose, open = true, covered = false, children }: Props = $props();
const id = $props.id();
const presence = createPresence(() => open);

function focusStart(heading: HTMLElement): void {
  heading.focus();
}
</script>

{#if presence.present}
  <div
    class="panel"
    class:shown={presence.shown}
    role="dialog"
    aria-modal="true"
    aria-labelledby="{id}-title"
    inert={!open || covered}
    {@attach presence.attach}
    ontransitionend={presence.onend}
    ontransitioncancel={presence.oncancel}
  >
    <header>
      <button type="button" class="back" aria-label={closeLabel} onclick={firstClick(onclose)}
        >&larr;</button
      >
      <h2 id="{id}-title" tabindex="-1" {@attach focusStart}>{title}</h2>
    </header>
    <div class="content"><div class="inner">{@render children()}</div></div>
  </div>
{/if}

<style>
  .panel {
    position: fixed; inset: 0; z-index: 20; box-sizing: border-box;
    display: flex; flex-direction: column; background: var(--wc-table);
    padding: env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom)
      env(safe-area-inset-left);
    opacity: 0; transform: translateY(24px);
    transition: opacity var(--wc-base-ms), transform var(--wc-base-ms);
  }
  .shown { opacity: 1; transform: none; }
  header { flex: none; display: flex; align-items: center; gap: 4px; height: 48px; padding: 0 8px; }
  h2 {
    margin: 0; font: 600 1.25rem/1.75rem system-ui, "Roboto", sans-serif;
    color: var(--wc-ink-primary); outline-offset: 4px;
  }
  .back {
    min-width: 44px; min-height: 44px; border: none; border-radius: 9999px; background: none;
    color: var(--wc-ink-primary); font: 400 1.5rem/1 system-ui, "Roboto", sans-serif;
  }
  .content { flex: 1 1 auto; min-height: 0; overflow-y: auto; overscroll-behavior: contain; }
  .inner { box-sizing: border-box; max-width: 560px; margin: 0 auto; padding: 0 16px 16px; }
  @container style(--wc-reduced: 1) {
    .panel { transform: none; transition: opacity var(--wc-fade-ms); }
  }
</style>
