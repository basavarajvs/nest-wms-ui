import { test, expect } from '../config/fixtures'
import { setupAllMocks } from '../mocks/api/all-mocks'
import { setAuthState } from '../config/fixtures'

test.describe('Inventory - On Hand', () => {
  test.beforeEach(async ({ page }) => {
    await setupAllMocks(page)
    await setAuthState(page)
  })

  test('renders inventory page with data', async ({ page }) => {
    await page.goto('/inventory/on-hand')
    await page.waitForLoadState('networkidle')

    await expect(page.getByRole('heading', { name: 'Current Inventory' })).toBeVisible()
    await expect(page.getByText('Widget A')).toBeVisible()
    await expect(page.getByText('Widget B')).toBeVisible()
  })

  test('search filters inventory', async ({ page }) => {
    await page.goto('/inventory/on-hand')
    await page.waitForLoadState('networkidle')

    await page.getByPlaceholder('Search product, lot #...').fill('Widget A')
    await page.waitForTimeout(400)

    await expect(page.getByText('Widget A').first()).toBeVisible()
  })

  test('shows inventory quantities correctly', async ({ page }) => {
    await page.goto('/inventory/on-hand')
    await page.waitForLoadState('networkidle')

    await expect(page.getByText('500').first()).toBeVisible()
    await expect(page.getByText('100').first()).toBeVisible()
  })
})
