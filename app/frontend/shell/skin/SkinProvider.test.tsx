import { render, screen, fireEvent, act } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { SkinProvider, useSkin } from './SkinProvider'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function TestConsumer() {
  const { skin, setSkin, skins } = useSkin()
  return (
    <>
      <span data-testid="skin">{skin}</span>
      <span data-testid="skin-count">{skins.length}</span>
      <button onClick={() => setSkin('debug')}>to-debug</button>
      <button onClick={() => setSkin('galenti', { persist: false })}>to-galenti-no-persist</button>
    </>
  )
}

function TestConsumerOutsideProvider() {
  useSkin()
  return null
}

// ---------------------------------------------------------------------------
// Setup / teardown
// ---------------------------------------------------------------------------

beforeEach(() => {
  delete document.documentElement.dataset.skin
  localStorage.clear()
})

afterEach(() => {
  delete document.documentElement.dataset.skin
  localStorage.clear()
})

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('SkinProvider', () => {
  it('initialises skin from a valid data-skin attribute', () => {
    document.documentElement.dataset.skin = 'debug'
    render(
      <SkinProvider>
        <TestConsumer />
      </SkinProvider>,
    )
    expect(screen.getByTestId('skin')).toHaveTextContent('debug')
  })

  it('falls back to the default skin when the attribute is invalid', () => {
    document.documentElement.dataset.skin = 'nonexistent-skin'
    render(
      <SkinProvider>
        <TestConsumer />
      </SkinProvider>,
    )
    expect(screen.getByTestId('skin')).toHaveTextContent('galenti')
  })

  it('falls back to the default skin when the attribute is absent', () => {
    render(
      <SkinProvider>
        <TestConsumer />
      </SkinProvider>,
    )
    expect(screen.getByTestId('skin')).toHaveTextContent('galenti')
  })

  it('does not rewrite a valid data-skin attribute during init', () => {
    document.documentElement.dataset.skin = 'debug'
    render(
      <SkinProvider>
        <TestConsumer />
      </SkinProvider>,
    )
    // The attr was already 'debug'; no flash-rewrite to default should occur.
    expect(document.documentElement.dataset.skin).toBe('debug')
  })

  it('exposes the full skin registry including hidden entries', () => {
    render(
      <SkinProvider>
        <TestConsumer />
      </SkinProvider>,
    )
    // galenti (visible) + debug (hidden) = 2
    expect(screen.getByTestId('skin-count')).toHaveTextContent('2')
  })

  it('setSkin updates skin state, data-skin attribute, and localStorage', () => {
    render(
      <SkinProvider>
        <TestConsumer />
      </SkinProvider>,
    )
    act(() => {
      fireEvent.click(screen.getByRole('button', { name: 'to-debug' }))
    })
    expect(screen.getByTestId('skin')).toHaveTextContent('debug')
    expect(document.documentElement.dataset.skin).toBe('debug')
    expect(localStorage.getItem('portfolio:skin')).toBe('debug')
  })

  it('setSkin with persist:false skips localStorage', () => {
    document.documentElement.dataset.skin = 'debug'
    render(
      <SkinProvider>
        <TestConsumer />
      </SkinProvider>,
    )
    act(() => {
      fireEvent.click(screen.getByRole('button', { name: 'to-galenti-no-persist' }))
    })
    expect(screen.getByTestId('skin')).toHaveTextContent('galenti')
    expect(document.documentElement.dataset.skin).toBe('galenti')
    expect(localStorage.getItem('portfolio:skin')).toBeNull()
  })
})

describe('useSkin', () => {
  it('throws a descriptive error when called outside a SkinProvider', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(() => render(<TestConsumerOutsideProvider />)).toThrow(
      'useSkin must be called within a <SkinProvider>',
    )
    spy.mockRestore()
  })
})
