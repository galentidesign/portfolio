/**
 * Home-as-Story — the scroll-retheme ladder on `/` (design-direction.md,
 * Stage 2). EraRetheme's §6.2 contracts, promoted to scroll boundaries:
 * era beats wear the existing era skins as the viewport crosses their
 * markers, upward scrubs return, the sweep grounds on the visitor's own
 * skin, and nothing is ever persisted. Axe runs on SETTLED beat states
 * (gotcha ff: a route that re-themes itself has no single steady state —
 * its coverage lives here, in the suite that knows its lifecycle).
 */
import { test, expect, type Page } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

const SKIN_KEY = 'portfolio:skin'

async function scrollToBeat(page: Page, selector: string) {
  await page.evaluate((sel) => {
    document.querySelector(sel)?.scrollIntoView({ block: 'start' })
  }, selector)
}

/**
 * Wait for the page's geometry to go final before jumping around: the lazy
 * islands mount on load+idle (the kiln interior is the deepest), and in
 * motion mode the assembly pin inflates the page when the motion layer
 * lands. Jump-style tests wait here so a scrollIntoView measures the same
 * layout the ladder will.
 */
async function storySettled(page: Page, { motion = false } = {}) {
  if (motion) {
    await page
      .locator('[data-testid="assembly-opening"][data-motion="on"]')
      .waitFor({ timeout: 12_000 })
  }
  await page
    .locator('[data-testid="kiln-interior"]')
    .waitFor({ state: 'attached', timeout: 12_000 })
}

async function expectSkin(page: Page, skin: string) {
  await expect(page.locator('html')).toHaveAttribute('data-skin', skin, { timeout: 8_000 })
}

// ── The ladder, reduced motion (instant, deterministic) ─────────────────────

test('reduced: the ladder walks down through every era and sweeps home', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  await storySettled(page)
  await expectSkin(page, 'galenti')

  await scrollToBeat(page, '#era-rails')
  await expectSkin(page, 'rails-era')

  await scrollToBeat(page, '#era-react')
  await expectSkin(page, 'react-era')

  await scrollToBeat(page, '#era-agentic')
  await expectSkin(page, 'agentic')

  await scrollToBeat(page, '#the-work')
  await expectSkin(page, 'galenti')

  // Story re-themes are never a preference (persistence contract).
  expect(await page.evaluate((k) => localStorage.getItem(k), SKIN_KEY)).toBeNull()
})

test('reduced: scrubbing back up re-applies the previous era', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  await storySettled(page)

  await scrollToBeat(page, '#era-agentic')
  await expectSkin(page, 'agentic')

  await scrollToBeat(page, '#era-rails')
  await expectSkin(page, 'rails-era')

  await scrollToBeat(page, '#gateway')
  await expectSkin(page, 'galenti')
})

test('reduced: an explicit ?skin= entry grounds the whole story on it', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/?skin=debug')
  await storySettled(page)
  await expectSkin(page, 'debug')

  // Era beats still wear their own skins (each crossing is a story moment)…
  await scrollToBeat(page, '#era-rails')
  await expectSkin(page, 'rails-era')

  // …and the sweep home returns to the visitor's ground, not the default.
  await scrollToBeat(page, '#the-work')
  await expectSkin(page, 'debug')
  expect(await page.evaluate((k) => localStorage.getItem(k), SKIN_KEY)).toBeNull()
})

// ── The ladder, motion mode — the crossing band choreography ────────────────

test('motion: a downward crossing re-themes the page and settles the beat', async ({ page }) => {
  await page.goto('/')
  await storySettled(page, { motion: true })
  await expectSkin(page, 'galenti')

  // Approach first (prefetch horizon), then cross — the way a reader scrolls.
  await scrollToBeat(page, '#gateway')
  await page.waitForTimeout(400)
  await scrollToBeat(page, '#era-rails')

  await expectSkin(page, 'rails-era')

  // The settle cascade finishes with the beat's bare stagger target back at
  // full presence — the choreography-complete marker.
  await expect
    .poll(
      async () =>
        page
          .locator('#era-rails [data-retheme-stagger="true"]')
          .evaluate((el) => Number(getComputedStyle(el).opacity)),
      { timeout: 8_000 },
    )
    .toBe(1)

  expect(await page.evaluate((k) => localStorage.getItem(k), SKIN_KEY)).toBeNull()
})

test('motion: the sweep-home boundary returns the bone ground before the wordmark', async ({
  page,
}) => {
  await page.goto('/')
  await storySettled(page, { motion: true })
  await scrollToBeat(page, '#era-agentic')
  await expectSkin(page, 'agentic')

  await page.evaluate(() => {
    document.querySelector('[aria-label="Resolution — every era, one name"]')?.scrollIntoView()
  })
  await expectSkin(page, 'galenti')
})

// ── The veil — scroll-scrubbed crossing (pure function of position) ─────────

/**
 * Park the viewport so `markerSkin`'s boundary sits at veil progress
 * `fraction` (marker top at (1 − fraction) · innerHeight), then let the
 * rAF-throttled handler paint the frame. Iterates scroll-then-remeasure:
 * a single absolute jump can land off-target when late layout work (the
 * assembly pin's refresh, an island mount) shifts the geometry between the
 * measure and the scroll.
 */
async function parkMarkerAt(page: Page, markerSkin: string, fraction: number) {
  for (let attempt = 0; attempt < 4; attempt++) {
    const delta = await page.evaluate(
      ([skin, f]) => {
        const marker = document.querySelector(
          `[data-testid="scroll-retheme"][data-era-skin="${skin}"]`,
        )
        if (!marker) throw new Error(`no boundary marker for ${skin}`)
        const wanted = (1 - Number(f)) * window.innerHeight
        const offBy = marker.getBoundingClientRect().top - wanted
        if (Math.abs(offBy) > 1) window.scrollBy(0, offBy)
        return offBy
      },
      [markerSkin, fraction] as const,
    )
    await page.waitForTimeout(200)
    if (Math.abs(delta) <= 1) break
  }
}

const railsBand = (page: Page) => page.locator('[data-era-skin="rails-era"] [data-retheme-band]')

async function approachStory(page: Page) {
  await page.goto('/')
  await storySettled(page, { motion: true })
  await scrollToBeat(page, '#gateway')
  await page.waitForTimeout(400) // prefetch horizon — let the motion chunk land
}

test('motion: the veil covers the viewport centre on the swap frame', async ({ page }) => {
  await approachStory(page)

  // Boundary a hair past the reference line: the swap has just fired…
  await parkMarkerAt(page, 'rails-era', 0.51)
  await expectSkin(page, 'rails-era')

  // …and the band straddles that exact line, hiding the re-token.
  const box = await railsBand(page).boundingBox()
  const viewportHeight = await page.evaluate(() => window.innerHeight)
  expect(box).not.toBeNull()
  expect(box!.y).toBeLessThan(viewportHeight / 2)
  expect(box!.y + box!.height).toBeGreaterThan(viewportHeight / 2)
  expect(await railsBand(page).evaluate((el) => getComputedStyle(el).opacity)).toBe('1')
})

test('motion: a flick past two boundaries lands era-correct with no stale window', async ({
  page,
}) => {
  await approachStory(page)

  // One jump across the rails AND react boundaries: the newest target must
  // apply on the crossing frame — no band-travel grace, no lagging skin.
  await scrollToBeat(page, '#era-agentic')
  await expect(page.locator('html')).toHaveAttribute('data-skin', 'agentic', { timeout: 1_500 })
})

test('motion: scrolling back up reverses the veil and restores the skin', async ({ page }) => {
  await approachStory(page)

  await parkMarkerAt(page, 'rails-era', 0.7)
  await expectSkin(page, 'rails-era')

  // Back up through the same zone, well past the crossing guard's retreat
  // line: the skin restores and the veil rides the reversed travel, still
  // dressing the boundary.
  await parkMarkerAt(page, 'rails-era', 0.15)
  await expectSkin(page, 'galenti')
  expect(await railsBand(page).evaluate((el) => getComputedStyle(el).opacity)).toBe('1')
  expect(await railsBand(page).evaluate((el) => el.style.transform)).toContain('translateY')
})

test('motion: parking mid-zone holds the veil still — scrub, not clock', async ({ page }) => {
  await approachStory(page)

  await parkMarkerAt(page, 'rails-era', 0.6)
  const before = await railsBand(page).evaluate((el) => el.style.transform)
  expect(before).toContain('translateY')

  // A clock-driven band would keep travelling; the veil is position-derived
  // and must not move a pixel while the scroll is parked.
  await page.waitForTimeout(700)
  expect(await railsBand(page).evaluate((el) => el.style.transform)).toBe(before)
})

// ── Network proof — the reduced story downloads zero motion bytes ───────────

test('network: a full reduced-motion scroll of the story requests no motion chunk', async ({
  page,
}) => {
  const requested: string[] = []
  page.on('request', (req) => {
    if (req.url().endsWith('.js')) requested.push(req.url())
  })

  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')

  // Walk every beat — this crosses all four boundaries (the prefetch
  // trigger path) and mounts every lazy island.
  for (const sel of [
    '#gateway',
    '#era-rails',
    '#era-react',
    '#era-agentic',
    '#the-work',
    '[aria-labelledby="close-heading"]',
  ]) {
    await scrollToBeat(page, sel)
    await page.waitForTimeout(250)
  }

  const motionChunks = requested.filter((url) => /\/(motion|fx)[^/]*\.js$/.test(url))
  expect(motionChunks).toEqual([])
  expect(requested.some((url) => /gsap|ogl|matter/.test(url))).toBe(false)
})

// ── Skim path — hatch → beat 07 survives every beat ─────────────────────────

test('the hatch jumps straight from liftoff to the proof (no route change)', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByTestId('thesis')).toBeVisible()

  await page.getByTestId('escape-hatch').click()
  await expect(page.locator('#the-work')).toBeFocused()
  await expect(page).not.toHaveURL(/\/work/)
  await expect(page.getByRole('link', { name: /Agentic design-ops/ })).toBeVisible()
  await expect(page.getByRole('link', { name: /shadcn → Polaris/ })).toBeVisible()
})

test('a deep-dive door lands on its chapter already era-skinned (no-op entry)', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  await storySettled(page)
  await scrollToBeat(page, '#era-rails')
  await expectSkin(page, 'rails-era')

  await page.getByRole('link', { name: /The Rails era 2014–2019/ }).click()
  await expect(page).toHaveURL(/\/story\/rails-era$/)
  // Deep-link rule: already era-skinned at entry — the chapter no-ops.
  await expectSkin(page, 'rails-era')
})

// ── Axe — settled per-beat states (lifecycle-aware coverage) ────────────────

for (const [beat, skin] of [
  ['#era-rails', 'rails-era'],
  ['#era-react', 'react-era'],
  ['#era-agentic', 'agentic'],
] as const) {
  test(`axe: ${skin} beat settled state has zero violations`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('/')
    await storySettled(page)
    await scrollToBeat(page, beat)
    await expectSkin(page, skin)
    // Let the lazy island land before scanning.
    await page.waitForTimeout(600)

    const results = await new AxeBuilder({ page }).analyze()
    expect(results.violations).toEqual([])
  })
}

test('axe: the resolved bone tail (wordmark → close) has zero violations', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  await storySettled(page)
  await scrollToBeat(page, '[aria-labelledby="close-heading"]')
  await expectSkin(page, 'galenti')
  await page.waitForTimeout(600)

  const results = await new AxeBuilder({ page }).analyze()
  expect(results.violations).toEqual([])
})
