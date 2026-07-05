import type { ComponentMeta } from '../componentMeta'

export const meta = {
  slug: 'prose',
  name: 'Prose',
  tier: 'gallery',
  description: 'Typographic container for long-form content.',
  /* No variants */
  variants: {},
  props: [
    {
      name: 'children',
      type: 'ReactNode',
      description: 'Long-form content with semantic HTML (h1–h3, p, ul/ol, blockquote, pre, hr).',
    },
    {
      name: 'ref',
      type: 'Ref<HTMLDivElement>',
      description: 'Forwarded to the root container div.',
    },
  ],
} as const satisfies ComponentMeta
