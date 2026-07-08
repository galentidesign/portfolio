import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'

// R8 milestone verify: the era-crossing generalized to every chapter. The two
// new chapters (react-era, agentic) get the same core contract matrix the
// rails-era spec pins: swap-once entry, restore-on-exit, localStorage
// untouched, explicit-choice-wins, deep-link no-op, reduced-motion instant
// swap + SR announce + network isolation, and axe zero during/after the
// crossing. Plus: the new skins surface in the switcher/palette and on
// /system/skins.

// ── Chapter matrix ────────────────────────────────────────────────────────────

const CHAPTERS = [
  {
    route: '/story/react-era',
    skin: 'react-era',
    announce: 'Theme: React era',
    heading: 'The React era',
    treatment: 'webpack',
  },
  {
    route: '/story/agentic',
    skin: 'agentic',
    announce: 'Theme: Agentic era',
    heading: 'The agentic era',
    treatment: 'terminal',
  },
] as const

// ── Helpers (mirroring retheme.spec.ts) ───────────────────────────────────────

const paletteInput = (page: Page) => page.getByRole('combobox', { name: 'Search commands' })

async function openPalette(page: Page) {
  const input = paletteInput(page)
  await expect(async () => {
    await page.keyboard.press('ControlOrMeta+k')
    await expect(input).toBeVisible({ timeout: 500 })
  }).toPass({ timeout: 10_000 })
  await expect(input).toBeFocused()
}

function getSurfaceColor(page: Page): Promise<string> {
  return page.evaluate(() =>
    getComputedStyle(document.documentElement).getPropertyValue('--color-surface').trim(),
  )
}

const srAnnounce = (page: Page) => page.locator('[data-testid="era-retheme"] [role="status"]')

const siteNav = (page: Page) => page.locator('[data-testid="nav-header"]')

/** Exit the chapter to a neutral (non-retheming) route via client-side nav. */
async function exitToNeutral(page: Page) {
  await siteNav(page).getByRole('link', { name: 'Work' }).click()
  await expect(page).toHaveURL(/\/work$/)
}

// ── Per-chapter contract matrix ───────────────────────────────────────────────

for (const chapter of CHAPTERS) {
  test.describe(`${chapter.skin} era-crossing`, () => {
    // ── 1. Entry re-themes (swap-once) ────────────────────────────────────────

    test('entry re-themes: html[data-skin] flips and the token set visibly changes', async ({
      page,
    }) => {
      await page.goto('/')
      await expect(page.locator('html')).toHaveAttribute('data-skin', 'galenti')
      const galentiSurface = await getSurfaceColor(page)
      expect(galentiSurface.length).toBeGreaterThan(0)

      await page.goto(chapter.route)
      await expect(page.locator('html')).toHaveAttribute('data-skin', chapter.skin, {
        timeout: 5_000,
      })

      const eraSurface = await getSurfaceColor(page)
      expect(eraSurface).not.toBe(galentiSurface)
    })

    // ── 2. Exit restores ──────────────────────────────────────────────────────

    test('exit restores: client-side navigation away returns html[data-skin] to galenti', async ({
      page,
    }) => {
      await page.goto(chapter.route)
      await expect(page.locator('html')).toHaveAttribute('data-skin', chapter.skin, {
        timeout: 5_000,
      })

      await exitToNeutral(page)

      await expect(page.locator('html')).toHaveAttribute('data-skin', 'galenti', {
        timeout: 3_000,
      })
    })

    // ── 3. localStorage untouched ─────────────────────────────────────────────

    test('localStorage untouched: full enter→exit cycle never writes portfolio:skin', async ({
      page,
    }) => {
      await page.goto('/')
      await page.evaluate(() => localStorage.removeItem('portfolio:skin'))

      await page.goto(chapter.route)
      await expect(page.locator('html')).toHaveAttribute('data-skin', chapter.skin, {
        timeout: 5_000,
      })

      await exitToNeutral(page)

      const stored = await page.evaluate(() => localStorage.getItem('portfolio:skin'))
      expect(stored).toBeNull()
    })

    // ── 4. Explicit choice wins ───────────────────────────────────────────────

    test('explicit skin choice wins: palette switch mid-chapter persists through exit', async ({
      page,
    }) => {
      await page.goto(chapter.route)
      await expect(page.locator('html')).toHaveAttribute('data-skin', chapter.skin, {
        timeout: 5_000,
      })

      await openPalette(page)
      await page.keyboard.type('galenti')
      await expect(
        page.getByRole('dialog').getByRole('option', { name: 'Skin: Galenti' }),
      ).toBeVisible()
      await page.keyboard.press('Enter')
      await expect(page.locator('html')).toHaveAttribute('data-skin', 'galenti', {
        timeout: 3_000,
      })

      await exitToNeutral(page)

      await expect(page.locator('html')).toHaveAttribute('data-skin', 'galenti')
      const stored = await page.evaluate(() => localStorage.getItem('portfolio:skin'))
      expect(stored).toBe('galenti')
    })

    // ── 5. Deep link no-op ────────────────────────────────────────────────────

    test('deep link: already era-skinned entry skips swap and announce; exit keeps the skin', async ({
      page,
    }) => {
      await page.goto(`${chapter.route}?skin=${chapter.skin}`)
      await expect(page.locator('html')).toHaveAttribute('data-skin', chapter.skin)

      await page.waitForTimeout(400)
      const announceText = await srAnnounce(page).textContent()
      expect(announceText?.trim()).toBe('')

      await exitToNeutral(page)
      await expect(page.locator('html')).toHaveAttribute('data-skin', chapter.skin)
    })

    // ── 6. Reduced motion + network proof + SR announce ───────────────────────

    test('reduced motion: instant swap, SR announce, motion/gsap chunk never requested', async ({
      page,
    }) => {
      await page.emulateMedia({ reducedMotion: 'reduce' })

      const reducedJsUrls = new Set<string>()
      page.on('request', (req) => {
        if (req.url().endsWith('.js')) reducedJsUrls.add(req.url())
      })

      await page.goto(chapter.route)
      await expect(page.locator('html')).toHaveAttribute('data-skin', chapter.skin, {
        timeout: 3_000,
      })
      await expect(srAnnounce(page)).toHaveText(chapter.announce)
      await page.waitForTimeout(600)

      const motionInReduced = [...reducedJsUrls].filter((url) => /\/motion[^/]*\.js$/.test(url))
      expect(motionInReduced).toHaveLength(0)
      const gsapInReduced = [...reducedJsUrls].filter((url) => /gsap|ogl|matter/.test(url))
      expect(gsapInReduced).toHaveLength(0)

      // Control: motion mode DOES load the chunk (fresh page, same context).
      const motionPage = await page.context().newPage()
      const motionJsUrls = new Set<string>()
      motionPage.on('request', (req) => {
        if (req.url().endsWith('.js')) motionJsUrls.add(req.url())
      })
      await motionPage.goto(chapter.route)
      await expect(motionPage.locator('html')).toHaveAttribute('data-skin', chapter.skin, {
        timeout: 5_000,
      })
      await motionPage.close()

      const motionOnlyChunks = [...motionJsUrls].filter((url) => !reducedJsUrls.has(url))
      expect(motionOnlyChunks.length).toBeGreaterThanOrEqual(1)
    })

    // ── 7. Axe matrix — post-swap settled (motion) and reduced motion ─────────

    test('axe: post-swap settled crossing (motion mode), zero violations', async ({ page }) => {
      await page.goto(chapter.route)
      await expect(page.locator('html')).toHaveAttribute('data-skin', chapter.skin, {
        timeout: 5_000,
      })
      // Deterministic settle: the DOM-final bare stagger target tweens to
      // opacity 1 when the entrance completes (same wait the rails spec pins).
      await expect(page.locator('[data-retheme-stagger]').last()).toHaveCSS('opacity', '1', {
        timeout: 5_000,
      })
      const results = await new AxeBuilder({ page }).analyze()
      expect(results.violations).toEqual([])
    })

    test('axe: reduced motion, zero violations', async ({ page }) => {
      await page.emulateMedia({ reducedMotion: 'reduce' })
      await page.goto(chapter.route)
      await expect(page.locator('html')).toHaveAttribute('data-skin', chapter.skin, {
        timeout: 3_000,
      })
      await expect(page.getByRole('heading', { name: chapter.heading })).toBeVisible()
      const results = await new AxeBuilder({ page }).analyze()
      expect(results.violations).toEqual([])
    })
  })
}

// ── Zone composition under a forced skin ──────────────────────────────────────
//
// R9: /story/agentic composes data-zone="day" for its outro. Forcing galenti
// via the palette mid-chapter re-resolves every zone against galenti's own
// zone tokens — axe zero proves the day-zone composition holds under any skin.

test('axe: /story/agentic forced to galenti via palette — day-zone outro, zero violations', async ({
  page,
}) => {
  await page.goto('/story/agentic')
  await expect(page.locator('html')).toHaveAttribute('data-skin', 'agentic', { timeout: 5_000 })
  await expect(page.locator('[data-retheme-stagger]').last()).toHaveCSS('opacity', '1', {
    timeout: 5_000,
  })

  await openPalette(page)
  await page.keyboard.type('galenti')
  await expect(page.getByRole('dialog').getByRole('option', { name: 'Skin: Galenti' })).toBeVisible()
  await page.keyboard.press('Enter')
  await expect(page.locator('html')).toHaveAttribute('data-skin', 'galenti', { timeout: 3_000 })

  // Bring the dawn crossing + day-zone outro into play before scanning.
  await page.getByTestId('story-outro').scrollIntoViewIfNeeded()
  await expect(page.getByTestId('day-zone')).toHaveAttribute('data-zone', 'day')

  const results = await new AxeBuilder({ page }).analyze()
  expect(results.violations).toEqual([])
})

// ── The new skins surface in the shell UI ─────────────────────────────────────

test('palette lists all four visible skins (debug stays hidden)', async ({ page }) => {
  await page.goto('/work')
  await openPalette(page)
  await page.keyboard.type('skin')
  const dialog = page.getByRole('dialog')
  for (const label of ['Galenti', 'Rails era', 'React era', 'Agentic era']) {
    await expect(dialog.getByRole('option', { name: `Skin: ${label}` })).toBeVisible()
  }
  await expect(dialog.getByRole('option', { name: 'Skin: Debug' })).toHaveCount(0)
})

test('skin switcher radio group offers the four visible skins', async ({ page }) => {
  await page.goto('/system/tokens')
  await expect(page.getByRole('heading', { level: 1, name: 'Tokens' })).toBeVisible()
  for (const label of ['Galenti', 'Rails era', 'React era', 'Agentic era']) {
    await expect(page.getByRole('radio', { name: label })).toBeVisible()
  }
  await expect(page.getByRole('radio', { name: 'Debug' })).toHaveCount(0)
})

test('/system/skins documents the two new skins with era labels', async ({ page }) => {
  await page.goto('/system/skins')
  await expect(page.getByRole('heading', { level: 1, name: 'Skins' })).toBeVisible()
  const skinList = page.getByRole('list', { name: 'Skins' })
  await expect(skinList.getByText('React era', { exact: true })).toBeVisible()
  await expect(skinList.getByText('2018', { exact: true })).toBeVisible()
  await expect(skinList.getByText('Agentic era', { exact: true })).toBeVisible()
  await expect(skinList.getByText('2024', { exact: true })).toBeVisible()
  // Palette strips render for the new skins.
  await expect(page.getByRole('list', { name: 'React era color palette' })).toBeVisible()
  await expect(page.getByRole('list', { name: 'Agentic era color palette' })).toBeVisible()
})
