import type { ReactNode } from 'react'
import { render, screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import GalleryIndex from './index'
import type { ProjectCard } from '@/gallery/types'

// Head requires the Inertia runtime; rendered title covered by e2e.
vi.mock('@inertiajs/react', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@inertiajs/react')>()),
  Head: () => null,
}))

// useFx gates on the motion-pref context; pin the gate to reduced so the
// page renders its static base with no dynamic fx import (home test pattern).
vi.mock('@/ds/motion/useMotionPref', () => ({
  useMotionPref: () => ({ reduced: true, manualReduced: false, setManualReduced: vi.fn() }),
}))

vi.mock('@/ds/components/Card/Card', () => ({
  Card: ({ href, children }: { href?: string; children?: ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}))

const PROJECTS: ProjectCard[] = [
  {
    slug: 'featured-project',
    title: 'Featured project',
    client: 'Client A',
    year: '2021',
    role: 'Design lead',
    summary: 'A featured piece.',
    disciplines: ['UX', 'UI'],
    featured: true,
    cover: { src: '/gallery/featured-project/cover.png', alt: 'Featured cover', available: false },
  },
  {
    slug: 'standard-project',
    title: 'Standard project',
    client: 'Client B',
    year: '2019',
    role: 'Designer',
    summary: 'A standard piece.',
    disciplines: ['Brand'],
    featured: false,
    cover: { src: '/gallery/standard-project/cover.png', alt: 'Standard cover', available: false },
  },
]

describe('GalleryIndex', () => {
  it('renders a single h1 for the gallery', () => {
    render(<GalleryIndex projects={PROJECTS} />)
    const h1s = screen.getAllByRole('heading', { level: 1 })
    expect(h1s).toHaveLength(1)
    expect(h1s[0]).toHaveTextContent('Product & UX/UI design')
  })

  it('splits projects into Featured and All work bands', () => {
    render(<GalleryIndex projects={PROJECTS} />)
    const featured = screen.getByRole('list', { name: 'Featured' })
    expect(within(featured).getByText('Featured project')).toBeInTheDocument()
    const all = screen.getByRole('list', { name: 'All work' })
    expect(within(all).getByText('Standard project')).toBeInTheDocument()
  })

  it('links each tile to its project page', () => {
    render(<GalleryIndex projects={PROJECTS} />)
    const links = screen.getAllByRole('link')
    const hrefs = links.map((l) => l.getAttribute('href'))
    expect(hrefs).toContain('/gallery/featured-project')
    expect(hrefs).toContain('/gallery/standard-project')
  })

  it('omits a band when it has no projects', () => {
    render(<GalleryIndex projects={PROJECTS.filter((p) => p.featured)} />)
    expect(screen.getByRole('list', { name: 'Featured' })).toBeInTheDocument()
    expect(screen.queryByRole('list', { name: 'All work' })).not.toBeInTheDocument()
  })

  it('renders pending placeholders for unavailable covers', () => {
    render(<GalleryIndex projects={PROJECTS} />)
    expect(screen.getByRole('img', { name: 'Featured cover' })).toBeInTheDocument()
  })
})
