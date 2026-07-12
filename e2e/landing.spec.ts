import { test, expect } from '@playwright/test'

test('homepage loads and shows experiment categories', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'PhyVerse' }).first()).toBeVisible()
  await expect(page.getByRole('button', { name: '力学' })).toBeVisible()
  await expect(page.getByRole('button', { name: '电磁学' })).toBeVisible()
})

test('search filters experiments', async ({ page }) => {
  await page.goto('/')
  const search = page.locator('input[placeholder="搜索实验..."]').first()
  await search.fill('自由落体')
  await search.press('Enter')
  await expect(page.getByText('自由落体').first()).toBeVisible()
})
