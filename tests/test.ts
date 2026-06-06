import { expect, test } from '@playwright/test';

test('the draft center does not render component CSS as page content', async ({ page }) => {
	await page.goto('/');

	const leadingText = await page.locator('body').evaluate((body) => {
		const firstMeaningfulNode = Array.from(body.childNodes).find(
			(node) => node.textContent?.trim() || node.nodeType === Node.ELEMENT_NODE
		);

		return firstMeaningfulNode?.nodeType === Node.TEXT_NODE
			? firstMeaningfulNode.textContent?.trim()
			: null;
	});

	expect(leadingText).toBeNull();
});

test.describe('authentication pages', () => {
	test('login page exposes both OAuth providers', async ({ page }) => {
		await page.goto('/auth/login');

		await expect(page).toHaveURL(/\/auth\/login$/);
		await expect(
			page.locator('section.login').getByRole('link', { name: 'discord', exact: true })
		).toHaveAttribute('href', '/auth/login/discord');
		await expect(
			page.locator('section.login').getByRole('link', { name: 'google', exact: true })
		).toHaveAttribute('href', '/auth/login/google');
		await expect(page.locator('section.login')).toHaveAttribute('data-remote-source', 'remote');
	});

	test('register page renders through the shared application layout', async ({ page }) => {
		await page.goto('/auth/register');

		await expect(page).toHaveURL(/\/auth\/register$/);
		await expect(page.getByRole('link', { name: 'Google Login', exact: true })).toBeVisible();
		await expect(page.getByRole('link', { name: 'Discord Login', exact: true })).toBeVisible();
		await expect(
			page.locator('section.login').getByRole('link', { name: 'google', exact: true })
		).toBeVisible();
		await expect(page.locator('section.login')).toHaveAttribute('data-remote-source', 'remote');
	});
});
