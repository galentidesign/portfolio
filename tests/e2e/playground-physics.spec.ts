import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'

// ── R6 — token physics playground on /system ─────────────────────────────────
//
// Contracts under test:
//   - reduced motion: the labeled static grid IS the render; the physics
//     chunk never downloads (network set-difference guard, same shape as
//     story.spec.ts §9.2 — chunk names are hash-dependent, so absence is
//     proven by diffing modes, never by filename)
//   - motion mode: physics mounts (data-physics='on'), chips become
//     aria-hidden decoration mirrored by a visually-hidden list, a Reset
//     control appears — zero axe violations in both skins and both modes
//   - content parity: grid labels (reduced) === mirror-list labels (motion)
//   - isolation: the physics-only chunks never load on another route

async function gotoSystem(page: Page, query = '') {
  await page.goto(`/system${query}`)
  await expect(page.getByRole('heading', { level: 1, name: /design system/i })).toBeVisible()
}

function collectJsRequests(page: Page): Set<string> {
  const urls = new Set<string>()
  page.on('request', (req) => {
    if (req.url().endsWith('.js')) urls.add(req.url())
  })
  return urls
}

async function waitForPhysics(page: Page) {
  await expect(page.getByTestId('playground-pen')).toHaveAttribute('data-physics', 'on', {
    timeout: 10_000,
  })
}

// ── Reduced motion: the static grid is the content ────────────────────────────

test('reduced motion: static grid renders with visible labels, axe zero', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await gotoSystem(page)
  const pen = page.getByTestId('playground-pen')
  await expect(pen).toBeVisible()

  // The grid is the content: visible labels, exposed to AT, no physics attrs.
  await expect(page.getByRole('list', { name: 'Design tokens' })).toBeVisible()
  await expect(pen.getByText('accent', { exact: true })).toBeVisible()
  await expect(pen.getByText('radius-pill', { exact: true })).toBeVisible()
  await expect(pen.getByText('type-display', { exact: true })).toBeVisible()
  await expect(pen).not.toHaveAttribute('data-physics')
  await expect(page.getByRole('button', { name: 'Reset' })).toHaveCount(0)

  const results = await new AxeBuilder({ page }).analyze()
  expect(results.violations).toEqual([])
})

// ── Motion mode: physics mounts, a11y structure swaps, axe zero ──────────────

test('motion mode: physics mounts on visibility, chips become decoration, axe zero', async ({
  page,
}) => {
  await gotoSystem(page)
  await waitForPhysics(page)

  // Grid is now aria-hidden decoration; the mirror list carries the content.
  const pen = page.getByTestId('playground-pen')
  await expect(pen.locator('ul[aria-hidden="true"]')).toHaveCount(1)
  const lists = page.getByRole('list', { name: 'Design tokens' })
  await expect(lists).toHaveCount(1) // only the visually-hidden mirror is exposed

  // Chips are real DOM elements driven by body transforms.
  const firstChip = pen.locator('[data-physics-chip]').first()
  await expect(firstChip).toHaveCSS('position', 'absolute')
  await expect(firstChip).toHaveAttribute('style', /transform/)

  // Reset is the one operable control and re-pours deterministically.
  const reset = page.getByRole('button', { name: 'Reset' })
  await expect(reset).toBeVisible()
  await reset.click()
  await expect(firstChip).toHaveAttribute('style', /transform/)

  const results = await new AxeBuilder({ page }).analyze()
  expect(results.violations).toEqual([])
})

test('motion mode, debug skin: physics mounted, zero axe violations', async ({ page }) => {
  await gotoSystem(page, '?skin=debug')
  await expect(page.locator('html')).toHaveAttribute('data-skin', 'debug')
  await waitForPhysics(page)
  const results = await new AxeBuilder({ page }).analyze()
  expect(results.violations).toEqual([])
})

test('reduced motion, debug skin: static grid, zero axe violations', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await gotoSystem(page, '?skin=debug')
  await expect(page.locator('html')).toHaveAttribute('data-skin', 'debug')
  await expect(page.getByTestId('playground-pen')).not.toHaveAttribute('data-physics')
  const results = await new AxeBuilder({ page }).analyze()
  expect(results.violations).toEqual([])
})

// ── Content parity: reduced grid labels === motion mirror-list labels ────────

test('content parity: grid labels match the visually-hidden mirror list', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await gotoSystem(page)
  const gridLabels = await page
    .getByTestId('playground-pen')
    .locator('[data-physics-chip] code')
    .allTextContents()
  expect(gridLabels.length).toBeGreaterThan(0)

  const motionPage = await page.context().newPage()
  await motionPage.goto('/system')
  await waitForPhysics(motionPage)
  const mirrorLabels = await motionPage
    .getByRole('list', { name: 'Design tokens' })
    .locator('li')
    .allTextContents()
  await motionPage.close()

  expect(mirrorLabels).toEqual(gridLabels)
})

// ── Network guard: physics bytes only in motion mode, only on /system ────────
//
// Chunk filenames are hash-dependent (the physics chunk is index-*.js in this
// build), so the guard is a set-difference between modes: whatever extra JS
// motion mode pulls on /system must be absent from the reduced-mode set and
// from every other route's set.

test('network: physics chunk absent under reduced motion and on other routes', async ({
  page,
}) => {
  // Reduced-mode /system: collect every JS request.
  await page.emulateMedia({ reducedMotion: 'reduce' })
  const reducedJsUrls = collectJsRequests(page)
  await gotoSystem(page)
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight))
  await page.waitForTimeout(600)
  await expect(page.getByTestId('playground-pen')).not.toHaveAttribute('data-physics')

  // Motion-mode /system in the same context (no shared cache hit for the
  // physics chunk — the reduced page never fetched it).
  const motionPage = await page.context().newPage()
  const motionJsUrls = collectJsRequests(motionPage)
  await motionPage.goto('/system')
  await waitForPhysics(motionPage)

  // The motion-only set must contain the physics chunk (at least one URL).
  const motionOnlyChunks = [...motionJsUrls].filter((url) => !reducedJsUrls.has(url))
  expect(motionOnlyChunks.length).toBeGreaterThanOrEqual(1)
  await motionPage.close()

  // Another route, motion mode, no interactions: none of the motion-only
  // chunks may load (matter-js stays off every other route).
  const tokensPage = await page.context().newPage()
  const tokensJsUrls = collectJsRequests(tokensPage)
  await tokensPage.goto('/system/tokens')
  await expect(tokensPage.getByRole('heading', { level: 1, name: 'Tokens' })).toBeVisible()
  await tokensPage.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight))
  await tokensPage.waitForTimeout(600)
  await tokensPage.close()

  for (const chunkUrl of motionOnlyChunks) {
    expect([...reducedJsUrls]).not.toContain(chunkUrl)
    expect([...tokensJsUrls]).not.toContain(chunkUrl)
  }
})
