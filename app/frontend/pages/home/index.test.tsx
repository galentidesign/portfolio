import type { ReactNode } from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { SkinProvider } from '@/shell/skin/SkinProvider'
import type { ProjectCard } from '@/gallery/types'
import Home from './index'

// Head and Link require the Inertia runtime; rendered title/navigation covered
// by e2e. Card renders links as native <a> elements — no mock needed.
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

// The assembly opening and the scroll ladder need the motion-pref context;
// pin the gate to reduced so the page renders its static base with no
// dynamic imports.
vi.mock('@/ds/motion/useMotionPref', () => ({
  useMotionPref: () => ({ reduced: true, manualReduced: false, setManualReduced: vi.fn() }),
}))

function renderHome(props?: { galleryBand?: ProjectCard[] }) {
  return render(
    <SkinProvider>
      <Home {...props} />
    </SkinProvider>,
  )
}

// ---------------------------------------------------------------------------
// Beat 00 — liftoff thesis + the hero h1 (assembly)
// ---------------------------------------------------------------------------

describe('Home liftoff and hero', () => {
  it('renders the full thesis statement in the static base (frame one)', () => {
    renderHome()
    expect(screen.getByTestId('thesis')).toHaveTextContent(
      'Design technologist — I architect enterprise-scale design systems',
    )
  })

  it('renders the J Galenti h1 (assembly opening, untouched)', () => {
    renderHome()
    expect(screen.getByRole('heading', { level: 1, name: 'J Galenti' })).toBeInTheDocument()
  })

  it('keeps the liftoff thesis a paragraph — the h1 stays with the assembly', () => {
    renderHome()
    expect(screen.getByTestId('thesis').tagName).toBe('P')
  })
})

// ---------------------------------------------------------------------------
// Nine-beat structure and order
// ---------------------------------------------------------------------------

describe('Home nine-beat structure', () => {
  it('renders the beats in storyboard order (below-fold beats land at idle)', async () => {
    const { container } = renderHome()
    await waitFor(() => expect(container.querySelector('#era-agentic')).not.toBeNull())
    const ids = [
      '[data-testid="liftoff"]',
      '[data-testid="assembly-opening"]',
      '#gateway',
      '#era-rails',
      '#era-react',
      '#era-agentic',
      '#the-work',
    ]
    const nodes = ids.map((sel) => container.querySelector(sel))
    nodes.forEach((node, i) => expect(node, ids[i]).not.toBeNull())
    for (let i = 0; i < nodes.length - 1; i++) {
      expect(
        nodes[i]!.compareDocumentPosition(nodes[i + 1]!) & Node.DOCUMENT_POSITION_FOLLOWING,
        `${ids[i]} precedes ${ids[i + 1]}`,
      ).toBeTruthy()
    }
  })

  it('places four scroll-retheme boundaries along the ladder', () => {
    renderHome()
    const markers = screen.getAllByTestId('scroll-retheme')
    expect(markers).toHaveLength(4)
    expect(markers[0]).toHaveAttribute('data-era-skin', 'rails-era')
    expect(markers[1]).toHaveAttribute('data-era-skin', 'react-era')
    expect(markers[2]).toHaveAttribute('data-era-skin', 'agentic')
    // The sweep-home boundary grounds on the story's base skin.
    expect(markers[3]).toHaveAttribute('data-era-skin', 'galenti')
  })

  it('mounts the prologue beat between the opening and the era beats', () => {
    renderHome()
    expect(screen.getByTestId('prologue-beat')).toBeInTheDocument()
    expect(screen.getByText(/Prologue · 2004–2013/)).toBeInTheDocument()
  })
})

// ---------------------------------------------------------------------------
// Chapter deep-dive doors (the three era links survive the gateway)
// ---------------------------------------------------------------------------

describe('Home chapter deep-dives', () => {
  it('links each era beat to its chapter route — exactly three doors', async () => {
    const { container } = renderHome()
    const hrefs = ['/story/rails-era', '/story/react-era', '/story/agentic']
    for (const href of hrefs) {
      await waitFor(() => expect(container.querySelectorAll(`a[href="${href}"]`)).toHaveLength(1))
    }
  })
})

// ---------------------------------------------------------------------------
// Skim path targets
// ---------------------------------------------------------------------------

describe('Home skim path', () => {
  it('keeps the skip control and its #gateway landing target focusable', () => {
    const { container } = renderHome()
    expect(screen.getByTestId('skip-intro')).toBeInTheDocument()
    const gateway = container.querySelector('#gateway')
    expect(gateway).not.toBeNull()
    expect(gateway).toHaveAttribute('tabindex', '-1')
  })

  it('gives the hatch its #the-work landing target', () => {
    const { container } = renderHome()
    const work = container.querySelector('#the-work')
    expect(work).not.toBeNull()
    expect(work).toHaveAttribute('tabindex', '-1')
  })
})

// ---------------------------------------------------------------------------
// Gallery band props
// ---------------------------------------------------------------------------

describe('Home gallery band', () => {
  it('threads galleryBand into the work beat', () => {
    renderHome({
      galleryBand: [
        {
          slug: 'alpha',
          title: 'Alpha project',
          role: 'Design',
          client: 'Fictional',
          year: '2021',
          featured: true,
          disciplines: ['product'],
          summary: 'A summary.',
          cover: { src: '/gallery/alpha/cover.png', alt: 'Alpha cover', available: false },
        },
      ],
    })
    expect(screen.getByTestId('gallery-band')).toBeInTheDocument()
  })

  it('falls back to the quiet gallery link without props', () => {
    renderHome()
    expect(screen.getByTestId('gallery-band-fallback')).toBeInTheDocument()
  })
})

// ---------------------------------------------------------------------------
// Accessibility landmarks
// ---------------------------------------------------------------------------

describe('Home accessibility', () => {
  it('wraps content in a <main id="main"> landmark', () => {
    const { container } = renderHome()
    expect(container.querySelector('main#main')).toBeInTheDocument()
  })

  it('labels every era beat section with its heading', async () => {
    const { container } = renderHome()
    for (const id of ['era-rails', 'era-react', 'era-agentic']) {
      await waitFor(() =>
        expect(container.querySelector(`#${id}`)).toHaveAttribute(
          'aria-labelledby',
          `${id}-heading`,
        ),
      )
    }
  })
})
