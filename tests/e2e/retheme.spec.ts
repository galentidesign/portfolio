import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'

// M6 milestone verify: EraRetheme entry/exit persistence contract, reduced-motion
// parity, network isolation, SR announcement, axe matrix, and keyboard safety.

// ── Helpers ───────────────────────────────────────────────────────────────────

const paletteInput = (page: Page) => page.getByRole('combobox', { name: 'Search commands' })

/** Palette-open retry pattern for hydration races (mirrors shell.spec.ts). */
async function openPalette(page: Page) {
  const input = paletteInput(page)
  await expect(async () => {
    await page.keyboard.press('ControlOrMeta+k')
    await expect(input).toBeVisible({ timeout: 500 })
  }).toPass({ timeout: 10_000 })
  await expect(input).toBeFocused()
}

/** Read the --color-surface custom property from :root (skin-specific). */
function getSurfaceColor(page: Page): Promise<string> {
  return page.evaluate(() =>
    getComputedStyle(document.documentElement).getPropertyValue('--color-surface').trim(),
  )
}

/** The role="status" region inside the EraRetheme boundary. */
const srAnnounce = (page: Page) => page.locator('[data-testid="era-retheme"] [role="status"]')

// ── §6.2 — 1. Entry re-themes ─────────────────────────────────────────────────

test('entry re-themes: html[data-skin] flips to rails-era and shell components visibly re-token', async ({
  page,
}) => {
  // Capture baseline surface color on the story landing (galenti skin).
  await page.goto('/')
  await expect(page.locator('html')).toHaveAttribute('data-skin', 'galenti')
  const galentiSurface = await getSurfaceColor(page)
  expect(galentiSurface.length).toBeGreaterThan(0)

  // Navigate to Ch1 — GSAP fires onSwap at ~140ms, completing the flip.
  await page.goto('/story/rails-era')
  await expect(page.locator('html')).toHaveAttribute('data-skin', 'rails-era', {
    timeout: 5_000,
  })

  // The skin attr flipped — the token set swapped on the html element.
  const railsSurface = await getSurfaceColor(page)

  // Visibly re-tokens: --color-surface differs between galenti and rails-era.
  expect(railsSurface).not.toBe(galentiSurface)
})

// ── §6.2 — 2. Exit restores ───────────────────────────────────────────────────

test('exit restores: navigating away via handoff link returns html[data-skin] to galenti', async ({
  page,
}) => {
  await page.goto('/story/rails-era')
  await expect(page.locator('html')).toHaveAttribute('data-skin', 'rails-era', {
    timeout: 5_000,
  })

  // Client-side navigation via the chapter handoff link.
  await page.getByRole('link', { name: 'Next: The React era →' }).click()
  await expect(page).toHaveURL(/\/story\/react-era$/)

  // EraRetheme unmounted → restore fires → data-skin back to galenti.
  await expect(page.locator('html')).toHaveAttribute('data-skin', 'galenti', { timeout: 3_000 })
})

// ── §6.2 — 3. localStorage untouched ─────────────────────────────────────────

test('localStorage untouched: full enter→exit cycle does not write portfolio:skin', async ({
  page,
}) => {
  // Start clean — no prior skin choice.
  await page.goto('/')
  await page.evaluate(() => localStorage.removeItem('portfolio:skin'))

  await page.goto('/story/rails-era')
  await expect(page.locator('html')).toHaveAttribute('data-skin', 'rails-era', {
    timeout: 5_000,
  })

  await page.getByRole('link', { name: 'Next: The React era →' }).click()
  await expect(page).toHaveURL(/\/story\/react-era$/)

  const stored = await page.evaluate(() => localStorage.getItem('portfolio:skin'))
  expect(stored).toBeNull()
})

// ── §6.2 — 4. Explicit choice wins ───────────────────────────────────────────

test('explicit skin choice wins: palette switch mid-chapter persists through exit', async ({
  page,
}) => {
  await page.goto('/story/rails-era')
  await expect(page.locator('html')).toHaveAttribute('data-skin', 'rails-era', {
    timeout: 5_000,
  })

  // Open the palette (retry pattern for hydration timing).
  await openPalette(page)

  // Switch to the Galenti skin via the palette.
  await page.keyboard.type('galenti')
  await expect(
    page.getByRole('dialog').getByRole('option', { name: 'Skin: Galenti' }),
  ).toBeVisible()
  await page.keyboard.press('Enter')
  await expect(page.locator('html')).toHaveAttribute('data-skin', 'galenti', { timeout: 3_000 })

  // Navigate away — EraRetheme must NOT restore (visitor's explicit choice wins).
  await page.getByRole('link', { name: 'Next: The React era →' }).click()
  await expect(page).toHaveURL(/\/story\/react-era$/)

  await expect(page.locator('html')).toHaveAttribute('data-skin', 'galenti')
  const stored = await page.evaluate(() => localStorage.getItem('portfolio:skin'))
  expect(stored).toBe('galenti')
})

// ── §6.2 — 5. Deep link ───────────────────────────────────────────────────────

test('deep link: already era-skinned entry skips swap and announce; exit is a no-op (skin stays rails-era)', async ({
  page,
}) => {
  // ?skin=rails-era sets data-skin server-side before hydration.
  await page.goto('/story/rails-era?skin=rails-era')
  await expect(page.locator('html')).toHaveAttribute('data-skin', 'rails-era')

  // No SR announcement (performSwap never fired).
  // Give a moment for any async swap that shouldn't arrive.
  await page.waitForTimeout(400)
  const announceText = await srAnnounce(page).textContent()
  expect(announceText?.trim()).toBe('')

  // Navigate away — savedSkin was rails-era, restore is a visual no-op.
  await page.getByRole('link', { name: 'Next: The React era →' }).click()
  await expect(page).toHaveURL(/\/story\/react-era$/)

  // Skin stays rails-era after the no-op restore.
  await expect(page.locator('html')).toHaveAttribute('data-skin', 'rails-era')
})

// ── §6.2 — 6. Reduced motion + network proof ─────────────────────────────────

test('reduced motion: swap applies instantly and motion/gsap chunk never requested', async ({
  page,
}) => {
  // Must be set before navigation so the gate reads it at mount.
  await page.emulateMedia({ reducedMotion: 'reduce' })

  const reducedJsUrls = new Set<string>()
  page.on('request', (req) => {
    if (req.url().endsWith('.js')) reducedJsUrls.add(req.url())
  })

  await page.goto('/story/rails-era')
  // Instant swap under reduced motion — no GSAP needed.
  await expect(page.locator('html')).toHaveAttribute('data-skin', 'rails-era', {
    timeout: 3_000,
  })
  // Wait for any deferred lazy chunk that might load late.
  await page.waitForTimeout(600)

  // No motion chunk loaded — same assertion shape as M5 network proof.
  const motionInReduced = [...reducedJsUrls].filter((url) => /\/motion[^/]*\.js$/.test(url))
  expect(motionInReduced).toHaveLength(0)

  // Belt-and-suspenders: no gsap-named bundle either.
  const gsapInReduced = [...reducedJsUrls].filter((url) => /gsap/.test(url))
  expect(gsapInReduced).toHaveLength(0)

  // Control: motion mode DOES load the chunk. New page in the same context
  // so the reduced-mode page never seeded the HTTP cache for the motion chunk.
  const motionPage = await page.context().newPage()
  const motionJsUrls = new Set<string>()
  motionPage.on('request', (req) => {
    if (req.url().endsWith('.js')) motionJsUrls.add(req.url())
  })
  await motionPage.goto('/story/rails-era')
  await expect(motionPage.locator('html')).toHaveAttribute('data-skin', 'rails-era', {
    timeout: 5_000,
  })
  await motionPage.close()

  // At least one chunk present in motion mode but absent in reduced mode.
  const motionOnlyChunks = [...motionJsUrls].filter((url) => !reducedJsUrls.has(url))
  expect(motionOnlyChunks.length).toBeGreaterThanOrEqual(1)
})

// ── §6.2 — 7. SR announcement ────────────────────────────────────────────────

test('SR announcement: role="status" contains "Theme: Rails era" after entry swap', async ({
  page,
}) => {
  await page.goto('/story/rails-era')
  // Wait for the skin swap to fire (the setAnnounced call is synchronous with it).
  await expect(page.locator('html')).toHaveAttribute('data-skin', 'rails-era', {
    timeout: 5_000,
  })
  await expect(srAnnounce(page)).toHaveText('Theme: Rails era')
})

// ── §6.2 — 8. Axe matrix ─────────────────────────────────────────────────────

test('axe: /story/rails-era — rails-era skin post-swap (motion), zero violations', async ({
  page,
}) => {
  await page.goto('/story/rails-era')
  await expect(page.locator('html')).toHaveAttribute('data-skin', 'rails-era', {
    timeout: 5_000,
  })
  // Deterministic settle: the last stagger target tweens to opacity 1 when
  // the entrance completes — no fixed sleep, no transient-blend scans.
  await expect(page.locator('[data-retheme-stagger]').last()).toHaveCSS('opacity', '1', {
    timeout: 5_000,
  })
  const results = await new AxeBuilder({ page }).analyze()
  expect(results.violations).toEqual([])
})

test('axe: /story/rails-era — rails-era skin (reduced motion), zero violations', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/story/rails-era')
  await expect(page.locator('html')).toHaveAttribute('data-skin', 'rails-era', {
    timeout: 3_000,
  })
  const results = await new AxeBuilder({ page }).analyze()
  expect(results.violations).toEqual([])
})

test('axe: /story/react-era (engine-note aside), zero violations', async ({ page }) => {
  await page.goto('/story/react-era')
  await expect(page.getByRole('heading', { name: 'The React era' })).toBeVisible()
  const results = await new AxeBuilder({ page }).analyze()
  expect(results.violations).toEqual([])
})

test('axe: /story/agentic (engine-note aside), zero violations', async ({ page }) => {
  await page.goto('/story/agentic')
  await expect(page.getByRole('heading', { name: 'The agentic era' })).toBeVisible()
  const results = await new AxeBuilder({ page }).analyze()
  expect(results.violations).toEqual([])
})

// ── §6.2 — 9. Keyboard safety ────────────────────────────────────────────────
//
// The sweep bar is aria-hidden + pointer-events:none — it must never trap
// focus. After the sweep completes: first focusable reachable with visible
// focus ring; handoff link reachable and operable by Enter.

test('keyboard: sweep does not trap focus; first focusable visible; handoff link operable', async ({
  page,
}) => {
  await page.goto('/story/rails-era')
  // Wait for the swap and let the full choreography finish.
  await expect(page.locator('html')).toHaveAttribute('data-skin', 'rails-era', {
    timeout: 5_000,
  })
  await page.waitForTimeout(750) // ~700ms sweep + settle buffer

  // Tab from top — focus must reach a visible element with a visible ring.
  await page.keyboard.press('Tab')
  const probe = await page.evaluate(() => {
    const el = document.activeElement as HTMLElement
    const cs = getComputedStyle(el)
    return {
      focusVisible: el?.matches(':focus-visible') ?? false,
      outlineStyle: cs.outlineStyle,
    }
  })
  expect(probe.focusVisible).toBe(true)
  expect(probe.outlineStyle).not.toBe('none')

  // Handoff link: focusable with visible ring, operable by Enter.
  const handoff = page.getByRole('link', { name: 'Next: The React era →' })
  await handoff.focus()
  const handoffProbe = await page.evaluate(() => ({
    focusVisible: (document.activeElement as HTMLElement)?.matches(':focus-visible') ?? false,
  }))
  expect(handoffProbe.focusVisible).toBe(true)

  await page.keyboard.press('Enter')
  await expect(page).toHaveURL(/\/story\/react-era$/)
})
