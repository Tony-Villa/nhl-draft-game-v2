import { expect, test } from '@playwright/test';

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
	});

	test('register page renders through the shared application layout', async ({ page }) => {
		await page.goto('/auth/register');

		await expect(page).toHaveURL(/\/auth\/register$/);
		await expect(page.getByRole('link', { name: 'Google Login', exact: true })).toBeVisible();
		await expect(page.getByRole('link', { name: 'Discord Login', exact: true })).toBeVisible();
		await expect(
			page.locator('section.login').getByRole('link', { name: 'google', exact: true })
		).toBeVisible();
	});
});
