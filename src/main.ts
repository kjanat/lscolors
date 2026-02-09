import './style.css';

/** Conversion direction: which field is the source of truth */
type Direction = 'lscolors-to-ls_colors' | 'ls_colors-to-lscolors';

function getInput(id: string): HTMLInputElement {
	const el = document.getElementById(id);
	if (!(el instanceof HTMLInputElement)) throw new Error(`Missing <input> #${id}`);
	return el;
}

function getTextarea(id: string): HTMLTextAreaElement {
	const el = document.getElementById(id);
	if (!(el instanceof HTMLTextAreaElement)) throw new Error(`Missing <textarea> #${id}`);
	return el;
}

function getButton(id: string): HTMLButtonElement {
	const el = document.getElementById(id);
	if (!(el instanceof HTMLButtonElement)) throw new Error(`Missing <button> #${id}`);
	return el;
}

function getSpan(id: string): HTMLSpanElement {
	const el = document.getElementById(id);
	if (!(el instanceof HTMLSpanElement)) throw new Error(`Missing <span> #${id}`);
	return el;
}

function init(): void {
	const lscolorsInput = getInput('lscolors-input');
	const lsColorsInput = getTextarea('ls-colors-input');
	const swapBtn = getButton('swap-btn');
	const directionIndicator = getSpan('direction-indicator');

	// Unused for now - will be used in live-conversion task
	void lscolorsInput;
	void lsColorsInput;

	let direction: Direction = 'lscolors-to-ls_colors';

	function updateDirectionLabel(): void {
		directionIndicator.textContent = direction === 'lscolors-to-ls_colors'
			? 'LSCOLORS → LS_COLORS'
			: 'LS_COLORS → LSCOLORS';
	}

	swapBtn.addEventListener('click', () => {
		direction = direction === 'lscolors-to-ls_colors'
			? 'ls_colors-to-lscolors'
			: 'lscolors-to-ls_colors';
		updateDirectionLabel();
	});

	updateDirectionLabel();
}

init();
