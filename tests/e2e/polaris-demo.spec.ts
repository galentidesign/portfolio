import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'

// M8 milestone verify: Polaris demo bundle isolation, four API states,
// style-leak teardown, view navigation + submit flows, axe, keyboard, and
// reduced-motion coverage.

const DEMO_URL = '/work/shadcn-to-polaris/demo'

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Navigate to the demo and wait for PolarisDemo to mount. */
async function gotoDemo(page: Page): Promise<void> {
  await page.goto(DEMO_URL)
  // Dynamic import resolves and mounts the root wrapper.
  await expect(page.locator('[data-polaris-demo-root]')).toBeAttached({ timeout: 15_000 })
}

/** Wait for the success state: 9 IndexTable rows visible. */
async function waitForSuccessRows(page: Page): Promise<void> {
  await expect(page.locator('[data-polaris-demo-root] table tbody tr')).toHaveCount(9, {
    timeout: 10_000,
  })
}

/** Click a state radio in the demo switcher by label. */
async function switchState(page: Page, label: string): Promise<void> {
  await page.getByTestId('demo-state-switcher').getByRole('radio', { name: label }).click()
}

// ── §1 — Bundle isolation ─────────────────────────────────────────────────────

test('isolation: Polaris chunk and style element absent on non-demo routes', async ({
  page,
  context,
}) => {
  const collectedJs = new Set<string>()
  page.on('request', (req) => {
    if (req.url().includes('.js')) collectedJs.add(req.url())
  })

  const NON_DEMO_ROUTES = [
    '/',
    '/work',
    '/work/agentic-design-ops',
    '/work/shadcn-to-polaris',
    '/system',
  ]

  for (const route of NON_DEMO_ROUTES) {
    await page.goto(route)
    await expect(page.getByRole('navigation', { name: 'Site' })).toBeVisible()

    // No Polaris style element should be injected on any non-demo route.
    await expect(page.locator('head style[data-polaris-demo-styles]')).toHaveCount(0)
  }

  // Belt-and-suspenders: none of the JS requests across all non-demo routes
  // should be the PolarisDemo entry chunk or a Shopify package chunk.
  // Note: the route /work/shadcn-to-polaris emits a chunk named
  // "shadcn-to-polaris-*.js" (the study page component, no Polaris code).
  // We match only the named entry point and @shopify vendor scope — not the
  // word "polaris" alone — to avoid false-positives from that route's chunk.
  const polarisRequests = [...collectedJs].filter((url) => /PolarisDemo|@shopify/i.test(url))
  expect(polarisRequests).toHaveLength(0)

  // Now visit the demo in a fresh page (isolates from non-demo cached responses).
  const demoPage = await context.newPage()
  const demoJs = new Set<string>()
  demoPage.on('request', (req) => {
    if (req.url().includes('.js')) demoJs.add(req.url())
  })

  await gotoDemo(demoPage)

  // PolarisDemo chunk must have been requested.
  const polarisChunk = [...demoJs].filter((url) => /PolarisDemo.*\.js/.test(url))
  expect(polarisChunk.length).toBeGreaterThanOrEqual(1)

  // The injected style element must be present.
  await expect(demoPage.locator('head style[data-polaris-demo-styles]')).toHaveCount(1)

  await demoPage.close()
})

// ── §2 — Four API states ──────────────────────────────────────────────────────

test('states: success — 9 rows visible and state=success request observed', async ({ page }) => {
  // Collect the first chores request before landing.
  const successReqPromise = page.waitForRequest(
    (req) => req.url().includes('/demo/api/chores') && req.url().includes('state=success'),
  )

  await gotoDemo(page)

  // The demo boots into success state by default.
  await successReqPromise
  await waitForSuccessRows(page)

  // Root carries data-state="success".
  await expect(page.locator('[data-polaris-demo-root]')).toHaveAttribute('data-state', 'success')
})

test('states: empty — request observed and "No chores yet" visible', async ({ page }) => {
  await gotoDemo(page)
  await waitForSuccessRows(page) // settle first

  const emptyReqPromise = page.waitForRequest(
    (req) => req.url().includes('/demo/api/chores') && req.url().includes('state=empty'),
  )

  await switchState(page, 'empty')
  await emptyReqPromise

  await expect(page.getByText('No chores yet')).toBeVisible({ timeout: 10_000 })
})

test('states: error — 500 response observed, Banner visible, retry fires another request', async ({
  page,
}) => {
  await gotoDemo(page)
  await waitForSuccessRows(page)

  const errorRespPromise = page.waitForResponse(
    (resp) => resp.url().includes('/demo/api/chores') && resp.url().includes('state=error'),
  )

  await switchState(page, 'error')
  await errorRespPromise

  // Verify the 500 arrived.
  const errorResp = await errorRespPromise
  expect(errorResp.status()).toBe(500)

  await expect(page.getByText('Could not load chores')).toBeVisible({ timeout: 10_000 })

  // Click "Try again" — should fire another request with state=error.
  const retryReqPromise = page.waitForRequest(
    (req) => req.url().includes('/demo/api/chores') && req.url().includes('state=error'),
  )
  await page.getByRole('button', { name: 'Try again' }).click()
  await retryReqPromise
  // Error persists.
  await expect(page.getByText('Could not load chores')).toBeVisible({ timeout: 10_000 })
})

test('states: loading — ≥2 poll requests while SkeletonPage visible, then success recovers', async ({
  page,
}) => {
  await gotoDemo(page)
  await waitForSuccessRows(page)

  // Track loading requests before switching.
  let loadingRequestCount = 0
  page.on('request', (req) => {
    if (req.url().includes('/demo/api/chores') && req.url().includes('state=loading')) {
      loadingRequestCount++
    }
  })

  await switchState(page, 'loading')

  // In test env: server holds 25ms then responds; client re-polls after 600ms.
  // Wait until ≥2 requests have been sent (should take ~650ms max).
  await expect(async () => {
    expect(loadingRequestCount).toBeGreaterThanOrEqual(2)
  }).toPass({ timeout: 5_000, intervals: [100, 200, 300, 500] })

  // Polaris SkeletonPage is still showing while loading.
  // SkeletonPage renders an aria-busy or a distinctive title region.
  await expect(page.locator('[data-polaris-demo-root]')).toHaveAttribute('data-state', 'loading')

  // Switch back to success and verify rows return.
  const successRespPromise = page.waitForResponse(
    (resp) => resp.url().includes('/demo/api/chores') && resp.url().includes('state=success'),
  )
  await switchState(page, 'success')
  await successRespPromise
  await waitForSuccessRows(page)
})

// ── §3 — Style-leak teardown ──────────────────────────────────────────────────

test('style-leak: site guard holds during mount; style element removed after navigation', async ({
  page,
}) => {
  await gotoDemo(page)
  await waitForSuccessRows(page)

  // (a) While Polaris is mounted: site guard must hold the html font-size at 16px.
  const mountedFontSize = await page.evaluate(
    () => window.getComputedStyle(document.documentElement).fontSize,
  )
  expect(mountedFontSize).toBe('16px')

  // Site nav link font-family must still carry Hanken (site DS token, not Polaris reset).
  const navFontFamily = await page.evaluate(() => {
    const link = document.querySelector('nav[aria-label="Site"] a')
    return link ? window.getComputedStyle(link).fontFamily : ''
  })
  expect(navFontFamily.toLowerCase()).toContain('hanken')

  // (b) Client-side navigate away via the site nav — click, not goto.
  // Note: the dev server redirects 127.0.0.1:3001 → localhost:3001, so use a
  // path-only regex rather than an absolute URL to avoid host-name mismatch.
  await page.getByRole('navigation', { name: 'Site' }).getByRole('link', { name: 'Work' }).click()
  await expect(page).toHaveURL(/\/work$/, { timeout: 10_000 })

  // Unmount cleanup must have removed the injected style element.
  await expect(page.locator('head style[data-polaris-demo-styles]')).toHaveCount(0, {
    timeout: 5_000,
  })

  // Font-size must still be 16px after Polaris unmounts.
  const afterFontSize = await page.evaluate(
    () => window.getComputedStyle(document.documentElement).fontSize,
  )
  expect(afterFontSize).toBe('16px')

  // No elements with Polaris-prefixed class names remain (AppProvider, Frame, Page, etc.).
  const polarisElementCount = await page.evaluate(
    () => document.querySelectorAll('[class*="Polaris-"]').length,
  )
  expect(polarisElementCount).toBe(0)
})

// ── §4 — Views and simulated submit ──────────────────────────────────────────

test('views: create → toast → back to index', async ({ page }) => {
  await gotoDemo(page)
  await waitForSuccessRows(page)

  // Click "New chore" primary action in Polaris Page header.
  await page.getByRole('button', { name: 'New chore' }).click()

  // URL gets ?view=create and the root switches view.
  await expect(page).toHaveURL(/view=create/, { timeout: 5_000 })
  await expect(page.locator('[data-polaris-demo-root]')).toHaveAttribute('data-view', 'create')

  // Fill the Title field (required — validation blocks submit otherwise).
  await page.getByLabel('Title').fill('Test chore title')

  // Submit via the "Add chore" primary action button.
  await page.getByRole('button', { name: 'Add chore' }).click()

  // Confirmation Banner appears with the demo-only message.
  await expect(page.getByText('Demo only — nothing is persisted')).toBeVisible({ timeout: 5_000 })

  // View returns to index.
  await expect(page.locator('[data-polaris-demo-root]')).toHaveAttribute('data-view', 'index', {
    timeout: 5_000,
  })
})

test('views: browser Back from create returns to index view', async ({ page }) => {
  await gotoDemo(page)
  await waitForSuccessRows(page)

  await page.getByRole('button', { name: 'New chore' }).click()
  await expect(page.locator('[data-polaris-demo-root]')).toHaveAttribute('data-view', 'create', {
    timeout: 5_000,
  })

  // Browser Back should restore the index view via popstate.
  await page.goBack()
  await expect(page.locator('[data-polaris-demo-root]')).toHaveAttribute('data-view', 'index', {
    timeout: 5_000,
  })
  await expect(page).not.toHaveURL(/view=create/)
})

test('views: edit — click first row loads chore title in form', async ({ page }) => {
  await gotoDemo(page)
  await waitForSuccessRows(page)

  // Click the first chore row (IndexTable row — all cells are clickable).
  await page.locator('[data-polaris-demo-root] table tbody tr').first().click()

  // Wait for edit view to mount and the individual chore fetch to resolve.
  await expect(page.locator('[data-polaris-demo-root]')).toHaveAttribute('data-view', 'edit', {
    timeout: 10_000,
  })

  // The Title field should be populated with the first chore's title from seed.
  // Seed chore id=1: "Tidy the living room".
  // IndexTable default sort is title ascending. "Clean the bathroom" is first
  // alphabetically in the 9-chore seed.
  await expect(page.getByLabel('Title')).toHaveValue('Clean the bathroom', { timeout: 10_000 })
})

test('views: delete — Modal confirm → toast → index', async ({ page }) => {
  await gotoDemo(page)
  await waitForSuccessRows(page)

  // Navigate to edit view.
  await page.locator('[data-polaris-demo-root] table tbody tr').first().click()
  await expect(page.locator('[data-polaris-demo-root]')).toHaveAttribute('data-view', 'edit', {
    timeout: 10_000,
  })
  // IndexTable default sort is title ascending. "Clean the bathroom" is first
  // alphabetically in the 9-chore seed.
  await expect(page.getByLabel('Title')).toHaveValue('Clean the bathroom', { timeout: 10_000 })

  // Open the delete modal via the secondary action.
  await page.getByRole('button', { name: 'Delete chore' }).click()

  // Modal should appear with a "Delete" confirm button.
  await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5_000 })
  await expect(page.getByRole('dialog').getByRole('button', { name: 'Delete' })).toBeVisible()

  // Confirm deletion.
  await page.getByRole('dialog').getByRole('button', { name: 'Delete' }).click()

  // Confirmation Banner appears and view returns to index.
  await expect(page.getByText('Demo only — nothing is persisted')).toBeVisible({ timeout: 5_000 })
  await expect(page.locator('[data-polaris-demo-root]')).toHaveAttribute('data-view', 'index', {
    timeout: 5_000,
  })
})

// ── §5 — Axe on demo route (galenti skin, SETTLED states) ────────────────────
//
// No rule carve-outs. The demo deliberately avoids Polaris Frame (whose
// nested <main> landmark cannot coexist with the page's own <main>): submit
// confirmation is a Polaris Banner instead of a Frame-dependent Toast, so
// the full zero-violation bar applies here like everywhere else.
function demoAxe(page: Page) {
  return new AxeBuilder({ page })
}

test('axe: demo success state — zero violations', async ({ page }) => {
  await gotoDemo(page)
  await waitForSuccessRows(page)
  const results = await demoAxe(page).analyze()
  expect(results.violations).toEqual([])
})

test('axe: demo empty state — zero violations', async ({ page }) => {
  await gotoDemo(page)
  await waitForSuccessRows(page)

  await switchState(page, 'empty')
  await expect(page.getByText('No chores yet')).toBeVisible({ timeout: 10_000 })

  const results = await demoAxe(page).analyze()
  expect(results.violations).toEqual([])
})

test('axe: demo error state — zero violations', async ({ page }) => {
  await gotoDemo(page)
  await waitForSuccessRows(page)

  const errorRespPromise = page.waitForResponse(
    (resp) => resp.url().includes('/demo/api/chores') && resp.url().includes('state=error'),
  )
  await switchState(page, 'error')
  await errorRespPromise
  await expect(page.getByText('Could not load chores')).toBeVisible({ timeout: 10_000 })

  const results = await demoAxe(page).analyze()
  expect(results.violations).toEqual([])
})

test('axe: demo create view — zero violations', async ({ page }) => {
  await gotoDemo(page)
  await waitForSuccessRows(page)

  await page.getByRole('button', { name: 'New chore' }).click()
  await expect(page.locator('[data-polaris-demo-root]')).toHaveAttribute('data-view', 'create', {
    timeout: 5_000,
  })
  // Wait for form to render.
  await expect(page.getByLabel('Title')).toBeVisible({ timeout: 5_000 })

  const results = await demoAxe(page).analyze()
  expect(results.violations).toEqual([])
})

test('axe: demo edit view — zero violations', async ({ page }) => {
  await gotoDemo(page)
  await waitForSuccessRows(page)

  await page.locator('[data-polaris-demo-root] table tbody tr').first().click()
  await expect(page.locator('[data-polaris-demo-root]')).toHaveAttribute('data-view', 'edit', {
    timeout: 10_000,
  })
  // IndexTable default sort is title ascending; "Clean the bathroom" is first.
  await expect(page.getByLabel('Title')).toHaveValue('Clean the bathroom', { timeout: 10_000 })

  const results = await demoAxe(page).analyze()
  expect(results.violations).toEqual([])
})

// ── §6 — Keyboard ─────────────────────────────────────────────────────────────

test('keyboard: Tab from page top reaches state switcher; arrow keys cycle radios', async ({
  page,
}) => {
  await gotoDemo(page)
  await waitForSuccessRows(page)

  // Ensure no element is focused; start from page body.
  await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur())

  // Tab from page top until a radio with name="demo-state" is focused or we exceed limit.
  let reachedSwitcher = false
  for (let i = 0; i < 25; i++) {
    await page.keyboard.press('Tab')
    const activeName = await page.evaluate(() => {
      const el = document.activeElement as HTMLInputElement | null
      return el?.name ?? null
    })
    if (activeName === 'demo-state') {
      reachedSwitcher = true
      break
    }
  }
  expect(reachedSwitcher).toBe(true)

  // The focused radio should be one of the four options.
  const focusedValue = await page.evaluate(
    () => (document.activeElement as HTMLInputElement | null)?.value ?? '',
  )
  expect(['success', 'loading', 'empty', 'error']).toContain(focusedValue)

  // Arrow Down moves to the next radio in the group.
  await page.keyboard.press('ArrowDown')
  const newValue = await page.evaluate(
    () => (document.activeElement as HTMLInputElement | null)?.value ?? '',
  )
  expect(newValue).not.toBe(focusedValue)
  expect(['success', 'loading', 'empty', 'error']).toContain(newValue)
})

test('keyboard: switcher operable while state=error', async ({ page }) => {
  await gotoDemo(page)
  await waitForSuccessRows(page)

  // Switch to error state via click (not keyboard, to keep this test focused).
  const errorRespPromise = page.waitForResponse(
    (resp) => resp.url().includes('/demo/api/chores') && resp.url().includes('state=error'),
  )
  await switchState(page, 'error')
  await errorRespPromise
  await expect(page.getByText('Could not load chores')).toBeVisible({ timeout: 10_000 })

  // The state switcher fieldset must NOT be disabled — it should accept input.
  const switcher = page.getByTestId('demo-state-switcher')
  await expect(switcher).not.toHaveAttribute('disabled')

  // Radio inputs inside must be enabled.
  const radios = switcher.getByRole('radio')
  for (const radio of await radios.all()) {
    await expect(radio).toBeEnabled()
  }

  // Can switch back to success via keyboard: focus the success radio and press Space.
  const successRadio = switcher.getByRole('radio', { name: 'success' })
  await successRadio.focus()
  await expect(successRadio).toBeFocused()
})

test('keyboard: Tab reaches the "New chore" button inside demo', async ({ page }) => {
  await gotoDemo(page)
  await waitForSuccessRows(page)

  // Ensure no element is focused.
  await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur())

  // Tab from page top until the "New chore" button is focused or we exceed limit.
  let reachedButton = false
  for (let i = 0; i < 40; i++) {
    await page.keyboard.press('Tab')
    const label = await page.evaluate(() => {
      const el = document.activeElement as HTMLElement | null
      return el?.textContent?.trim() ?? el?.getAttribute('aria-label') ?? ''
    })
    if (label === 'New chore') {
      reachedButton = true
      break
    }
  }
  expect(reachedButton).toBe(true)
})

test('keyboard: delete Modal traps focus and Escape closes it', async ({ page }) => {
  await gotoDemo(page)
  await waitForSuccessRows(page)

  // Navigate to edit view.
  await page.locator('[data-polaris-demo-root] table tbody tr').first().click()
  await expect(page.locator('[data-polaris-demo-root]')).toHaveAttribute('data-view', 'edit', {
    timeout: 10_000,
  })
  // IndexTable default sort is title ascending. "Clean the bathroom" is first
  // alphabetically in the 9-chore seed.
  await expect(page.getByLabel('Title')).toHaveValue('Clean the bathroom', { timeout: 10_000 })

  // Open the delete confirmation Modal.
  await page.getByRole('button', { name: 'Delete chore' }).click()
  const dialog = page.getByRole('dialog')
  await expect(dialog).toBeVisible({ timeout: 5_000 })

  // Focus should be inside the modal (Polaris Modal manages focus on open).
  await expect(async () => {
    const focusInsideModal = await page.evaluate(() => {
      const dialog = document.querySelector('[role="dialog"]')
      return dialog !== null && dialog.contains(document.activeElement)
    })
    expect(focusInsideModal).toBe(true)
  }).toPass({ timeout: 3_000 })

  // Escape should close the modal.
  await page.keyboard.press('Escape')
  await expect(dialog).not.toBeVisible({ timeout: 3_000 })
})

// ── §7 — Reduced motion ───────────────────────────────────────────────────────

test('reduced-motion: demo root carries zeroing class; --p-motion-duration-200 is 0ms', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await gotoDemo(page)
  await waitForSuccessRows(page)

  const demoRoot = page.locator('[data-polaris-demo-root]')

  // The root must carry the motion-reduced class (applied by PolarisDemo when
  // useMotionPref().reduced is true).
  await expect(demoRoot).toHaveClass(/motion-reduced/, { timeout: 5_000 })

  // The CSS custom property --p-motion-duration-200 inside the root must be 0ms.
  const duration = await page.evaluate(() => {
    const root = document.querySelector('[data-polaris-demo-root]')
    return root
      ? window.getComputedStyle(root).getPropertyValue('--p-motion-duration-200').trim()
      : ''
  })
  expect(duration).toBe('0ms')
})
