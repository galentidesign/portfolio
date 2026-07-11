/**
 * Unit tests for the drift fx module (mount/destroy contract).
 *
 * Compositor-only design: the mount owns a scoped <style> of
 * transform/opacity keyframes and per-mote animation inline styles — no
 * ticker, no observers, zero main-thread work per frame. jsdom asserts the
 * DOM contract and the deterministic per-index styling.
 */
import { afterEach, describe, expect, it } from 'vitest'
import { mountDrift } from './drift'

function makeHost(): HTMLElement {
  const host = document.createElement('div')
  document.body.appendChild(host)
  return host
}

afterEach(() => {
  document.body.innerHTML = ''
})

describe('mountDrift', () => {
  it('mounts an aria-hidden holder with the preset mote count', () => {
    const host = makeHost()

    mountDrift(host)

    const holder = host.querySelector('[data-fx-drift]')
    expect(holder).not.toBeNull()
    expect(holder).toHaveAttribute('aria-hidden', 'true')
    expect(holder?.getAttribute('data-fx-drift')).toBe('bone')
    expect(host.querySelectorAll('[data-drift-mote]').length).toBe(9)
  })

  it('scales the ember preset and honours a count override', () => {
    const host = makeHost()

    mountDrift(host, { preset: 'ember', count: 5 })

    expect(host.querySelector('[data-fx-drift]')?.getAttribute('data-fx-drift')).toBe('ember')
    expect(host.querySelectorAll('[data-drift-mote]').length).toBe(5)
  })

  it('animates on the compositor — scoped keyframes, per-mote animations, no ticker', () => {
    const host = makeHost()

    mountDrift(host)

    const style = host.querySelector('[data-fx-drift] style')
    expect(style).not.toBeNull()
    expect(style?.textContent).toContain('-sway')
    expect(style?.textContent).toContain('@keyframes')
    const motes = Array.from(host.querySelectorAll<HTMLElement>('[data-drift-mote]'))
    motes.forEach((m) => expect(m.style.animation).toContain('-sway'))
  })

  it('styles motes inline off semantic tokens — deterministic per index', () => {
    const host = makeHost()

    mountDrift(host)

    const motes = Array.from(host.querySelectorAll<HTMLElement>('[data-drift-mote]'))
    expect(motes[0].style.backgroundColor).toContain('var(--color-line-strong)')
    expect(motes[1].style.backgroundColor).toContain('var(--color-accent-muted)')
    const holder = host.querySelector<HTMLElement>('[data-fx-drift]')!
    expect(holder.style.pointerEvents).toBe('none')
    // Re-mounting yields identical assignments (index math, no randomness)
    // apart from the mount-scoped keyframe prefix.
    const secondHost = makeHost()
    mountDrift(secondHost)
    const again = Array.from(secondHost.querySelectorAll<HTMLElement>('[data-drift-mote]'))
    const normalize = (el: HTMLElement) => el.style.cssText.replace(/fx-drift-\d+/g, 'fx-drift-N')
    motes.forEach((m, i) => expect(normalize(again[i])).toBe(normalize(m)))
  })

  it('rises embers with an opacity envelope', () => {
    const host = makeHost()

    mountDrift(host, { preset: 'ember' })

    const style = host.querySelector('[data-fx-drift] style')
    expect(style?.textContent).toContain('-rise')
    const outer = host.querySelector<HTMLElement>('[data-fx-drift] > span')
    expect(outer?.style.animation).toContain('-rise')
  })

  it('destroy() removes the holder (keyframes ride along) and is idempotent', () => {
    const host = makeHost()

    const handle = mountDrift(host)
    handle.destroy()

    expect(host.querySelector('[data-fx-drift]')).toBeNull()
    expect(() => handle.destroy()).not.toThrow()
  })
})
