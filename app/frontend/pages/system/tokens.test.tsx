import type { ReactNode } from 'react'
import { render, screen, within } from '@testing-library/react'
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest'
import { SkinProvider } from '@/shell/skin/SkinProvider'
import { MotionPrefProvider } from '@/ds/motion/useMotionPref'
import { skins as allSkins, semanticTokens } from '@/ds/tokens/generated/skins'
import type { SystemNavEntry } from '@/system/DocShell'
import TokensPage from './tokens'

// Head requires the Inertia runtime; covered by e2e.
vi.mock('@inertiajs/react', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@inertiajs/react')>()),
  Head: () => null,
}))

// DocShell wraps content in sidebar + main; mock it to render children in main
// so all the specimen queries work without the full shell dependency graph.
vi.mock('@/system/DocShell', () => ({
  DocShell: ({ children }: { children: ReactNode }) => <main>{children}</main>,
}))

// SkinSwitcher is rendered by the real DocShell; it has its own suite.
vi.mock('@/ds/components/SkinSwitcher/SkinSwitcher', () => ({
  SkinSwitcher: () => <div data-testid="skin-switcher" />,
}))

const nav: SystemNavEntry[] = [
  { slug: 'button', name: 'Button', tier: 'hero' },
  { slug: 'badge', name: 'Badge / Tag', tier: 'gallery' },
]

function renderPage() {
  return render(
    <SkinProvider>
      <MotionPrefProvider>
        <TokensPage nav={nav} />
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

  it('shows the active skin label in the meta paragraph', () => {
    renderPage()
    const galentiMeta = allSkins.find((s) => s.name === 'galenti')!
    expect(screen.getByText(galentiMeta.label)).toBeInTheDocument()
  })

  it('has a play button', () => {
    renderPage()
    expect(screen.getByRole('button', { name: /play/i })).toBeInTheDocument()
  })
})
