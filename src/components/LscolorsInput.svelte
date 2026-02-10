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

<div class="field field--lscolors {className}" {...rest}>
	<label for="lscolors-input">LSCOLORS <span class="label-hint"
		>(BSD/macOS, 22 chars)</span></label>
	<div class="input-row">
		<input
			id="lscolors-input"
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
