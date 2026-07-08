/**
 * Figma (file FDrHYp9F366R2GZ0Ra9koO, "Prose" page) — component "Prose", a type
 * specimen (h1–h3, p, list, link, inline code, pre, blockquote, hr) bound to the
 * type ramp. No variant axes; descendant-selector styling has no Figma home, so
 * the specimen mirrors the ramp element-by-element.
 * @see https://www.figma.com/design/FDrHYp9F366R2GZ0Ra9koO/portfolio?node-id=104-3
 * Tokens come from the "Tokens" variable collection — skins galenti | rails-era
 * | react-era | agentic (+ night/day zones); flip mode at the frame level.
 */
import { type ReactNode, type Ref } from 'react'
import styles from './styles.module.css'

export interface ProseProps {
  children: ReactNode
  ref?: Ref<HTMLDivElement>
}

export function Prose({ children, ref }: ProseProps) {
  return (
    <div ref={ref} className={styles.prose}>
      {children}
    </div>
  )
}
