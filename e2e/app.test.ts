import { expect, test } from '@playwright/test';

const VALID_LSCOLORS = 'exfxcxdxbxegedabagacad';

test.describe('page load', () => {
	test.beforeEach(async ({ page }) => {
		await page.goto('/');
	});

	test('page loads with h1', async ({ page }) => {
		await expect(page.locator('h1')).toBeVisible();
		await expect(page.locator('h1')).toContainText('LSCOLORS');
		await expect(page.locator('h1')).toContainText('LS_COLORS');
	});

	test('LSCOLORS input is visible', async ({ page }) => {
		await expect(page.locator('#lscolors-input')).toBeVisible();
	});

	test('LS_COLORS textarea is visible', async ({ page }) => {
		await expect(page.locator('#ls-colors-input')).toBeVisible();
	});
});

test.describe('LSCOLORS → LS_COLORS conversion', () => {
	test('typing valid LSCOLORS populates LS_COLORS', async ({ page }) => {
		await page.goto('/');
		const input = page.locator('#lscolors-input');
		const textarea = page.locator('#ls-colors-input');

		await input.fill(VALID_LSCOLORS);
		await expect(textarea).not.toHaveValue('');
		// Should contain key=value pairs for BSD slots
		await expect(textarea).toHaveValue(/di=\d/);
		await expect(textarea).toHaveValue(/ln=\d/);
	});

	test('invalid LSCOLORS shows error', async ({ page }) => {
		await page.goto('/');
		const input = page.locator('#lscolors-input');

		await input.fill('ZZ');
		const error = page.locator('#lscolors-error');
		await expect(error).toBeVisible();
		await expect(error).not.toHaveText('');
	});
});

test.describe('LS_COLORS → LSCOLORS conversion', () => {
	test('typing valid LS_COLORS populates LSCOLORS', async ({ page }) => {
		await page.goto('/');
		const textarea = page.locator('#ls-colors-input');
		const input = page.locator('#lscolors-input');

		await textarea.fill(
			'di=34:ln=35:so=32:pi=33:ex=31:bd=34;46:cd=34;43:su=30;41:sg=30;46:tw=30;42:ow=30;43',
		);
		await expect(input).not.toHaveValue('');
		// Should produce a 22-char string
		await expect(input).toHaveValue(/^[a-hA-Hx]{22}$/);
	});
});

test.describe('swap button', () => {
	test('toggles conversion direction', async ({ page }) => {
		await page.goto('/');
		const swap = page.getByRole('button', {
			name: 'Swap conversion direction',
		});
		const direction = page.locator('.direction');

		await expect(direction).toContainText('LSCOLORS → LS_COLORS');
		await swap.click();
		await expect(direction).toContainText('LS_COLORS → LSCOLORS');
		await swap.click();
		await expect(direction).toContainText('LSCOLORS → LS_COLORS');
	});

	test('swap re-converts current values', async ({ page }) => {
		await page.goto('/');
		const input = page.locator('#lscolors-input');
		const textarea = page.locator('#ls-colors-input');
		const swap = page.getByRole('button', {
			name: 'Swap conversion direction',
		});

		await input.fill(VALID_LSCOLORS);
		await expect(textarea).not.toHaveValue('');
		await swap.click();
		// After swap, direction is LS_COLORS → LSCOLORS; LSCOLORS should still have a value
		await expect(input).not.toHaveValue('');
	});
});

test.describe('copy buttons', () => {
	test('LSCOLORS copy button exists', async ({ page }) => {
		await page.goto('/');
		const copyBtn = page.getByRole('button', {
			name: 'Copy LSCOLORS value',
		});
		await expect(copyBtn).toBeVisible();
	});

	test('LS_COLORS copy button exists', async ({ page }) => {
		await page.goto('/');
		const copyBtn = page.getByRole('button', {
			name: 'Copy LS_COLORS value',
		});
		await expect(copyBtn).toBeVisible();
	});
});

test.describe('share button', () => {
	test('share button copies URL', async ({ page, context }) => {
		await context.grantPermissions(['clipboard-read', 'clipboard-write']);
		await page.goto('/');
		const shareBtn = page.getByRole('button', {
			name: 'Copy permalink to clipboard',
		});
		await expect(shareBtn).toBeVisible();
		await expect(shareBtn).toContainText('Share link');

		// Type something first so the permalink has content
		await page.locator('#lscolors-input').fill(VALID_LSCOLORS);
		await shareBtn.click();
		await expect(shareBtn).toContainText('Copied!');
	});
});

test.describe('permalink round-trip', () => {
	test('LSCOLORS hash restores state', async ({ page }) => {
		await page.goto(`/#lscolors=${VALID_LSCOLORS}`);
		const input = page.locator('#lscolors-input');
		const textarea = page.locator('#ls-colors-input');

		await expect(input).toHaveValue(VALID_LSCOLORS);
		// Textarea should have the converted value (non-empty)
		await expect(textarea).not.toHaveValue('');
		await expect(textarea).toHaveValue(/di=\d/);
	});

	test('LS_COLORS hash restores state', async ({ page }) => {
		const lsColors =
			'di=34:ln=35:so=32:pi=33:ex=31:bd=34;46:cd=34;43:su=30;41:sg=30;46:tw=30;42:ow=30;43';
		await page.goto(`/#ls_colors=${lsColors}`);
		const input = page.locator('#lscolors-input');
		const textarea = page.locator('#ls-colors-input');

		await expect(textarea).toHaveValue(lsColors);
		// LSCOLORS should be populated (22-char string)
		await expect(input).toHaveValue(/^[a-hA-Hx]{22}$/);
	});

	test('hash updates on input', async ({ page }) => {
		await page.goto('/');
		const input = page.locator('#lscolors-input');

		await input.fill(VALID_LSCOLORS);
		await page.waitForFunction(() => window.location.hash.length > 1);
		const hash = await page.evaluate(() => window.location.hash);
		expect(hash).toContain('lscolors=');
		expect(hash).toContain(VALID_LSCOLORS);
	});
});

test.describe('preview table', () => {
	test('shows 11 rows with valid LSCOLORS', async ({ page }) => {
		await page.goto(`/#lscolors=${VALID_LSCOLORS}`);
		const rows = page.locator('table tbody tr');
		await expect(rows).toHaveCount(11);
	});

	test('rows have colored swatches', async ({ page }) => {
		await page.goto(`/#lscolors=${VALID_LSCOLORS}`);
		const swatches = page.locator('.preview-swatch');
		await expect(swatches).toHaveCount(11);

		// First swatch should have an inline color style
		const first = swatches.first();
		await expect(first).toHaveAttribute('style', /color/);
	});

	test('hidden when no valid LSCOLORS', async ({ page }) => {
		await page.goto('/');
		const table = page.locator('table');
		await expect(table).toHaveCount(0);
	});

	test('slot codes are visible', async ({ page }) => {
		await page.goto(`/#lscolors=${VALID_LSCOLORS}`);
		const slots = page.locator('.preview-slot');
		await expect(slots).toHaveCount(11);
		await expect(slots.first()).toHaveText('di');
	});
});

test.describe('responsive layout', () => {
	test('renders at 375px viewport', async ({ page }) => {
		await page.setViewportSize({ width: 375, height: 667 });
		await page.goto(`/#lscolors=${VALID_LSCOLORS}`);

		await expect(page.locator('h1')).toBeVisible();
		await expect(page.locator('#lscolors-input')).toBeVisible();
		await expect(page.locator('#ls-colors-input')).toBeVisible();

		// Preview table should still show
		const rows = page.locator('table tbody tr');
		await expect(rows).toHaveCount(11);
	});
});
