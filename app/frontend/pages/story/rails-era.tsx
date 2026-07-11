import { Head, Link } from '@inertiajs/react'
import { ScrollProgress } from '@/shell/story/ScrollProgress'
import { EraRetheme } from '@/story/retheme'
import { RailsArtifact } from '@/story/artifacts/RailsArtifact'
import { Prose } from '@/ds/components/Prose/Prose'
import styles from './story.module.css'
import chapter from './rails-era.module.css'

const ERA_FONTS = ['Source Sans 3', 'Source Code Pro'] as const

const ERA_STACK = ['Rails 4.x', 'ERB', 'jQuery', 'Bootstrap 3', 'Capistrano', 'MySQL']

export default function RailsEra() {
  return (
    <>
      <Head title="The Rails era — J Galenti">
        <meta
          name="description"
          content="Chapter one, 2014–2019: shipping product on Rails — the era artifact rebuilt from this site's own design system, wearing its period skin."
        />
      </Head>
      <main id="main" className={styles.chapter}>
        <EraRetheme skin="rails-era" warmFonts={ERA_FONTS} caption="loading 2014…">
          <ScrollProgress />

          {/* Settle cascade groups (era-crossing): chrome → type → surface.
              The bare attribute on the footer ranks last, keeping the DOM-final
              target the choreography-complete marker the e2e suite waits on. */}

          <header className={styles['chapter-header']} data-retheme-stagger="type">
            <p className={styles['chapter-label']}>Chapter 1 · 2014–2019</p>
            <h1 className={styles['chapter-title']}>The Rails era</h1>
          </header>

          {/* ── Section 1: Era artifacts ──────────────────────────────────── */}

          <section aria-labelledby="rails-era-artifacts" className={chapter['section-wide']}>
            <h2
              id="rails-era-artifacts"
              className={[styles['section-heading'], chapter['prose-width']].join(' ')}
              data-retheme-stagger="type"
            >
              Era artifacts
            </h2>

            <figure className={chapter['artifact-figure']}>
              {/* Browser chrome frame — the era in a snapshot (shared with
                  the home story's era beat; see story/artifacts/) */}
              <RailsArtifact />

              <figcaption className={chapter['frame-caption']} data-retheme-stagger="type">
                Same Button, same Table, same tokens as everywhere else on this site — re-tokened by
                one JSON file.
              </figcaption>
            </figure>

            <div className={chapter['prose-width']} data-retheme-stagger="type">
              <Prose>
                <p>
                  This is where the obsession started. Server-rendered Rails, ERB partials, and a
                  growing pile of screens that needed to agree with each other. The instinct that
                  became everything later was simple: if two screens share a control, they should
                  share the code for it. Partials became my component library before I knew to call
                  it that, and the stylesheet became a fight I kept losing until the pieces got
                  names and rules. The tracker above is a recreation, but the muscle memory is real:
                  dense tables, small controls, screens people stared at all day, so every spacing
                  decision mattered.
                </p>
              </Prose>
            </div>
          </section>

          {/* ── Section 2: The product years ─────────────────────────────── */}

          <section aria-labelledby="rails-era-context" className={styles.section}>
            <h2
              id="rails-era-context"
              className={styles['section-heading']}
              data-retheme-stagger="type"
            >
              The product years
            </h2>

            <ul className={chapter['stack-strip']} role="list" data-retheme-stagger="chrome">
              {ERA_STACK.map((tech) => (
                <li key={tech} className={chapter['stack-item']}>
                  {tech}
                </li>
              ))}
            </ul>

            <div data-retheme-stagger="type">
              <Prose>
                <p>
                  The stack strip above is the honest version: Rails 4, ERB, jQuery, Bootstrap 3
                  with the serial numbers filed off, Capistrano deploys, MySQL underneath. Web work
                  in 2014 meant the server owned the truth and the browser decorated it. I learned
                  systems thinking there precisely because the tools didn’t hand it to you.
                  Consistency was something you built and defended, not something you installed.
                </p>
                <p>
                  Those were product years: real users, real deadlines, and interfaces that had to
                  earn their keep. What survived from them isn’t the stack, it’s the habits. Name
                  the pattern before you need it twice. Keep the density high and the cognition low.
                  And write the styles like someone else will inherit them, because someone else
                  always does.
                </p>
              </Prose>
            </div>
          </section>

          <footer className={styles['chapter-footer']} data-retheme-stagger>
            <Link href="/story/react-era" className={styles['handoff-link']}>
              Next: The React era →
            </Link>
          </footer>
        </EraRetheme>
      </main>
    </>
  )
}
