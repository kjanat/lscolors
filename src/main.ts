import { lsColorsToLscolors, lscolorsToLsColors } from './convert.ts';
import { copyToClipboard } from './ui/clipboard.ts';
import { errorMessage, getButton, getDiv, getInput, getSpan, getTextarea, setError } from './ui/dom.ts';
import { type Direction, decodeHash, encodeHash, type HashState } from './ui/hash.ts';
import { renderPreview } from './ui/preview.ts';
import './style.css';

// -------------------------
// Main init
// -------------------------

function init(): void {
	const lscolorsInput = getInput('lscolors-input');
	const lsColorsInput = getTextarea('ls-colors-input');
	const swapBtn = getButton('swap-btn');
	const copyLscolorsBtn = getButton('copy-lscolors');
	const copyLsColorsBtn = getButton('copy-ls-colors');
	const directionIndicator = getSpan('direction-indicator');
	const swapIcon = getSpan('swap-icon');
	const lscolorsError = getDiv('lscolors-error');
	const lsColorsError = getDiv('ls-colors-error');
	const shareBtn = getButton('share-btn');
	const previewContainer = getDiv('preview');

	let direction: Direction = 'lscolors-to-ls_colors';

	/** Flag to prevent re-entrant conversion (setting field B triggers its input event) */
	let converting = false;

	function updateDirectionLabel(): void {
		const down = direction === 'lscolors-to-ls_colors';
		directionIndicator.textContent = down
			? 'LSCOLORS \u2192 LS_COLORS'
			: 'LS_COLORS \u2192 LSCOLORS';
		swapIcon.textContent = down ? '\u2193' : '\u2191';
	}

	function updatePreview(): void {
		renderPreview(previewContainer, lscolorsInput.value);
	}

	/** Update the URL hash to reflect current state (without triggering hashchange) */
	function updateHash(): void {
		const state: HashState = direction === 'lscolors-to-ls_colors'
			? { source: direction, value: lscolorsInput.value }
			: { source: direction, value: lsColorsInput.value };
		const hash = encodeHash(state);
		if (hash === '') {
			// Remove hash without scrolling
			history.replaceState(null, '', window.location.pathname + window.location.search);
		} else {
			history.replaceState(null, '', hash);
		}
	}

	/** Convert LSCOLORS → LS_COLORS, updating the LS_COLORS field */
	function convertFromLscolors(): void {
		const value = lscolorsInput.value;
		if (value === '') {
			lsColorsInput.value = '';
			setError(lscolorsError, '');
			updatePreview();
			updateHash();
			return;
		}
		try {
			lsColorsInput.value = lscolorsToLsColors(value);
			setError(lscolorsError, '');
		} catch (err) {
			setError(lscolorsError, errorMessage(err));
		}
		updatePreview();
		updateHash();
	}

	/** Convert LS_COLORS → LSCOLORS, updating the LSCOLORS field */
	function convertFromLsColors(): void {
		const value = lsColorsInput.value;
		if (value === '') {
			lscolorsInput.value = '';
			setError(lsColorsError, '');
			updatePreview();
			updateHash();
			return;
		}
		try {
			lscolorsInput.value = lsColorsToLscolors(value);
			setError(lsColorsError, '');
		} catch (err) {
			setError(lsColorsError, errorMessage(err));
		}
		updatePreview();
		updateHash();
	}

	/** Run conversion based on current direction */
	function convert(): void {
		if (direction === 'lscolors-to-ls_colors') {
			convertFromLscolors();
		} else {
			convertFromLsColors();
		}
	}

	// --- Input event listeners ---

	lscolorsInput.addEventListener('input', () => {
		if (converting) return;
		converting = true;
		convertFromLscolors();
		if (direction !== 'lscolors-to-ls_colors') {
			direction = 'lscolors-to-ls_colors';
			updateDirectionLabel();
		}
		converting = false;
	});

	lsColorsInput.addEventListener('input', () => {
		if (converting) return;
		converting = true;
		convertFromLsColors();
		if (direction !== 'ls_colors-to-lscolors') {
			direction = 'ls_colors-to-lscolors';
			updateDirectionLabel();
		}
		converting = false;
	});

	// --- Swap button ---

	swapBtn.addEventListener('click', () => {
		direction = direction === 'lscolors-to-ls_colors'
			? 'ls_colors-to-lscolors'
			: 'lscolors-to-ls_colors';
		updateDirectionLabel();
		setError(lscolorsError, '');
		setError(lsColorsError, '');
		convert();
	});

	// --- Copy buttons ---

	copyLscolorsBtn.addEventListener('click', () => {
		copyToClipboard(copyLscolorsBtn, lscolorsInput.value);
	});

	copyLsColorsBtn.addEventListener('click', () => {
		copyToClipboard(copyLsColorsBtn, lsColorsInput.value);
	});

	// --- Share permalink ---

	shareBtn.addEventListener('click', () => {
		copyToClipboard(shareBtn, window.location.href);
	});

	// --- Load from URL hash on init ---

	const hashState = decodeHash(window.location.hash);
	if (hashState !== null) {
		direction = hashState.source;
		if (hashState.source === 'lscolors-to-ls_colors') {
			lscolorsInput.value = hashState.value;
		} else {
			lsColorsInput.value = hashState.value;
		}
		updateDirectionLabel();
		convert();
	} else {
		updateDirectionLabel();
	}
}

init();
