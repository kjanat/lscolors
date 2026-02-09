import {
	BSD_SLOT_LABELS,
	BSD_SLOTS,
	type BsdSlot,
	lscolorsToCssMap,
	lsColorsToLscolors,
	lscolorsToLsColors,
} from './lscolors.ts';
import './style.css';

/** Conversion direction: which field is the source of truth */
type Direction = 'lscolors-to-ls_colors' | 'ls_colors-to-lscolors';

// -------------------------
// Typed DOM helpers
// -------------------------

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

// -------------------------
// Copy to clipboard
// -------------------------

/**
 * Copy text to clipboard and briefly flash the button to confirm.
 * Falls back gracefully if clipboard API is unavailable.
 */
function copyToClipboard(btn: HTMLButtonElement, text: string): void {
	if (text === '') return;
	void navigator.clipboard.writeText(text).then(() => {
		const original = btn.textContent;
		btn.textContent = 'Copied!';
		btn.dataset['copied'] = 'true';
		setTimeout(() => {
			btn.textContent = original;
			delete btn.dataset['copied'];
		}, 1200);
	});
}

// -------------------------
// URL hash permalink
// -------------------------

/** Hash format: #lscolors=<value> or #ls_colors=<value> */
type HashState = {
	readonly source: Direction;
	readonly value: string;
};

function encodeHash(state: HashState): string {
	if (state.value === '') return '';
	const key = state.source === 'lscolors-to-ls_colors' ? 'lscolors' : 'ls_colors';
	return `#${key}=${encodeURIComponent(state.value)}`;
}

function decodeHash(hash: string): HashState | null {
	if (!hash.startsWith('#') || hash.length < 2) return null;
	const raw = hash.slice(1);
	const eqIdx = raw.indexOf('=');
	if (eqIdx === -1) return null;

	const key = raw.slice(0, eqIdx);
	const value = decodeURIComponent(raw.slice(eqIdx + 1));
	if (value === '') return null;

	if (key === 'lscolors') {
		return { source: 'lscolors-to-ls_colors', value };
	}
	if (key === 'ls_colors') {
		return { source: 'ls_colors-to-lscolors', value };
	}
	return null;
}

// -------------------------
// Sample filenames per BSD slot
// -------------------------

const SLOT_SAMPLE_TEXT: Readonly<Record<BsdSlot, string>> = {
	di: 'Documents/',
	ln: 'link -> target',
	so: 'app.sock',
	pi: 'fifo.pipe',
	ex: 'run.sh',
	bd: 'sda1',
	cd: 'tty0',
	su: 'passwd',
	sg: 'crontab',
	tw: 'tmp/',
	ow: 'shared/',
};

// -------------------------
// Default theme colors (terminal-like)
// -------------------------

/** Default foreground when BSD char is 'x' (terminal default fg) */
const DEFAULT_FG = '#e0e0e0';
/** Default background when BSD char is 'x' (transparent / terminal bg) */
const DEFAULT_BG = 'transparent';

// -------------------------
// Preview rendering
// -------------------------

/**
 * Build or update the color preview grid.
 * Reads the current LSCOLORS value and renders 11 colored swatches.
 */
function renderPreview(container: HTMLDivElement, lscolorsValue: string): void {
	container.innerHTML = '';

	if (lscolorsValue === '' || lscolorsValue.length !== 22) {
		return;
	}

	let cssMap: Map<BsdSlot, { readonly fg: string | null; readonly bg: string | null }>;
	try {
		cssMap = lscolorsToCssMap(lscolorsValue);
	} catch {
		return;
	}

	const table = document.createElement('table');
	table.className = 'preview-table';
	table.setAttribute('role', 'presentation');

	const thead = document.createElement('thead');
	const headerRow = document.createElement('tr');
	for (const text of ['Slot', 'Label', 'Preview']) {
		const th = document.createElement('th');
		th.textContent = text;
		headerRow.appendChild(th);
	}
	thead.appendChild(headerRow);
	table.appendChild(thead);

	const tbody = document.createElement('tbody');

	for (const slot of BSD_SLOTS) {
		const colors = cssMap.get(slot);
		const fg = colors?.fg ?? DEFAULT_FG;
		const bg = colors?.bg ?? DEFAULT_BG;

		const tr = document.createElement('tr');

		// Slot code cell
		const tdSlot = document.createElement('td');
		tdSlot.className = 'preview-slot';
		tdSlot.textContent = slot;
		tr.appendChild(tdSlot);

		// Label cell
		const tdLabel = document.createElement('td');
		tdLabel.className = 'preview-label';
		tdLabel.textContent = BSD_SLOT_LABELS[slot];
		tr.appendChild(tdLabel);

		// Sample text cell (colored)
		const tdSample = document.createElement('td');
		tdSample.className = 'preview-sample';
		const sampleSpan = document.createElement('span');
		sampleSpan.className = 'preview-swatch';
		sampleSpan.textContent = SLOT_SAMPLE_TEXT[slot];
		sampleSpan.style.color = fg;
		sampleSpan.style.backgroundColor = bg;
		tdSample.appendChild(sampleSpan);
		tr.appendChild(tdSample);

		tbody.appendChild(tr);
	}

	table.appendChild(tbody);
	container.appendChild(table);
}

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
	const lscolorsError = getDiv('lscolors-error');
	const lsColorsError = getDiv('ls-colors-error');
	const previewContainer = getDiv('preview');

	let direction: Direction = 'lscolors-to-ls_colors';

	/** Flag to prevent re-entrant conversion (setting field B triggers its input event) */
	let converting = false;

	function updateDirectionLabel(): void {
		directionIndicator.textContent = direction === 'lscolors-to-ls_colors'
			? 'LSCOLORS \u2192 LS_COLORS'
			: 'LS_COLORS \u2192 LSCOLORS';
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
