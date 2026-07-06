import { useEffect, useRef } from 'react'
import styles from './styles.module.css'

interface Props {
  ogKey: string
  title: string
  subtitle: string
  skin: string
}

function OgCard({ title, subtitle }: Props) {
  const stageRef = useRef<HTMLDivElement>(null)

  // Signal the screenshot tool: after web fonts settle the card is paint-ready.
  // document.fonts may be absent in non-browser environments (e.g. test).
  useEffect(() => {
    void document.fonts?.ready?.then(() => {
      if (stageRef.current) {
        stageRef.current.dataset.ogReady = 'true'
      }
    })
  }, [])

  return (
    <div className={styles.card} ref={stageRef}>
      {/* Accent rule — top edge mark using the skin's accent color */}
      <div className={styles.accent} aria-hidden="true" />

      <div className={styles.content}>
        <h1 className={styles.title}>{title}</h1>
        <p className={styles.subtitle}>{subtitle}</p>
      </div>

      <footer className={styles.footer}>
        <span className={styles.wordmark}>jgalenti.com</span>
      </footer>
    </div>
  )
}

// Bare render target — no site shell. The Inertia resolver reads the layout
// off the DEFAULT export (`page.default.layout`); a named `export const
// layout` never attaches and the shell silently wraps the card (caught when
// the first screenshots carried the site Nav).
OgCard.layout = null

export default OgCard
