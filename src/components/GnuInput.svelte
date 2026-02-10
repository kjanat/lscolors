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
	<label for="ls-colors-input">LS_COLORS <span class="label-hint"
		>(GNU/Linux, colon-delimited)</span></label>
	<div class="input-row">
		<textarea
			id="ls-colors-input"
			rows={4}
			spellcheck="false"
			autocomplete="off"
			placeholder="di=01;34:ln=01;36:so=01;35:pi=33:ex=01;32:bd=01;33:cd=01;33:su=37;41:sg=30;43:tw=30;42:ow=34;42"
			aria-describedby={error !== '' ? 'ls-colors-error' : undefined}
			aria-invalid={error !== ''}
			bind:value
			{oninput}
		></textarea>
		<CopyButton text={value} aria-label="Copy LS_COLORS value" />
	</div>
	<div
		id="ls-colors-error"
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

.input-row textarea {
	flex: 1;
	min-width: 0;
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
</style>
