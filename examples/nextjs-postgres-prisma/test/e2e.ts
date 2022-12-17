import { test, expect } from '@playwright/test';

test('page displays expected results', async ({ page }) => {
	await page.goto('/');

	const result = page.locator('#result');

	expect((await result.textContent()) ?? '').toContain('Founder@WunderGraph');
});
