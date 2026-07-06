import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'

// M9 milestone verify: telemetry beacons end-to-end (page_view, skim_entry,
// mode_switch, demo_state, story_complete, scroll_depth), /ops auth + dashboard,
// /resume + /colophon page assertions, OG bareness, sitemap/robots/noindex,
// and site footer keyboard nav.

const CONTACT_EMAIL = 'galentidesign@gmail.com'
const FIGMA_LIBRARY_HREF = 'https://www.figma.com/design/FDrHYp9F366R2GZ0Ra9koO/portfolio'

// ── Beacon spy helpers ────────────────────────────────────────────────────────
//
// navigator.sendBeacon() sends a Blob; Playwright's request.postData() returns
// null for Blob bodies. We spy at the JS level via addInitScript instead and
// accumulate parsed bodies in window.__beacons before each navigation.

type BeaconData = { kind: string; payload: Record<string, unknown> }

/**
 * Register a navigator.sendBeacon spy before the first navigation.
 * Must be called before page.goto(). Captured beacons accumulate in
 * window.__beacons (reset on every full page navigation because addInitScript
 * re-runs on each load).
 */
async function installBeaconSpy(page: Page): Promise<void> {
  await page.addInitScript(() => {
    type BD = { kind: string; payload: Record<string, unknown> }
    const win = window as Window & { __beacons: BD[] }
    win.__beacons = []
    const orig = navigator.sendBeacon.bind(navigator)
    navigator.sendBeacon = (url: string | URL, data?: BodyInit | null): boolean => {
      if (data instanceof Blob) {
        void data.text().then((text) => {
          try {
            win.__beacons.push(JSON.parse(text) as BD)
          } catch {
            // ignore malformed bodies
          }
        })
      }
      return orig(url, data ?? undefined)
    }
  })
}

/** Read all captured beacon bodies from the page context. */
async function getBeacons(page: Page): Promise<BeaconData[]> {
  return page.evaluate(() => {
    const win = window as Window & {
      __beacons?: Array<{ kind: string; payload: Record<string, unknown> }>
    }
    return win.__beacons ?? []
  })
}

// ── §1 — Beacons from a real browse ──────────────────────────────────────────

test.describe('§1 — Beacons from a real browse', () => {
  test('page_view fires on / load: 204, no Set-Cookie, pageload_id and path in payload', async ({
    page,
  }) => {
    await installBeaconSpy(page)

    // Capture the first /t POST response for the protocol-level assertions.
    const beaconRespPromise = page.waitForResponse(
      (resp) => resp.url().endsWith('/t') && resp.request().method() === 'POST',
      { timeout: 15_000 },
    )

    await page.goto('/')
    await expect(page.getByRole('navigation', { name: 'Site' })).toBeVisible()

    const beaconResp = await beaconRespPromise
    expect(beaconResp.status()).toBe(204)
    // Cookieless contract: the telemetry endpoint must never set a cookie.
    expect(beaconResp.headers()['set-cookie']).toBeUndefined()

    // Body assertions via the sendBeacon spy (postData() is null for Blob bodies).
    await expect(async () => {
      const beacons = await getBeacons(page)
      const pv = beacons.find((b) => b.kind === 'page_view')
      expect(pv).toBeDefined()
      expect(pv!.payload.pageload_id).toBeTruthy()
      expect(pv!.payload.path).toBe('/')
    }).toPass({ timeout: 10_000 })
  })

  test('client-side nav to /work fires page_view(path=/work) AND skim_entry(via:direct); cookieless', async ({
    page,
  }) => {
    await installBeaconSpy(page)
    await page.goto('/')
    await expect(page.getByRole('navigation', { name: 'Site' })).toBeVisible()

    await page.getByRole('navigation', { name: 'Site' }).getByRole('link', { name: 'Work' }).click()
    await expect(page).toHaveURL(/\/work$/)

    // Both beacons must arrive: page_view for /work and first skim_entry.
    await expect(async () => {
      const beacons = await getBeacons(page)
      const pv = beacons.find((b) => b.kind === 'page_view' && b.payload.path === '/work')
      const se = beacons.find((b) => b.kind === 'skim_entry')
      expect(pv).toBeDefined()
      expect(pv!.payload.pageload_id).toBeTruthy()
      expect(se).toBeDefined()
      expect(se!.payload.via).toBe('direct')
    }).toPass({ timeout: 10_000 })

    // Cookieless end-to-end: no cookies after a full browse.
    const cookie = await page.evaluate(() => document.cookie)
    expect(cookie).toBe('')
  })
})

// ── §2 — mode_switch via hatch ────────────────────────────────────────────────

test.describe('§2 — mode_switch via hatch', () => {
  test('hatch click fires mode_switch{to:skim,via:hatch} then skim_entry{via:hatch}', async ({
    page,
  }) => {
    await installBeaconSpy(page)
    await page.goto('/')
    await expect(page.getByTestId('escape-hatch')).toBeVisible()

    await page.getByTestId('escape-hatch').click()
    await expect(page).toHaveURL(/\/work$/)

    await expect(async () => {
      const beacons = await getBeacons(page)
      const ms = beacons.find((b) => b.kind === 'mode_switch')
      const se = beacons.find((b) => b.kind === 'skim_entry')
      expect(ms).toBeDefined()
      expect(ms!.payload.to).toBe('skim')
      expect(ms!.payload.via).toBe('hatch')
      expect(se).toBeDefined()
      expect(se!.payload.via).toBe('hatch')
    }).toPass({ timeout: 10_000 })
  })
})

// ── §3 — demo_state ───────────────────────────────────────────────────────────

test.describe('§3 — demo_state', () => {
  test('clicking a demo state label fires demo_state beacon with correct state and 204', async ({
    page,
  }) => {
    await installBeaconSpy(page)
    await page.goto('/work/shadcn-to-polaris/demo')
    await expect(page.locator('[data-polaris-demo-root]')).toBeAttached({ timeout: 15_000 })

    // Click the 'empty' label (current state is 'success'; labels wrap radios).
    const emptyLabel = page
      .getByTestId('demo-state-switcher')
      .locator('label', { hasText: 'empty' })

    // Set up a response capture immediately before the action so earlier
    // page-load beacons don't interfere.
    const demoRespPromise = page.waitForResponse(
      (resp) => resp.url().endsWith('/t') && resp.request().method() === 'POST',
      { timeout: 10_000 },
    )

    await emptyLabel.click()

    const demoResp = await demoRespPromise
    expect(demoResp.status()).toBe(204)

    // Confirm the captured beacon body carries the correct state.
    await expect(async () => {
      const beacons = await getBeacons(page)
      const ds = beacons.find((b) => b.kind === 'demo_state')
      expect(ds).toBeDefined()
      expect(ds!.payload.state).toBe('empty')
    }).toPass({ timeout: 10_000 })
  })
})

// ── §4 — story_complete ───────────────────────────────────────────────────────

test.describe('§4 — story_complete', () => {
  test('story_complete fires once per pageload; scrolling outro in/out/in does NOT re-fire', async ({
    page,
  }) => {
    await installBeaconSpy(page)
    await page.goto('/story/agentic')
    await expect(page.getByRole('navigation', { name: 'Site' })).toBeVisible()

    const outro = page.getByTestId('story-outro')

    // Scroll the chapter footer into view — fires IntersectionObserver.
    await outro.scrollIntoViewIfNeeded()

    await expect(async () => {
      const beacons = await getBeacons(page)
      const fires = beacons.filter((b) => b.kind === 'story_complete')
      expect(fires.length).toBeGreaterThanOrEqual(1)
      expect(fires[0].payload.chapter).toBe('agentic')
    }).toPass({ timeout: 10_000 })

    // Scroll back to the top so the outro leaves the viewport.
    await page.evaluate(() => window.scrollTo(0, 0))

    // Scroll outro into view a second time.
    await outro.scrollIntoViewIfNeeded()

    // Deliberate wait: we're testing for absence — no event-based waitFor applies.
    await page.waitForTimeout(400)

    const beaconsAfterSecondScroll = await getBeacons(page)
    const completeFires = beaconsAfterSecondScroll.filter((b) => b.kind === 'story_complete')
    expect(completeFires.length).toBe(1)
  })
})

// ── §5 — scroll_depth ────────────────────────────────────────────────────────

test.describe('§5 — scroll_depth', () => {
  test('quartile beacons 25/50/75/100 each fire at most once per pageload', async ({ page }) => {
    await installBeaconSpy(page)
    // /story/rails-era is confirmed long enough to scroll through all four quartiles.
    await page.goto('/story/rails-era')
    await expect(page.getByRole('navigation', { name: 'Site' })).toBeVisible()

    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight))

    await expect(async () => {
      const beacons = await getBeacons(page)
      const depths = beacons.filter((b) => b.kind === 'scroll_depth')
      expect(depths.some((b) => b.payload.quartile === 25)).toBe(true)
      expect(depths.some((b) => b.payload.quartile === 50)).toBe(true)
      expect(depths.some((b) => b.payload.quartile === 75)).toBe(true)
      expect(depths.some((b) => b.payload.quartile === 100)).toBe(true)
    }).toPass({ timeout: 10_000 })

    // Scroll back to top, then to bottom again.
    await page.evaluate(() => window.scrollTo(0, 0))
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight))

    // Deliberate wait so any errant duplicate events would have had time to fire.
    await page.waitForTimeout(400)

    const final = await getBeacons(page)
    const depths = final.filter((b) => b.kind === 'scroll_depth')
    expect(depths.filter((b) => b.payload.quartile === 25).length).toBeLessThanOrEqual(1)
    expect(depths.filter((b) => b.payload.quartile === 50).length).toBeLessThanOrEqual(1)
    expect(depths.filter((b) => b.payload.quartile === 75).length).toBeLessThanOrEqual(1)
    expect(depths.filter((b) => b.payload.quartile === 100).length).toBeLessThanOrEqual(1)
  })
})

// ── §6 — /ops ────────────────────────────────────────────────────────────────

test.describe('§6 — /ops', () => {
  test('unauthenticated GET /ops → 401', async ({ request }) => {
    const resp = await request.get('http://localhost:3001/ops')
    expect(resp.status()).toBe(401)
  })

  test('wrong credentials → 401', async ({ request }) => {
    const resp = await request.get('http://localhost:3001/ops', {
      headers: {
        Authorization: 'Basic ' + Buffer.from('ops-e2e:wrong-password').toString('base64'),
      },
    })
    expect(resp.status()).toBe(401)
  })

  test.describe('authenticated', () => {
    test.use({
      httpCredentials: { username: 'ops-e2e', password: 'ops-e2e-not-a-secret' },
    })

    test('correct auth → 200, h1 "Ops", stat cards, three tables, axe clean, X-Robots-Tag noindex', async ({
      page,
    }) => {
      const response = await page.goto('/ops')
      expect(response!.status()).toBe(200)

      // Private dashboard must always carry noindex (regardless of host).
      expect(response!.headers()['x-robots-tag']).toMatch(/noindex/)

      await expect(page.getByRole('heading', { name: 'Ops', level: 1 })).toBeVisible()

      // Stat-row landmark exists (role=region from aria-label="Summary stats").
      await expect(page.getByRole('region', { name: 'Summary stats' })).toBeVisible()

      // Three data tables: daily visits, top referrers, top paths.
      await expect(page.getByRole('table')).toHaveCount(3)

      const results = await new AxeBuilder({ page }).analyze()
      expect(results.violations).toEqual([])
    })
  })
})

// ── §7 — /resume ─────────────────────────────────────────────────────────────

test.describe('§7 — /resume', () => {
  test('h1, thesis lede, five highlight proof links, PDF unavailable panel, contact row', async ({
    page,
  }) => {
    await page.goto('/resume')
    await expect(page.getByRole('navigation', { name: 'Site' })).toBeVisible()

    await expect(page.getByRole('heading', { name: 'J Galenti', level: 1 })).toBeVisible()

    // Thesis lede.
    await expect(
      page.getByText('I architect enterprise-scale design systems', { exact: false }),
    ).toBeVisible()

    // Five highlight proof links (two share the same visible label).
    await expect(page.getByRole('link', { name: 'See the system →' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'See the craft bar →' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Read the study →' })).toHaveCount(2)
    await expect(page.getByRole('link', { name: 'Start the story →' })).toBeVisible()

    // PDF unavailable panel (no PDF file in repo → available: false).
    const pdfSection = page.locator('section[aria-label="PDF résumé"]')
    await expect(
      pdfSection.getByText('email me for the current version', { exact: false }),
    ).toBeVisible()
    await expect(pdfSection.getByRole('link', { name: CONTACT_EMAIL })).toBeVisible()

    // Contact row.
    const contactSection = page.locator('section[aria-label="Contact"]')
    await expect(contactSection.getByRole('link', { name: CONTACT_EMAIL })).toBeVisible()
    await expect(contactSection.getByRole('link', { name: 'LinkedIn' })).toBeVisible()
  })

  test('axe: /resume galenti skin → zero violations', async ({ page }) => {
    await page.goto('/resume')
    await expect(page.getByRole('navigation', { name: 'Site' })).toBeVisible()
    const results = await new AxeBuilder({ page }).analyze()
    expect(results.violations).toEqual([])
  })

  test('axe: /resume debug skin → zero violations', async ({ page }) => {
    await page.goto('/resume?skin=debug')
    await expect(page.locator('html')).toHaveAttribute('data-skin', 'debug')
    const results = await new AxeBuilder({ page }).analyze()
    expect(results.violations).toEqual([])
  })
})

// ── §8 — /colophon ───────────────────────────────────────────────────────────

test.describe('§8 — /colophon', () => {
  test('privacy claim, craft-bar "Measured" line, 100 score, Figma link, type credits', async ({
    page,
  }) => {
    await page.goto('/colophon')
    await expect(page.getByRole('navigation', { name: 'Site' })).toBeVisible()

    // Privacy claim (§7 contract).
    await expect(page.getByText('first-party, cookieless', { exact: false })).toBeVisible()

    // Craft bar "Measured" line (craft.json is committed; capturedAt is present).
    await expect(page.getByText(/Measured \d{4}-\d{2}-\d{2}/, { exact: false })).toBeVisible()

    // At least one score of "100" in the Lighthouse data (CSS Module class names
    // are hashed; use getByText with exact match inside the craft-bar region).
    const craftSection = page.getByRole('region', { name: 'Craft bar' })
    await expect(craftSection.getByText('100', { exact: true }).first()).toBeVisible()

    // Figma library link.
    await expect(page.getByRole('link', { name: 'The DS as a Figma library →' })).toHaveAttribute(
      'href',
      FIGMA_LIBRARY_HREF,
    )

    // Type credits.
    await expect(page.getByText('Hanken Grotesk', { exact: false })).toBeVisible()
  })

  test('axe: /colophon galenti skin → zero violations', async ({ page }) => {
    await page.goto('/colophon')
    await expect(page.getByRole('navigation', { name: 'Site' })).toBeVisible()
    const results = await new AxeBuilder({ page }).analyze()
    expect(results.violations).toEqual([])
  })

  test('axe: /colophon debug skin → zero violations', async ({ page }) => {
    await page.goto('/colophon?skin=debug')
    await expect(page.locator('html')).toHaveAttribute('data-skin', 'debug')
    const results = await new AxeBuilder({ page }).analyze()
    expect(results.violations).toEqual([])
  })
})

// ── §9 — OG bareness ─────────────────────────────────────────────────────────

test.describe('§9 — OG bareness', () => {
  test('/og/home: no site nav, no contentinfo, data-og-ready appears, noindex', async ({
    page,
  }) => {
    const response = await page.goto('/og/home')
    expect(response!.status()).toBe(200)

    // Unconditional noindex on the OG generation surface.
    expect(response!.headers()['x-robots-tag']).toMatch(/noindex/)

    // layout = null on OgCard: no SiteShell wrapping → no site Nav, no SiteFooter.
    // Note: OgCard has its own inner <footer> (wordmark), but the SiteFooter
    // is absent; check for SiteFooter-specific content (Source link) being absent.
    await expect(page.getByRole('navigation', { name: 'Site' })).toHaveCount(0)
    await expect(page.getByRole('link', { name: 'Source' })).toHaveCount(0)

    // Fonts settle and the card signals paint-readiness.
    await expect(page.locator('[data-og-ready="true"]')).toBeAttached({ timeout: 10_000 })
  })

  test('/og/nonexistent-key → 404', async ({ page }) => {
    const response = await page.goto('/og/nonexistent-key')
    expect(response!.status()).toBe(404)
  })
})

// ── §10 — sitemap + robots + noindex ─────────────────────────────────────────

test.describe('§10 — sitemap + robots + noindex', () => {
  test('/sitemap.xml: 200, XML content-type, includes work + /system/components/, excludes /ops and /og/', async ({
    request,
  }) => {
    // Use localhost directly to bypass the 127.0.0.1→localhost redirect that
    // strips the path when curl follows it (Playwright's page.goto handles it
    // correctly; the APIRequest fixture does too via explicit base URL).
    const resp = await request.get('http://localhost:3001/sitemap.xml')
    expect(resp.status()).toBe(200)

    const ct = resp.headers()['content-type'] ?? ''
    expect(ct).toContain('xml')

    const body = await resp.text()
    expect(body).toContain('https://jgalenti.com/work')
    expect(body).toContain('/system/components/')
    expect(body).not.toContain('/ops')
    expect(body).not.toContain('/og/')
  })

  test('/robots.txt: both Disallows present, Sitemap line present', async ({ request }) => {
    const resp = await request.get('http://localhost:3001/robots.txt')
    expect(resp.status()).toBe(200)
    const body = await resp.text()
    expect(body).toContain('Disallow: /ops')
    expect(body).toContain('Disallow: /og/')
    expect(body).toContain('Sitemap:')
  })

  test('/ response carries X-Robots-Tag: noindex (non-canonical host guard)', async ({ page }) => {
    const response = await page.goto('/')
    // Test server is not jgalenti.com → after_action fires X-Robots-Tag: noindex.
    expect(response!.headers()['x-robots-tag']).toMatch(/noindex/)
  })
})

// ── §11 — Footer ─────────────────────────────────────────────────────────────

test.describe('§11 — Footer', () => {
  test('contentinfo footer on / has email, LinkedIn, Source, and Colophon links', async ({
    page,
  }) => {
    await page.goto('/')
    await expect(page.getByRole('navigation', { name: 'Site' })).toBeVisible()

    const footer = page.getByRole('contentinfo')
    await expect(footer).toBeVisible()
    await expect(footer.getByRole('link', { name: CONTACT_EMAIL })).toBeVisible()
    await expect(footer.getByRole('link', { name: 'LinkedIn' })).toBeVisible()
    await expect(footer.getByRole('link', { name: 'Source' })).toBeVisible()
    await expect(footer.getByRole('link', { name: 'Colophon' })).toBeVisible()
  })

  test('Colophon footer link: focus + Enter navigates client-side to /colophon', async ({
    page,
  }) => {
    await page.goto('/')
    await expect(page.getByRole('navigation', { name: 'Site' })).toBeVisible()

    const colophonLink = page.getByRole('contentinfo').getByRole('link', { name: 'Colophon' })
    await colophonLink.focus()
    await expect(colophonLink).toBeFocused()

    await page.keyboard.press('Enter')
    await expect(page).toHaveURL(/\/colophon$/)
    await expect(page.getByRole('heading', { name: 'Colophon', level: 1 })).toBeVisible()
  })
})
