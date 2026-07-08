import { test, expect } from '../config/fixtures'
import { setupAllMocks } from '../mocks/api/all-mocks'
import { setAuthState } from '../config/fixtures'

test.describe('Error Handling & Loading States', () => {
  test.beforeEach(async ({ page }) => {
    await setAuthState(page)
  })

  test('shows error state when list API fails', async ({ page }) => {
    await setupAllMocks(page)
    await page.route('http://localhost:3002/api/v1/wms/web/vendors**', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 500,
          contentType: 'application/problem+json',
          body: JSON.stringify({ type: 'https://httpstatuses.org/500', title: 'Internal Server Error', detail: 'Database connection failed', status: 500 }),
        })
      }
    })

    await page.goto('/master-data/vendors')
    await page.waitForLoadState('networkidle')

    await expect(page.getByText('Failed to load data')).toBeVisible()
    await expect(page.getByText('Try again')).toBeVisible()
  })

  test('shows error toast on mutation failure', async ({ page }) => {
    await setupAllMocks(page)
    await page.route('http://localhost:3002/api/v1/wms/web/vendors**', async (route) => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 400,
          contentType: 'application/problem+json',
          body: JSON.stringify({ type: 'https://httpstatuses.org/400', title: 'Bad Request', detail: 'Vendor code already exists', status: 400, errors: { vendor_code: 'Vendor code must be unique' } }),
        })
      }
    })

    await page.goto('/master-data/vendors')
    await page.waitForLoadState('networkidle')

    await page.getByRole('button', { name: 'Add Vendor' }).click()
    await page.getByPlaceholder('e.g. VEN-001').fill('DUPLICATE')
    await page.getByPlaceholder('Vendor name').fill('Duplicate Vendor')
    await page.getByRole('button', { name: 'Create' }).click()

    await expect(page.getByText('Vendor code already exists')).toBeVisible({ timeout: 5000 })
  })

  test('shows loading skeleton while fetching data', async ({ page }) => {
    await setupAllMocks(page)
    await page.route('http://localhost:3002/api/v1/wms/web/vendors**', async (route) => {
      if (route.request().method() === 'GET') {
        await new Promise((resolve) => setTimeout(resolve, 1500))
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, data: { data: [], total: 0, page: 1, limit: 20 } }),
        })
      }
    })

    await page.goto('/master-data/vendors')

    const skeleton = page.locator('.animate-pulse').first()
    await expect(skeleton).toBeVisible({ timeout: 3000 })
  })
})
