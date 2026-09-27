import { mount } from 'svelte';
import { deal } from './engine/index';
import App from './ui/App.svelte';
import './ui/app.css';

const target = document.getElementById('app');
if (!target) throw new Error('missing #app root element');

const seed = 1;
const app = mount(App, { target, props: { seed, columns: deal(seed) } });

export default app;
