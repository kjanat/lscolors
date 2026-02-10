import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import SwapControl from './SwapControl.svelte';

describe('SwapControl', () => {
	it('renders swap button', async () => {
		const screen = render(SwapControl, {
			icon: '↓',
			label: 'LSCOLORS → LS_COLORS',
			onswap: () => {},
		});
		await expect
			.element(
				screen.getByRole('button', { name: 'Swap conversion direction' }),
			)
			.toBeInTheDocument();
	});

	it('displays icon', async () => {
		const screen = render(SwapControl, {
			icon: '↓',
			label: 'LSCOLORS → LS_COLORS',
			onswap: () => {},
		});
		await expect.element(screen.getByText('↓')).toBeInTheDocument();
	});

	it('displays direction label', async () => {
		const screen = render(SwapControl, {
			icon: '↑',
			label: 'LS_COLORS → LSCOLORS',
			onswap: () => {},
		});
		await expect
			.element(screen.getByText('LS_COLORS → LSCOLORS'))
			.toBeInTheDocument();
	});

	it('calls onswap when button clicked', async () => {
		const onswap = vi.fn();
		const screen = render(SwapControl, {
			icon: '↓',
			label: 'LSCOLORS → LS_COLORS',
			onswap,
		});
		const button = screen.getByRole('button', {
			name: 'Swap conversion direction',
		});
		await button.click();
		expect(onswap).toHaveBeenCalledOnce();
	});
});
