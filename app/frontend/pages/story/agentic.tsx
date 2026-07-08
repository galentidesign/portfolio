import { useEffect, useRef } from 'react'
import { Head, Link } from '@inertiajs/react'
import { ScrollProgress } from '@/shell/story/ScrollProgress'
import { EraRetheme } from '@/story/retheme'
import { Prose } from '@/ds/components/Prose/Prose'
import { Receipts } from '@/story/receipts/Receipts'
import { NightBoundary } from '@/story/night/NightBoundary'
import { OrchestrationMap } from '@/story/night/OrchestrationMap'
import { track } from '@/telemetry/track'
import { CONTACT_EMAIL, LINKEDIN_URL } from '@/shell/contact'
import styles from './story.module.css'
import noteStyles from './era-note.module.css'
import nightStyles from '@/story/night/night.module.css'

const ERA_FONTS = ['Hanken Grotesk', 'JetBrains Mono'] as const

// Terminal-boot caption — streamed line by line inside the crossing band.
const KILN_BOOT = [
  '$ session start — kiln',
  '▸ agents: fleet ready',
  '▸ receipts: streaming',
] as const

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
      <main id="main" className={[styles.chapter, styles['chapter-resolve']].join(' ')}>
        <EraRetheme skin="agentic" treatment="terminal" caption={KILN_BOOT} warmFonts={ERA_FONTS}>
          <ScrollProgress />

          {/* Settle cascade groups (era-crossing): chrome → type → bare.
              The chapter body keeps its own motion (receipts, map, dawn
              boundary) — only the chapter frame joins the settle. */}

          <header className={styles['chapter-header']} data-retheme-stagger="type">
            <p className={styles['chapter-label']}>Chapter 3 · 2023–now</p>
            <h1 className={styles['chapter-title']}>The agentic era</h1>
          </header>

          <aside
            className={noteStyles.note}
            aria-label="Skin engine note"
            data-retheme-stagger="chrome"
          >
            <p className={noteStyles['note-text']}>
              This chapter wears the era&rsquo;s own skin by design — the era it describes is the
              one that built the engine itself — and the brand returns at the close.{' '}
              <Link href="/system/skins">See the skin engine →</Link>
            </p>
          </aside>

          {/* The chapter body renders directly on the agentic skin — the
              entry crossing (EraRetheme) is the descent into the kiln; no
              interim zone wrapper doubles it. */}
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
            <Prose>
              <p>The receipts above are the evidence. This section is the method behind them.</p>
              <p>
                One orchestrator owns the session. It plans the milestone, builds the shared pieces
                the parallel agents would collide on first (routes, migrations, shared chrome, the
                contract doc), then hands each agent one task, with the model size matched to the
                work: the biggest models for design judgment and architecture, mid-size for features
                with clear specs, small ones for the mechanical template stuff.
              </p>
              <p>
                The contract docs do the coordination. Parallel agents never see each other; they
                build against those pinned docs and meet at integration with almost no rework. The
                orchestrator runs the integration itself; each agent only checks its own files.
              </p>
              <p>
                Passing tests turned out to be nowhere near enough. Every session’s real catches
                came from looking at the actual output (screenshots, served HTML, headers on the
                wire) after the test suites had already passed. So the rule became: check the real
                thing in the environment that actually ships, even when a more convenient one is
                sitting right there.
              </p>
              <p>
                And the work logs itself as it happens. Every session appends its receipt (agents
                used, what broke, what the review caught) before it closes, because a receipt
                reconstructed later is mostly fiction with good intentions. Eleven sessions of those
                receipts sit above this paragraph, and the craft numbers they produced are on the{' '}
                <Link href="/colophon">colophon</Link>.
              </p>
            </Prose>
            <OrchestrationMap />
          </section>

          {/* The resolve-to-brand beat: a dawn crossing rises out of the kiln
              into the skin's day zone — galenti's cream returns for the
              outro. The boundary is decorative; headings and tab order are
              untouched. */}
          <NightBoundary direction="exit" />

          <div className={nightStyles.resolve} data-zone="day" data-testid="day-zone">
            <footer
              ref={outroRef}
              className={styles['chapter-footer']}
              data-testid="story-outro"
              data-retheme-stagger
            >
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
          </div>
        </EraRetheme>
      </main>
    </>
  )
}
