import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { SkinProvider } from '@/shell/skin/SkinProvider'
import type { SkinMeta } from '@/ds/tokens/generated/skins'
import { SkinSwitcher } from './SkinSwitcher'

// ---------------------------------------------------------------------------
// Registry mock — the real registry ships a single visible skin (galenti)
// plus the hidden debug torture skin, so switching between two visible
// entries cannot be exercised against it. Mock in a second visible skin
// ('noir') and keep a hidden 'Debug' entry to verify filtering.
// ---------------------------------------------------------------------------

vi.mock('@/ds/tokens/generated/skins', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/ds/tokens/generated/skins')>()
  const mockSkins: SkinMeta[] = [
    {
      name: 'galenti',
      label: 'Galenti',
      era: 'own-brand',
      colorScheme: 'light',
      default: true,
      hidden: false,
      description: 'Visible default skin.',
    },
    {
      name: 'noir',
      label: 'Noir',
      era: 'test',
      colorScheme: 'dark',
      default: false,
      hidden: false,
      description: 'Second visible skin.',
    },
    {
      name: 'debug',
      label: 'Debug',
      era: 'torture-test',
      colorScheme: 'dark',
      default: false,
      hidden: true,
      description: 'Hidden torture skin — must never render in switcher UIs.',
    },
  ]
  return {
    ...actual,
    skins: mockSkins,
    skinNames: ['galenti', 'noir', 'debug'] as const,
    defaultSkin: mockSkins[0],
  }
})

// ---------------------------------------------------------------------------
// Setup / teardown
// ---------------------------------------------------------------------------

function renderSwitcher(ui: React.ReactElement = <SkinSwitcher />) {
  return render(<SkinProvider>{ui}</SkinProvider>)
}

beforeEach(() => {
  document.documentElement.dataset.skin = 'galenti'
  localStorage.clear()
})

afterEach(() => {
  delete document.documentElement.dataset.skin
  localStorage.clear()
})

// ---------------------------------------------------------------------------
// Visibility — only non-hidden skins render
// ---------------------------------------------------------------------------

describe('SkinSwitcher visibility', () => {
  it('renders one radio per visible skin', () => {
    renderSwitcher()
    expect(screen.getAllByRole('radio')).toHaveLength(2)
    expect(screen.getByRole('radio', { name: 'Galenti' })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: 'Noir' })).toBeInTheDocument()
  })

  it('never renders the hidden debug skin', () => {
    renderSwitcher()
    expect(screen.queryByText('Debug')).not.toBeInTheDocument()
    expect(screen.queryByRole('radio', { name: 'Debug' })).not.toBeInTheDocument()
  })
})

// ---------------------------------------------------------------------------
// Current skin state
// ---------------------------------------------------------------------------

describe('SkinSwitcher current skin', () => {
  it('checks the radio for the current skin', () => {
    renderSwitcher()
    expect(screen.getByRole('radio', { name: 'Galenti' })).toBeChecked()
    expect(screen.getByRole('radio', { name: 'Noir' })).not.toBeChecked()
  })

  it('marks only the current item with data-checked', () => {
    renderSwitcher()
    const galentiItem = screen.getByRole('radio', { name: 'Galenti' }).closest('label')
    const noirItem = screen.getByRole('radio', { name: 'Noir' }).closest('label')
    expect(galentiItem).toHaveAttribute('data-checked')
    expect(noirItem).not.toHaveAttribute('data-checked')
  })
})

// ---------------------------------------------------------------------------
// Switching — clicks call through to the provider
// ---------------------------------------------------------------------------

describe('SkinSwitcher switching', () => {
  it('clicking another skin flips the document skin attribute and persists', async () => {
    const user = userEvent.setup()
    renderSwitcher()

    await user.click(screen.getByRole('radio', { name: 'Noir' }))

    expect(document.documentElement.dataset.skin).toBe('noir')
    expect(localStorage.getItem('portfolio:skin')).toBe('noir')
    expect(screen.getByRole('radio', { name: 'Noir' })).toBeChecked()
    expect(screen.getByRole('radio', { name: 'Galenti' })).not.toBeChecked()
  })

  it('moves data-checked to the newly selected item', async () => {
    const user = userEvent.setup()
    renderSwitcher()

    await user.click(screen.getByRole('radio', { name: 'Noir' }))

    expect(screen.getByRole('radio', { name: 'Noir' }).closest('label')).toHaveAttribute(
      'data-checked',
    )
    expect(screen.getByRole('radio', { name: 'Galenti' }).closest('label')).not.toHaveAttribute(
      'data-checked',
    )
  })
})

// ---------------------------------------------------------------------------
// Keyboard
// ---------------------------------------------------------------------------

describe('SkinSwitcher keyboard', () => {
  it('Space on a focused radio selects it and calls through to the provider', async () => {
    const user = userEvent.setup()
    renderSwitcher()

    const noir = screen.getByRole('radio', { name: 'Noir' })
    noir.focus()
    await user.keyboard(' ')

    expect(noir).toBeChecked()
    expect(document.documentElement.dataset.skin).toBe('noir')
    expect(localStorage.getItem('portfolio:skin')).toBe('noir')
  })
})

// ---------------------------------------------------------------------------
// Legend / group semantics
// ---------------------------------------------------------------------------

describe('SkinSwitcher legend', () => {
  it('exposes a group named by the default legend "Skin"', () => {
    renderSwitcher()
    const group = screen.getByRole('group', { name: 'Skin' })
    expect(group.tagName).toBe('FIELDSET')
  })

  it('accepts a custom legend', () => {
    renderSwitcher(<SkinSwitcher legend="Theme" />)
    expect(screen.getByRole('group', { name: 'Theme' })).toBeInTheDocument()
  })

  it('renders the legend as a real <legend> element for AT', () => {
    renderSwitcher()
    const legend = screen.getByText('Skin')
    expect(legend.tagName).toBe('LEGEND')
  })
})

// ---------------------------------------------------------------------------
// Radio input wiring
// ---------------------------------------------------------------------------

describe('SkinSwitcher radio inputs', () => {
  it('all radios share a single generated group name', () => {
    renderSwitcher()
    const radios = screen.getAllByRole('radio')
    const name = radios[0].getAttribute('name')
    expect(name).toBeTruthy()
    for (const radio of radios) {
      expect(radio).toHaveAttribute('name', name as string)
    }
  })

  it('each radio value is its skin name', () => {
    renderSwitcher()
    expect(screen.getByRole('radio', { name: 'Galenti' })).toHaveAttribute('value', 'galenti')
    expect(screen.getByRole('radio', { name: 'Noir' })).toHaveAttribute('value', 'noir')
  })
})
