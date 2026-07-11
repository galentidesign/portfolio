import styles from './retheme.module.css'
import type { SkinName } from '@/ds/tokens/generated/skins'

/**
 * Visual dressing of the era-crossing band (all static CSS — WCAG 2.3.1):
 * - 'crt'      — scanlines, vignette, chromatic caption (the 2014 tube).
 * - 'webpack'  — skeleton-shimmer stripes, build-log caption (the 2018 bundler).
 * - 'terminal' — kiln-glow floor, ember hairlines, streaming mono lines.
 * Omitted (sweep-home) — the plain surface band, no era texture.
 */
export type RethemeTreatment = 'crt' | 'webpack' | 'terminal'

export interface RethemeBandProps {
  /** Skin whose night zone the band interior renders in mid-crossing. */
  skin: SkinName
  /** Era dressing; omitted renders the untextured sweep band. */
  treatment?: RethemeTreatment
  /** Pre-split caption lines, one <p> per line. */
  captionLines: readonly string[]
}

/**
 * The era-crossing band: inert at rest (opacity 0, pointer-events none) —
 * only the motion layer ever shows or moves it. The interior binds to the
 * era skin's night zone (data-skin + data-zone on one element), so the
 * crossing frame renders in the destination era's dark palette (CRT
 * phosphor, material dark, deep kiln — per treatment) even while the page
 * around it still wears the outgoing skin. Shared by EraRetheme (chapter
 * mount crossings) and ScrollRetheme (home scroll crossings).
 */
export function RethemeBand({ skin, treatment, captionLines }: RethemeBandProps) {
  return (
    <div
      aria-hidden="true"
      data-retheme-band
      {...(treatment !== undefined ? { 'data-retheme-treatment': treatment } : {})}
      className={styles.band}
    >
      <div className={styles['band-interior']} data-skin={skin} data-zone="night">
        <div className={styles['band-captions']}>
          {captionLines.map((line, lineIndex) => (
            <p key={lineIndex} className={styles['band-caption']}>
              {Array.from(line).map((char, i) => (
                <span key={i} data-retheme-caption-char>
                  {char}
                </span>
              ))}
            </p>
          ))}
        </div>
      </div>
    </div>
  )
}
