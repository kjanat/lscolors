/** Typed DOM element accessors — use `instanceof` narrowing, never `as` casts */

export function getInput(id: string): HTMLInputElement {
	const el = document.getElementById(id);
	if (!(el instanceof HTMLInputElement))
		throw new Error(`Missing <input> #${id}`);
	return el;
}

export function getTextarea(id: string): HTMLTextAreaElement {
	const el = document.getElementById(id);
	if (!(el instanceof HTMLTextAreaElement))
		throw new Error(`Missing <textarea> #${id}`);
	return el;
}

export function getButton(id: string): HTMLButtonElement {
	const el = document.getElementById(id);
	if (!(el instanceof HTMLButtonElement))
		throw new Error(`Missing <button> #${id}`);
	return el;
}

export function getSpan(id: string): HTMLSpanElement {
	const el = document.getElementById(id);
	if (!(el instanceof HTMLSpanElement))
		throw new Error(`Missing <span> #${id}`);
	return el;
}

export function getDiv(id: string): HTMLDivElement {
	const el = document.getElementById(id);
	if (!(el instanceof HTMLDivElement)) throw new Error(`Missing <div> #${id}`);
	return el;
}

/** Show an error message in the given container, or clear it */
export function setError(container: HTMLDivElement, message: string): void {
	container.textContent = message;
	container.hidden = message === '';
}

/** Extract a human-readable message from a caught error */
export function errorMessage(err: unknown): string {
	if (err instanceof Error) return err.message;
	return String(err);
}
