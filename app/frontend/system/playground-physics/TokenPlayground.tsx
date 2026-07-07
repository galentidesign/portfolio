import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { Button } from '@/ds/components/Button/Button'
import { useMotionPref } from '@/ds/motion/useMotionPref'
import { shouldMountPhysicsLayer } from '@/ds/motion/capabilities'
import { semanticTokens } from '@/ds/tokens/generated/skins'
import type { TokenPhysicsHandle } from './motion'
import styles from './tokenPlayground.module.css'

// ── Chip data ────────────────────────────────────────────────────────────────
// Every chip derives from the REAL semantic token exports (skins.ts) — a token
// added to or removed from the system changes the pen without an edit here.
// A few color tokens are curated out: paired-ink and state-surface tokens read
// as near-duplicates of their base swatch and only crowd the pen.

const COLOR_CHIP_EXCLUSIONS = new Set([
  '--color-surface-overlay',
  '--color-accent-ink',
  '--color-glow-ink',
  '--color-ink-faint',
  '--color-line-strong',
  '--color-positive-surface',
  '--color-caution-surface',
  '--color-critical-surface',
])

const TYPE_ROLES = ['display', 'heading', 'body'] as const

export interface PlaygroundChip {
  id: string
  /** Visible mono label, e.g. 'accent', 'radius-pill', 'type-display'. */
  label: string
  kind: 'color' | 'radius' | 'type'
  /** Token-true inline style for the demo swatch (var() references only). */
  demoStyle: CSSProperties
  /** Specimen text for type chips. */
  text?: string
}

export const PLAYGROUND_CHIPS: readonly PlaygroundChip[] = [
  ...semanticTokens.color
    .filter((varName) => !COLOR_CHIP_EXCLUSIONS.has(varName))
    .map((varName) => ({
      id: varName,
      label: varName.replace('--color-', ''),
      kind: 'color' as const,
      demoStyle: { backgroundColor: `var(${varName})` },
    })),
  ...semanticTokens.radius.map((varName) => ({
    id: varName,
    label: varName.replace('--', ''),
    kind: 'radius' as const,
    demoStyle: { borderRadius: `var(${varName})` },
  })),
  ...TYPE_ROLES.filter((role) => semanticTokens.type.includes(`--type-${role}-family`)).map(
    (role) => ({
      id: `--type-${role}`,
      label: `type-${role}`,
      kind: 'type' as const,
      demoStyle: {
        fontFamily: `var(--type-${role}-family)`,
        fontWeight: `var(--type-${role}-weight)`,
      } as CSSProperties,
      text: 'Ag',
    }),
  ),
]

// ── Component ────────────────────────────────────────────────────────────────

/**
 * The token physics playground (spec R6) — the design system's own tokens as
 * physical objects. The tidy labeled grid IS the content and the only render
 * for reduced-motion / lite-device / no-JS visitors; the matter-js layer is
 * pure decoration, dynamically imported only when the section is visible,
 * the page has loaded (post-LCP), and THE MOTION GATE allows it.
 *
 * While physics drives the chips they are aria-hidden decoration; a
 * visually-hidden list mirrors the grid content for AT (assembly exhibit
 * pattern: the accessible narrative never depends on the animated layer).
 */
export function TokenPlayground() {
  const { reduced } = useMotionPref()
  const penRef = useRef<HTMLDivElement | null>(null)
  const handleRef = useRef<TokenPhysicsHandle | null>(null)
  const [physicsOn, setPhysicsOn] = useState(false)

  useEffect(() => {
    const pen = penRef.current
    if (reduced || pen === null) return
    // jsdom (tests) has no IntersectionObserver; lite devices skip physics.
    if (typeof IntersectionObserver === 'undefined' || !shouldMountPhysicsLayer()) return

    let cancelled = false
    let importStarted = false
    let visible = false
    let cancelLoadWait: (() => void) | null = null

    // Post-LCP defer: never let the physics chunk compete with first paint.
    const whenLoaded = (cb: () => void): (() => void) => {
      if (document.readyState === 'complete') {
        cb()
        return () => {}
      }
      window.addEventListener('load', cb, { once: true })
      return () => window.removeEventListener('load', cb)
    }

    const observer = new IntersectionObserver(
      (entries) => {
        visible = entries.some((e) => e.isIntersecting)
        if (handleRef.current !== null) {
          // Already mounted — the observer only pauses/resumes the engine.
          handleRef.current.setVisible(visible)
          return
        }
        if (!visible || importStarted) return
        importStarted = true
        cancelLoadWait = whenLoaded(() => {
          void import('./motion').then(({ mountTokenPhysics }) => {
            if (cancelled || penRef.current === null) return
            const handle = mountTokenPhysics(penRef.current)
            handle.setVisible(visible)
            handleRef.current = handle
            setPhysicsOn(true)
          })
        })
      },
      { threshold: 0.2 },
    )
    observer.observe(pen)

    return () => {
      cancelled = true
      cancelLoadWait?.()
      observer.disconnect()
      handleRef.current?.destroy()
      handleRef.current = null
      setPhysicsOn(false)
    }
  }, [reduced])

  return (
    <section
      aria-labelledby="playground-heading"
      className={styles.playground}
      data-testid="token-playground"
    >
      <div className={styles.intro}>
        <h2 id="playground-heading" className={styles.heading}>
          Token playground
        </h2>
        <p className={styles.description}>
          The system&rsquo;s tokens, subject to gravity. Drag them.
        </p>
      </div>

      <div ref={penRef} className={styles.pen} data-testid="playground-pen">
        {/* The grid is the base content. Under physics it becomes aria-hidden
            decoration (no focusables inside) and the mirror list below takes
            over for AT — same labels, same order. */}
        <ul
          className={styles.chips}
          aria-hidden={physicsOn ? true : undefined}
          aria-label="Design tokens"
        >
          {PLAYGROUND_CHIPS.map((chip) => (
            <li key={chip.id} className={styles.chip} data-physics-chip data-kind={chip.kind}>
              <span className={styles.demo} style={chip.demoStyle} aria-hidden="true">
                {chip.text}
              </span>
              <code className={styles['chip-label']}>{chip.label}</code>
            </li>
          ))}
        </ul>

        {physicsOn && (
          <>
            <ul className={styles['visually-hidden']} aria-label="Design tokens">
              {PLAYGROUND_CHIPS.map((chip) => (
                <li key={chip.id}>{chip.label}</li>
              ))}
            </ul>
            <Button
              size="sm"
              variant="secondary"
              className={styles.reset}
              onClick={() => handleRef.current?.reset()}
            >
              Reset
            </Button>
          </>
        )}
      </div>
    </section>
  )
}
