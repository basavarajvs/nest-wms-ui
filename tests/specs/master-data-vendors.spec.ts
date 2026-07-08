import { test, expect } from '../config/fixtures'
import { setupAllMocks } from '../mocks/api/all-mocks'
import { setAuthState } from '../config/fixtures'

test.describe('Master Data - Vendors CRUD', () => {
  test.beforeEach(async ({ page }) => {
    await setupAllMocks(page)
    await setAuthState(page)
  })

  test('renders vendor list page with data', async ({ page }) => {
    await page.goto('/master-data/vendors')
    await page.waitForLoadState('networkidle')

    await expect(page.getByRole('heading', { name: 'Vendors' })).toBeVisible()
    await expect(page.getByText('VEN-001').first()).toBeVisible()
    await expect(page.getByText('VEN-002').first()).toBeVisible()
    await expect(page.getByText('VEN-004').first()).toBeVisible()
  })

  test('search filters vendors by code', async ({ page }) => {
    await page.goto('/master-data/vendors')
    await page.waitForLoadState('networkidle')

    await page.getByPlaceholder('Search by code or name...').fill('VEN-001')
    await page.waitForTimeout(500)

    await expect(page.getByText('VEN-001').first()).toBeVisible()
    await expect(page.getByText('VEN-002').first()).not.toBeVisible()
  })

  test('creates a new vendor successfully', async ({ page }) => {
    await page.goto('/master-data/vendors')
    await page.waitForLoadState('networkidle')

    await page.getByRole('button', { name: 'Add Vendor' }).click()
    await expect(page.getByText('Add a new vendor')).toBeVisible()

    await page.getByPlaceholder('e.g. VEN-001').fill('VEN-100')
    await page.getByPlaceholder('Vendor name').fill('New Vendor Co.')
    await page.getByPlaceholder('Vendor description').fill('Test description')
    await page.getByRole('button', { name: 'Create' }).click()

    await expect(page.locator('[data-sonner-toast]').first()).toBeVisible({ timeout: 5000 })
  })

  test('shows validation errors on create form', async ({ page }) => {
    await page.goto('/master-data/vendors')
    await page.waitForLoadState('networkidle')

    await page.getByRole('button', { name: 'Add Vendor' }).click()
    await expect(page.getByText('Add a new vendor')).toBeVisible()

    await page.getByRole('button', { name: 'Create' }).click()

    await expect(page.getByText('Code is required')).toBeVisible()
    await expect(page.getByText('Name is required')).toBeVisible()
  })

  test('edits an existing vendor', async ({ page }) => {
    await page.goto('/master-data/vendors')
    await page.waitForLoadState('networkidle')

    await page.getByRole('button', { name: 'Edit' }).first().click()

    await expect(page.getByText('Update vendor: Acme Supplies')).toBeVisible()

    const nameInput = page.getByPlaceholder('Vendor name')
    await nameInput.clear()
    await nameInput.fill('Acme Supplies Updated')

    await page.getByRole('button', { name: 'Save' }).click()

    await expect(page.locator('[data-sonner-toast]').first()).toBeVisible({ timeout: 5000 })
  })

  test('deletes a vendor successfully', async ({ page }) => {
    await page.goto('/master-data/vendors')
    await page.waitForLoadState('networkidle')

    await page.getByRole('button', { name: 'Delete' }).first().click()

    await expect(page.getByRole('alertdialog')).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Delete Vendor' })).toBeVisible()

    await page.getByRole('button', { name: 'Delete', exact: true }).click()

    await expect(page.locator('[data-sonner-toast]').first()).toBeVisible({ timeout: 5000 })
  })
})
