import { Head, Link } from '@inertiajs/react'
import { Button } from '@/ds/components/Button/Button'
import { CONTACT_EMAIL, LINKEDIN_URL } from '@/shell/contact'
import { track } from '@/telemetry/track'
import styles from './styles.module.css'

interface PdfProps {
  available: boolean
  href: string
}

interface Props {
  pdf: PdfProps
}

export default function Resume({ pdf }: Props) {
  return (
    <>
      <Head title="Résumé — J Galenti">
        <meta
          name="description"
          content="Résumé — J Galenti, design technologist: token-driven design systems, production Rails/React, agentic design-ops. Web summary plus designed PDF."
        />
      </Head>
      <main id="main" className={styles.page}>
        <div className={styles.container}>
          {/* Header */}
          <header className={styles.header}>
            <h1 className={styles.heading}>J Galenti</h1>
            <p className={styles.role}>Design technologist</p>
          </header>

          {/* Thesis lede */}
          <section aria-label="Thesis" className={styles.section}>
            <p className={styles.lede}>
              I architect enterprise-scale design systems, ship them in production code, and write
              the agentic-AI playbook for design orgs.
            </p>
          </section>

          {/* Highlights */}
          <section aria-label="Highlights" className={styles.section}>
            <h2 className={styles['section-heading']}>Highlights</h2>
            <ul className={styles.highlights}>
              <li className={styles.highlight}>
                <p className={styles['highlight-text']}>
                  Token-driven, multi-skin design systems: the system behind this site compiles one
                  JSON file per skin into a fully re-themeable UI — adding a skin touches zero
                  components.
                </p>
                <Link href="/system" className={styles['proof-link']}>
                  See the system →
                </Link>
              </li>
              <li className={styles.highlight}>
                <p className={styles['highlight-text']}>
                  Production Rails + React/TypeScript: this portfolio is a Rails 8 + Inertia + React
                  19 app with CI-enforced zero axe violations and Lighthouse budgets held at ≥95 in
                  every category.
                </p>
                <Link href="/colophon" className={styles['proof-link']}>
                  See the craft bar →
                </Link>
              </li>
              <li className={styles.highlight}>
                <p className={styles['highlight-text']}>
                  Design-system migration without a rewrite: shadcn/ui → Shopify Polaris, mapped
                  token-by-token and API-by-API, shipped with a live migrated demo.
                </p>
                <Link href="/work/shadcn-to-polaris" className={styles['proof-link']}>
                  Read the study →
                </Link>
              </li>
              <li className={styles.highlight}>
                <p className={styles['highlight-text']}>
                  Agentic design-ops in practice: this site is built end to end by a governed agent
                  fleet — orchestration, model tiers, review gates, public per-session receipts.
                </p>
                <Link href="/work/agentic-design-ops" className={styles['proof-link']}>
                  Read the study →
                </Link>
              </li>
              <li className={styles.highlight}>
                <p className={styles['highlight-text']}>
                  Two decades building for the web: Rails-first design systems → React →
                  framework-agnostic systems thinking. The stack changed; the systems obsession
                  never did.
                </p>
                <Link href="/" className={styles['proof-link']}>
                  Start the story →
                </Link>
              </li>
            </ul>
          </section>

          {/* PDF slot */}
          <section aria-label="PDF résumé" className={styles.section}>
            {pdf.available ? (
              <Button variant="primary" href={pdf.href} onClick={() => track('resume_download')}>
                Download the PDF
              </Button>
            ) : (
              <div className={styles['pdf-unavailable']}>
                The designed PDF is in production — email me for the current version.{' '}
                <a href={`mailto:${CONTACT_EMAIL}`} className={styles['inline-link']}>
                  {CONTACT_EMAIL}
                </a>
              </div>
            )}
          </section>

          {/* Contact */}
          <section aria-label="Contact" className={styles['contact-row']}>
            <a href={`mailto:${CONTACT_EMAIL}`} className={styles['contact-link']}>
              {CONTACT_EMAIL}
            </a>
            <a
              href={LINKEDIN_URL}
              className={styles['contact-link']}
              rel="noreferrer"
              target="_blank"
            >
              LinkedIn
            </a>
          </section>

          {/* Back */}
          <Link href="/work" className={styles.link}>
            Back to the work →
          </Link>
        </div>
      </main>
    </>
  )
}
