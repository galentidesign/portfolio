import '@testing-library/jest-dom/vitest'
import { afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'

// @testing-library/react needs an explicit afterEach hook when Vitest globals
// are not enabled, otherwise rendered components bleed across tests.
afterEach(cleanup)

// Browser polyfills — guard with typeof window so Node.js-environment tests
// (e.g. @vitest-environment node) are not affected.
if (typeof window !== 'undefined') {
  // ─── matchMedia ───────────────────────────────────────────────────────────
  // jsdom does not implement matchMedia. Listeners are stored so that
  // useSyncExternalStore subscriptions can register and deregister without
  // errors. Tests that need `matches: true` should override via vi.spyOn
  // (writable + configurable allows this).
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    configurable: true,
    value: (query: string) => {
      const listeners: Array<() => void> = []
      return {
        matches: false,
        media: query,
        onchange: null,
        /** @deprecated */ addListener: () => {},
        /** @deprecated */ removeListener: () => {},
        addEventListener(_type: string, cb: EventListenerOrEventListenerObject) {
          // EventListener is (evt: Event) => void; we cast since our callbacks
          // are () => void and JS ignores the unused argument at runtime.
          if (typeof cb === 'function') listeners.push(cb as () => void)
        },
        removeEventListener(_type: string, cb: EventListenerOrEventListenerObject) {
          if (typeof cb === 'function') {
            const i = listeners.indexOf(cb as () => void)
            if (i !== -1) listeners.splice(i, 1)
          }
        },
        dispatchEvent() {
          listeners.forEach((l) => l())
          return true
        },
      }
    },
  })

  // ─── localStorage ─────────────────────────────────────────────────────────
  // jsdom 29 may initialise localStorage without the full Storage API (e.g.
  // .clear() is absent when --localstorage-file has no valid path). We replace
  // it with a simple in-memory implementation that covers every Storage method.
  {
    const store: Record<string, string> = {}
    Object.defineProperty(window, 'localStorage', {
      writable: true,
      configurable: true,
      value: {
        getItem(key: string): string | null {
          return Object.prototype.hasOwnProperty.call(store, key) ? store[key] : null
        },
        setItem(key: string, value: string): void {
          store[key] = value
        },
        removeItem(key: string): void {
          delete store[key]
        },
        clear(): void {
          Object.keys(store).forEach((k) => delete store[k])
        },
        key(index: number): string | null {
          return Object.keys(store)[index] ?? null
        },
        get length(): number {
          return Object.keys(store).length
        },
      } satisfies Storage,
    })
  }
}
