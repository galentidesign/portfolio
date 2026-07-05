import { useState, useRef, useEffect, type ElementType, type Ref } from 'react'
import styles from './styles.module.css'
// Figma: https://www.figma.com/design/FDrHYp9F366R2GZ0Ra9koO/portfolio?node-id=34-2
// Component "Nav" (+ "Nav / Palette" node 35-2) — brand→Brand TEXT; current
// link = ink + 2px accent underline; palette trigger chip with mono kbd hint.
// Palette dialog is its own component on the Nav page. Tokens collection
// modes: galenti, rails-era.
import { Palette, type PaletteAction } from './palette'

export interface NavItem {
  label: string
  href: string
  current?: boolean
}

export interface NavProps {
  brand: { label: string; href: string }
  items: readonly NavItem[]
  actions?: readonly PaletteAction[]
  /** id of the landmark to skip to. Default 'main'. */
  skipTargetId?: string
  /** Mount global ⌘K / Ctrl+K shortcut. Default true. */
  enableShortcut?: boolean
  /**
   * Accessible name for the nav landmark. Must be unique when a page hosts
   * more than one Nav (or any other named navigation landmark).
   */
  label?: string
  /**
   * Element type rendered for the brand and item links — pass a router Link
   * for client-side navigation. The skip link stays a plain anchor (it's a
   * same-document jump). Default 'a'.
   */
  linkAs?: ElementType
  ref?: Ref<HTMLElement>
}

export function Nav({
  brand,
  items,
  actions,
  skipTargetId = 'main',
  enableShortcut = true,
  label = 'Primary',
  linkAs: LinkComponent = 'a',
  ref,
}: NavProps) {
  const [paletteOpen, setPaletteOpen] = useState(false)
  const triggerRef = useRef<HTMLButtonElement | null>(null)

  const hasPalette = actions !== undefined && actions.length > 0

  function openPalette() {
    if (hasPalette) setPaletteOpen(true)
  }

  function closePalette() {
    setPaletteOpen(false)
    // Return focus to trigger. Native dialog.close() should handle this, but
    // we call it explicitly here for the mount/unmount pattern (no native close).
    requestAnimationFrame(() => triggerRef.current?.focus())
  }

  // Global ⌘K / Ctrl+K shortcut.
  // Standard palette etiquette: when focus is in an editable element, skip
  // unless a modifier is held — which ⌘K always requires, so it always fires.
  // We also ignore key repeats when the palette is open to prevent flicker.
  useEffect(() => {
    if (!enableShortcut || !hasPalette) return

    function handleKeyDown(e: globalThis.KeyboardEvent) {
      if (e.repeat && paletteOpen) return
      if (!(e.key === 'k' && (e.metaKey || e.ctrlKey))) return
      e.preventDefault()
      if (paletteOpen) {
        closePalette()
      } else {
        openPalette()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  })

  return (
    <>
      <header ref={ref} className={styles.nav} data-testid="nav-header">
        {/* Skip link — visually hidden, appears on :focus-visible, z-skip */}
        <a href={`#${skipTargetId}`} className={styles['skip-link']}>
          Skip to content
        </a>

        {/* Brand */}
        <LinkComponent href={brand.href} className={styles.brand}>
          {brand.label}
        </LinkComponent>

        {/* Primary nav */}
        <nav aria-label={label}>
          <ul className={styles['nav-list']}>
            {items.map((item) => (
              <li key={item.href} className={styles['nav-item']}>
                <LinkComponent
                  href={item.href}
                  className={styles['nav-link']}
                  {...(item.current ? { 'aria-current': 'page' as const } : {})}
                  data-current={item.current ? '' : undefined}
                >
                  {item.label}
                </LinkComponent>
              </li>
            ))}
          </ul>
        </nav>

        {/* Palette trigger — only when actions are provided */}
        {hasPalette && (
          <button
            ref={triggerRef}
            type="button"
            className={styles['palette-trigger']}
            aria-label="Search & commands"
            aria-haspopup="dialog"
            aria-expanded={paletteOpen}
            onClick={openPalette}
          >
            Search <kbd className={styles['palette-kbd']}>⌘K</kbd>
          </button>
        )}
      </header>

      {/* Palette is mounted only when open — state resets on unmount,
          and @starting-style entry animation fires on first paint. */}
      {hasPalette && paletteOpen && <Palette actions={actions!} onClose={closePalette} />}
    </>
  )
}
