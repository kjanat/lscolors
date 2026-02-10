<script lang="ts">
import type { HTMLButtonAttributes } from 'svelte/elements';

interface Props extends HTMLButtonAttributes {
	text: string;
	label?: string;
	class?: string;
}

let { text, label = 'Copy', class: className = '', ...rest }: Props = $props();

let copied = $state(false);
let timeoutId: ReturnType<typeof setTimeout> | undefined = $state(undefined);

function handleClick(): void {
	if (timeoutId !== undefined) {
		clearTimeout(timeoutId);
	}
	navigator.clipboard.writeText(text);
	copied = true;
	timeoutId = setTimeout(() => {
		copied = false;
		timeoutId = undefined;
	}, 1200);
}
</script>

<button
	type="button"
	class="copy-btn {className}"
	class:copied
	onclick={handleClick}
	{...rest}
>
	{copied ? 'Copied!' : label}
</button>
