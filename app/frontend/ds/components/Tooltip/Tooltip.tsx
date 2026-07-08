/**
 * Figma (file FDrHYp9F366R2GZ0Ra9koO, "Tooltip" page) — component "Tooltip", an
 * inverted bubble (bg color/ink, text color/surface, radius/control, shadow/raised).
 * - content → "Label" text
 * - position (top | bottom) is code-only (offset; no arrow → visually identical)
 * @see https://www.figma.com/design/FDrHYp9F366R2GZ0Ra9koO/portfolio?node-id=91-3
 * Tokens come from the "Tokens" variable collection — skins galenti | rails-era
 * | react-era | agentic (+ night/day zones); flip mode at the frame level.
 */
import { cloneElement, useEffect, useId, useRef, useState, type ReactElement } from 'react'
import styles from './styles.module.css'

// Hover-intent threshold (ms) before a pointer-triggered show. Deliberately a
// structural const and NOT a motion token: it is an interaction threshold —
// how long the pointer must rest before we believe the user wants the tip —
// not an animation duration, so reduced motion must not collapse it to zero.
const HOVER_INTENT_MS = 150

// Minimum viewport clearance (px) the preferred side needs at show time —
// roughly one tooltip line plus its offset. Structural, not a spacing token.
const FLIP_CLEARANCE_PX = 48

export interface TooltipProps {
  /**
   * Plain text only — a tooltip must never hold interactive content. The tip
   * is transient, unfocusable, and pointer-events: none, so any control
   * inside it would be unreachable by keyboard and pointer alike (the APG
   * tooltip pattern carries only descriptive text).
   */
  content: string
  /** Preferred side; flips to the other side when the viewport would clip it. */
  position?: 'top' | 'bottom'
  /** Exactly one focusable trigger element. */
  children: ReactElement<{ 'aria-describedby'?: string }>
}

export function Tooltip({ content, position = 'top', children }: TooltipProps) {
  const tooltipId = useId()
  const wrapperRef = useRef<HTMLSpanElement>(null)
  const showTimerRef = useRef<number | undefined>(undefined)
  const [visible, setVisible] = useState(false)
  const [side, setSide] = useState<'top' | 'bottom'>(position)

  const clearShowTimer = () => {
    if (showTimerRef.current !== undefined) {
      window.clearTimeout(showTimerRef.current)
      showTimerRef.current = undefined
    }
  }

  // Clear any pending hover-intent timer on unmount so it can never fire into
  // an unmounted component.
  useEffect(() => {
    return () => {
      if (showTimerRef.current !== undefined) {
        window.clearTimeout(showTimerRef.current)
      }
    }
  }, [])

  // Which side to render on, measured at show time from live viewport
  // geometry: if the preferred side lacks ~FLIP_CLEARANCE_PX of room, use the
  // other side.
  const resolveSide = (): 'top' | 'bottom' => {
    const wrapper = wrapperRef.current
    if (!wrapper) return position
    const rect = wrapper.getBoundingClientRect()
    // Guard: jsdom (and any un-laid-out node) reports an all-zero rect — flip
    // math on zeros would always flip 'top' to 'bottom', so keep the
    // preferred side when the rect carries no real geometry.
    if (rect.width === 0 && rect.height === 0) return position
    if (position === 'top' && rect.top < FLIP_CLEARANCE_PX) return 'bottom'
    if (position === 'bottom' && window.innerHeight - rect.bottom < FLIP_CLEARANCE_PX) {
      return 'top'
    }
    return position
  }

  const show = () => {
    clearShowTimer()
    setSide(resolveSide())
    setVisible(true)
  }

  const hide = () => {
    clearShowTimer()
    setVisible(false)
  }

  // Keyboard focus shows immediately — no intent delay for keyboard users.
  const handleFocus = () => show()

  const handleBlur = () => hide()

  // Pointer entry waits out the hover-intent delay so casual pointer travel
  // across the page doesn't flash tooltips.
  const handleMouseEnter = () => {
    clearShowTimer()
    showTimerRef.current = window.setTimeout(() => {
      showTimerRef.current = undefined
      show()
    }, HOVER_INTENT_MS)
  }

  const handleMouseLeave = () => hide()

  // APG dismissal requirement: Escape hides the tooltip instantly without
  // moving focus. The keydown bubbles from the focused trigger to the wrapper.
  const handleKeyDown = (e: React.KeyboardEvent<HTMLSpanElement>) => {
    if (e.key === 'Escape') hide()
  }

  // The child is cloned ONLY to merge aria-describedby — never to attach
  // handlers. aria-describedby is set exactly while the tooltip is visible,
  // because that is exactly when the referenced node exists in the DOM; any
  // describedby the child already carries is preserved and joined.
  const existingDescribedBy = children.props['aria-describedby']
  const describedBy = visible
    ? [existingDescribedBy, tooltipId].filter(Boolean).join(' ')
    : existingDescribedBy
  const trigger = cloneElement(children, { 'aria-describedby': describedBy })

  return (
    // The wrapper — not the cloned child — owns every listener: as an
    // inline-flex box it hugs the trigger, so mouseenter/mouseleave on the
    // wrapper cover exactly the child's area, and React's onFocus/onBlur are
    // backed by the bubbling focusin/focusout events, so focus changes on the
    // trigger reach the wrapper too. No handler cloning is needed.
    <span
      ref={wrapperRef}
      className={styles.wrapper}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
    >
      {trigger}
      {visible && (
        <div role="tooltip" id={tooltipId} className={styles.tooltip} data-position={side}>
          {content}
        </div>
      )}
    </span>
  )
}
