import { useState } from 'react'
import { Nav } from './Nav'
import type { PaletteAction } from './palette'

export const galleryMeta = { slug: 'nav', title: 'Nav (shell + palette)' }

const BRAND = { label: 'J Galenti', href: '/' }

const NAV_ITEMS = [
  { label: 'Work', href: '/work', current: true },
  { label: 'Writing', href: '/writing' },
  { label: 'About', href: '/about' },
]

export default function NavGallery() {
  const [lastAction, setLastAction] = useState<string | null>(null)

  function record(label: string) {
    return () => setLastAction(label)
  }

  const actions: PaletteAction[] = [
    { id: 'go-home', label: 'Home', group: 'Navigate', perform: record('Home') },
    { id: 'go-work', label: 'Work', group: 'Navigate', perform: record('Work') },
    { id: 'go-writing', label: 'Writing', group: 'Navigate', perform: record('Writing') },
    { id: 'go-about', label: 'About', group: 'Navigate', perform: record('About') },
    {
      id: 'toggle-skin',
      label: 'Switch skin',
      group: 'Preferences',
      keywords: ['theme', 'color'],
      perform: record('Switch skin'),
    },
    {
      id: 'toggle-motion',
      label: 'Toggle reduced motion',
      group: 'Preferences',
      keywords: ['animation', 'accessibility', 'a11y'],
      perform: record('Toggle reduced motion'),
    },
    {
      id: 'copy-url',
      label: 'Copy current URL',
      group: 'Preferences',
      keywords: ['share', 'link'],
      perform: record('Copy current URL'),
    },
    {
      id: 'source',
      label: 'View source on GitHub',
      group: 'Navigate',
      keywords: ['code', 'repo'],
      perform: record('View source on GitHub'),
    },
  ]

  return (
    <div>
      <Nav brand={BRAND} items={NAV_ITEMS} actions={actions} />
      <div
        style={{
          padding: 'var(--space-6)',
          fontFamily: 'var(--type-mono-family)',
          fontSize: 'var(--type-mono-size)',
          color: 'var(--color-ink-muted)',
        }}
      >
        {lastAction === null
          ? 'Open the palette (⌘K or click "Search") and run a command — the result appears here.'
          : `Last action: ${lastAction}`}
      </div>
    </div>
  )
}
