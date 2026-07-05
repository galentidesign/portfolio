import { Head, Link } from '@inertiajs/react'
import { ScrollProgress } from '@/shell/story/ScrollProgress'
import styles from './story.module.css'
import noteStyles from './era-note.module.css'

export default function Agentic() {
  return (
    <>
      <Head title="The agentic era — J Galenti" />
      <main id="main" className={styles.chapter}>
        <ScrollProgress />

        <header className={styles['chapter-header']}>
          <p className={styles['chapter-label']}>Chapter 3 · 2023–now</p>
          <h1 className={styles['chapter-title']}>The agentic era</h1>
        </header>

        <aside className={noteStyles.note} aria-label="Skin engine note">
          <p className={noteStyles['note-text']}>
            This chapter stays own-brand by design, forever — the era it describes is the one that
            built the engine itself. <Link href="/system/skins">See the skin engine →</Link>
          </p>
        </aside>

        <section aria-labelledby="agentic-receipts" className={styles.section}>
          <h2 id="agentic-receipts" className={styles['section-heading']}>
            Agent receipts
          </h2>
          <p className={styles.annotation}>
            agent-built receipts — assembled at M10 from docs/receipts/
          </p>
        </section>

        <section aria-labelledby="agentic-playbook" className={styles.section}>
          <h2 id="agentic-playbook" className={styles['section-heading']}>
            The agentic playbook
          </h2>
          <p className={styles.annotation}>
            agentic design-ops playbook — content workstream (portfolio-spec Task 2)
          </p>
        </section>

        <footer className={styles['chapter-footer']}>
          <Link href="/work" className={styles['handoff-link']}>
            See the work →
          </Link>
        </footer>
      </main>
    </>
  )
}
