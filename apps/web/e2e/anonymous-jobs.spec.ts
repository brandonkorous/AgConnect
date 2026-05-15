import { expect, test } from '@playwright/test';

test.describe('anonymous /jobs surface', () => {
    test('renders the bilingual browse page in English', async ({ page }) => {
        await page.goto('/en/jobs');
        await expect(page).toHaveTitle(/AGCONN/);
        await expect(page.getByRole('heading', { level: 1 })).toContainText(
            /farm jobs|Central Valley/i,
        );
    });

    test('renders the browse page in Spanish', async ({ page }) => {
        await page.goto('/es/jobs');
        await expect(page.getByRole('heading', { level: 1 })).toContainText(
            /Trabajos|Valle Central/i,
        );
    });

    test('emits ItemList JSON-LD on the listing', async ({ page }) => {
        await page.goto('/en/jobs');
        const ldScripts = page.locator('script[type="application/ld+json"]');
        expect(await ldScripts.count()).toBeGreaterThan(0);
        const text = (await ldScripts.first().textContent()) ?? '';
        expect(text).toContain('"@type":"ItemList"');
    });

    test('exposes a sitemap with the locale roots', async ({ request }) => {
        const res = await request.get('/sitemap.xml');
        expect(res.status()).toBe(200);
        const xml = await res.text();
        expect(xml).toContain('/en');
        expect(xml).toContain('/es');
        expect(xml).toContain('/jobs');
    });
});

test.describe('anonymous /training surface', () => {
    test('renders the listing in English', async ({ page }) => {
        await page.goto('/en/training');
        await expect(page.getByRole('heading', { level: 1 })).toContainText(
            /agriculture|training/i,
        );
    });

    test('renders the listing in Spanish', async ({ page }) => {
        await page.goto('/es/training');
        await expect(page.getByRole('heading', { level: 1 })).toContainText(
            /capacitación|agrícola/i,
        );
    });
});

test.describe('protected surfaces redirect to sign-in', () => {
    test('worker dashboard pushes anonymous visitors to /sign-in', async ({ page }) => {
        await page.goto('/en/worker/dashboard');
        await expect(page).toHaveURL(/sign-in/);
    });

    test('worker profile pushes anonymous visitors to /sign-in', async ({ page }) => {
        await page.goto('/en/worker/profile');
        await expect(page).toHaveURL(/sign-in/);
    });
});
