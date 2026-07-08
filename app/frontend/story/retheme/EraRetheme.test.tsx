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
    // The swap beat sits mid-travel (~0.55s on the fallback tokens jsdom
    // resolves) — allow the GSAP ticker time to reach it.
    await waitFor(() => expect(skinAttr()).toBe('rails-era'), { timeout: 3000 })
    expect(localStorage.getItem(SKIN_STORAGE_KEY)).toBeNull()
    unmount()
    expect(skinAttr()).toBe('galenti')
  })

  it('renders the inert era-crossing band for the timeline to drive', () => {
    document.documentElement.dataset.skin = 'galenti'
    const { container } = renderBoundary()
    const band = container.querySelector('[data-retheme-band]')
    expect(band).not.toBeNull()
    expect(band).toHaveAttribute('aria-hidden', 'true')
  })

  it("binds the band interior to the era skin's night zone (CRT palette)", () => {
    document.documentElement.dataset.skin = 'galenti'
    const { container } = renderBoundary()
    const interior = container.querySelector('[data-retheme-band] [data-zone="night"]')
    expect(interior).not.toBeNull()
    // data-skin + data-zone on ONE element: the compound skin selector keeps
    // the interior phosphor-toned even while the page still wears galenti.
    expect(interior).toHaveAttribute('data-skin', 'rails-era')
  })

  it('renders the HUD caption as per-character spans for the type-out', () => {
    document.documentElement.dataset.skin = 'galenti'
    const { container } = renderBoundary()
    const chars = container.querySelectorAll('[data-retheme-caption-char]')
    expect(chars.length).toBeGreaterThan(0)
    const text = Array.from(chars)
      .map((el) => el.textContent)
      .join('')
    expect(text).toBe('loading rails era…')
  })

  it('exposes the boundary container with the era skin marked', () => {
    document.documentElement.dataset.skin = 'galenti'
    renderBoundary()
    expect(screen.getByTestId('era-retheme')).toHaveAttribute('data-era-skin', 'rails-era')
  })

  it('defaults the band treatment to crt', () => {
    document.documentElement.dataset.skin = 'galenti'
    const { container } = renderBoundary()
    const band = container.querySelector('[data-retheme-band]')
    expect(band).toHaveAttribute('data-retheme-treatment', 'crt')
  })
})

// ---------------------------------------------------------------------------
// Per-era parametrization — treatment + multi-line captions (shared machinery)
// ---------------------------------------------------------------------------

describe('EraRetheme per-era parametrization', () => {
  it('marks the band with the requested treatment and binds the interior to the era night zone', () => {
    document.documentElement.dataset.skin = 'galenti'
    const { container } = render(
      <MotionPrefProvider>
        <SkinProvider>
          <EraRetheme skin="react-era" treatment="webpack" caption="webpack: compiling…">
            <p>chapter content</p>
          </EraRetheme>
        </SkinProvider>
      </MotionPrefProvider>,
    )
    const band = container.querySelector('[data-retheme-band]')
    expect(band).toHaveAttribute('data-retheme-treatment', 'webpack')
    const interior = container.querySelector('[data-retheme-band] [data-zone="night"]')
    expect(interior).toHaveAttribute('data-skin', 'react-era')
  })

  it('renders a multi-line caption as one line per paragraph, chars in stream order', () => {
    document.documentElement.dataset.skin = 'galenti'
    const lines = ['$ session start — kiln', '▸ agents: fleet ready'] as const
    const { container } = render(
      <MotionPrefProvider>
        <SkinProvider>
          <EraRetheme skin="agentic" treatment="terminal" caption={lines}>
            <p>chapter content</p>
          </EraRetheme>
        </SkinProvider>
      </MotionPrefProvider>,
    )
    const band = container.querySelector('[data-retheme-band]')!
    const paragraphs = band.querySelectorAll('p')
    expect(paragraphs).toHaveLength(2)
    const text = Array.from(band.querySelectorAll('[data-retheme-caption-char]'))
      .map((el) => el.textContent)
      .join('')
    expect(text).toBe(lines.join(''))
  })

  it('announces the era label for the agentic skin under reduced motion', () => {
    document.documentElement.dataset.motion = 'reduced'
    document.documentElement.dataset.skin = 'galenti'
    const { unmount } = render(
      <MotionPrefProvider>
        <SkinProvider>
          <EraRetheme skin="agentic">
            <p>chapter content</p>
          </EraRetheme>
        </SkinProvider>
      </MotionPrefProvider>,
    )
    expect(document.documentElement.dataset.skin).toBe('agentic')
    expect(screen.getByRole('status')).toHaveTextContent('Theme: Agentic era')
    unmount()
    expect(document.documentElement.dataset.skin).toBe('galenti')
  })
})
