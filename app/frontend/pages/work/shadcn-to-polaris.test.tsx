import type { ReactNode } from 'react'
import { render, screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import ShadcnToPolaris from './shadcn-to-polaris'
import { TOKENS } from '@/studies/shadcn-to-polaris/tokens-map'
import { API_MAP } from '@/studies/shadcn-to-polaris/api-map'
import { A11Y_MAP } from '@/studies/shadcn-to-polaris/a11y-map'
import type { Classification } from '@/studies/shadcn-to-polaris/types'

vi.mock('@inertiajs/react', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@inertiajs/react')>()),
  Head: () => null,
  Link: ({
    href,
    children,
    className,
  }: {
    href: string
    children: ReactNode
    className?: string
  }) => (
    <a href={href} className={className}>
      {children}
    </a>
  ),
}))

describe('ShadcnToPolaris page', () => {
  describe('page structure', () => {
    it('renders a single h1 with the study title', () => {
      render(<ShadcnToPolaris />)
      const h1s = screen.getAllByRole('heading', { level: 1 })
      expect(h1s).toHaveLength(1)
      expect(h1s[0]).toHaveTextContent('shadcn → Polaris')
    })

    it('has a <main> element with id="main"', () => {
      const { container } = render(<ShadcnToPolaris />)
      const main = container.querySelector('main#main')
      expect(main).toBeInTheDocument()
    })

    it('has a back link to /work', () => {
      render(<ShadcnToPolaris />)
      const link = screen.getByRole('link', { name: /Back to the work/i })
      expect(link).toHaveAttribute('href', '/work')
    })

    it('renders seven labeled sections via h2 headings', () => {
      render(<ShadcnToPolaris />)
      const h2s = screen.getAllByRole('heading', { level: 2 })
      expect(h2s.length).toBeGreaterThanOrEqual(7)
    })
  })

  describe('landed prose (slots retired at M10)', () => {
    it('framing states the philosophy gap', () => {
      render(<ShadcnToPolaris />)
      expect(
        screen.getByText(/opposite answers to where design decisions should live/i),
      ).toBeInTheDocument()
    })

    it('governance names the drift example as inline code', () => {
      render(<ShadcnToPolaris />)
      const drift = screen.getByText('px-[13px]')
      expect(drift.tagName).toBe('CODE')
    })

    it('a11y prose covers both gaps: ChoiceList fix and dnd-kit keyboard', () => {
      render(<ShadcnToPolaris />)
      expect(
        screen.getByText(/Migrating to Polaris ChoiceList fixes this for real/i),
      ).toBeInTheDocument()
      expect(
        screen.getByText(/The second gap survives the migration untouched/i),
      ).toBeInTheDocument()
    })

    it('framework close carries the 2019 web-components bet', () => {
      render(<ShadcnToPolaris />)
      expect(screen.getByText(/Back in 2019 I bet on web components/i)).toBeInTheDocument()
    })
  })

  describe('tables', () => {
    it('renders the token translation table', () => {
      const { container } = render(<ShadcnToPolaris />)
      const region = container.querySelector(
        '[aria-label="Token translation: CoBlend shadcn/Tailwind tokens mapped to Polaris tokens"]',
      )
      expect(region).toBeInTheDocument()
    })

    it('token table row count matches the TOKENS data module', () => {
      const { container } = render(<ShadcnToPolaris />)
      const region = container.querySelector(
        '[aria-label="Token translation: CoBlend shadcn/Tailwind tokens mapped to Polaris tokens"]',
      )!
      // getAllByRole('row') returns header row + data rows
      const rows = within(region as HTMLElement).getAllByRole('row')
      expect(rows).toHaveLength(TOKENS.length + 1)
    })

    it('renders the component API mapping table', () => {
      const { container } = render(<ShadcnToPolaris />)
      const region = container.querySelector(
        '[aria-label="Component API mapping: Chores flow components in CoBlend vs. Polaris equivalents"]',
      )
      expect(region).toBeInTheDocument()
    })

    it('API table row count matches the API_MAP data module', () => {
      const { container } = render(<ShadcnToPolaris />)
      const region = container.querySelector(
        '[aria-label="Component API mapping: Chores flow components in CoBlend vs. Polaris equivalents"]',
      )!
      const rows = within(region as HTMLElement).getAllByRole('row')
      expect(rows).toHaveLength(API_MAP.length + 1)
    })

    it('renders the accessibility analysis table', () => {
      const { container } = render(<ShadcnToPolaris />)
      const region = container.querySelector(
        '[aria-label="Accessibility analysis: WCAG 2.1 AA concerns in the Chores flow"]',
      )
      expect(region).toBeInTheDocument()
    })

    it('a11y table row count matches the A11Y_MAP data module', () => {
      const { container } = render(<ShadcnToPolaris />)
      const region = container.querySelector(
        '[aria-label="Accessibility analysis: WCAG 2.1 AA concerns in the Chores flow"]',
      )!
      const rows = within(region as HTMLElement).getAllByRole('row')
      expect(rows).toHaveLength(A11Y_MAP.length + 1)
    })
  })

  describe('demo entry', () => {
    it('renders a demo Card link pointing to the demo route', () => {
      render(<ShadcnToPolaris />)
      const demoLink = screen.getByRole('link', { name: /Open the demo/i })
      expect(demoLink).toHaveAttribute('href', '/work/shadcn-to-polaris/demo')
    })

    it('notes that Polaris loads only on the demo route', () => {
      render(<ShadcnToPolaris />)
      expect(screen.getByText(/Polaris.*load.*only on the demo route/i)).toBeInTheDocument()
    })
  })

  describe('data module sanity', () => {
    const VALID_CLASSIFICATIONS: Classification[] = ['clean', 'mismatch', 'standardized']

    it('TOKENS: no row has empty id, sourceToken, sourceValue, polarisToken, or note', () => {
      for (const row of TOKENS) {
        expect(row.id, `${row.id}: id`).not.toBe('')
        expect(row.sourceToken, `${row.id}: sourceToken`).not.toBe('')
        expect(row.sourceValue, `${row.id}: sourceValue`).not.toBe('')
        expect(row.polarisToken, `${row.id}: polarisToken`).not.toBe('')
        expect(row.note, `${row.id}: note`).not.toBe('')
      }
    })

    it('TOKENS: all classifications are valid', () => {
      for (const row of TOKENS) {
        expect(VALID_CLASSIFICATIONS, `${row.id}: classification`).toContain(row.classification)
      }
    })

    it('TOKENS: row ids are unique', () => {
      const ids = TOKENS.map((r) => r.id)
      expect(new Set(ids).size).toBe(ids.length)
    })

    it('API_MAP: no row has empty id, component, coBlendApi, or note', () => {
      for (const row of API_MAP) {
        expect(row.id, `${row.id}: id`).not.toBe('')
        expect(row.component, `${row.id}: component`).not.toBe('')
        expect(row.coBlendApi, `${row.id}: coBlendApi`).not.toBe('')
        expect(row.note, `${row.id}: note`).not.toBe('')
      }
    })

    it('API_MAP: all classifications are valid', () => {
      for (const row of API_MAP) {
        expect(VALID_CLASSIFICATIONS, `${row.id}: classification`).toContain(row.classification)
      }
    })

    it('API_MAP: covers Button, Dialog/Modal, ToggleGroup, and dnd-kit', () => {
      const components = API_MAP.map((r) => r.component.toLowerCase())
      expect(components.some((c) => c.includes('button'))).toBe(true)
      expect(components.some((c) => c.includes('dialog') || c.includes('modal'))).toBe(true)
      expect(components.some((c) => c.includes('toggle') || c.includes('choicelist'))).toBe(true)
      expect(
        components.some((c) => c.includes('dnd') || c.includes('drag') || c.includes('@dnd')),
      ).toBe(true)
    })

    it('API_MAP: row ids are unique', () => {
      const ids = API_MAP.map((r) => r.id)
      expect(new Set(ids).size).toBe(ids.length)
    })

    it('A11Y_MAP: no row has empty id, concern, coBlendBehavior, polarisBehavior, or note', () => {
      for (const row of A11Y_MAP) {
        expect(row.id, `${row.id}: id`).not.toBe('')
        expect(row.concern, `${row.id}: concern`).not.toBe('')
        expect(row.coBlendBehavior, `${row.id}: coBlendBehavior`).not.toBe('')
        expect(row.polarisBehavior, `${row.id}: polarisBehavior`).not.toBe('')
        expect(row.note, `${row.id}: note`).not.toBe('')
      }
    })

    it('A11Y_MAP: all classifications are valid', () => {
      for (const row of A11Y_MAP) {
        expect(VALID_CLASSIFICATIONS, `${row.id}: classification`).toContain(row.classification)
      }
    })

    it('A11Y_MAP: row ids are unique', () => {
      const ids = A11Y_MAP.map((r) => r.id)
      expect(new Set(ids).size).toBe(ids.length)
    })
  })
})
