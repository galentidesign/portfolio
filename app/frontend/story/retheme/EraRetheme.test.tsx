import { render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { MotionPrefProvider } from '@/ds/motion/useMotionPref'
import { SkinProvider } from '@/shell/skin/SkinProvider'
import { SKIN_STORAGE_KEY } from '@/ds/tokens/generated/skins'
import { EraRetheme } from './EraRetheme'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function renderBoundary(ui?: React.ReactNode) {
  return render(
    <MotionPrefProvider>
      <SkinProvider>
        <EraRetheme skin="rails-era">{ui ?? <p>chapter content</p>}</EraRetheme>
      </SkinProvider>
    </MotionPrefProvider>,
  )
}

const skinAttr = () => document.documentElement.dataset.skin

// ---------------------------------------------------------------------------
// Setup / teardown
// ---------------------------------------------------------------------------

beforeEach(() => {
  delete document.documentElement.dataset.skin
  delete document.documentElement.dataset.motion
  localStorage.clear()
})

afterEach(() => {
  delete document.documentElement.dataset.skin
  delete document.documentElement.dataset.motion
  localStorage.clear()
})

// ---------------------------------------------------------------------------
// Reduced motion — the instant path (no GSAP, same semantics)
// ---------------------------------------------------------------------------

describe('EraRetheme under reduced motion', () => {
  beforeEach(() => {
    document.documentElement.dataset.motion = 'reduced'
  })

  it('applies the era skin instantly on mount', () => {
    document.documentElement.dataset.skin = 'galenti'
    renderBoundary()
    expect(skinAttr()).toBe('rails-era')
  })

  it('never writes localStorage (story re-themes are not a preference)', () => {
    document.documentElement.dataset.skin = 'galenti'
    const { unmount } = renderBoundary()
    expect(skinAttr()).toBe('rails-era')
    unmount()
    expect(localStorage.getItem(SKIN_STORAGE_KEY)).toBeNull()
  })

  it('restores the entry skin on unmount', () => {
    document.documentElement.dataset.skin = 'galenti'
    const { unmount } = renderBoundary()
    unmount()
    expect(skinAttr()).toBe('galenti')
  })

  it('announces the theme change politely after the swap', () => {
    document.documentElement.dataset.skin = 'galenti'
    renderBoundary()
    expect(screen.getByRole('status')).toHaveTextContent('Theme: Rails era')
  })

  it('no-ops when the era skin is already active at entry (deep link)', () => {
    document.documentElement.dataset.skin = 'rails-era'
    const { unmount } = renderBoundary()
    expect(skinAttr()).toBe('rails-era')
    // Nothing changed — nothing to announce.
    expect(screen.getByRole('status')).toHaveTextContent('')
    unmount()
    expect(skinAttr()).toBe('rails-era')
  })

  it('lets an explicit mid-chapter switch away win — restores nothing', () => {
    document.documentElement.dataset.skin = 'galenti'
    const { unmount } = renderBoundary()
    expect(skinAttr()).toBe('rails-era')
    // Simulate an explicit palette switch (persisting path: attr + storage).
    document.documentElement.dataset.skin = 'debug'
    localStorage.setItem(SKIN_STORAGE_KEY, 'debug')
    unmount()
    expect(skinAttr()).toBe('debug')
  })

  it('honours an explicit mid-chapter re-pick of the era skin itself', () => {
    document.documentElement.dataset.skin = 'galenti'
    const { unmount } = renderBoundary()
    // The visitor explicitly persists rails-era while inside the chapter:
    // the attr already matches the story skin, only storage changes.
    localStorage.setItem(SKIN_STORAGE_KEY, 'rails-era')
    unmount()
    // Their persisted choice wins over the entry snapshot.
    expect(skinAttr()).toBe('rails-era')
  })

  it('ignores a stale stored preference from before the chapter (?skin= entry)', () => {
    // Visitor deep-linked ?skin=galenti while an old debug preference sits in
    // storage: the param-derived entry skin is what exit must restore.
    localStorage.setItem(SKIN_STORAGE_KEY, 'debug')
    document.documentElement.dataset.skin = 'galenti'
    const { unmount } = renderBoundary()
    expect(skinAttr()).toBe('rails-era')
    unmount()
    expect(skinAttr()).toBe('galenti')
    expect(localStorage.getItem(SKIN_STORAGE_KEY)).toBe('debug')
  })
})

// ---------------------------------------------------------------------------
// Motion allowed — swap arrives via the dynamic motion module
// ---------------------------------------------------------------------------

describe('EraRetheme with motion allowed', () => {
  it('applies the era skin via the motion module and restores on unmount', async () => {
    document.documentElement.dataset.skin = 'galenti'
    const { unmount } = renderBoundary()
    await waitFor(() => expect(skinAttr()).toBe('rails-era'))
    expect(localStorage.getItem(SKIN_STORAGE_KEY)).toBeNull()
    unmount()
    expect(skinAttr()).toBe('galenti')
  })

  it('renders the inert sweep element for the timeline to drive', () => {
    document.documentElement.dataset.skin = 'galenti'
    const { container } = renderBoundary()
    const sweep = container.querySelector('[data-retheme-sweep]')
    expect(sweep).not.toBeNull()
    expect(sweep).toHaveAttribute('aria-hidden', 'true')
  })

  it('exposes the boundary container with the era skin marked', () => {
    document.documentElement.dataset.skin = 'galenti'
    renderBoundary()
    expect(screen.getByTestId('era-retheme')).toHaveAttribute('data-era-skin', 'rails-era')
  })
})
