import { test, expect } from '../config/fixtures'
import { setupAllMocks } from '../mocks/api/all-mocks'
import { setAuthState } from '../config/fixtures'

test.describe('DataTable Interactions', () => {
  test.beforeEach(async ({ page }) => {
    await setupAllMocks(page)
    await setAuthState(page)
  })

  test('displays pagination info for multi-page data', async ({ page }) => {
    await page.goto('/master-data/vendors?page=1&limit=2')
    await page.waitForLoadState('networkidle')

    await expect(page.getByText(/Showing/)).toBeVisible()
    const paginationText = await page.getByText(/Showing/).textContent()
    expect(paginationText).toMatch(/Showing \d+-\d+ of \d+/)
  })

  test('pagination next page button navigates to page 2', async ({ page }) => {
    await page.goto('/master-data/vendors?page=1&limit=2')
    await page.waitForLoadState('networkidle')

    await page.getByRole('heading', { name: 'Vendors' }).waitFor()

    const pageCount = page.getByText(/Page \d+ of \d+/)
    const paginationBar = pageCount.locator('xpath=..')
    const nextButton = paginationBar.locator('button').filter({ has: page.locator('svg.lucide-chevron-right') })
    await expect(nextButton).toBeEnabled({ timeout: 5000 })

    await nextButton.click()
    await page.waitForTimeout(500)

    await expect(nextButton).toBeDisabled({ timeout: 5000 })
  })

  test('search input updates URL with query param', async ({ page }) => {
    await page.goto('/master-data/vendors')
    await page.waitForLoadState('networkidle')

    await page.getByPlaceholder('Search by code or name...').fill('VEN-001')
    await page.waitForTimeout(500)

    expect(page.url()).toContain('q=VEN-001')
  })
})
