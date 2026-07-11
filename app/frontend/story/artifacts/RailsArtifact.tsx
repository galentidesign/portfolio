import { Button } from '@/ds/components/Button/Button'
import { FormField } from '@/ds/components/FormField/FormField'
import { Table, type TableColumn } from '@/ds/components/Table/Table'
import { Badge } from '@/ds/components/Badge/Badge'
import styles from './railsArtifact.module.css'

// ── Fictional project-tracker data ────────────────────────────────────────────
// Era-plausible content; no real employers or products. Extracted verbatim
// from the rails-era chapter so the home beat and the deep-dive share one
// artifact (and its settle-cascade attributes).

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

/**
 * The 2014 browser-chrome frame: live inert DS components rendered as
 * evidence, not controls. Consumers own the surrounding figure/figcaption;
 * the settle-cascade attributes (chrome bar, exhibit surface) ride inside so
 * both the chapter crossing and the home scroll crossing choreograph it.
 */
export function RailsArtifact() {
  return (
    <div className={styles['artifact-frame']}>
      {/* Chrome title bar is purely decorative chrome */}
      <div className={styles['chrome-bar']} aria-hidden="true" data-retheme-stagger="chrome">
        <span className={styles['chrome-dots']}>
          <span className={styles['chrome-dot']} />
          <span className={styles['chrome-dot']} />
          <span className={styles['chrome-dot']} />
        </span>
        <span className={styles['chrome-address']}>http://trackside.example.com/projects</span>
      </div>

      {/* Inert exhibit: live DS components rendered as evidence, not
          controls. The consumer's figcaption carries the narrative. */}
      <div
        inert
        className={styles['exhibit-body']}
        data-testid="artifact-exhibit"
        data-retheme-stagger="surface"
      >
        <div className={styles.toolbar}>
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
  )
}

export default RailsArtifact
