import { Head, Link } from '@inertiajs/react'
import { ProseSlot } from '@/studies/shared/ProseSlot'
import { OrchestrationDiagram } from '@/studies/agentic-design-ops/OrchestrationDiagram'
import { PatternGallery } from '@/studies/agentic-design-ops/PatternGallery'
import { RippleDiagram } from '@/studies/agentic-design-ops/RippleDiagram'
import styles from './agentic-design-ops.module.css'

/**
 * Study A — Agentic design-ops (spec §6.3).
 * Layout + diagram components only. Prose slots are filled by the content
 * workstream after sanitization decisions are resolved.
 */
export default function AgenticDesignOps() {
  return (
    <>
      <Head title="Agentic design-ops — J Galenti">
        <meta
          name="description"
          content="Case study: agentic design-ops — orchestrating design-system work with agent fleets; the decision, the build, and the ripple."
        />
      </Head>
      <main id="main" className={styles.page}>
        <div className={styles.container}>
          {/* ── Page header ── */}
          <div className={styles.header}>
            <h1 className={styles.heading}>Agentic design-ops</h1>
            <ProseSlot id="study-a/framing" />
          </div>

          {/* ── Decision ── */}
          <section aria-labelledby="decision-heading" className={styles.section}>
            <h2 id="decision-heading" className={styles['section-heading']}>
              Decision
            </h2>
            <ProseSlot id="study-a/decision" />
            <OrchestrationDiagram />
          </section>

          {/* ── Build ── */}
          <section aria-labelledby="build-heading" className={styles.section}>
            <h2 id="build-heading" className={styles['section-heading']}>
              Build
            </h2>
            <ProseSlot id="study-a/build" />
            <PatternGallery />
          </section>

          {/* ── Ripple ── */}
          <section aria-labelledby="ripple-heading" className={styles.section}>
            <h2 id="ripple-heading" className={styles['section-heading']}>
              Ripple
            </h2>
            <ProseSlot id="study-a/ripple" />
            <RippleDiagram />
          </section>

          {/* ── Connect to targets ── */}
          <section aria-labelledby="close-heading" className={styles.section}>
            <h2 id="close-heading" className={styles['section-heading']}>
              Connect to targets
            </h2>
            <ProseSlot id="study-a/close" />
            <nav aria-label="Related pages" className={styles['link-row']}>
              <Link href="/work" className={styles['nav-link']}>
                All work
              </Link>
              <Link href="/work/shadcn-to-polaris" className={styles['nav-link']}>
                shadcn → Polaris
              </Link>
              <Link href="/system" className={styles['nav-link']}>
                Design system
              </Link>
            </nav>
          </section>
        </div>
      </main>
    </>
  )
}
