import { render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import type { ReactNode } from 'react'
import { MotionPrefProvider } from '@/ds/motion/useMotionPref'
import type { ProjectCard } from '@/gallery/types'
import { RailsBeat } from './RailsBeat'
import { ReactBeat } from './ReactBeat'
import { AgenticBeat } from './AgenticBeat'
import { WordmarkBeat } from './WordmarkBeat'
import { WorkBeat } from './WorkBeat'
import { CloseBeat } from './CloseBeat'
import { IslandMount } from './IslandMount'

function renderBeat(ui: ReactNode) {
  return render(<MotionPrefProvider>{ui}</MotionPrefProvider>)
}

beforeEach(() => {
  // Static base determinism — beats must be complete without motion.
  document.documentElement.dataset.motion = 'reduced'
})

afterEach(() => {
  delete document.documentElement.dataset.motion
})

describe('RailsBeat (03)', () => {
  it('renders the era heading, deep-dive door, and the shared artifact', async () => {
    const { container } = renderBeat(<RailsBeat />)
    expect(screen.getByRole('heading', { level: 2, name: 'The Rails era' })).toBeInTheDocument()
    expect(container.querySelector('a[href="/story/rails-era"]')).not.toBeNull()
    // Lazy island lands after IslandMount's idle slot.
    await waitFor(() => expect(screen.getByTestId('artifact-exhibit')).toBeInTheDocument())
    expect(screen.getByText(/re-tokened by one JSON file/)).toBeInTheDocument()
  })
})

describe('ReactBeat (04)', () => {
  it('renders the era heading, deep-dive door, and the component sheet', async () => {
    const { container } = renderBeat(<ReactBeat />)
    expect(screen.getByRole('heading', { level: 2, name: 'The React era' })).toBeInTheDocument()
    expect(container.querySelector('a[href="/story/react-era"]')).not.toBeNull()
    await waitFor(() => expect(screen.getByTestId('react-artifact')).toBeInTheDocument())
  })
})

describe('AgenticBeat (05)', () => {
  it('renders the night-zone kiln island with the receipts tick', async () => {
    const { container } = renderBeat(<AgenticBeat />)
    expect(screen.getByRole('heading', { level: 2, name: 'The agentic era' })).toBeInTheDocument()
    expect(container.querySelector('a[href="/story/agentic"]')).not.toBeNull()
    const island = container.querySelector('[data-zone="night"]')
    expect(island).not.toBeNull()
    await waitFor(() => expect(screen.getByTestId('kiln-interior')).toBeInTheDocument())
    // Static base carries the full tick — derived from the real receipt data.
    expect(screen.getByText(/session live — the kiln/)).toBeInTheDocument()
    expect(screen.getByText(/sessions ·/)).toBeInTheDocument()
    expect(container.querySelectorAll('[data-kiln-line]').length).toBe(3)
  })
})

describe('WordmarkBeat (06)', () => {
  it('renders the viewport wordmark as an accessible image with per-glyph spans', () => {
    const { container } = renderBeat(<WordmarkBeat />)
    expect(screen.getByRole('img', { name: 'Galenti' })).toBeInTheDocument()
    expect(container.querySelectorAll('[data-glyph]').length).toBe('GALENTI'.length)
  })
})

describe('WorkBeat (07)', () => {
  const band: ProjectCard[] = [
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
    {
      slug: 'beta',
      title: 'Beta project',
      role: 'Design',
      client: 'Fictional',
      year: '2022',
      featured: false,
      disciplines: ['visual'],
      summary: 'Another.',
      cover: null,
    },
  ]

  it('is the hatch landing target and links both studies', () => {
    const { container } = renderBeat(<WorkBeat />)
    const section = container.querySelector('#the-work')
    expect(section).not.toBeNull()
    expect(section).toHaveAttribute('tabindex', '-1')
    expect(container.querySelector('a[href="/work/agentic-design-ops"]')).not.toBeNull()
    expect(container.querySelector('a[href="/work/shadcn-to-polaris"]')).not.toBeNull()
    expect(container.querySelector('a[href="/work"]')).not.toBeNull()
  })

  it('renders the gallery band from props, placeholder-aware', () => {
    const { container } = renderBeat(<WorkBeat galleryBand={band} />)
    expect(screen.getByTestId('gallery-band')).toBeInTheDocument()
    expect(container.querySelector('a[href="/gallery/alpha"]')).not.toBeNull()
    expect(container.querySelector('a[href="/gallery"]')).not.toBeNull()
  })

  it('falls back to a quiet gallery link without band props', () => {
    const { container } = renderBeat(<WorkBeat />)
    expect(screen.getByTestId('gallery-band-fallback')).toBeInTheDocument()
    expect(container.querySelector('a[href="/gallery"]')).not.toBeNull()
  })
})

describe('CloseBeat (08)', () => {
  it('renders the system door, résumé, and contact — quiet', () => {
    const { container } = renderBeat(<CloseBeat />)
    expect(container.querySelector('a[href="/system"]')).not.toBeNull()
    expect(container.querySelector('a[href="/resume"]')).not.toBeNull()
    expect(container.querySelector('a[href^="mailto:"]')).not.toBeNull()
    // The skin count is derived from the registry, never hardcoded.
    expect(screen.getByText(/skins · zero axe violations/)).toBeInTheDocument()
  })
})

describe('IslandMount', () => {
  it('defers children to the load+idle slot, then mounts them', async () => {
    renderBeat(
      <IslandMount placeholderHeight="10rem">
        <p>island content</p>
      </IslandMount>,
    )
    // Idle deferral (jsdom takes whenIdle's setTimeout fallback).
    expect(screen.queryByText('island content')).toBeNull()
    await waitFor(() => expect(screen.getByText('island content')).toBeInTheDocument())
  })
})
