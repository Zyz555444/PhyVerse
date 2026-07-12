# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: experiment.spec.ts >> experiment page loads and shows controls
- Location: e2e\experiment.spec.ts:3:1

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('text=自由落体')
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for locator('text=自由落体')

```

```yaml
- banner:
  - link "PhyVerse":
    - /url: /
  - navigation:
    - link "Home":
      - /url: /
    - link "Sandbox":
      - /url: /sandbox
    - link "Settings":
      - /url: /settings
  - textbox "Search experiments..."
  - button "Dark"
  - button "切换到中文"
- main:
  - heading "实验未找到" [level=1]
  - paragraph: 无法找到 ID 为 "free-fall" 的实验。请检查链接或返回首页选择实验。
  - link "Home":
    - /url: /
    - button "Home"
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test'
  2  | 
  3  | test('experiment page loads and shows controls', async ({ page }) => {
  4  |   await page.goto('/experiment/mechanics/free-fall')
> 5  |   await expect(page.locator('text=自由落体')).toBeVisible()
     |                                           ^ Error: expect(locator).toBeVisible() failed
  6  |   await expect(page.locator('text=参数')).toBeVisible()
  7  |   await expect(page.locator('text=数据')).toBeVisible()
  8  | })
  9  | 
  10 | test('pausing experiment updates button text', async ({ page }) => {
  11 |   await page.goto('/experiment/mechanics/free-fall')
  12 |   const pauseButton = page.locator('button:has-text("暂停")').first()
  13 |   await pauseButton.click()
  14 |   await expect(page.locator('button:has-text("运行")').first()).toBeVisible()
  15 | })
  16 | 
```