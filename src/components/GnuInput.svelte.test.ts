import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import GnuInput from './GnuInput.svelte';

describe('GnuInput', () => {
	it('renders label with LS_COLORS text', async () => {
		const screen = render(GnuInput, {
			value: '',
			error: '',
			oninput: () => {},
		});
		await expect
			.element(screen.getByRole('textbox', { name: /LS_COLORS/ }))
			.toBeInTheDocument();
	});

	it('renders textarea with rows=4', async () => {
		const screen = render(GnuInput, {
			value: '',
			error: '',
			oninput: () => {},
		});
		const textarea = screen.getByRole('textbox', { name: /LS_COLORS/ });
		await expect.element(textarea).toHaveAttribute('rows', '4');
	});

	it('displays provided value', async () => {
		const screen = render(GnuInput, {
			value: 'di=01;34:ln=01;35',
			error: '',
			oninput: () => {},
		});
		await expect
			.element(screen.getByRole('textbox', { name: /LS_COLORS/ }))
			.toHaveValue('di=01;34:ln=01;35');
	});

	it('calls oninput when user types', async () => {
		const oninput = vi.fn();
		const screen = render(GnuInput, {
			value: '',
			error: '',
			oninput,
		});
		const textarea = screen.getByRole('textbox', { name: /LS_COLORS/ });
		await textarea.fill('di=01;34');
		expect(oninput).toHaveBeenCalled();
	});

	it('shows error when error prop is set', async () => {
		const screen = render(GnuInput, {
			value: 'bad',
			error: 'Parse error',
			oninput: () => {},
		});
		await expect.element(screen.getByText('Parse error')).toBeVisible();
	});

	it('hides error div when error is empty', async () => {
		const screen = render(GnuInput, {
			value: '',
			error: '',
			oninput: () => {},
		});
		await expect
			.element(screen.getByRole('textbox', { name: /LS_COLORS/ }))
			.toBeInTheDocument();
		const errors = screen.getByText('Parse error').elements();
		expect(errors).toHaveLength(0);
	});

	it('renders copy button', async () => {
		const screen = render(GnuInput, {
			value: '',
			error: '',
			oninput: () => {},
		});
		await expect
			.element(screen.getByRole('button', { name: 'Copy LS_COLORS value' }))
			.toBeInTheDocument();
	});
});
