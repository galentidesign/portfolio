import { type CSSProperties } from 'react'
import styles from './galleryImage.module.css'

// The first real image component in the repo. Aspect-ratio framed, lazy, and
// placeholder-aware: when the asset isn't on disk yet (`available === false`) it
// renders a labeled placeholder instead of a broken <img>, so the whole gallery
// ships before any real screenshots exist. Only available images are clickable
// (a placeholder has nothing to enlarge), so onClick is honoured only then.

export interface GalleryImageProps {
  src: string
  alt: string
  available: boolean
  /** CSS aspect-ratio for the frame, e.g. '16 / 10'. Default '16 / 10'. */
  aspect?: string
  /** Opens a lightbox. Wired only when the image is available. */
  onClick?: () => void
  loading?: 'lazy' | 'eager'
}

export function GalleryImage({
  src,
  alt,
  available,
  aspect = '16 / 10',
  onClick,
  loading = 'lazy',
}: GalleryImageProps) {
  const style = { '--gallery-aspect': aspect } as CSSProperties
  const interactive = available && onClick !== undefined

  const media = available ? (
    <img className={styles.img} src={src} alt={alt} loading={loading} decoding="async" />
  ) : (
    <span className={styles.placeholder} role="img" aria-label={alt}>
      <span className={styles.mark} aria-hidden="true">
        ▦
      </span>
      <span className={styles.label}>{alt}</span>
      <span className={styles.note} aria-hidden="true">
        image pending
      </span>
    </span>
  )

  if (interactive) {
    return (
      <button
        type="button"
        className={styles.frame}
        data-interactive
        style={style}
        onClick={onClick}
        aria-label={`View full image: ${alt}`}
      >
        {media}
      </button>
    )
  }

  return (
    <span className={styles.frame} style={style}>
      {media}
    </span>
  )
}
