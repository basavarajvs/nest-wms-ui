import { test as base, expect, type Page } from '@playwright/test'

export async function setAuthState(page: Page) {
  await page.addInitScript(() => {
    const userInfo = JSON.stringify({
      id: 'user-2',
      username: 'warehouse.manager',
      email: 'warehouse.manager@somemail.com',
      firstName: 'Warehouse',
      lastName: 'Manager',
      tenantId: '3',
      tenantCode: 'DE0001',
      tenantName: 'Demo Tenant',
      roles: ['WAREHOUSE_ADMIN', 'SYSTEM_ADMIN'],
      permissions: ['read', 'write', 'delete', 'manage'],
    })
    localStorage.setItem('auth_token', 'mock-jwt-token')
    localStorage.setItem('refresh_token', 'mock-refresh-token')
    localStorage.setItem('tenant_code', 'DE0001')
    localStorage.setItem('facility_code', 'FAC-001')
    localStorage.setItem('user_info', userInfo)
  })
}

const test = base.extend({})
export { test, expect }
