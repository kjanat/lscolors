import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { parseLscolors } from '../bsd.ts';
import { lscolorsToCssMap } from '../convert.ts';
import PreviewTable from './PreviewTable.svelte';

const VALID_LSCOLORS = 'exfxcxdxbxegedabagacad';
const cssMap = lscolorsToCssMap(VALID_LSCOLORS);
const bsdMap = parseLscolors(VALID_LSCOLORS);

describe('PreviewTable', () => {
	it('renders nothing when both maps are null', async () => {
		const { container } = render(PreviewTable, { cssMap: null, bsdMap: null });
		expect(container.querySelectorAll('table')).toHaveLength(0);
	});

	it('renders nothing when only cssMap is null', async () => {
		const { container } = render(PreviewTable, { cssMap: null, bsdMap });
		expect(container.querySelectorAll('table')).toHaveLength(0);
	});

	it('renders nothing when only bsdMap is null', async () => {
		const { container } = render(PreviewTable, { cssMap, bsdMap: null });
		expect(container.querySelectorAll('table')).toHaveLength(0);
	});

	it('renders table when valid maps provided', async () => {
		const { container } = render(PreviewTable, { cssMap, bsdMap });
		expect(container.querySelectorAll('table').length).toBeGreaterThan(0);
	});

	it('renders 11 data rows', async () => {
		const { container } = render(PreviewTable, { cssMap, bsdMap });
		expect(container.querySelectorAll('tbody tr')).toHaveLength(11);
	});

	it('renders slot labels', async () => {
		const screen = render(PreviewTable, { cssMap, bsdMap });
		await expect.element(screen.getByText('Directory')).toBeInTheDocument();
		await expect.element(screen.getByText('Symbolic link')).toBeInTheDocument();
		await expect.element(screen.getByText('Executable')).toBeInTheDocument();
	});

	it('renders sample text for slots', async () => {
		const screen = render(PreviewTable, { cssMap, bsdMap });
		await expect.element(screen.getByText('Documents/')).toBeInTheDocument();
		await expect
			.element(screen.getByText('link -> target'))
			.toBeInTheDocument();
		await expect.element(screen.getByText('run.sh')).toBeInTheDocument();
	});

	it('renders all 11 slot codes', async () => {
		const { container } = render(PreviewTable, { cssMap, bsdMap });
		expect(container.querySelectorAll('.preview-slot')).toHaveLength(11);
	});
});
