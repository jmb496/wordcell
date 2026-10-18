<script lang="ts">
import { tick, untrack } from 'svelte';
// biome-ignore lint/correctness/noUnusedImports: used in markup, which Biome does not read.
import { act } from './act';
import { overlays } from './overlays.svelte';
// biome-ignore lint/correctness/noUnusedImports: used in markup, which Biome does not read.
import Panel from './Panel.svelte';
// biome-ignore lint/correctness/noUnusedImports: used in markup, which Biome does not read.
import Carousel from './scenes/Carousel.svelte';
import { bandNames, text } from './text';

// Epic 6 CAP-8 (ticket 6.9) and epic 8 (HP-7; EXPERIENCE.md How to play panel; DESIGN.md Panels): the
// scrolling rules panel, opened only through `openSurface('howToPlay')` (the Menu's last row). The
// animated scenes come first (one at a time in a carousel), then the text sections, then Controls.
// All prose is in text.ts (AD-3); this file holds markup only. The ☰
// refocus effect is an interim copy of PreferencesPanel's; Esc closes it through the key handler
// (keys.ts, ticket 6.10).
const open = $derived(overlays.isOpen('howToPlay'));
let wasOpen = false;

$effect(() => {
  const now = open;
  untrack(() => {
    if (wasOpen && !now) {
      void tick().then(() => {
        if (overlays.isOpen('menu')) return;
        document.querySelector<HTMLElement>(`button[aria-label="${text.menu}"]`)?.focus();
      });
    }
    wasOpen = now;
  });
});

const h = text.howTo.headings;
const names = bandNames();
const tables = [
  [text.howTo.controlCaptions.touch, text.howTo.touch],
  [text.howTo.controlCaptions.mouse, text.howTo.mouse],
  [text.howTo.controlCaptions.keyboard, text.howTo.keyboard],
] as const;

function close(): void {
  overlays.close('howToPlay');
}
</script>

<Panel title={text.howToPlay} closeLabel={text.closeHowToPlay} onclose={act(close)} {open}>
  <section class="scenes">
    <Carousel />
  </section>
  <section>
    <h3>{h.goal}</h3>
    {#each text.howTo.goal as paragraph}<p>{paragraph}</p>{/each}
  </section>
  <section>
    <h3>{h.scoring}</h3>
    {#each text.howTo.scoring as paragraph}<p>{paragraph}</p>{/each}
    <ul class="bands">
      {#each names as name, band (name)}
        <li><span>{name}</span><span class="score">{text.bandScore(band)}</span></li>
      {/each}
    </ul>
  </section>
  <section>
    <h3>{h.controls}</h3>
    {#each tables as [caption, rows] (caption)}
      <table>
        <caption>{caption}</caption>
        <tbody>
          {#each rows as [key, effect] (key)}
            <tr><th scope="row">{key}</th><td>{effect}</td></tr>
          {/each}
        </tbody>
      </table>
    {/each}
  </section>
</Panel>

<style>
  section { padding-top: 16px; }
  h3 {
    margin: 0 0 8px; font: 600 1.125rem/1.5rem system-ui, "Roboto", sans-serif;
    color: var(--wc-ink-primary);
  }
  p, li, td, th, caption {
    font: 400 1rem/1.5rem system-ui, "Roboto", sans-serif; color: var(--wc-ink-primary);
  }
  p { margin: 0 0 8px; }
  .bands { list-style: none; margin: 0; padding: 0; }
  .bands li { display: flex; justify-content: space-between; gap: 16px; padding: 4px 0; }
  .score { color: var(--wc-ink-secondary); }
  table { width: 100%; border-collapse: collapse; margin: 0 0 16px; }
  caption {
    text-align: left; font-weight: 600; padding: 8px 0 4px; color: var(--wc-ink-secondary);
  }
  th, td { text-align: left; vertical-align: top; padding: 4px 8px 4px 0; border-top: 1px solid var(--wc-outline); }
  th { font-weight: 600; width: 38%; overflow-wrap: anywhere; }
</style>
