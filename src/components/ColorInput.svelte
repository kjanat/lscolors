<script lang="ts">
import type { HTMLAttributes } from 'svelte/elements';
import CopyButton from './CopyButton.svelte';

interface Props extends HTMLAttributes<HTMLDivElement> {
	value: string;
	error: string;
	oninput?: () => void;
	label: string;
	hint: string;
	id: string;
	placeholder?: string;
	multiline?: boolean;
	maxlength?: number;
	rows?: number;
	copyLabel?: string;
	class?: string;
}

let {
	value = $bindable(),
	error,
	oninput,
	label: fieldLabel,
	hint,
	id: fieldId,
	placeholder = '',
	multiline = false,
	maxlength,
	rows = 4,
	copyLabel = `Copy ${fieldLabel} value`,
	class: className = '',
	...rest
}: Props = $props();

let inputId: string = $derived(`${fieldId}-input`);
let errorId: string = $derived(`${fieldId}-error`);
</script>

<div class="field {className}" {...rest}>
	<label for={inputId}>{fieldLabel} <span class="label-hint"
		>({hint})</span></label>
	<div class="input-wrap" class:has-error={error !== ''}>
		{#if multiline}
			<textarea
				id={inputId}
				{rows}
				spellcheck="false"
				autocomplete="off"
				{placeholder}
				aria-describedby={error !== '' ? errorId : undefined}
				aria-invalid={error !== ''}
				bind:value
				{oninput}
			></textarea>
		{:else}
			<input
				id={inputId}
				type="text"
				{maxlength}
				spellcheck="false"
				autocomplete="off"
				{placeholder}
				aria-describedby={error !== '' ? errorId : undefined}
				aria-invalid={error !== ''}
				bind:value
				{oninput}
			>
		{/if}
		<CopyButton text={value} class="inset-copy" aria-label={copyLabel} />
	</div>
	<div
		id={errorId}
		class="error"
		role="alert"
		aria-live="polite"
		hidden={error === ''}
	>
		{error}
	</div>
</div>

<style>
.field {
	display: flex;
	flex-direction: column;
	gap: 0.375rem;
}

label {
	font-size: 0.8rem;
	font-weight: 500;
	color: var(--fg-label);
}

.label-hint {
	font-weight: 400;
	color: var(--fg-muted);
}

.input-wrap {
	position: relative;
	background: var(--bg-input);
	border: 1px solid var(--border);
	border-radius: var(--radius);
	transition: border-color 0.15s, box-shadow 0.15s;
}

.input-wrap:focus-within {
	border-color: var(--border-focus);
	box-shadow: 0 0 0 2px rgba(102, 217, 239, 0.15);
}

.input-wrap.has-error {
	border-color: var(--error);
}

.input-wrap input,
.input-wrap textarea {
	width: 100%;
	background: transparent;
	border: none;
	border-radius: var(--radius);
}

.input-wrap input {
	padding-right: 5rem;
}

.input-wrap textarea {
	padding-right: 5rem;
}

.input-wrap input:focus,
.input-wrap textarea:focus {
	outline: none;
	box-shadow: none;
}

.input-wrap :global(.inset-copy) {
	position: absolute;
	top: 0.25rem;
	right: 0.25rem;
}

.error {
	min-height: 1.125rem;
	font-size: 0.75rem;
	color: var(--error);
}
</style>
