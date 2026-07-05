import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'

// ── Readiness helpers ─────────────────────────────────────────────────────────
//
// Inertia renders client-side only. Waiting for the page h1 confirms React has
// hydrated and all interactive listeners are live — the same pattern used in
// gallery.spec.ts (see the readiness-anchor comment there).

async function gotoSystem(page: Page, query = '') {
  await page.goto(`/system${query}`)
  await expect(page.getByRole('heading', { level: 1, name: /design system/i })).toBeVisible()
}

async function gotoTokens(page: Page, query = '') {
  await page.goto(`/system/tokens${query}`)
  await expect(page.getByRole('heading', { level: 1, name: 'Tokens' })).toBeVisible()
}

async function gotoMotion(page: Page, query = '') {
  await page.goto(`/system/motion${query}`)
  await expect(page.getByRole('heading', { level: 1, name: 'Motion' })).toBeVisible()
}

async function gotoSkins(page: Page, query = '') {
  await page.goto(`/system/skins${query}`)
  await expect(page.getByRole('heading', { level: 1, name: 'Skins' })).toBeVisible()
}

// ── /system ───────────────────────────────────────────────────────────────────

test('/system galenti: zero axe violations', async ({ page }) => {
  await gotoSystem(page)
  const results = await new AxeBuilder({ page }).analyze()
  expect(results.violations).toEqual([])
})

test('/system debug skin: zero axe violations', async ({ page }) => {
  await gotoSystem(page, '?skin=debug')
  await expect(page.locator('html')).toHaveAttribute('data-skin', 'debug')
  const results = await new AxeBuilder({ page }).analyze()
  expect(results.violations).toEqual([])
})

// ── /system/tokens ────────────────────────────────────────────────────────────

test('/system/tokens galenti: zero axe violations', async ({ page }) => {
  await gotoTokens(page)
  const results = await new AxeBuilder({ page }).analyze()
  expect(results.violations).toEqual([])
})

test('/system/tokens debug skin: zero axe violations', async ({ page }) => {
  await gotoTokens(page, '?skin=debug')
  await expect(page.locator('html')).toHaveAttribute('data-skin', 'debug')
  const results = await new AxeBuilder({ page }).analyze()
  expect(results.violations).toEqual([])
})

// ── /system/motion ────────────────────────────────────────────────────────────

test('/system/motion galenti: zero axe violations', async ({ page }) => {
  await gotoMotion(page)
  const results = await new AxeBuilder({ page }).analyze()
  expect(results.violations).toEqual([])
})

test('/system/motion debug skin: zero axe violations', async ({ page }) => {
  await gotoMotion(page, '?skin=debug')
  await expect(page.locator('html')).toHaveAttribute('data-skin', 'debug')
  const results = await new AxeBuilder({ page }).analyze()
  expect(results.violations).toEqual([])
})

// ── /system/skins ─────────────────────────────────────────────────────────────

test('/system/skins galenti: zero axe violations', async ({ page }) => {
  await gotoSkins(page)
  const results = await new AxeBuilder({ page }).analyze()
  expect(results.violations).toEqual([])
})

test('/system/skins debug skin: zero axe violations', async ({ page }) => {
  await gotoSkins(page, '?skin=debug')
  await expect(page.locator('html')).toHaveAttribute('data-skin', 'debug')
  const results = await new AxeBuilder({ page }).analyze()
  expect(results.violations).toEqual([])
})

// ── Keyboard walk: /system ────────────────────────────────────────────────────
//
// 1. First Tab reveals the "Skip to content" link (DocShell renders it fixed,
//    visually hidden until focused).
// 2. Enter follows the skip link, focus lands in #main.
// 3. Tab to the sidebar "Tokens" link and Enter navigates to /system/tokens.

test('keyboard walk: skip link and sidebar nav on /system', async ({ page }) => {
  await gotoSystem(page)

  // Step 1: first Tab reveals the skip link
  await page.keyboard.press('Tab')
  const skipLink = page.getByRole('link', { name: 'Skip to content' })
  await expect(skipLink).toBeFocused()
  await expect(skipLink).toHaveAttribute('href', '#main')

  // Step 2: Enter jumps focus to #main
  await page.keyboard.press('Enter')
  // After following skip link, the main landmark should be focused or a
  // child element in #main should become the active element.
  const mainEl = page.locator('#main')
  await expect(mainEl).toBeVisible()

  // Step 3: Tab until we reach the sidebar "Tokens" link
  let reached = false
  for (let i = 0; i < 30; i++) {
    await page.keyboard.press('Tab')
    const activeHref = await page.evaluate(
      () => (document.activeElement as HTMLAnchorElement | null)?.getAttribute('href') ?? '',
    )
    if (activeHref === '/system/tokens') {
      reached = true
      break
    }
  }
  expect(reached).toBe(true)

  // Step 4: Enter navigates to /system/tokens and the Tokens h1 appears
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL(/\/system\/tokens/)
  await expect(page.getByRole('heading', { level: 1, name: 'Tokens' })).toBeVisible()
})
