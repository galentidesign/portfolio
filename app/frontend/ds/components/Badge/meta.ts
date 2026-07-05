import type { ComponentMeta } from '../componentMeta'

export const meta = {
  slug: 'badge',
  name: 'Badge / Tag',
  tier: 'gallery',
  description: 'Labels and status indicators at two sizes.',
  variants: {
    tone: ['neutral', 'accent', 'positive', 'caution', 'critical'],
    size: ['sm', 'md'],
  },
  props: [
    {
      name: 'tone',
      type: "'neutral' | 'accent' | 'positive' | 'caution' | 'critical'",
      default: "'neutral'",
      description: 'Color tone — each pairs a verified WCAG-compliant ink and surface.',
    },
    {
      name: 'size',
      type: "'sm' | 'md'",
      default: "'md'",
      description: 'Badge size — sm reduces padding-inline and padding-block.',
    },
    {
      name: 'children',
      type: 'ReactNode',
      description: 'Badge content.',
    },
  ],
} as const satisfies ComponentMeta
