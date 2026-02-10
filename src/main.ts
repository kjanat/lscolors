import { mount } from 'svelte';
import App from './App.svelte';

const target = document.getElementById('app');
if (!(target instanceof HTMLElement)) {
	throw new Error('Missing mount target #app');
}
mount(App, { target });
