import { Head, Link } from '@inertiajs/react'
import { Badge } from '@/ds/components/Badge/Badge'
import { Card } from '@/ds/components/Card/Card'
import { Table } from '@/ds/components/Table/Table'
import type { TableColumn } from '@/ds/components/Table/Table'
import { ProseSlot } from '@/studies/shared/ProseSlot'
import { TOKENS } from '@/studies/shadcn-to-polaris/tokens-map'
import { API_MAP } from '@/studies/shadcn-to-polaris/api-map'
import { A11Y_MAP } from '@/studies/shadcn-to-polaris/a11y-map'
import type { TokenRow, ApiRow, A11yRow, Classification } from '@/studies/shadcn-to-polaris/types'
import styles from './shadcn-to-polaris.module.css'

// ── Cell renderer helpers ─────────────────────────────────────────────────────
// Defined outside the component to avoid re-creation on each render.

const CLASSIFICATION_TONE: Record<Classification, 'positive' | 'critical' | 'neutral'> = {
  clean: 'positive',
  mismatch: 'critical',
  standardized: 'neutral',
}

function ClassificationBadge({ classification }: { classification: Classification }) {
  return <Badge tone={CLASSIFICATION_TONE[classification]}>{classification}</Badge>
}

function TokenName({ name }: { name: string }) {
  if (name === 'none') return <span className={styles['no-value']}>—</span>
  return <code className={styles['token-code']}>{name}</code>
}

function ValueCell({ value, swatch }: { value: string; swatch?: string }) {
  if (value === '—') return <span className={styles['no-value']}>—</span>
  if (!swatch) return <span className={styles['wrap-cell']}>{value}</span>
  return (
    <span className={styles['swatch-cell']}>
      {/* aria-hidden: text value is shown next to the swatch — color alone carries no info */}
      <span className={styles.swatch} style={{ backgroundColor: swatch }} aria-hidden="true" />
      <span>{value}</span>
    </span>
  )
}

// ── Column definitions ────────────────────────────────────────────────────────

const TOKEN_COLUMNS: readonly TableColumn<TokenRow>[] = [
  {
    key: 'sourceToken',
    header: 'CoBlend token',
    render: (row) => <TokenName name={row.sourceToken} />,
  },
  {
    key: 'sourceValue',
    header: 'Source value',
    render: (row) => <ValueCell value={row.sourceValue} swatch={row.swatchColor} />,
  },
  {
    key: 'polarisToken',
    header: 'Polaris token',
    render: (row) => <TokenName name={row.polarisToken} />,
  },
  {
    key: 'polarisValue',
    header: 'Polaris value',
    render: (row) => <ValueCell value={row.polarisValue} swatch={row.polarisSwatch} />,
  },
  {
    key: 'note',
    header: 'Note',
    render: (row) => <span className={styles['wrap-cell']}>{row.note}</span>,
  },
  {
    key: 'classification',
    header: 'Type',
    render: (row) => <ClassificationBadge classification={row.classification} />,
  },
]

const API_COLUMNS: readonly TableColumn<ApiRow>[] = [
  {
    key: 'component',
    header: 'Component',
    render: (row) => <strong>{row.component}</strong>,
  },
  {
    key: 'coBlendApi',
    header: 'CoBlend API',
    render: (row) => <span className={styles['wrap-cell']}>{row.coBlendApi}</span>,
  },
  {
    key: 'polarisComponent',
    header: 'Polaris component',
    render: (row) =>
      row.polarisComponent === 'none' ? (
        <span className={styles['no-value']}>—</span>
      ) : (
        <code className={styles['token-code']}>{row.polarisComponent}</code>
      ),
  },
  {
    key: 'polarisApi',
    header: 'Polaris API',
    render: (row) => <span className={styles['wrap-cell']}>{row.polarisApi}</span>,
  },
  {
    key: 'note',
    header: 'Note',
    render: (row) => <span className={styles['wrap-cell']}>{row.note}</span>,
  },
  {
    key: 'classification',
    header: 'Type',
    render: (row) => <ClassificationBadge classification={row.classification} />,
  },
]

const A11Y_COLUMNS: readonly TableColumn<A11yRow>[] = [
  {
    key: 'concern',
    header: 'A11y concern',
    render: (row) => <span className={styles['wrap-cell']}>{row.concern}</span>,
  },
  {
    key: 'coBlendBehavior',
    header: 'CoBlend',
    render: (row) => <span className={styles['wrap-cell']}>{row.coBlendBehavior}</span>,
  },
  {
    key: 'polarisBehavior',
    header: 'Polaris',
    render: (row) => <span className={styles['wrap-cell']}>{row.polarisBehavior}</span>,
  },
  {
    key: 'note',
    header: 'Note',
    render: (row) => <span className={styles['wrap-cell']}>{row.note}</span>,
  },
  {
    key: 'classification',
    header: 'Type',
    render: (row) => <ClassificationBadge classification={row.classification} />,
  },
]

// ── Page component ────────────────────────────────────────────────────────────

export default function ShadcnToPolaris() {
  return (
    <>
      <Head title="shadcn → Polaris — J Galenti">
        <meta
          name="description"
          content="Case study: migrating a shadcn/Tailwind flow to Shopify Polaris — token translation, component API mapping, the a11y layer, and a live demo."
        />
      </Head>
      <main id="main" className={styles.page}>
        <div className={styles.container}>
          <Link href="/work" className={styles['back-link']}>
            ← Back to the work
          </Link>

          <h1 className={styles.heading}>shadcn → Polaris</h1>
          <p className={styles.subhead}>
            Migration study: CoBlend Chores flow from shadcn/Tailwind v4 to Polaris 13.
          </p>

          {/* ── 1. Philosophy gap framing ─────────────────────────────────────── */}
          <section className={styles.section} aria-labelledby="framing-heading">
            <h2 id="framing-heading" className={styles['section-heading']}>
              Philosophy gap
            </h2>
            <ProseSlot id="study-b/framing">
              copy-in/unstyled vs. governed/central — 2–3 paragraphs, ~300 words
            </ProseSlot>
          </section>

          {/* ── 2. Token translation table ───────────────────────────────────── */}
          <section className={styles.section} aria-labelledby="tokens-heading">
            <h2 id="tokens-heading" className={styles['section-heading']}>
              Token translation
            </h2>
            <div className={styles['table-wrapper']}>
              <Table
                caption="Token translation: CoBlend shadcn/Tailwind tokens mapped to Polaris tokens"
                captionHidden={false}
                columns={TOKEN_COLUMNS}
                rows={TOKENS}
                rowKey={(row) => row.id}
              />
            </div>
          </section>

          {/* ── 3. Component API mapping ─────────────────────────────────────── */}
          <section className={styles.section} aria-labelledby="api-heading">
            <h2 id="api-heading" className={styles['section-heading']}>
              Component API mapping
            </h2>
            <div className={styles['table-wrapper']}>
              <Table
                caption="Component API mapping: Chores flow components in CoBlend vs. Polaris equivalents"
                captionHidden={false}
                columns={API_COLUMNS}
                rows={API_MAP}
                rowKey={(row) => row.id}
              />
            </div>
          </section>

          {/* ── 4. Governance narrative ──────────────────────────────────────── */}
          <section className={styles.section} aria-labelledby="governance-heading">
            <h2 id="governance-heading" className={styles['section-heading']}>
              Governance model
            </h2>
            <ProseSlot id="study-b/governance">
              central token authority, PR review cadence, design-eng sync — ~250 words
            </ProseSlot>
          </section>

          {/* ── 5. A11y layer ───────────────────────────────────────────────── */}
          <section className={styles.section} aria-labelledby="a11y-heading">
            <h2 id="a11y-heading" className={styles['section-heading']}>
              Accessibility layer
            </h2>
            <div className={styles['table-wrapper']}>
              <Table
                caption="Accessibility analysis: WCAG 2.1 AA concerns in the Chores flow"
                captionHidden={false}
                columns={A11Y_COLUMNS}
                rows={A11Y_MAP}
                rowKey={(row) => row.id}
              />
            </div>
            <div className={styles['prose-gap']}>
              <ProseSlot id="study-b/a11y">
                two gaps (ToggleGroup semantics + dnd-kit keyboard), one resolved by migration, one
                open on both platforms — ~150 words
              </ProseSlot>
            </div>
          </section>

          {/* ── 6. Framework-agnostic close ─────────────────────────────────── */}
          <section className={styles.section} aria-labelledby="close-heading">
            <h2 id="close-heading" className={styles['section-heading']}>
              Framework-agnostic close
            </h2>
            <ProseSlot id="study-b/framework-close">
              Polaris web-components move — token layer survives framework swap — ~150 words
            </ProseSlot>
          </section>

          {/* ── 7. Live demo entry ──────────────────────────────────────────── */}
          <section className={styles['demo-section']} aria-labelledby="demo-heading">
            <h2 id="demo-heading" className={styles['section-heading']}>
              Live demo
            </h2>
            <Card
              href="/work/shadcn-to-polaris/demo"
              title="Chores flow — Polaris rebuild"
              footer="Open the demo →"
            >
              Index, Create, and Edit views rebuilt with real Polaris 13 components. Four states:
              success, loading, empty, error.
            </Card>
            <p className={styles['demo-note']}>
              Polaris and its CSS load only on the demo route — no style bleed onto the rest of the
              site.
            </p>
          </section>
        </div>
      </main>
    </>
  )
}
