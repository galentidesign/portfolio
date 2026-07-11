import { lazy } from 'react'
import { IslandMount } from './IslandMount'
import { EraBeatSection } from './EraBeatSection'
import styles from './beats.module.css'

const ReactArtifact = lazy(() =>
  import('./ReactArtifact').then((m) => ({ default: m.ReactArtifact })),
)

/** Beat 04 — Era II · React '18: webpack crossing + the component sheet. */
export function ReactBeat() {
  return (
    <EraBeatSection
      id="era-react"
      numeral="04"
      label="Era II · 2018–2023"
      title="The React era"
      lede="The browser took ownership of the truth. Components, tokens, and the
        system behind the system — consistency stopped being defended and
        started being installed."
      chapterHref="/story/react-era"
      chapterTitle="The React era"
      chapterSummary="components, tokens, and the system behind the system"
    >
      <IslandMount placeholderHeight="20rem">
        <figure className={styles['artifact-figure']}>
          <ReactArtifact />
          <figcaption className={styles['frame-caption']} data-retheme-stagger="type">
            The component sheet became the product page — every state named, every prop a story.
          </figcaption>
        </figure>
      </IslandMount>
    </EraBeatSection>
  )
}
