/**
 * Reactive URL hash sync for Svelte 5.
 *
 * Debounces `history.replaceState` calls to avoid thrashing
 * the browser history on every keystroke.
 */

import { type Direction, encodeHash } from './hash.ts';

/**
 * Create a reactive `$effect` that syncs converter state to the URL hash.
 *
 * @param getDirection - getter for the current conversion direction
 * @param getSourceValue - getter for the current source field value
 * @param debounceMs - debounce delay in milliseconds (default: 120)
 */
export function createHashSync(
	getDirection: () => Direction,
	getSourceValue: () => string,
	debounceMs: number = 120,
): void {
	let lastAppliedUrl: string | undefined;
	let timeout: ReturnType<typeof setTimeout> | undefined;

	$effect(() => {
		if (typeof window === 'undefined') return;
		const direction = getDirection();
		const sourceValue = getSourceValue();
		const hashFragment = encodeHash({ source: direction, value: sourceValue });
		const baseUrl =
			window.location.origin +
			window.location.pathname +
			window.location.search;
		const url = hashFragment === '' ? baseUrl : baseUrl + hashFragment;

		clearTimeout(timeout);
		if (url === lastAppliedUrl) return;
		timeout = setTimeout(() => {
			lastAppliedUrl = url;
			if (typeof history !== 'undefined') {
				history.replaceState(null, '', url);
			}
		}, debounceMs);

		return () => {
			clearTimeout(timeout);
		};
	});
}

/**
 * Derive the current permalink URL from converter state.
 *
 * Pure function, no side effects — suitable for use in `$derived`.
 */
export function derivePermalinkUrl(
	direction: Direction,
	sourceValue: string,
): string {
	if (typeof window === 'undefined') return '';
	const hashFragment = encodeHash({ source: direction, value: sourceValue });
	const baseUrl =
		window.location.origin + window.location.pathname + window.location.search;
	return hashFragment === '' ? baseUrl : baseUrl + hashFragment;
}
