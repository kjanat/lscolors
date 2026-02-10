import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import App from './App.svelte';

describe('App.svelte', () => {
	it('renders heading', async () => {
		const screen = render(App);
		await expect
			.element(screen.getByRole('heading', { level: 1 }))
			.toBeInTheDocument();
	});

	it('renders BSD input field', async () => {
		const screen = render(App);
		await expect
			.element(screen.getByRole('textbox', { name: /LSCOLORS/ }))
			.toBeInTheDocument();
	});

	it('renders GNU textarea', async () => {
		const screen = render(App);
		await expect
			.element(screen.getByRole('textbox', { name: /LS_COLORS/ }))
			.toBeInTheDocument();
	});

	it('renders swap button', async () => {
		const screen = render(App);
		await expect
			.element(
				screen.getByRole('button', { name: 'Swap conversion direction' }),
			)
			.toBeInTheDocument();
	});

	it('renders share button', async () => {
		const screen = render(App);
		await expect
			.element(
				screen.getByRole('button', { name: 'Copy permalink to clipboard' }),
			)
			.toBeInTheDocument();
	});

	it('converts LSCOLORS input to LS_COLORS', async () => {
		const screen = render(App);
		const bsdInput = screen.getByRole('textbox', { name: /LSCOLORS/ });
		await bsdInput.fill('exfxcxdxbxegedabagacad');

		const gnuTextarea = screen.getByRole('textbox', { name: /LS_COLORS/ });
		await expect
			.element(gnuTextarea)
			.toHaveValue(
				'di=34:ln=35:so=32:pi=33:ex=31:bd=34;46:cd=34;43:su=30;41:sg=30;46:tw=30;42:ow=30;43:or=31:mi=31',
			);
	});

	it('shows error for invalid LSCOLORS', async () => {
		const screen = render(App);
		const bsdInput = screen.getByRole('textbox', { name: /LSCOLORS/ });
		// 22-char string with invalid BSD chars
		await bsdInput.fill('zzzzzzzzzzzzzzzzzzzzzz');

		await expect
			.element(screen.getByText(/Invalid BSD color char/))
			.toBeVisible();
	});
});
