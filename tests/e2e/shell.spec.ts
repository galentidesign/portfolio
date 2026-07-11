import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'

// M4 milestone verify: dual-mode shell. Keyboard-only journey, the
// ≤2-interaction rule, mode memory, reduced-motion end-to-end, scroll
// progress, the on-brand 404, palette actions, and the new-route axe matrix.

const CONTACT_EMAIL = 'galentidesign@gmail.com'

const siteNav = (page: Page) => page.getByRole('navigation', { name: 'Site' })
const hatch = (page: Page) => page.getByTestId('escape-hatch')
const paletteInput = (page: Page) => page.getByRole('combobox', { name: 'Search commands' })

async function openPalette(page: Page) {
  // The app is client-rendered; the global ⌘K listener attaches after
  // hydration. Retry the shortcut until the palette opens — a press that
  // landed too early is a no-op, and once the dialog is open the inner
  // assertion passes so no second (toggling) press is sent.
  const input = paletteInput(page)
  await expect(async () => {
    await page.keyboard.press('ControlOrMeta+k')
    await expect(input).toBeVisible({ timeout: 500 })
  }).toPass({ timeout: 10_000 })
  await expect(input).toBeFocused()
}

// ── The milestone journey — keyboard only, no pointer ──────────────────────

test('keyboard-only: land on /, jump to the work via the hatch, ⌘K, switch skin debug → galenti', async ({
  page,
}) => {
  // Enter on the hidden debug skin via URL param so the palette performs a
  // real, observable switch back to galenti (debug stays out of the palette).
  await page.goto('/?skin=debug')
  await expect(page.locator('html')).toHaveAttribute('data-skin', 'debug')

  // Hatch is visible inside the first viewport without scrolling.
  const viewport = page.viewportSize()!
  const box = (await hatch(page).boundingBox())!
  expect(box.y + box.height).toBeLessThanOrEqual(viewport.height)
  expect(box.x + box.width).toBeLessThanOrEqual(viewport.width)

  // Tab until the hatch has focus — its exact tab index must not be load-bearing.
  let reached = false
  for (let i = 0; i < 12; i++) {
    await page.keyboard.press('Tab')
    if (await hatch(page).evaluate((el) => el === document.activeElement)) {
      reached = true
      break
    }
  }
  expect(reached).toBe(true)

  await page.keyboard.press('Enter')
  // The home hatch is an in-page skim jump — no navigation; focus lands on
  // beat 07 with the proof heading on stage.
  await expect(page.locator('#the-work')).toBeFocused()
  await expect(page).not.toHaveURL(/\/work/)
  await expect(page.getByRole('heading', { name: 'The work' })).toBeVisible()

  // Open the palette with the keyboard and switch the skin.
  await openPalette(page)
  await page.keyboard.type('galenti')
  await expect(
    page.getByRole('dialog').getByRole('option', { name: 'Skin: Galenti' }),
  ).toBeVisible()
  await page.keyboard.press('Enter')

  await expect(page.locator('html')).toHaveAttribute('data-skin', 'galenti')
  const storedSkin = await page.evaluate(() => localStorage.getItem('portfolio:skin'))
  expect(storedSkin).toBe('galenti')
})

// ── ≤2 interactions to the skim hub, from anywhere ─────────────────────────

for (const [start, describeStart] of [
  ['/', 'story landing'],
  ['/story/rails-era', 'a story chapter'],
  ['/system', 'the DS docs'],
] as const) {
  test(`skim hub in one interaction from ${describeStart}`, async ({ page }) => {
    await page.goto(start)
    await siteNav(page).getByRole('link', { name: 'Work' }).click()
    await expect(page).toHaveURL(/\/work$/)
    await expect(page.getByRole('heading', { name: /Design technologist/ })).toBeVisible()
  })
}

test('skim hub in one interaction from the 404 page', async ({ page }) => {
  await page.goto('/definitely-not-a-page')
  await page.getByRole('link', { name: 'Skip to the work' }).click()
  await expect(page).toHaveURL(/\/work$/)
})

// ── Mode memory: continue affordance, never a redirect ─────────────────────

test('mode memory: /work visit flips the hatch label to Continue on the next story landing', async ({
  page,
}) => {
  await page.goto('/')
  await expect(hatch(page)).toHaveText('Skip to the work →')

  await siteNav(page).getByRole('link', { name: 'Work' }).click()
  await expect(page).toHaveURL(/\/work$/)
  await expect.poll(() => page.evaluate(() => localStorage.getItem('portfolio:mode'))).toBe('skim')

  // A fresh full load of the story landing — no redirect happens, the page
  // stays on /, only the affordance label changes.
  await page.goto('/')
  await expect(page).toHaveURL(/\/$/)
  await expect(hatch(page)).toHaveText('Continue to the work →')
})

test('mode memory: neutral routes never clobber the stored mode', async ({ page }) => {
  await page.goto('/work')
  await expect.poll(() => page.evaluate(() => localStorage.getItem('portfolio:mode'))).toBe('skim')

  await page.goto('/system')
  await page.goto('/resume')
  const stored = await page.evaluate(() => localStorage.getItem('portfolio:mode'))
  expect(stored).toBe('skim')
})

// ── Reduced motion, proven end-to-end ───────────────────────────────────────

test('reduced motion: hatch transition collapses to 0s and the palette stays functional', async ({
  page,
}) => {
  // Control run first: without the emulation the motion tokens give the hatch
  // a real transition — proving the collapse below is the reduced-motion path
  // doing its job, not a token that was always zero.
  await page.goto('/')
  const normalDuration = await hatch(page).evaluate((el) => getComputedStyle(el).transitionDuration)
  expect(normalDuration).not.toBe('0s')

  await page.emulateMedia({ reducedMotion: 'reduce' })
  const reducedDuration = await hatch(page).evaluate(
    (el) => getComputedStyle(el).transitionDuration,
  )
  expect(reducedDuration.split(', ').every((d) => d === '0s')).toBe(true)

  // Palette is instant and fully functional under reduced motion.
  await openPalette(page)
  await page.keyboard.type('work')
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL(/\/work$/)
})

test('reduced motion: scroll progress still tracks position on a chapter page', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/story/rails-era')

  const fill = page.getByTestId('scroll-progress').locator('div')
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight))
  await expect
    .poll(async () => fill.evaluate((el) => new DOMMatrix(getComputedStyle(el).transform).a))
    .toBeGreaterThan(0.9)
})

// ── Scroll progress rail ────────────────────────────────────────────────────

test('scroll progress: grows with reading position, decorative, story pages only', async ({
  page,
}) => {
  await page.goto('/story/rails-era')

  const rail = page.getByTestId('scroll-progress')
  await expect(rail).toHaveAttribute('aria-hidden', 'true')

  const fill = rail.locator('div')
  const atTop = await fill.evaluate((el) => new DOMMatrix(getComputedStyle(el).transform).a)
  expect(atTop).toBeLessThan(0.1)

  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight))
  await expect
    .poll(async () => fill.evaluate((el) => new DOMMatrix(getComputedStyle(el).transform).a))
    .toBeGreaterThan(0.9)

  // The nine-beat home is a story page — it carries the rail too.
  await page.goto('/')
  await expect(page.getByTestId('scroll-progress')).toHaveCount(1)
  // Skim surfaces stay rail-free.
  await page.goto('/work')
  await expect(page.getByTestId('scroll-progress')).toHaveCount(0)
})

// ── On-brand 404 ────────────────────────────────────────────────────────────

test('404: real status, on-brand page, axe-clean, both exits work', async ({ page }) => {
  const response = await page.goto('/definitely-not-a-page')
  expect(response!.status()).toBe(404)
  await expect(
    page.getByRole('heading', { name: 'Nothing is assembled at this address' }),
  ).toBeVisible()

  const results = await new AxeBuilder({ page }).analyze()
  expect(results.violations).toEqual([])

  await page.getByRole('link', { name: 'Start the story' }).click()
  await expect(page).toHaveURL(/\/$/)
  await expect(page.getByRole('heading', { name: 'J Galenti' })).toBeVisible()
})

test('404: unknown system component slug gets the same branded page', async ({ page }) => {
  const response = await page.goto('/system/components/not-a-component')
  expect(response!.status()).toBe(404)
  await expect(
    page.getByRole('heading', { name: 'Nothing is assembled at this address' }),
  ).toBeVisible()
})

// ── Palette actions ─────────────────────────────────────────────────────────

test('palette: neutral route offers both mode switches; Escape restores trigger focus', async ({
  page,
}) => {
  await page.goto('/resume')
  await openPalette(page)

  const dialog = page.getByRole('dialog')
  await expect(dialog.getByRole('option', { name: 'Switch to story mode' })).toBeVisible()
  await expect(dialog.getByRole('option', { name: 'Switch to skim mode' })).toBeVisible()

  await page.keyboard.press('Escape')
  await expect(paletteInput(page)).toBeHidden()
  await expect(page.getByRole('button', { name: 'Search & commands' })).toBeFocused()
})

test('palette: story route offers only the skim switch', async ({ page }) => {
  await page.goto('/')
  await openPalette(page)

  const dialog = page.getByRole('dialog')
  await expect(dialog.getByRole('option', { name: 'Switch to skim mode' })).toBeVisible()
  await expect(dialog.getByRole('option', { name: 'Switch to story mode' })).toHaveCount(0)
})

test('palette: copy email writes the clipboard and confirms with the shell toast', async ({
  page,
  context,
}) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write'])
  await page.goto('/work')
  // Chromium's async clipboard API requires document focus — make sure this
  // page holds it even when other workers have opened windows.
  await page.bringToFront()
  await openPalette(page)

  await page.keyboard.type('email')
  await page.keyboard.press('Enter')

  // Assert the toast itself (role=status): the aside wrapper's box is empty
  // because the fixed-position toast is out of flow.
  const toast = page.getByTestId('shell-toast').getByRole('status')
  await expect(toast).toBeVisible()
  await expect(toast).toContainText(`Email copied — ${CONTACT_EMAIL}`)
  const clipboard = await page.evaluate(() => navigator.clipboard.readText())
  expect(clipboard).toBe(CONTACT_EMAIL)
})

// ── Axe matrix over the new shell routes, both skins ────────────────────────
// /story/rails-era is NOT in this matrix: the chapter re-themes itself to the
// rails-era skin on entry (M6), so a galenti/debug steady state doesn't exist
// on that route — scanning it here races the entrance choreography and grades
// transient blend frames. Its axe coverage (settled motion + reduced motion)
// lives in retheme.spec.ts.

const NEW_ROUTES = ['/', '/work', '/resume', '/colophon', '/gallery', '/gallery/pivvot-aim']

for (const route of NEW_ROUTES) {
  test(`axe: ${route} has zero violations (galenti skin)`, async ({ page }) => {
    await page.goto(route)
    await expect(page.getByRole('navigation', { name: 'Site' })).toBeVisible()
    const results = await new AxeBuilder({ page }).analyze()
    expect(results.violations).toEqual([])
  })

  test(`axe: ${route} has zero violations (debug skin)`, async ({ page }) => {
    await page.goto(`${route}?skin=debug`)
    await expect(page.locator('html')).toHaveAttribute('data-skin', 'debug')
    const results = await new AxeBuilder({ page }).analyze()
    expect(results.violations).toEqual([])
  })
}

test('axe: shell toast open state has zero violations', async ({ page }) => {
  // This test scans the toast's OPEN state — clipboard success is someone
  // else's assertion (the copy-email test reads the real clipboard back).
  // Stub writeText so the notify path fires deterministically regardless of
  // headless focus quirks.
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: () => Promise.resolve() },
    })
  })
  await page.goto('/work')
  await openPalette(page)
  await page.keyboard.type('email')
  await page.keyboard.press('Enter')
  await expect(page.getByTestId('shell-toast').getByRole('status')).toBeVisible()

  // Scan the SETTLED state (gotcha bb): the reveal fx transitions in-view
  // tiles; axe must never sample an alpha-blended transient frame.
  await expect
    .poll(() =>
      page.evaluate(() =>
        Array.from(document.querySelectorAll('[data-reveal]')).every((el) => {
          const opacity = Number(getComputedStyle(el).opacity)
          return opacity === 0 || opacity === 1
        }),
      ),
    )
    .toBe(true)

  const results = await new AxeBuilder({ page }).analyze()
  expect(results.violations).toEqual([])
})

// ── Résumé and colophon pages (M9) ──────────────────────────────────────────

test('resume page renders the name heading and a highlights proof link', async ({ page }) => {
  await page.goto('/resume')
  await expect(page.getByRole('heading', { name: 'J Galenti', level: 1 })).toBeVisible()
  await expect(page.getByRole('link', { name: 'See the system →' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Back to the work →' })).toBeVisible()
})

test('colophon page renders the heading and the privacy claim', async ({ page }) => {
  await page.goto('/colophon')
  await expect(page.getByRole('heading', { name: 'Colophon', level: 1 })).toBeVisible()
  await expect(page.getByText(/first-party, cookieless/)).toBeVisible()
  await expect(page.getByRole('link', { name: 'Back to the work →' })).toBeVisible()
})
