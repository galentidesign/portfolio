import type { ReactNode } from 'react'
import { Link, usePage } from '@inertiajs/react'
import { SkinSwitcher } from '@/ds/components/SkinSwitcher/SkinSwitcher'
import styles from './docShell.module.css'

// Shared layout for every /system page. The component nav arrives as the
// Inertia `nav` prop (shared by SystemController) — the sidebar is a pure
// function of the manifest, so deleting a manifest YAML removes the entry.

export interface SystemNavEntry {
  slug: string
  name: string
  tier: 'hero' | 'gallery'
}

export interface DocShellProps {
  nav: SystemNavEntry[]
  children: ReactNode
}

const SYSTEM_PAGES = [
  { href: '/system', label: 'Overview' },
  { href: '/system/tokens', label: 'Tokens' },
  { href: '/system/motion', label: 'Motion' },
  { href: '/system/skins', label: 'Skins' },
]

function NavLink({ href, label }: { href: string; label: string }) {
  const path = usePage().url.split('?')[0]
  return (
    <Link
      href={href}
      className={styles['nav-link']}
      aria-current={path === href ? 'page' : undefined}
    >
      {label}
    </Link>
  )
}

export function DocShell({ nav, children }: DocShellProps) {
  const heroes = nav.filter((entry) => entry.tier === 'hero')
  const gallery = nav.filter((entry) => entry.tier === 'gallery')

  return (
    <div className={styles.shell}>
      <a className={styles['skip-link']} href="#main">
        Skip to content
      </a>

      <aside className={styles.sidebar}>
        <header className={styles['sidebar-header']}>
          <Link href="/system" className={styles.wordmark}>
            Design system
          </Link>
          <SkinSwitcher />
        </header>

        <nav aria-label="Design system" className={styles.nav}>
          <ul className={styles['nav-list']}>
            {SYSTEM_PAGES.map(({ href, label }) => (
              <li key={href}>
                <NavLink href={href} label={label} />
              </li>
            ))}
          </ul>

          <span className={styles['nav-group-label']} id="system-nav-hero">
            Hero
          </span>
          <ul aria-labelledby="system-nav-hero" className={styles['nav-list']}>
            {heroes.map(({ slug, name }) => (
              <li key={slug}>
                <NavLink href={`/system/components/${slug}`} label={name} />
              </li>
            ))}
          </ul>

          <span className={styles['nav-group-label']} id="system-nav-gallery">
            Gallery
          </span>
          <ul aria-labelledby="system-nav-gallery" className={styles['nav-list']}>
            {gallery.map(({ slug, name }) => (
              <li key={slug}>
                <NavLink href={`/system/components/${slug}`} label={name} />
              </li>
            ))}
          </ul>
        </nav>
      </aside>

      <main className={styles.main} id="main">
        {children}
      </main>
    </div>
  )
}
