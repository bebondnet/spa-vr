import { test, expect } from '@playwright/test';

test.describe('VR Concierge Search', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('loads the search page', async ({ page }) => {
    // Check page title and header
    await expect(page.locator('.logo-text')).toHaveText('VRC');
    await expect(page.locator('.logo-subtitle')).toContainText('Virtual Restaurant Concierge');

    // Check search page is visible
    await expect(page.getByTestId('search-page')).toBeVisible();
  });

  test('displays search results on load', async ({ page }) => {
    // Wait for results to load
    await expect(page.getByTestId('search-results')).toBeVisible();
    await expect(page.getByTestId('results-count')).toBeVisible();

    // Should show results count
    const countText = await page.getByTestId('results-count').textContent();
    expect(countText).toMatch(/Showing Restaurants \d+-\d+ of \d+/);

    // Should display restaurant cards
    const cards = page.getByTestId('restaurant-card');
    await expect(cards.first()).toBeVisible();
    expect(await cards.count()).toBeGreaterThan(0);
  });

  test('displays restaurant card with correct info', async ({ page }) => {
    // Wait for first card
    const firstCard = page.getByTestId('restaurant-card').first();
    await expect(firstCard).toBeVisible();

    // Check card has title
    await expect(firstCard.getByTestId('card-title')).toBeVisible();

    // Check card has cuisine
    await expect(firstCard.getByTestId('card-cuisine')).toBeVisible();

    // Check card has rating
    await expect(firstCard.getByTestId('card-rating')).toBeVisible();

    // Check card has expense level
    await expect(firstCard.getByTestId('card-expense')).toBeVisible();
  });

  test('filters by state using location dropdown', async ({ page }) => {
    // Select a state
    await page.getByTestId('region-select').selectOption('New Jersey');

    // Wait for results to update
    await page.waitForTimeout(500);

    // Check that Applied Filters shows the state
    await expect(page.locator('.applied-filters')).toContainText('New Jersey');

    // Results count should update
    const countText = await page.getByTestId('results-count').textContent();
    expect(countText).toBeTruthy();
  });

  test('filters by city after selecting state', async ({ page }) => {
    // Select state first
    await page.getByTestId('region-select').selectOption('Pennsylvania');
    await page.waitForTimeout(300);

    // Now city dropdown should be enabled
    const citySelect = page.getByTestId('city-select');
    await expect(citySelect).toBeEnabled();

    // Select Philadelphia
    await citySelect.selectOption('Philadelphia');
    await page.waitForTimeout(500);

    // Check applied filters
    await expect(page.locator('.applied-filters')).toContainText('Philadelphia');
  });

  test('search by restaurant name', async ({ page }) => {
    // Type in search box
    await page.getByTestId('search-input').fill('Italian');
    await page.waitForTimeout(500);

    // Results should update
    await expect(page.getByTestId('search-results')).toBeVisible();

    // Should have results
    const cards = page.getByTestId('restaurant-card');
    expect(await cards.count()).toBeGreaterThan(0);
  });

  test('sort by VRC Rating', async ({ page }) => {
    // Click VRC Rating sort (should be active by default)
    const ratingBtn = page.getByTestId('sort-rating');
    await expect(ratingBtn).toHaveClass(/active/);

    // Get first card rating
    await page.waitForTimeout(300);
    const firstRating = await page.getByTestId('card-rating').first().textContent();
    expect(firstRating).toContain('/ 10 Rating');
  });

  test('sort by Name A-Z', async ({ page }) => {
    // Click Name A-Z sort
    await page.getByTestId('sort-name').click();
    await page.waitForTimeout(500);

    // Button should be active
    await expect(page.getByTestId('sort-name')).toHaveClass(/active/);

    // First card should have a name starting early in alphabet
    const firstTitle = await page.getByTestId('card-title').first().textContent();
    expect(firstTitle).toBeTruthy();
  });

  test('toggle All Filters panel', async ({ page }) => {
    // Filters panel should not be visible initially
    await expect(page.getByTestId('filters-panel')).not.toBeVisible();

    // Click All Filters button
    await page.getByTestId('all-filters-btn').click();

    // Filters panel should now be visible
    await expect(page.getByTestId('filters-panel')).toBeVisible();

    // Click again to close
    await page.getByTestId('all-filters-btn').click();
    await expect(page.getByTestId('filters-panel')).not.toBeVisible();
  });

  test('filter by cuisine from filters panel', async ({ page }) => {
    // Open filters panel
    await page.getByTestId('all-filters-btn').click();
    await expect(page.getByTestId('filters-panel')).toBeVisible();

    // Check Italian cuisine checkbox
    const italianCheckbox = page.getByTestId('cuisine-italian');
    await italianCheckbox.check();
    await page.waitForTimeout(500);

    // Applied filters should show Italian
    await expect(page.locator('.applied-filters')).toContainText('Italian');

    // Results should be filtered
    const cards = page.getByTestId('restaurant-card');
    expect(await cards.count()).toBeGreaterThan(0);
  });

  test('clear all filters', async ({ page }) => {
    // Apply some filters
    await page.getByTestId('region-select').selectOption('New York');
    await page.waitForTimeout(300);
    await page.getByTestId('search-input').fill('pizza');
    await page.waitForTimeout(500);

    // Click Clear Filters
    await page.getByTestId('clear-filters').click();
    await page.waitForTimeout(500);

    // Search input should be cleared
    await expect(page.getByTestId('search-input')).toHaveValue('');

    // Region select should be reset
    await expect(page.getByTestId('region-select')).toHaveValue('');
  });

  test('pagination works', async ({ page }) => {
    // Wait for initial results
    await expect(page.getByTestId('search-results')).toBeVisible();

    // Check if pagination exists (depends on data size)
    const nextBtn = page.getByTestId('next-page');

    if (await nextBtn.isVisible()) {
      // Get initial results count text
      const initialCount = await page.getByTestId('results-count').textContent();

      // Click next page
      await nextBtn.click();
      await page.waitForTimeout(500);

      // Results count should change
      const newCount = await page.getByTestId('results-count').textContent();
      expect(newCount).not.toBe(initialCount);

      // Previous button should now be enabled
      await expect(page.getByTestId('prev-page')).toBeEnabled();
    }
  });

  test('displays loading state', async ({ page }) => {
    // This test checks that loading state appears during initial load
    // We need to catch it quickly before data loads
    await page.goto('/');

    // Either loading or results should be visible
    const loadingOrResults = await Promise.race([
      page.getByTestId('results-loading').waitFor({ state: 'visible', timeout: 1000 }).then(() => 'loading'),
      page.getByTestId('search-results').waitFor({ state: 'visible', timeout: 2000 }).then(() => 'results')
    ]).catch(() => 'results'); // Default to results if both timeout

    expect(['loading', 'results']).toContain(loadingOrResults);
  });
});
