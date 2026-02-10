/**
 * Color preview table rendering.
 *
 * Shows 11 BSD slots with sample filenames colored by their fg/bg settings.
 */

import { lscolorsToCssMap } from '../convert.ts';
import { BSD_SLOT_LABELS, BSD_SLOTS, type BsdSlot } from '../types.ts';

/** Sample filenames shown in the preview for each slot */
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

/** Default foreground when BSD char is 'x' (terminal default fg) */
const DEFAULT_FG = '#e0e0e0';
/** Default background when BSD char is 'x' (transparent / terminal bg) */
const DEFAULT_BG = 'transparent';

/**
 * Build or update the color preview grid.
 * Reads the current LSCOLORS value and renders 11 colored swatches.
 */
export function renderPreview(container: HTMLDivElement, lscolorsValue: string): void {
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
