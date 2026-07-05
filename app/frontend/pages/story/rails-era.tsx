import { Head, Link } from '@inertiajs/react'
import { ScrollProgress } from '@/shell/story/ScrollProgress'
import styles from './story.module.css'

export default function RailsEra() {
  return (
    <>
      <Head title="The Rails era — J Galenti" />
      <main id="main" className={styles.chapter}>
        <ScrollProgress />

        <header className={styles['chapter-header']}>
          <p className={styles['chapter-label']}>Chapter 1 · 2014–2019</p>
          <h1 className={styles['chapter-title']}>The Rails era</h1>
        </header>

        <section aria-labelledby="rails-era-artifacts" className={styles.section}>
          <h2 id="rails-era-artifacts" className={styles['section-heading']}>
            Era artifacts
          </h2>
          <p className={styles.annotation}>era artifacts + the re-theme moment — lands with M6</p>
          <p className={styles.annotation}>
            this chapter will re-theme the whole site to the rails-era skin
          </p>
        </section>

        <section aria-labelledby="rails-era-context" className={styles.section}>
          <h2 id="rails-era-context" className={styles['section-heading']}>
            The product years
          </h2>
          <p className={styles.annotation}>dense product context — lands with M6</p>
        </section>

        <footer className={styles['chapter-footer']}>
          <Link href="/story/react-era" className={styles['handoff-link']}>
            Next: The React era →
          </Link>
        </footer>
      </main>
    </>
  )
}
