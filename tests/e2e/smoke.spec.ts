import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

test('home page renders the hello-world Inertia page', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Hello, world' })).toBeVisible()
  await expect(page).toHaveTitle(/J Galenti/)
})

test('home page has no axe violations', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Hello, world' })).toBeVisible()
  const results = await new AxeBuilder({ page }).analyze()
  expect(results.violations).toEqual([])
})
