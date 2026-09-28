import { mount } from 'svelte';
import { deal } from './engine/index';
// AD-8: side-effect import so Vite emits the hashed en-*.txt (an unused named import is tree-shaken).
import './shell/dictionary.svelte';
import App from './ui/App.svelte';
import './ui/app.css';

const target = document.getElementById('app');
if (!target) throw new Error('missing #app root element');

const seed = 1;
const app = mount(App, { target, props: { seed, columns: deal(seed) } });

export default app;
