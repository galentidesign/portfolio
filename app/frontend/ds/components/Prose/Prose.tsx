import { type ReactNode, type Ref } from 'react'
import styles from './styles.module.css'

// Figma: https://www.figma.com/design/FDrHYp9F366R2GZ0Ra9koO/portfolio?node-id=104-3
// Component "Prose" — type specimen (h1–h3, p, list, link, code, pre, quote,
// hr) bound to the "Tokens" collection. Descendant-selector styling has no
// Figma home; the specimen mirrors the ramp element-by-element.

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
