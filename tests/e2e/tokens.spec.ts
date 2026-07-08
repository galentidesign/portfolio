import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'

// ── Surface colour helpers ────────────────────────────────────────────────────

async function mainBg(page: Page) {
  return page.evaluate(
    () => window.getComputedStyle(document.querySelector('main')!).backgroundColor,
  )
}

// ── Basic routing ─────────────────────────────────────────────────────────────

test('tokens page: galenti skin — surface is rgb(250, 246, 238)', async ({ page }) => {
  await page.goto('/system/tokens')
  await expect(page.getByRole('heading', { name: 'Tokens' })).toBeVisible()

  expect(await mainBg(page)).toBe('rgb(250, 246, 238)')
  await expect(page.locator('html')).toHaveAttribute('data-skin', 'galenti')
})

test('tokens page: debug skin — surface is rgb(11, 11, 18)', async ({ page }) => {
  await page.goto('/system/tokens?skin=debug')
  await expect(page.getByRole('heading', { name: 'Tokens' })).toBeVisible()

  expect(await mainBg(page)).toBe('rgb(11, 11, 18)')
  await expect(page.locator('html')).toHaveAttribute('data-skin', 'debug')
})

// ── Axe — both skins ──────────────────────────────────────────────────────────

test('tokens page galenti: zero axe violations', async ({ page }) => {
  await page.goto('/system/tokens')
  await expect(page.getByRole('heading', { name: 'Tokens' })).toBeVisible()
  const results = await new AxeBuilder({ page }).analyze()
  expect(results.violations).toEqual([])
})

test('tokens page debug: zero axe violations', async ({ page }) => {
  await page.goto('/system/tokens?skin=debug')
  await expect(page.getByRole('heading', { name: 'Tokens' })).toBeVisible()
  const results = await new AxeBuilder({ page }).analyze()
  expect(results.violations).toEqual([])
})

// ── Reduced motion ────────────────────────────────────────────────────────────

test('reduced motion: --motion-duration-md collapses to 0ms', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/system/tokens')
  await expect(page.getByRole('heading', { name: 'Tokens' })).toBeVisible()

  const durationMd = await page.evaluate(() =>
    window
      .getComputedStyle(document.documentElement)
      .getPropertyValue('--motion-duration-md')
      .trim(),
  )
  expect(durationMd).toBe('0ms')
})

test('reduced motion: reduced-motion note appears', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/system/tokens')
  await expect(page.getByRole('heading', { name: 'Tokens' })).toBeVisible()
  await expect(page.getByText(/Reduced motion active/i)).toBeVisible()
})

// ── Font preloads (galenti) ───────────────────────────────────────────────────

test('tokens page galenti: only the LCP font (Hanken) is preloaded', async ({ page }) => {
  await page.goto('/system/tokens')
  await expect(page.getByRole('heading', { name: 'Tokens' })).toBeVisible()

  // JetBrains Mono is deliberately not preloaded — it isn't the LCP font, and
  // its 40kB competed with the hero text for bandwidth on slow connections.
  const preloads = page.locator('link[rel="preload"][as="font"]')
  await expect(preloads).toHaveCount(1)
  await expect(preloads).toHaveAttribute('href', /hanken-grotesk/)
})

test('tokens page galenti: Hanken Grotesk font eventually loads', async ({ page }) => {
  await page.goto('/system/tokens')
  await expect(page.getByRole('heading', { name: 'Tokens' })).toBeVisible()

  await page.waitForFunction(() => document.fonts.check('1rem "Hanken Grotesk"'))
})

// ── Keyboard focus ────────────────────────────────────────────────────────────

/**
 * Tab through the page until the active element matches a predicate.
 * Returns true if found within maxSteps presses.
 */
async function tabUntil(
  page: Page,
  predicate: () => Promise<boolean>,
  maxSteps = 30,
): Promise<boolean> {
  for (let i = 0; i < maxSteps; i++) {
    await page.keyboard.press('Tab')
    if (await predicate()) return true
  }
  return false
}

test('keyboard: skin switcher radios reachable via Tab with visible focus outline', async ({
  page,
}) => {
  await page.goto('/system/tokens')
  await expect(page.getByRole('heading', { name: 'Tokens' })).toBeVisible()

  // The M1 tokens page had ?skin= links; the DocShell rehome replaced them
  // with the SkinSwitcher radio group (its focus outline lives on the label
  // wrapping the focused radio, via :has(input:focus-visible)).
  const reached = await tabUntil(page, () =>
    page.evaluate(() => {
      const el = document.activeElement
      return el instanceof HTMLInputElement && el.type === 'radio'
    }),
  )
  expect(reached).toBe(true)

  const outline = await page.evaluate(
    () => window.getComputedStyle(document.activeElement!.closest('label')!).outlineStyle,
  )
  expect(outline).not.toBe('none')
})

test('keyboard: Play button reachable via Tab with visible focus outline', async ({ page }) => {
  await page.goto('/system/tokens')
  await expect(page.getByRole('heading', { name: 'Tokens' })).toBeVisible()

  const reached = await tabUntil(page, async () => {
    const role = await page.evaluate(() => {
      const el = document.activeElement
      return el?.tagName === 'BUTTON' ? el.textContent?.trim() : null
    })
    return role === 'Play'
  })
  expect(reached).toBe(true)

  const outline = await page.evaluate(
    () => window.getComputedStyle(document.activeElement!).outlineStyle,
  )
  expect(outline).not.toBe('none')
})
