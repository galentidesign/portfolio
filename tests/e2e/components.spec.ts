import { readdirSync } from 'node:fs'
import { join } from 'node:path'
import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'

// ── Slug discovery ─────────────────────────────────────────────────────────
// Derived at collection time so new manifests auto-enroll with zero edits
// to this file. Excludes README.md (not a .yml file, but filtered anyway).

const MANIFEST_DIR = join(process.cwd(), 'data', 'manifest')
const slugs = readdirSync(MANIFEST_DIR)
  .filter((f) => f.endsWith('.yml'))
  .map((f) => f.replace(/\.yml$/, ''))

// ── Helpers ────────────────────────────────────────────────────────────────

async function gotoComponent(page: Page, slug: string, query = '') {
  await page.goto(`/system/components/${slug}${query}`)
  // Wait for the Inertia hydration anchor — client-rendered; interactions
  // before mount hit a dead page.
  await expect(page.locator(`[data-component-doc="${slug}"]`)).toBeVisible()
}

// ── Per-slug tests ─────────────────────────────────────────────────────────
// NOTE: Only data/manifest/button.yml exists when this spec is written.
// More manifests land this session; the loop auto-covers them at integration.

for (const slug of slugs) {
  test(`${slug}: zero axe violations (galenti skin)`, async ({ page }) => {
    await gotoComponent(page, slug)
    const results = await new AxeBuilder({ page }).analyze()
    expect(results.violations).toEqual([])
  })

  test(`${slug}: zero axe violations (debug skin)`, async ({ page }) => {
    await gotoComponent(page, slug, '?skin=debug')
    await expect(page.locator('html')).toHaveAttribute('data-skin', 'debug')
    const results = await new AxeBuilder({ page }).analyze()
    expect(results.violations).toEqual([])
  })
}

// ── Focused walks ──────────────────────────────────────────────────────────
// Port the intent from gallery.spec.ts to the component-level routes.

test('dialog: open md dialog from its demo, axe scan open state, Escape restores focus', async ({
  page,
}) => {
  await gotoComponent(page, 'dialog')

  const trigger = page.getByRole('button', { name: 'Open md dialog' })
  await trigger.focus()
  await trigger.click()

  await expect(page.getByRole('dialog')).toBeVisible()

  const results = await new AxeBuilder({ page }).analyze()
  expect(results.violations).toEqual([])

  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog')).toBeHidden()
  await expect(trigger).toBeFocused()
})

test('nav: demo palette opens via trigger, query + Enter performs, reopen + Escape restores focus', async ({
  page,
}) => {
  await gotoComponent(page, 'nav')

  // The global ⌘K belongs to the real site shell since M4 (the demo pins
  // enableShortcut={false}), so the demo palette opens via its visible
  // trigger. Scoped to the Variants region: the site shell and the
  // playground stage each mount their own trigger.
  const demoTrigger = page
    .getByRole('region', { name: 'Variants' })
    .getByRole('button', { name: 'Search & commands' })
  await demoTrigger.click()
  const input = page.getByRole('combobox', { name: 'Search commands' })
  await expect(input).toBeFocused()

  const results = await new AxeBuilder({ page }).analyze()
  expect(results.violations).toEqual([])

  await input.fill('writing')
  await page.keyboard.press('Enter')
  await expect(page.getByRole('combobox')).toBeHidden()
  await expect(page.getByText('Last action: Writing')).toBeVisible()

  // Reopen and close with Escape — focus returns to the demo's trigger.
  await demoTrigger.click()
  await expect(input).toBeFocused()
  await page.keyboard.press('Escape')
  await expect(page.getByRole('combobox')).toBeHidden()
  await expect(demoTrigger).toBeFocused()
})

test('button: playground — choose size sm → stage reflects it and snippet shows size="sm"', async ({
  page,
}) => {
  await gotoComponent(page, 'button')

  // The Playground renders a size segmented control (hero tier). The radio
  // inputs are visually hidden — users click the segment labels.
  const sizeGroup = page.getByRole('radiogroup', { name: 'size' })
  await sizeGroup.getByText('sm', { exact: true }).click()
  await expect(sizeGroup.getByRole('radio', { name: 'sm' })).toBeChecked()

  // The host component in the stage should carry data-size="sm"
  const stage = page.locator('[data-testid="playground-stage"]')
  await expect(stage.locator('[data-size="sm"]')).toBeVisible()

  // The snippet code block must include the size attribute
  const snippetPre = page.getByRole('group', { name: 'Snippet' })
  await expect(snippetPre).toContainText('size="sm"')
})

test('button: first Tab lands on a focused element with a visible outline', async ({ page }) => {
  await gotoComponent(page, 'button')

  await page.keyboard.press('Tab')

  const probe = await page.evaluate(() => {
    const el = document.activeElement as HTMLElement
    const cs = getComputedStyle(el)
    return {
      outlineStyle: cs.outlineStyle,
      focusVisible: el.matches(':focus-visible'),
    }
  })

  expect(probe.focusVisible).toBe(true)
  expect(probe.outlineStyle).not.toBe('none')
})
