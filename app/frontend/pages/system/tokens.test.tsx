import type { ReactNode } from 'react'
import { render, screen, within } from '@testing-library/react'
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest'
import { SkinProvider } from '@/shell/skin/SkinProvider'
import { MotionPrefProvider } from '@/ds/motion/useMotionPref'
import { skins as allSkins, semanticTokens } from '@/ds/tokens/generated/skins'
import TokensPage from './tokens'

// Head and Link require the Inertia runtime; covered by e2e.
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

function renderPage() {
  return render(
    <SkinProvider>
      <MotionPrefProvider>
        <TokensPage />
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

describe('TokensPage', () => {
  it('renders one color card per semanticTokens.color entry', () => {
    renderPage()
    const colorList = screen.getByRole('list', { name: 'Color tokens' })
    const cards = within(colorList).getAllByRole('listitem')
    expect(cards).toHaveLength(semanticTokens.color.length)
  })

  it('renders six type specimens', () => {
    renderPage()
    const typeList = screen.getByRole('list', { name: 'Type role specimens' })
    const rows = within(typeList).getAllByRole('listitem')
    expect(rows).toHaveLength(6)
  })

  it('renders a skin chip for every registry skin', () => {
    renderPage()
    const nav = screen.getByRole('navigation', { name: 'Skin switcher' })
    for (const s of allSkins) {
      expect(within(nav).getByRole('link', { name: new RegExp(s.label, 'i') })).toBeInTheDocument()
    }
  })

  it('marks the active skin chip with aria-current="true"', () => {
    renderPage()
    const nav = screen.getByRole('navigation', { name: 'Skin switcher' })
    // galenti is active (set in beforeEach)
    const galentiLink = within(nav).getByRole('link', { name: /galenti/i })
    expect(galentiLink).toHaveAttribute('aria-current', 'true')
  })

  it('has a play button', () => {
    renderPage()
    expect(screen.getByRole('button', { name: /play/i })).toBeInTheDocument()
  })
})
