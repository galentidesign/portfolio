import { Head, Link } from '@inertiajs/react'
import styles from './styles.module.css'

// ── Craft data types (mirrors data/craft.json produced by rake craft:capture) ─

interface LighthousePresetSummary {
  performance?: number
  accessibility?: number
  bestPractices?: number
  seo?: number
}

interface LighthouseSummary {
  mobile?: LighthousePresetSummary
  desktop?: LighthousePresetSummary
  routes?: number
}

interface LighthouseData {
  base?: string
  capturedAt?: string
  min?: number
  summary?: LighthouseSummary
}

interface TestCounts {
  rspec?: number
  vitest?: number
  e2e?: number
}

interface FpsEntry {
  label: string
  fps: number
}

interface CraftData {
  lighthouse?: LighthouseData
  tests?: TestCounts
  axe?: { violations: number; scope: string; enforcement: string }
  fps?: FpsEntry[]
  ci?: string
  generatedAt?: string
}

interface Props {
  craft: CraftData | null
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function captureDate(capturedAt: string | undefined): string {
  if (!capturedAt) return ''
  return capturedAt.slice(0, 10)
}

// ── Sub-components ────────────────────────────────────────────────────────────

function LighthousePreset({ label, summary }: { label: string; summary: LighthousePresetSummary }) {
  const scores = [
    { key: 'performance', label: 'Perf' },
    { key: 'accessibility', label: 'A11y' },
    { key: 'bestPractices', label: 'Best-practices' },
    { key: 'seo', label: 'SEO' },
  ] as const

  const visibleScores = scores.filter(
    ({ key }) => summary[key as keyof LighthousePresetSummary] !== undefined,
  )
  if (visibleScores.length === 0) return null

  return (
    <div className={styles['lighthouse-preset']}>
      <span className={styles['lighthouse-preset-label']}>{label}</span>
      <div className={styles['lighthouse-scores']}>
        {visibleScores.map(({ key, label: scoreLabel }) => (
          <div key={key} className={styles['lighthouse-score']}>
            <span className={styles['lighthouse-score-value']}>
              {summary[key as keyof LighthousePresetSummary]}
            </span>
            <span className={styles['lighthouse-score-label']}>{scoreLabel}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function Colophon({ craft }: Props) {
  const ciUrl = craft?.ci ?? 'https://github.com/galentidesign/portfolio/actions'
  const capturedAt = craft?.lighthouse?.capturedAt
  const base = craft?.lighthouse?.base

  return (
    <>
      <Head title="Colophon — J Galenti">
        <meta
          name="description"
          content="How jgalenti.com is built: stack, craft-bar numbers, privacy policy, type, licenses, and the agentic build process."
        />
      </Head>
      <main id="main" className={styles.page}>
        <div className={styles.container}>
          <h1 className={styles.heading}>Colophon</h1>

          {/* ── Stack ── */}
          <section aria-label="Stack" className={styles.section}>
            <h2 className={styles['section-heading']}>Stack</h2>
            <ul className={styles['stack-list']}>
              {[
                'Rails 8.1',
                'Inertia',
                'React 19',
                'TypeScript',
                'Vite',
                'PostgreSQL',
                'CSS Modules over compiled design tokens (no utility framework)',
                'GSAP for motion behind a reduced-motion gate',
                'RSpec / Vitest / Playwright + axe',
              ].map((item) => (
                <li key={item} className={styles['stack-item']}>
                  {item}
                </li>
              ))}
            </ul>
          </section>

          {/* ── Craft bar ── */}
          <section aria-label="Craft bar" className={styles.section}>
            <h2 className={styles['section-heading']}>Craft bar</h2>

            {craft === null || craft === undefined ? (
              <div className={styles['craft-pending']}>
                Craft numbers are captured by rake craft:capture — pending first capture.
              </div>
            ) : (
              <div className={styles['craft-numbers']}>
                {/* Test counts */}
                {craft.tests !== undefined && (
                  <div className={styles['test-counts']}>
                    {craft.tests.vitest !== undefined && (
                      <div className={styles['test-count']}>
                        <span className={styles['test-count-value']}>{craft.tests.vitest}</span>
                        <span className={styles['test-count-label']}>unit (Vitest)</span>
                      </div>
                    )}
                    {craft.tests.rspec !== undefined && (
                      <div className={styles['test-count']}>
                        <span className={styles['test-count-value']}>{craft.tests.rspec}</span>
                        <span className={styles['test-count-label']}>request (RSpec)</span>
                      </div>
                    )}
                    {craft.tests.e2e !== undefined && (
                      <div className={styles['test-count']}>
                        <span className={styles['test-count-value']}>{craft.tests.e2e}</span>
                        <span className={styles['test-count-label']}>e2e (Playwright)</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Lighthouse summary */}
                {craft.lighthouse?.summary !== undefined && (
                  <div className={styles['lighthouse-section']}>
                    {craft.lighthouse.summary.mobile !== undefined && (
                      <LighthousePreset
                        label="Mobile (min across routes)"
                        summary={craft.lighthouse.summary.mobile}
                      />
                    )}
                    {craft.lighthouse.summary.desktop !== undefined && (
                      <LighthousePreset
                        label="Desktop (min across routes)"
                        summary={craft.lighthouse.summary.desktop}
                      />
                    )}
                  </div>
                )}

                {/* Axe */}
                <p className={styles['axe-claim']}>
                  Zero axe violations across the route × skin × motion matrix — CI-enforced.
                </p>

                {/* FPS */}
                {craft.fps !== undefined && craft.fps.length > 0 && (
                  <div className={styles['test-counts']}>
                    {craft.fps.map((entry) => (
                      <div key={entry.label} className={styles['test-count']}>
                        <span className={styles['test-count-value']}>{entry.fps}</span>
                        <span className={styles['test-count-label']}>{entry.label}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Measured line */}
                <p className={styles['craft-meta']}>
                  {capturedAt !== undefined && (
                    <>
                      Measured {captureDate(capturedAt)}
                      {base !== undefined && <> · Captured on {base}</>}
                      {' · '}
                    </>
                  )}
                  CI runs:{' '}
                  <a
                    href={ciUrl}
                    className={styles['external-link']}
                    rel="noreferrer"
                    target="_blank"
                  >
                    GitHub Actions
                  </a>
                </p>
              </div>
            )}
          </section>

          {/* ── Privacy ── */}
          <section aria-label="Privacy" className={styles.section}>
            <h2 className={styles['section-heading']}>Privacy</h2>
            <p className={styles['body-ink']}>
              Telemetry here is first-party, cookieless, and stores no personal data. No cookies, no
              localStorage identifiers, no fingerprinting: a visit is an anonymous daily-rotating
              hash, the only traffic-source signal is the referrer, and nothing is shared with — or
              fetched from — any third party.
            </p>
          </section>

          {/* ── Type & licenses ── */}
          <section aria-label="Type and licenses" className={styles.section}>
            <h2 className={styles['section-heading']}>Type &amp; licenses</h2>
            <p className={styles.body}>
              Hanken Grotesk + JetBrains Mono (own-brand skin), Source Sans 3 + Source Code Pro
              (rails-era skin) — all SIL Open Font License, self-hosted subsets. Code is{' '}
              <a
                href="https://github.com/galentidesign/portfolio/blob/main/LICENSE"
                className={styles['external-link']}
                rel="noreferrer"
                target="_blank"
              >
                MIT
              </a>
              . Site content, brand assets, visual design, and case-study material are © J Galenti,
              all rights reserved.
            </p>
          </section>

          {/* ── Design system in Figma ── */}
          <section aria-label="Design system in Figma" className={styles.section}>
            <h2 className={styles['section-heading']}>Design system in Figma</h2>
            <p className={styles.body}>
              <a
                href="https://www.figma.com/design/FDrHYp9F366R2GZ0Ra9koO/portfolio"
                className={styles['external-link']}
                rel="noreferrer"
                target="_blank"
              >
                The DS as a Figma library →
              </a>{' '}
              Variable collections mirror the token JSON; components are bound to the same semantic
              layer the site compiles.
            </p>
          </section>

          {/* ── Built by agents ── */}
          <section aria-label="Built by agents" className={styles.section}>
            <h2 className={styles['section-heading']}>Built by agents</h2>
            <p className={styles.body}>
              <Link href="/story/agentic" className={styles.link}>
                This site is agent-built, with receipts →
              </Link>
            </p>
          </section>

          {/* Back */}
          <Link href="/work" className={styles.link}>
            Back to the work →
          </Link>
        </div>
      </main>
    </>
  )
}
