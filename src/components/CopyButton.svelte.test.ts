import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import CopyButton from './CopyButton.svelte';

describe('CopyButton', () => {
	it('renders with default label', async () => {
		const screen = render(CopyButton, { text: 'hello' });
		await expect
			.element(screen.getByRole('button', { name: 'Copy' }))
			.toBeInTheDocument();
	});

	it('renders with custom label', async () => {
		const screen = render(CopyButton, { text: 'hello', label: 'Share link' });
		await expect
			.element(screen.getByRole('button', { name: 'Share link' }))
			.toBeInTheDocument();
	});

	it('copies text and shows feedback on click', async () => {
		const writeText = vi.fn(() => Promise.resolve());
		vi.stubGlobal('navigator', { clipboard: { writeText } });

		const screen = render(CopyButton, { text: 'copied-value' });
		const button = screen.getByRole('button');

		await button.click();

		expect(writeText).toHaveBeenCalledWith('copied-value');
		await expect.element(button).toHaveTextContent('Copied!');

		vi.unstubAllGlobals();
	});

	it('resets label after timeout', async () => {
		vi.useFakeTimers();
		const writeText = vi.fn(() => Promise.resolve());
		vi.stubGlobal('navigator', { clipboard: { writeText } });

		const screen = render(CopyButton, { text: 'val' });
		const button = screen.getByRole('button');

		await button.click();
		await expect.element(button).toHaveTextContent('Copied!');

		await vi.advanceTimersByTimeAsync(1200);
		await expect.element(button).toHaveTextContent('Copy');

		vi.useRealTimers();
		vi.unstubAllGlobals();
	});
});
