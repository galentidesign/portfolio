import { useId, useRef, useState, type ReactNode } from 'react'
import styles from './styles.module.css'

// Figma: https://www.figma.com/design/FDrHYp9F366R2GZ0Ra9koO/portfolio?node-id=109-2
// Component "Tabs" (assembly) + set "Tab" (node-id=108-17) — tab state→State
// (idle/selected/hover); label→"Label" text prop; selected underline = accent.
// Roving focus + animated indicator omitted. Bound to the "Tokens" collection.

export interface TabItem {
  id: string
  label: string
  content: ReactNode
}

export interface TabsProps {
  /** Tab definitions — id, label, and panel content. */
  items: readonly TabItem[]
  /** Controlled selected tab id — pair with onChange. */
  selected?: string
  /** Uncontrolled initial selection; defaults to the first item. */
  defaultSelected?: string
  /** Fires with the item id on click or keyboard selection, in both modes. */
  onChange?: (id: string) => void
  /** aria-label for the tablist. */
  label?: string
}

/**
 * WAI-ARIA APG "Tabs" pattern with automatic activation: arrow keys move
 * focus AND select, wrapping at the ends; Home/End jump to first/last.
 * Roving tabindex keeps a single tab stop inside the tablist.
 */
export function Tabs({
  items,
  selected: selectedProp,
  defaultSelected,
  onChange,
  label = 'Tabs',
}: TabsProps) {
  const baseId = useId()
  // Dual controlled/uncontrolled mode: internal state is consulted only when
  // `selected` is undefined; onChange fires either way.
  const [internalSelected, setInternalSelected] = useState<string | undefined>(
    () => defaultSelected ?? items[0]?.id,
  )
  const selected = selectedProp !== undefined ? selectedProp : internalSelected
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([])

  const tabId = (id: string) => `${baseId}-tab-${id}`
  const panelId = (id: string) => `${baseId}-panel-${id}`

  const select = (id: string) => {
    if (selectedProp === undefined) setInternalSelected(id)
    onChange?.(id)
  }

  const handleKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>, index: number) => {
    let next: number
    switch (event.key) {
      case 'ArrowRight':
        next = (index + 1) % items.length
        break
      case 'ArrowLeft':
        next = (index - 1 + items.length) % items.length
        break
      case 'Home':
        next = 0
        break
      case 'End':
        next = items.length - 1
        break
      default:
        return
    }
    event.preventDefault()
    // Automatic activation: focus moves and selection follows. In controlled
    // mode the parent owns selection — focus still moves, onChange reports.
    tabRefs.current[next]?.focus()
    select(items[next].id)
  }

  return (
    <div>
      <div role="tablist" aria-label={label} className={styles.tablist}>
        {items.map((item, index) => {
          const isSelected = item.id === selected
          return (
            <button
              key={item.id}
              ref={(el) => {
                tabRefs.current[index] = el
              }}
              type="button"
              role="tab"
              id={tabId(item.id)}
              aria-selected={isSelected}
              aria-controls={panelId(item.id)}
              // Roving tabindex — only the selected tab is a tab stop.
              tabIndex={isSelected ? 0 : -1}
              className={styles.tab}
              onClick={() => select(item.id)}
              onKeyDown={(event) => handleKeyDown(event, index)}
            >
              {item.label}
            </button>
          )
        })}
      </div>
      {/* All panels stay mounted; non-selected ones carry the `hidden`
          attribute — out of layout and the a11y tree, but their ids stay
          resolvable so every tab's aria-controls reference is valid, and
          panel-local state (form input, scroll) survives switches. */}
      {items.map((item) => {
        const isSelected = item.id === selected
        return (
          <div
            key={item.id}
            role="tabpanel"
            id={panelId(item.id)}
            aria-labelledby={tabId(item.id)}
            // Per APG: the panel is focusable so keyboard users can reach
            // panel content that contains no focusable elements. Hidden
            // panels are display:none, so their tabIndex is inert.
            tabIndex={0}
            hidden={!isSelected}
            className={styles.panel}
          >
            {item.content}
          </div>
        )
      })}
    </div>
  )
}
