<script lang="ts">
import {
	BSD_SLOT_LABELS,
	BSD_SLOTS,
	type BsdSlot,
	type BsdSlotColors,
	type SlotCssColors,
} from '../types.ts';
import {
	bsdCharsToSgr,
	DEFAULT_BG,
	DEFAULT_FG,
	formatHex,
	SLOT_SAMPLE_TEXT,
} from './preview.ts';

interface Props {
	cssMap: Map<BsdSlot, SlotCssColors> | null;
	bsdMap: Map<BsdSlot, BsdSlotColors> | null;
	class?: string;
}

const { cssMap, bsdMap, class: className = '' }: Props = $props();
</script>

{#if cssMap !== null && bsdMap !== null}
	<div class="preview {className}">
		<table class="preview-table">
			<thead>
				<tr>
					<th>Slot</th>
					<th class="th-label">Label</th>
					<th>Preview</th>
					<th>BSD</th>
					<th title="Select Graphic Rendition — ANSI escape codes for text formatting, colors, and styles in terminal emulators">
						SGR
					</th>
					<th class="th-hex">Hex</th>
				</tr>
			</thead>
			<tbody>
				{#each BSD_SLOTS as slot (slot)}
					{@const colors = cssMap.get(slot)}
					{@const bsdColors = bsdMap.get(slot)}
					{@const fg = colors?.fg ?? DEFAULT_FG}
					{@const bg = colors?.bg ?? DEFAULT_BG}
					{@const bsdFg = bsdColors?.fg ?? 'x'}
					{@const bsdBg = bsdColors?.bg ?? 'x'}
					<tr>
						<td class="preview-slot">{slot}</td>
						<td class="preview-label">{BSD_SLOT_LABELS[slot]}</td>
						<td class="preview-sample">
							<span
								class="preview-swatch"
								style:color={fg}
								style:background-color={bg}
							>
								{SLOT_SAMPLE_TEXT[slot]}
							</span>
						</td>
						<td class="preview-code">{bsdFg}{bsdBg}</td>
						<td class="preview-code">{bsdCharsToSgr(bsdFg, bsdBg) || '—'}</td>
						<td class="preview-hex">
							{formatHex(colors?.fg ?? null, colors?.bg ?? null)}
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
{/if}

<style>
.preview {
	margin-top: 1.5rem;
}

.preview-table {
	width: 100%;
	font-size: 0.8rem;
	border-collapse: collapse;
}

.preview-table thead th {
	padding: 0.375rem 0.5rem;
	font-size: 0.7rem;
	font-weight: 500;
	color: var(--fg-muted);
	text-align: left;
	text-transform: uppercase;
	letter-spacing: 0.05em;
	border-bottom: 1px solid var(--border);
}

.preview-table tbody tr {
	border-bottom: 1px solid var(--border);
}

.preview-table tbody tr:last-child {
	border-bottom: none;
}

.preview-table td {
	padding: 0.375rem 0.5rem;
	vertical-align: middle;
}

.preview-slot {
	width: 3rem;
	font-weight: 600;
	color: var(--accent);
}

.preview-label {
	width: 10rem;
	color: var(--fg-muted);
}

.preview-sample {
	font-family: var(--font-mono);
}

.preview-swatch {
	display: inline-block;
	padding: 0.125rem 0.375rem;
	font-family: var(--font-mono);
	white-space: nowrap;
	border-radius: 3px;
}

.preview-code {
	color: var(--fg-muted);
	white-space: nowrap;
}

.preview-hex {
	font-size: 0.7rem;
	color: var(--fg-muted);
	white-space: nowrap;
}

@media (max-width: 480px) {
	.preview-label,
	.preview-hex,
	.th-label,
	.th-hex {
		display: none;
	}

	.preview-slot {
		width: auto;
	}

	.preview-table {
		font-size: 0.75rem;
	}
}
</style>
