import type { ComponentMeta } from '../componentMeta'

export const meta = {
  slug: 'skeleton',
  name: 'Skeleton / Loading',
  tier: 'gallery',
  description: 'Shimmering placeholder shapes for content that is still loading.',
  variants: {
    shape: ['text', 'block', 'circle'],
  },
  props: [
    {
      name: 'shape',
      type: "'text' | 'block' | 'circle'",
      default: "'text'",
      description: 'Shape of the loading placeholder.',
    },
    {
      name: 'lines',
      type: 'number',
      default: '3',
      description: 'Number of text bars to render (text shape only). Last line is 60% width.',
    },
    {
      name: 'width',
      type: 'string',
      description:
        "CSS length for block/circle; circle uses it for both dimensions. Defaults to '100%' for block and '3rem' for circle.",
    },
    {
      name: 'height',
      type: 'string',
      default: "'6rem'",
      description: 'CSS length for block height only.',
    },
  ],
} as const satisfies ComponentMeta
