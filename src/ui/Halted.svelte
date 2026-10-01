<script lang="ts">
import { game } from '../shell/game.svelte';
// biome-ignore lint/correctness/noUnusedImports: used in markup, which Biome does not read.
import BlockingMessage from './BlockingMessage.svelte';
import { text } from './text';

// AD-15 fatal / Q-38 another-window surface, reactive from the store's halt cause and text. One
// BlockingMessage with no {#if}, so a later fatal re-renders the same alertdialog node.
const fatal = $derived(game.haltCause === 'fatal');
const title = $derived(fatal ? text.fatalTitle : text.anotherWindow);
const body = $derived(fatal ? game.haltText : undefined);

function reload(): void {
  location.reload();
}
</script>

<BlockingMessage {title} {body} action={text.reload} onaction={reload} />
