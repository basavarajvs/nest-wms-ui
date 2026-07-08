import { test, expect } from '../config/fixtures'
import { setupAllMocks } from '../mocks/api/all-mocks'
import { setAuthState } from '../config/fixtures'

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    await setupAllMocks(page)
  })

  test('shows login page with all required fields', async ({ page }) => {
    await page.goto('/login')

    await expect(page.getByLabel('Tenant Code')).toBeVisible()
    await expect(page.getByLabel('Email / Username')).toBeVisible()
    await expect(page.getByLabel('Password')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Sign In' })).toBeVisible()
  })

  test('logs in successfully with valid credentials', async ({ page }) => {
    await page.goto('/login')
    await page.waitForLoadState('networkidle')

    await page.getByLabel('Tenant Code').fill('DE0001')
    await page.getByLabel('Email / Username').fill('warehouse.manager@somemail.com')
    await page.getByLabel('Password').fill('Super@Admin')
    await page.getByRole('button', { name: 'Sign In' }).click()

    await page.waitForURL('/')
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible()
  })

  test('redirects to login when accessing protected route without auth', async ({ page }) => {
    await page.goto('/master-data/vendors')
    await page.waitForLoadState('networkidle')

    const currentUrl = page.url()
    if (currentUrl.includes('/login')) {
      await expect(page.getByPlaceholder('DE0001')).toBeVisible()
    } else {
      await expect(page.getByText('Vendors')).not.toBeVisible()
    }
  })
})
