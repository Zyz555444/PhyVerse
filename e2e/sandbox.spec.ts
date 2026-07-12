import { test, expect } from '@playwright/test'

test('sandbox page loads and shows equipment palette', async ({ page }) => {
  await page.goto('/sandbox')
  await expect(page.locator('text=自由实验')).toBeVisible()
  await expect(page.locator('text=器材库')).toBeVisible()
})

test('adding equipment updates the scene hint', async ({ page }) => {
  await page.goto('/sandbox')
  const addButton = page.locator('button:has-text("长方体")').first()
  await addButton.click()
  await expect(page.locator('text=从左侧器材库添加器材开始搭建场景')).toBeHidden()
})
