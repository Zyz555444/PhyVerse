import { test, expect } from '@playwright/test'

test('homepage loads and shows experiment categories', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('text=PhyVerse')).toBeVisible()
  await expect(page.locator('text=力学')).toBeVisible()
  await expect(page.locator('text=电磁学')).toBeVisible()
})

test('search filters experiments', async ({ page }) => {
  await page.goto('/')
  const search = page.locator('input[placeholder*="搜索"]')
  await search.fill('自由落体')
  await search.press('Enter')
  await expect(page.locator('text=自由落体')).toBeVisible()
})
