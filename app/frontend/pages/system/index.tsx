import { Head, Link } from '@inertiajs/react'
import type { SystemNavEntry } from '@/system/DocShell'
import { DocShell } from '@/system/DocShell'
import { Badge } from '@/ds/components/Badge/Badge'
import { Card } from '@/ds/components/Card/Card'
import { REPO_URL, FIGMA_LIBRARY_URL } from '@/system/links'
import styles from './index.module.css'

// ── Types ──────────────────────────────────────────────────────────────────

export interface ComponentEntry {
  slug: string
  name: string
  tier: 'hero' | 'gallery'
  status: 'draft' | 'stable'
  description: string
}

interface Props {
  nav: SystemNavEntry[]
  components: ComponentEntry[]
}

// ── Component ──────────────────────────────────────────────────────────────

export default function SystemIndex({ nav, components }: Props) {
  const heroes = components.filter((c) => c.tier === 'hero')
  const gallery = components.filter((c) => c.tier === 'gallery')

  return (
    <>
      <Head title="Design System — J Galenti">
        <meta
          name="description"
          content="The design system: 16 components documented from a single manifest — tokens, motion, skins, and live playgrounds."
        />
      </Head>
      <DocShell nav={nav}>
        <div className={styles.content}>
          <h1 className={styles.heading}>Design system</h1>
          <p className={styles.intro}>
            Token-compiled. Built a11y-first. Agent-built in public. Every color, radius, easing,
            and shadow compiles from one JSON file per skin — swap the file, rebuild, and the entire
            system re-themes itself.
          </p>

          {/* ── System page tiles ── */}
          <nav aria-label="System sections" className={styles.tiles}>
            <Link href="/system/tokens" className={styles.tile}>
              Tokens
            </Link>
            <Link href="/system/motion" className={styles.tile}>
              Motion
            </Link>
            <Link href="/system/skins" className={styles.tile}>
              Skins
            </Link>
          </nav>

          {/* ── Hero components ── */}
          {heroes.length > 0 && (
            <section aria-labelledby="section-hero" className={styles.section}>
              <h2 id="section-hero" className={styles['section-heading']}>
                Hero
              </h2>
              <ul className={styles.grid} aria-label="Hero components">
                {heroes.map((c) => (
                  <li key={c.slug}>
                    <ComponentCard component={c} />
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* ── Gallery components ── */}
          {gallery.length > 0 && (
            <section aria-labelledby="section-gallery" className={styles.section}>
              <h2 id="section-gallery" className={styles['section-heading']}>
                Gallery
              </h2>
              <ul className={styles.grid} aria-label="Gallery components">
                {gallery.map((c) => (
                  <li key={c.slug}>
                    <ComponentCard component={c} />
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* ── External links ── */}
          <footer className={styles.footer}>
            <a href={REPO_URL} className={styles['footer-link']} rel="noreferrer" target="_blank">
              GitHub repo
            </a>
            <a
              href={FIGMA_LIBRARY_URL}
              className={styles['footer-link']}
              rel="noreferrer"
              target="_blank"
            >
              Figma library
            </a>
          </footer>
        </div>
      </DocShell>
    </>
  )
}

// ── ComponentCard ──────────────────────────────────────────────────────────

function ComponentCard({ component: c }: { component: ComponentEntry }) {
  return (
    <Card href={`/system/components/${c.slug}`}>
      <div className={styles['card-body']}>
        <div className={styles['card-row']}>
          <span className={styles['card-name']}>{c.name}</span>
          <div className={styles['card-badges']}>
            <Badge tone="neutral" size="sm">
              {c.tier}
            </Badge>
            {c.status !== 'stable' && (
              <Badge tone="caution" size="sm">
                {c.status}
              </Badge>
            )}
          </div>
        </div>
        <p className={styles['card-desc']}>{c.description}</p>
      </div>
    </Card>
  )
}
