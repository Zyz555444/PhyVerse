import { test, expect } from '@playwright/test'

test('sandbox page loads and shows equipment palette', async ({ page }) => {
  await page.goto('/sandbox')
  await expect(page.getByRole('heading', { name: '自由实验' })).toBeVisible()
  await expect(page.getByRole('button', { name: '长方体' }).first()).toBeVisible()
})

test('adding equipment updates the scene hint', async ({ page }) => {
  await page.goto('/sandbox')
  const hint = page.getByText('从左侧器材库添加器材开始搭建场景')
  await expect(hint).toBeVisible()
  await page.getByRole('button', { name: '长方体' }).first().click()
  await expect(hint).toBeHidden()
})
