import type { ReactNode } from 'react'
import { Card } from '@/ds/components/Card/Card'
import styles from './beats.module.css'

export interface EraBeatSectionProps {
  /** Section id (also prefixes the heading id). */
  id: string
  /** Oversized beat index from the nine-beat storyboard, e.g. "03". */
  numeral: string
  /** Mono kicker, e.g. "Era I · 2014–2019". */
  label: string
  title: string
  /** The offset right-lower column — one tight editorial paragraph. */
  lede: string
  chapterHref: string
  chapterTitle: string
  chapterSummary: string
  /** The era's artifact island. */
  children: ReactNode
}

/**
 * Shared scaffold for the three era beats (03–05): staggered editorial
 * columns, the artifact island, and the deep-dive door to the chapter
 * route. Sits directly after its ScrollRetheme boundary in the DOM, so its
 * data-retheme-stagger members ride the crossing's settle cascade.
 */
export function EraBeatSection({
  id,
  numeral,
  label,
  title,
  lede,
  chapterHref,
  chapterTitle,
  chapterSummary,
  children,
}: EraBeatSectionProps) {
  return (
    <section id={id} className={styles.beat} aria-labelledby={`${id}-heading`}>
      <div className={styles['era-columns']}>
        <div>
          <span className={styles['beat-numeral']} aria-hidden="true">
            {numeral}
          </span>
          <p className={styles['era-label']} data-retheme-stagger="chrome">
            {label}
          </p>
          <h2 id={`${id}-heading`} className={styles['era-title']} data-retheme-stagger="type">
            {title}
          </h2>
        </div>
        <p className={styles['era-lede']} data-retheme-stagger="type">
          {lede}
        </p>
      </div>

      <div className={styles['era-island']}>{children}</div>

      <div className={styles['era-deepdive']} data-retheme-stagger>
        <Card href={chapterHref} footer="Read the chapter →">
          <p className={styles['chapter-title']}>{chapterTitle}</p>
          <p className={styles['chapter-summary']}>{chapterSummary}</p>
        </Card>
      </div>
    </section>
  )
}
