import { useEffect, useRef, useState } from 'react'
import styles from './styles.module.css'

export interface CodeBlockProps {
  code: string
  label?: string
  copyable?: boolean
}

export function CodeBlock({ code, label, copyable = true }: CodeBlockProps) {
  const [copied, setCopied] = useState(false)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      timeoutRef.current = setTimeout(() => {
        setCopied(false)
      }, 2000)
    } catch {
      // Clipboard write failed
    }
  }

  const showHeader = label !== undefined || copyable

  return (
    <div className={styles['code-block']}>
      {showHeader && (
        <div className={styles.header}>
          {label !== undefined && <span className={styles.label}>{label}</span>}
          {copyable && (
            <button type="button" className={styles['copy-button']} onClick={handleCopy}>
              {copied ? 'Copied' : 'Copy'}
            </button>
          )}
        </div>
      )}
      {/* role="group" (not "region"): the pre needs focus + a name for
          keyboard-scrollable overflow, but region is a LANDMARK — pages with
          several code blocks would fill the AT landmark list with duplicate
          'Code' entries (axe landmark-unique). group names it without that. */}
      <pre className={styles.pre} tabIndex={0} role="group" aria-label={label ?? 'Code'}>
        <code>{code}</code>
      </pre>
      {copied && (
        <span className={styles['sr-live']} aria-live="polite">
          Copied to clipboard
        </span>
      )}
    </div>
  )
}
