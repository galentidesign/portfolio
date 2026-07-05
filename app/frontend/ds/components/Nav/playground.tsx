import type { PlaygroundHostProps } from '../playground'
import { Nav } from './Nav'
import type { PaletteAction } from './palette'

export const playgroundMeta = { slug: 'nav' }

// ── Self-contained demo data ────────────────────────────────────────────────
// Mirror the gallery's data shape so the stage shows a realistic shell bar.

const BRAND = { label: 'Portfolio', href: '/' }

const ITEMS = [
  { label: 'Work', href: '/work', current: true },
  { label: 'Writing', href: '/writing' },
  { label: 'About', href: '/about' },
] as const

const ACTIONS: readonly PaletteAction[] = [
  { id: 'go-home', label: 'Home', group: 'Navigate', perform: () => {} },
  { id: 'go-work', label: 'Work', group: 'Navigate', perform: () => {} },
  { id: 'go-writing', label: 'Writing', group: 'Navigate', perform: () => {} },
  { id: 'go-about', label: 'About', group: 'Navigate', perform: () => {} },
  {
    id: 'toggle-skin',
    label: 'Switch skin',
    group: 'Preferences',
    keywords: ['theme', 'color'],
    perform: () => {},
  },
]

// ── Host ─────────────────────────────────────────────────────────────────────

export default function NavPlayground({ values }: PlaygroundHostProps) {
  // brand, items, and actions are complex types — auto-skipped by the control
  // system; the host supplies them as self-contained demo data above.
  // skipTargetId and enableShortcut are manifest playground:false — the doc
  // page mounts a second Nav in its Variants demo, and only one Nav per page
  // may own the global ⌘K listener. The stage palette opens via its visible
  // trigger button instead. label stays controllable: it renames the nav
  // landmark live (the Variants demo uses "Demo shell" so the two stay unique).
  const { skipTargetId, label } = values as { skipTargetId?: string; label?: string }

  return (
    <div>
      <Nav
        brand={BRAND}
        items={ITEMS}
        actions={ACTIONS}
        skipTargetId={skipTargetId}
        enableShortcut={false}
        label={label}
      />
    </div>
  )
}

export function snippet(attrs: string): string {
  return `// demo data\n<Nav${attrs} brand={brand} items={items} actions={actions} />`
}
