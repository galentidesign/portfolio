import { Head, Link } from '@inertiajs/react'
import { ScrollProgress } from '@/shell/story/ScrollProgress'
import { EraRetheme } from '@/story/retheme'
import { Button } from '@/ds/components/Button/Button'
import { FormField } from '@/ds/components/FormField/FormField'
import { Table, type TableColumn } from '@/ds/components/Table/Table'
import { Badge } from '@/ds/components/Badge/Badge'
import styles from './story.module.css'
import chapter from './rails-era.module.css'

const ERA_FONTS = ['Source Sans 3', 'Source Code Pro'] as const

// ── Fictional project-tracker data ────────────────────────────────────────────
// Era-plausible content; no real employers or products.

interface ProjectRow {
  project: string
  owner: string
  status: string
  statusTone: 'neutral' | 'accent' | 'positive' | 'caution' | 'critical'
  updated: string
}

const PROJECT_COLUMNS: readonly TableColumn<ProjectRow>[] = [
  { key: 'project', header: 'Project' },
  { key: 'owner', header: 'Owner' },
  {
    key: 'status',
    header: 'Status',
    render: (row) => <Badge tone={row.statusTone}>{row.status}</Badge>,
  },
  { key: 'updated', header: 'Updated', align: 'end' },
]

const PROJECT_ROWS: readonly ProjectRow[] = [
  {
    project: 'Trackside',
    owner: 'A. Morris',
    status: 'Active',
    statusTone: 'positive',
    updated: 'Mar 12, 2015',
  },
  {
    project: 'Velocity',
    owner: 'T. Chen',
    status: 'Active',
    statusTone: 'positive',
    updated: 'Jan 08, 2015',
  },
  {
    project: 'Compass',
    owner: 'R. Patel',
    status: 'On hold',
    statusTone: 'caution',
    updated: 'Nov 30, 2014',
  },
  {
    project: 'Fieldwork',
    owner: 'A. Morris',
    status: 'Shipped',
    statusTone: 'accent',
    updated: 'Sep 22, 2014',
  },
  {
    project: 'Shortline',
    owner: 'S. Wong',
    status: 'Active',
    statusTone: 'positive',
    updated: 'Jul 14, 2014',
  },
  {
    project: 'Apex',
    owner: 'T. Chen',
    status: 'Closed',
    statusTone: 'neutral',
    updated: 'Apr 03, 2014',
  },
]

const ERA_STACK = ['Rails 4.x', 'ERB', 'jQuery', 'Bootstrap 3', 'Capistrano', 'MySQL']

export default function RailsEra() {
  return (
    <>
      <Head title="The Rails era — J Galenti" />
      <main id="main" className={styles.chapter}>
        <EraRetheme skin="rails-era" warmFonts={ERA_FONTS}>
          <ScrollProgress />

          <header className={styles['chapter-header']} data-retheme-stagger>
            <p className={styles['chapter-label']}>Chapter 1 · 2014–2019</p>
            <h1 className={styles['chapter-title']}>The Rails era</h1>
          </header>

          {/* ── Section 1: Era artifacts ──────────────────────────────────── */}

          <section
            aria-labelledby="rails-era-artifacts"
            className={chapter['section-wide']}
            data-retheme-stagger
          >
            <h2
              id="rails-era-artifacts"
              className={[styles['section-heading'], chapter['prose-width']].join(' ')}
            >
              Era artifacts
            </h2>

            <figure className={chapter['artifact-figure']}>
              {/* Browser chrome frame — the era in a snapshot */}
              <div className={chapter['artifact-frame']}>
                {/* Chrome title bar is purely decorative chrome */}
                <div className={chapter['chrome-bar']} aria-hidden="true">
                  <span className={chapter['chrome-dots']}>
                    <span className={chapter['chrome-dot']} />
                    <span className={chapter['chrome-dot']} />
                    <span className={chapter['chrome-dot']} />
                  </span>
                  <span className={chapter['chrome-address']}>
                    http://trackside.example.com/projects
                  </span>
                </div>

                {/* Inert exhibit: live DS components rendered as evidence,
                    not controls. The figcaption below carries the narrative. */}
                <div inert className={chapter['exhibit-body']} data-testid="artifact-exhibit">
                  <div className={chapter.toolbar}>
                    <Button>New project</Button>
                    <Button variant="secondary">Export CSV</Button>
                    <FormField label="Filter projects" placeholder="Search…" />
                  </div>
                  <Table
                    caption="Project tracker"
                    captionHidden={false}
                    columns={PROJECT_COLUMNS}
                    rows={PROJECT_ROWS}
                    rowKey={(row) => row.project}
                  />
                </div>
              </div>

              <figcaption className={chapter['frame-caption']}>
                Same Button, same Table, same tokens as everywhere else on this site — re-tokened by
                one JSON file.
              </figcaption>
            </figure>

            <p className={[styles.annotation, chapter['prose-width']].join(' ')}>
              era narrative prose — content workstream (portfolio-spec Task 2)
            </p>
          </section>

          {/* ── Section 2: The product years ─────────────────────────────── */}

          <section
            aria-labelledby="rails-era-context"
            className={styles.section}
            data-retheme-stagger
          >
            <h2 id="rails-era-context" className={styles['section-heading']}>
              The product years
            </h2>

            <ul className={chapter['stack-strip']} role="list">
              {ERA_STACK.map((tech) => (
                <li key={tech} className={chapter['stack-item']}>
                  {tech}
                </li>
              ))}
            </ul>

            <p className={styles.annotation}>
              era context prose — content workstream (portfolio-spec Task 2)
            </p>
            <p className={styles.annotation}>
              product years detail — content workstream (portfolio-spec Task 2)
            </p>
          </section>

          <footer className={styles['chapter-footer']}>
            <Link href="/story/react-era" className={styles['handoff-link']}>
              Next: The React era →
            </Link>
          </footer>
        </EraRetheme>
      </main>
    </>
  )
}
