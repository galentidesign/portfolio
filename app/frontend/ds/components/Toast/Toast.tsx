import { useEffect, useRef, type ReactNode } from 'react'
import styles from './styles.module.css'

// Figma: https://www.figma.com/design/FDrHYp9F366R2GZ0Ra9koO/portfolio?node-id=98-20
// Component set "Toast" — tone→Tone (neutral/positive/caution/critical);
// title→"Title", children→"Message" text props; dismiss ×. inline/toast mode,
// auto-hide and enter animation omitted. Bound to "Tokens"; "shadow/overlay".

export interface ToastProps {
  tone?: 'neutral' | 'positive' | 'caution' | 'critical'
  inline?: boolean
  open?: boolean
  title?: string
  onDismiss?: () => void
  autoHideMs?: number
  children: ReactNode
}

export function Toast({
  tone = 'neutral',
  inline = false,
  open = true,
  title,
  onDismiss,
  autoHideMs,
  children,
}: ToastProps) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pausedRef = useRef(false)

  // Auto-hide effect (toast mode only)
  useEffect(() => {
    if (!inline && !open) {
      return
    }

    if (inline) {
      // Inline mode: no auto-hide timer
      return
    }

    // Toast mode: set auto-hide timer only if autoHideMs and onDismiss are provided
    if (!autoHideMs || !onDismiss) {
      return
    }

    const scheduleTimeout = () => {
      timerRef.current = setTimeout(() => {
        if (!pausedRef.current) {
          onDismiss()
        }
      }, autoHideMs)
    }

    scheduleTimeout()

    return () => {
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current)
      }
    }
  }, [inline, open, autoHideMs, onDismiss])

  // Handle hover pause/resume
  const handleMouseEnter = () => {
    pausedRef.current = true
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current)
    }
  }

  const handleMouseLeave = () => {
    pausedRef.current = false
    // Restart with the full duration; clear first so interleaved hover/focus
    // resumes never stack two live timers (double onDismiss).
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current)
    }
    if (autoHideMs && onDismiss && !inline && open) {
      timerRef.current = setTimeout(onDismiss, autoHideMs)
    }
  }

  // Handle focus pause/resume
  const handleFocus = () => {
    pausedRef.current = true
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current)
    }
  }

  const handleBlur = () => {
    pausedRef.current = false
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current)
    }
    if (autoHideMs && onDismiss && !inline && open) {
      timerRef.current = setTimeout(onDismiss, autoHideMs)
    }
  }

  // Render nothing if toast mode (non-inline) and not open
  if (!inline && !open) {
    return null
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className={styles.toast}
      data-tone={tone}
      {...(inline ? { 'data-inline': '' } : {})}
      onMouseEnter={!inline ? handleMouseEnter : undefined}
      onMouseLeave={!inline ? handleMouseLeave : undefined}
      onFocus={!inline ? handleFocus : undefined}
      onBlur={!inline ? handleBlur : undefined}
    >
      <div className={styles.content}>
        {title !== undefined && <div className={styles.title}>{title}</div>}
        <div className={styles.body}>{children}</div>
      </div>

      {onDismiss !== undefined && (
        <button
          type="button"
          className={styles['dismiss-button']}
          aria-label="Dismiss"
          onClick={onDismiss}
        >
          <span aria-hidden="true" className={styles['dismiss-icon']}>
            ×
          </span>
        </button>
      )}
    </div>
  )
}
