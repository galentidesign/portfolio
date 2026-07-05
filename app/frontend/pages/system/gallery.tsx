import { Head, Link } from '@inertiajs/react'
import type { ComponentType } from 'react'
import styles from './gallery.module.css'

interface GalleryModule {
  galleryMeta: { slug: string; title: string }
  default: ComponentType
}

// Every component contributes a gallery.tsx (see ds/components/README.md);
// this page discovers them via glob so sixteen parallel component builds
// never edit a shared registration file.
const modules = import.meta.glob<GalleryModule>('../../ds/components/*/gallery.tsx', {
  eager: true,
})

const demos = Object.values(modules)
  .filter((m): m is GalleryModule => Boolean(m.galleryMeta && m.default))
  .sort((a, b) => a.galleryMeta.title.localeCompare(b.galleryMeta.title))

export default function Gallery() {
  return (
    <>
      <Head title="Gallery — J Galenti" />
      <main className={styles.page} id="main">
        <div className={styles.container}>
          <header className={styles.header}>
            <h1 className={styles.title}>Component gallery</h1>
            <p className={styles.note}>
              Scratch verify surface — {demos.length} components auto-discovered from{' '}
              <code className={styles.code}>ds/components/*/gallery.tsx</code>. The manifest-driven
              docs replace this page at M3.
            </p>
            <nav aria-label="Gallery contents">
              <ul className={styles['toc-list']}>
                {demos.map(({ galleryMeta }) => (
                  <li key={galleryMeta.slug}>
                    <a className={styles['toc-link']} href={`#${galleryMeta.slug}`}>
                      {galleryMeta.title}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          </header>

          {demos.map(({ galleryMeta, default: Demo }) => (
            <section
              key={galleryMeta.slug}
              id={galleryMeta.slug}
              aria-labelledby={`${galleryMeta.slug}-heading`}
              className={styles.section}
              data-gallery-section={galleryMeta.slug}
            >
              <h2 id={`${galleryMeta.slug}-heading`} className={styles.heading}>
                {galleryMeta.title}
              </h2>
              <div className={styles.demo}>
                <Demo />
              </div>
            </section>
          ))}

          <footer className={styles.footer}>
            <Link className={styles.link} href="/system/tokens">
              ← Tokens
            </Link>
          </footer>
        </div>
      </main>
    </>
  )
}
