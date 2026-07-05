import { useEffect, useRef } from 'react'
import { Button } from '@/ds/components/Button/Button'
import { FormField } from '@/ds/components/FormField/FormField'
import { Table, type TableColumn } from '@/ds/components/Table/Table'
import { useMotionPref } from '@/ds/motion/useMotionPref'
import { BEATS } from './beats'
import type { AssemblyMotionHandle } from './motion'
import styles from './assembly.module.css'

export interface AssemblyOpeningProps {
  /** Fired once when the sequence completes or is skipped. */
  onComplete?: () => void
}

// ── Exhibit data ─────────────────────────────────────────────────────────────
// Static demo content for the organism beat. Structural, token-true rows —
// nothing here pretends to be real data.

interface SpecimenRow {
  token: string
  role: string
}

const SPECIMEN_COLUMNS: readonly TableColumn<SpecimenRow>[] = [
  { key: 'token', header: 'Token' },
  { key: 'role', header: 'Role' },
]

const SPECIMEN_ROWS: readonly SpecimenRow[] = [
  { token: '--color-accent', role: 'Accent ink' },
  { token: '--radius-control', role: 'Control rounding' },
  { token: '--motion-ease-enter', role: 'Entrance easing' },
]

const TOKEN_CHIPS = [
  { name: 'surface', varName: '--color-surface' },
  { name: 'ink', varName: '--color-ink' },
  { name: 'accent', varName: '--color-accent' },
  { name: 'positive', varName: '--color-positive' },
  { name: 'line', varName: '--color-line' },
] as const

/**
 * The assembly opening (spec §6.1) — static stepped diagram as the base
 * render; the GSAP motion layer enhances it via dynamic import when motion
 * is allowed. See story/assembly/README.md for the storyboard, timeline
 * contract, and the fallback-as-base rationale.
 */
export function AssemblyOpening({ onComplete }: AssemblyOpeningProps) {
  const { reduced } = useMotionPref()
  const sectionRef = useRef<HTMLElement | null>(null)
  const handleRef = useRef<AssemblyMotionHandle | null>(null)
  const completedRef = useRef(false)

  // Latest-callback ref — assigned in an effect (never during render) so the
  // motion layer's long-lived onComplete closure always sees the current prop.
  const onCompleteRef = useRef(onComplete)
  useEffect(() => {
    onCompleteRef.current = onComplete
  })

  const complete = () => {
    if (completedRef.current) return
    completedRef.current = true
    onCompleteRef.current?.()
  }

  // Motion enhancement: dynamic import so reduced-motion visitors never
  // download GSAP. A live flip to reduced motion destroys the handle and
  // the base styling takes back over (THE MOTION GATE, per repo rules).
  useEffect(() => {
    const section = sectionRef.current
    if (reduced || section === null) return

    let cancelled = false
    void import('./motion').then(({ mountAssemblyMotion }) => {
      if (cancelled || sectionRef.current === null) return
      handleRef.current = mountAssemblyMotion(sectionRef.current, {
        onComplete: complete,
      })
    })

    return () => {
      cancelled = true
      handleRef.current?.destroy()
      handleRef.current = null
    }
  }, [reduced])

  function skip() {
    handleRef.current?.skipToEnd()
    const gateway = document.getElementById('gateway')
    if (gateway !== null) {
      // A skip is never animated, in either mode.
      gateway.scrollIntoView({ behavior: 'auto' })
      ;(gateway as HTMLElement).focus({ preventScroll: true })
    }
    complete()
  }

  return (
    <section
      ref={sectionRef}
      aria-label="Assembly opening"
      data-testid="assembly-opening"
      className={styles.opening}
    >
      {/* Skip — the only operable control inside the opening; first in tab
          order, visible from frame one. */}
      <button type="button" data-testid="skip-intro" className={styles.skip} onClick={skip}>
        Skip intro ↓
      </button>

      {/* Hero — visible from frame one in both modes; beats assemble around
          the name, nothing ever hides it. */}
      <div className={styles.hero} data-assembly-hero>
        <h1 className={styles.heading}>J Galenti</h1>
        <p className={styles.subline}>
          Design technologist — design systems, production code, and the agentic playbook between
          them.
        </p>
      </div>

      <ol className={styles.steps} data-assembly-steps>
        {BEATS.map((beat, i) => (
          <li key={beat.id} data-beat={beat.id} className={styles.step}>
            <figure className={styles.figure}>
              {/* Exhibits are visual evidence, not controls: inert keeps
                  them out of tab order and the AT tree — the figcaption
                  carries the narrative. */}
              <div inert className={styles.exhibit} data-exhibit={beat.id}>
                {beat.id === 'tokens' && <TokensExhibit />}
                {beat.id === 'atom' && <Button data-assembly-part="button">Assemble</Button>}
                {beat.id === 'molecule' && <MoleculeExhibit />}
                {beat.id === 'organisms' && <OrganismsExhibit />}
                {beat.id === 'shell' && <ShellExhibit />}
              </div>
              <figcaption className={styles.caption}>
                <span className={styles['step-num']} aria-hidden="true">
                  {String(i).padStart(2, '0')}
                </span>
                {beat.caption}
              </figcaption>
            </figure>
          </li>
        ))}
      </ol>
    </section>
  )
}

// ── Beat exhibits ────────────────────────────────────────────────────────────

function TokensExhibit() {
  return (
    <div className={styles['tokens-field']}>
      <div className={styles.chips} data-assembly-part="chips">
        {TOKEN_CHIPS.map((chip) => (
          <span
            key={chip.name}
            className={styles.chip}
            style={{ backgroundColor: `var(${chip.varName})` }}
            data-chip={chip.name}
          >
            <code className={styles['chip-label']}>{chip.name}</code>
          </span>
        ))}
      </div>
      <div className={styles.specimens} data-assembly-part="specimens">
        <span className={styles['specimen-display']}>Aa</span>
        <code className={styles['specimen-mono']}>16px</code>
      </div>
      <div className={styles.ruler} data-assembly-part="ruler">
        {[1, 2, 3, 4, 5, 6].map((n) => (
          <span key={n} className={styles.tick} data-tick={n} />
        ))}
      </div>
      <svg
        className={styles.ease}
        data-assembly-part="ease"
        viewBox="0 0 100 100"
        role="presentation"
      >
        <path d="M 0 100 C 20 100, 20 0, 100 0" fill="none" strokeWidth="3" />
      </svg>
    </div>
  )
}

function MoleculeExhibit() {
  return (
    <div className={styles.molecule}>
      <FormField label="Email" placeholder="you@example.com" data-assembly-part="field" />
      <Button data-assembly-part="button">Assemble</Button>
    </div>
  )
}

function OrganismsExhibit() {
  return (
    <div className={styles.organisms}>
      {/* A facsimile bar, not the real Nav: the page must never grow a
          second nav landmark, even inert. Pure picture. */}
      <div aria-hidden="true" className={styles['bar-facsimile']} data-assembly-part="bar">
        <span className={styles['bar-brand']}>J Galenti</span>
        <span className={styles['bar-links']}>
          <span>Work</span>
          <span>System</span>
          <span>Résumé</span>
        </span>
      </div>
      <div data-assembly-part="table">
        <Table
          caption="Token specimen table"
          columns={SPECIMEN_COLUMNS}
          rows={SPECIMEN_ROWS}
          rowKey={(row) => row.token}
        />
      </div>
    </div>
  )
}

function ShellExhibit() {
  return (
    <div aria-hidden="true" className={styles['shell-frame']} data-assembly-part="frame">
      <div className={styles['bar-facsimile']}>
        <span className={styles['bar-brand']}>J Galenti</span>
        <span className={styles['bar-links']}>
          <span>Work</span>
          <span>System</span>
          <span>Résumé</span>
        </span>
      </div>
      <span className={styles['hatch-facsimile']}>Skip to the work →</span>
    </div>
  )
}
