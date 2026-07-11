import { Card } from '@/ds/components/Card/Card'
import { Button } from '@/ds/components/Button/Button'
import { useFx } from '@/ds/motion/useFx'
import { skins } from '@/ds/tokens/generated/skins'
import { CONTACT_EMAIL, LINKEDIN_URL } from '@/shell/contact'
import styles from './beats.module.css'

// Derived, never hardcoded (the additive-skin rule extends to prose).
const visibleSkinCount = skins.filter((s) => !s.hidden).length

// Live palette chips — pure CSS, current-skin driven (shared idiom with /work).
const PALETTE_CHIPS = [
  '--color-surface',
  '--color-ink',
  '--color-accent',
  '--color-positive',
  '--color-caution',
  '--color-critical',
  '--color-line',
] as const

/** Beat 08 — System · résumé · close. Quiet. */
export function CloseBeat() {
  const revealRef = useFx<HTMLElement>((fx, el) =>
    fx.mountReveal(el, { selector: '[data-reveal]' }),
  )
  const resumeRef = useFx<HTMLButtonElement | HTMLAnchorElement>((fx, el) => fx.mountMagnetic(el))

  return (
    <section ref={revealRef} className={styles.beat} aria-labelledby="close-heading">
      <span className={styles['beat-numeral']} aria-hidden="true">
        08
      </span>
      <p className={styles['era-label']}>System · résumé · close</p>
      <h2 id="close-heading" className={styles['era-title']}>
        The system behind it
      </h2>

      <div className={styles['close-system']} data-reveal>
        <Card
          href="/system"
          title={`The design system behind this site — 16 components · ${visibleSkinCount} skins · zero axe violations`}
        >
          Tokens are the single source of truth — every skin is one JSON file; components never
          change.
          <span className={styles['chip-row']} aria-hidden="true">
            {PALETTE_CHIPS.map((varName) => (
              <span
                key={varName}
                className={styles.chip}
                style={{ backgroundColor: `var(${varName})` }}
              />
            ))}
          </span>
        </Card>
      </div>

      <div className={styles['close-act']} data-reveal>
        <Button ref={resumeRef} variant="primary" href="/resume">
          Résumé
        </Button>
        <a href={`mailto:${CONTACT_EMAIL}`} className={styles['quiet-link']}>
          {CONTACT_EMAIL}
        </a>
        <a href={LINKEDIN_URL} className={styles['quiet-link']} rel="noreferrer" target="_blank">
          LinkedIn
        </a>
        <a
          href="https://github.com/galentidesign/portfolio"
          className={styles['quiet-link']}
          rel="noreferrer"
          target="_blank"
        >
          Source — this site&apos;s public repo
        </a>
      </div>
    </section>
  )
}
