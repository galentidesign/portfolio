import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { Tabs, type TabItem } from './Tabs'

const items: readonly TabItem[] = [
  { id: 'alpha', label: 'Alpha', content: <p>Alpha content</p> },
  { id: 'beta', label: 'Beta', content: <p>Beta content</p> },
  { id: 'gamma', label: 'Gamma', content: <p>Gamma content</p> },
]

// ---------------------------------------------------------------------------
// ARIA wiring
// ---------------------------------------------------------------------------

describe('Tabs ARIA wiring', () => {
  it('renders a tablist with the default label', () => {
    render(<Tabs items={items} />)
    expect(screen.getByRole('tablist', { name: 'Tabs' })).toBeInTheDocument()
  })

  it('applies a custom tablist label', () => {
    render(<Tabs items={items} label="Sections" />)
    expect(screen.getByRole('tablist', { name: 'Sections' })).toBeInTheDocument()
  })

  it('wires aria-selected, aria-controls, and aria-labelledby between tabs and panel', () => {
    render(<Tabs items={items} />)
    const tabs = screen.getAllByRole('tab')
    expect(tabs).toHaveLength(3)
    const [alpha, beta, gamma] = tabs
    expect(alpha).toHaveAttribute('aria-selected', 'true')
    expect(beta).toHaveAttribute('aria-selected', 'false')
    expect(gamma).toHaveAttribute('aria-selected', 'false')

    const panel = screen.getByRole('tabpanel')
    expect(alpha).toHaveAttribute('aria-controls', panel.id)
    expect(panel).toHaveAttribute('aria-labelledby', alpha.id)

    // Every tab's aria-controls resolves to a mounted panel element
    for (const tab of tabs) {
      const controls = tab.getAttribute('aria-controls')
      expect(controls).toBeTruthy()
      expect(document.getElementById(controls!)).toBeInTheDocument()
    }
  })
})

// ---------------------------------------------------------------------------
// Roving tabindex
// ---------------------------------------------------------------------------

describe('Tabs roving tabindex', () => {
  it('gives exactly one tab tabIndex 0 — the selected one', () => {
    render(<Tabs items={items} defaultSelected="beta" />)
    const tabs = screen.getAllByRole('tab')
    const focusable = tabs.filter((tab) => tab.tabIndex === 0)
    expect(focusable).toHaveLength(1)
    expect(focusable[0]).toHaveTextContent('Beta')
    for (const tab of tabs) {
      if (tab !== focusable[0]) expect(tab.tabIndex).toBe(-1)
    }
  })

  it('moves the single tab stop with selection', async () => {
    const user = userEvent.setup()
    render(<Tabs items={items} />)
    await user.click(screen.getByRole('tab', { name: 'Gamma' }))
    const tabs = screen.getAllByRole('tab')
    expect(tabs.filter((tab) => tab.tabIndex === 0)).toHaveLength(1)
    expect(screen.getByRole('tab', { name: 'Gamma' }).tabIndex).toBe(0)
  })
})

// ---------------------------------------------------------------------------
// Default selection
// ---------------------------------------------------------------------------

describe('Tabs default selection', () => {
  it('selects the first item by default', () => {
    render(<Tabs items={items} />)
    expect(screen.getByRole('tab', { name: 'Alpha' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByText('Alpha content')).toBeVisible()
  })

  it('honors defaultSelected', () => {
    render(<Tabs items={items} defaultSelected="beta" />)
    expect(screen.getByRole('tab', { name: 'Beta' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByText('Beta content')).toBeVisible()
  })
})

// ---------------------------------------------------------------------------
// Click selection
// ---------------------------------------------------------------------------

describe('Tabs click selection', () => {
  it('selects on click and fires onChange with the item id', async () => {
    const user = userEvent.setup()
    const handleChange = vi.fn()
    render(<Tabs items={items} onChange={handleChange} />)
    await user.click(screen.getByRole('tab', { name: 'Beta' }))
    expect(handleChange).toHaveBeenCalledTimes(1)
    expect(handleChange).toHaveBeenCalledWith('beta')
    expect(screen.getByRole('tab', { name: 'Beta' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByText('Beta content')).toBeVisible()
    expect(screen.getByText('Alpha content')).not.toBeVisible()
  })
})

// ---------------------------------------------------------------------------
// Keyboard — automatic activation
// ---------------------------------------------------------------------------

describe('Tabs keyboard (automatic activation)', () => {
  it('ArrowRight moves focus and selects the next tab', async () => {
    const user = userEvent.setup()
    const handleChange = vi.fn()
    render(<Tabs items={items} onChange={handleChange} />)
    await user.tab() // roving tabindex lands focus on the selected (first) tab
    expect(screen.getByRole('tab', { name: 'Alpha' })).toHaveFocus()
    await user.keyboard('{ArrowRight}')
    const beta = screen.getByRole('tab', { name: 'Beta' })
    expect(beta).toHaveFocus()
    expect(beta).toHaveAttribute('aria-selected', 'true')
    expect(handleChange).toHaveBeenCalledWith('beta')
    expect(screen.getByText('Beta content')).toBeVisible()
  })

  it('ArrowRight wraps from the last tab to the first', async () => {
    const user = userEvent.setup()
    render(<Tabs items={items} defaultSelected="gamma" />)
    await user.tab()
    expect(screen.getByRole('tab', { name: 'Gamma' })).toHaveFocus()
    await user.keyboard('{ArrowRight}')
    const alpha = screen.getByRole('tab', { name: 'Alpha' })
    expect(alpha).toHaveFocus()
    expect(alpha).toHaveAttribute('aria-selected', 'true')
  })

  it('ArrowLeft wraps from the first tab to the last', async () => {
    const user = userEvent.setup()
    render(<Tabs items={items} />)
    await user.tab()
    await user.keyboard('{ArrowLeft}')
    const gamma = screen.getByRole('tab', { name: 'Gamma' })
    expect(gamma).toHaveFocus()
    expect(gamma).toHaveAttribute('aria-selected', 'true')
  })

  it('End selects the last tab, Home the first', async () => {
    const user = userEvent.setup()
    render(<Tabs items={items} defaultSelected="beta" />)
    await user.tab()
    await user.keyboard('{End}')
    const gamma = screen.getByRole('tab', { name: 'Gamma' })
    expect(gamma).toHaveFocus()
    expect(gamma).toHaveAttribute('aria-selected', 'true')
    await user.keyboard('{Home}')
    const alpha = screen.getByRole('tab', { name: 'Alpha' })
    expect(alpha).toHaveFocus()
    expect(alpha).toHaveAttribute('aria-selected', 'true')
  })
})

// ---------------------------------------------------------------------------
// Controlled mode
// ---------------------------------------------------------------------------

describe('Tabs controlled mode', () => {
  it('follows the selected prop', () => {
    const { rerender } = render(<Tabs items={items} selected="beta" />)
    expect(screen.getByRole('tab', { name: 'Beta' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByText('Beta content')).toBeVisible()
    rerender(<Tabs items={items} selected="gamma" />)
    expect(screen.getByRole('tab', { name: 'Gamma' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('tab', { name: 'Beta' })).toHaveAttribute('aria-selected', 'false')
    expect(screen.getByText('Gamma content')).toBeVisible()
  })

  it('does not self-select when the parent ignores onChange (keyboard)', async () => {
    const user = userEvent.setup()
    const handleChange = vi.fn() // parent ignores the change request
    render(<Tabs items={items} selected="alpha" onChange={handleChange} />)
    await user.tab()
    await user.keyboard('{ArrowRight}')
    expect(handleChange).toHaveBeenCalledWith('beta')
    expect(screen.getByRole('tab', { name: 'Alpha' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('tab', { name: 'Beta' })).toHaveAttribute('aria-selected', 'false')
    expect(screen.getByText('Alpha content')).toBeVisible()
  })

  it('does not self-select when the parent ignores onChange (click)', async () => {
    const user = userEvent.setup()
    const handleChange = vi.fn()
    render(<Tabs items={items} selected="alpha" onChange={handleChange} />)
    await user.click(screen.getByRole('tab', { name: 'Gamma' }))
    expect(handleChange).toHaveBeenCalledWith('gamma')
    expect(screen.getByRole('tab', { name: 'Alpha' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('tab', { name: 'Gamma' })).toHaveAttribute('aria-selected', 'false')
  })
})

// ---------------------------------------------------------------------------
// Panel
// ---------------------------------------------------------------------------

describe('Tabs panel', () => {
  it('has tabIndex 0 and is labelled by its tab', () => {
    render(<Tabs items={items} />)
    const panel = screen.getByRole('tabpanel', { name: 'Alpha' })
    expect(panel).toHaveAttribute('tabindex', '0')
    expect(panel).toHaveAttribute('aria-labelledby', screen.getByRole('tab', { name: 'Alpha' }).id)
  })

  it('keeps unselected panels mounted but hidden', () => {
    render(<Tabs items={items} />)
    // Only the selected panel is exposed to the accessibility tree…
    expect(screen.getAllByRole('tabpanel')).toHaveLength(1)
    // …but all three stay in the DOM so aria-controls ids resolve
    expect(screen.getAllByRole('tabpanel', { hidden: true })).toHaveLength(3)
    expect(screen.getByText('Alpha content')).toBeVisible()
    expect(screen.getByText('Beta content')).not.toBeVisible()
    expect(screen.getByText('Gamma content')).not.toBeVisible()
  })
})
