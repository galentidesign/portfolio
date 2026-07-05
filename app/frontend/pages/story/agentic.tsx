import { Head, Link } from '@inertiajs/react'
import { ScrollProgress } from '@/shell/story/ScrollProgress'
import styles from './story.module.css'

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

        <section aria-labelledby="agentic-receipts" className={styles.section}>
          <h2 id="agentic-receipts" className={styles['section-heading']}>
            Agent receipts
          </h2>
          <p className={styles.annotation}>agent-built receipts — lands with M6</p>
        </section>

        <section aria-labelledby="agentic-playbook" className={styles.section}>
          <h2 id="agentic-playbook" className={styles['section-heading']}>
            The agentic playbook
          </h2>
          <p className={styles.annotation}>agentic design-ops playbook — lands with M6</p>
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
