import { Head, Link } from '@inertiajs/react'
import { ScrollProgress } from '@/shell/story/ScrollProgress'
import styles from './story.module.css'

export default function ReactEra() {
  return (
    <>
      <Head title="The React era — J Galenti" />
      <main id="main" className={styles.chapter}>
        <ScrollProgress />

        <header className={styles['chapter-header']}>
          <p className={styles['chapter-label']}>Chapter 2 · 2019–2023</p>
          <h1 className={styles['chapter-title']}>The React era</h1>
        </header>

        <section aria-labelledby="react-era-engine" className={styles.section}>
          <h2 id="react-era-engine" className={styles['section-heading']}>
            The token engine
          </h2>
          <p className={styles.annotation}>the token engine story — lands with M6</p>
        </section>

        <section aria-labelledby="react-era-systems" className={styles.section}>
          <h2 id="react-era-systems" className={styles['section-heading']}>
            Systems and components
          </h2>
          <p className={styles.annotation}>the system behind the system — lands with M6</p>
        </section>

        <footer className={styles['chapter-footer']}>
          <Link href="/story/agentic" className={styles['handoff-link']}>
            Next: The agentic era →
          </Link>
        </footer>
      </main>
    </>
  )
}
