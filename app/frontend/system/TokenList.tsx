import styles from './docs.module.css'

export interface TokenListProps {
  tokens: string[]
}

export function TokenList({ tokens }: TokenListProps) {
  return (
    <ul className={styles['token-list']} aria-label="Design tokens">
      {tokens.map((token) => (
        <li key={token}>
          <code className={styles.mono}>{token}</code>
        </li>
      ))}
    </ul>
  )
}
