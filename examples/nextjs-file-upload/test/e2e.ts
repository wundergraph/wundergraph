import { test, expect } from '@playwright/test';

test('example loads and displays data', async ({ page }) => {
	await page.goto('/');

	page.on('dialog', async (dialog) => {
		expect(dialog.type()).toContain('alert');
		expect(dialog.message().toLowerCase()).toContain('failed');
		await dialog.accept();
	});

	await page.setInputFiles('input[type="file"]', 'test/wundergraph.jpg');

	// This should fail and produce an alert
	await page.click('button[name="avatar"]');

	// This should succeed
	await page.click('button[name="coverPicture"]');

	const result = page.getByTestId('result');
	const resultText = await result.textContent();
	expect(resultText).toBe('Uploaded as coverPicture/wundergraph.jpg');
});
