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
