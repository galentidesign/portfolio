import { StrictMode, type ReactNode } from 'react'
import { createRoot } from 'react-dom/client'
import { createInertiaApp } from '@inertiajs/react'
import type { ResolvedComponent } from '@inertiajs/react'
import { SkinProvider } from '@/shell/skin/SkinProvider'
import { MotionPrefProvider } from '@/ds/motion/useMotionPref'
import { SiteShell } from '@/shell/SiteShell'

// Explicit resolver instead of `pages: '../pages'` so test files never enter
// the production bundle.
const pages = import.meta.glob<{ default: ResolvedComponent }>([
  '../pages/**/*.tsx',
  '!**/*.test.tsx',
])

void createInertiaApp({
  resolve: async (name) => {
    const page = await pages[`../pages/${name}.tsx`]!()
    // Pages that opt out with layout = null stay null; undefined means "use default".
    if (page.default.layout === undefined)
      page.default.layout = (p: ReactNode) => <SiteShell>{p}</SiteShell>
    return page.default
  },

  // Custom setup owns StrictMode wrapping; the strictMode option is not used.
  setup({ el, App, props }) {
    if (!el) return
    createRoot(el).render(
      <StrictMode>
        <SkinProvider>
          <MotionPrefProvider>
            <App {...props} />
          </MotionPrefProvider>
        </SkinProvider>
      </StrictMode>,
    )
  },

  defaults: {
    form: {
      forceIndicesArrayFormatInFormData: false,
      withAllErrors: true,
    },
    visitOptions: () => {
      return { queryStringArrayFormat: 'brackets' }
    },
  },
}).catch((error) => {
  // This ensures this entrypoint is only loaded on Inertia pages
  // by checking for the presence of the root element (#app by default).
  // Feel free to remove this `catch` if you don't need it.
  if (document.getElementById('app')) {
    throw error
  } else {
    console.error(
      'Missing root element.\n\n' +
        'If you see this error, it probably means you loaded Inertia.js on non-Inertia pages.\n' +
        'Consider moving <%= vite_typescript_tag "inertia.tsx" %> to the Inertia-specific layout instead.',
    )
  }
})
