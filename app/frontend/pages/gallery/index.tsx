import { Head } from '@inertiajs/react'
import { Card } from '@/ds/components/Card/Card'
import { Badge } from '@/ds/components/Badge/Badge'
import { GalleryImage } from '@/gallery/GalleryImage'
import { useFx } from '@/ds/motion/useFx'
import type { ProjectCard } from '@/gallery/types'
import styles from './index.module.css'

interface Props {
  projects: ProjectCard[]
}

export default function GalleryIndex({ projects }: Props) {
  const featured = projects.filter((p) => p.featured)
  const standard = projects.filter((p) => !p.featured)

  const revealRef = useFx<HTMLDivElement>((fx, el) =>
    fx.mountReveal(el, { selector: '[data-reveal]' }),
  )

  return (
    <>
      <Head title="Gallery — J Galenti">
        <meta
          name="description"
          content="The product-design gallery: UX/UI and brand work across 20 years — streaming apps, component systems, and brand identity."
        />
      </Head>
      <main id="main" className={styles.page}>
        <div className={styles.container}>
          <header className={styles.intro}>
            <p className={styles.annotation}>Selected work</p>
            <h1 className={styles.heading}>Product & UX/UI design</h1>
            <p className={styles.lede}>
              Twenty years of product, UX/UI, and brand work — streaming apps, enterprise component
              systems, marketplaces, and brand identity. The design-technologist story lives in the
              case studies; this is the craft behind it.
            </p>
          </header>

          <div ref={revealRef} className={styles.sections}>
            {featured.length > 0 && (
              <Section id="featured" label="Featured">
                {featured.map((p) => (
                  <ProjectTile key={p.slug} project={p} />
                ))}
              </Section>
            )}

            {standard.length > 0 && (
              <Section id="all" label="All work">
                {standard.map((p) => (
                  <ProjectTile key={p.slug} project={p} />
                ))}
              </Section>
            )}
          </div>
        </div>
      </main>
    </>
  )
}

// ── Section ──────────────────────────────────────────────────────────────────

function Section({
  id,
  label,
  children,
}: {
  id: string
  label: string
  children: React.ReactNode
}) {
  return (
    <section aria-labelledby={`gallery-${id}`} className={styles.section}>
      <h2 id={`gallery-${id}`} className={styles['section-heading']}>
        {label}
      </h2>
      <ul className={styles.grid} aria-label={label}>
        {children}
      </ul>
    </section>
  )
}

// ── ProjectTile ──────────────────────────────────────────────────────────────

function ProjectTile({ project: p }: { project: ProjectCard }) {
  return (
    <li className={styles.cell} data-reveal>
      <Card href={`/gallery/${p.slug}`}>
        {p.cover !== null && (
          <div className={styles.media}>
            <GalleryImage src={p.cover.src} alt={p.cover.alt} available={p.cover.available} />
          </div>
        )}
        <div className={styles.body}>
          <div className={styles['title-row']}>
            <h3 className={styles.title}>{p.title}</h3>
            {p.featured && (
              <Badge tone="accent" size="sm">
                Featured
              </Badge>
            )}
          </div>
          <p className={styles.meta}>
            {p.role} · {p.client} · {p.year}
          </p>
          <p className={styles.summary}>{p.summary}</p>
          <ul className={styles.disciplines} aria-label="Disciplines">
            {p.disciplines.map((d) => (
              <li key={d}>
                <Badge tone="neutral" size="sm">
                  {d}
                </Badge>
              </li>
            ))}
          </ul>
        </div>
      </Card>
    </li>
  )
}
