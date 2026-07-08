import { test, expect } from '../config/fixtures'
import { setupAllMocks } from '../mocks/api/all-mocks'
import { setAuthState } from '../config/fixtures'

test.describe('Inbound - ASN Flow', () => {
  test.beforeEach(async ({ page }) => {
    await setupAllMocks(page)
    await setAuthState(page)
  })

  test('renders ASN list page with data', async ({ page }) => {
    await page.goto('/inbound/asns')
    await page.waitForLoadState('networkidle')

    await expect(page.getByRole('heading', { name: 'Advance Shipping Notices' })).toBeVisible()
    await expect(page.getByText('ASN-2024-0001').first()).toBeVisible()
    await expect(page.getByText('ASN-2024-0002').first()).toBeVisible()
  })

  test('search filters ASNs', async ({ page }) => {
    await page.goto('/inbound/asns')
    await page.waitForLoadState('networkidle')

    await page.getByPlaceholder('Search by ASN #, PO #, vendor...').fill('ASN-2024-0001')
    await page.waitForTimeout(500)

    await expect(page.getByText('ASN-2024-0001').first()).toBeVisible()
    await expect(page.getByText('ASN-2024-0002').first()).not.toBeVisible()
  })

  test('opens create ASN wizard', async ({ page }) => {
    await page.goto('/inbound/asns')
    await page.waitForLoadState('networkidle')

    await page.getByRole('button', { name: 'Create ASN' }).click()
    await expect(page.getByText('Create ASN').first()).toBeVisible({ timeout: 5000 })
  })
})
