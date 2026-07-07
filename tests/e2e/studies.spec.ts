import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

// M8 milestone verify (updated at M10 prose landing): Study A and Study B page
// structure, landed prose, table row counts, demo Card link, and axe matrix
// over both routes.

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

test('Study A: prose landed in all five sections, no slots remain', async ({ page }) => {
  await page.goto('/work/agentic-design-ops')
  await expect(page.getByRole('navigation', { name: 'Site' })).toBeVisible()

  // One anchor phrase per former slot: framing, decision, build, ripple, close.
  await expect(page.getByText(/the design system is my deity/i)).toBeVisible()
  await expect(page.getByText(/The pipeline was the problem/i)).toBeVisible()
  await expect(page.getByText(/Review gets its own UI/i)).toBeVisible()
  await expect(page.getByText(/Nobody had to push adoption/i)).toBeVisible()
  await expect(page.getByText(/This site is its own evidence/i)).toBeVisible()
  await expect(page.locator('[data-prose-slot]')).toHaveCount(0)
})

test('Study B: prose landed in all four sections, no slots remain', async ({ page }) => {
  await page.goto('/work/shadcn-to-polaris')
  await expect(page.getByRole('navigation', { name: 'Site' })).toBeVisible()

  await expect(
    page.getByText(/opposite answers to where design decisions should live/i),
  ).toBeVisible()
  await expect(page.getByText(/an exception that gets reviewed/i)).toBeVisible()
  await expect(page.getByText(/The second gap survives the migration untouched/i)).toBeVisible()
  await expect(page.getByText(/Back in 2019 I bet on web components/i)).toBeVisible()
  await expect(page.locator('[data-prose-slot]')).toHaveCount(0)
})

test('Story chapters: era prose landed, no content-workstream annotations remain', async ({
  page,
}) => {
  await page.goto('/story/react-era')
  await expect(page.getByText(/the token engine story in one move/i)).toBeVisible()
  await expect(page.getByText(/content workstream/i)).toHaveCount(0)

  await page.goto('/story/agentic')
  await expect(page.getByText(/One orchestrator owns the session/i)).toBeVisible()
  await expect(page.getByText(/content workstream/i)).toHaveCount(0)
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
