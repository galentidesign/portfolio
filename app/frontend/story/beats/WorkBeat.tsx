import { Link } from '@inertiajs/react'
import { Card } from '@/ds/components/Card/Card'
import { GalleryImage } from '@/gallery/GalleryImage'
import { useFx } from '@/ds/motion/useFx'
import type { ProjectCard } from '@/gallery/types'
import styles from './beats.module.css'

export interface WorkBeatProps {
  /** Curated gallery covers for the band; omitted → link-only band. */
  galleryBand?: readonly ProjectCard[]
}

/**
 * Beat 07 — The work: the skim destination (one hatch jump from beat 00).
 * Two case studies + the gallery band; copy shared verbatim with the /work
 * skim hub. Focusable so the escape hatch can land here.
 */
export function WorkBeat({ galleryBand }: WorkBeatProps) {
  const revealRef = useFx<HTMLElement>((fx, el) =>
    fx.mountReveal(el, { selector: '[data-reveal]' }),
  )

  return (
    <section
      ref={revealRef}
      id="the-work"
      tabIndex={-1}
      className={styles.beat}
      aria-labelledby="the-work-heading"
    >
      <span className={styles['beat-numeral']} aria-hidden="true">
        07
      </span>
      <p className={styles['era-label']}>The proof</p>
      <h2 id="the-work-heading" className={styles['era-title']}>
        The work
      </h2>

      <div className={styles['work-tiles']}>
        {/* Study A — the dark island tile: same semantic tokens, night values. */}
        <div data-zone="night" data-reveal>
          <Card
            href="/work/agentic-design-ops"
            title="Agentic design-ops"
            footer="Read the study →"
          >
            <p className={styles['tile-lede']}>
              How this site (and its design system) is built by an agent fleet with governance
              gates.
            </p>
          </Card>
        </div>
        <div className={styles['work-tile-b']} data-reveal>
          <Card href="/work/shadcn-to-polaris" title="shadcn → Polaris" footer="Read the study →">
            <p className={styles['tile-lede']}>
              Migrating a production app&apos;s component layer between design systems without a
              rewrite.
            </p>
          </Card>
        </div>
      </div>

      {/* Gallery band — visual work at a glance; placeholder-aware covers. */}
      {galleryBand !== undefined && galleryBand.length > 0 ? (
        <div className={styles['gallery-strip']} data-reveal data-testid="gallery-band">
          {galleryBand.slice(0, 3).map((project) => (
            <Link key={project.slug} href={`/gallery/${project.slug}`} aria-label={project.title}>
              <GalleryImage
                src={project.cover?.src ?? ''}
                alt={project.cover?.alt ?? project.title}
                available={project.cover?.available ?? false}
              />
            </Link>
          ))}
          <div className={styles['gallery-more']}>
            <Card href="/gallery" footer="Browse the gallery →">
              <p className={styles['tile-lede']}>Product &amp; visual design</p>
            </Card>
          </div>
        </div>
      ) : (
        <div className={styles['work-links']} data-reveal data-testid="gallery-band-fallback">
          <Link href="/gallery" className={styles['quiet-link']}>
            Browse the gallery →
          </Link>
        </div>
      )}

      <div className={styles['work-links']}>
        <Link href="/work" className={styles['quiet-link']}>
          Prefer the 90-second version? The skim hub →
        </Link>
      </div>
    </section>
  )
}
