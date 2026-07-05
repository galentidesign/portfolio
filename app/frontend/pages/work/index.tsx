import { Head } from '@inertiajs/react'
import { Card } from '@/ds/components/Card/Card'
import { Button } from '@/ds/components/Button/Button'
import styles from './styles.module.css'

export default function WorkIndex() {
  return (
    <>
      <Head title="Work — J Galenti" />
      <main id="main" className={styles.page}>
        <div className={styles.container}>
          {/* Block 1: Thesis */}
          <section className={styles['thesis-block']} aria-label="Thesis">
            <p className={styles.annotation}>The 90-second version</p>
            <h1 className={styles.thesis}>
              Design technologist — I architect enterprise-scale design systems, ship them in
              production code, and write the agentic-AI playbook for design orgs.
            </h1>
          </section>

          {/* Block 2: Proof */}
          <section className={styles['proof-block']} aria-label="Case studies">
            <div className={styles['card-grid']}>
              <Card
                href="/work/agentic-design-ops"
                title="Agentic design-ops"
                footer="Read the study →"
              >
                How this site (and its design system) is built by an agent fleet with governance
                gates.
              </Card>
              <Card
                href="/work/shadcn-to-polaris"
                title="shadcn → Polaris"
                footer="Read the study →"
              >
                Migrating a production app&apos;s component layer between design systems without a
                rewrite.
              </Card>
            </div>
          </section>

          {/* Block 3: System */}
          <section className={styles['system-block']} aria-label="Design system">
            <Card
              href="/system"
              title="The design system behind this site — 16 components · 2 skins · zero axe violations"
            >
              Tokens are the single source of truth — every skin is one JSON file; components never
              change.
            </Card>
          </section>

          {/* Block 4: Act */}
          <section className={styles['act-block']} aria-label="Contact and resources">
            <Button variant="primary" href="/resume">
              Résumé
            </Button>
            <a href="mailto:galentidesign@gmail.com" className={styles['mailto-link']}>
              galentidesign@gmail.com
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
