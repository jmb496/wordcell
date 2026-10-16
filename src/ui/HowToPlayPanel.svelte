<script lang="ts">
import { tick, untrack } from 'svelte';
// biome-ignore lint/correctness/noUnusedImports: used in markup, which Biome does not read.
import { act } from './act';
// biome-ignore lint/correctness/noUnusedImports: used in markup, which Biome does not read.
import Card from './Card.svelte';
import { overlays } from './overlays.svelte';
// biome-ignore lint/correctness/noUnusedImports: used in markup, which Biome does not read.
import Panel from './Panel.svelte';
// biome-ignore lint/correctness/noUnusedImports: used in markup, which Biome does not read.
import { scenes } from './scenes/index';
// biome-ignore lint/correctness/noUnusedImports: used in markup, which Biome does not read.
import Scene from './scenes/Scene.svelte';
import { bandNames, text } from './text';

// Epic 6 CAP-8 (ticket 6.9; EXPERIENCE.md How to play panel; DESIGN.md Panels): the static
// scrolling rules page, opened only through `openSurface('howToPlay')` (the Menu's last row). All
// prose is in text.ts (AD-3); this file holds markup only. The §8 example is drawn with the real
// card component as `mirror="static"` (aria-hidden, no card id or place attributes, AD-14). The ☰
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
    {#each scenes as scene (scene.id)}<Scene {scene} />{/each}
  </section>
  <section>
    <h3>{h.goal}</h3>
    {#each text.howTo.goal as paragraph}<p>{paragraph}</p>{/each}
  </section>
  <section>
    <h3>{h.table}</h3>
    {#each text.howTo.table as paragraph}<p>{paragraph}</p>{/each}
  </section>
  <section>
    <h3>{h.move}</h3>
    {#each text.howTo.move as paragraph}<p>{paragraph}</p>{/each}
  </section>
  <section>
    <h3>{h.undo}</h3>
    {#each text.howTo.undo as paragraph}<p>{paragraph}</p>{/each}
  </section>
  <section>
    <h3>{h.empty}</h3>
    {#each text.howTo.empty as paragraph}<p>{paragraph}</p>{/each}
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
  <section class="example">
    <h3>{h.example}</h3>
    {#each text.howTo.exampleIntro as paragraph}<p>{paragraph}</p>{/each}
    {#each text.howTo.exampleWords as word (word)}
      <figure>
        <div class="word">
          {#each word.split('') as letter, i (i)}
            <Card id={0} face={{ letter, letterCount: 1 }} place="column" mirror="static" full />
          {/each}
        </div>
        <figcaption>{text.howTo.exampleCaption(word)}</figcaption>
      </figure>
    {/each}
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
  p, li, td, th, figcaption, caption {
    font: 400 1rem/1.5rem system-ui, "Roboto", sans-serif; color: var(--wc-ink-primary);
  }
  p { margin: 0 0 8px; }
  .bands { list-style: none; margin: 0; padding: 0; }
  .bands li { display: flex; justify-content: space-between; gap: 16px; padding: 4px 0; }
  .score { color: var(--wc-ink-secondary); }
  .example figure { margin: 12px 0 0; }
  .word {
    --wc-w: 40px; --wc-slot: 44px; --wc-H: 56px; --wc-strip: 20px;
    display: flex; flex-wrap: nowrap;
  }
  figcaption { color: var(--wc-ink-secondary); }
  table { width: 100%; border-collapse: collapse; margin: 0 0 16px; }
  caption {
    text-align: left; font-weight: 600; padding: 8px 0 4px; color: var(--wc-ink-secondary);
  }
  th, td { text-align: left; vertical-align: top; padding: 4px 8px 4px 0; border-top: 1px solid var(--wc-outline); }
  th { font-weight: 600; width: 38%; overflow-wrap: anywhere; }
</style>
