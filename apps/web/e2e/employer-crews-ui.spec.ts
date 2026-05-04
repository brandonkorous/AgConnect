import { expect, test } from '@playwright/test';

// Anonymous-only UI smoke for the /employer/crews surface. Authenticated flow
// is gated on a Clerk session and is covered by the manual sign-off checklist
// in docs/sign-off.

test.describe('/employer/crews · anonymous redirect', () => {
  test('EN unauthenticated visit pushes to sign-in', async ({ page }) => {
    await page.goto('/en/employer/crews');
    await expect(page).toHaveURL(/sign-in/);
  });

  test('ES unauthenticated visit pushes to sign-in', async ({ page }) => {
    await page.goto('/es/employer/crews');
    await expect(page).toHaveURL(/sign-in/);
  });

  test('week query parameter survives the redirect', async ({ page }) => {
    await page.goto('/en/employer/crews?week=2026-06-01');
    await expect(page).toHaveURL(/sign-in/);
    // Clerk preserves the original URL via redirect_url.
    await expect(page).toHaveURL(/employer%2Fcrews/);
    await expect(page).toHaveURL(/week%3D2026-06-01/);
  });
});

test.describe('/employer/crews/new-shift · prefill query parameters', () => {
  test('crewId + date params survive the redirect', async ({ page }) => {
    await page.goto(
      '/en/employer/crews/new-shift?crewId=11111111-1111-1111-1111-111111111111&date=2026-06-15',
    );
    await expect(page).toHaveURL(/sign-in/);
    await expect(page).toHaveURL(/crewId%3D11111111/);
    await expect(page).toHaveURL(/date%3D2026-06-15/);
  });
});

test.describe('/employer/crews/shifts/[id]/edit · edit-shift route', () => {
  test('EN unauthenticated visit pushes to sign-in with the shift id preserved', async ({
    page,
  }) => {
    await page.goto('/en/employer/crews/shifts/22222222-2222-2222-2222-222222222222/edit');
    await expect(page).toHaveURL(/sign-in/);
    await expect(page).toHaveURL(/shifts%2F22222222/);
  });

  test('ES unauthenticated visit pushes to sign-in', async ({ page }) => {
    await page.goto('/es/employer/crews/shifts/22222222-2222-2222-2222-222222222222/edit');
    await expect(page).toHaveURL(/sign-in/);
  });
});
