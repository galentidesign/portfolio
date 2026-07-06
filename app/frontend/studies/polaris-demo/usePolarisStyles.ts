import { useEffect } from 'react'
import polarisCss from '@shopify/polaris/build/esm/styles.css?inline'

/**
 * The SITE_GUARD block re-asserts the site's inheritance chain at higher
 * specificity than Polaris's element selectors, keeping shell chrome intact
 * while the Polaris demo is mounted.
 */
const SITE_GUARD = `
html[data-skin] {
  font-size: 100%;
  line-height: normal;
  font-weight: 400;
  letter-spacing: normal;
  font-feature-settings: normal;
  color: var(--color-ink);
}
html[data-skin] body {
  font-size: inherit;
  line-height: inherit;
  font-weight: inherit;
  letter-spacing: inherit;
  font-feature-settings: inherit;
  color: inherit;
}
`

const STYLE_ATTR = 'data-polaris-demo-styles'

/**
 * Injects Polaris CSS into <head> on mount and removes it on unmount.
 * This prevents the Polaris global resets from leaking to other routes
 * after client-side navigation away from the demo page.
 */
export function usePolarisStyles(): void {
  useEffect(() => {
    const existing = document.head.querySelector(`style[${STYLE_ATTR}]`)
    if (existing) return

    const style = document.createElement('style')
    style.setAttribute(STYLE_ATTR, '')
    style.textContent = polarisCss + SITE_GUARD
    document.head.appendChild(style)

    return () => {
      const el = document.head.querySelector(`style[${STYLE_ATTR}]`)
      el?.parentNode?.removeChild(el)
    }
  }, [])
}
