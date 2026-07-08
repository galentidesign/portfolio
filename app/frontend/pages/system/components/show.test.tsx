import type { ReactNode } from 'react'
import { render, screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { PlaygroundModule } from '@/ds/components/playground'
import { REPO_TREE_URL } from '@/system/links'
import type { ManifestEntry } from '@/system/manifest'
import Show from './show'

// ── Mocks ─────────────────────────────────────────────────────────────────

vi.mock('@inertiajs/react', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@inertiajs/react')>()),
  usePage: () => ({ url: '/system/components/button' }),
  Head: () => null,
  Link: ({
    href,
    children,
    className,
    'aria-current': ariaCurrent,
  }: {
    href: string
    children: ReactNode
    className?: string
    'aria-current'?: 'page'
  }) => (
    <a href={href} className={className} aria-current={ariaCurrent}>
      {children}
    </a>
  ),
}))

vi.mock('@/ds/components/SkinSwitcher/SkinSwitcher', () => ({
  SkinSwitcher: () => <div data-testid="skin-switcher" />,
}))

vi.mock('@/system/galleryDemos', () => ({
  galleryDemos: {
    button: () => <div data-testid="gallery-demo">Gallery demo</div>,
    badge: () => <div data-testid="gallery-demo-badge">Badge demo</div>,
  },
}))

vi.mock('@/system/playgroundHosts', () => {
  const fakeHost: PlaygroundModule = {
    playgroundMeta: { slug: 'button' },
    default: () => <div data-testid="playground-host">Host rendered</div>,
    snippet: (attrs: string) => `<Button${attrs}>Save</Button>`,
  }
  return {
    playgroundHosts: {
      button: fakeHost,
    } as Record<string, PlaygroundModule | undefined>,
  }
})

// ── Fixtures ──────────────────────────────────────────────────────────────

const NAV = [
  { slug: 'button', name: 'Button', tier: 'hero' as const },
  { slug: 'badge', name: 'Badge', tier: 'gallery' as const },
]

const HERO_ENTRY: ManifestEntry = {
  slug: 'button',
  name: 'Button',
  tier: 'hero',
  status: 'stable',
  description: 'Actions at three emphasis levels.',
  props: [
    {
      name: 'variant',
      type: "'primary' | 'secondary' | 'ghost'",
      default: "'primary'",
      description: 'Emphasis level.',
    },
    {
      name: 'busy',
      type: 'boolean',
      default: 'false',
      description: 'Shows a spinner.',
    },
    {
      // No default = required prop → em dash in the table
      name: 'href',
      type: 'string',
      description: 'Renders an anchor.',
    },
  ],
  tokens: ['--color-accent', '--color-focus'],
  a11y: {
    keyboard: [{ keys: 'Enter / Space', does: 'Activates the button.' }],
    aria: ['aria-busy set when busy.'],
    contrast: 'Uses accent-ink-on-accent pair.',
  },
  usage: {
    do: ['Use one primary per view.'],
    dont: ["Don't reach for ghost when it's the main event."],
  },
  example: '<Button variant="primary">Save</Button>',
  links: {
    repo: 'app/frontend/ds/components/Button',
    figma: null,
  },
}

const GALLERY_ENTRY: ManifestEntry = {
  slug: 'badge',
  name: 'Badge',
  tier: 'gallery',
  status: 'stable',
  description: 'Labels and status indicators.',
  props: [
    {
      name: 'tone',
      type: "'neutral' | 'accent'",
      default: "'neutral'",
      description: 'Color tone.',
    },
  ],
  tokens: ['--color-accent-muted'],
  a11y: { keyboard: [], aria: [], contrast: 'Passes WCAG.' },
  usage: { do: ['Use for status.'], dont: ["Don't overuse."] },
  example: '<Badge>New</Badge>',
  links: {
    repo: 'app/frontend/ds/components/Badge',
    figma: null,
  },
}

const DRAFT_ENTRY: ManifestEntry = {
  ...HERO_ENTRY,
  status: 'draft',
}

// ── Tests ─────────────────────────────────────────────────────────────────

describe('Show — hero entry', () => {
  it('renders the component name as h1', () => {
    render(<Show nav={NAV} entry={HERO_ENTRY} />)
    expect(screen.getByRole('heading', { level: 1, name: 'Button' })).toBeInTheDocument()
  })

  it('renders a tier badge', () => {
    render(<Show nav={NAV} entry={HERO_ENTRY} />)
    // Badge renders as <span> — look for text
    expect(screen.getByText('hero')).toBeInTheDocument()
  })

  it('does NOT render a status badge when status is stable', () => {
    render(<Show nav={NAV} entry={HERO_ENTRY} />)
    expect(screen.queryByText('stable')).not.toBeInTheDocument()
  })

  it('renders a status badge when status is draft', () => {
    render(<Show nav={NAV} entry={DRAFT_ENTRY} />)
    expect(screen.getByText('draft')).toBeInTheDocument()
  })

  it('renders the description', () => {
    render(<Show nav={NAV} entry={HERO_ENTRY} />)
    expect(screen.getByText('Actions at three emphasis levels.')).toBeInTheDocument()
  })

  it('renders the Source link pointing to the repo', () => {
    render(<Show nav={NAV} entry={HERO_ENTRY} />)
    const link = screen.getByRole('link', { name: 'Source' })
    expect(link).toHaveAttribute('href', `${REPO_TREE_URL}/app/frontend/ds/components/Button`)
    expect(link).toHaveAttribute('rel', 'noreferrer')
  })

  it('renders Figma placeholder text when figma is null', () => {
    render(<Show nav={NAV} entry={HERO_ENTRY} />)
    expect(screen.getByText('Figma — library port pending')).toBeInTheDocument()
    // Must never be a link (dead link rule)
    expect(screen.queryByRole('link', { name: /Figma/i })).not.toBeInTheDocument()
  })

  it('renders the Figma link when a URL is provided', () => {
    const entry = {
      ...HERO_ENTRY,
      links: { ...HERO_ENTRY.links, figma: 'https://www.figma.com/node/xyz' },
    }
    render(<Show nav={NAV} entry={entry} />)
    const link = screen.getByRole('link', { name: 'Figma' })
    expect(link).toHaveAttribute('href', 'https://www.figma.com/node/xyz')
    expect(link).toHaveAttribute('rel', 'noreferrer')
  })

  it('renders the hydration anchor with the component slug', () => {
    const { container } = render(<Show nav={NAV} entry={HERO_ENTRY} />)
    expect(container.querySelector('[data-component-doc="button"]')).toBeInTheDocument()
  })

  it('renders the Variants section with the gallery demo', () => {
    render(<Show nav={NAV} entry={HERO_ENTRY} />)
    expect(screen.getByRole('heading', { name: 'Variants' })).toBeInTheDocument()
    expect(screen.getByTestId('gallery-demo')).toBeInTheDocument()
  })

  it('renders the Playground section for a hero entry with a host', () => {
    render(<Show nav={NAV} entry={HERO_ENTRY} />)
    expect(screen.getByRole('heading', { name: 'Playground' })).toBeInTheDocument()
    expect(screen.getByTestId('playground-stage')).toBeInTheDocument()
  })

  it('renders the Props section with a table', () => {
    render(<Show nav={NAV} entry={HERO_ENTRY} />)
    expect(screen.getByRole('heading', { name: 'Props' })).toBeInTheDocument()
    expect(screen.getByRole('table', { name: 'Component props' })).toBeInTheDocument()
  })

  it('shows an em dash for required props (no default)', () => {
    render(<Show nav={NAV} entry={HERO_ENTRY} />)
    // 'href' has no default → em dash in Default column
    const table = screen.getByRole('table', { name: 'Component props' })
    const cells = within(table).getAllByRole('cell')
    const requiredCell = cells.find((c) => c.querySelector('[aria-label="required"]'))
    expect(requiredCell).toBeDefined()
  })

  it('renders prop names in the props table', () => {
    render(<Show nav={NAV} entry={HERO_ENTRY} />)
    const table = screen.getByRole('table', { name: 'Component props' })
    expect(within(table).getByText('variant')).toBeInTheDocument()
    expect(within(table).getByText('busy')).toBeInTheDocument()
    expect(within(table).getByText('href')).toBeInTheDocument()
  })

  it('renders the Tokens section', () => {
    render(<Show nav={NAV} entry={HERO_ENTRY} />)
    expect(screen.getByRole('heading', { name: 'Tokens' })).toBeInTheDocument()
    expect(screen.getByText('--color-accent')).toBeInTheDocument()
    expect(screen.getByText('--color-focus')).toBeInTheDocument()
  })

  it('renders the Accessibility section with keyboard table and aria notes', () => {
    render(<Show nav={NAV} entry={HERO_ENTRY} />)
    expect(screen.getByRole('heading', { name: 'Accessibility' })).toBeInTheDocument()
    expect(screen.getByText('Enter / Space')).toBeInTheDocument()
    expect(screen.getByText('Activates the button.')).toBeInTheDocument()
    expect(screen.getByText('aria-busy set when busy.')).toBeInTheDocument()
  })

  it("renders the Usage section with Do and Don't cards", () => {
    render(<Show nav={NAV} entry={HERO_ENTRY} />)
    expect(screen.getByRole('heading', { name: 'Usage' })).toBeInTheDocument()
    expect(screen.getByText('Do')).toBeInTheDocument()
    expect(screen.getByText("Don't")).toBeInTheDocument()
    expect(screen.getByText('Use one primary per view.')).toBeInTheDocument()
  })

  it('renders the Code section with the example CodeBlock', () => {
    render(<Show nav={NAV} entry={HERO_ENTRY} />)
    expect(screen.getByRole('heading', { name: 'Code' })).toBeInTheDocument()
    const pre = screen.getByRole('group', { name: 'Example' })
    expect(pre.textContent).toContain('<Button variant="primary">Save</Button>')
  })
})

describe('Show — gallery entry', () => {
  it('does NOT render the Playground section when no host exists', () => {
    render(<Show nav={NAV} entry={GALLERY_ENTRY} />)
    expect(screen.queryByRole('heading', { name: 'Playground' })).not.toBeInTheDocument()
    expect(screen.queryByTestId('playground-stage')).not.toBeInTheDocument()
  })

  it('renders all other sections', () => {
    render(<Show nav={NAV} entry={GALLERY_ENTRY} />)
    expect(screen.getByRole('heading', { name: 'Badge', level: 1 })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Variants' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Props' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Tokens' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Accessibility' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Usage' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Code' })).toBeInTheDocument()
  })

  it('renders a neutral tier badge for gallery components', () => {
    render(<Show nav={NAV} entry={GALLERY_ENTRY} />)
    expect(screen.getByText('gallery')).toBeInTheDocument()
  })

  it('renders the hydration anchor with the gallery slug', () => {
    const { container } = render(<Show nav={NAV} entry={GALLERY_ENTRY} />)
    expect(container.querySelector('[data-component-doc="badge"]')).toBeInTheDocument()
  })
})
