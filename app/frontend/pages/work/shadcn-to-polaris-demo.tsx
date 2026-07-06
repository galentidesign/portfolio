import { useState, useEffect, type ComponentType } from 'react'
import { Head, Link } from '@inertiajs/react'
import type { DemoState } from '@/studies/polaris-demo/types'
import { track } from '@/telemetry/track'
import styles from './shadcn-to-polaris-demo.module.css'

// Type for the lazily loaded PolarisDemo default export.
// Declared locally to avoid a static import crossing the module boundary.
type PolarisDemoComponent = ComponentType<{ demoState: DemoState }>

const STATE_OPTIONS: Array<{ value: DemoState; label: string }> = [
  { value: 'success', label: 'success' },
  { value: 'loading', label: 'loading' },
  { value: 'empty', label: 'empty' },
  { value: 'error', label: 'error' },
]

/**
 * Page: /work/shadcn-to-polaris/demo
 *
 * Renders site-DS chrome (heading, intro, state switcher, back link) and mounts
 * the Polaris demo via a dynamic import so the Polaris bundle never loads on any
 * other route.
 */
export default function ShadcnToPolarisDemo() {
  const [demoState, setDemoState] = useState<DemoState>('success')
  const [Demo, setDemo] = useState<PolarisDemoComponent | null>(null)

  // AssemblyOpening pattern: load the Polaris chunk on mount only.
  useEffect(() => {
    let cancelled = false
    void import('@/studies/polaris-demo/PolarisDemo').then((mod) => {
      if (!cancelled) {
        // Store as a thunk so React doesn't treat the component as an updater.
        setDemo(() => mod.default as PolarisDemoComponent)
      }
    })
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <>
      <Head title="shadcn → Polaris demo — J Galenti">
        <meta
          name="description"
          content="Live demo: the Chores flow rebuilt with real Polaris components, serving four forceable states from Rails in an isolated bundle."
        />
      </Head>
      <main id="main" className={styles.page}>
        <div className={styles.container}>
          {/* heading — explicit margin set in module CSS (Polaris resets h1 margin) */}
          <h1 className={styles.heading}>Polaris Chores — live demo</h1>

          {/* Intro: factual UI copy, not study prose (prose goes in ProseSlots) */}
          <p className={styles.intro}>
            A Polaris 13.x recreation of the Chores Index / Create / Edit flow, bundle-isolated so
            it never loads on other routes.
          </p>

          {/* State switcher — OUTSIDE the Polaris container; always operable */}
          <div className={styles['switcher-wrap']}>
            <fieldset className={styles['switcher-fieldset']} data-testid="demo-state-switcher">
              <legend className={styles['switcher-legend']}>Demo state</legend>
              <div className={styles['switcher-segments']}>
                {STATE_OPTIONS.map(({ value, label }) => (
                  <label key={value} className={styles['switcher-label']}>
                    <input
                      type="radio"
                      name="demo-state"
                      value={value}
                      checked={demoState === value}
                      onChange={() => {
                        setDemoState(value)
                        track('demo_state', { state: value })
                      }}
                      className={styles['switcher-input']}
                    />
                    <span className={styles['switcher-segment']}>{label}</span>
                  </label>
                ))}
              </div>
            </fieldset>
            <p className={styles['latency-note']}>
              &ldquo;loading&rdquo; polls every 600 ms; &ldquo;error&rdquo; returns HTTP 500. Server
              sleeps ~450 ms on every request — skeletons reflect real network time.
            </p>
          </div>

          {/* Demo mount point */}
          <div className={styles['demo-mount']}>
            {Demo !== null ? (
              <Demo demoState={demoState} />
            ) : (
              <div className={styles['demo-pending']}>
                <p className={styles['demo-pending-text']}>Loading Polaris demo…</p>
              </div>
            )}
          </div>

          {/* Back link — explicit margin set in module CSS */}
          <Link href="/work/shadcn-to-polaris" className={styles['back-link']}>
            ← Back to the study
          </Link>
        </div>
      </main>
    </>
  )
}
