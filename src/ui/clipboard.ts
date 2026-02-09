/**
 * Copy text to clipboard and briefly flash the button to confirm.
 * Falls back gracefully if clipboard API is unavailable.
 */
export function copyToClipboard(btn: HTMLButtonElement, text: string): void {
	if (text === '') return;
	void navigator.clipboard.writeText(text).then(() => {
		const original: string = btn.textContent;
		btn.textContent = 'Copied!';
		btn.dataset.copied = 'true';
		setTimeout((): void => {
			btn.textContent = original;
			delete btn.dataset.copied;
		}, 1200);
	});
}
