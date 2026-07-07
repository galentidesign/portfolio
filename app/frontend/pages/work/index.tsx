import { Head } from '@inertiajs/react'
import { Card } from '@/ds/components/Card/Card'
import { Button } from '@/ds/components/Button/Button'
import { useFx } from '@/ds/motion/useFx'
import { skins } from '@/ds/tokens/generated/skins'
import { CONTACT_EMAIL, LINKEDIN_URL } from '@/shell/contact'
import styles from './styles.module.css'

// Derived, never hardcoded: adding a skin must update this claim by rebuild
// alone (the additive-skin rule extends to prose that counts the registry).
const visibleSkinCount = skins.filter((s) => !s.hidden).length

// The skim hub's four proof pillars — the marquee strip between hero and
// tiles. One accessible copy; motion mode appends aria-hidden clones (fx).
const MARQUEE_TERMS = ['design systems', 'production code', 'agentic playbooks', 'receipts']

// Live palette chips on the system tile — pure CSS, current-skin driven.
const PALETTE_CHIPS = [
  '--color-surface',
  '--color-ink',
  '--color-accent',
  '--color-positive',
  '--color-caution',
  '--color-critical',
  '--color-line',
] as const

export default function WorkIndex() {
  const marqueeRef = useFx<HTMLDivElement>((fx, el) => fx.mountMarquee(el))
  const revealRef = useFx<HTMLDivElement>((fx, el) =>
    fx.mountReveal(el, { selector: '[data-reveal]' }),
  )
  const studyARef = useFx<HTMLDivElement | HTMLAnchorElement>((fx, el) =>
    fx.mountProximityGlow(el),
  )
  const studyBRef = useFx<HTMLDivElement | HTMLAnchorElement>((fx, el) =>
    fx.mountProximityGlow(el),
  )
  const systemRef = useFx<HTMLDivElement | HTMLAnchorElement>((fx, el) =>
    fx.mountProximityGlow(el),
  )
  const resumeRef = useFx<HTMLButtonElement | HTMLAnchorElement>((fx, el) => fx.mountMagnetic(el))

  return (
    <>
      <Head title="Work — J Galenti">
        <meta
          name="description"
          content="The skim hub: thesis, two case studies, the design system, and the résumé — every claim linked to proof."
        />
      </Head>
      <main id="main" className={styles.page}>
        <div className={styles.container}>
          {/* Block 1: Thesis */}
          <section className={styles['thesis-block']} aria-label="Thesis">
            <p className={styles.annotation}>The 90-second version</p>
            <h1 className={styles.thesis}>
              <span className={styles['thesis-lead']}>Design technologist</span>{' '}
              <span className={styles['thesis-rest']}>
                — I architect enterprise-scale design systems, ship them in production code, and
                write the agentic-AI playbook for design orgs.
              </span>
            </h1>
          </section>
        </div>

        {/* Marquee strip — velocity-reactive drift in motion mode, static row
            under reduced motion (no duplication, no fx bytes). */}
        <div className={styles['marquee-strip']}>
          <div ref={marqueeRef} className={styles['marquee-track']}>
            {MARQUEE_TERMS.map((term) => (
              <span key={term} className={styles['marquee-term']}>
                {term}
                <span className={styles['marquee-dot']} aria-hidden="true">
                  ·
                </span>
              </span>
            ))}
          </div>
        </div>

        <div ref={revealRef} className={styles.container}>
          {/* Block 2: Proof */}
          <section className={styles['proof-block']} aria-label="Case studies">
            <div className={styles['tile-grid']}>
              {/* Study A — the wide editorial tile, and the first night-zone
                  surface a visitor meets: same semantic tokens, dark values. */}
              <div className={styles['study-tile']} data-zone="night" data-reveal>
                <Card
                  ref={studyARef}
                  href="/work/agentic-design-ops"
                  title="Agentic design-ops"
                  footer={<span className={styles['tile-cue']}>Read the study →</span>}
                >
                  <p className={styles['tile-lede']}>
                    How this site (and its design system) is built by an agent fleet with
                    governance gates.
                  </p>
                </Card>
              </div>
              {/* Study B — the tall, light counterpart. */}
              <div className={styles['study-tile-b']} data-reveal>
                <Card
                  ref={studyBRef}
                  href="/work/shadcn-to-polaris"
                  title="shadcn → Polaris"
                  footer="Read the study →"
                >
                  <p className={styles['tile-lede']}>
                    Migrating a production app&apos;s component layer between design systems
                    without a rewrite.
                  </p>
                </Card>
              </div>
            </div>
          </section>

          {/* Block 3: System */}
          <section className={styles['system-block']} aria-label="Design system" data-reveal>
            <Card
              ref={systemRef}
              href="/system"
              title={`The design system behind this site — 16 components · ${visibleSkinCount} skins · zero axe violations`}
            >
              Tokens are the single source of truth — every skin is one JSON file; components
              never change.
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
          </section>

          {/* Block 4: Act */}
          <section className={styles['act-block']} aria-label="Contact and resources" data-reveal>
            <Button ref={resumeRef} variant="primary" href="/resume">
              Résumé
            </Button>
            <a href={`mailto:${CONTACT_EMAIL}`} className={styles['mailto-link']}>
              {CONTACT_EMAIL}
            </a>
            <a
              href={LINKEDIN_URL}
              className={styles['mailto-link']}
              rel="noreferrer"
              target="_blank"
            >
              LinkedIn
            </a>
            <a
              href="https://github.com/galentidesign/portfolio"
              className={styles['github-link']}
              rel="noreferrer"
              target="_blank"
            >
              Source — this site&apos;s public repo
            </a>
          </section>
        </div>
      </main>
    </>
  )
}
