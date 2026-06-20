import { test, expect } from '@playwright/test';

test.describe('Library View', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display ShadowPod header', async ({ page }) => {
    await expect(page.locator('h1')).toHaveText('ShadowPod');
  });

  test('should have bottom navigation with 3 tabs', async ({ page }) => {
    const nav = page.locator('nav');
    await expect(nav).toBeVisible();

    // Check for Library, Search, Settings tabs using role
    await expect(nav.getByRole('button', { name: /Library/i })).toBeVisible();
    await expect(nav.getByRole('button', { name: /Search/i })).toBeVisible();
    await expect(nav.getByRole('button', { name: /Settings/i })).toBeVisible();
  });

  test('should navigate to upload when clicking add button', async ({ page }) => {
    // Click the add button in header
    await page.locator('header button').click();

    // Should navigate to /upload
    await expect(page).toHaveURL('/upload');
    await expect(page.getByText('Upload Audio')).toBeVisible();
  });

  test('should show search input when clicking Search tab', async ({ page }) => {
    // Click Search tab
    await page.locator('nav').getByRole('button', { name: /Search/i }).click();

    // Search input should appear
    const searchInput = page.locator('input[placeholder="Search audio..."]');
    await expect(searchInput).toBeVisible();
  });

  test('should open Settings modal when clicking Settings tab', async ({ page }) => {
    // Click Settings tab
    await page.locator('nav').getByRole('button', { name: /Settings/i }).click();

    // Settings modal should appear
    await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible();
    await expect(page.getByText('Deepgram API Key')).toBeVisible();
  });

  test('should close Settings modal when clicking X', async ({ page }) => {
    // Open Settings
    await page.locator('nav').getByRole('button', { name: /Settings/i }).click();
    await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible();

    // Close modal by clicking backdrop or close button
    await page.locator('[class*="material-symbols"]', { hasText: 'close' }).click();

    // Modal should be closed
    await expect(page.getByRole('heading', { name: 'Settings' })).not.toBeVisible();
  });

  test('should show empty state when no audio', async ({ page }) => {
    await expect(page.getByText('No audio yet')).toBeVisible();
  });
});

test.describe('Upload Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/upload');
  });

  test('should display upload dropzone', async ({ page }) => {
    await expect(page.getByText('Drag & drop audio file here')).toBeVisible();
    await expect(page.getByText('or tap to browse')).toBeVisible();
  });

  test('should navigate back to library when clicking back arrow', async ({ page }) => {
    await page.locator('header button').first().click();
    await expect(page).toHaveURL('/');
  });

  test('should show API key warning if not configured', async ({ page }) => {
    await expect(page.getByText(/Vui lòng cấu hình Deepgram API key/)).toBeVisible();
  });
});

test.describe('Settings Modal', () => {
  test('should save API key', async ({ page }) => {
    await page.goto('/');

    // Open Settings
    await page.locator('nav').getByRole('button', { name: /Settings/i }).click();

    // Enter API key
    const input = page.locator('input[placeholder="Enter your API key"]');
    await input.fill('test-api-key-12345');

    // Save
    await page.getByRole('button', { name: 'Save' }).click();

    // Modal should close
    await expect(page.getByRole('heading', { name: 'Settings' })).not.toBeVisible();

    // Reopen and verify key is saved
    await page.locator('nav').getByRole('button', { name: /Settings/i }).click();
    await expect(page.getByText('API key saved')).toBeVisible();
  });
});
