<script lang="ts">
import { tick, untrack } from 'svelte';
import { type AnimationSpeed, prefs, type ThemeId } from '../shell/prefs.svelte';
// biome-ignore lint/correctness/noUnusedImports: used in markup, which Biome does not read.
import { act } from './act';
import { focusMenuButton } from './focus-board';
import { takeMenuOrigin } from './open-surface';
import { overlays } from './overlays.svelte';
// biome-ignore lint/correctness/noUnusedImports: used in markup, which Biome does not read.
import Panel from './Panel.svelte';
import { text } from './text';
// biome-ignore lint/correctness/noUnusedImports: used in markup, which Biome does not read.
import { entries } from './theme/registry';

// Epic 6 CAP-7 (ticket 6.4, R-82, R-76, spec §7.10, Q-36; DESIGN.md Panels): the Preferences panel,
// opened only through `openSurface('preferences')` (the Menu row). A radiogroup `Animation speed`
// (Fast / Normal / Slow), a `Show timer` switch (default off) and a `Theme` radiogroup (Q-45, the registered themes); each change calls the prefs setter
// uncaught (rule 6: they throw while halted or booting, AD-10), writes at once, applies to the next
// glide and never touches the Session. Every control is `act()`-wrapped. Esc closes it through the key
// handler (keys.ts, ticket 6.10); the back control uses `close`. At close, when the Menu row opened
// it (open-surface.ts `takeMenuOrigin`), focus goes to the ☰ button after `tick()` (as
// ConfirmDialogs does; Panel's own return aims at the exiting menu row).
const open = $derived(overlays.isOpen('preferences'));
let wasOpen = false;

$effect(() => {
  const now = open;
  untrack(() => {
    if (wasOpen && !now && takeMenuOrigin('preferences')) {
      void tick().then(() => {
        if (!overlays.isOpen('menu')) focusMenuButton();
      });
    }
    wasOpen = now;
  });
});

const SPEEDS: readonly (readonly [AnimationSpeed, string])[] = [
  ['fast', text.speedFast],
  ['normal', text.speedNormal],
  ['slow', text.speedSlow],
];

function close(): void {
  overlays.close('preferences');
}

function setSpeed(speed: AnimationSpeed): void {
  prefs.setAnimationSpeed(speed);
}

function setTheme(id: ThemeId): void {
  prefs.setTheme(id);
}

function toggleTimer(): void {
  prefs.setShowTimer(!prefs.value.showTimer);
}
</script>

<Panel title={text.preferences} closeLabel={text.closePreferences} onclose={act(close)} {open}>
  <div class="group" role="radiogroup" aria-labelledby="speed-label">
    <p id="speed-label" class="label">{text.animationSpeed}</p>
    <div class="segments">
      {#each SPEEDS as [speed, label] (speed)}
        <label class="segment" class:on={prefs.value.animationSpeed === speed}>
          <input
            type="radio"
            name="animation-speed"
            value={speed}
            checked={prefs.value.animationSpeed === speed}
            onchange={act(() => setSpeed(speed))}
          />
          <span>{label}</span>
        </label>
      {/each}
    </div>
  </div>
  <button
    type="button"
    class="switch-row"
    role="switch"
    aria-checked={prefs.value.showTimer}
    onclick={act(toggleTimer)}
  >
    <span>{text.showTimer}</span>
    <span class="track" class:on={prefs.value.showTimer} aria-hidden="true"
      ><span class="thumb"></span></span
    >
  </button>
  <div class="group" role="radiogroup" aria-labelledby="theme-label">
    <p id="theme-label" class="label">{text.theme}</p>
    <div class="segments">
      {#each entries() as entry (entry.id)}
        <label class="segment" class:on={prefs.value.theme === entry.id}>
          <input
            type="radio"
            name="theme"
            value={entry.id}
            checked={prefs.value.theme === entry.id}
            onchange={act(() => setTheme(entry.id))}
          />
          <span>{entry.label}</span>
        </label>
      {/each}
    </div>
  </div>
</Panel>

<style>
  .group { padding-top: 8px; }
  .label {
    margin: 0 0 8px; font: 400 0.875rem/1.25rem system-ui, "Roboto", sans-serif;
    color: var(--wc-ink-secondary);
  }
  .segments { display: flex; border: 1px solid var(--wc-outline); border-radius: 9999px; overflow: hidden; }
  .segment {
    position: relative; flex: 1; min-height: 44px; display: grid; place-items: center; text-align: center;
    font: 400 1rem/1.5rem system-ui, "Roboto", sans-serif; color: var(--wc-ink-primary);
  }
  .segment + .segment { border-left: 1px solid var(--wc-outline); }
  .segment.on { background: var(--wc-accent-teal); color: var(--wc-ink-on-accent); }
  .segment input { position: absolute; inset: 0; width: 100%; height: 100%; margin: 0; opacity: 0; }
  .segment:has(input:focus-visible) { outline: 2px solid var(--wc-accent-teal); outline-offset: -4px; }
  .switch-row {
    box-sizing: border-box; width: 100%; min-height: 52px; margin-top: 16px; padding: 0;
    display: flex; align-items: center; justify-content: space-between; text-align: left;
    background: none; border: none; color: var(--wc-ink-primary);
    font: 400 1rem/1.5rem system-ui, "Roboto", sans-serif;
  }
  .track {
    flex: none; width: 52px; height: 32px; box-sizing: border-box; padding: 3px;
    border: 2px solid var(--wc-outline); border-radius: 9999px; background: var(--wc-surface-raised);
    display: flex; align-items: center;
    transition: background var(--wc-base-ms);
  }
  .track.on { background: var(--wc-accent-teal); border-color: var(--wc-accent-teal); justify-content: flex-end; }
  .thumb { width: 20px; height: 20px; border-radius: 9999px; background: var(--wc-ink-secondary); }
  .track.on .thumb { background: var(--wc-ink-on-accent); }
</style>
