import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

// M8 milestone verify: Study A and Study B page structure, table row counts,
// prose-slot presence, demo Card link, and axe matrix over both routes.

// ── Study A: /work/agentic-design-ops ────────────────────────────────────────

test('Study A: h1 and four section headings', async ({ page }) => {
  await page.goto('/work/agentic-design-ops')
  // Wait for shell — Inertia page is settled when the nav is visible.
  await expect(page.getByRole('navigation', { name: 'Site' })).toBeVisible()

  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Agentic design-ops')
  await expect(page.getByRole('heading', { level: 2, name: 'Decision' })).toBeVisible()
  await expect(page.getByRole('heading', { level: 2, name: 'Build' })).toBeVisible()
  await expect(page.getByRole('heading', { level: 2, name: 'Ripple' })).toBeVisible()
  await expect(page.getByRole('heading', { level: 2, name: 'Connect to targets' })).toBeVisible()
})

test('Study A: diagrams and pattern gallery render', async ({ page }) => {
  await page.goto('/work/agentic-design-ops')
  await expect(page.getByRole('navigation', { name: 'Site' })).toBeVisible()

  await expect(page.getByTestId('orchestration-diagram')).toBeVisible()
  await expect(page.getByTestId('ripple-diagram')).toBeVisible()
  await expect(page.getByTestId('pattern-gallery')).toBeVisible()
})

test('Study A: five prose slots present', async ({ page }) => {
  await page.goto('/work/agentic-design-ops')
  await expect(page.getByRole('navigation', { name: 'Site' })).toBeVisible()

  // Five distinct prose slot ids: framing, decision, build, ripple, close.
  const slots = page.locator('[data-prose-slot]')
  await expect(slots).toHaveCount(5)
  await expect(page.locator('[data-prose-slot="study-a/framing"]')).toBeAttached()
  await expect(page.locator('[data-prose-slot="study-a/decision"]')).toBeAttached()
  await expect(page.locator('[data-prose-slot="study-a/build"]')).toBeAttached()
  await expect(page.locator('[data-prose-slot="study-a/ripple"]')).toBeAttached()
  await expect(page.locator('[data-prose-slot="study-a/close"]')).toBeAttached()
})

// ── Study B: /work/shadcn-to-polaris ─────────────────────────────────────────

test('Study B: h1 present', async ({ page }) => {
  await page.goto('/work/shadcn-to-polaris')
  await expect(page.getByRole('navigation', { name: 'Site' })).toBeVisible()
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('shadcn → Polaris')
})

test('Study B: three tables with correct row counts (23 / 15 / 7)', async ({ page }) => {
  await page.goto('/work/shadcn-to-polaris')
  await expect(page.getByRole('navigation', { name: 'Site' })).toBeVisible()

  const tables = page.getByRole('table')
  await expect(tables).toHaveCount(3)

  // Token translation table: 23 data rows.
  await expect(tables.nth(0).locator('tbody tr')).toHaveCount(23)

  // Component API mapping table: 15 data rows.
  await expect(tables.nth(1).locator('tbody tr')).toHaveCount(15)

  // A11y concern table: 7 data rows.
  await expect(tables.nth(2).locator('tbody tr')).toHaveCount(7)
})

test('Study B: demo Card links to /work/shadcn-to-polaris/demo', async ({ page }) => {
  await page.goto('/work/shadcn-to-polaris')
  await expect(page.getByRole('navigation', { name: 'Site' })).toBeVisible()

  // The Card renders as <a> when href is supplied; the title text is the accessible name.
  const demoCard = page.getByRole('link', { name: /Chores flow — Polaris rebuild/i })
  await expect(demoCard).toBeVisible()
  await expect(demoCard).toHaveAttribute('href', '/work/shadcn-to-polaris/demo')
})

// ── Axe matrix: both study routes × {galenti, debug} skins ───────────────────

const STUDY_ROUTES = ['/work/agentic-design-ops', '/work/shadcn-to-polaris'] as const

for (const route of STUDY_ROUTES) {
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
