import { Head } from '@inertiajs/react'
import { Badge } from '@/ds/components/Badge/Badge'
import { CodeBlock } from '@/ds/components/CodeBlock/CodeBlock'
import { DocShell, type SystemNavEntry } from '@/system/DocShell'
import { A11yNotes } from '@/system/A11yNotes'
import { Playground } from '@/system/Playground'
import { PropsTable } from '@/system/PropsTable'
import { TokenList } from '@/system/TokenList'
import { UsageNotes } from '@/system/UsageNotes'
import { galleryDemos } from '@/system/galleryDemos'
import { REPO_TREE_URL } from '@/system/links'
import type { ManifestEntry } from '@/system/manifest'
import { playgroundHosts } from '@/system/playgroundHosts'
import styles from './show.module.css'

export interface ShowProps {
  nav: SystemNavEntry[]
  entry: ManifestEntry
}

export default function Show({ nav, entry }: ShowProps) {
  const GalleryDemo = galleryDemos[entry.slug]
  const host = playgroundHosts[entry.slug]

  return (
    <>
      <Head title={`${entry.name} — Design System`} />
      <DocShell nav={nav}>
        <div data-component-doc={entry.slug} className={styles.doc}>
          {/* 1. Header ─────────────────────────────────────────────────── */}
          <header className={styles.header}>
            <h1 className={styles.title}>{entry.name}</h1>

            <div className={styles.badges}>
              <Badge tone={entry.tier === 'hero' ? 'accent' : 'neutral'}>{entry.tier}</Badge>
              {entry.status !== 'stable' && <Badge tone="caution">{entry.status}</Badge>}
            </div>

            <p className={styles.description}>{entry.description}</p>

            <div className={styles.links}>
              <a
                href={`${REPO_TREE_URL}/${entry.links.repo}`}
                target="_blank"
                rel="noreferrer"
                className={styles.link}
              >
                Source
              </a>
              {entry.links.figma !== null ? (
                <a
                  href={entry.links.figma}
                  target="_blank"
                  rel="noreferrer"
                  className={styles.link}
                >
                  Figma
                </a>
              ) : (
                <span className={styles['link-muted']}>Figma — library port lands at M7</span>
              )}
            </div>
          </header>

          {/* 2. Variants ──────────────────────────────────────────────── */}
          {GalleryDemo !== undefined && (
            <section aria-labelledby="section-variants" className={styles.section}>
              <h2 id="section-variants" className={styles['section-heading']}>
                Variants
              </h2>
              <div className={styles.demo}>
                <GalleryDemo />
              </div>
            </section>
          )}

          {/* 3. Playground — hero tier only ───────────────────────────── */}
          {host !== undefined && (
            <section aria-labelledby="section-playground" className={styles.section}>
              <h2 id="section-playground" className={styles['section-heading']}>
                Playground
              </h2>
              <Playground entry={entry} host={host} />
            </section>
          )}

          {/* 4. Props ─────────────────────────────────────────────────── */}
          <section aria-labelledby="section-props" className={styles.section}>
            <h2 id="section-props" className={styles['section-heading']}>
              Props
            </h2>
            <PropsTable props={entry.props} />
          </section>

          {/* 5. Tokens ────────────────────────────────────────────────── */}
          <section aria-labelledby="section-tokens" className={styles.section}>
            <h2 id="section-tokens" className={styles['section-heading']}>
              Tokens
            </h2>
            <TokenList tokens={entry.tokens} />
          </section>

          {/* 6. Accessibility ─────────────────────────────────────────── */}
          <section aria-labelledby="section-a11y" className={styles.section}>
            <h2 id="section-a11y" className={styles['section-heading']}>
              Accessibility
            </h2>
            <A11yNotes a11y={entry.a11y} />
          </section>

          {/* 7. Usage ─────────────────────────────────────────────────── */}
          <section aria-labelledby="section-usage" className={styles.section}>
            <h2 id="section-usage" className={styles['section-heading']}>
              Usage
            </h2>
            <UsageNotes usage={entry.usage} />
          </section>

          {/* 8. Code ──────────────────────────────────────────────────── */}
          <section aria-labelledby="section-code" className={styles.section}>
            <h2 id="section-code" className={styles['section-heading']}>
              Code
            </h2>
            <CodeBlock code={entry.example} label="Example" />
          </section>
        </div>
      </DocShell>
    </>
  )
}
