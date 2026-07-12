import { test, expect } from '@playwright/test'

test('sandbox page loads and shows equipment palette', async ({ page }) => {
  await page.goto('/sandbox')
  await expect(page.getByRole('heading', { name: '自由实验' })).toBeVisible()
  await expect(page.getByRole('button', { name: '长方体' }).first()).toBeVisible()
})

test('adding equipment updates the scene hint', async ({ page }) => {
  await page.goto('/sandbox')
  const hint = page.getByText('从左侧器材库添加器材或选择预设开始搭建场景')
  await expect(hint).toBeVisible()
  await page.getByRole('button', { name: '长方体' }).first().click()
  await expect(hint).toBeHidden()
})

test('run/pause toggle changes button label', async ({ page }) => {
  await page.goto('/sandbox')
  const toggle = page.getByRole('button', { name: '暂停' })
  await expect(toggle).toBeVisible()
  await toggle.click()
  await expect(page.getByRole('button', { name: '运行' })).toBeVisible()
})

test('delete button removes selected equipment', async ({ page }) => {
  await page.goto('/sandbox')
  await page.getByRole('button', { name: '长方体' }).first().click()
  await expect(page.getByText('从左侧器材库添加器材或选择预设开始搭建场景')).toBeHidden()

  await page.getByRole('button', { name: '删除' }).first().click()
  await expect(page.getByText('从左侧器材库添加器材或选择预设开始搭建场景')).toBeVisible()
})
