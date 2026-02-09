import { lsColorsToLscolors, lscolorsToLsColors } from './lscolors';
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

function getDiv(id: string): HTMLDivElement {
	const el = document.getElementById(id);
	if (!(el instanceof HTMLDivElement)) throw new Error(`Missing <div> #${id}`);
	return el;
}

/** Show an error message in the given container, or clear it */
function setError(container: HTMLDivElement, message: string): void {
	container.textContent = message;
}

/** Extract a human-readable message from a caught error */
function errorMessage(err: unknown): string {
	if (err instanceof Error) return err.message;
	return String(err);
}

function init(): void {
	const lscolorsInput = getInput('lscolors-input');
	const lsColorsInput = getTextarea('ls-colors-input');
	const swapBtn = getButton('swap-btn');
	const directionIndicator = getSpan('direction-indicator');
	const lscolorsError = getDiv('lscolors-error');
	const lsColorsError = getDiv('ls-colors-error');

	let direction: Direction = 'lscolors-to-ls_colors';

	/** Flag to prevent re-entrant conversion (setting field B triggers its input event) */
	let converting = false;

	function updateDirectionLabel(): void {
		directionIndicator.textContent = direction === 'lscolors-to-ls_colors'
			? 'LSCOLORS \u2192 LS_COLORS'
			: 'LS_COLORS \u2192 LSCOLORS';
	}

	/** Convert LSCOLORS → LS_COLORS, updating the LS_COLORS field */
	function convertFromLscolors(): void {
		const value = lscolorsInput.value;
		if (value === '') {
			lsColorsInput.value = '';
			setError(lscolorsError, '');
			return;
		}
		try {
			lsColorsInput.value = lscolorsToLsColors(value);
			setError(lscolorsError, '');
		} catch (err) {
			setError(lscolorsError, errorMessage(err));
		}
	}

	/** Convert LS_COLORS → LSCOLORS, updating the LSCOLORS field */
	function convertFromLsColors(): void {
		const value = lsColorsInput.value;
		if (value === '') {
			lscolorsInput.value = '';
			setError(lsColorsError, '');
			return;
		}
		try {
			lscolorsInput.value = lsColorsToLscolors(value);
			setError(lsColorsError, '');
		} catch (err) {
			setError(lsColorsError, errorMessage(err));
		}
	}

	/** Run conversion based on current direction */
	function convert(): void {
		if (direction === 'lscolors-to-ls_colors') {
			convertFromLscolors();
		} else {
			convertFromLsColors();
		}
	}

	lscolorsInput.addEventListener('input', () => {
		if (converting) return;
		converting = true;
		// Typing in LSCOLORS always converts to LS_COLORS, regardless of direction
		convertFromLscolors();
		// Auto-switch direction to match what user is editing
		if (direction !== 'lscolors-to-ls_colors') {
			direction = 'lscolors-to-ls_colors';
			updateDirectionLabel();
		}
		converting = false;
	});

	lsColorsInput.addEventListener('input', () => {
		if (converting) return;
		converting = true;
		// Typing in LS_COLORS always converts to LSCOLORS, regardless of direction
		convertFromLsColors();
		// Auto-switch direction to match what user is editing
		if (direction !== 'ls_colors-to-lscolors') {
			direction = 'ls_colors-to-lscolors';
			updateDirectionLabel();
		}
		converting = false;
	});

	swapBtn.addEventListener('click', () => {
		direction = direction === 'lscolors-to-ls_colors'
			? 'ls_colors-to-lscolors'
			: 'lscolors-to-ls_colors';
		updateDirectionLabel();
		// Clear errors on swap
		setError(lscolorsError, '');
		setError(lsColorsError, '');
		// Re-convert from the new source field
		convert();
	});

	updateDirectionLabel();
}

init();
