import { test, expect } from '../config/fixtures'
import { setupAllMocks } from '../mocks/api/all-mocks'
import { setAuthState } from '../config/fixtures'

test.describe('Outbound - Orders List', () => {
  test.beforeEach(async ({ page }) => {
    await setupAllMocks(page)
    await setAuthState(page)
  })

  test('renders orders list page with data', async ({ page }) => {
    await page.goto('/outbound/orders')
    await page.waitForLoadState('networkidle')

    await expect(page.getByRole('heading', { name: 'Sales Orders' })).toBeVisible()
    await expect(page.getByText('ORD-2024-0001')).toBeVisible()
    await expect(page.getByText('ORD-2024-0002')).toBeVisible()
  })

  test('search filters orders', async ({ page }) => {
    await page.goto('/outbound/orders')
    await page.waitForLoadState('networkidle')

    await page.getByPlaceholder('Search order #, customer...').fill('Acme')
    await page.waitForTimeout(400)

    await expect(page.getByText('ORD-2024-0001')).toBeVisible()
    await expect(page.getByText('ORD-2024-0002')).not.toBeVisible()
  })
})
