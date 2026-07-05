import { Head, Link } from '@inertiajs/react'
import { ScrollProgress } from '@/shell/story/ScrollProgress'
import styles from './story.module.css'
import noteStyles from './era-note.module.css'

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

        <aside className={noteStyles.note} aria-label="Skin engine note">
          <p className={noteStyles['note-text']}>
            This chapter renders in the site's own skin — a react-era skin ships v1.5. The engine
            underneath is already live: every skin is one JSON file.{' '}
            <Link href="/system/skins">See the skin engine →</Link>
          </p>
        </aside>

        <section aria-labelledby="react-era-engine" className={styles.section}>
          <h2 id="react-era-engine" className={styles['section-heading']}>
            The token engine
          </h2>
          <p className={styles.annotation}>
            the token engine story — content workstream (portfolio-spec Task 2)
          </p>
        </section>

        <section aria-labelledby="react-era-systems" className={styles.section}>
          <h2 id="react-era-systems" className={styles['section-heading']}>
            Systems and components
          </h2>
          <p className={styles.annotation}>
            the system behind the system — content workstream (portfolio-spec Task 2)
          </p>
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
