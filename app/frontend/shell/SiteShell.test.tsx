import { act, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { ReactNode } from 'react'
import { buildSiteActions } from '@/shell/actions'
import { SiteShell } from './SiteShell'
import { SkinProvider } from './skin/SkinProvider'
import { MODE_STORAGE_KEY } from './mode/useMode'

// ── Mocks ────────────────────────────────────────────────────────────────────

// Mutable URL used by the usePage mock — update before each render.
let mockUrl = '/'

vi.mock('@inertiajs/react', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@inertiajs/react')>()),
  usePage: () => ({ url: mockUrl }),
  Link: ({
    href,
    children,
    className,
    'data-testid': testId,
  }: {
    href: string
    children: ReactNode
    className?: string
    'data-testid'?: string
  }) => (
    <a href={href} className={className} data-testid={testId}>
      {children}
    </a>
  ),
  router: { visit: vi.fn() },
}))

// Isolate SiteShell from the placeholder implementation — the real
// buildSiteActions arrives from a separate agent and is not under test here.
vi.mock('@/shell/actions', () => ({
  buildSiteActions: vi.fn(() => []),
}))

// Nav carries its own suite; mock it to keep SiteShell tests focused.
vi.mock('@/ds/components/Nav/Nav', () => ({
  Nav: () => <header data-testid="nav" />,
}))

// ── Helpers ──────────────────────────────────────────────────────────────────

function renderShell(url = '/', children: ReactNode = <main id="main" />) {
  mockUrl = url
  return render(
    <SkinProvider>
      <SiteShell>{children}</SiteShell>
    </SkinProvider>,
  )
}

// ── Setup / teardown ─────────────────────────────────────────────────────────

beforeEach(() => {
  mockUrl = '/'
  localStorage.clear()
  delete document.documentElement.dataset.skin
  vi.mocked(buildSiteActions).mockImplementation(() => [])
})

afterEach(() => {
  localStorage.clear()
  delete document.documentElement.dataset.skin
})

// ── Tests ────────────────────────────────────────────────────────────────────

describe('SiteShell — escape hatch visibility', () => {
  it('renders the hatch on the home page "/"', () => {
    renderShell('/')
    expect(screen.getByTestId('escape-hatch')).toBeInTheDocument()
  })

  it('renders the hatch on a story chapter "/story/rails-era"', () => {
    renderShell('/story/rails-era')
    expect(screen.getByTestId('escape-hatch')).toBeInTheDocument()
  })

  it('renders the hatch on "/story/agentic"', () => {
    renderShell('/story/agentic')
    expect(screen.getByTestId('escape-hatch')).toBeInTheDocument()
  })

  it('does not render the hatch on "/work"', () => {
    renderShell('/work')
    expect(screen.queryByTestId('escape-hatch')).not.toBeInTheDocument()
  })

  it('does not render the hatch on "/work/agentic-design-ops"', () => {
    renderShell('/work/agentic-design-ops')
    expect(screen.queryByTestId('escape-hatch')).not.toBeInTheDocument()
  })

  it('does not render the hatch on "/system"', () => {
    renderShell('/system')
    expect(screen.queryByTestId('escape-hatch')).not.toBeInTheDocument()
  })

  it('does not render the hatch on "/resume"', () => {
    renderShell('/resume')
    expect(screen.queryByTestId('escape-hatch')).not.toBeInTheDocument()
  })

  it('hatch links to "/work"', () => {
    renderShell('/')
    expect(screen.getByTestId('escape-hatch')).toHaveAttribute('href', '/work')
  })
})

describe('SiteShell — hatch label', () => {
  it('shows "Skip to the work →" when no stored mode', () => {
    renderShell('/')
    expect(screen.getByTestId('escape-hatch')).toHaveTextContent('Skip to the work →')
  })

  it('shows "Continue to the work →" when stored mode is "skim" at mount', () => {
    localStorage.setItem(MODE_STORAGE_KEY, 'skim')
    renderShell('/')
    expect(screen.getByTestId('escape-hatch')).toHaveTextContent('Continue to the work →')
  })

  it('shows "Skip to the work →" when stored mode is "story" (not skim)', () => {
    localStorage.setItem(MODE_STORAGE_KEY, 'story')
    renderShell('/')
    expect(screen.getByTestId('escape-hatch')).toHaveTextContent('Skip to the work →')
  })
})

describe('SiteShell — toast host', () => {
  it('does not render the toast wrapper before notify is called', () => {
    renderShell('/')
    expect(screen.queryByTestId('shell-toast')).not.toBeInTheDocument()
  })

  it('renders the toast wrapper with the message when notify is called', () => {
    let capturedNotify: ((msg: string) => void) | undefined
    vi.mocked(buildSiteActions).mockImplementation(({ notify }) => {
      capturedNotify = notify
      return []
    })

    renderShell('/')

    expect(capturedNotify).toBeDefined()

    act(() => {
      capturedNotify!('Email copied — test@example.com')
    })

    expect(screen.getByTestId('shell-toast')).toBeInTheDocument()
    expect(screen.getByText('Email copied — test@example.com')).toBeInTheDocument()
  })

  it('hides the toast wrapper after onDismiss fires', () => {
    let capturedNotify: ((msg: string) => void) | undefined
    vi.mocked(buildSiteActions).mockImplementation(({ notify }) => {
      capturedNotify = notify
      return []
    })

    renderShell('/')

    act(() => {
      capturedNotify!('hello')
    })
    expect(screen.getByTestId('shell-toast')).toBeInTheDocument()

    // Dismiss via the button rendered by Toast
    act(() => {
      screen.getByRole('button', { name: 'Dismiss' }).click()
    })

    expect(screen.queryByTestId('shell-toast')).not.toBeInTheDocument()
  })
})
