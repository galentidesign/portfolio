/**
 * Palette — internal to Nav. Not exported from meta.ts.
 *
 * Native <dialog> with APG combobox pattern.
 *
 * Mount/unmount pattern: Nav renders <Palette> only when `paletteOpen` is
 * true. The dialog.showModal() call is in a mount effect — no setState inside
 * effects — and state resets naturally on unmount. @starting-style entry
 * animation fires on the first paint of the element, so mount/unmount is
 * compatible with CSS entry animation.
 *
 * Perform order: perform() first, then onClose(). Native dialog.close()
 * restores focus to the element that was focused before showModal(). Calling
 * perform() first lets any intentional focus move from perform() win; our
 * subsequent close() then only restores focus when the dialog still owns it.
 *
 * Option order: one canonical sequence — the grouped map flattened — drives
 * both flatOptions (keyboard nav) and the render loop, so the keyboard order
 * always equals the visual order even when actions interleave groups.
 * The first result is auto-highlighted so type-then-Enter runs the top hit.
 *
 * Escape: handled at both the input (via onKeyDown bubbling to dialog) and
 * at the window level, so it fires regardless of which element holds focus.
 * Standard palette etiquette: ⌘K/Ctrl+K while the input is focused toggles
 * close; plain Escape always closes. We skip the editable-element guard that
 * some palettes apply to global shortcuts because the modifier key (Meta/Ctrl)
 * is always held for ⌘K — no conflict with regular typing.
 */

import { useRef, useState, useEffect, useId } from 'react'
import styles from './styles.module.css'

export interface PaletteAction {
  id: string
  label: string
  group?: string
  keywords?: readonly string[]
  perform: () => void
}

interface PaletteProps {
  actions: readonly PaletteAction[]
  onClose: () => void
}

interface FlatOption {
  action: PaletteAction
  optionId: string
}

function filterActions(actions: readonly PaletteAction[], query: string): PaletteAction[] {
  if (query === '') return [...actions]
  const q = query.toLowerCase()
  return actions.filter(
    (a) =>
      a.label.toLowerCase().includes(q) || a.keywords?.some((k) => k.toLowerCase().includes(q)),
  )
}

function groupResults(actions: PaletteAction[]): Map<string, PaletteAction[]> {
  const map = new Map<string, PaletteAction[]>()
  for (const a of actions) {
    const g = a.group ?? ''
    const existing = map.get(g)
    if (existing) {
      existing.push(a)
    } else {
      map.set(g, [a])
    }
  }
  return map
}

export function Palette({ actions, onClose }: PaletteProps) {
  const dialogRef = useRef<HTMLDialogElement | null>(null)
  const inputRef = useRef<HTMLInputElement | null>(null)
  const listboxRef = useRef<HTMLUListElement | null>(null)

  const listboxId = useId()
  const statusId = useId()
  const baseOptionId = useId()

  const [query, setQuery] = useState('')
  // Auto-highlight: the first result is active by default (and re-activated on
  // every query change) so type-then-Enter performs the top hit — the core
  // palette gesture. With an empty result set there is no active option.
  const [activeIndex, setActiveIndex] = useState<number>(0)

  const filtered = filterActions(actions, query)
  const grouped = groupResults(filtered)

  // Canonical option order = VISUAL order: flatten the grouped map. Building
  // flatOptions from `filtered` directly would diverge from the rendered
  // sequence whenever actions interleave groups (grouping reorders rows) —
  // the highlighted row and the action Enter performs would be different
  // items. One order, consumed by both keyboard nav and the render loop.
  const ordered = [...grouped.values()].flat()
  const flatOptions: FlatOption[] = ordered.map((action, i) => ({
    action,
    optionId: `${baseOptionId}-opt-${i}`,
  }))

  const hasResults = flatOptions.length > 0

  const activeOptionId =
    hasResults && activeIndex >= 0 && activeIndex < flatOptions.length
      ? flatOptions[activeIndex].optionId
      : undefined

  // Open the native dialog on mount; close it on unmount. Palette is only
  // rendered when open, so showModal() runs once on mount and close() runs
  // once on unmount. close() ensures the 'open' attribute is removed from
  // the element in memory (important for test assertions).
  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    dialog.showModal()
    // Autofocus the input after showModal settles
    requestAnimationFrame(() => inputRef.current?.focus())
    return () => {
      if (dialog.open) dialog.close()
    }
  }, [])

  // Scroll active option into view; guard scrollIntoView existence for jsdom.
  useEffect(() => {
    if (activeOptionId === undefined) return
    const list = listboxRef.current
    if (!list) return
    const opt = list.querySelector(`[id="${activeOptionId}"]`)
    if (opt && typeof (opt as HTMLElement).scrollIntoView === 'function') {
      ;(opt as HTMLElement).scrollIntoView({ block: 'nearest' })
    }
  }) // no dep array — re-runs every render; cheap when the active option is unchanged

  // Window-level Escape listener. Catches Escape regardless of where focus
  // lands (e.g. trigger still focused in jsdom after showModal, or a scroll
  // region). The onKeyDown on the dialog catches it when focus is inside the
  // dialog; both paths call onClose, which is idempotent.
  useEffect(() => {
    function handleWindowKeyDown(e: globalThis.KeyboardEvent) {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
      }
    }
    window.addEventListener('keydown', handleWindowKeyDown)
    return () => window.removeEventListener('keydown', handleWindowKeyDown)
  }, [onClose])

  // Native dialog cancel event (browser-level Escape) — prevent the browser
  // from closing the dialog itself; our onClose handler drives the close.
  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    const handleCancel = (e: Event) => {
      e.preventDefault()
      onClose()
    }
    dialog.addEventListener('cancel', handleCancel)
    return () => dialog.removeEventListener('cancel', handleCancel)
  }, [onClose])

  function performActive() {
    if (activeIndex < 0 || activeIndex >= flatOptions.length) return
    const { action } = flatOptions[activeIndex]
    action.perform()
    onClose()
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLElement>) {
    const count = flatOptions.length
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setActiveIndex((prev) => (count === 0 ? prev : (prev + 1) % count))
        break
      case 'ArrowUp':
        e.preventDefault()
        setActiveIndex((prev) => (count === 0 ? prev : (prev - 1 + count) % count))
        break
      case 'Home':
        e.preventDefault()
        setActiveIndex(0)
        break
      case 'End':
        e.preventDefault()
        setActiveIndex(Math.max(0, count - 1))
        break
      case 'Enter':
        e.preventDefault()
        performActive()
        break
      case 'Escape':
        e.preventDefault()
        onClose()
        break
      default:
        break
    }
  }

  // Build rendered option list grouped in source order.
  let optCursor = 0
  const renderedGroups: React.ReactNode[] = []

  for (const [groupLabel, groupActions] of grouped) {
    // Ungrouped actions get no header row — an empty-text header li is noise
    // for both sighted users and the accessibility tree.
    if (groupLabel !== '') {
      renderedGroups.push(
        <li
          key={`grp-${groupLabel}`}
          role="presentation"
          className={styles['palette-group-header']}
        >
          {groupLabel}
        </li>,
      )
    }
    for (const action of groupActions) {
      const idx = optCursor++
      const flat = flatOptions[idx]
      const isActive = idx === activeIndex
      renderedGroups.push(
        <li
          key={action.id}
          id={flat.optionId}
          role="option"
          aria-selected={isActive}
          className={styles['palette-option']}
          data-active={isActive ? '' : undefined}
          onMouseEnter={() => setActiveIndex(idx)}
          onClick={() => {
            action.perform()
            onClose()
          }}
        >
          {action.label}
        </li>,
      )
    }
  }

  return (
    <dialog
      ref={dialogRef}
      className={styles['palette-dialog']}
      aria-label="Command palette"
      onKeyDown={handleKeyDown}
    >
      <div className={styles['palette-panel']}>
        <div className={styles['palette-input-row']}>
          <input
            ref={inputRef}
            role="combobox"
            // aria-expanded reflects whether the listbox popup is shown; in
            // the no-results state the listbox is not rendered, so a static
            // `true` (or a dangling aria-controls idref) would fail axe's
            // aria-valid-attr-value check.
            aria-expanded={hasResults}
            aria-controls={hasResults ? listboxId : undefined}
            aria-activedescendant={activeOptionId}
            aria-label="Search commands"
            type="text"
            className={styles['palette-input']}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              // Re-highlight the top hit for the new query
              setActiveIndex(0)
            }}
            autoComplete="off"
            spellCheck={false}
          />
        </div>

        {filtered.length === 0 ? (
          <p role="status" id={statusId} className={styles['palette-empty']}>
            No matching commands
          </p>
        ) : (
          <ul
            ref={listboxRef}
            id={listboxId}
            role="listbox"
            aria-label="Commands"
            className={styles['palette-list']}
          >
            {renderedGroups}
          </ul>
        )}
      </div>
    </dialog>
  )
}
