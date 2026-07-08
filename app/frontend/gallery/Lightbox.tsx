import { useEffect } from 'react'
import { Dialog } from '@/ds/components/Dialog/Dialog'
import { Button } from '@/ds/components/Button/Button'
import type { GalleryImageAsset } from './types'
import styles from './lightbox.module.css'

// Full-size shot viewer built on the DS Dialog (focus-trap, Esc, backdrop all
// inherited). `index === null` means closed. Left/Right arrows page through the
// project's shots; the owner keeps the index.

export interface LightboxProps {
  shots: GalleryImageAsset[]
  index: number | null
  onClose: () => void
  onNavigate: (index: number) => void
}

export function Lightbox({ shots, index, onClose, onNavigate }: LightboxProps) {
  const open = index !== null
  const canNav = shots.length > 1

  useEffect(() => {
    if (!open) return

    const onKey = (e: KeyboardEvent) => {
      if (!canNav) return
      if (e.key === 'ArrowRight') onNavigate((index + shots.length + 1) % shots.length)
      if (e.key === 'ArrowLeft') onNavigate((index + shots.length - 1) % shots.length)
    }

    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, index, shots.length, canNav, onNavigate])

  if (index === null) return null

  const shot = shots[index]
  if (shot === undefined) return null

  const caption = shot.caption ?? undefined

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={caption ?? shot.alt}
      size="md"
      footer={
        canNav ? (
          <div className={styles.nav}>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => onNavigate((index + shots.length - 1) % shots.length)}
            >
              ← Prev
            </Button>
            <span className={styles.counter}>
              {index + 1} / {shots.length}
            </span>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => onNavigate((index + shots.length + 1) % shots.length)}
            >
              Next →
            </Button>
          </div>
        ) : undefined
      }
    >
      <figure className={styles.figure}>
        {shot.available ? (
          <img className={styles.img} src={shot.src} alt={shot.alt} />
        ) : (
          <div className={styles.pending} role="img" aria-label={shot.alt}>
            <span className={styles['pending-mark']} aria-hidden="true">
              ▦
            </span>
            <span>{shot.alt}</span>
            <span className={styles['pending-note']} aria-hidden="true">
              image pending
            </span>
          </div>
        )}
        {caption !== undefined && caption !== '' && (
          <figcaption className={styles.caption}>{caption}</figcaption>
        )}
      </figure>
    </Dialog>
  )
}
