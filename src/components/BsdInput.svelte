<script lang="ts">
import type { HTMLAttributes } from 'svelte/elements';
import CopyButton from './CopyButton.svelte';

interface Props extends HTMLAttributes<HTMLDivElement> {
	value: string;
	error: string;
	oninput: () => void;
	class?: string;
}

let {
	value = $bindable(),
	error,
	oninput,
	class: className = '',
	...rest
}: Props = $props();
</script>

<div class="field {className}" {...rest}>
	<label for="lscolors-input">LSCOLORS <span class="label-hint"
		>(BSD/macOS, 22 chars)</span></label>
	<div class="input-row">
		<input
			id="lscolors-input"
			class="lscolors-input"
			type="text"
			maxlength={22}
			spellcheck="false"
			autocomplete="off"
			placeholder="exfxcxdxbxegedabagacad"
			bind:value
			{oninput}
		>
		<CopyButton text={value} aria-label="Copy LSCOLORS value" />
	</div>
	<div
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

.input-row {
	display: flex;
	gap: 0.5rem;
	align-items: flex-start;
}

.input-row input {
	flex: 1;
	min-width: 0;
}

.lscolors-input {
	font-size: 1rem;
	letter-spacing: 0.1em;
}

.error {
	min-height: 1.125rem;
	font-size: 0.75rem;
	color: var(--error);
}

@media (max-width: 480px) {
	.input-row {
		flex-wrap: wrap;
	}
}

@media (max-width: 375px) {
	.lscolors-input {
		font-size: 0.85rem;
		letter-spacing: 0.05em;
	}
}
</style>
