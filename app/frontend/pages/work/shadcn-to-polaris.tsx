import { Head, Link } from '@inertiajs/react'
import { Badge } from '@/ds/components/Badge/Badge'
import { Card } from '@/ds/components/Card/Card'
import { Table } from '@/ds/components/Table/Table'
import type { TableColumn } from '@/ds/components/Table/Table'
import { Prose } from '@/ds/components/Prose/Prose'
import { useFx } from '@/ds/motion/useFx'
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
  // Scroll-enter rise on the below-fold sections only — the heading (the LCP
  // element) never carries a reveal target, per the /work placement rule.
  const revealRef = useFx<HTMLDivElement>((fx, el) =>
    fx.mountReveal(el, { selector: '[data-reveal]' }),
  )

  return (
    <>
      <Head title="shadcn → Polaris — J Galenti">
        <meta
          name="description"
          content="Case study: migrating a shadcn/Tailwind flow to Shopify Polaris — token translation, component API mapping, the a11y layer, and a live demo."
        />
      </Head>
      <main id="main" className={styles.page}>
        <div ref={revealRef} className={styles.container}>
          <Link href="/work" className={styles['back-link']}>
            ← Back to the work
          </Link>

          <h1 className={styles.heading}>shadcn → Polaris</h1>
          <p className={styles.subhead}>
            Migration study: CoBlend Chores flow from shadcn/Tailwind v4 to Polaris 13.
          </p>

          {/* ── 1. Philosophy gap framing ─────────────────────────────────────── */}
          <section className={styles.section} data-reveal aria-labelledby="framing-heading">
            <h2 id="framing-heading" className={styles['section-heading']}>
              Philosophy gap
            </h2>
            <Prose>
              <p>
                shadcn and Polaris aren’t just two component libraries with different looks. They’re
                opposite answers to where design decisions should live. shadcn is copy-in by design:
                you vendor the source, own every file, and style with Tailwind utilities right at
                the point of use, so control is total and local. Polaris sits at the other pole: a
                governed, centralized system where the tokens and component APIs are the deal you
                sign up for, the defaults carry strong opinions, and consistency is enforced
                centrally, before it ever reaches a product team. One is made for a small team
                moving fast, the other for hundreds of teams that can’t be allowed to drift apart.
              </p>
              <p>
                CoBlend is my own product, a Laravel/Inertia/React app with a UI built on shadcn and
                Tailwind v4, which makes it an honest migration subject: I own both the before and
                the after, and the “before” carries the real accumulated decisions of a shipping app
                rather than a demo’s clean slate. The Chores flow was the right one to lead with:
                it’s data-dense, it has four real states (success, loading, empty, error), it
                touches most of the system (tables, forms, modals, toggles), and it has real
                accessibility work in it.
              </p>
              <p>
                Migrating between these two philosophies means the interesting work is mostly
                invisible. Every Tailwind value has to find its place in Polaris’s semantic tokens,
                or get called out as a local invention that shouldn’t survive the move. Every
                hand-rolled control has to map to a Polaris component, or it exposes a spot where
                local control was quietly covering for a missing pattern. The tables below document
                both mappings honestly, mismatches included. The mismatches are where the two
                philosophies actually argue, and they taught me more than the clean rows did.
              </p>
            </Prose>
          </section>

          {/* ── 2. Token translation table ───────────────────────────────────── */}
          <section className={styles.section} data-reveal aria-labelledby="tokens-heading">
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
          <section className={styles.section} data-reveal aria-labelledby="api-heading">
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
          <section className={styles.section} data-reveal aria-labelledby="governance-heading">
            <h2 id="governance-heading" className={styles['section-heading']}>
              Governance model
            </h2>
            <Prose>
              <p>
                In the shadcn version, governance is a social convention. Every component is local
                source, so any override is just an edit, and nothing structural stops utility values
                from drifting away from the system. A one-off <code>px-[13px]</code> ships as easily
                as the right spacing token. To be fair, that’s the model working as intended. It’s
                also exactly what breaks down once more than one team touches the code.
              </p>
              <p>
                The Polaris version changes where decisions get made. Tokens are the single
                authority for color, space, and type; components pull from them; and a value that
                isn’t in the token set is a design decision nobody has made yet, a nudge to go make
                it properly rather than something to hand-roll inline. Component behavior is owned
                centrally, which turns an override into what it should have been all along: an
                exception that gets reviewed.
              </p>
              <p>
                Process-wise, three things stay standing after the migration: a central token
                authority (additions go through the system, not around it), regular PR review where
                one-off deviations from system components get flagged and either folded back into
                the system or reverted, and a recurring design-engineering sync where the component
                API is a shared agreement: both sides can change it, neither side can quietly go
                around it.
              </p>
              <p>
                The trade is real: local flexibility gets slower. At one team’s scale you barely
                feel the win. At the scale Polaris was built for, that win is the reason the system
                exists. The Chores flow shows what paying that cost on purpose actually looks like.
              </p>
            </Prose>
          </section>

          {/* ── 5. A11y layer ───────────────────────────────────────────────── */}
          <section className={styles.section} data-reveal aria-labelledby="a11y-heading">
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
              <Prose>
                <p>
                  Two gaps in the table are worth calling out, because they end two different ways.
                  The hand-rolled ToggleGroup renders plain buttons: no radiogroup role, no{' '}
                  <code>aria-checked</code>, no arrow-key navigation, every option its own tab stop.
                  Migrating to Polaris ChoiceList fixes this for real, because the system ships the
                  radiogroup pattern by default. That’s about the strongest practical argument for a
                  governed system I know of.
                </p>
                <p>
                  The second gap survives the migration untouched. Step reordering uses dnd-kit with
                  only a PointerSensor registered (pointer-only, a WCAG 2.1.1 failure), and Polaris
                  has no drag-and-drop component to inherit a fix from. A keyboard reorder path has
                  to be built by hand on either platform. That’s the honest limit of any migration:
                  the new system fixes what it covers, and you keep owning everything it doesn’t.
                </p>
              </Prose>
            </div>
          </section>

          {/* ── 6. Framework-agnostic close ─────────────────────────────────── */}
          <section className={styles.section} data-reveal aria-labelledby="close-heading">
            <h2 id="close-heading" className={styles['section-heading']}>
              Framework-agnostic close
            </h2>
            <Prose>
              <p>
                Back in 2019 I bet on web components as the way design systems would outlive their
                frameworks, and I spent years feeling early. Then in late 2025, Polaris began its
                own move to web components: the industry’s most opinionated React system deciding
                the framework layer should be swappable after all. I felt that.
              </p>
              <p>
                The bigger lesson isn’t about any one library: the tokens are the actual system, and
                components just render decisions that were already made. When the tokens are the
                thing everyone agrees on, swapping frameworks is closer to a re-render than a
                rewrite. That’s how this site works too: one JSON token source compiling out to CSS
                custom properties and Figma variables alike. Rails, React, web components…the stack
                under me keeps changing, and the systems thinking is the part that’s transferred
                every time.
              </p>
            </Prose>
          </section>

          {/* ── 7. Live demo entry ──────────────────────────────────────────── */}
          <section className={styles['demo-section']} data-reveal aria-labelledby="demo-heading">
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
