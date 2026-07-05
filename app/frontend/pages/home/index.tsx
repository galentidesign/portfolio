import { Head } from '@inertiajs/react'
import { Card } from '@/ds/components/Card/Card'
import styles from './styles.module.css'

export default function Home() {
  return (
    <>
      <Head title="J Galenti" />
      <main id="main" className={styles.page}>
        {/* ── Assembly slot ──────────────────────────────────────────────────── */}
        <section className={styles.assembly}>
          <div className={styles['assembly-content']}>
            <h1 className={styles.heading}>J Galenti</h1>
            <p className={styles.subline}>
              Design technologist — design systems, production code, and the agentic playbook
              between them.
            </p>
            <p className={styles.annotation}>assembly opening — lands with M5</p>
          </div>
        </section>

        {/* ── Prologue slot ──────────────────────────────────────────────────── */}
        <section className={styles.prologue} aria-label="Prologue">
          <div className={styles['prologue-content']}>
            <p className={styles.annotation}>prologue · 2004–2013 — lands with M5</p>
          </div>
        </section>

        {/* ── Chapter gateway ────────────────────────────────────────────────── */}
        <section className={styles.gateway} aria-labelledby="chapter-gateway-heading">
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
