import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import styles from './styles.module.css'

// Figma: https://www.figma.com/design/FDrHYp9F366R2GZ0Ra9koO/portfolio?node-id=107-2
// Component "Menu" (surface) + set "Menu Item" (node-id=106-9) — item state→
// State (default/active/disabled); label→"Label" text prop. Trigger maps to
// Button (secondary). Roving focus + positioning omitted. Bound to "Tokens".

export interface MenuItem {
  id: string
  label: string
  disabled?: boolean
  onSelect: () => void
}

export interface MenuProps {
  /** Trigger button text; also used as the menu's aria-label. */
  label: string
  items: readonly MenuItem[]
  /** Menu alignment relative to the trigger. Default 'start'. */
  align?: 'start' | 'end'
}

// Feature detection: jsdom (and older browsers) does not implement the
// popover API. When `showPopover` is missing we fall back to plain
// conditional rendering — the menu is only mounted while open and carries no
// popover attribute, so it loses top-layer + light dismiss but keeps every
// keyboard and ARIA behavior. Unit tests run in jsdom and therefore exercise
// this fallback path.
const supportsPopover =
  typeof HTMLElement !== 'undefined' && typeof HTMLElement.prototype.showPopover === 'function'

// Gap between the trigger and the menu panel — structural micro-offset, not a
// themable spacing decision.
const TRIGGER_GAP_PX = 4

// APG typeahead: keystrokes within this window accumulate into a prefix
// buffer; a longer pause starts a fresh search.
const TYPEAHEAD_RESET_MS = 500

export function Menu({ label, items, align = 'start' }: MenuProps) {
  const menuId = useId()
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)

  const triggerRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([])
  const pendingFocusRef = useRef<'first' | 'last'>('first')
  const pointerDownWhileOpenRef = useRef(false)
  const typeaheadBufferRef = useRef('')
  const typeaheadTimerRef = useRef<number | undefined>(undefined)

  const openMenu = (focusTarget: 'first' | 'last') => {
    pendingFocusRef.current = focusTarget
    pointerDownWhileOpenRef.current = false
    typeaheadBufferRef.current = ''
    setOpen(true)
  }

  const closeMenu = (refocusTrigger: boolean) => {
    setOpen(false)
    if (refocusTrigger) {
      triggerRef.current?.focus()
    }
  }

  // ── Open lifecycle: popover show/hide, positioning, initial focus ─────────
  useLayoutEffect(() => {
    const menu = menuRef.current

    if (!open) {
      // Popover mode keeps the element mounted — hide it when state closes.
      // Guarded: hidePopover throws if the popover is already hidden.
      if (supportsPopover && menu !== null && menu.matches(':popover-open')) {
        menu.hidePopover()
      }
      return
    }

    const trigger = triggerRef.current
    if (menu === null || trigger === null) return

    // Show before measuring/focusing — a hidden popover has no box and
    // cannot receive focus.
    if (supportsPopover && !menu.matches(':popover-open')) {
      menu.showPopover()
    }

    // Positioning: fixed at the trigger's rect. Guard note for jsdom — its
    // getBoundingClientRect returns all-zero rects, so this math still yields
    // finite (if meaningless) coordinates and must never be asserted on in
    // unit tests; Playwright owns real-geometry coverage.
    const rect = trigger.getBoundingClientRect()
    const menuHeight = menu.getBoundingClientRect().height

    let top = rect.bottom + TRIGGER_GAP_PX
    if (rect.bottom + TRIGGER_GAP_PX + menuHeight > window.innerHeight) {
      // Would overflow the viewport bottom — place above the trigger instead.
      top = rect.top - menuHeight - TRIGGER_GAP_PX
    }
    menu.style.top = `${top}px`
    if (align === 'end') {
      // End-aligned: the menu's right edge lines up with the trigger's.
      menu.style.right = `${window.innerWidth - rect.right}px`
      menu.style.left = 'auto'
    } else {
      menu.style.left = `${rect.left}px`
      menu.style.right = 'auto'
    }

    // Roving focus entry point: real DOM focus on the first/last item (APG),
    // not aria-activedescendant.
    if (items.length > 0) {
      const index = pendingFocusRef.current === 'last' ? items.length - 1 : 0
      setActiveIndex(index)
      itemRefs.current[index]?.focus()
    }
  }, [open, align, items])

  // ── Popover toggle sync ────────────────────────────────────────────────────
  // popover="auto" gives us light dismiss (click outside / native dismissal),
  // which hides the popover without going through React. Sync that back into
  // component state so aria-expanded stays truthful. Light dismiss must NOT
  // steal focus — the user intentionally interacted elsewhere, so we leave
  // focus wherever it landed. Attached in both modes (one code path; in the
  // fallback it simply never fires from the platform).
  useEffect(() => {
    const menu = menuRef.current
    if (menu === null) return

    const handleToggle = (event: Event) => {
      // ToggleEvent is absent from jsdom's globals — read newState loosely.
      const newState = (event as Event & { newState?: string }).newState
      if (newState === 'closed') {
        setOpen(false)
      }
    }

    menu.addEventListener('toggle', handleToggle)
    return () => menu.removeEventListener('toggle', handleToggle)
  }, [open])

  // ── Trigger interactions ───────────────────────────────────────────────────

  const handleTriggerPointerDown = () => {
    // In popover mode, a pointerdown on the trigger light-dismisses the open
    // popover BEFORE the click event fires — a naive click-toggle would then
    // read open=false and immediately reopen it. Record whether the menu was
    // open at pointerdown time so click expresses the user's actual intent.
    pointerDownWhileOpenRef.current = open
  }

  const handleTriggerClick = () => {
    const wasOpen = pointerDownWhileOpenRef.current || open
    pointerDownWhileOpenRef.current = false
    if (wasOpen) {
      setOpen(false)
    } else {
      // Covers mouse clicks and keyboard Enter/Space (native button click):
      // APG menu button opens the menu and focuses the first item.
      openMenu('first')
    }
  }

  const handleTriggerKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    // Enter/Space are not handled here — on a native <button> they fire a
    // click, which handleTriggerClick turns into open-and-focus-first.
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      openMenu('first')
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      openMenu('last')
    }
  }

  // ── Menu keyboard (APG menu button pattern) ────────────────────────────────

  const moveFocus = (index: number) => {
    setActiveIndex(index)
    itemRefs.current[index]?.focus()
  }

  const handleTypeahead = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const { key } = event
    // Single printable characters only — Space activates the focused item
    // (native button click) and modifier chords are shortcuts, not typeahead.
    if (key.length !== 1 || key === ' ' || event.ctrlKey || event.altKey || event.metaKey) {
      return
    }

    window.clearTimeout(typeaheadTimerRef.current)
    typeaheadBufferRef.current += key.toLowerCase()
    const buffer = typeaheadBufferRef.current
    // Reset the buffer after the window elapses. The pending timer only
    // mutates a ref, so it is deliberately not cleared on unmount — firing
    // late is a complete no-op (no state update, nothing retained).
    typeaheadTimerRef.current = window.setTimeout(() => {
      typeaheadBufferRef.current = ''
    }, TYPEAHEAD_RESET_MS)

    // Prefix-match labels case-insensitively, starting from the item AFTER
    // the current one and wrapping, so repeated single-character presses
    // cycle through matches (APG). Disabled items participate — they are
    // focusable, just not activatable.
    const count = items.length
    for (let step = 1; step <= count; step += 1) {
      const index = (activeIndex + step) % count
      if (items[index].label.toLowerCase().startsWith(buffer)) {
        moveFocus(index)
        return
      }
    }
  }

  const handleMenuKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const count = items.length
    if (count === 0) return

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault()
        moveFocus((activeIndex + 1) % count)
        break
      case 'ArrowUp':
        event.preventDefault()
        moveFocus((activeIndex - 1 + count) % count)
        break
      case 'Home':
        event.preventDefault()
        moveFocus(0)
        break
      case 'End':
        event.preventDefault()
        moveFocus(count - 1)
        break
      case 'Escape':
        event.preventDefault()
        closeMenu(true)
        break
      case 'Tab':
        // APG: Tab closes the menu and moves focus to the next element in
        // the page tab sequence. We return focus to the trigger and
        // deliberately do NOT preventDefault, so the browser's natural Tab
        // handling proceeds from the trigger to its neighbor.
        setOpen(false)
        triggerRef.current?.focus()
        break
      default:
        handleTypeahead(event)
    }
  }

  const handleItemClick = (item: MenuItem) => {
    // Disabled items stay focusable and are announced as disabled (APG
    // recommendation) — activation is a no-op and the menu stays open.
    if (item.disabled === true) return
    item.onSelect()
    closeMenu(true)
  }

  // Popover mode keeps the menu mounted (hidden until showPopover); the
  // fallback mounts it only while open.
  const renderMenu = supportsPopover || open

  return (
    <div className={styles.root} data-align={align}>
      <button
        ref={triggerRef}
        type="button"
        className={styles.trigger}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        onPointerDown={handleTriggerPointerDown}
        onClick={handleTriggerClick}
        onKeyDown={handleTriggerKeyDown}
      >
        {label}
        <span className={styles.caret} aria-hidden="true">
          ▾
        </span>
      </button>

      {renderMenu && (
        <div
          ref={menuRef}
          id={menuId}
          role="menu"
          aria-label={label}
          className={styles.menu}
          onKeyDown={handleMenuKeyDown}
          {...(supportsPopover ? { popover: 'auto' as const } : {})}
        >
          {items.map((item, index) => (
            <button
              key={item.id}
              ref={(el) => {
                itemRefs.current[index] = el
              }}
              type="button"
              role="menuitem"
              className={styles.item}
              // Roving tabindex: exactly one item is in the tab sequence.
              tabIndex={index === activeIndex ? 0 : -1}
              aria-disabled={item.disabled === true ? 'true' : undefined}
              onClick={() => handleItemClick(item)}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
