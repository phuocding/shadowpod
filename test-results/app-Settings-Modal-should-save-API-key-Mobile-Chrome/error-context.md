# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: app.spec.ts >> Settings Modal >> should save API key
- Location: tests/app.spec.ts:87:3

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: locator.click: Test timeout of 30000ms exceeded.
Call log:
  - waiting for locator('nav').getByRole('button', { name: /Settings/i })

```

# Page snapshot

```yaml
- generic [ref=e3]:
  - generic [ref=e4]:
    - img "ShadowPod" [ref=e6]
    - heading "Welcome to ShadowPod" [level=1] [ref=e7]
    - paragraph [ref=e8]: Train your ears. One sentence at a time.
  - generic [ref=e9]:
    - button "headphones Try Sample Audio FREE Practice with curated content. No setup needed." [ref=e10]:
      - generic [ref=e11]:
        - generic [ref=e13]: headphones
        - generic [ref=e14]:
          - generic [ref=e15]:
            - heading "Try Sample Audio" [level=3] [ref=e16]
            - generic [ref=e17]: FREE
          - paragraph [ref=e18]: Practice with curated content. No setup needed.
    - button "cloud_upload Upload Your Own Use your teacher's audio, podcasts, anything!" [ref=e19]:
      - generic [ref=e20]:
        - generic [ref=e22]: cloud_upload
        - generic [ref=e23]:
          - heading "Upload Your Own" [level=3] [ref=e24]
          - paragraph [ref=e25]: Use your teacher's audio, podcasts, anything!
  - generic [ref=e26]:
    - paragraph [ref=e27]: Free forever • No subscriptions
    - button "I'll explore first" [ref=e28]
```

# Test source

```ts
  1   | import { test, expect } from '@playwright/test';
  2   | 
  3   | test.describe('Library View', () => {
  4   |   test.beforeEach(async ({ page }) => {
  5   |     await page.goto('/');
  6   |   });
  7   | 
  8   |   test('should display ShadowPod header', async ({ page }) => {
  9   |     await expect(page.locator('h1')).toHaveText('ShadowPod');
  10  |   });
  11  | 
  12  |   test('should have bottom navigation with 3 tabs', async ({ page }) => {
  13  |     const nav = page.locator('nav');
  14  |     await expect(nav).toBeVisible();
  15  | 
  16  |     // Check for Library, Search, Settings tabs using role
  17  |     await expect(nav.getByRole('button', { name: /Library/i })).toBeVisible();
  18  |     await expect(nav.getByRole('button', { name: /Search/i })).toBeVisible();
  19  |     await expect(nav.getByRole('button', { name: /Settings/i })).toBeVisible();
  20  |   });
  21  | 
  22  |   test('should navigate to upload when clicking add button', async ({ page }) => {
  23  |     // Click the add button in header
  24  |     await page.locator('header button').click();
  25  | 
  26  |     // Should navigate to /upload
  27  |     await expect(page).toHaveURL('/upload');
  28  |     await expect(page.getByText('Upload Audio')).toBeVisible();
  29  |   });
  30  | 
  31  |   test('should show search input when clicking Search tab', async ({ page }) => {
  32  |     // Click Search tab
  33  |     await page.locator('nav').getByRole('button', { name: /Search/i }).click();
  34  | 
  35  |     // Search input should appear
  36  |     const searchInput = page.locator('input[placeholder="Search audio..."]');
  37  |     await expect(searchInput).toBeVisible();
  38  |   });
  39  | 
  40  |   test('should open Settings modal when clicking Settings tab', async ({ page }) => {
  41  |     // Click Settings tab
  42  |     await page.locator('nav').getByRole('button', { name: /Settings/i }).click();
  43  | 
  44  |     // Settings modal should appear
  45  |     await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible();
  46  |     await expect(page.getByText('Deepgram API Key')).toBeVisible();
  47  |   });
  48  | 
  49  |   test('should close Settings modal when clicking X', async ({ page }) => {
  50  |     // Open Settings
  51  |     await page.locator('nav').getByRole('button', { name: /Settings/i }).click();
  52  |     await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible();
  53  | 
  54  |     // Close modal by clicking backdrop or close button
  55  |     await page.locator('[class*="material-symbols"]', { hasText: 'close' }).click();
  56  | 
  57  |     // Modal should be closed
  58  |     await expect(page.getByRole('heading', { name: 'Settings' })).not.toBeVisible();
  59  |   });
  60  | 
  61  |   test('should show empty state when no audio', async ({ page }) => {
  62  |     await expect(page.getByText('No audio yet')).toBeVisible();
  63  |   });
  64  | });
  65  | 
  66  | test.describe('Upload Flow', () => {
  67  |   test.beforeEach(async ({ page }) => {
  68  |     await page.goto('/upload');
  69  |   });
  70  | 
  71  |   test('should display upload dropzone', async ({ page }) => {
  72  |     await expect(page.getByText('Drag & drop audio file here')).toBeVisible();
  73  |     await expect(page.getByText('or tap to browse')).toBeVisible();
  74  |   });
  75  | 
  76  |   test('should navigate back to library when clicking back arrow', async ({ page }) => {
  77  |     await page.locator('header button').first().click();
  78  |     await expect(page).toHaveURL('/');
  79  |   });
  80  | 
  81  |   test('should show API key warning if not configured', async ({ page }) => {
  82  |     await expect(page.getByText(/Vui lòng cấu hình Deepgram API key/)).toBeVisible();
  83  |   });
  84  | });
  85  | 
  86  | test.describe('Settings Modal', () => {
  87  |   test('should save API key', async ({ page }) => {
  88  |     await page.goto('/');
  89  | 
  90  |     // Open Settings
> 91  |     await page.locator('nav').getByRole('button', { name: /Settings/i }).click();
      |                                                                          ^ Error: locator.click: Test timeout of 30000ms exceeded.
  92  | 
  93  |     // Enter API key
  94  |     const input = page.locator('input[placeholder="Enter your API key"]');
  95  |     await input.fill('test-api-key-12345');
  96  | 
  97  |     // Save
  98  |     await page.getByRole('button', { name: 'Save' }).click();
  99  | 
  100 |     // Modal should close
  101 |     await expect(page.getByRole('heading', { name: 'Settings' })).not.toBeVisible();
  102 | 
  103 |     // Reopen and verify key is saved
  104 |     await page.locator('nav').getByRole('button', { name: /Settings/i }).click();
  105 |     await expect(page.getByText('API key saved')).toBeVisible();
  106 |   });
  107 | });
  108 | 
```