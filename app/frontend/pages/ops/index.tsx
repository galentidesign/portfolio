import { Head } from '@inertiajs/react'
import { Card } from '@/ds/components/Card/Card'
import { Table } from '@/ds/components/Table/Table'
import type { TableColumn } from '@/ds/components/Table/Table'
import styles from './styles.module.css'

// ── Props contract (mirrors OpsController#index) ─────────────────────────────

interface DailyEntry {
  day: string
  count: number
}

interface ReferrerEntry {
  referrer: string
  count: number
}

interface PathEntry {
  path: string
  count: number
}

export interface OpsProps {
  daily: DailyEntry[]
  topReferrers: ReferrerEntry[]
  topPaths: PathEntry[]
  storyVsSkim: {
    storyCompletes: number
    skimEntries: number
  }
  demo: {
    plays: number
    visits: number
  }
  resumeDownloads: number
  totals: {
    visits30d: number
  }
}

// ── Column definitions ────────────────────────────────────────────────────────

const DAILY_COLUMNS: readonly TableColumn<DailyEntry>[] = [
  { key: 'day', header: 'Day' },
  { key: 'count', header: 'Visits', align: 'end' },
]

const REFERRER_COLUMNS: readonly TableColumn<ReferrerEntry>[] = [
  { key: 'referrer', header: 'Referrer' },
  { key: 'count', header: 'Visits', align: 'end' },
]

const PATH_COLUMNS: readonly TableColumn<PathEntry>[] = [
  { key: 'path', header: 'Path' },
  { key: 'count', header: 'Views', align: 'end' },
]

// ── Empty state ───────────────────────────────────────────────────────────────

function EmptyState() {
  return <p className={styles.empty}>No data yet.</p>
}

// ── Page component ────────────────────────────────────────────────────────────

export default function OpsIndex({
  daily,
  topReferrers,
  topPaths,
  storyVsSkim,
  demo,
  resumeDownloads,
  totals,
}: OpsProps) {
  return (
    <>
      <Head title="Ops — J Galenti">
        <meta name="description" content="Private telemetry dashboard." />
      </Head>
      <main id="main" className={styles.page}>
        <div className={styles.container}>
          <h1 className={styles.heading}>Ops</h1>

          {/* Stat row */}
          <section className={styles['stat-row']} aria-label="Summary stats">
            <Card title="Visits 30d">
              <span className={styles['stat-value']}>{totals.visits30d}</span>
            </Card>
            <Card title="Demo plays">
              <span className={styles['stat-value']}>{demo.plays}</span>
            </Card>
            <Card title="Résumé downloads">
              <span className={styles['stat-value']}>{resumeDownloads}</span>
            </Card>
            <Card title="Story vs skim">
              <span className={styles['stat-value']}>
                {storyVsSkim.storyCompletes} story / {storyVsSkim.skimEntries} skim
              </span>
            </Card>
          </section>

          {/* Daily visits table */}
          <section className={styles.section} aria-labelledby="daily-heading">
            <h2 id="daily-heading" className={styles['section-heading']}>
              Daily visits (30d)
            </h2>
            <Table
              caption="Daily visits over the last 30 days"
              columns={DAILY_COLUMNS}
              rows={daily}
              rowKey={(row) => row.day}
              empty={<EmptyState />}
            />
          </section>

          {/* Top referrers table */}
          <section className={styles.section} aria-labelledby="referrers-heading">
            <h2 id="referrers-heading" className={styles['section-heading']}>
              Top referrers
            </h2>
            <Table
              caption="Top 10 referrers"
              columns={REFERRER_COLUMNS}
              rows={topReferrers}
              rowKey={(row) => row.referrer}
              empty={<EmptyState />}
            />
          </section>

          {/* Top paths table */}
          <section className={styles.section} aria-labelledby="paths-heading">
            <h2 id="paths-heading" className={styles['section-heading']}>
              Top paths
            </h2>
            <Table
              caption="Top 10 page paths"
              columns={PATH_COLUMNS}
              rows={topPaths}
              rowKey={(row) => row.path}
              empty={<EmptyState />}
            />
          </section>
        </div>
      </main>
    </>
  )
}
