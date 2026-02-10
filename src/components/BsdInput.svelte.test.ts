import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import BsdInput from './BsdInput.svelte';

describe('BsdInput', () => {
	it('renders label with LSCOLORS text', async () => {
		const screen = render(BsdInput, {
			value: '',
			error: '',
			oninput: () => {},
		});
		await expect
			.element(screen.getByRole('textbox', { name: /LSCOLORS/ }))
			.toBeInTheDocument();
	});

	it('renders input with maxlength 22', async () => {
		const screen = render(BsdInput, {
			value: '',
			error: '',
			oninput: () => {},
		});
		const input = screen.getByRole('textbox', { name: /LSCOLORS/ });
		await expect.element(input).toHaveAttribute('maxlength', '22');
	});

	it('displays provided value', async () => {
		const screen = render(BsdInput, {
			value: 'exfxcxdxbxegedabagacad',
			error: '',
			oninput: () => {},
		});
		await expect
			.element(screen.getByRole('textbox', { name: /LSCOLORS/ }))
			.toHaveValue('exfxcxdxbxegedabagacad');
	});

	it('calls oninput when user types', async () => {
		const oninput = vi.fn();
		const screen = render(BsdInput, {
			value: '',
			error: '',
			oninput,
		});
		const input = screen.getByRole('textbox', { name: /LSCOLORS/ });
		await input.fill('ex');
		expect(oninput).toHaveBeenCalled();
	});

	it('shows error when error prop is set', async () => {
		const screen = render(BsdInput, {
			value: 'bad',
			error: 'Invalid length',
			oninput: () => {},
		});
		await expect.element(screen.getByText('Invalid length')).toBeVisible();
	});

	it('hides error div when error is empty', async () => {
		const screen = render(BsdInput, {
			value: '',
			error: '',
			oninput: () => {},
		});
		// The error div has hidden attribute when error is empty, so it won't
		// be found by text. Verify the textbox is there but no visible error text.
		await expect
			.element(screen.getByRole('textbox', { name: /LSCOLORS/ }))
			.toBeInTheDocument();
		const errors = screen.getByText('Invalid').elements();
		expect(errors).toHaveLength(0);
	});

	it('renders copy button', async () => {
		const screen = render(BsdInput, {
			value: '',
			error: '',
			oninput: () => {},
		});
		await expect
			.element(screen.getByRole('button', { name: 'Copy LSCOLORS value' }))
			.toBeInTheDocument();
	});
});
