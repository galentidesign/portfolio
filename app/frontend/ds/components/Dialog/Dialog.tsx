/**
 * Figma (file FDrHYp9F366R2GZ0Ra9koO, "Dialog" page) — component set "Dialog",
 * Size × booleans. Footer holds real Button instances; backdrop is page-level.
 * - size (sm | md) → "Size"; dismissible → "Dismissible" bool
 * - description | footer → "Show …" bools; title | description → text properties
 * @see https://www.figma.com/design/FDrHYp9F366R2GZ0Ra9koO/portfolio?node-id=33-38
 * Tokens come from the "Tokens" variable collection — skins galenti | rails-era
 * | react-era | agentic (+ night/day zones); flip mode at the frame level.
 */
import { useEffect, useId, useRef, type ReactNode } from 'react'
import styles from './styles.module.css'

export interface DialogProps {
  /** Fully controlled — owner must flip this to mount/unmount the dialog. */
  open: boolean
  /** Fired by Esc, backdrop click (when dismissible), and the × button. */
  onClose: () => void
  /** Heading text; wired to aria-labelledby. */
  title: string
  /** Supporting text; wired to aria-describedby when present. */
  description?: string
  /** Max-width step. Default 'md'. */
  size?: 'sm' | 'md'
  /**
   * When false, removes the × button and blocks backdrop click + Esc
   * dismissal. Default true.
   */
  dismissible?: boolean
  /** Action row slot — rendered in the footer. */
  footer?: ReactNode
  children: ReactNode
}

export function Dialog({
  open,
  onClose,
  title,
  description,
  size = 'md',
  dismissible = true,
  footer,
  children,
}: DialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const titleId = useId()
  const descId = useId()

  // ── Open / close effect ──────────────────────────────────────────────────
  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return

    if (open) {
      // Guard: only call showModal when the dialog is not already open so we
      // don't throw in strict-mode double-invocation.
      if (!dialog.open) {
        dialog.showModal()
      }

      // Set initial focus to the panel if nothing inside carries [autofocus].
      // If a child declares autofocus (e.g. a focused input), the browser /
      // React will honour that and we don't fight it.
      const autofocused = dialog.querySelector<HTMLElement>('[autofocus]')
      if (!autofocused) {
        dialog.focus()
      }
    } else {
      // Guard: only call close when the dialog is currently open.
      if (dialog.open) {
        dialog.close()
      }
    }
  }, [open])

  // ── cancel event (Esc key) ───────────────────────────────────────────────
  // Always preventDefault so the browser never closes the dialog on its own.
  // The component never closes itself — the owner controls `open`.
  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return

    const handleCancel = (e: Event) => {
      e.preventDefault()
      if (dismissible) {
        onClose()
      }
    }

    dialog.addEventListener('cancel', handleCancel)
    return () => dialog.removeEventListener('cancel', handleCancel)
  }, [dismissible, onClose])

  // ── close event ──────────────────────────────────────────────────────────
  // Fires when the dialog closes by any means (e.g. form method="dialog").
  // If it fires while `open` is still true the owner hasn't caught up yet —
  // call onClose so the controlled state stays in sync.
  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return

    const handleClose = () => {
      if (open) {
        onClose()
      }
    }

    dialog.addEventListener('close', handleClose)
    return () => dialog.removeEventListener('close', handleClose)
  }, [open, onClose])

  // ── Backdrop click ───────────────────────────────────────────────────────
  // The inner `.panel` div absorbs content clicks so only a true backdrop
  // hit (event.target === dialog element) triggers dismissal. The gesture
  // must both start AND end on the backdrop — otherwise a text-selection
  // drag that begins inside the panel and releases over the backdrop would
  // close the dialog and destroy in-progress input.
  const backdropPressRef = useRef(false)

  const handleBackdropPointerDown = (e: React.PointerEvent<HTMLDialogElement>) => {
    backdropPressRef.current = e.target === dialogRef.current
  }

  const handleBackdropClick = (e: React.MouseEvent<HTMLDialogElement>) => {
    const pressStartedOnBackdrop = backdropPressRef.current
    backdropPressRef.current = false
    if (dismissible && pressStartedOnBackdrop && e.target === dialogRef.current) {
      onClose()
    }
  }

  return (
    <dialog
      ref={dialogRef}
      className={styles.dialog}
      data-size={size}
      aria-labelledby={titleId}
      aria-describedby={description !== undefined ? descId : undefined}
      // tabIndex={-1} lets the panel itself receive programmatic focus as the
      // initial focus target when no child carries [autofocus].
      tabIndex={-1}
      onPointerDown={handleBackdropPointerDown}
      onClick={handleBackdropClick}
    >
      {/* Inner panel absorbs content pointer events so backdrop-click detection works */}
      <div className={styles.panel}>
        {/* ── Header ── */}
        <div className={styles.header}>
          <h2 id={titleId} className={styles.title}>
            {title}
          </h2>

          {dismissible && (
            <button
              type="button"
              className={styles['close-button']}
              aria-label="Close"
              onClick={onClose}
            >
              {/* × glyph — no external icon dep, aria-hidden on span */}
              <span aria-hidden="true" className={styles['close-icon']}>
                ×
              </span>
            </button>
          )}
        </div>

        {/* ── Description ── */}
        {description !== undefined && (
          <p id={descId} className={styles.description}>
            {description}
          </p>
        )}

        {/* ── Body ── */}
        <div className={styles.body}>{children}</div>

        {/* ── Footer ── */}
        {footer !== undefined && <div className={styles.footer}>{footer}</div>}
      </div>
    </dialog>
  )
}
