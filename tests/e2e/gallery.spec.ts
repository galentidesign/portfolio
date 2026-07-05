import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'

// The gallery is M2's verify surface: all 16 components rendered from their
// glob-discovered demos, scanned under both shipped skins.

const COMPONENT_COUNT = 16

// Inertia renders client-side only — the demo sections existing means React
// has hydrated, so this doubles as the readiness anchor before any keyboard
// interaction (pre-hydration keypresses land on a page with no listeners).
async function gotoGallery(page: Page, query = '') {
  await page.goto(`/system/gallery${query}`)
  await expect(page.locator('[data-gallery-section]')).toHaveCount(COMPONENT_COUNT)
}

test('gallery renders all component sections', async ({ page }) => {
  await gotoGallery(page)
  await expect(page.getByRole('heading', { name: 'Component gallery' })).toBeVisible()
})

test('gallery galenti: zero axe violations', async ({ page }) => {
  await gotoGallery(page)
  const results = await new AxeBuilder({ page }).analyze()
  expect(results.violations).toEqual([])
})

test('gallery debug skin: zero axe violations', async ({ page }) => {
  await gotoGallery(page, '?skin=debug')
  await expect(page.locator('html')).toHaveAttribute('data-skin', 'debug')
  const results = await new AxeBuilder({ page }).analyze()
  expect(results.violations).toEqual([])
})

test('gallery axe: dialog open state', async ({ page }) => {
  await gotoGallery(page)
  await page.getByRole('button', { name: 'Open md dialog' }).click()
  await expect(page.getByRole('dialog')).toBeVisible()
  const results = await new AxeBuilder({ page }).analyze()
  expect(results.violations).toEqual([])
  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog')).toBeHidden()
})

test('gallery axe: palette open state', async ({ page }) => {
  await gotoGallery(page)
  await page.getByRole('button', { name: 'Search & commands' }).click()
  await expect(page.getByRole('combobox', { name: 'Search commands' })).toBeFocused()
  const results = await new AxeBuilder({ page }).analyze()
  expect(results.violations).toEqual([])
})

test('keyboard walk: palette via ⌘K — type, Enter, action performs', async ({ page }) => {
  await gotoGallery(page)
  await page.keyboard.press('ControlOrMeta+k')
  const input = page.getByRole('combobox', { name: 'Search commands' })
  await expect(input).toBeFocused()

  // Auto-highlighted top hit performs on Enter — the core palette gesture
  await input.fill('writing')
  await page.keyboard.press('Enter')
  await expect(page.getByRole('combobox')).toBeHidden()
  await expect(page.getByText('Last action: Writing')).toBeVisible()

  // Escape path: reopen, dismiss, focus returns to the trigger
  await page.keyboard.press('ControlOrMeta+k')
  await expect(input).toBeFocused()
  await page.keyboard.press('Escape')
  await expect(page.getByRole('combobox')).toBeHidden()
  await expect(page.getByRole('button', { name: 'Search & commands' })).toBeFocused()
})

test('keyboard walk: dialog focus is trapped and restored', async ({ page }) => {
  await gotoGallery(page)
  const trigger = page.getByRole('button', { name: 'Open md dialog' })
  await trigger.focus()
  await page.keyboard.press('Enter')
  await expect(page.getByRole('dialog')).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog')).toBeHidden()
  await expect(trigger).toBeFocused()
})

test('focus is visible on gallery interactive elements', async ({ page }) => {
  await gotoGallery(page)
  await page.keyboard.press('Tab')
  const probe = await page.evaluate(() => {
    const el = document.activeElement as HTMLElement
    const cs = getComputedStyle(el)
    return { outlineStyle: cs.outlineStyle, focusVisible: el.matches(':focus-visible') }
  })
  expect(probe.focusVisible).toBe(true)
  expect(probe.outlineStyle).not.toBe('none')
})
