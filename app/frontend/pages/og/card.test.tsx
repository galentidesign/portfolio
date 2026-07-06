import { render, screen, act } from '@testing-library/react'
import { describe, expect, it, afterEach } from 'vitest'
import OgCard from './card'

// ── Helpers ────────────────────────────────────────────────────────────────

function renderCard(overrides: Partial<{ title: string; subtitle: string }> = {}) {
  return render(
    <OgCard
      ogKey="home"
      title={overrides.title ?? 'J Galenti'}
      subtitle={overrides.subtitle ?? 'Token systems. Production code. Agentic playbook.'}
      skin="galenti"
    />,
  )
}

// ── Static content ─────────────────────────────────────────────────────────

describe('OgCard static content', () => {
  it('renders the title', () => {
    renderCard()
    expect(screen.getByRole('heading', { name: 'J Galenti' })).toBeInTheDocument()
  })

  it('renders the subtitle', () => {
    renderCard()
    expect(
      screen.getByText('Token systems. Production code. Agentic playbook.'),
    ).toBeInTheDocument()
  })

  it('renders the wordmark', () => {
    renderCard()
    expect(screen.getByText('jgalenti.com')).toBeInTheDocument()
  })

  it('renders the title supplied via props', () => {
    renderCard({ title: 'The Rails era' })
    expect(screen.getByRole('heading', { name: 'The Rails era' })).toBeInTheDocument()
  })
})

// ── Layout export ──────────────────────────────────────────────────────────

describe('OgCard layout opt-out', () => {
  // The Inertia resolver reads `page.default.layout` — the null must live ON
  // the default export. A named `export const layout` passes a naive check
  // while the shell silently wraps the card (the first generated screenshots
  // carried the site Nav).
  it('attaches layout = null to the default export (bare page, no site shell)', () => {
    expect(OgCard.layout).toBeNull()
  })
})

// ── data-og-ready ──────────────────────────────────────────────────────────

describe('OgCard data-og-ready', () => {
  // Save and restore document.fonts around each test that mocks it.
  let originalFontsDescriptor: PropertyDescriptor | undefined

  afterEach(() => {
    if (originalFontsDescriptor !== undefined) {
      Object.defineProperty(document, 'fonts', originalFontsDescriptor)
      originalFontsDescriptor = undefined
    }
  })

  it('sets data-og-ready="true" on the stage element after fonts.ready resolves', async () => {
    let resolveReady!: () => void
    const fontsReady = new Promise<void>((r) => {
      resolveReady = r
    })

    originalFontsDescriptor = Object.getOwnPropertyDescriptor(document, 'fonts')
    Object.defineProperty(document, 'fonts', {
      value: { ready: fontsReady } as unknown as FontFaceSet,
      configurable: true,
      writable: true,
    })

    const { container } = renderCard()

    // Attribute is absent before the promise resolves.
    expect(container.querySelector('[data-og-ready]')).not.toBeInTheDocument()

    // Resolve fonts.ready and flush microtasks + React effects.
    await act(async () => {
      resolveReady()
      await fontsReady
    })

    // Stage element now carries the ready signal.
    expect(container.querySelector('[data-og-ready="true"]')).toBeInTheDocument()
  })

  it('does not set data-og-ready before fonts.ready resolves', async () => {
    // A promise that never resolves for this test's lifetime.
    const fontsReady = new Promise<void>(() => {})

    originalFontsDescriptor = Object.getOwnPropertyDescriptor(document, 'fonts')
    Object.defineProperty(document, 'fonts', {
      value: { ready: fontsReady } as unknown as FontFaceSet,
      configurable: true,
      writable: true,
    })

    const { container } = renderCard()

    expect(container.querySelector('[data-og-ready]')).not.toBeInTheDocument()
  })
})
