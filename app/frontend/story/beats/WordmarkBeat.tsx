import { useFx } from '@/ds/motion/useFx'
import styles from './beats.module.css'

const WORD = 'GALENTI'

/**
 * Beat 06 — Resolution: the story sweeps home to bone and the wordmark takes
 * the whole viewport, one-two glyphs misbehaving on the variable weight axis
 * (design-direction §6 — boldness spent exactly here). Static base is the
 * wordmark at rest.
 */
export function WordmarkBeat() {
  const wordmarkRef = useFx<HTMLDivElement>((fx, el) => fx.mountGlyphPlay(el))

  return (
    <section
      className={[styles.beat, styles['wordmark-beat']].join(' ')}
      aria-label="Resolution — every era, one name"
    >
      <p className={styles['wordmark-kicker']} data-retheme-stagger="chrome">
        06 · resolution — back on bone
      </p>
      <div ref={wordmarkRef} className={styles.wordmark} role="img" aria-label="Galenti">
        {Array.from(WORD).map((letter, i) => (
          <span key={i} data-glyph>
            {letter}
          </span>
        ))}
      </div>
      <p className={styles['wordmark-coda']} data-retheme-stagger="type">
        Three eras, one through-line: the system underneath never changed hands.
      </p>
    </section>
  )
}
