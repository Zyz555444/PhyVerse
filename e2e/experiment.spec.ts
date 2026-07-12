import { test, expect } from '@playwright/test'

test('experiment page loads and shows controls', async ({ page }) => {
  await page.goto('/experiment/mechanics/free-fall')
  await expect(page.locator('text=自由落体')).toBeVisible()
  await expect(page.locator('text=参数')).toBeVisible()
  await expect(page.locator('text=数据')).toBeVisible()
})

test('pausing experiment updates button text', async ({ page }) => {
  await page.goto('/experiment/mechanics/free-fall')
  const pauseButton = page.locator('button:has-text("暂停")').first()
  await pauseButton.click()
  await expect(page.locator('button:has-text("运行")').first()).toBeVisible()
})
