import { lazy } from 'react'
import { IslandMount } from './IslandMount'
import { EraBeatSection } from './EraBeatSection'
import styles from './beats.module.css'

const RailsArtifact = lazy(() =>
  import('@/story/artifacts/RailsArtifact').then((m) => ({ default: m.RailsArtifact })),
)

/** Beat 03 — Era I · Rails '14: inline retheme + the browser-chrome island. */
export function RailsBeat() {
  return (
    <EraBeatSection
      id="era-rails"
      numeral="03"
      label="Era I · 2014–2019"
      title="The Rails era"
      lede="Server-rendered product years — dense tables, small controls, and the
        instinct that became everything later: if two screens share a control,
        they share the code for it."
      chapterHref="/story/rails-era"
      chapterTitle="The Rails era"
      chapterSummary="2014–2019 · the dense product years"
    >
      <IslandMount placeholderHeight="28rem">
        <figure className={styles['artifact-figure']}>
          <RailsArtifact />
          <figcaption className={styles['frame-caption']} data-retheme-stagger="type">
            Same Button, same Table, same tokens as everywhere else on this site — re-tokened by one
            JSON file.
          </figcaption>
        </figure>
      </IslandMount>
    </EraBeatSection>
  )
}
