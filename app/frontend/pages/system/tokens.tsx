import { useState } from 'react'
import { Head } from '@inertiajs/react'
import {
  skins as allSkins,
  semanticTokens,
  baseTokens,
  breakpoints,
  zoneNames,
  zoneTokens,
} from '@/ds/tokens/generated/skins'
import type { SystemNavEntry } from '@/system/DocShell'
import { DocShell } from '@/system/DocShell'
import { useSkin } from '@/shell/skin/SkinProvider'
import { useMotionPref } from '@/ds/motion/useMotionPref'
import styles from './tokens.module.css'

// ── Helpers ────────────────────────────────────────────────────────────────

/**
 * Derive the type role names from the semanticTokens.type list.
 * e.g. '--type-display-family' → 'display'
 */
function deriveTypeRoles(typeTokens: readonly string[]): string[] {
  const seen = new Set<string>()
  const roles: string[] = []
  for (const t of typeTokens) {
    const withoutPrefix = t.replace(/^--type-/, '')
    const parts = withoutPrefix.split('-')
    // last part is the attr (family/size/weight/line/tracking)
    const role = parts.slice(0, -1).join('-')
    if (!seen.has(role)) {
      seen.add(role)
      roles.push(role)
    }
  }
  return roles
}

/**
 * For a given color token name (without '--color-' prefix), return the figure
 * token name (also without prefix) to display ON it, or null for a bare swatch.
 *
 * Rules:
 * - Starts with 'surface' → figure is 'ink'
 * - Ends with '-surface' and stem exists → figure is stem
 * - Has a corresponding '<name>-ink' token → figure is '<name>-ink'
 * - Otherwise → null (bare swatch)
 */
function deriveFigure(name: string, colorNames: readonly string[]): string | null {
  if (name === 'surface' || name.startsWith('surface-')) {
    return 'ink'
  }
  if (name.endsWith('-surface')) {
    const stem = name.slice(0, -8)
    if (colorNames.includes(stem)) return stem
  }
  if (colorNames.includes(name + '-ink')) {
    return name + '-ink'
  }
  return null
}

function durationLabel(token: string): string {
  return token.replace('--motion-duration-', '')
}

// ── Component ──────────────────────────────────────────────────────────────

interface Props {
  nav: SystemNavEntry[]
}

export default function TokensPage({ nav }: Props) {
  const { skin } = useSkin()
  const { reduced } = useMotionPref()
  const [playing, setPlaying] = useState(false)

  const activeSkinMeta = allSkins.find((s) => s.name === skin) ?? allSkins[0]

  const colorNames = semanticTokens.color.map((t) => t.replace('--color-', ''))
  const typeRoles = deriveTypeRoles(semanticTokens.type)

  const durationTokens = semanticTokens.motion.filter((t) => t.startsWith('--motion-duration-'))
  const easeTokens = semanticTokens.motion.filter((t) => t.startsWith('--motion-ease-'))

  const handlePlay = () => setPlaying((p) => !p)

  return (
    <>
      <Head title="Tokens — J Galenti" />
      <DocShell nav={nav}>
        <div className={styles.container}>
          {/* ── Header ── */}
          <header className={styles.header}>
            <h1 className={styles['page-title']}>Tokens</h1>
            <p className={styles['skin-meta']}>
              <strong>{activeSkinMeta.label}</strong>
              {' · '}
              {activeSkinMeta.era}
              {' · '}
              {activeSkinMeta.colorScheme}
              {' — '}
              {activeSkinMeta.description}
            </p>
          </header>

          {/* ── Color ── */}
          <section aria-labelledby="section-color" className={styles.section}>
            <h2 id="section-color" className={styles['section-title']}>
              Color
            </h2>
            <ul className={styles['color-grid']} aria-label="Color tokens">
              {colorNames.map((name) => {
                const figure = deriveFigure(name, colorNames)
                const tokenVar = `--color-${name}`
                return (
                  <li key={name} className={styles['color-card']}>
                    {figure ? (
                      <div
                        className={styles['swatch-pair']}
                        style={{
                          backgroundColor: `var(--color-${name})`,
                          color: `var(--color-${figure})`,
                        }}
                        aria-hidden="true"
                      >
                        Aa
                      </div>
                    ) : (
                      <div
                        className={styles.swatch}
                        style={{ backgroundColor: `var(${tokenVar})` }}
                        aria-hidden="true"
                      />
                    )}
                    <span className={styles['color-label']}>{tokenVar}</span>
                  </li>
                )
              })}
            </ul>
          </section>

          {/* ── Zones ── */}
          <section aria-labelledby="section-zones" className={styles.section}>
            <h2 id="section-zones" className={styles['section-title']}>
              Zones
            </h2>
            <p className={styles['zone-note']}>
              Zones re-assign the same semantic custom properties inside a{' '}
              <span className={styles.mono}>data-zone</span> subtree, so a zone composes with every
              skin — each skin supplies its own values for the zone.
            </p>
            {zoneNames.map((zone) => {
              const zoneColorNames = zoneTokens[zone]
                .filter((t) => t.startsWith('--color-'))
                .map((t) => t.replace('--color-', ''))
              const zoneOtherTokens = zoneTokens[zone].filter((t) => !t.startsWith('--color-'))
              return (
                <div key={zone} data-zone={zone} className={styles['zone-panel']}>
                  <p className={styles['zone-label']}>data-zone=&quot;{zone}&quot;</p>
                  <ul className={styles['color-grid']} aria-label={`${zone} zone color overrides`}>
                    {zoneColorNames.map((name) => {
                      const figure = deriveFigure(name, zoneColorNames)
                      const tokenVar = `--color-${name}`
                      return (
                        <li key={name} className={styles['color-card']}>
                          {figure ? (
                            <div
                              className={styles['swatch-pair']}
                              style={{
                                backgroundColor: `var(--color-${name})`,
                                color: `var(--color-${figure})`,
                              }}
                              aria-hidden="true"
                            >
                              Aa
                            </div>
                          ) : (
                            <div
                              className={styles.swatch}
                              style={{ backgroundColor: `var(${tokenVar})` }}
                              aria-hidden="true"
                            />
                          )}
                          <span className={styles['color-label']}>{tokenVar}</span>
                        </li>
                      )
                    })}
                  </ul>
                  {zoneOtherTokens.length > 0 && (
                    <ul
                      className={styles['zone-token-list']}
                      aria-label={`${zone} zone non-color overrides`}
                    >
                      {zoneOtherTokens.map((token) => (
                        <li key={token}>
                          <span className={styles.mono}>{token}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )
            })}
          </section>

          {/* ── Type ── */}
          <section aria-labelledby="section-type" className={styles.section}>
            <h2 id="section-type" className={styles['section-title']}>
              Type
            </h2>
            <ul className={styles['type-list']} aria-label="Type role specimens">
              {typeRoles.map((role) => (
                <li key={role} className={styles['type-row']}>
                  <p
                    style={{
                      fontFamily: `var(--type-${role}-family)`,
                      fontSize: `var(--type-${role}-size)`,
                      fontWeight: `var(--type-${role}-weight)`,
                      lineHeight: `var(--type-${role}-line)`,
                      letterSpacing: `var(--type-${role}-tracking)`,
                      margin: 0,
                      color: 'var(--color-ink)',
                    }}
                  >
                    Warm precision, engineered.
                  </p>
                  <span className={styles.mono}>{role}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* ── Radius & Shadow ── */}
          <section aria-labelledby="section-radius" className={styles.section}>
            <h2 id="section-radius" className={styles['section-title']}>
              Radius &amp; Shadow
            </h2>
            <ul className={styles['radius-grid']} aria-label="Radius and shadow tokens">
              <li className={styles['radius-card']}>
                <div
                  className={`${styles['radius-box']} ${styles['radius-box-control']}`}
                  aria-hidden="true"
                />
                <span className={styles.mono}>--radius-control</span>
              </li>
              <li className={styles['radius-card']}>
                <div
                  className={`${styles['radius-box']} ${styles['radius-box-surface']}`}
                  aria-hidden="true"
                />
                <span className={styles.mono}>--radius-surface</span>
              </li>
              <li className={styles['radius-card']}>
                <div
                  className={`${styles['radius-box']} ${styles['radius-box-pill']}`}
                  aria-hidden="true"
                />
                <span className={styles.mono}>--radius-pill</span>
              </li>
              <li className={styles['radius-card']}>
                <div
                  className={`${styles['radius-box']} ${styles['radius-box-overlay']}`}
                  aria-hidden="true"
                />
                <span className={styles.mono}>--shadow-overlay</span>
              </li>
            </ul>
          </section>

          {/* ── Density ── */}
          <section aria-labelledby="section-density" className={styles.section}>
            <h2 id="section-density" className={styles['section-title']}>
              Density
            </h2>
            <ul className={styles['density-list']} aria-label="Density tokens">
              <li className={styles['density-row']}>
                <div className={styles['density-bar-row']} aria-hidden="true" />
                <span className={styles.mono}>--density-row</span>
              </li>
              <li className={styles['density-row']}>
                <div className={styles['density-bar-control']} aria-hidden="true" />
                <span className={styles.mono}>--density-control</span>
              </li>
              <li className={styles['density-row']}>
                <div className={styles['density-bar-gap']} aria-hidden="true" />
                <span className={styles.mono}>--density-gap</span>
              </li>
              <li className={styles['density-row']}>
                <div className={styles['density-bar-pad']} aria-hidden="true" />
                <span className={styles.mono}>--density-pad</span>
              </li>
            </ul>
          </section>

          {/* ── Space ── */}
          <section aria-labelledby="section-space" className={styles.section}>
            <h2 id="section-space" className={styles['section-title']}>
              Space
            </h2>
            <ul className={styles['space-list']} aria-label="Space scale tokens">
              {baseTokens.space.map((token) => (
                <li key={token} className={styles['space-row']}>
                  <div
                    className={styles['space-bar']}
                    style={{ width: `var(${token})` }}
                    aria-hidden="true"
                  />
                  <span className={styles.mono}>{token}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* ── Z-index ── */}
          <section aria-labelledby="section-z" className={styles.section}>
            <h2 id="section-z" className={styles['section-title']}>
              Z-index
            </h2>
            <dl className={styles['z-dl']}>
              {baseTokens.z.map((token) => (
                <div key={token} style={{ display: 'contents' }}>
                  <dt className={styles['z-dt']}>{token}</dt>
                  <dd className={styles['z-dd']}>{`var(${token})`}</dd>
                </div>
              ))}
            </dl>
          </section>

          {/* ── Motion ── */}
          <section aria-labelledby="section-motion" className={styles.section}>
            <h2 id="section-motion" className={styles['section-title']}>
              Motion
            </h2>
            <div className={styles['motion-controls']}>
              <button
                type="button"
                className={styles['play-button']}
                onClick={handlePlay}
                aria-pressed={playing}
              >
                {playing ? 'Reset' : 'Play'}
              </button>
              {reduced && (
                <p className={styles['reduced-note']}>
                  Reduced motion active — every duration resolves to 0ms
                </p>
              )}
            </div>
            <ul className={styles['motion-list']} aria-label="Motion duration tokens">
              {durationTokens.map((token) => {
                const label = durationLabel(token)
                return (
                  <li key={token} className={styles['motion-row']}>
                    <div
                      className={styles['motion-track']}
                      data-active={playing ? 'true' : 'false'}
                      aria-hidden="true"
                    >
                      <div
                        className={styles['motion-dot']}
                        style={{
                          transition: `transform var(${token}) var(--motion-ease-move)`,
                        }}
                      />
                    </div>
                    <span className={styles.mono}>
                      {token} ({label})
                    </span>
                  </li>
                )
              })}
            </ul>
            <ul className={styles['motion-ease-list']} aria-label="Motion ease tokens">
              {easeTokens.map((token) => (
                <li key={token}>
                  <span className={styles.mono}>{token}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* ── Breakpoints ── */}
          <section aria-labelledby="section-bp" className={styles.section}>
            <h2 id="section-bp" className={styles['section-title']}>
              Breakpoints
            </h2>
            <dl className={styles['bp-dl']}>
              {Object.entries(breakpoints).map(([name, value]) => (
                <div key={name} style={{ display: 'contents' }}>
                  <dt className={styles['bp-dt']}>--bp-{name}</dt>
                  <dd className={styles['bp-dd']}>{value}</dd>
                </div>
              ))}
            </dl>
          </section>

          {/* ── Footer ── */}
          <footer className={styles.footer}>
            <p className={styles['footer-text']}>
              This page is generated from the token manifest — add a skin file, rebuild, and it
              re-renders itself.
            </p>
          </footer>
        </div>
      </DocShell>
    </>
  )
}
