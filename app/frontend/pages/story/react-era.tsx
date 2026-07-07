import { Head, Link } from '@inertiajs/react'
import { ScrollProgress } from '@/shell/story/ScrollProgress'
import { Prose } from '@/ds/components/Prose/Prose'
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
          <Prose>
            <p>
              React changed my unit of thought from pages to components, and components changed the
              question from “what does this screen look like” to “where do visual decisions live.”
              The answer that stuck: not in the components. Colors, type, spacing, radii, and motion
              all moved out into tokens, and the components became consumers of decisions instead of
              owners of them. That inversion is the engine this site runs on right now. Chapter 1
              re-themed itself by swapping one JSON file while the components sat still. That’s the
              token engine story in one move.
            </p>
          </Prose>
        </section>

        <section aria-labelledby="react-era-systems" className={styles.section}>
          <h2 id="react-era-systems" className={styles['section-heading']}>
            Systems and components
          </h2>
          <Prose>
            <p>
              Those years, the pattern repeated everywhere I worked: the first version of every app
              is a pile of components, and the second version is a system, if anyone stops to build
              it. I became the person who stops. Prop APIs got design reviews the way screens did.
              States (loading, empty, error, the ones nobody mocks up) got designed on purpose. And
              the design system stopped being a Figma file that engineering politely ignored: it
              became the shared contract both sides shipped from. That conviction, that tokens and
              components outlive any single framework, is what Chapter 3 runs with.
            </p>
          </Prose>
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
