import { test, expect } from '@playwright/test';

test('homepage displays expected result', async ({ page }) => {
	await page.goto('/');

	await page.waitForFunction(() => {
		return document.querySelectorAll('#result li').length > 0;
	});

	const result = await page.locator('#result li').all();

	for (const item of result) {
		const data = JSON.parse(await item.textContent());
		expect(data.name).toMatch(/^Dragon/);
		expect(data.active).toBeTruthy();
	}
});
