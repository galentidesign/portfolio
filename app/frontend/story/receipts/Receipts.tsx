import { useEffect, useRef } from 'react'
import { useMotionPref } from '@/ds/motion/useMotionPref'
import type { NightMotionHandle } from '@/story/night/motion'
import type { AgentGroup } from './types'
import { receipts } from './data'
import styles from './receipts.module.css'

const REPO_BLOB_URL = 'https://github.com/galentidesign/portfolio/blob/main/'
const REPO_TREE_URL = 'https://github.com/galentidesign/portfolio/tree/main/'

function crewLabel(agents: readonly AgentGroup[]): string {
  return agents.map((g) => `${g.count} ${g.tier} ${g.role}`).join(' · ')
}

/**
 * Ch3 centerpiece (§6.7): the agent-build receipts, assembled from
 * docs/receipts/ — one entry per build session, captured in the moment and
 * never reconstructed. Rendered as a terminal feed for the kiln-dark
 * chapter: timestamp gutter, raised session cards, glowing stat tiles.
 *
 * Motion (dynamic import, THE MOTION GATE): on scroll-enter each card rises
 * in once and its title decodes with ScrambleText — the real title is the
 * DOM text, so reduced motion (which never downloads the chunk) renders the
 * identical feed, static and fully legible.
 */
export function Receipts() {
  const { reduced } = useMotionPref()
  const feedRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const feed = feedRef.current
    if (reduced || feed === null) return

    let cancelled = false
    let handle: NightMotionHandle | null = null
    void import('@/story/night/motion')
      .then(({ mountFeedMotion }) => {
        if (cancelled || feedRef.current === null) return
        handle = mountFeedMotion(feedRef.current)
      })
      .catch(() => {
        // Decorative enhancement only — a chunk error leaves the static feed.
      })

    return () => {
      cancelled = true
      handle?.destroy()
      handle = null
    }
  }, [reduced])

  const sessions = receipts.length
  const commits = receipts.reduce((sum, r) => sum + r.commits, 0)
  const agentCount = receipts.reduce((sum, r) => sum + r.agents.reduce((n, g) => n + g.count, 0), 0)
  const lastSuiteEntry = [...receipts].reverse().find((r) => r.suite !== undefined)
  const suiteTotal = lastSuiteEntry?.suite
    ? lastSuiteEntry.suite.unit + lastSuiteEntry.suite.rspec + lastSuiteEntry.suite.e2e
    : undefined
  const excerpted = receipts.filter((r) => r.excerpt !== undefined)

  return (
    <div ref={feedRef} className={styles.receipts}>
      <p className={styles.intro}>
        Every milestone of this site was one orchestrated agent session — a frontier orchestrator
        delegating to mid- and small-tier subagents against pinned file contracts. Each session
        appended its receipt to the public repo before closing: agents used, task shapes, what
        broke, what the review caught. This timeline is assembled from those files — captured in the
        moment, never reconstructed.
      </p>

      <ul className={styles.totals} role="list" aria-label="Build totals">
        <li className={styles.total}>
          <span className={styles['total-value']}>{sessions}</span>
          <span className={styles['total-label']}>sessions</span>
        </li>
        <li className={styles.total}>
          <span className={styles['total-value']}>{commits}</span>
          <span className={styles['total-label']}>commits</span>
        </li>
        <li className={styles.total}>
          <span className={styles['total-value']}>{agentCount}</span>
          <span className={styles['total-label']}>agents</span>
        </li>
        {lastSuiteEntry && suiteTotal !== undefined ? (
          <li className={styles.total}>
            <span className={styles['total-value']}>{suiteTotal.toLocaleString('en-US')}</span>
            <span className={styles['total-label']}>tests at {lastSuiteEntry.id} close</span>
          </li>
        ) : null}
      </ul>

      <p className={styles.legend} aria-hidden="true">
        <span className={[styles.dot, styles['dot-frontier']].join(' ')} /> frontier
        <span className={[styles.dot, styles['dot-mid']].join(' ')} /> mid
        <span className={[styles.dot, styles['dot-small']].join(' ')} /> small
      </p>

      <ol className={styles.timeline} role="list" aria-label="Build sessions, one per milestone">
        {receipts.map((r) => (
          <li key={r.id} className={styles.session} data-receipt-card>
            <span className={styles['session-date']}>{r.date}</span>
            <div className={styles['session-card']}>
              <div className={styles['session-head']}>
                <span className={styles['session-id']}>{r.id}</span>
                <a
                  className={styles['session-title']}
                  data-receipt-title
                  href={`${REPO_BLOB_URL}${r.sourcePath}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {r.title} →
                </a>
              </div>
              <div className={styles['session-meta']}>
                <span className={styles.crew} aria-hidden="true">
                  {r.agents.map((g, groupIndex) => (
                    <span key={groupIndex} className={styles['crew-group']}>
                      {Array.from({ length: g.count }, (_, i) => (
                        <span key={i} className={[styles.dot, styles[`dot-${g.tier}`]].join(' ')} />
                      ))}
                    </span>
                  ))}
                </span>
                <span className={styles['crew-label']}>{crewLabel(r.agents)}</span>
                <span className={styles['session-commits']}>
                  {r.commits} {r.commits === 1 ? 'commit' : 'commits'}
                </span>
              </div>
              <ul className={styles.moments} role="list">
                {r.moments.map((moment) => (
                  <li key={moment} className={styles.moment}>
                    {moment}
                  </li>
                ))}
              </ul>
            </div>
          </li>
        ))}
      </ol>

      {excerpted.length > 0 ? (
        <div className={styles.excerpts}>
          <h3 className={styles['excerpts-heading']}>From the receipts</h3>
          {excerpted.map((r) => (
            <blockquote key={r.id} className={styles.excerpt}>
              <p className={styles['excerpt-text']}>{r.excerpt}</p>
              <footer className={styles['excerpt-source']}>— {r.sourcePath}</footer>
            </blockquote>
          ))}
        </div>
      ) : null}

      <p className={styles.shape}>
        The shape that held across sessions: the orchestrator pre-lands every collision surface
        (routes, migrations, shared chrome, the contract doc), spawns one agent per task with the
        model tier matched to the work, and owns the integration run — subagents gate only on their
        own files. The catches that mattered came from eyeballing artifacts, not just green gates.
      </p>

      <a
        className={styles['all-link']}
        href={`${REPO_TREE_URL}docs/receipts`}
        target="_blank"
        rel="noopener noreferrer"
      >
        All receipts in the repo →
      </a>
    </div>
  )
}
