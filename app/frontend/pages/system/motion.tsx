import { useState, useMemo } from 'react'
import { Head } from '@inertiajs/react'
import { Link } from '@inertiajs/react'
import { semanticTokens } from '@/ds/tokens/generated/skins'
import type { SystemNavEntry } from '@/system/DocShell'
import { DocShell } from '@/system/DocShell'
import { useSkin } from '@/shell/skin/SkinProvider'
import { useMotionPref } from '@/ds/motion/useMotionPref'
import styles from './motion.module.css'

// ── Types ──────────────────────────────────────────────────────────────────

interface Props {
  nav: SystemNavEntry[]
}

// ── Component ──────────────────────────────────────────────────────────────

export default function MotionPage({ nav }: Props) {
  const { skin } = useSkin()
  const { reduced, manualReduced, setManualReduced } = useMotionPref()
  const [active, setActive] = useState(false)

  // Read live CSS custom property values during render — client-only (no SSR),
  // so getComputedStyle is always available. Re-runs when skin changes so the
  // table updates when the user switches themes.
  const liveValues = useMemo(() => {
    const style = getComputedStyle(document.documentElement)
    const values: Record<string, string> = {}
    for (const token of semanticTokens.motion) {
      const raw = style.getPropertyValue(token).trim()
      values[token] = raw !== '' ? raw : '—'
    }
    return values
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [skin])

  const durationTokens = semanticTokens.motion.filter((t) => t.startsWith('--motion-duration-'))
  const easeTokens = semanticTokens.motion.filter((t) => t.startsWith('--motion-ease-'))

  return (
    <>
      <Head title="Motion — J Galenti" />
      <DocShell nav={nav}>
        <div className={styles.content}>
          <h1 className={styles.heading}>Motion</h1>
          <p className={styles.intro}>
            Motion is a two-layer gate: CSS durations collapse to{' '}
            <code className={styles.code}>0ms</code> automatically, and JS animations must pass
            through <code className={styles.code}>useMotionPref()</code>.
          </p>

          {/* ── Token table ── */}
          <section aria-labelledby="section-tokens" className={styles.section}>
            <h2 id="section-tokens" className={styles['section-heading']}>
              Tokens
            </h2>
            <p className={styles.note}>
              Values are read live via <code className={styles.code}>getComputedStyle</code> — they
              update when you switch skins.
            </p>

            <div className={styles['table-wrap']}>
              <table className={styles.table}>
                <caption className={styles['table-caption']}>Motion duration tokens</caption>
                <thead>
                  <tr>
                    <th scope="col" className={styles.th}>
                      Token
                    </th>
                    <th scope="col" className={styles.th}>
                      Live value
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {durationTokens.map((token) => (
                    <tr key={token}>
                      <td className={styles.td}>
                        <code className={styles.code}>{token}</code>
                      </td>
                      <td className={styles.td}>
                        <code className={styles['code-value']}>{liveValues[token] ?? '…'}</code>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <table className={styles.table}>
                <caption className={styles['table-caption']}>Motion easing tokens</caption>
                <thead>
                  <tr>
                    <th scope="col" className={styles.th}>
                      Token
                    </th>
                    <th scope="col" className={styles.th}>
                      Live value
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {easeTokens.map((token) => (
                    <tr key={token}>
                      <td className={styles.td}>
                        <code className={styles.code}>{token}</code>
                      </td>
                      <td className={styles['td-ease']}>
                        <code className={styles['code-value']}>{liveValues[token] ?? '…'}</code>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* ── Live demo ── */}
          <section aria-labelledby="section-demo" className={styles.section}>
            <h2 id="section-demo" className={styles['section-heading']}>
              Live demo
            </h2>
            <p className={styles.note}>
              The box below uses only motion tokens in its CSS transition. Under reduced motion, the
              CSS layer collapses the durations to <code className={styles.code}>0ms</code>{' '}
              automatically.
            </p>

            <div className={styles['demo-controls']}>
              <button
                type="button"
                className={styles['demo-button']}
                onClick={() => setActive((v) => !v)}
                aria-pressed={active}
              >
                {active ? 'Reset' : 'Animate'}
              </button>
              {reduced && (
                <p className={styles['reduced-note']} role="status">
                  Reduced motion active — durations are 0ms
                </p>
              )}
            </div>

            <div className={styles['demo-stage']} aria-hidden="true">
              <div className={styles['demo-box']} data-active={active ? 'true' : 'false'} />
            </div>
          </section>

          {/* ── How the gate works ── */}
          <section aria-labelledby="section-gate" className={styles.section}>
            <h2 id="section-gate" className={styles['section-heading']}>
              How the gate works
            </h2>

            <div className={styles.prose}>
              <h3 className={styles['prose-subheading']}>CSS layer</h3>
              <p>
                <code className={styles.code}>motion-overrides.css</code> (generated) sets every{' '}
                <code className={styles.code}>--motion-duration-*</code> token to{' '}
                <code className={styles.code}>0ms</code> under two conditions:
              </p>
              <ul className={styles['prose-list']}>
                <li>
                  <code className={styles.code}>@media (prefers-reduced-motion: reduce)</code> — the
                  OS-level system preference.
                </li>
                <li>
                  <code className={styles.code}>:root[data-motion=&apos;reduced&apos;]</code> — set
                  by the manual override (see below).
                </li>
              </ul>
              <p>
                Because durations collapse at the token level, any CSS transition or animation that
                references a <code className={styles.code}>--motion-duration-*</code> token becomes
                instant — no per-component media-query needed. The ease tokens are not affected;
                they keep their values under reduced motion.
              </p>

              <h3 className={styles['prose-subheading']}>JS layer</h3>
              <p>
                <code className={styles.code}>useMotionPref()</code> is the JS counterpart. Per repo
                rules, no JS animation may bypass this hook. It returns:
              </p>
              <ul className={styles['prose-list']}>
                <li>
                  <code className={styles.code}>reduced</code> —{' '}
                  <code className={styles.code}>true</code> when OS{' '}
                  <code className={styles.code}>prefers-reduced-motion</code> is active <em>or</em>{' '}
                  the user has manually toggled reduced motion.
                </li>
                <li>
                  <code className={styles.code}>manualReduced</code> —{' '}
                  <code className={styles.code}>true</code> only when the user explicitly toggled
                  via <code className={styles.code}>setManualReduced</code>.
                </li>
                <li>
                  <code className={styles.code}>setManualReduced(v)</code> — persists the override
                  to <code className={styles.code}>data-motion=&apos;reduced&apos;</code> on{' '}
                  <code className={styles.code}>&lt;html&gt;</code> and to{' '}
                  <code className={styles.code}>localStorage</code>. This triggers the CSS layer
                  above, so all durations collapse immediately.
                </li>
              </ul>
              <p>
                Gate JS animation logic behind <code className={styles.code}>reduced</code>: when{' '}
                <code className={styles.code}>true</code>, skip or instantly complete the animation.
              </p>

              <h3 className={styles['prose-subheading']}>Manual override</h3>
              <p>
                The current page manual-override state:{' '}
                <strong>{manualReduced ? 'reduced' : 'full motion'}</strong>.
              </p>
              <button
                type="button"
                className={styles['toggle-button']}
                onClick={() => setManualReduced(!manualReduced)}
                aria-pressed={manualReduced}
              >
                {manualReduced ? 'Restore full motion' : 'Enable reduced motion'}
              </button>
            </div>
          </section>

          {/* ── Footer ── */}
          <footer className={styles.footer}>
            <p className={styles['footer-note']}>
              Token source:{' '}
              <Link href="/system/tokens" className={styles['footer-link']}>
                Tokens
              </Link>
            </p>
          </footer>
        </div>
      </DocShell>
    </>
  )
}
