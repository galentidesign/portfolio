import type { ComponentMeta } from '../componentMeta'

export const meta = {
  slug: 'skin-switcher',
  name: 'Skin Switcher',
  tier: 'gallery',
  description:
    'Segmented radio group that switches the active skin. Consumes useSkin() from the SkinProvider context; hidden skins never render.',
  variants: {/* no variant axes — a single segmented look driven by context state */},
  props: [
    {
      name: 'legend',
      type: 'string',
      default: "'Skin'",
      description: 'Visually-hidden group label announced to assistive technology.',
    },
  ],
} as const satisfies ComponentMeta
