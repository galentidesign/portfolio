/**
 * Unit tests for the focus-cascade fx module (mount/reveal/destroy contract).
 *
 * The reveal is one staggered gsap tween (rAF works in jsdom), so progression
 * tests await it; the DOM contract (accessible copy + aria-hidden word spans,
 * restore on destroy) is asserted synchronously.
 */
import { afterEach, describe, expect, it, vi } from 'vitest'
import { waitFor } from '@testing-library/dom'
import { mountFocusCascade } from './focusCascade'

function makeStatement(text = 'Systems, staged in ink.'): HTMLElement {
  const p = document.createElement('p')
  p.textContent = text
  document.body.appendChild(p)
  return p
}

afterEach(() => {
  document.body.innerHTML = ''
  vi.restoreAllMocks()
})

describe('mountFocusCascade', () => {
  it('replaces the text with an accessible copy plus softened per-word spans', () => {
    const el = makeStatement()

    mountFocusCascade(el)

    const words = el.querySelectorAll<HTMLElement>('[data-focus-cascade-word]')
    expect(words.length).toBe(4)
    Array.from(words).forEach((w) => {
      // 0.55, not lower: the soft state must hold 3:1 on display text (axe
      // scans mid-cascade frames — see the device's SOFT_OPACITY note).
      expect(w.style.opacity).toBe('0.55')
      expect(w.style.filter).toContain('blur')
      expect(w.style.position).toBe('relative')
      expect(w.style.top).toBe('6px')
    })
    const anim = el.querySelector('[data-focus-cascade]')
    expect(anim).toHaveAttribute('aria-hidden', 'true')
    // The visually-hidden copy keeps the statement readable mid-cascade.
    expect(el.textContent).toContain('Systems, staged in ink.Systems, staged in ink.')
  })

  it('keeps the inter-word whitespace outside the spans', () => {
    const el = makeStatement('two  spaces')

    mountFocusCascade(el)

    const anim = el.querySelector('[data-focus-cascade]')
    // Original spacing survives verbatim in the animated copy.
    expect(anim?.textContent).toBe('two  spaces')
    expect(el.querySelectorAll('[data-focus-cascade-word]').length).toBe(2)
  })

  it('sharpens every word to rest and completes once', async () => {
    const el = makeStatement('into focus now')
    const onComplete = vi.fn()

    mountFocusCascade(el, { stagger: 0.01, delay: 0, onComplete })

    await waitFor(
      () => {
        const words = Array.from(el.querySelectorAll<HTMLElement>('[data-focus-cascade-word]'))
        expect(words.every((w) => w.style.opacity === '1')).toBe(true)
        expect(words.every((w) => w.style.filter === 'blur(0px)')).toBe(true)
      },
      { timeout: 3000 },
    )
    await waitFor(() => expect(onComplete).toHaveBeenCalledTimes(1))
  })

  it('destroy() restores the original DOM', () => {
    const el = makeStatement()

    const handle = mountFocusCascade(el)
    handle.destroy()

    expect(el.textContent).toBe('Systems, staged in ink.')
    expect(el.querySelector('[data-focus-cascade]')).toBeNull()
    expect(() => handle.destroy()).not.toThrow()
  })

  it('declines an empty element', () => {
    const el = document.createElement('p')
    document.body.appendChild(el)

    const handle = mountFocusCascade(el)

    expect(el.childNodes.length).toBe(0)
    expect(() => handle.destroy()).not.toThrow()
  })
})
