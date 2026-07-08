import { useState } from 'react'
import { Head, Link } from '@inertiajs/react'
import { Badge } from '@/ds/components/Badge/Badge'
import { Prose } from '@/ds/components/Prose/Prose'
import { GalleryImage } from '@/gallery/GalleryImage'
import { Lightbox } from '@/gallery/Lightbox'
import type { ProjectEntry, Siblings } from '@/gallery/types'
import styles from './show.module.css'

interface Props {
  project: ProjectEntry
  siblings: Siblings
}

export default function GalleryShow({ project, siblings }: Props) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)

  const paragraphs = project.overview.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean)
  const externalLinks = [
    project.links.live !== null ? { label: 'Visit site', href: project.links.live } : null,
    project.links.external !== null ? { label: 'External', href: project.links.external } : null,
  ].filter((l): l is { label: string; href: string } => l !== null)

  return (
    <>
      <Head title={`${project.title} — Gallery — J Galenti`}>
        <meta name="description" content={project.summary} />
      </Head>
      <main id="main" className={styles.page}>
        <article className={styles.container}>
          {/* ── Header ── */}
          <header className={styles.header}>
            <Link href="/gallery" className={styles.back}>
              ← Gallery
            </Link>
            <h1 className={styles.title}>{project.title}</h1>
            <p className={styles.meta}>
              {project.role} · {project.client} · {project.year}
            </p>
            <ul className={styles.disciplines} aria-label="Disciplines">
              {project.disciplines.map((d) => (
                <li key={d}>
                  <Badge tone="neutral" size="sm">
                    {d}
                  </Badge>
                </li>
              ))}
            </ul>
            {externalLinks.length > 0 && (
              <div className={styles.links}>
                {externalLinks.map((l) => (
                  <a key={l.href} href={l.href} className={styles.link} rel="noreferrer" target="_blank">
                    {l.label}
                  </a>
                ))}
              </div>
            )}
          </header>

          {/* ── Cover ── */}
          {project.cover !== null && (
            <div className={styles.cover}>
              <GalleryImage
                src={project.cover.src}
                alt={project.cover.alt}
                available={project.cover.available}
                aspect="16 / 9"
                loading="eager"
              />
            </div>
          )}

          {/* ── Overview ── */}
          <section aria-labelledby="section-overview" className={styles.section}>
            <h2 id="section-overview" className={styles['section-heading']}>
              Overview
            </h2>
            <Prose>
              {paragraphs.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </Prose>
          </section>

          {/* ── Highlights ── */}
          {project.highlights.length > 0 && (
            <section aria-labelledby="section-highlights" className={styles.section}>
              <h2 id="section-highlights" className={styles['section-heading']}>
                Highlights
              </h2>
              <ul className={styles.highlights}>
                {project.highlights.map((h) => (
                  <li key={h}>{h}</li>
                ))}
              </ul>
            </section>
          )}

          {/* ── Shots ── */}
          {project.shots.length > 0 && (
            <section aria-labelledby="section-shots" className={styles.section}>
              <h2 id="section-shots" className={styles['section-heading']}>
                Selected screens
              </h2>
              <ul className={styles.shots} aria-label="Project screens">
                {project.shots.map((shot, i) => (
                  <li key={shot.src} className={styles.shot}>
                    <GalleryImage
                      src={shot.src}
                      alt={shot.alt}
                      available={shot.available}
                      onClick={() => setLightboxIndex(i)}
                    />
                    {shot.caption !== undefined && shot.caption !== null && shot.caption !== '' && (
                      <p className={styles['shot-caption']}>{shot.caption}</p>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* ── Prev / next ── */}
          {(siblings.prev !== null || siblings.next !== null) && (
            <nav aria-label="More projects" className={styles.siblings}>
              {siblings.prev !== null ? (
                <Link href={`/gallery/${siblings.prev.slug}`} className={styles.sibling} data-dir="prev">
                  <span className={styles['sibling-dir']}>← Previous</span>
                  <span className={styles['sibling-title']}>{siblings.prev.title}</span>
                </Link>
              ) : (
                <span />
              )}
              {siblings.next !== null && (
                <Link href={`/gallery/${siblings.next.slug}`} className={styles.sibling} data-dir="next">
                  <span className={styles['sibling-dir']}>Next →</span>
                  <span className={styles['sibling-title']}>{siblings.next.title}</span>
                </Link>
              )}
            </nav>
          )}
        </article>

        <Lightbox
          shots={project.shots}
          index={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onNavigate={setLightboxIndex}
        />
      </main>
    </>
  )
}
