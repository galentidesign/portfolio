import { Table, type TableColumn } from '@/ds/components/Table/Table'
import type { ManifestA11y, ManifestA11yKeyboard } from './manifest'
import styles from './docs.module.css'

const KEYBOARD_COLS: readonly TableColumn<ManifestA11yKeyboard>[] = [
  { key: 'keys', header: 'Keys' },
  { key: 'does', header: 'Does' },
]

export interface A11yNotesProps {
  a11y: ManifestA11y
}

export function A11yNotes({ a11y }: A11yNotesProps) {
  return (
    <div className={styles['a11y-notes']}>
      <div>
        <h3 className={styles['sub-heading']}>Keyboard</h3>
        <Table<ManifestA11yKeyboard>
          caption="Keyboard interactions"
          captionHidden={false}
          columns={KEYBOARD_COLS}
          rows={a11y.keyboard}
          rowKey={(r) => r.keys}
        />
      </div>

      <div>
        <h3 className={styles['sub-heading']}>ARIA</h3>
        <ul className={styles['aria-list']}>
          {a11y.aria.map((note, i) => (
            <li key={i}>{note}</li>
          ))}
        </ul>
      </div>

      <div>
        <h3 className={styles['sub-heading']}>Contrast</h3>
        <p className={styles['contrast-text']}>{a11y.contrast}</p>
      </div>
    </div>
  )
}
