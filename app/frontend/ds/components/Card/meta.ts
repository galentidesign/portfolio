import type { ComponentMeta } from '../componentMeta'

export const meta = {
  slug: 'card',
  name: 'Card',
  tier: 'gallery',
  description: 'Container for content with optional header, footer, and link affordance.',
  variants: {
    // flush and interactive are states, not variant axes
  },
  props: [
    {
      name: 'title',
      type: 'string',
      description:
        'Styled row content, deliberately not a heading — consumers add their own heading semantics in children.',
    },
    {
      name: 'href',
      type: 'string',
      description: 'When provided, renders the entire card as a single <a> block link.',
    },
    {
      name: 'flush',
      type: 'boolean',
      default: 'false',
      description: 'Removes inner padding for media/table cards.',
    },
    {
      name: 'footer',
      type: 'ReactNode',
      description: 'Footer content, rendered with border-top separation.',
    },
    {
      name: 'children',
      type: 'ReactNode',
      description: 'Main card content.',
    },
    {
      name: 'ref',
      type: 'Ref<HTMLDivElement | HTMLAnchorElement>',
      description: 'Forwarded to the root element.',
    },
  ],
} as const satisfies ComponentMeta
