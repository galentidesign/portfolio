import { Card } from '@/ds/components/Card/Card'
import styles from './docs.module.css'

export interface UsageNotesProps {
  usage: {
    do: string[]
    dont: string[]
  }
}

export function UsageNotes({ usage }: UsageNotesProps) {
  return (
    <div className={styles['usage-grid']}>
      <Card title="Do">
        <ul className={styles['usage-list']}>
          {usage.do.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ul>
      </Card>
      <Card title="Don't">
        <ul className={styles['usage-list']}>
          {usage.dont.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ul>
      </Card>
    </div>
  )
}
