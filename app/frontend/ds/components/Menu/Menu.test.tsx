import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi, type Mock } from 'vitest'
import { Menu, type MenuItem } from './Menu'

// ─── jsdom + popover ─────────────────────────────────────────────────────────
// jsdom does not implement the popover API (no showPopover/hidePopover, no
// light dismiss). Menu feature-detects `typeof el.showPopover === 'function'`
// and falls back to plain conditional rendering: the menu is mounted only
// while open and carries no popover attribute. Everything below therefore
// exercises the fallback path — which shares all keyboard/ARIA logic with the
// popover path; only top-layer + platform light dismiss differ. The light
// dismiss → state sync is still covered by dispatching a synthetic `toggle`
// event (the component listens in both modes).

const LABELS = ['Archive', 'Duplicate', 'Delete', 'Move up', 'Export'] as const

interface TestItem extends MenuItem {
  onSelect: Mock<() => void>
}

function makeItems(disabledLabels: readonly string[] = []): TestItem[] {
  return LABELS.map((label) => ({
    id: label.toLowerCase().replace(/\s+/g, '-'),
    label,
    disabled: disabledLabels.includes(label),
    onSelect: vi.fn<() => void>(),
  }))
}

function getTrigger(name = 'Actions') {
  return screen.getByRole('button', { name })
}

// ─── ARIA wiring ─────────────────────────────────────────────────────────────

describe('Menu trigger ARIA wiring', () => {
  it('has aria-haspopup="menu" and aria-expanded="false" when closed', () => {
    render(<Menu label="Actions" items={makeItems()} />)
    const trigger = getTrigger()
    expect(trigger).toHaveAttribute('aria-haspopup', 'menu')
    expect(trigger).toHaveAttribute('aria-expanded', 'false')
    expect(trigger.getAttribute('aria-controls')).toBeTruthy()
  })

  it('sets aria-expanded="true" and aria-controls pointing at the menu when open', async () => {
    const user = userEvent.setup()
    render(<Menu label="Actions" items={makeItems()} />)
    const trigger = getTrigger()
    await user.click(trigger)
    expect(trigger).toHaveAttribute('aria-expanded', 'true')
    const menu = screen.getByRole('menu', { name: 'Actions' })
    expect(trigger.getAttribute('aria-controls')).toBe(menu.id)
  })

  it('renders every item with role="menuitem"', async () => {
    const user = userEvent.setup()
    render(<Menu label="Actions" items={makeItems()} />)
    await user.click(getTrigger())
    const menuitems = screen.getAllByRole('menuitem')
    expect(menuitems.map((el) => el.textContent)).toEqual([...LABELS])
  })
})

// ─── Variant axis: align ─────────────────────────────────────────────────────

describe('Menu data-align', () => {
  it('defaults to data-align="start"', () => {
    const { container } = render(<Menu label="Actions" items={makeItems()} />)
    expect(container.firstElementChild).toHaveAttribute('data-align', 'start')
  })

  it.each(['start', 'end'] as const)('applies data-align=%s', (align) => {
    const { container } = render(<Menu label="Actions" items={makeItems()} align={align} />)
    expect(container.firstElementChild).toHaveAttribute('data-align', align)
  })
})

// ─── Opening from the trigger ────────────────────────────────────────────────

describe('Menu opening', () => {
  it('Enter opens the menu and focuses the FIRST item', async () => {
    const user = userEvent.setup()
    render(<Menu label="Actions" items={makeItems()} />)
    await user.tab()
    expect(getTrigger()).toHaveFocus()
    await user.keyboard('{Enter}')
    expect(getTrigger()).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByRole('menuitem', { name: 'Archive' })).toHaveFocus()
  })

  it('Space opens the menu and focuses the FIRST item', async () => {
    const user = userEvent.setup()
    render(<Menu label="Actions" items={makeItems()} />)
    await user.tab()
    await user.keyboard(' ')
    expect(screen.getByRole('menuitem', { name: 'Archive' })).toHaveFocus()
  })

  it('ArrowDown opens the menu and focuses the FIRST item', async () => {
    const user = userEvent.setup()
    render(<Menu label="Actions" items={makeItems()} />)
    await user.tab()
    await user.keyboard('{ArrowDown}')
    expect(screen.getByRole('menuitem', { name: 'Archive' })).toHaveFocus()
  })

  it('ArrowUp opens the menu and focuses the LAST item', async () => {
    const user = userEvent.setup()
    render(<Menu label="Actions" items={makeItems()} />)
    await user.tab()
    await user.keyboard('{ArrowUp}')
    expect(screen.getByRole('menuitem', { name: 'Export' })).toHaveFocus()
  })

  it('clicking the trigger toggles open then closed', async () => {
    const user = userEvent.setup()
    render(<Menu label="Actions" items={makeItems()} />)
    const trigger = getTrigger()
    await user.click(trigger)
    expect(trigger).toHaveAttribute('aria-expanded', 'true')
    await user.click(trigger)
    expect(trigger).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  })
})

// ─── Roving focus: arrows, wrap, Home/End ────────────────────────────────────

describe('Menu roving focus', () => {
  async function openMenu(user: ReturnType<typeof userEvent.setup>) {
    render(<Menu label="Actions" items={makeItems()} />)
    await user.tab()
    await user.keyboard('{Enter}')
  }

  it('ArrowDown moves focus down and wraps from last to first', async () => {
    const user = userEvent.setup()
    await openMenu(user)
    await user.keyboard('{ArrowDown}')
    expect(screen.getByRole('menuitem', { name: 'Duplicate' })).toHaveFocus()
    await user.keyboard('{End}')
    expect(screen.getByRole('menuitem', { name: 'Export' })).toHaveFocus()
    await user.keyboard('{ArrowDown}')
    expect(screen.getByRole('menuitem', { name: 'Archive' })).toHaveFocus()
  })

  it('ArrowUp moves focus up and wraps from first to last', async () => {
    const user = userEvent.setup()
    await openMenu(user)
    // Focus starts on Archive (first) — ArrowUp wraps to Export (last)
    await user.keyboard('{ArrowUp}')
    expect(screen.getByRole('menuitem', { name: 'Export' })).toHaveFocus()
    await user.keyboard('{ArrowUp}')
    expect(screen.getByRole('menuitem', { name: 'Move up' })).toHaveFocus()
  })

  it('Home and End jump to the first and last item', async () => {
    const user = userEvent.setup()
    await openMenu(user)
    await user.keyboard('{End}')
    expect(screen.getByRole('menuitem', { name: 'Export' })).toHaveFocus()
    await user.keyboard('{Home}')
    expect(screen.getByRole('menuitem', { name: 'Archive' })).toHaveFocus()
  })

  it('keeps exactly one item in the tab sequence (roving tabindex)', async () => {
    const user = userEvent.setup()
    await openMenu(user)
    await user.keyboard('{ArrowDown}')
    const menuitems = screen.getAllByRole('menuitem')
    expect(menuitems.filter((el) => el.tabIndex === 0)).toHaveLength(1)
    expect(screen.getByRole('menuitem', { name: 'Duplicate' })).toHaveAttribute('tabindex', '0')
  })
})

// ─── Typeahead ───────────────────────────────────────────────────────────────

describe('Menu typeahead', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    // RTL v16's asyncWrapper (which user-event calls around every API) drains
    // the microtask queue with a `setTimeout(resolve, 0)` and only advances
    // *jest* fake timers. Under vitest the `jest` global is absent, so the
    // vitest-faked 0ms timer never fires and every user-event call deadlocks.
    // Shim the one method RTL invokes, scoped to this block.
    vi.stubGlobal('jest', { advanceTimersByTime: (ms: number) => vi.advanceTimersByTime(ms) })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.useRealTimers()
  })

  // Fake timers also require user-event's own advanceTimers wiring, otherwise
  // its internal waits deadlock against the frozen clock.
  function setupUser() {
    return userEvent.setup({ advanceTimers: (ms) => vi.advanceTimersByTime(ms) })
  }

  it("typing 'd' focuses the first item starting with d (search wraps from after current)", async () => {
    const user = setupUser()
    render(<Menu label="Actions" items={makeItems()} />)
    await user.tab()
    await user.keyboard('{Enter}')
    // Focus on Archive; first match after it is Duplicate
    await user.keyboard('d')
    expect(screen.getByRole('menuitem', { name: 'Duplicate' })).toHaveFocus()
  })

  it("typing 'de' within the window narrows the prefix match to Delete", async () => {
    const user = setupUser()
    render(<Menu label="Actions" items={makeItems()} />)
    await user.tab()
    await user.keyboard('{Enter}')
    await user.keyboard('d')
    expect(screen.getByRole('menuitem', { name: 'Duplicate' })).toHaveFocus()
    await user.keyboard('e')
    // Buffer is 'de' — Duplicate no longer matches, Delete does
    expect(screen.getByRole('menuitem', { name: 'Delete' })).toHaveFocus()
  })

  it('resets the buffer after 500ms of inactivity', async () => {
    const user = setupUser()
    render(<Menu label="Actions" items={makeItems()} />)
    await user.tab()
    await user.keyboard('{Enter}')
    await user.keyboard('d')
    expect(screen.getByRole('menuitem', { name: 'Duplicate' })).toHaveFocus()
    // Let the 500ms reset window elapse
    vi.advanceTimersByTime(600)
    await user.keyboard('e')
    // Fresh buffer 'e' → Export. Without the reset the buffer would be 'de'
    // and focus would land on Delete instead.
    expect(screen.getByRole('menuitem', { name: 'Export' })).toHaveFocus()
  })
})

// ─── Activation ──────────────────────────────────────────────────────────────

describe('Menu item activation', () => {
  it('Enter calls onSelect exactly once, closes the menu, and refocuses the trigger', async () => {
    const user = userEvent.setup()
    const items = makeItems()
    render(<Menu label="Actions" items={items} />)
    await user.tab()
    await user.keyboard('{Enter}')
    await user.keyboard('{Enter}')
    expect(items[0].onSelect).toHaveBeenCalledTimes(1)
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
    expect(getTrigger()).toHaveFocus()
    expect(getTrigger()).toHaveAttribute('aria-expanded', 'false')
  })

  it('Space activates the focused item', async () => {
    const user = userEvent.setup()
    const items = makeItems()
    render(<Menu label="Actions" items={items} />)
    await user.tab()
    await user.keyboard('{Enter}')
    await user.keyboard('{ArrowDown}')
    await user.keyboard(' ')
    expect(items[1].onSelect).toHaveBeenCalledTimes(1)
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
    expect(getTrigger()).toHaveFocus()
  })

  it('mouse click activates an item, closes, and refocuses the trigger', async () => {
    const user = userEvent.setup()
    const items = makeItems()
    render(<Menu label="Actions" items={items} />)
    await user.click(getTrigger())
    await user.click(screen.getByRole('menuitem', { name: 'Delete' }))
    expect(items[2].onSelect).toHaveBeenCalledTimes(1)
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
    expect(getTrigger()).toHaveFocus()
  })
})

// ─── Disabled items ──────────────────────────────────────────────────────────

describe('Menu disabled items', () => {
  it('stays focusable and exposes aria-disabled="true" (APG: announced, not skipped)', async () => {
    const user = userEvent.setup()
    render(<Menu label="Actions" items={makeItems(['Move up'])} />)
    await user.tab()
    await user.keyboard('{Enter}')
    await user.keyboard('{End}')
    await user.keyboard('{ArrowUp}')
    const moveUp = screen.getByRole('menuitem', { name: 'Move up' })
    expect(moveUp).toHaveFocus()
    expect(moveUp).toHaveAttribute('aria-disabled', 'true')
  })

  it('Enter on a disabled item does NOT call onSelect and keeps the menu open', async () => {
    const user = userEvent.setup()
    const items = makeItems(['Move up'])
    render(<Menu label="Actions" items={items} />)
    await user.tab()
    await user.keyboard('{Enter}')
    await user.keyboard('{End}')
    await user.keyboard('{ArrowUp}')
    await user.keyboard('{Enter}')
    expect(items[3].onSelect).not.toHaveBeenCalled()
    expect(screen.getByRole('menu')).toBeInTheDocument()
    expect(getTrigger()).toHaveAttribute('aria-expanded', 'true')
  })

  it('enabled items do not carry aria-disabled', async () => {
    const user = userEvent.setup()
    render(<Menu label="Actions" items={makeItems(['Move up'])} />)
    await user.click(getTrigger())
    expect(screen.getByRole('menuitem', { name: 'Archive' })).not.toHaveAttribute('aria-disabled')
  })
})

// ─── Dismissal ───────────────────────────────────────────────────────────────

describe('Menu dismissal', () => {
  it('Escape closes the menu and refocuses the trigger', async () => {
    const user = userEvent.setup()
    render(<Menu label="Actions" items={makeItems()} />)
    await user.tab()
    await user.keyboard('{Enter}')
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
    expect(getTrigger()).toHaveFocus()
    expect(getTrigger()).toHaveAttribute('aria-expanded', 'false')
  })

  it('Tab closes the menu without preventDefault (Tab proceeds naturally)', async () => {
    const user = userEvent.setup()
    render(<Menu label="Actions" items={makeItems()} />)
    await user.tab()
    await user.keyboard('{Enter}')
    expect(screen.getByRole('menu')).toBeInTheDocument()
    // APG: Tab closes the menu; focus returns to the trigger and the
    // browser's own Tab handling continues from there — the component must
    // not swallow the keystroke with preventDefault.
    await user.tab()
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
    expect(getTrigger()).toHaveAttribute('aria-expanded', 'false')
  })

  it('popover light dismiss (toggle newState=closed) syncs aria-expanded without stealing focus', async () => {
    const user = userEvent.setup()
    render(<Menu label="Actions" items={makeItems()} />)
    const trigger = getTrigger()
    await user.click(trigger)
    expect(trigger).toHaveAttribute('aria-expanded', 'true')
    const menu = screen.getByRole('menu')
    // jsdom has no ToggleEvent constructor — dispatch a plain 'toggle' event
    // carrying the newState field the component reads.
    const toggleEvent = new Event('toggle')
    Object.defineProperty(toggleEvent, 'newState', { value: 'closed' })
    fireEvent(menu, toggleEvent)
    expect(trigger).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
    // Light dismiss means the user interacted elsewhere — focus must not be
    // yanked back to the trigger.
    expect(trigger).not.toHaveFocus()
  })
})
