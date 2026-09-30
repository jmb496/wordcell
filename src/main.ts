import { mount } from 'svelte';
import './shell/test-hook';
// AD-8: side-effect import so Vite emits the hashed en-*.txt (an unused named import is tree-shaken).
import './shell/dictionary.svelte';
import { game } from './shell/game.svelte';
import App from './ui/App.svelte';
import './ui/app.css';

const target = document.getElementById('app');
if (!target) throw new Error('missing #app root element');

// AD-4: the load runs synchronously before the first mount.
game.load();

const app = mount(App, { target });

export default app;
