/**
 * Unit tests for the typewriter fx module (mount/reveal/destroy contract).
 *
 * The reveal rides the real gsap ticker (rAF works in jsdom), so progression
 * tests await it; the DOM contract (accessible copy + aria-hidden chars,
 * restore on destroy) is asserted synchronously.
 */
import { afterEach, describe, expect, it, vi } from 'vitest'
import { waitFor } from '@testing-library/dom'
import { mountTypewriter } from './typewriter'

function makeStatement(text = 'Systems, staged.'): HTMLElement {
  const p = document.createElement('p')
  p.textContent = text
  document.body.appendChild(p)
  return p
}

afterEach(() => {
  document.body.innerHTML = ''
  vi.restoreAllMocks()
})

describe('mountTypewriter', () => {
  it('replaces the text with an accessible copy plus hidden per-char spans', () => {
    const el = makeStatement()

    mountTypewriter(el)

    const chars = el.querySelectorAll<HTMLElement>('[data-typewriter-char]')
    expect(chars.length).toBe('Systems, staged.'.length)
    Array.from(chars).forEach((c) => expect(c.style.opacity).toBe('0'))
    const anim = el.querySelector('[data-typewriter]')
    expect(anim).toHaveAttribute('aria-hidden', 'true')
    // The visually-hidden copy keeps the statement readable mid-write.
    expect(el.textContent).toContain('Systems, staged.Systems, staged.')
  })

  it('reveals every character and completes, dropping the caret at the end', async () => {
    const el = makeStatement('hi!')
    const onComplete = vi.fn()

    mountTypewriter(el, { charInterval: 0.01, delay: 0, onComplete })

    await waitFor(
      () => {
        const chars = Array.from(el.querySelectorAll<HTMLElement>('[data-typewriter-char]'))
        expect(chars.every((c) => c.style.opacity === '1')).toBe(true)
      },
      { timeout: 3000 },
    )
    await waitFor(() => expect(onComplete).toHaveBeenCalledTimes(1))
    expect(el.querySelector('[data-caret]')).toBeNull()
  })

  it('rides the caret on the last revealed character mid-write', async () => {
    const el = makeStatement('slow statement here')

    mountTypewriter(el, { charInterval: 0.06, maxDuration: 10, delay: 0 })

    await waitFor(
      () => {
        const caret = el.querySelector<HTMLElement>('[data-caret]')
        expect(caret).not.toBeNull()
        expect(caret?.style.opacity).toBe('1')
      },
      { timeout: 3000 },
    )
  })

  it('destroy() restores the original DOM', () => {
    const el = makeStatement()

    const handle = mountTypewriter(el)
    handle.destroy()

    expect(el.textContent).toBe('Systems, staged.')
    expect(el.querySelector('[data-typewriter]')).toBeNull()
    expect(() => handle.destroy()).not.toThrow()
  })

  it('declines an empty element', () => {
    const el = document.createElement('p')
    document.body.appendChild(el)

    const handle = mountTypewriter(el)

    expect(el.childNodes.length).toBe(0)
    expect(() => handle.destroy()).not.toThrow()
  })
})
