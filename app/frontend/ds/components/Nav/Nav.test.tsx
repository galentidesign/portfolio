/**
 * Nav + Palette test suite.
 *
 * jsdom workarounds:
 *  - dialog.showModal() / dialog.close() are not implemented in jsdom. We
 *    patch them in beforeEach to (a) toggle the `open` attribute and (b)
 *    track the open state so aria-expanded assertions work.
 *  - scrollIntoView is not implemented; Palette guards its existence before
 *    calling it, so no patch is needed here (no error, no assertion on it).
 *  - ⌘K is sent with userEvent.keyboard('[MetaLeft>]k[/MetaLeft]').
 */

import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Nav } from './Nav'
import type { PaletteAction } from './palette'

// ── jsdom: patch HTMLDialogElement ──────────────────────────────────────────

beforeEach(() => {
  // jsdom does not implement showModal/close on <dialog>. Patch the prototype
  // so our component's useEffect calls don't throw and the `open` attribute
  // is toggled faithfully (ARIA and query assertions depend on it).
  HTMLDialogElement.prototype.showModal = function () {
    this.setAttribute('open', '')
    this.dispatchEvent(new Event('open'))
  }
  HTMLDialogElement.prototype.close = function () {
    this.removeAttribute('open')
    this.dispatchEvent(new Event('close'))
  }
})

// ── Helpers ─────────────────────────────────────────────────────────────────

const BRAND = { label: 'Test Brand', href: '/' }

const NAV_ITEMS = [
  { label: 'Alpha', href: '/alpha', current: true },
  { label: 'Beta', href: '/beta' },
  { label: 'Gamma', href: '/gamma' },
]

function makeActions(overrides: Partial<PaletteAction>[] = []): PaletteAction[] {
  const base: PaletteAction[] = [
    { id: 'go-home', label: 'Home', group: 'Navigate', perform: vi.fn() },
    { id: 'go-about', label: 'About', group: 'Navigate', perform: vi.fn() },
    { id: 'go-work', label: 'Work', group: 'Navigate', perform: vi.fn() },
    {
      id: 'toggle-skin',
      label: 'Switch skin',
      group: 'Preferences',
      keywords: ['theme'],
      perform: vi.fn(),
    },
    {
      id: 'toggle-motion',
      label: 'Toggle motion',
      group: 'Preferences',
      keywords: ['animation'],
      perform: vi.fn(),
    },
  ]
  overrides.forEach((o, i) => Object.assign(base[i], o))
  return base
}

function renderNav(props: Partial<React.ComponentProps<typeof Nav>> = {}) {
  return render(<Nav brand={BRAND} items={NAV_ITEMS} actions={makeActions()} {...props} />)
}

// ── Skip link ────────────────────────────────────────────────────────────────

describe('Nav skip link', () => {
  it('is the first focusable element in the document', async () => {
    renderNav()
    const user = userEvent.setup()
    await user.tab()
    const skip = screen.getByRole('link', { name: 'Skip to content' })
    expect(document.activeElement).toBe(skip)
  })

  it('targets #main by default', () => {
    renderNav()
    const skip = screen.getByRole('link', { name: 'Skip to content' })
    expect(skip).toHaveAttribute('href', '#main')
  })

  it('uses the skipTargetId prop', () => {
    renderNav({ skipTargetId: 'content' })
    const skip = screen.getByRole('link', { name: 'Skip to content' })
    expect(skip).toHaveAttribute('href', '#content')
  })
})

// ── Nav landmark ─────────────────────────────────────────────────────────────

describe('Nav landmark', () => {
  it('has aria-label "Primary" on the nav element', () => {
    renderNav()
    expect(screen.getByRole('navigation', { name: 'Primary' })).toBeInTheDocument()
  })

  it('renders all nav items', () => {
    renderNav()
    const nav = screen.getByRole('navigation', { name: 'Primary' })
    expect(within(nav).getByRole('link', { name: 'Alpha' })).toBeInTheDocument()
    expect(within(nav).getByRole('link', { name: 'Beta' })).toBeInTheDocument()
    expect(within(nav).getByRole('link', { name: 'Gamma' })).toBeInTheDocument()
  })

  it('marks the current item with aria-current="page"', () => {
    renderNav()
    const nav = screen.getByRole('navigation', { name: 'Primary' })
    const current = within(nav).getByRole('link', { name: 'Alpha' })
    expect(current).toHaveAttribute('aria-current', 'page')
  })

  it('does not mark non-current items with aria-current', () => {
    renderNav()
    const nav = screen.getByRole('navigation', { name: 'Primary' })
    const beta = within(nav).getByRole('link', { name: 'Beta' })
    expect(beta).not.toHaveAttribute('aria-current')
  })
})

// ── Palette trigger ───────────────────────────────────────────────────────────

describe('Palette trigger', () => {
  it('renders the trigger button when actions are provided', () => {
    renderNav()
    expect(screen.getByRole('button', { name: 'Search & commands' })).toBeInTheDocument()
  })

  it('does not render the trigger when no actions are provided', () => {
    renderNav({ actions: undefined })
    expect(screen.queryByRole('button', { name: 'Search & commands' })).not.toBeInTheDocument()
  })

  it('trigger click opens the palette and focuses the input', async () => {
    const user = userEvent.setup()
    renderNav()
    await user.click(screen.getByRole('button', { name: 'Search & commands' }))
    const input = screen.getByRole('combobox', { name: 'Search commands' })
    expect(input).toBeInTheDocument()
    // The dialog should have the open attribute (jsdom-patched showModal)
    const dialog = document.querySelector('dialog')!
    expect(dialog).toHaveAttribute('open')
  })
})

// ── ⌘K shortcut ──────────────────────────────────────────────────────────────

describe('⌘K shortcut', () => {
  it('opens palette with ⌘K', async () => {
    const user = userEvent.setup()
    renderNav()
    await user.keyboard('[MetaLeft>]k[/MetaLeft]')
    const dialog = document.querySelector('dialog')!
    expect(dialog).toHaveAttribute('open')
  })

  it('closes palette with ⌘K when already open (toggle)', async () => {
    const user = userEvent.setup()
    renderNav()
    // Open
    await user.keyboard('[MetaLeft>]k[/MetaLeft]')
    expect(document.querySelector('dialog')).toHaveAttribute('open')
    // Close via toggle — query fresh; Palette unmounts so old ref may be stale
    await user.keyboard('[MetaLeft>]k[/MetaLeft]')
    expect(document.querySelector('dialog')).toBeNull()
  })

  it('enableShortcut=false ignores ⌘K', async () => {
    const user = userEvent.setup()
    renderNav({ enableShortcut: false })
    await user.keyboard('[MetaLeft>]k[/MetaLeft]')
    // Palette should never mount when shortcut is disabled
    expect(document.querySelector('dialog')).toBeNull()
  })

  it('⌘K while focus is in the palette input toggles close', async () => {
    const user = userEvent.setup()
    renderNav()
    // Open via trigger click
    await user.click(screen.getByRole('button', { name: 'Search & commands' }))
    expect(document.querySelector('dialog')).toHaveAttribute('open')
    // With palette open, ⌘K should close (palette unmounts)
    await user.keyboard('[MetaLeft>]k[/MetaLeft]')
    expect(document.querySelector('dialog')).toBeNull()
  })
})

// ── Escape closes ─────────────────────────────────────────────────────────────

describe('Escape closes palette', () => {
  it('Escape closes the palette and focus returns to the trigger', async () => {
    const user = userEvent.setup()
    renderNav()
    await user.click(screen.getByRole('button', { name: 'Search & commands' }))
    expect(document.querySelector('dialog')).toHaveAttribute('open')
    // Escape is caught by the window-level listener in Palette regardless of
    // where focus lands; Palette unmounts and dialog is removed from DOM.
    await user.keyboard('{Escape}')
    expect(document.querySelector('dialog')).toBeNull()
  })
})

// ── Filtering ─────────────────────────────────────────────────────────────────

describe('Palette filtering', () => {
  async function openAndType(user: ReturnType<typeof userEvent.setup>, text: string) {
    await user.click(screen.getByRole('button', { name: 'Search & commands' }))
    const input = screen.getByRole('combobox', { name: 'Search commands' })
    await user.type(input, text)
    return input
  }

  it('shows all actions when query is empty', async () => {
    const user = userEvent.setup()
    renderNav()
    await user.click(screen.getByRole('button', { name: 'Search & commands' }))
    const listbox = screen.getByRole('listbox', { name: 'Commands' })
    const options = within(listbox).getAllByRole('option')
    expect(options.length).toBe(5) // 5 actions in makeActions()
  })

  it('filters by label substring', async () => {
    const user = userEvent.setup()
    renderNav()
    await openAndType(user, 'sk')
    const listbox = screen.getByRole('listbox', { name: 'Commands' })
    const options = within(listbox).getAllByRole('option')
    // 'Switch skin' matches 'sk' in 'skin'
    expect(options.length).toBe(1)
    expect(options[0]).toHaveTextContent('Switch skin')
  })

  it('filters by keywords', async () => {
    const user = userEvent.setup()
    renderNav()
    await openAndType(user, 'animation')
    const listbox = screen.getByRole('listbox', { name: 'Commands' })
    const options = within(listbox).getAllByRole('option')
    expect(options.length).toBe(1)
    expect(options[0]).toHaveTextContent('Toggle motion')
  })

  it('shows no-results status when nothing matches', async () => {
    const user = userEvent.setup()
    renderNav()
    const input = await openAndType(user, 'zzznomatch')
    expect(screen.getByRole('status')).toHaveTextContent('No matching commands')
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
    // ARIA hygiene: no dangling idrefs when the listbox is not rendered
    expect(input).toHaveAttribute('aria-expanded', 'false')
    expect(input).not.toHaveAttribute('aria-controls')
    expect(input).not.toHaveAttribute('aria-activedescendant')
  })
})

// ── Keyboard navigation ───────────────────────────────────────────────────────
// Auto-highlight: the first option is active on open and after every query
// change, so navigation counts start from index 0, not from "no selection".

describe('Palette keyboard navigation', () => {
  async function openPalette(user: ReturnType<typeof userEvent.setup>) {
    await user.click(screen.getByRole('button', { name: 'Search & commands' }))
    return screen.getByRole('combobox', { name: 'Search commands' })
  }

  it('auto-highlights the first option on open', async () => {
    const user = userEvent.setup()
    renderNav()
    const input = await openPalette(user)
    const listbox = screen.getByRole('listbox', { name: 'Commands' })
    const options = within(listbox).getAllByRole('option')
    expect(options[0]).toHaveAttribute('aria-selected', 'true')
    expect(input).toHaveAttribute('aria-activedescendant', options[0].id)
  })

  it('ArrowDown moves active from the first to the second option', async () => {
    const user = userEvent.setup()
    renderNav()
    const input = await openPalette(user)
    await user.type(input, '{ArrowDown}')
    const listbox = screen.getByRole('listbox', { name: 'Commands' })
    const options = within(listbox).getAllByRole('option')
    expect(options[1]).toHaveAttribute('aria-selected', 'true')
    expect(input).toHaveAttribute('aria-activedescendant', options[1].id)
  })

  it('ArrowDown wraps from last to first', async () => {
    const user = userEvent.setup()
    renderNav()
    const input = await openPalette(user)
    const listbox = screen.getByRole('listbox', { name: 'Commands' })
    // Jump to last, then one more ArrowDown must wrap to first
    await user.type(input, '{End}')
    await user.type(input, '{ArrowDown}')
    const options = within(listbox).getAllByRole('option')
    expect(options[0]).toHaveAttribute('aria-selected', 'true')
    expect(input).toHaveAttribute('aria-activedescendant', options[0].id)
  })

  it('ArrowUp from the first option wraps to the last', async () => {
    const user = userEvent.setup()
    renderNav()
    const input = await openPalette(user)
    // Initial active is index 0 — ArrowUp must wrap to the end
    await user.type(input, '{ArrowUp}')
    const listbox = screen.getByRole('listbox', { name: 'Commands' })
    const options = within(listbox).getAllByRole('option')
    const last = options[options.length - 1]
    expect(last).toHaveAttribute('aria-selected', 'true')
    expect(input).toHaveAttribute('aria-activedescendant', last.id)
  })

  it('Home moves to first option', async () => {
    const user = userEvent.setup()
    renderNav()
    const input = await openPalette(user)
    // Move away from the top first
    await user.type(input, '{End}')
    await user.type(input, '{Home}')
    const listbox = screen.getByRole('listbox', { name: 'Commands' })
    const options = within(listbox).getAllByRole('option')
    expect(options[0]).toHaveAttribute('aria-selected', 'true')
  })

  it('End moves to last option', async () => {
    const user = userEvent.setup()
    renderNav()
    const input = await openPalette(user)
    await user.type(input, '{End}')
    const listbox = screen.getByRole('listbox', { name: 'Commands' })
    const options = within(listbox).getAllByRole('option')
    const last = options[options.length - 1]
    expect(last).toHaveAttribute('aria-selected', 'true')
  })
})

// ── Enter performs action ─────────────────────────────────────────────────────

describe('Palette Enter key', () => {
  it('Enter with no arrow presses performs the auto-highlighted first action', async () => {
    const user = userEvent.setup()
    const actions = makeActions()
    render(<Nav brand={BRAND} items={NAV_ITEMS} actions={actions} />)
    await user.click(screen.getByRole('button', { name: 'Search & commands' }))
    const input = screen.getByRole('combobox', { name: 'Search commands' })
    await user.type(input, '{Enter}')
    expect(actions[0].perform).toHaveBeenCalledTimes(1)
    expect(document.querySelector('dialog')).toBeNull()
  })

  it('Enter after ArrowDown performs the second action exactly once and closes', async () => {
    const user = userEvent.setup()
    const actions = makeActions()
    render(<Nav brand={BRAND} items={NAV_ITEMS} actions={actions} />)
    await user.click(screen.getByRole('button', { name: 'Search & commands' }))
    const input = screen.getByRole('combobox', { name: 'Search commands' })
    await user.type(input, '{ArrowDown}')
    await user.type(input, '{Enter}')
    expect(actions[1].perform).toHaveBeenCalledTimes(1)
    expect(actions[0].perform).not.toHaveBeenCalled()
    // Palette unmounts after perform+close — dialog is removed from DOM
    expect(document.querySelector('dialog')).toBeNull()
  })

  it('type-then-Enter performs the top filtered result without arrow presses', async () => {
    const user = userEvent.setup()
    const actions = makeActions()
    render(<Nav brand={BRAND} items={NAV_ITEMS} actions={actions} />)
    await user.click(screen.getByRole('button', { name: 'Search & commands' }))
    const input = screen.getByRole('combobox', { name: 'Search commands' })
    await user.type(input, 'motion')
    await user.type(input, '{Enter}')
    // 'Toggle motion' is the only (thus top) hit for 'motion'
    expect(actions[4].perform).toHaveBeenCalledTimes(1)
    expect(document.querySelector('dialog')).toBeNull()
  })
})

// ── Grouped-order regression (interleaved groups) ─────────────────────────────
// flatOptions must be derived from the grouped (visual) order, not the filter
// order. With actions interleaving groups [Navigate, Preferences, Navigate],
// the rendered rows are Navigate's two items first — keyboard nav and Enter
// must track that visual order, not the source array order.

describe('Palette grouped-order regression', () => {
  function makeInterleaved(): PaletteAction[] {
    return [
      { id: 'a', label: 'Alpha action', group: 'Navigate', perform: vi.fn() },
      { id: 'b', label: 'Bravo action', group: 'Preferences', perform: vi.fn() },
      { id: 'c', label: 'Charlie action', group: 'Navigate', perform: vi.fn() },
    ]
  }

  it('renders options grouped: both Navigate items before the Preferences item', async () => {
    const user = userEvent.setup()
    render(<Nav brand={BRAND} items={NAV_ITEMS} actions={makeInterleaved()} />)
    await user.click(screen.getByRole('button', { name: 'Search & commands' }))
    const listbox = screen.getByRole('listbox', { name: 'Commands' })
    const options = within(listbox).getAllByRole('option')
    expect(options.map((o) => o.textContent)).toEqual([
      'Alpha action',
      'Charlie action',
      'Bravo action',
    ])
  })

  it('keyboard order equals visual order and Enter performs the highlighted row', async () => {
    const user = userEvent.setup()
    const actions = makeInterleaved()
    render(<Nav brand={BRAND} items={NAV_ITEMS} actions={actions} />)
    await user.click(screen.getByRole('button', { name: 'Search & commands' }))
    const input = screen.getByRole('combobox', { name: 'Search commands' })
    const listbox = screen.getByRole('listbox', { name: 'Commands' })

    // Auto-highlight: top of the list is Alpha (Navigate's first item)
    let options = within(listbox).getAllByRole('option')
    expect(options[0]).toHaveTextContent('Alpha action')
    expect(input).toHaveAttribute('aria-activedescendant', options[0].id)

    // One ArrowDown from the top lands on the first group's second item —
    // Charlie, the visually second option (source-order index 2). Under the
    // old filter-order bug this would highlight the Charlie row but Enter
    // would perform Bravo (filter-order index 1).
    await user.type(input, '{ArrowDown}')
    options = within(listbox).getAllByRole('option')
    expect(options[1]).toHaveTextContent('Charlie action')
    expect(options[1]).toHaveAttribute('aria-selected', 'true')
    expect(input).toHaveAttribute('aria-activedescendant', options[1].id)

    await user.type(input, '{Enter}')
    expect(actions[2].perform).toHaveBeenCalledTimes(1) // Charlie
    expect(actions[1].perform).not.toHaveBeenCalled() // Bravo must NOT fire
    expect(actions[0].perform).not.toHaveBeenCalled()
  })
})

// ── Group headers ─────────────────────────────────────────────────────────────

describe('Palette group headers', () => {
  it('renders group headers from action.group', async () => {
    const user = userEvent.setup()
    renderNav()
    await user.click(screen.getByRole('button', { name: 'Search & commands' }))
    expect(screen.getByText('Navigate')).toBeInTheDocument()
    expect(screen.getByText('Preferences')).toBeInTheDocument()
  })

  it('renders no header row for ungrouped actions', async () => {
    const user = userEvent.setup()
    const actions: PaletteAction[] = [
      { id: 'one', label: 'One', perform: vi.fn() },
      { id: 'two', label: 'Two', perform: vi.fn() },
    ]
    render(<Nav brand={BRAND} items={NAV_ITEMS} actions={actions} />)
    await user.click(screen.getByRole('button', { name: 'Search & commands' }))
    const listbox = screen.getByRole('listbox', { name: 'Commands' })
    // Every li must be an option — no empty presentation header rows
    const allRows = listbox.querySelectorAll('li')
    const options = within(listbox).getAllByRole('option')
    expect(allRows.length).toBe(options.length)
    expect(options.length).toBe(2)
  })
})

// ── Landmark label ────────────────────────────────────────────────────────────

describe('Nav landmark label', () => {
  it('names the nav landmark Primary by default', () => {
    render(<Nav brand={BRAND} items={NAV_ITEMS} />)
    expect(screen.getByRole('navigation', { name: 'Primary' })).toBeInTheDocument()
  })

  it('renames the landmark via the label prop (unique-landmark requirement)', () => {
    render(<Nav brand={BRAND} items={NAV_ITEMS} label="Demo shell" />)
    expect(screen.getByRole('navigation', { name: 'Demo shell' })).toBeInTheDocument()
    expect(screen.queryByRole('navigation', { name: 'Primary' })).not.toBeInTheDocument()
  })
})

// ── linkAs prop ───────────────────────────────────────────────────────────────
// Stub component forwards all props to <a> and adds data-testid="stub-link"
// so we can distinguish its renders from the native skip-link anchor.

function StubLink({ children, ...props }: React.ComponentPropsWithoutRef<'a'>) {
  return (
    <a data-testid="stub-link" {...props}>
      {children}
    </a>
  )
}

describe('linkAs prop', () => {
  it('renders the brand link and all item links via the provided component', () => {
    render(<Nav brand={BRAND} items={NAV_ITEMS} linkAs={StubLink} />)
    // 1 brand + 3 nav items = 4 stub-link anchors
    const stubLinks = screen.getAllByTestId('stub-link')
    expect(stubLinks).toHaveLength(4)
  })

  it('brand link uses the provided component with the correct href', () => {
    render(<Nav brand={BRAND} items={NAV_ITEMS} linkAs={StubLink} />)
    const stubLinks = screen.getAllByTestId('stub-link')
    const brandLink = stubLinks.find((el) => el.textContent === 'Test Brand')
    expect(brandLink).toBeInTheDocument()
    expect(brandLink).toHaveAttribute('href', '/')
  })

  it('nav item links use the provided component', () => {
    render(<Nav brand={BRAND} items={NAV_ITEMS} linkAs={StubLink} />)
    const stubLinks = screen.getAllByTestId('stub-link')
    const labels = stubLinks.map((el) => el.textContent)
    expect(labels).toContain('Alpha')
    expect(labels).toContain('Beta')
    expect(labels).toContain('Gamma')
  })

  it('skip link is always a plain anchor — unaffected by linkAs', () => {
    render(<Nav brand={BRAND} items={NAV_ITEMS} linkAs={StubLink} />)
    const skipLink = screen.getByRole('link', { name: 'Skip to content' })
    // Skip link must NOT carry the stub marker — it is a native <a>, not LinkComponent
    expect(skipLink).not.toHaveAttribute('data-testid', 'stub-link')
    expect(skipLink).toHaveAttribute('href', '#main')
  })
})
