import type { ReactNode } from 'react'
import { render, screen, within, fireEvent } from '@testing-library/react'
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { SkinProvider } from '@/shell/skin/SkinProvider'
import { MotionPrefProvider } from '@/ds/motion/useMotionPref'
import { semanticTokens } from '@/ds/tokens/generated/skins'
import type { SystemNavEntry } from '@/system/DocShell'
import MotionPage from './motion'

// Head + Link require the Inertia runtime; navigation covered by e2e.
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

// DocShell renders sidebar + main; mock to render children in main.
vi.mock('@/system/DocShell', () => ({
  DocShell: ({ children }: { children: ReactNode }) => <main>{children}</main>,
}))

const nav: SystemNavEntry[] = [{ slug: 'button', name: 'Button', tier: 'hero' }]

function renderPage() {
  return render(
    <SkinProvider>
      <MotionPrefProvider>
        <MotionPage nav={nav} />
      </MotionPrefProvider>
    </SkinProvider>,
  )
}

beforeEach(() => {
  document.documentElement.dataset.skin = 'galenti'
  delete document.documentElement.dataset.motion
  localStorage.clear()
})

afterEach(() => {
  delete document.documentElement.dataset.skin
  delete document.documentElement.dataset.motion
  localStorage.clear()
})

describe('MotionPage', () => {
  it('renders the "Motion" h1', () => {
    renderPage()
    expect(screen.getByRole('heading', { level: 1, name: 'Motion' })).toBeInTheDocument()
  })

  it('renders a duration token row for each duration token', () => {
    renderPage()
    const durationTokens = semanticTokens.motion.filter((t) => t.startsWith('--motion-duration-'))
    const durationTable = screen.getByRole('table', { name: 'Motion duration tokens' })
    const rows = within(durationTable).getAllByRole('row')
    // rows = thead row + tbody rows
    expect(rows).toHaveLength(durationTokens.length + 1)
  })

  it('renders an easing token row for each ease token', () => {
    renderPage()
    const easeTokens = semanticTokens.motion.filter((t) => t.startsWith('--motion-ease-'))
    const easeTable = screen.getByRole('table', { name: 'Motion easing tokens' })
    const rows = within(easeTable).getAllByRole('row')
    expect(rows).toHaveLength(easeTokens.length + 1)
  })

  it('renders the live demo button and demo box', () => {
    renderPage()
    expect(screen.getByRole('button', { name: 'Animate' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /reduced motion/i })).toBeInTheDocument()
  })

  it('toggles demo button label on click', () => {
    renderPage()
    const button = screen.getByRole('button', { name: 'Animate' })
    fireEvent.click(button)
    expect(screen.getByRole('button', { name: 'Reset' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Reset' }))
    expect(screen.getByRole('button', { name: 'Animate' })).toBeInTheDocument()
  })

  it('renders the gate explanation sections', () => {
    renderPage()
    expect(screen.getByRole('heading', { name: 'How the gate works' })).toBeInTheDocument()
    // motion-overrides.css and useMotionPref each appear in the prose at least once
    expect(screen.getAllByText(/motion-overrides\.css/).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/useMotionPref/).length).toBeGreaterThan(0)
    expect(screen.getByRole('heading', { name: 'Manual override' })).toBeInTheDocument()
  })

  it('renders the manual override toggle button', () => {
    renderPage()
    const toggle = screen.getByRole('button', { name: /enable reduced motion/i })
    expect(toggle).toBeInTheDocument()
    expect(toggle).toHaveAttribute('aria-pressed', 'false')
  })

  it('renders a link to /system/tokens', () => {
    renderPage()
    expect(screen.getByRole('link', { name: 'Tokens' })).toHaveAttribute('href', '/system/tokens')
  })
})
