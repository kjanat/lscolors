import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import ColorInput from './ColorInput.svelte';

const BSD_PROPS = {
	value: '',
	error: '',
	oninput: () => {},
	label: 'LSCOLORS',
	hint: 'BSD/macOS, 22 chars',
	id: 'lscolors',
	placeholder: 'exfxcxdxbxegedabagacad',
	maxlength: 22,
} as const;

const GNU_PROPS = {
	value: '',
	error: '',
	oninput: () => {},
	label: 'LS_COLORS',
	hint: 'GNU/Linux, colon-delimited',
	id: 'ls-colors',
	multiline: true,
	rows: 4,
	placeholder: 'di=01;34:ln=01;36',
} as const;

describe('ColorInput (single-line / BSD)', () => {
	it('renders label with provided text', async () => {
		const screen = render(ColorInput, { ...BSD_PROPS });
		await expect
			.element(screen.getByRole('textbox', { name: /LSCOLORS/ }))
			.toBeInTheDocument();
	});

	it('renders input with maxlength', async () => {
		const screen = render(ColorInput, { ...BSD_PROPS });
		const input = screen.getByRole('textbox', { name: /LSCOLORS/ });
		await expect.element(input).toHaveAttribute('maxlength', '22');
	});

	it('displays provided value', async () => {
		const screen = render(ColorInput, {
			...BSD_PROPS,
			value: 'exfxcxdxbxegedabagacad',
		});
		await expect
			.element(screen.getByRole('textbox', { name: /LSCOLORS/ }))
			.toHaveValue('exfxcxdxbxegedabagacad');
	});

	it('calls oninput when user types', async () => {
		const oninput = vi.fn();
		const screen = render(ColorInput, { ...BSD_PROPS, oninput });
		const input = screen.getByRole('textbox', { name: /LSCOLORS/ });
		await input.fill('ex');
		expect(oninput).toHaveBeenCalled();
	});

	it('shows error when error prop is set', async () => {
		const screen = render(ColorInput, {
			...BSD_PROPS,
			value: 'bad',
			error: 'Invalid length',
		});
		await expect.element(screen.getByText('Invalid length')).toBeVisible();
	});

	it('hides error div when error is empty', async () => {
		const screen = render(ColorInput, { ...BSD_PROPS });
		await expect
			.element(screen.getByRole('textbox', { name: /LSCOLORS/ }))
			.toBeInTheDocument();
		const errors = screen.getByText('Invalid').elements();
		expect(errors).toHaveLength(0);
	});

	it('renders copy button', async () => {
		const screen = render(ColorInput, { ...BSD_PROPS });
		await expect
			.element(screen.getByRole('button', { name: 'Copy LSCOLORS value' }))
			.toBeInTheDocument();
	});
});

describe('ColorInput (multiline / GNU)', () => {
	it('renders label with provided text', async () => {
		const screen = render(ColorInput, { ...GNU_PROPS });
		await expect
			.element(screen.getByRole('textbox', { name: /LS_COLORS/ }))
			.toBeInTheDocument();
	});

	it('renders textarea with rows', async () => {
		const screen = render(ColorInput, { ...GNU_PROPS });
		const textarea = screen.getByRole('textbox', { name: /LS_COLORS/ });
		await expect.element(textarea).toHaveAttribute('rows', '4');
	});

	it('displays provided value', async () => {
		const screen = render(ColorInput, {
			...GNU_PROPS,
			value: 'di=01;34:ln=01;35',
		});
		await expect
			.element(screen.getByRole('textbox', { name: /LS_COLORS/ }))
			.toHaveValue('di=01;34:ln=01;35');
	});

	it('calls oninput when user types', async () => {
		const oninput = vi.fn();
		const screen = render(ColorInput, { ...GNU_PROPS, oninput });
		const textarea = screen.getByRole('textbox', { name: /LS_COLORS/ });
		await textarea.fill('di=01;34');
		expect(oninput).toHaveBeenCalled();
	});

	it('shows error when error prop is set', async () => {
		const screen = render(ColorInput, {
			...GNU_PROPS,
			value: 'bad',
			error: 'Parse error',
		});
		await expect.element(screen.getByText('Parse error')).toBeVisible();
	});

	it('hides error div when error is empty', async () => {
		const { container } = render(ColorInput, { ...GNU_PROPS });
		const errorDiv = container.querySelector('#ls-colors-error');
		expect(errorDiv).not.toBeNull();
		expect(errorDiv?.getAttribute('hidden')).not.toBeNull();
	});

	it('renders copy button', async () => {
		const screen = render(ColorInput, { ...GNU_PROPS });
		await expect
			.element(screen.getByRole('button', { name: 'Copy LS_COLORS value' }))
			.toBeInTheDocument();
	});
});
