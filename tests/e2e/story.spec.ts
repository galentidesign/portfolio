import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'

// M5 milestone verify: assembly opening, prologue, keyboard journeys,
// skip-intro mechanics, reduced-motion parity, network isolation, and axe.

// Beat order mirrors timeline.ts BEAT_IDS — do not reorder.
const BEAT_IDS = ['tokens', 'atom', 'molecule', 'organisms', 'shell'] as const
type BeatId = (typeof BEAT_IDS)[number]

// Mid-range fraction of each RANGES entry (timeline.ts), plus two hold-plateau
// probes: a beat keeps data-beat-active through its trailing hold, handing off
// only where the next beat's range begins.
const MOTION_FRACTIONS: Array<{ fraction: number; expected: BeatId }> = [
  { fraction: 0.05, expected: 'tokens' },
  { fraction: 0.15, expected: 'tokens' }, // trailing hold — still tokens
  { fraction: 0.25, expected: 'atom' },
  { fraction: 0.45, expected: 'molecule' },
  { fraction: 0.65, expected: 'organisms' },
  { fraction: 0.77, expected: 'organisms' }, // trailing hold — still organisms
  { fraction: 0.9, expected: 'shell' },
]

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Poll until section[data-motion="on"] appears — dynamic import takes a tick. */
async function waitForMotion(page: Page): Promise<void> {
  await expect(page.locator('[data-testid="assembly-opening"][data-motion="on"]')).toBeAttached({
    timeout: 10_000,
  })
}

/** Current data-beat attribute of the element carrying data-beat-active, or null. */
async function getActiveBeat(page: Page): Promise<string | null> {
  return page.evaluate(() => {
    const el = document.querySelector('[data-beat-active]')
    return el ? el.getAttribute('data-beat') : null
  })
}

/**
 * Scroll to a fraction of the pinned distance.
 *
 * Once GSAP pins the section it becomes position:fixed, so
 * section.getBoundingClientRect().top is always 0 (viewport-relative) and
 * adding scrollY gives the current scrollY — not the section's document-top.
 * The pin-spacer GSAP inserts stays in-flow at the original position, so its
 * getBoundingClientRect().top + scrollY is the stable constant we need.
 */
async function scrollToFraction(page: Page, fraction: number): Promise<void> {
  await page.evaluate((frac) => {
    const section = document.querySelector<HTMLElement>('[data-testid="assembly-opening"]')
    if (!section) return
    // Prefer the pin-spacer (inserted by GSAP, stays in-flow at original position).
    const ref = section.closest<HTMLElement>('.pin-spacer') ?? section
    const pinStartDocTop = ref.getBoundingClientRect().top + window.scrollY
    // Pin distance is '+=520%' (timeline.ts) — 5.2 viewport heights.
    window.scrollTo(0, pinStartDocTop + frac * 5.2 * window.innerHeight)
  }, fraction)
}

// ── §9.1 stage 4 — Keyboard story: complete variant ──────────────────────────
//
// Keyboard-only, no pointer. Traverses the full opening, beats advance in order,
// continues through prologue → gateway → rails-era → react-era.

test('keyboard story — complete variant: h1 immediate, skip tab, beats complete, prologue, chapters, handoff', async ({
  page,
}) => {
  await page.goto('/')

  // H1 visible from frame one in motion mode (never hidden — README non-negotiable).
  await expect(page.getByRole('heading', { name: 'J Galenti' })).toBeVisible()

  // Wait for the motion layer to mount via dynamic import.
  await waitForMotion(page)

  // ── Tab to skip-intro ─────────────────────────────────────────────────────
  // The skip control is the first focusable element inside the opening section
  // (first operable control per README non-negotiables). A small Tab count
  // after nav + hatch should reach it.
  const skipIntro = page.getByTestId('skip-intro')
  let reached = false
  for (let i = 0; i < 20; i++) {
    await page.keyboard.press('Tab')
    if (await skipIntro.evaluate((el) => el === document.activeElement)) {
      reached = true
      break
    }
  }
  expect(reached).toBe(true)

  // Visible focus outline — shell.spec probe pattern.
  const focusProbe = await page.evaluate(() => {
    const el = document.activeElement as HTMLElement
    const cs = getComputedStyle(el)
    return { outlineStyle: cs.outlineStyle, focusVisible: el.matches(':focus-visible') }
  })
  expect(focusProbe.focusVisible).toBe(true)
  expect(focusProbe.outlineStyle).not.toBe('none')

  // ── Drive keyboard scroll; collect beat sequence ──────────────────────────
  // PageDown from a sticky button scrolls the nearest scrollable ancestor
  // (the document) in Chromium — this is legitimate keyboard traversal.
  const beatsObserved: BeatId[] = []
  let lastBeat: string | null = null

  const snapshot = async () => {
    const beat = await getActiveBeat(page)
    if (beat && BEAT_IDS.includes(beat as BeatId) && beat !== lastBeat) {
      beatsObserved.push(beat as BeatId)
      lastBeat = beat
    }
  }

  // Seed before any scroll — motion layer sets 'tokens' active at mount.
  await snapshot()

  // ~10 PageDowns covers 5.2 × viewportHeight pin distance plus overshoot.
  // Typical viewport (768 px) × PageDown factor (~0.9) = ~692 px/press.
  // Pin = 5.2 × 768 ≈ 3994 px → 6 presses exhaust it; 10 gives comfortable margin.
  for (let i = 0; i < 10; i++) {
    await page.keyboard.press('PageDown')
    await page.waitForTimeout(150) // let ScrollTrigger onUpdate settle
    await snapshot()
  }

  // Sequence must be strictly monotonically advancing through BEAT_IDS order.
  let prevIdx = -1
  for (const beat of beatsObserved) {
    const idx = BEAT_IDS.indexOf(beat)
    expect(idx).toBeGreaterThan(prevIdx)
    prevIdx = idx
  }
  // Must have advanced through at least tokens and atom, and must have reached shell.
  expect(beatsObserved.length).toBeGreaterThanOrEqual(2)
  expect(beatsObserved).toContain('shell')

  // Continue past the pin into normal flow.
  for (let i = 0; i < 6; i++) {
    await page.keyboard.press('PageDown')
  }

  // Prologue visible after pin releases.
  await expect(page.getByTestId('prologue-beat')).toBeVisible({ timeout: 5_000 })

  // ── Gateway: Tab to the first chapter card, Enter ─────────────────────────
  // Scroll gateway into view first (keyboard scroll already moved us there).
  const gateway = page.locator('#gateway')
  await gateway.scrollIntoViewIfNeeded()

  let cardReached = false
  for (let i = 0; i < 20; i++) {
    await page.keyboard.press('Tab')
    const href = await page.evaluate(() => {
      const el = document.activeElement as HTMLAnchorElement
      return el?.href ?? ''
    })
    if (href.includes('/story/rails-era')) {
      cardReached = true
      break
    }
  }
  expect(cardReached).toBe(true)

  // Focus is visible at the card.
  const cardFocusProbe = await page.evaluate(() => {
    const el = document.activeElement as HTMLElement
    return { focusVisible: el.matches(':focus-visible') }
  })
  expect(cardFocusProbe.focusVisible).toBe(true)

  // Enter the chapter.
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL(/\/story\/rails-era$/)
  await expect(page.getByRole('heading', { name: 'The Rails era' })).toBeVisible()

  // Tab to / focus the handoff link, then Enter.
  const handoff = page.getByRole('link', { name: 'Next: The React era →' })
  await handoff.focus()

  const handoffFocusProbe = await page.evaluate(() => {
    const el = document.activeElement as HTMLElement
    return { focusVisible: el.matches(':focus-visible') }
  })
  expect(handoffFocusProbe.focusVisible).toBe(true)

  await page.keyboard.press('Enter')
  await expect(page).toHaveURL(/\/story\/react-era$/)
  await expect(page.getByRole('heading', { name: 'The React era' })).toBeVisible()
})

// ── §9.1 — Keyboard story: skip variant ──────────────────────────────────────
//
// Enter on skip-intro: URL stays /, #gateway holds focus, pin is killed cleanly.

test('keyboard story — skip variant: Enter kills pin, focuses gateway, cards reachable', async ({
  page,
}) => {
  await page.goto('/')
  await waitForMotion(page)

  // Tab to the skip control.
  const skipIntro = page.getByTestId('skip-intro')
  for (let i = 0; i < 20; i++) {
    await page.keyboard.press('Tab')
    if (await skipIntro.evaluate((el) => el === document.activeElement)) break
  }
  await expect(skipIntro).toBeFocused()

  // Activate.
  await page.keyboard.press('Enter')

  // URL stays on home — skip is never a navigation.
  await expect(page).toHaveURL(/\/$/)

  // #gateway holds focus (tabIndex=-1 so it accepts programmatic focus).
  const gatewayFocused = await page.evaluate(() => {
    const gw = document.getElementById('gateway')
    return gw !== null && gw === document.activeElement
  })
  expect(gatewayFocused).toBe(true)

  // Pin spacer removed — trigger.kill() removes it from the DOM.
  await expect(page.locator('.pin-spacer')).toHaveCount(0)

  // Gateway cards reachable by Tab from gateway focus.
  let cardReachable = false
  for (let i = 0; i < 10; i++) {
    await page.keyboard.press('Tab')
    const href = await page.evaluate(() => {
      const el = document.activeElement as HTMLAnchorElement
      return el?.href ?? ''
    })
    if (href.includes('/story/')) {
      cardReachable = true
      break
    }
  }
  expect(cardReachable).toBe(true)
})

// ── §9.2 — Motion mode mechanics ─────────────────────────────────────────────

test('motion mechanics: data-motion on, one active beat, scroll fractions map to correct beats', async ({
  page,
}) => {
  await page.goto('/')
  await waitForMotion(page)

  // Exactly one [data-beat-active] at all times.
  await expect(page.locator('[data-beat-active]')).toHaveCount(1)

  // Initial beat is tokens (set by the motion layer at mount).
  await expect.poll(() => getActiveBeat(page)).toBe('tokens')

  // Walk through each fraction → expected beat per the prompt §9.2 table.
  for (const { fraction, expected } of MOTION_FRACTIONS) {
    await scrollToFraction(page, fraction)
    await expect.poll(() => getActiveBeat(page), { timeout: 3_000 }).toBe(expected)
    // Still exactly one active at all times.
    await expect(page.locator('[data-beat-active]')).toHaveCount(1)
  }
})

// ── §9.2 — Reduced-motion content parity ─────────────────────────────────────
//
// Emulate reduced motion BEFORE goto. Prove: no GSAP, no pin, all figcaptions
// visible, prologue revealed, captions IDENTICAL between modes.

test('reduced motion: no GSAP, no pin spacer, figcaptions visible, parity with motion captions', async ({
  page,
}) => {
  // Must be set before navigation.
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')

  // data-motion must never appear — poll for ~2 s to confirm the dynamic
  // import gate never fires.
  await expect
    .poll(
      () =>
        page.evaluate(() =>
          document.querySelector('[data-testid="assembly-opening"]')?.hasAttribute('data-motion'),
        ),
      { timeout: 2_000, intervals: [200, 300, 500] },
    )
    .toBe(false)

  // No GSAP pin spacer.
  await expect(page.locator('.pin-spacer')).toHaveCount(0)

  // All five beats present and their figcaptions readable by normal scroll.
  await expect(page.locator('[data-testid="assembly-opening"] [data-beat]')).toHaveCount(5)
  for (const id of BEAT_IDS) {
    const caption = page.locator(`[data-beat="${id}"] figcaption`)
    await caption.scrollIntoViewIfNeeded()
    await expect(caption).toBeVisible()
  }

  // Prologue stations revealed immediately (no observer under reduced motion).
  const prologue = page.getByTestId('prologue-beat')
  await prologue.scrollIntoViewIfNeeded()
  await expect(prologue).toHaveAttribute('data-revealed')
  for (let n = 1; n <= 4; n++) {
    await expect(page.locator(`[data-station="${n}"]`)).toBeVisible()
  }

  // Content-parity proof: collect figcaption text in reduced mode.
  const reducedCaptions = await page.evaluate(() =>
    Array.from(
      document.querySelectorAll('[data-testid="assembly-opening"] [data-beat] figcaption'),
    ).map((el) => (el.textContent ?? '').trim()),
  )
  expect(reducedCaptions).toHaveLength(5)

  // Collect same set from a motion-mode page (fresh page, same context).
  const motionPage = await page.context().newPage()
  await motionPage.goto('/')
  await expect(
    motionPage.locator('[data-testid="assembly-opening"][data-motion="on"]'),
  ).toBeAttached({ timeout: 10_000 })

  const motionCaptions = await motionPage.evaluate(() =>
    Array.from(
      document.querySelectorAll('[data-testid="assembly-opening"] [data-beat] figcaption'),
    ).map((el) => (el.textContent ?? '').trim()),
  )
  await motionPage.close()

  // Parity: same count, same strings, same order (structural — not maintained by hand).
  expect(motionCaptions).toHaveLength(reducedCaptions.length)
  expect(motionCaptions).toEqual(reducedCaptions)
})

// ── §9.2 — Network proof: GSAP never downloads under reduced motion ───────────

test('network: motion chunk absent under reduced motion, present under motion mode', async ({
  page,
}) => {
  // Collect JS-chunk requests in reduced-motion mode.
  await page.emulateMedia({ reducedMotion: 'reduce' })
  const reducedJsUrls = new Set<string>()
  page.on('request', (req) => {
    if (req.url().endsWith('.js')) reducedJsUrls.add(req.url())
  })

  await page.goto('/')
  // Full scroll to trigger any lazy chunk that might be deferred.
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight))
  await page.waitForTimeout(600)

  // Collect JS-chunk requests in motion mode from a new page in the same context.
  // The reduced-mode page never downloaded the motion chunk, so there is no
  // context-level HTTP cache hit for it.
  const motionPage = await page.context().newPage()
  const motionJsUrls = new Set<string>()
  motionPage.on('request', (req) => {
    if (req.url().endsWith('.js')) motionJsUrls.add(req.url())
  })

  await motionPage.goto('/')
  await expect(
    motionPage.locator('[data-testid="assembly-opening"][data-motion="on"]'),
  ).toBeAttached({ timeout: 10_000 })
  await motionPage.close()

  // Set-difference: chunks present in motion mode but absent in reduced mode.
  // At least one such chunk must exist (the motion layer chunk).
  const motionOnlyChunks = [...motionJsUrls].filter((url) => !reducedJsUrls.has(url))
  expect(motionOnlyChunks.length).toBeGreaterThanOrEqual(1)

  // Each motion-only chunk must not appear in the reduced set (definitionally
  // true, but the explicit assertion documents the intent).
  for (const chunkUrl of motionOnlyChunks) {
    expect([...reducedJsUrls]).not.toContain(chunkUrl)
  }

  // Belt-and-suspenders: none of the reduced-mode requests was a "motion" chunk.
  // The chunk is named motion-*.js in the vite manifest; this pattern catches it
  // regardless of path prefix (dev vs test asset path).
  const motionInReduced = [...reducedJsUrls].filter((url) => /\/motion[^/]*\.js$/.test(url))
  expect(motionInReduced).toHaveLength(0)
})

// ── §9.2 — Axe matrix ────────────────────────────────────────────────────────

test('axe: / — motion mode at top, zero violations', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'J Galenti' })).toBeVisible()
  const results = await new AxeBuilder({ page }).analyze()
  expect(results.violations).toEqual([])
})

test('axe: / — motion mode mid-sequence (~0.5 fraction), zero violations', async ({ page }) => {
  await page.goto('/')
  await waitForMotion(page)
  await scrollToFraction(page, 0.5)
  // Give GSAP one tick to update data-beat-active.
  await expect.poll(() => getActiveBeat(page), { timeout: 2_000 }).not.toBeNull()
  // Strict scan, no exclusions — the step numerals moved to an AA-passing
  // token (ink-muted) rather than being carved out of the audit.
  const results = await new AxeBuilder({ page }).analyze()
  expect(results.violations).toEqual([])
})

test('axe: / — reduced motion, full scroll (prologue included), galenti skin, zero violations', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  // Scroll to bottom so axe can scan prologue and gateway in the DOM.
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight))
  await page.waitForTimeout(200)
  const results = await new AxeBuilder({ page }).analyze()
  expect(results.violations).toEqual([])
})

test('axe: / — reduced motion, full scroll, debug skin, zero violations', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/?skin=debug')
  await expect(page.locator('html')).toHaveAttribute('data-skin', 'debug')
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight))
  await page.waitForTimeout(200)
  const results = await new AxeBuilder({ page }).analyze()
  expect(results.violations).toEqual([])
})

// ── §9.1 — Skip control visible from frame one, not obscured by site bar ──────

test('skip-intro: visible with the assembly beat, top ≥ nav bar bottom, fully inside viewport', async ({
  page,
}) => {
  await page.goto('/')

  // Beat 00 (liftoff) owns frame one; the skip control belongs to the
  // assembly beat — bring it on stage the way a scrolling visitor would.
  // Wait for the motion layer first: pinned geometry is what a motion-mode
  // visitor actually sees (the static base is the reduced-motion layout).
  await page
    .locator('[data-testid="assembly-opening"][data-motion="on"]')
    .waitFor({ timeout: 12_000 })
  await page.evaluate(() => {
    document.querySelector('[data-testid="assembly-opening"]')?.scrollIntoView()
  })
  await page.waitForTimeout(300)

  const viewport = page.viewportSize()!
  const skipBox = (await page.getByTestId('skip-intro').boundingBox())!
  const navBox = (await page.locator('[data-testid="nav-header"]').boundingBox())!

  // Fully inside the viewport without scrolling.
  expect(skipBox.y).toBeGreaterThanOrEqual(0)
  expect(skipBox.y + skipBox.height).toBeLessThanOrEqual(viewport.height)
  expect(skipBox.x).toBeGreaterThanOrEqual(0)
  expect(skipBox.x + skipBox.width).toBeLessThanOrEqual(viewport.width)

  // Not overlapped by the site bar — skip top must be at or below the bar's bottom.
  expect(skipBox.y).toBeGreaterThanOrEqual(navBox.y + navBox.height)
})
