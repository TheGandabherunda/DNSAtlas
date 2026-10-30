import { test, expect } from '@playwright/test';

test.describe('DNSAtlas End-to-End User Journeys', () => {
  test('loads Dashboard and checks neutral UI elements', async ({ page }) => {
    await page.goto('/');

    // Check title
    await expect(page).toHaveTitle(/DNSAtlas/);

    // Verify neutral heading
    await expect(page.getByRole('heading', { name: 'DNS Benchmarking' })).toBeVisible();

    // Verify benchmark presets are available
    await expect(page.getByRole('button', { name: /Quick/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Standard/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Detailed/i })).toBeVisible();

    // Verify provider selector shows providers
    await expect(page.getByText('Select Providers to Benchmark')).toBeVisible();
  });

  test('navigates to DNS Explorer and filters providers', async ({ page }) => {
    await page.goto('/');

    // Navigate to DNS Explorer
    await page.getByRole('button', { name: 'DNS Explorer' }).click();

    // Verify heading
    await expect(page.getByRole('heading', { name: 'DNS Provider Directory' })).toBeVisible();

    // Verify default alphabetical ordering shows AdGuard first
    const firstProviderCard = page.locator('h3').first();
    await expect(firstProviderCard).toContainText(/AdGuard DNS/);

    // Filter by search query "Quad9"
    await page.getByPlaceholder(/Search by provider name/i).fill('Quad9');
    await expect(page.getByText('Quad9 (Malware Blocking)')).toBeVisible();
  });

  test('navigates to Setup Guides and views Apple .mobileconfig download', async ({ page }) => {
    await page.goto('/');

    // Navigate to Setup Guides
    await page.getByRole('button', { name: 'Setup Guides' }).click();

    await expect(page.getByRole('heading', { name: 'DNS Configuration Guides' })).toBeVisible();

    // Switch to macOS
    await page.getByRole('button', { name: /macOS/i }).click();

    // Verify step by step instructions
    await expect(page.getByText(/Step-by-Step Instructions/i)).toBeVisible();
  });

  test('navigates to Check My DNS and observes honest limitation disclosures', async ({ page }) => {
    await page.goto('/');

    // Navigate to Check My DNS
    await page.getByRole('button', { name: 'Check My DNS' }).click();

    await expect(page.getByRole('heading', { name: 'Check My DNS Diagnostics' })).toBeVisible();
    await expect(page.getByText(/Honest Technical Limitations of Browser-Based Diagnostics/i)).toBeVisible();
  });
});

