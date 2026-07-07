import { afterEach, describe, expect, it, vi } from 'vitest'
import { gsap } from 'gsap'
import { registerTokenEases, tokenDuration } from './gsapPlugins'

// jsdom resolves no custom properties, so feed the token values directly.
function stubTokens(values: Record<string, string>): void {
  vi.stubGlobal(
    'getComputedStyle',
    vi.fn(() => ({
      getPropertyValue: (name: string) => values[name] ?? '',
    })),
  )
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('registerTokenEases', () => {
  it('registers cubic-bezier tokens as exact-endpoint, ease-shaped functions', () => {
    stubTokens({
      // The galenti enter curve — a strong ease-out.
      '--motion-ease-enter': 'cubic-bezier(0.22, 1, 0.36, 1)',
    })
    registerTokenEases()

    const ease = gsap.parseEase('token-enter')
    expect(ease(0)).toBe(0)
    expect(ease(1)).toBe(1)
    // Ease-out: always at or ahead of linear, and monotonically increasing.
    let prev = 0
    for (let p = 0.05; p < 1; p += 0.05) {
      const v = ease(p)
      expect(v).toBeGreaterThanOrEqual(p)
      expect(v).toBeGreaterThanOrEqual(prev)
      prev = v
    }
    // Spot value: x(t)=0.5 at t≈0.662, where y = 3t − 3t² + t³ ≈ 0.961.
    expect(ease(0.5)).toBeCloseTo(0.961, 2)
  })

  it('preserves the spring token overshoot past 1 mid-curve', () => {
    stubTokens({
      '--motion-ease-spring': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
    })
    registerTokenEases()

    const ease = gsap.parseEase('token-spring')
    const peak = Math.max(...Array.from({ length: 99 }, (_, i) => ease((i + 1) / 100)))
    expect(peak).toBeGreaterThan(1)
    expect(ease(1)).toBe(1)
  })

  it('maps the linear token to identity (debug skin)', () => {
    stubTokens({ '--motion-ease-move': 'linear' })
    registerTokenEases()

    const ease = gsap.parseEase('token-move')
    expect(ease(0.25)).toBe(0.25)
    expect(ease(0.7)).toBe(0.7)
  })
})

describe('tokenDuration', () => {
  it('parses ms-unit tokens (authored form) to seconds', () => {
    stubTokens({ '--motion-duration-2xl': '1100ms' })
    expect(tokenDuration('2xl')).toBeCloseTo(1.1, 5)
  })

  it('parses s-unit tokens (CSS-minifier form, e.g. 1100ms → 1.1s) to seconds', () => {
    stubTokens({ '--motion-duration-2xl': '1.1s', '--motion-duration-lg': '.4s' })
    expect(tokenDuration('2xl')).toBeCloseTo(1.1, 5)
    expect(tokenDuration('lg')).toBeCloseTo(0.4, 5)
  })

  it('returns 0 for zeroed (reduced-motion) and unresolved tokens', () => {
    stubTokens({ '--motion-duration-md': '0ms' })
    expect(tokenDuration('md')).toBe(0)
    expect(tokenDuration('xl')).toBe(0) // unresolved → ''
  })
})
