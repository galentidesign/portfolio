import { Head } from '@inertiajs/react'
import { Link } from '@inertiajs/react'
import { skins, defaultSkin, semanticTokens } from '@/ds/tokens/generated/skins'
import type { SystemNavEntry } from '@/system/DocShell'
import { DocShell } from '@/system/DocShell'
import { Badge } from '@/ds/components/Badge/Badge'
import styles from './skins.module.css'

// ── Types ──────────────────────────────────────────────────────────────────

interface Props {
  nav: SystemNavEntry[]
}

// ── Palette swatch tokens — a representative cross-section of semantic colors ──

const SWATCH_TOKENS: readonly string[] = [
  '--color-surface',
  '--color-surface-raised',
  '--color-surface-sunken',
  '--color-ink',
  '--color-ink-muted',
  '--color-accent',
  '--color-accent-muted',
  '--color-line',
  '--color-positive',
  '--color-caution',
  '--color-critical',
  '--color-focus',
] as const

// ── Component ──────────────────────────────────────────────────────────────

export default function SkinsPage({ nav }: Props) {
  const colorTokenCount = semanticTokens.color.length

  return (
    <>
      <Head title="Skins — J Galenti">
        <meta
          name="description"
          content="Every skin is one JSON file — the additive-skin rule, the era palettes, and the registry that re-themes the whole site."
        />
      </Head>
      <DocShell nav={nav}>
        <div className={styles.content}>
          <h1 className={styles.heading}>Skins</h1>
          <p className={styles.intro}>
            Adding a skin is one JSON file plus a rebuild — zero component edits. Every component
            consumes only semantic tokens (<code className={styles.code}>--color-*</code>,{' '}
            <code className={styles.code}>--radius-*</code>,{' '}
            <code className={styles.code}>--type-*</code>, etc.); the JSON binds those tokens to raw
            values. Currently {colorTokenCount} semantic color tokens across {skins.length} skin
            {skins.length !== 1 ? 's' : ''}.
          </p>

          {/* ── Skin list ── */}
          <section aria-labelledby="section-skins" className={styles.section}>
            <h2 id="section-skins" className={styles['section-heading']}>
              All skins
            </h2>

            <ul className={styles['skin-list']} aria-label="Skins">
              {skins.map((skin) => (
                <li key={skin.name} className={styles['skin-item']}>
                  {/* Scoped data-skin re-themes this subtree using generated CSS */}
                  <div className={styles['skin-card']} data-skin={skin.name}>
                    <div className={styles['skin-header']}>
                      <div className={styles['skin-meta']}>
                        <span className={styles['skin-name']}>{skin.label}</span>
                        <span className={styles['skin-era']}>{skin.era}</span>
                      </div>
                      <div className={styles['skin-badges']}>
                        {skin.default && (
                          <Badge tone="accent" size="sm">
                            default
                          </Badge>
                        )}
                        <Badge tone="neutral" size="sm">
                          {skin.colorScheme}
                        </Badge>
                      </div>
                    </div>

                    {skin.hidden && (
                      <p className={styles['skin-hidden-note']}>
                        Hidden from the switcher — CI torture skin
                      </p>
                    )}

                    <p className={styles['skin-desc']}>{skin.description}</p>

                    {/* Palette strip */}
                    <div
                      className={styles['palette-strip']}
                      role="list"
                      aria-label={`${skin.label} color palette`}
                    >
                      {SWATCH_TOKENS.map((token) => (
                        <div
                          key={token}
                          role="listitem"
                          className={styles.swatch}
                          style={{ backgroundColor: `var(${token})` }}
                          aria-label={token}
                          title={token}
                        />
                      ))}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          {/* ── Additive-skin contract ── */}
          <section aria-labelledby="section-contract" className={styles.section}>
            <h2 id="section-contract" className={styles['section-heading']}>
              Additive-skin contract
            </h2>

            <div className={styles.prose}>
              <p>
                The system enforces strict token discipline: components may only consume{' '}
                <em>semantic</em> tokens (<code className={styles.code}>--color-*</code>,{' '}
                <code className={styles.code}>--radius-*</code>,{' '}
                <code className={styles.code}>--type-*</code>,{' '}
                <code className={styles.code}>--density-*</code>,{' '}
                <code className={styles.code}>--motion-*</code>,{' '}
                <code className={styles.code}>--shadow-*</code>,{' '}
                <code className={styles.code}>--space-*</code>,{' '}
                <code className={styles.code}>--z-*</code>). Raw primitives — those whose names
                start with the <code className={styles.code}>--raw</code> prefix — live only inside
                skin CSS files.
              </p>
              <p>
                Adding a skin means creating one <code className={styles.code}>*.tokens.json</code>{' '}
                file in <code className={styles.code}>ds/tokens/</code>, running{' '}
                <code className={styles.code}>npm run tokens:build</code>, and every component
                re-themes itself — no JSX edits, no CSS edits. The palettes below are rendered
                side-by-side by scoping{' '}
                <code className={styles.code}>data-skin=&apos;name&apos;</code> on wrapper divs: the
                generated CSS <code className={styles.code}>[data-skin=&apos;name&apos;]</code>{' '}
                selector applies to any element, not just{' '}
                <code className={styles.code}>&lt;html&gt;</code>.
              </p>
              <p>
                Rails-era multi-skin support (serving different skins per user or A/B segment) lands
                at M6. See the{' '}
                <Link href="/system/tokens" className={styles['prose-link']}>
                  Tokens
                </Link>{' '}
                page for the full token catalog.
              </p>
            </div>
          </section>

          {/* ── Footer ── */}
          <footer className={styles.footer}>
            <p className={styles['footer-note']}>
              Default skin: <strong className={styles['footer-strong']}>{defaultSkin.label}</strong>
            </p>
          </footer>
        </div>
      </DocShell>
    </>
  )
}
