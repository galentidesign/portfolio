import { Head } from '@inertiajs/react'
import { Card } from '@/ds/components/Card/Card'
import { AssemblyOpening } from '@/story/assembly/AssemblyOpening'
import { PrologueBeat } from '@/story/prologue/PrologueBeat'
import styles from './styles.module.css'

export default function Home() {
  return (
    <>
      <Head title="J Galenti">
        <meta
          name="description"
          content="J Galenti — design technologist. A portfolio built as evidence: a token-driven design system, re-theming story chapters, and agent-built receipts."
        />
      </Head>
      <main id="main" className={styles.page}>
        {/* ── Assembly opening (owns the hero h1) ─────────────────────────── */}
        <AssemblyOpening />

        {/* ── Prologue — the 2004–2013 passage between opening and gateway ── */}
        <PrologueBeat />

        {/* ── Chapter gateway — the skip control's landing target ─────────── */}
        <section
          id="gateway"
          tabIndex={-1}
          className={styles.gateway}
          aria-labelledby="chapter-gateway-heading"
        >
          <div className={styles['gateway-content']}>
            <h2 id="chapter-gateway-heading" className={styles['gateway-heading']}>
              Chapters
            </h2>
            <div className={styles['gateway-grid']}>
              <Card href="/story/rails-era" footer="Read the chapter →">
                <p className={styles['chapter-num']}>01</p>
                <p className={styles['chapter-title']}>The Rails era</p>
                <p className={styles['chapter-summary']}>2014–2019 · the dense product years</p>
              </Card>
              <Card href="/story/react-era" footer="Read the chapter →">
                <p className={styles['chapter-num']}>02</p>
                <p className={styles['chapter-title']}>The React era</p>
                <p className={styles['chapter-summary']}>
                  components, tokens, and the system behind the system
                </p>
              </Card>
              <Card href="/story/agentic" footer="Read the chapter →">
                <p className={styles['chapter-num']}>03</p>
                <p className={styles['chapter-title']}>The agentic era</p>
                <p className={styles['chapter-summary']}>
                  building with an agent fleet — receipts included
                </p>
              </Card>
            </div>
          </div>
        </section>
      </main>
    </>
  )
}
