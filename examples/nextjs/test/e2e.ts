import { test, expect } from '@playwright/test';

test('example loads and displays data', async ({ page }) => {
	const hasFinishedLoading = () => {
		const text = document.querySelector('[data-testid="result"]')?.textContent;
		const data = JSON.parse(text!);
		return !data.isLoading;
	};

	const hasFinishedValidating = () => {
		const text = document.querySelector('[data-testid="result"]')?.textContent;
		const data = JSON.parse(text!);
		return !data.isValidating;
	};

	await page.goto('/');
	const result = page.getByTestId('result');

	await page.waitForFunction(hasFinishedLoading);

	expect(await result.textContent()).toContain('spacex_dragons');

	const refresh = page.getByRole('button', { name: 'refresh' });
	await refresh.click();

	await page.waitForFunction(hasFinishedValidating);

	expect(await result.textContent()).toContain('spacex_dragons');
});
