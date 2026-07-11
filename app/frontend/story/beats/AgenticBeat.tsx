import { lazy } from 'react'
import { IslandMount } from './IslandMount'
import { EraBeatSection } from './EraBeatSection'
import styles from './beats.module.css'

const KilnInterior = lazy(() => import('./KilnInterior').then((m) => ({ default: m.KilnInterior })))

/** Beat 05 — Era III · Agentic: the kiln island — starfield, embers, receipts. */
export function AgenticBeat() {
  return (
    <EraBeatSection
      id="era-agentic"
      numeral="05"
      label="Era III · 2023 — now"
      title="The agentic era"
      lede="Building with an agent fleet — one orchestrator, contract docs doing
        the coordination, and every session logging its own receipt as it
        happens."
      chapterHref="/story/agentic"
      chapterTitle="The agentic era"
      chapterSummary="building with an agent fleet — receipts included"
    >
      {/* The dark island: drama contained in a rounded band on the page —
          data-zone re-tokens the subtree, no JS involved. */}
      <div className={styles['kiln-island']} data-zone="night" data-retheme-stagger="surface">
        <IslandMount placeholderHeight="16rem">
          <KilnInterior />
        </IslandMount>
      </div>
    </EraBeatSection>
  )
}
