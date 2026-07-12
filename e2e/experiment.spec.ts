import { test, expect } from '@playwright/test'

test('experiment page loads and shows controls', async ({ page }) => {
  await page.goto('/experiment/mechanics/MECH-03')
  await expect(page.getByRole('heading', { name: '验证真空中重物下落快慢' })).toBeVisible()
  await expect(page.getByText('参数').first()).toBeVisible()
  await expect(page.getByText('数据').first()).toBeVisible()
})

test('pausing experiment updates button text', async ({ page }) => {
  await page.goto('/experiment/mechanics/MECH-03')
  const pauseButton = page.getByRole('button', { name: '暂停' }).first()
  await pauseButton.click()
  await expect(page.getByRole('button', { name: '运行' }).first()).toBeVisible()
})
