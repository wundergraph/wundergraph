import { test, expect, Dialog } from '@playwright/test';

test('example loads and displays data', async ({ page }) => {
	await page.goto('/');

	await page.setInputFiles('input[type="file"]', 'test/wundergraph.jpg');

	let uploadFailed = false;
	const expectFailedListener = async (dialog: Dialog) => {
		uploadFailed = true;
		expect(dialog.type()).toContain('alert');
		expect(dialog.message().toLowerCase()).toContain('failed');
		await dialog.accept();
	};
	page.on('dialog', expectFailedListener);
	// This should fail and produce an alert
	await page.click('button[name="avatar"]');
	expect(uploadFailed).toBeTruthy();
	page.off('dialog', expectFailedListener);

	// This should succeed
	page.on('dialog', async (dialog) => {
		throw new Error('upload to a bucket with anonymous uploads enabled should not produce a dialog');
	});
	await page.click('button[name="coverPicture"]');

	const result = page.getByTestId('result');
	const resultText = await result.textContent();
	expect(resultText).toBe('Uploaded as coverPicture/wundergraph.jpg');
});
