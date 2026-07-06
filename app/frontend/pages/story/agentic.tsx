import { useEffect, useRef } from 'react'
import { Head, Link } from '@inertiajs/react'
import { ScrollProgress } from '@/shell/story/ScrollProgress'
import { Receipts } from '@/story/receipts/Receipts'
import { track } from '@/telemetry/track'
import { CONTACT_EMAIL, LINKEDIN_URL } from '@/shell/contact'
import styles from './story.module.css'
import noteStyles from './era-note.module.css'

export default function Agentic() {
  const outroRef = useRef<HTMLElement>(null)

  // Fire story_complete once per pageload when the chapter footer first enters
  // the viewport. IntersectionObserver is guarded for jsdom (test) environments.
  useEffect(() => {
    const el = outroRef.current
    if (!el || typeof IntersectionObserver === 'undefined') return

    let fired = false
    const observer = new IntersectionObserver((entries) => {
      if (fired) return
      if (entries.some((e) => e.isIntersecting)) {
        fired = true
        track('story_complete', { chapter: 'agentic' })
      }
    })
    observer.observe(el)
    return () => {
      observer.disconnect()
    }
  }, [])

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
          <Receipts />
        </section>

        <section aria-labelledby="agentic-playbook" className={styles.section}>
          <h2 id="agentic-playbook" className={styles['section-heading']}>
            The agentic playbook
          </h2>
          <p className={styles.annotation}>
            agentic design-ops playbook — content workstream (portfolio-spec Task 2)
          </p>
        </section>

        <footer ref={outroRef} className={styles['chapter-footer']} data-testid="story-outro">
          <div className={styles['outro-links']}>
            <a href={`mailto:${CONTACT_EMAIL}`} className={styles['handoff-link']}>
              {CONTACT_EMAIL}
            </a>
            <a
              href={LINKEDIN_URL}
              target="_blank"
              rel="noopener noreferrer"
              className={styles['handoff-link']}
            >
              LinkedIn →
            </a>
            <Link href="/work" className={styles['handoff-link']}>
              See the work →
            </Link>
          </div>
        </footer>
      </main>
    </>
  )
}
